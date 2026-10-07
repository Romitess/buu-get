import Joi from 'joi';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DB_TYPE: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  JWT_SECRET: string;
  // Moodle host (เลือกใช้ PRIVATE_IP สำหรับ server→server)
  MOODLE_PRIVATE_IP?: string;
  MOODLE_PUBLIC_IP?: string;
  MOODLE_HOST_IP?: string;
  MOODLE_NAME?: string;
  MOODLE_USER?: string;
  MOODLE_PASSWORD?: string;
  MOODLE_WS_TOKEN?: string;
  /** scheme ที่ใช้เรียก Moodle (default http) */
  MOODLE_SCHEME?: string;
  MOODLE_COURSE_CATEGORY_ID?: number;
  MOODLE_STUDENT_ROLEID?: number;
  /** comma-separated allowed CORS origins; empty = reflect request origin in dev only */
  CORS_ORIGINS?: string;
  /** origin ของ frontend สำหรับ redirect หลัง ThaiD callback (local split-port) */
  FRONTEND_URL?: string;
  /** sandbox (ค่าเริ่มต้น) หรือ production — จับคู่โฮสต์กับ callback คนละชุด */
  THAID_ENV?: 'sandbox' | 'production';
  /** override issuer; ว่างแล้วใช้โฮสต์ตาม THAID_ENV */
  THAID_ISSUER?: string;
  THAID_CLIENT_ID?: string;
  THAID_CLIENT_SECRET?: string;
  /** override redirect URI ที่ลงทะเบียนไว้; ว่างแล้วใช้ callback ตาม THAID_ENV */
  THAID_REDIRECT_URI?: string;
  THAID_VERIFY_TYPE?: 'pin' | 'face' | 'pin_face';
  /** default JSON/urlencoded body limit (e.g. 1mb) */
  BODY_LIMIT?: string;
  /** larger limit for file upload routes (e.g. 50mb) */
  UPLOAD_BODY_LIMIT?: string;
  /** Payment path: csv | mock | realtime_bank */
  PAYMENT_MODE: 'csv' | 'mock' | 'realtime_bank';
  /** Bank callback credentials (mock / realtime) */
  BANK_API_USER?: string;
  BANK_API_PASSWORD?: string;
  BANK_TAX_ID?: string;
  BANK_SUFFIX?: string;
  BANK_COM_CODE?: string;
  BANK_PROD_CODE?: string;
  /** Kong ldap.loginBuu (optional — required when calling loginBuu) */
  BUU_LOGIN_BUU_PATH?: string;
  BUU_LOGIN_BUU_PROVISION_KEY?: string;
  BUU_LOGIN_BUU_SCOPE?: string;
  BUU_LOGIN_BUU_SECRET?: string;
  /** Public certificate e-sign (ไม่มีรูปลายเซ็น) — ต้องเป็น true ถึงจะเรียก */
  BUU_ESIGN_PUBLIC_CERT_ENABLED?: string;
  BUU_ESIGN_PUBLIC_CERT_PATH?: string;
  BUU_ESIGN_PUBLIC_CERT_PROVISION_KEY?: string;
  BUU_ESIGN_PUBLIC_CERT_SCOPE?: string;
  BUU_ESIGN_PUBLIC_CERT_KEY_ACCESS?: string;
  /** Graylog GELF — empty/unset disables shipping (console + MySQL only) */
  GRAYLOG_HOST?: string;
  GRAYLOG_PORT?: number;
  GRAYLOG_FACILITY?: string;
  /** tcp (default, GELF TCP + null delimiter), udp, or http — must match Graylog Input */
  GRAYLOG_PROTOCOL?: 'udp' | 'tcp' | 'http';
  /** Log every GELF ship to Nest console when true */
  GRAYLOG_DEBUG?: string;
}

const envSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DB_TYPE: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  // Moodle Web Service (optional ที่ boot — service จะ getOrThrow ตอนเรียกจริง)
  MOODLE_PRIVATE_IP: Joi.string().optional(),
  MOODLE_PUBLIC_IP: Joi.string().optional(),
  MOODLE_HOST_IP: Joi.string().optional(),
  MOODLE_NAME: Joi.string().optional(),
  MOODLE_USER: Joi.string().optional(),
  MOODLE_PASSWORD: Joi.string().optional(),
  MOODLE_WS_TOKEN: Joi.string().optional(),
  MOODLE_SCHEME: Joi.string().valid('http', 'https').optional(),
  MOODLE_COURSE_CATEGORY_ID: Joi.number().optional(),
  MOODLE_STUDENT_ROLEID: Joi.number().optional(),
  CORS_ORIGINS: Joi.string().optional(),
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  THAID_ENV: Joi.string().valid('sandbox', 'production').default('sandbox'),
  THAID_ISSUER: Joi.string()
    .uri({ scheme: ['https'] })
    .optional(),
  THAID_CLIENT_ID: Joi.string().allow('').optional(),
  THAID_CLIENT_SECRET: Joi.string().allow('').optional(),
  THAID_REDIRECT_URI: Joi.string()
    .uri({ scheme: ['https'] })
    .optional(),
  THAID_VERIFY_TYPE: Joi.string()
    .valid('pin', 'face', 'pin_face')
    .default('pin'),
  BODY_LIMIT: Joi.string().default('1mb'),
  UPLOAD_BODY_LIMIT: Joi.string().default('50mb'),
  PAYMENT_MODE: Joi.string()
    .valid('csv', 'mock', 'realtime_bank')
    .default('csv'),
  BANK_API_USER: Joi.string().optional(),
  BANK_API_PASSWORD: Joi.string().optional(),
  BANK_TAX_ID: Joi.string().optional(),
  BANK_SUFFIX: Joi.string().optional(),
  BANK_COM_CODE: Joi.string().optional(),
  BANK_PROD_CODE: Joi.string().optional(),
  BUU_LOGIN_BUU_PATH: Joi.string().optional(),
  BUU_LOGIN_BUU_PROVISION_KEY: Joi.string().optional(),
  BUU_LOGIN_BUU_SCOPE: Joi.string().optional(),
  BUU_LOGIN_BUU_SECRET: Joi.string().valid('true', 'false').optional(),
  BUU_ESIGN_PUBLIC_CERT_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('false'),
  BUU_ESIGN_PUBLIC_CERT_PATH: Joi.string().optional(),
  BUU_ESIGN_PUBLIC_CERT_PROVISION_KEY: Joi.string().allow('').optional(),
  BUU_ESIGN_PUBLIC_CERT_SCOPE: Joi.string().optional(),
  BUU_ESIGN_PUBLIC_CERT_KEY_ACCESS: Joi.string().allow('').optional(),
  GRAYLOG_HOST: Joi.string().allow('').optional(),
  GRAYLOG_PORT: Joi.number().port().default(12201),
  GRAYLOG_FACILITY: Joi.string().default('buuget'),
  GRAYLOG_PROTOCOL: Joi.string().valid('udp', 'tcp', 'http').default('tcp'),
  GRAYLOG_DEBUG: Joi.string().valid('true', 'false', '1', '0', '').optional(),
});

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validationResult: Joi.ValidationResult<EnvironmentVariables> =
    envSchema.validate(config, {
      abortEarly: false,
      allowUnknown: true,
      convert: true,
    });

  if (validationResult.error) {
    throw new Error(
      `Environment validation failed: ${validationResult.error.message}`,
    );
  }

  return validationResult.value;
}
