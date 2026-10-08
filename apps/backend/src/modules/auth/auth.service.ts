import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { LoginDto } from './dto/login.dto';
import { LoginBuuDto } from './dto/login-buu.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { RolesService } from '../roles/roles.service';
import { RoleEnum } from '../roles/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { UserImage } from '../user-image/entities/user-image.entity';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { resolveImageFolder } from '../platform-gateway/constants/image-category.config';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { MsgPersonsService } from '../msg-persons/msg-persons.service';
import { getOtpEmailTemplate } from './templates/otp-email.template';
import { MemberSessionCodesService } from 'src/common/services/member-session-codes.service';
import { parseThaidBirthdate } from '../thaid/thaid-jwt';
import {
  ThaidHandoffService,
  ThaidRegisterProof,
} from '../thaid/thaid-handoff.service';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';
import * as bcrypt from 'bcrypt';

export interface LoginResponse {
  accessToken: string;
  user: {
    id?: number;
    psnId?: string;
    actorType: 'user' | 'person';
    email: string;
    role: string;
    roles: string[];
    /** จาก PROFILE — ใช้ redirect หลัง login โดยไม่ต้องเรียก GET /auth/me ซ้ำ */
    remark?: string | null;
  };
}

export interface RegisterResponse {
  message: string;
  userId: number;
  accessToken?: string;
  user?: LoginResponse['user'];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly userProfileService: UserProfileService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly platformGatewayService: PlatformGatewayService,
    private readonly moodleSyncService: MoodleSyncService,
    private readonly msgPersonsService: MsgPersonsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly memberSessionCodesService: MemberSessionCodesService,
    private readonly thaidHandoff: ThaidHandoffService,
  ) {}

  /** แยกชื่อ-นามสกุลจาก fullname (fallback เป็น local-part ของอีเมล) สำหรับส่งให้ Moodle */
  private deriveName(
    fullName: string | undefined,
    email: string,
  ): { firstname: string; lastname: string } {
    const source = (fullName ?? '').trim();
    if (source) {
      const parts = source.split(/\s+/);
      if (parts.length >= 2) {
        return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
      }
      return { firstname: source, lastname: source };
    }
    const local = email.split('@')[0] || 'user';
    return { firstname: local, lastname: local };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('อีเมลนี้ถูกใช้งานในระบบแล้ว');
    }

    const otpCode = this.generateOtp();

    // Storing OTP in cache with 5 minutes (300,000 milliseconds) TTL
    await this.cacheManager.set(`otp_${email}`, otpCode, 300000);

    const htmlContent = getOtpEmailTemplate({ otpCode });
    const subject = `[BUU-GET] รหัส OTP: ${otpCode} (ยืนยันสมัครสมาชิก)`;

    try {
      await this.platformGatewayService.sendEmail(
        'BUU-GET',
        email,
        subject,
        htmlContent,
      );
      return { success: true };
    } catch (err: unknown) {
      this.logger.error(
        'Failed to send OTP email via platform gateway',
        err instanceof Error ? err.stack : undefined,
      );
      throw new BadRequestException(
        'ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง',
      );
    }
  }

  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message?: string }> {
    const storedOtp = await this.cacheManager.get<string>(`otp_${email}`);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException('รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    }

    // Delete the OTP after successful validation to prevent reuse
    await this.cacheManager.del(`otp_${email}`);

    return { success: true };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.USER_PASSWORD,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    // ดึง role ทั้งหมดที่ user มี (1 user มีได้หลาย role — ManyToMany)
    const roles = user.ROLES_ID?.map((r) => r.ROLE_NAME).filter(Boolean) ?? [];
    if (roles.length === 0) {
      roles.push(RoleEnum.CANDIDATE);
    }
    // role หลัก (ตัวแรก) — คงไว้เพื่อ backward compatibility กับ consumer เดิม
    const role = roles[0];

    const payload = {
      sub: user.USER_ID,
      email: user.USER_EMAIL,
      role: role,
      roles: roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.USER_ID,
        actorType: 'user' as const,
        email: user.USER_EMAIL,
        role: role,
        roles: roles,
        remark: user.PROFILE?.userRemark ?? null,
      },
    };
  }

  /**
   * Login ด้วยบัญชีมหาวิทยาลัย (Kong ldap.loginBuu) แล้ว map ไป MSG_T_PERSON
   * ออก JWT typ=person — ไม่สร้าง BUU_GET_T_USER
   */
  async loginBuu(loginBuuDto: LoginBuuDto): Promise<LoginResponse> {
    const loginResponse = await this.platformGatewayService.loginBuu(
      loginBuuDto.username,
      loginBuuDto.password,
    );

    if (
      !loginResponse ||
      loginResponse.status !== 'success' ||
      !loginResponse.result?.citizenid
    ) {
      throw new UnauthorizedException(
        loginResponse?.message ?? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      );
    }

    const citizenId = loginResponse.result.citizenid;
    const person = await this.msgPersonsService.findForLogin(
      citizenId,
      loginBuuDto.username,
    );

    if (!person) {
      throw new UnauthorizedException('ไม่พบบุคลากรในระบบ');
    }

    const roles = person.ROLES?.map((r) => r.ROLE_NAME).filter(Boolean) ?? [];
    if (roles.length === 0) {
      throw new UnauthorizedException('บัญชีบุคลากรยังไม่มีสิทธิ์ในระบบ');
    }

    const role = roles[0];
    const email = person.PSN_EMAIL_BUU ?? loginResponse.result.email ?? '';

    const payload = {
      typ: 'person' as const,
      sub: person.PSN_ID,
      email,
      role,
      roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        psnId: person.PSN_ID,
        actorType: 'person',
        email,
        role,
        roles,
        remark: null,
      },
    };
  }

  /**
   * บันทึกรูปโปรไฟล์ตอนสมัครสมาชิก
   * - ถ้าเป็น data URL (base64) → upload ไป /user_images/{userId}/ แล้วเก็บ path ที่ได้
   * - ถ้าเป็น path ธรรมดา → เก็บลง DB ตรง ๆ (backward compat)
   */
  private async persistRegisterProfileImage(
    profileImage: string | undefined,
    userId: number,
  ): Promise<void> {
    if (!profileImage) return;

    let imageUrl = profileImage;

    if (profileImage.startsWith('data:')) {
      const match = /^data:(image\/[\w.+-]+);base64,(.+)$/s.exec(profileImage);
      if (!match) {
        console.error('Invalid profileImage data URL on register');
        return;
      }
      const ext = match[1].split('/')[1] || 'jpg';
      const buffer = Buffer.from(match[2], 'base64');
      const folder = resolveImageFolder('user-image', userId);
      const result = (await this.platformGatewayService.uploadBuffer(
        buffer,
        `profile.${ext}`,
        { path: folder, bucket: 'buu-get.storage' },
      )) as { result?: string; filename?: string; path?: string } | undefined;
      const returned: string | undefined =
        result?.result || result?.filename || result?.path;
      if (typeof returned !== 'string' || !returned) {
        console.error('uploadBuffer returned no path on register');
        return;
      }
      imageUrl = returned;
    }

    const repo = this.dataSource.getRepository(UserImage);
    await repo.save(repo.create({ USER_ID: userId, USER_IMAGE_URL: imageUrl }));
  }

  /** ตรวจตั๋ว ThaID ก่อนเปิดทรานแซกชันสมัคร ตัวตนมาจากตั๋ว ไม่ใช้ค่าจากเบราว์เซอร์ */
  private async resolveThaidRegistrationProof(
    registerDto: RegisterDto,
  ): Promise<{ token: string; proof: ThaidRegisterProof } | null> {
    const token = registerDto.thaidRegistrationToken?.trim();
    if (!token) {
      return null;
    }
    const proof = await this.thaidHandoff.peekRegisterProof(token);
    if (!proof) {
      throw new BadRequestException('ข้อมูลยืนยัน ThaID หมดอายุหรือไม่ถูกต้อง');
    }
    return { token, proof };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const email = registerDto.email.trim().toLowerCase();
    const thaidRegistration =
      await this.resolveThaidRegistrationProof(registerDto);
    const thaidProof = thaidRegistration?.proof ?? null;
    const thaidProofToken = thaidRegistration?.token ?? null;
    const userType = thaidProof ? 'thai' : registerDto.userType;
    const nationalId = thaidProof
      ? thaidProof.pid
      : registerDto.nationalId?.trim() || '';
    const titleTH = thaidProof ? thaidProof.titleTH : registerDto.titleTH;
    const titleEN = thaidProof ? thaidProof.titleEN : registerDto.titleEN;
    const fullName = thaidProof ? thaidProof.fullName : registerDto.fullName;
    const englishName = thaidProof
      ? thaidProof.englishName
      : registerDto.englishName;
    const address = thaidProof ? thaidProof.address : registerDto.address;
    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // ค้นหา role 'candidate' เพื่อกำหนดให้ผู้ใช้ใหม่
    const candidateRole = await this.rolesService.findByName(
      RoleEnum.CANDIDATE,
    );

    // ใช้ Transaction เพื่อให้ User + UserProfile สร้างพร้อมกัน หรือ rollback พร้อมกัน
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: สร้าง User
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { USER_EMAIL: email },
      });
      if (existingUser) {
        throw new BadRequestException('อีเมลนี้ถูกใช้งานแล้ว');
      }

      // ตรวจสอบเลขบัตรประชาชน / Passport ซ้ำ
      if (nationalId !== '') {
        const fieldToCheck =
          userType === 'thai' ? 'USER_NATIONAL_ID' : 'USER_PASSPORT_NO';
        const existingId = await queryRunner.manager.findOne(User, {
          where: { [fieldToCheck]: nationalId },
        });

        if (existingId) {
          const errorMsg =
            userType === 'thai'
              ? 'เลขบัตรประชาชนนี้ถูกใช้งานแล้ว'
              : 'Passport number already exists';
          throw new BadRequestException(errorMsg);
        }
      }

      // กำหนด Role ID 1 (ผู้สมัครสอบ) ให้กับผู้ใช้งานใหม่
      const roleToAssign =
        candidateRole ||
        (await queryRunner.manager.findOne(Role, { where: { ROLE_ID: 1 } }));

      const newUser = queryRunner.manager.create(User, {
        USER_EMAIL: email,
        USER_PASSWORD: hashedPassword,
        USER_STATUS: 'ACTIVE',
        USER_NATIONAL_ID:
          userType === 'thai' ? nationalId || undefined : undefined,
        USER_PASSPORT_NO:
          userType === 'foreigner' ? nationalId || undefined : undefined,
        ROLES_ID: roleToAssign ? [roleToAssign] : [],
      });

      const savedUser = await queryRunner.manager.save(newUser);
      savedUser.USER_CODE =
        await this.memberSessionCodesService.allocateUserCode(
          queryRunner.manager,
          {
            nationalId: savedUser.USER_NATIONAL_ID,
            passportNo: savedUser.USER_PASSPORT_NO,
            at: savedUser.CREATED_AT ?? new Date(),
          },
        );
      await queryRunner.manager.update(
        User,
        { USER_ID: savedUser.USER_ID },
        { USER_CODE: savedUser.USER_CODE },
      );

      // เตรียมวันที่เกิด (รองรับ format "2005 07 22" โดยเปลี่ยนเป็น "2005-07-22")
      let birthDate: Date | null = null;
      if (thaidProof) {
        birthDate = parseThaidBirthdate(thaidProof.birthdate);
      } else if (registerDto.birthdate) {
        const formattedDate = registerDto.birthdate.replace(/\s+/g, '-');
        birthDate = new Date(formattedDate);
        if (isNaN(birthDate.getTime())) {
          birthDate = null;
        }
      }

      // Step 2: สร้าง UserProfile ภายใน transaction
      const newUserProfile = queryRunner.manager.create(UserProfile, {
        userId: savedUser.USER_ID,
        userTitleTh: titleTH,
        userFullnameTh: fullName,
        userTitleEn: titleEN,
        userFullnameEn: englishName,
        userPhone: registerDto.phone,
        userDateOfBirth: birthDate,
        userEducation: registerDto.educationLevel,
        userFaculty: registerDto.faculty,
        userInstitution: registerDto.institution,
        userCountry: registerDto.country,
        userAddress: address?.trim() || null,
        userThaidSynced: thaidProof !== null,
        userRegisteredViaThaid: thaidProof !== null,
      });

      await queryRunner.manager.save(newUserProfile);

      // Step 3: สร้าง user ใน Moodle "ก่อน commit" — ถ้า Moodle ล้มเหลวจะ rollback ทั้งหมด (ไม่สร้าง user)
      // ใช้ queryRunner.manager เขียน moodle_sync_log ใน transaction เดียวกัน (FK USER_ID ยังไม่ commit)
      const { firstname, lastname } = this.deriveName(
        englishName || fullName,
        email,
      );
      const moodleIdnumber = nationalId || undefined;
      const moodleUserId = await this.moodleSyncService.createUser(
        {
          username: email,
          password: registerDto.password,
          firstname,
          lastname,
          email,
          ...(moodleIdnumber ? { idnumber: moodleIdnumber } : {}),
        },
        {
          userId: savedUser.USER_ID,
          refType: 'user',
          refId: savedUser.USER_ID,
        },
        queryRunner.manager,
      );
      await queryRunner.manager.update(
        User,
        { USER_ID: savedUser.USER_ID },
        { USER_MOODLE_ID: moodleUserId },
      );

      await queryRunner.commitTransaction();

      // บันทึกรูปโปรไฟล์ "หลัง commit" (มี userId แล้ว และไม่ค้าง transaction)
      // - data URL → upload จริงไป /user_images/{userId}/ ผ่าน gateway
      // - path ธรรมดา (เช่นจาก seed/mock) → เก็บตรง ๆ
      // รูปเป็น optional: ถ้า upload ล้มเหลว ไม่ทำให้การสมัครล้มเหลว
      try {
        await this.persistRegisterProfileImage(
          registerDto.profileImage,
          savedUser.USER_ID,
        );
      } catch (imgErr) {
        console.error('Failed to persist register profile image:', imgErr);
      }

      if (thaidProofToken) {
        try {
          await this.thaidHandoff.consumeRegisterProof(thaidProofToken);
        } catch (proofErr) {
          this.logger.warn('ThaID registration proof consume failed');
          console.error(proofErr);
        }
      }

      const response: RegisterResponse = {
        message: 'Registration successful',
        userId: savedUser.USER_ID,
      };
      if (thaidProof) {
        const roleName = roleToAssign?.ROLE_NAME || RoleEnum.CANDIDATE;
        response.accessToken = this.jwtService.sign({
          sub: savedUser.USER_ID,
          email,
          role: roleName,
          roles: [roleName],
        });
        response.user = {
          id: savedUser.USER_ID,
          actorType: 'user',
          email,
          role: roleName,
          roles: [roleName],
          remark: null,
        };
      }
      return response;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Registration error details:', error);
      const msg =
        error instanceof Error ? error.message : 'Unknown database error';
      throw new BadRequestException(msg);
    } finally {
      await queryRunner.release();
    }
  }

  async getProfile(authUser: AuthenticatedUser) {
    if (authUser.actorType === 'person') {
      return this.getPersonProfile(authUser);
    }

    if (authUser.userId == null) {
      throw new BadRequestException('User not found');
    }

    const user = await this.usersService.findById(authUser.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Map roles (1 user มีได้หลาย role) — role คือ primary (ตัวแรก) เพื่อ backward compatibility
    const roles = user.ROLES_ID?.map((r) => r.ROLE_NAME).filter(Boolean) ?? [];
    if (roles.length === 0) {
      roles.push(RoleEnum.CANDIDATE);
    }
    const role = roles[0];

    // Map profile fields to match frontend User interface
    return {
      id: user.USER_ID,
      actorType: 'user' as const,
      userCode: user.USER_CODE,
      email: user.USER_EMAIL,
      nationalId: user.USER_NATIONAL_ID,
      passportNo: user.USER_PASSPORT_NO,
      status: user.USER_STATUS,
      role: role,
      roles: roles,
      // Profile data (Flattened)
      titleTH: user.PROFILE?.userTitleTh || '',
      fullNameTH: user.PROFILE?.userFullnameTh || '',
      titleEN: user.PROFILE?.userTitleEn || '',
      fullNameEN: user.PROFILE?.userFullnameEn || '',
      birthdate: user.PROFILE?.userDateOfBirth || '',
      phone: user.PROFILE?.userPhone || '',
      educationLevel: user.PROFILE?.userEducation || '',
      country: user.PROFILE?.userCountry || '',
      address: user.PROFILE?.userAddress || '',
      faculty: user.PROFILE?.userFaculty || '',
      institution: user.PROFILE?.userInstitution || '',
      thaidSynced: user.PROFILE?.userThaidSynced || false,
      registeredViaThaid: user.PROFILE?.userRegisteredViaThaid || false,
      remark: user.PROFILE?.userRemark || '',
      userImagePath: user.IMAGE?.USER_IMAGE_URL || null,
    };
  }

  private async getPersonProfile(authUser: AuthenticatedUser) {
    const psnId = authUser.personId;
    if (!psnId) {
      throw new UnauthorizedException('Invalid person session');
    }

    const person = await this.msgPersonsService.findEntityById(psnId);
    if (!person) {
      throw new UnauthorizedException('ไม่พบบุคลากรในระบบ');
    }

    const roles = person.ROLES?.map((r) => r.ROLE_NAME).filter(Boolean) ?? [];
    if (roles.length === 0) {
      throw new UnauthorizedException('บัญชีบุคลากรยังไม่มีสิทธิ์ในระบบ');
    }

    const fullNameTH = [person.PSN_FNAMETH, person.PSN_LNAMETH]
      .filter(Boolean)
      .join(' ')
      .trim();
    const fullNameEN = [person.PSN_FNAMEEN, person.PSN_LNAMEEN]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      psnId: person.PSN_ID,
      actorType: 'person' as const,
      email: person.PSN_EMAIL_BUU ?? authUser.email,
      nationalId: person.PSN_IDCARD,
      passportNo: null,
      status: person.PSN_RETIRE === 'N' ? 'ACTIVE' : 'INACTIVE',
      role: roles[0],
      roles,
      titleTH: person.PRF_NAMETH || '',
      fullNameTH,
      titleEN: person.PRF_NAMEEN || '',
      fullNameEN,
      birthdate: '',
      phone: '',
      educationLevel: '',
      country: '',
      address: '',
      faculty: '',
      institution: '',
      thaidSynced: false,
      registeredViaThaid: false,
      remark: '',
      userImagePath: null,
    };
  }
}
