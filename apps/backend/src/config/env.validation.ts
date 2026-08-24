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
  /** default JSON/urlencoded body limit (e.g. 1mb) */
  BODY_LIMIT?: string;
  /** larger limit for file upload routes (e.g. 50mb) */
  UPLOAD_BODY_LIMIT?: string;
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
  BODY_LIMIT: Joi.string().default('1mb'),
  UPLOAD_BODY_LIMIT: Joi.string().default('50mb'),
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
