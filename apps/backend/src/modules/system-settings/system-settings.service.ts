import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  getSettingDefinition,
  SYSTEM_SETTINGS_CATALOG,
  type SystemSettingDefinition,
  type SystemSettingKey,
} from './constants/system-settings.catalog';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingAuditLog } from './entities/system-setting-audit-log.entity';
import {
  SystemSettingItemDto,
  UpdateSystemSettingItemDto,
} from './dto/system-settings.dto';

const TIME_HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_SIMPLE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXAM_DEFAULT_TYPES = new Set(['รอบทั่วไป', 'รอบพิเศษ']);
const EXAM_DEFAULT_FORMATS = new Set(['คอมพิวเตอร์', 'กระดาษ']);

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private cache: Map<string, string> | null = null;

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepository: Repository<SystemSetting>,
    @InjectRepository(SystemSettingAuditLog)
    private readonly auditRepository: Repository<SystemSettingAuditLog>,
    private readonly dataSource: DataSource,
  ) {}

  private invalidateCache(): void {
    this.cache = null;
  }

  private async loadCache(): Promise<Map<string, string>> {
    if (this.cache) {
      return this.cache;
    }

    const rows = await this.settingsRepository.find();
    const map = new Map<string, string>();
    for (const def of SYSTEM_SETTINGS_CATALOG) {
      map.set(def.key, def.defaultValue);
    }
    for (const row of rows) {
      map.set(row.SETTING_KEY, row.SETTING_VALUE);
    }
    this.cache = map;
    return map;
  }

  async getString(key: SystemSettingKey): Promise<string> {
    const cache = await this.loadCache();
    const def = getSettingDefinition(key);
    return cache.get(key) ?? def?.defaultValue ?? '';
  }

  async getNumber(key: SystemSettingKey): Promise<number> {
    const raw = await this.getString(key);
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      const def = getSettingDefinition(key);
      return Number(def?.defaultValue ?? 0);
    }
    return num;
  }

  async getInteger(key: SystemSettingKey): Promise<number> {
    return Math.trunc(await this.getNumber(key));
  }

  async findAll(options?: {
    staffReadableOnly?: boolean;
  }): Promise<SystemSettingItemDto[]> {
    const rows = await this.settingsRepository.find();
    const byKey = new Map(rows.map((r) => [r.SETTING_KEY, r]));

    return SYSTEM_SETTINGS_CATALOG.filter((def) =>
      options?.staffReadableOnly ? def.readableByStaff : true,
    ).map((def) => this.toItemDto(def, byKey.get(def.key)));
  }

  async updateMany(
    items: UpdateSystemSettingItemDto[],
    actorUserId: number,
  ): Promise<SystemSettingItemDto[]> {
    const normalized = items.map((item) => ({
      key: item.key,
      value: this.validateAndNormalize(item.key, item.value),
    }));

    await this.dataSource.transaction(async (manager) => {
      const settingsRepo = manager.getRepository(SystemSetting);
      const auditRepo = manager.getRepository(SystemSettingAuditLog);

      const keys = normalized.map((i) => i.key);
      const existing = await settingsRepo.find({
        where: { SETTING_KEY: In(keys) },
      });
      const existingByKey = new Map(existing.map((r) => [r.SETTING_KEY, r]));

      for (const item of normalized) {
        const def = getSettingDefinition(item.key);
        if (!def) {
          throw new BadRequestException(`Unknown setting key: ${item.key}`);
        }

        const current = existingByKey.get(item.key);
        const oldValue = current?.SETTING_VALUE ?? def.defaultValue;

        if (current) {
          current.SETTING_VALUE = item.value;
          current.UPDATED_BY = actorUserId;
          await settingsRepo.save(current);
        } else {
          const created = settingsRepo.create({
            SETTING_KEY: def.key,
            SETTING_GROUP: def.group,
            SETTING_VALUE: item.value,
            SETTING_TYPE: def.type,
            UPDATED_BY: actorUserId,
          });
          await settingsRepo.save(created);
        }

        if (oldValue !== item.value) {
          await auditRepo.save(
            auditRepo.create({
              SETTING_KEY: item.key,
              OLD_VALUE: oldValue,
              NEW_VALUE: item.value,
              ACTOR_USER_ID: actorUserId,
            }),
          );
        }
      }
    });

    this.invalidateCache();
    this.logger.log(
      `Updated ${normalized.length} system setting(s) by USER_ID=${actorUserId}`,
    );

    return this.findAll();
  }

  private toItemDto(
    def: SystemSettingDefinition,
    row?: SystemSetting,
  ): SystemSettingItemDto {
    return {
      key: def.key,
      group: def.group,
      type: def.type,
      value: row?.SETTING_VALUE ?? def.defaultValue,
      defaultValue: def.defaultValue,
      descriptionTh: def.descriptionTh,
      updatedBy: row?.UPDATED_BY ?? null,
      updatedAt: row?.UPDATED_AT?.toISOString() ?? null,
    };
  }

  private validateAndNormalize(key: string, rawValue: string): string {
    const def = getSettingDefinition(key);
    if (!def) {
      throw new BadRequestException(`Unknown setting key: ${key}`);
    }

    const value = rawValue.trim();
    if (value.length === 0) {
      throw new BadRequestException(`${key} must not be empty`);
    }

    if (def.maxLength != null && value.length > def.maxLength) {
      throw new BadRequestException(
        `${key} must be at most ${def.maxLength} characters`,
      );
    }

    switch (def.type) {
      case 'integer': {
        if (!/^-?\d+$/.test(value)) {
          throw new BadRequestException(`${key} must be an integer`);
        }
        const num = Number(value);
        this.assertRange(key, num, def);
        return String(Math.trunc(num));
      }
      case 'number': {
        const num = Number(value);
        if (!Number.isFinite(num)) {
          throw new BadRequestException(`${key} must be a number`);
        }
        this.assertRange(key, num, def);
        return String(num);
      }
      case 'boolean': {
        if (value !== 'true' && value !== 'false') {
          throw new BadRequestException(`${key} must be true or false`);
        }
        return value;
      }
      case 'string':
      default: {
        if (key === 'exam.defaultType' && !EXAM_DEFAULT_TYPES.has(value)) {
          throw new BadRequestException(
            `${key} must be one of: รอบทั่วไป, รอบพิเศษ`,
          );
        }
        if (key === 'exam.defaultFormat' && !EXAM_DEFAULT_FORMATS.has(value)) {
          throw new BadRequestException(
            `${key} must be one of: คอมพิวเตอร์, กระดาษ`,
          );
        }
        if (
          key === 'exam.defaultSessionStart' ||
          key === 'exam.defaultSessionEnd'
        ) {
          if (!TIME_HH_MM.test(value)) {
            throw new BadRequestException(`${key} must be HH:mm`);
          }
        }
        if (key === 'org.supportEmail' && !EMAIL_SIMPLE.test(value)) {
          throw new BadRequestException(`${key} must be a valid email`);
        }
        if (key === 'org.taxId' && !/^\d{13}$/.test(value)) {
          throw new BadRequestException(`${key} must be 13 digits`);
        }
        return value;
      }
    }
  }

  private assertRange(
    key: string,
    num: number,
    def: SystemSettingDefinition,
  ): void {
    if (def.min != null && num < def.min) {
      throw new BadRequestException(`${key} must be >= ${def.min}`);
    }
    if (def.max != null && num > def.max) {
      throw new BadRequestException(`${key} must be <= ${def.max}`);
    }
  }
}
