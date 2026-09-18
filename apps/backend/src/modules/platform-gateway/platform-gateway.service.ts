import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';
import ApiToken from 'src/types/api/apiToken';
import RequestTokenApiConfig from 'src/types/api/requestTokenApiConfig';
import LoginBuuApiConfig from 'src/types/api/loginBuuApiConfig';
import { v4 as uuidv4 } from 'uuid';
import { unlink, createReadStream } from 'fs';
import { promisify } from 'util';
import {
  UploadFileDto,
  UploadCertificateFileDto,
} from 'src/types/api/uploadFile';
import {
  ImageCategory,
  isImageCategory,
  resolveImageFolder,
} from './constants/image-category.config';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { SYSTEM_SETTING_KEYS } from '../system-settings/constants/system-settings.catalog';

export interface LoginBuuResult {
  fullname: string;
  email: string;
  facultyname: string;
  citizenid: string;
}

export interface LoginBuuGatewayResponse {
  status: 'success' | 'fail' | string;
  message?: string;
  result?: LoginBuuResult;
}

@Injectable()
export class PlatformGatewayService {
  private readonly logger = new Logger(PlatformGatewayService.name);
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  private async resolveEmailSenderName(fallback: string): Promise<string> {
    try {
      const configured = await this.systemSettingsService.getString(
        SYSTEM_SETTING_KEYS.EMAIL_SENDER_NAME,
      );
      if (configured.trim()) {
        return configured.trim();
      }
    } catch {
      // keep caller fallback
    }
    return fallback;
  }

  private getDomain(): string {
    const domain = this.configService.get<string>('domain');
    if (!domain) {
      throw new Error('Config "domain" is not defined');
    }
    return domain;
  }

  private getNotiEndpoint(): string {
    const noti = this.configService.get<string>('noti');
    return typeof noti === 'string' ? noti : '';
  }

  private getApiConfig(apiName: string): any {
    const config = this.configService.get<any>(apiName);
    if (!config) {
      throw new Error(`API configuration "${apiName}" is not defined`);
    }
    return config;
  }

  private getRequestTokenConfig(): RequestTokenApiConfig {
    const config =
      this.configService.get<RequestTokenApiConfig>('requestTokenAPI');
    if (!config) {
      throw new Error('Config "requestTokenAPI" is not defined');
    }
    return config;
  }

  private getLoginBuuApiConfig(): LoginBuuApiConfig {
    const config = this.configService.get<LoginBuuApiConfig>('loginBuu');
    if (!config) {
      throw new Error('Config "loginBuu" is not defined');
    }
    return config;
  }

  async postApi(apiName: string, data?: Record<string, unknown>) {
    return this.makeApiRequest('post', 'postApi', apiName, data);
  }

  async getApi(apiName: string) {
    return this.makeApiRequest('get', 'getApi', apiName);
  }

  async deleteApi(apiName: string, data?: Record<string, unknown>) {
    return this.makeApiRequest('delete', 'deleteApi', apiName, data);
  }

  async makeApiRequest(
    method: string,
    funcName: string,
    apiName: string,
    data?: Record<string, unknown>,
    retried = false,
  ): Promise<AxiosResponse> {
    let apiConfig: { path: string; provision_key?: string; scope?: string };
    let requestData = data;

    if (apiName === 'loginBuu') {
      const loginBuuConfig = this.getLoginBuuApiConfig();
      apiConfig = loginBuuConfig;
      requestData = {
        ...(data ?? {}),
        secret: loginBuuConfig.secret,
      };
    } else {
      apiConfig = this.getApiConfig(apiName);
    }

    const cacheToken = await this.getCacheToken(apiName);
    const url = `${this.getDomain()}${apiConfig.path}`;
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${cacheToken.access_token}`,
      'x-forwarded-proto': 'https',
      'Content-Type': 'application/json',
    };

    try {
      let response: AxiosResponse;
      // Log debug: API name, method and a preview of the payload (send_message length if available)
      // Never log password / secret values
      if (requestData && typeof requestData.send_message === 'string') {
        this.logger?.log?.(
          `📤 Sending ${apiName} with send_message length: ${String(
            requestData.send_message.length,
          )}`,
        );
      } else {
        const keys = Object.keys(requestData || {}).filter(
          (key) => key !== 'password' && key !== 'secret',
        );
        this.logger?.log?.(
          `📤 Sending ${apiName} payload keys: ${keys.join(', ')}`,
        );
      }

      switch (method) {
        case 'post':
          response = await axios.post(url, requestData, {
            headers,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 120000,
          });
          break;
        case 'get':
          response = await axios.get(url, { headers, timeout: 120000 });
          break;
        case 'delete':
          response = await axios.delete(url, {
            headers,
            data: requestData,
            timeout: 120000,
          });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      // Log response body for 500 to help debug (ฝั่ง server เท่านั้น)
      try {
        const status = axiosError.response?.status;
        const body = this.maskSensitiveData(axiosError.response?.data);
        this.logger?.error?.(
          `❌ API ${apiName} returned status ${status}. Body: ${JSON.stringify(body)}`,
        );
      } catch {
        // ignore
      }

      // 401 / invalid_token → refresh แล้ว retry ครั้งเดียว (กัน loop ด้วย flag retried)
      const upstreamError = (
        axiosError.response?.data as { error?: string } | undefined
      )?.error;
      if (
        !retried &&
        (upstreamError === 'invalid_token' ||
          axiosError.response?.status === 401)
      ) {
        this.logger.log(`redo ${funcName} for ${apiName}`);
        await this.refreshToken(apiName);
        return this.makeApiRequest(
          method,
          funcName,
          apiName,
          requestData,
          true,
        );
      }

      return this.handleApiError(apiName, error, funcName);
    }
  }

  async getCacheToken(apiName: string): Promise<ApiToken> {
    let cacheToken = await this.cacheManager.get<ApiToken>(
      `${apiName}_apiToken`,
    );
    if (!cacheToken) {
      await this.requestToken(apiName);
      cacheToken = await this.cacheManager.get<ApiToken>(`${apiName}_apiToken`);
    }
    if (!cacheToken) {
      throw new Error(`Unable to retrieve API token for ${apiName}`);
    }
    return cacheToken;
  }

  private normalizeProvisionKey(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    let key = value.trim();
    const quote = key[0];
    if (
      key.length >= 2 &&
      (quote === '"' || quote === "'") &&
      key.endsWith(quote)
    ) {
      key = key.slice(1, -1).trim();
    }
    return key;
  }

  private buildOAuthForm(fields: Record<string, string>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== '') {
        params.set(key, value);
      }
    }
    return params;
  }

  private oauthTokenRequestHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-forwarded-proto': 'https',
    };
  }

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sensitiveKeys = [
      'password',
      'client_secret',
      'refresh_token',
      'secret',
      'confirmPassword',
      'oldPassword',
      'provision_key',
      'access_token',
    ];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        if (
          sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))
        ) {
          sanitized[key] = '***MASKED***';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.maskSensitiveData(sanitized[key]);
        }
      }
    }
    return sanitized;
  }

  /**
   * แปลง error จาก upstream (Kong gateway) เป็น HttpException มาตรฐาน แล้ว throw
   * - แจ้งเตือน (sendNoti) ฝั่ง server ครั้งเดียว
   * - ไม่ forward upstream error body (อาจมี internal detail) ให้ client — คืนเฉพาะข้อความกลาง ๆ
   * - คง HTTP status ต้นทางไว้ถ้าเป็น 4xx/5xx ที่ใช้ได้ ไม่งั้นตอบ 502 Bad Gateway
   */
  async handleApiError(
    apiName: string,
    error: unknown,
    hop = 'upstream',
  ): Promise<never> {
    const axiosError = error as AxiosError;
    const message = axiosError?.message ?? String(error);
    const status = axiosError?.response?.status;
    let bodyPreview = '';
    try {
      bodyPreview = JSON.stringify(
        this.maskSensitiveData(axiosError?.response?.data),
      );
    } catch {
      bodyPreview = '[unserializable]';
    }
    this.logger.error(
      `${hop} ${apiName} failed status=${status ?? 'n/a'} body=${bodyPreview}`,
    );
    await this.sendNoti(`${this.getNotiEndpoint()}${apiName}: ${message}`);

    const httpStatus =
      typeof status === 'number' && status >= 400 && status < 600
        ? status
        : HttpStatus.BAD_GATEWAY;

    throw new HttpException(
      {
        statusCode: httpStatus,
        message: `Upstream API "${apiName}" request failed`,
        error: 'Bad Gateway',
      },
      httpStatus,
    );
  }

  private resolveTokenTtlMs(
    token: { expires_in?: number } | null | undefined,
  ): number {
    const DEFAULT_EXPIRES_IN_SEC = 3600;
    const SKEW_SEC = 60;
    const expiresInSec =
      typeof token?.expires_in === 'number' && token.expires_in > 0
        ? token.expires_in
        : DEFAULT_EXPIRES_IN_SEC;
    return Math.max(1000, (expiresInSec - SKEW_SEC) * 1000);
  }

  async refreshToken(apiName: string) {
    try {
      console.log('refreshToken');
      const cacheToken = await this.cacheManager.get<ApiToken>(
        `${apiName}_apiToken`,
      );
      if (!cacheToken) {
        throw new Error(`No refresh token cached for ${apiName}`);
      }
      const requestTokenConfig = this.getRequestTokenConfig();
      const apiConfig = this.getApiConfig(apiName);

      const response = await axios.post(
        `${this.getDomain()}${apiConfig.path}${requestTokenConfig.path}`,
        this.buildOAuthForm({
          client_secret: requestTokenConfig.client_secret,
          client_id: requestTokenConfig.client_id,
          grant_type: 'refresh_token',
          refresh_token: cacheToken.refresh_token,
        }),
        {
          timeout: 120000,
          headers: this.oauthTokenRequestHeaders(),
        },
      );

      await this.cacheManager.set(
        `${apiName}_apiToken`,
        response.data,
        this.resolveTokenTtlMs(response.data),
      );
    } catch (error) {
      return this.handleApiError(apiName, error, 'refreshToken');
    }
  }

  async requestToken(apiName: string) {
    try {
      this.logger.log(`requestToken ${apiName}`);
      const requestTokenConfig = this.getRequestTokenConfig();
      const apiConfig = this.getApiConfig(apiName);
      const provisionKey = this.normalizeProvisionKey(apiConfig.provision_key);
      if (!provisionKey) {
        const hint =
          apiName === 'loginBuu'
            ? 'BUU_LOGIN_BUU_PROVISION_KEY is not set'
            : `provision_key for "${apiName}" is not set`;
        this.logger.error(`requestToken ${apiName}: ${hint}`);
        throw new ServiceUnavailableException(hint);
      }

      // Kong OAuth2 plugin rejects JSON token bodies with HTTP 400.
      const response = await axios.post(
        `${this.getDomain()}${apiConfig.path}${requestTokenConfig.path}`,
        this.buildOAuthForm({
          client_secret: requestTokenConfig.client_secret,
          client_id: requestTokenConfig.client_id,
          grant_type: requestTokenConfig.grant_type,
          scope: typeof apiConfig.scope === 'string' ? apiConfig.scope : '',
          provision_key: provisionKey,
          authenticated_userid: requestTokenConfig.authenticated_userid,
        }),
        {
          timeout: 120000,
          headers: this.oauthTokenRequestHeaders(),
        },
      );

      await this.cacheManager.set(
        `${apiName}_apiToken`,
        response.data,
        this.resolveTokenTtlMs(response.data),
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return this.handleApiError(apiName, error, 'requestToken');
    }
  }

  // loginBuu ใช้สำหรับตรวจสอบ username และ password กับระบบของมหาวิทยาลัยบูรพา
  async loginBuu(
    username: string,
    password: string,
  ): Promise<LoginBuuGatewayResponse> {
    const apiName = 'loginBuu';
    const data: Record<string, unknown> = {
      username,
      password,
    };
    try {
      const response = await this.postApi(apiName, data);
      /**
       * success:
       * { status: "success", result: { fullname, email, facultyname, citizenid } }
       * fail:
       * { status: "fail", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }
       */
      const body = (response.data ?? response) as LoginBuuGatewayResponse;
      return body;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error in ${apiName}: ${message}`);
      throw new BadGatewayException(
        'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนของมหาวิทยาลัยได้',
      );
    }
  }

  async sendEmail(
    system: string,
    to: string,
    subject: string,
    message: string,
  ) {
    const apiName = 'sendEmail';
    const sendSystem = await this.resolveEmailSenderName(system);
    const data = {
      send_system: sendSystem,
      send_to:
        process.env.AUTOMATE_TEST_MODE == 'true'
          ? 'jutamas.lu@go.buu.ac.th'
          : to,
      send_cc: process.env.AUTOMATE_TEST_MODE == 'true' ? '' : to,
      send_subject: subject,
      send_message: message,
    };
    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async sendEmailCC(
    system: string,
    to: string,
    cc: string,
    subject: string,
    message: string,
  ) {
    const apiName = 'sendEmail';
    const sendSystem = await this.resolveEmailSenderName(system);
    const data = {
      send_system: sendSystem,
      send_to:
        process.env.AUTOMATE_TEST_MODE == 'true'
          ? 'jutamas.lu@go.buu.ac.th'
          : to,
      send_cc: process.env.AUTOMATE_TEST_MODE == 'true' ? '' : cc,
      send_subject: subject,
      send_message: message,
    };
    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ): Promise<any> {
    const apiName = 'uploadFile';
    if (
      !uploadFileDto.path ||
      uploadFileDto.path === '' ||
      uploadFileDto.path === 'undefined' ||
      uploadFileDto.path === undefined
    ) {
      uploadFileDto.path = '/uploaded_files';
    }
    const apiConfig = this.getApiConfig(apiName);
    const cacheToken = await this.getCacheToken(apiName);
    const dataObj = this.constructFileData(file, uploadFileDto);
    try {
      dataObj.fileUpload = await this.readFile(file.path);
      const response = await this.uploadToApi(apiConfig, cacheToken, dataObj);
      await this.cleanupFile(file.path);
      return response.data;
    } catch (error) {
      return this.handleUploadError(
        error,
        dataObj,
        apiName,
        file,
        uploadFileDto,
      );
    }
  }

  /**
   * Upload รูปตามชนิด (category) โดยให้ registry เป็นผู้กำหนด folder ปลายทาง
   * - per-user category จะต่อท้ายด้วย /{userId}
   * - validate category กับ allow-list กัน write นอกขอบเขต
   */
  async uploadByCategory(
    category: string,
    file: Express.Multer.File,
    userId?: number,
  ): Promise<any> {
    if (!isImageCategory(category)) {
      throw new BadRequestException(`Unknown image category: ${category}`);
    }
    let folder: string;
    try {
      folder = resolveImageFolder(category as ImageCategory, userId);
    } catch {
      throw new BadRequestException(
        `Image category "${category}" requires an authenticated user`,
      );
    }
    return this.uploadFile(file, {
      path: folder,
      fileName: file.originalname,
    });
  }

  /**
   * Upload รูปจาก Buffer (ไม่มีไฟล์บนดิสก์) — ใช้ตอน register ที่ backend ถือ base64
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    uploadFileDto: UploadFileDto,
  ): Promise<any> {
    const apiName = 'uploadFile';
    const apiConfig = this.getApiConfig(apiName);
    const cacheToken = await this.getCacheToken(apiName);
    const dataObj = this.constructFileData(
      { filename: originalName } as Express.Multer.File,
      uploadFileDto,
    );
    dataObj.fileUpload = buffer;
    try {
      const response = await this.uploadToApi(apiConfig, cacheToken, dataObj);
      return response.data;
    } catch (error: any) {
      if (
        error.response?.data?.error === 'invalid_token' ||
        error.response?.status === 401
      ) {
        await this.refreshToken(apiName);
        const retryToken = await this.getCacheToken(apiName);
        const response = await this.uploadToApi(apiConfig, retryToken, dataObj);
        return response.data;
      }
      await this.sendNoti(
        `${this.getNotiEndpoint()}${apiName}: ${error.message}`,
      );
      throw error;
    }
  }

  // async uploadCertificate(
  //   file: Express.Multer.File,
  //   uploadCertificateDto: UploadCertificateFileDto,
  // ): Promise<any> {
  //   if (!uploadCertificateDto || !uploadCertificateDto.facId) {
  //     throw new Error('facId is required in UploadCertificateFileDto');
  //   }
  //   uploadCertificateDto.path = `/certificates/${uploadCertificateDto.facId}`;
  //   return this.uploadFile(file, uploadCertificateDto);
  // }

  constructFileData(file: Express.Multer.File, uploadFileDto: UploadFileDto) {
    const list = file.filename ? file.filename.split('.') : [];
    const fileType =
      uploadFileDto.fileType && uploadFileDto.fileType != 'undefined'
        ? uploadFileDto.fileType
        : list[list.length - 1] || '';
    const name = uuidv4();
    // ถ้า forceFileName เป็น true ให้ใช้ชื่อที่ส่งมาเลย (ใช้สำหรับเขียนทับ)
    // ถ้าไม่ใช่ ให้ใช้ตรรกะเดิมคือเช็ก ums_system_ หรือ Gen ใหม่
    const fileName =
      uploadFileDto.forceFileName && uploadFileDto.fileName
        ? uploadFileDto.fileName
        : uploadFileDto.fileName?.includes('ums_system_')
          ? uploadFileDto.fileName
          : `${name}.${fileType}`;

    const dataObj: any = {
      path: uploadFileDto.path,
      fileName: fileName,
      bucket: uploadFileDto.bucket || 'buu-get.storage',
    };

    if (fileType) {
      dataObj.originalExtension = fileType;
    }

    if (uploadFileDto?.qrVerify == 'true') {
      dataObj.qrVerify = 'true';
    }

    return dataObj;
  }

  async readFile(filePath: string) {
    try {
      return createReadStream(filePath);
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error('Error reading file');
    }
  }

  async uploadToApi(apiConfig: any, cacheToken: ApiToken, dataObj: any) {
    let payload = dataObj;
    const headers: any = {
      Accept: 'application/json',
      Authorization: `Bearer ${cacheToken.access_token}`,
      'x-forwarded-proto': 'https',
    };

    // If we're uploading a file, use FormData
    if (dataObj.fileUpload) {
      const form = new FormData();
      for (const key in dataObj) {
        if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
          const value = dataObj[key];
          // Buffer (เช่นจาก uploadBuffer) ต้องระบุ filename ให้ form-data
          // ส่วน stream จาก createReadStream มี path/filename ในตัวอยู่แล้ว
          if (key === 'fileUpload' && Buffer.isBuffer(value)) {
            form.append(key, value, { filename: String(dataObj.fileName) });
          } else {
            form.append(key, value);
          }
        }
      }
      payload = form;
      // Note: We don't set Content-Type here, axios + form-data will handle it with the boundary
    } else {
      headers['Content-Type'] = 'application/json';
    }

    return axios.post(`${this.getDomain()}${apiConfig.path}`, payload, {
      headers: {
        ...headers,
        ...(payload && typeof payload.getHeaders === 'function'
          ? payload.getHeaders()
          : {}),
      },
    });
  }

  async cleanupFile(filePath: string) {
    const unlinkAsync = promisify(unlink);
    await unlinkAsync(filePath);
  }

  async handleUploadError(
    error: any,
    dataObj: any,
    apiName: string,
    file: Express.Multer.File,
    uploadFileDto: UploadFileDto,
  ) {
    console.log(error.response?.data);

    if (
      error.response?.data.error === 'invalid_token' ||
      error.response?.status === 401
    ) {
      await this.refreshToken(apiName);
      return this.uploadFile(file, uploadFileDto);
    } else {
      await this.sendNoti(
        `${this.getNotiEndpoint()}${apiName}: ${error.message}`,
      );
      return error.response?.data;
    }
  }

  async getFileList(path: string) {
    const apiName = 'getFileList';
    const data = {
      path: path || '/uploaded_files',
      bucket: 'buu-get.storage',
    };
    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async getPublicFile(fileName: string, downloadName?: string): Promise<any> {
    const apiName = 'getPublicFile';

    // Sanitize fileName to remove double slashes
    if (fileName && fileName.includes('//')) {
      fileName = fileName.replace(/\/\//g, '/');
    }

    const baseName =
      fileName && fileName.includes('/') ? fileName.split('/').pop() : fileName;
    const cleanDownloadName =
      downloadName && downloadName.includes('/')
        ? downloadName.split('/').pop()
        : downloadName;

    const data = {
      filePath: {
        file_1: fileName,
      },
      time: 7, // 7 D | 10080 M
      carbonTime: 'D',
      bucket: 'buu-get.storage', // TODO: use hrd.dev.storage if needed
      originalFileName: {
        file_1: cleanDownloadName || baseName || fileName,
      },
    };
    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error: any) {
      if (
        error.response?.data.error === 'invalid_token' ||
        error.response?.status == 401
      ) {
        await this.refreshToken(apiName);
        return this.getPublicFile(fileName, downloadName);
      } else {
        await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
        console.log(error);
      }
    }
  }

  /**
   * ดึงไฟล์จาก gateway (pre-signed URL) แล้วคืนเป็น stream + content-type
   * ให้ controller นำไป pipe ลง response — logic การเรียก axios/stream อยู่ในชั้น service
   * @throws NotFoundException ถ้าไม่พบ pre-signed URL
   */
  async getPublicFileStream(
    fullPath: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    const result = await this.getPublicFile(fullPath);
    const fileData = result?.result?.file_1 || result?.file_1;
    const fileUrl = typeof fileData === 'string' ? fileData : fileData?.view;

    if (!fileUrl) {
      throw new NotFoundException(`File pre-signed URL not found: ${fullPath}`);
    }

    const response = await axios.get<Readable>(fileUrl, {
      responseType: 'stream',
    });
    const contentType = String(
      response.headers['content-type'] || 'image/jpeg',
    );
    return { stream: response.data, contentType };
  }

  async getPublicFiles(
    files: { fileName: string; downloadName?: string }[],
  ): Promise<any> {
    const apiName = 'getPublicFile';
    const filePath: Record<string, string> = {};
    const originalFileName: Record<string, string> = {};

    files.forEach((file, index) => {
      filePath[`file_${index + 1}`] = file.fileName;
      const baseName =
        file.fileName && file.fileName.includes('/')
          ? file.fileName.split('/').pop()
          : file.fileName;
      const cleanDownloadName =
        file.downloadName && file.downloadName.includes('/')
          ? file.downloadName.split('/').pop()
          : file.downloadName;
      originalFileName[`file_${index + 1}`] =
        cleanDownloadName || baseName || file.fileName;
    });

    const data = {
      filePath,
      time: 7, // 7 D | 10080 M
      carbonTime: 'D',
      bucket: 'buu-get.storage',
      originalFileName,
    };
    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async deleteFile(fileName: string) {
    const apiName = 'deleteFile';
    const path = fileName ? (fileName != 'none' ? fileName : '') : '';
    const data = {
      filePath: path,
      bucket: 'buu-get.storage',
    };
    try {
      const response = await this.deleteApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async deleteDocumentSigner(arg: any) {
    const apiName = 'deleteDocumentSigner';
    const data = {
      psn_id: arg.psn_id,
      psn_citizenid: arg.psn_citizenid,
      doc_filename: arg.doc_filename,
      doc_bucket: 'buu-get.storage',
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      this.logger?.error?.(`❌ deleteDocumentSigner failed: ${error}`);
      throw error;
    }
  }

  async voidDocumentSign(arg: any) {
    const apiName = 'voidDocumentSign';
    const data = {
      psn_id: arg.psn_id,
      psn_citizenid: arg.psn_citizenid,
      doc_filename: arg.doc_filename,
      doc_bucket: arg.doc_bucket || 'buu-get.storage',
      doc_cancelnote: arg.doc_cancelnote,
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      this.logger?.error?.(`❌ voidDocumentSign failed: ${error}`);
      throw error;
    }
  }

  async signElectronicSignature(arg: any) {
    const apiName = 'signElectronicSignature';
    const data = {
      psn_id: arg.psn_id,
      documentName: arg.documentName,
      bucket: 'buu-get.storage',
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async timeStamp(arg: any) {
    const apiName = 'timeStamp';
    const data = {
      documentName: arg.documentName,
      bucket: 'buu-get.storage',
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async dsPrefix() {
    const apiName = 'dsPrefix';
    try {
      const response = await this.getApi(apiName);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  async createShortUrl(arg: any) {
    const apiName = 'createShortUrl';
    const data = {
      url: arg.url,
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async getOriginalUrl(arg: any) {
    const apiName = 'getOriginalUrl';
    const data = {
      shortUrl: arg.shortUrl,
    };

    try {
      const response = await this.postApi(apiName, data);
      return response.data;
    } catch (error) {
      await this.sendNoti(this.getNotiEndpoint() + apiName + ': ' + error);
      console.log(error);
    }
  }

  async sendNoti(message: string) {
    console.log('sendNoti: ' + message);
  }
}
