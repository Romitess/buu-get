import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import axios from 'axios';
import FormData from 'form-data';
import ApiToken from 'src/types/api/apiToken';
import RequestTokenApiConfig from 'src/types/api/requestTokenApiConfig';
import { v4 as uuidv4 } from 'uuid';
import { unlink, createReadStream } from 'fs';
import { promisify } from 'util';
import {
  UploadFileDto,
  UploadCertificateFileDto,
} from 'src/types/api/uploadFile';

@Injectable()
export class PlatformGatewayService {
  private readonly logger = new Logger(PlatformGatewayService.name);
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private getDomain(): string {
    const domain = this.configService.get<string>('domain');
    if (!domain) {
      throw new Error('Config "domain" is not defined');
    }
    return domain;
  }

  private getNotiEndpoint(): string {
    const noti = this.configService.get<string>('noti');
    if (!noti) {
      throw new Error('Config "noti" is not defined');
    }
    return noti;
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

  async postApi(apiName: string, data: any) {
    return this.makeApiRequest('post', 'postApi', apiName, data);
  }

  async getApi(apiName: string) {
    return this.makeApiRequest('get', 'getApi', apiName);
  }

  async deleteApi(apiName: string, data: any) {
    return this.makeApiRequest('delete', 'deleteApi', apiName, data);
  }

  async makeApiRequest(
    method: string,
    funcName: string,
    apiName: string,
    data?: any,
  ) {
    let apiConfig;

    apiConfig = this.getApiConfig(apiName);
    const cacheToken = await this.getCacheToken(apiName);
    const url = `${this.getDomain()}${apiConfig.path}`;
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${cacheToken.access_token}`,
      'x-forwarded-proto': 'https',
      'Content-Type': 'application/json',
    };

    try {
      let response;
      // Log debug: API name, method and a preview of the payload (send_message length if available)
      if (data && data.send_message) {
        this.logger?.log?.(
          `📤 Sending ${apiName} with send_message length: ${String(
            (data.send_message as string).length,
          )}`,
        );
      } else {
        this.logger?.log?.(
          `📤 Sending ${apiName} payload keys: ${Object.keys(data || {}).join(', ')}`,
        );
      }

      switch (method) {
        case 'post':
          response = await axios.post(url, data, {
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
            data,
            timeout: 120000,
          });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return response;
    } catch (error: any) {
      // Log response body for 500 to help debug
      try {
        const status = error.response?.status;
        const body = error.response?.data;
        this.logger?.error?.(
          `❌ API ${apiName} returned status ${status}. Body: ${JSON.stringify(body)}`,
        );
      } catch {
        // ignore
      }
      return this.handleApiError(apiName, error, data, method, funcName);
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

  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sensitiveKeys = [
      'password',
      'client_secret',
      'refresh_token',
      'secret',
      'confirmPassword',
      'oldPassword',
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

  async handleApiError(
    apiName: string,
    error: any,
    data: any,
    method: string,
    funcName: string,
  ) {
    if (
      error.response?.data.error === 'invalid_token' ||
      error.response?.status === 401
    ) {
      await this.refreshToken(apiName);
      console.log('redo ', funcName);
      const handler = (this as Record<string, any>)[funcName];
      if (typeof handler === 'function') {
        return handler.call(this, apiName, data);
      } else {
        console.error(`Method ${funcName} is not a valid function`);
        return error.response?.data;
      }
    } else {
      await this.sendNoti(
        `${this.getNotiEndpoint()}${apiName}: ${error.message}`,
      );
      return error.response?.data;
    }
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
        {
          client_secret: requestTokenConfig.client_secret,
          client_id: requestTokenConfig.client_id,
          grant_type: 'refresh_token',
          refresh_token: cacheToken.refresh_token,
        },
        {
          headers: { 'x-forwarded-proto': 'https' },
        },
      );

      await this.cacheManager.set(`${apiName}_apiToken`, response.data, 0);
    } catch (error) {
      return this.handleApiError(apiName, error, {}, 'post', 'refreshToken');
    }
  }

  async requestToken(apiName: string) {
    try {
      console.log('requestToken ' + apiName);
      const requestTokenConfig = this.getRequestTokenConfig();
      const apiConfig = this.getApiConfig(apiName);

      const response = await axios.post(
        `${this.getDomain()}${apiConfig.path}${requestTokenConfig.path}`,
        {
          client_secret: requestTokenConfig.client_secret,
          client_id: requestTokenConfig.client_id,
          grant_type: requestTokenConfig.grant_type,
          scope: apiConfig.scope,
          provision_key: apiConfig.provision_key,
          authenticated_userid: requestTokenConfig.authenticated_userid,
        },
        { timeout: 120000 },
      );

      await this.cacheManager.set(`${apiName}_apiToken`, response.data, 0);
    } catch (error) {
      return this.handleApiError(apiName, error, {}, 'post', 'requestToken');
    }
  }

  // loginBuu ใช้สำหรับตรวจสอบ username และ password กับระบบของมหาวิทยาลัยบูรพา
  // สำคํญ

  async sendEmail(
    system: string,
    to: string,
    subject: string,
    message: string,
  ) {
    const apiName = 'sendEmail';
    const data = {
      send_system: system,
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
    const data = {
      send_system: system,
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
    // ถ้าไม่ใช่ ให้ใช้ตรรกะเดิมคือเช็ค ums_system_ หรือ Gen ใหม่
    const fileName =
      uploadFileDto.forceFileName && uploadFileDto.fileName
        ? uploadFileDto.fileName
        : uploadFileDto.fileName?.includes('ums_system_')
          ? uploadFileDto.fileName
          : `${name}.${fileType}`;

    const dataObj: any = {
      path: uploadFileDto.path,
      fileName: fileName,
      bucket: uploadFileDto.bucket || 'hrd.storage',
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
          form.append(key, dataObj[key]);
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
      bucket: 'hrd.storage',
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
      bucket: 'hrd.storage', // TODO: use hrd.dev.storage if needed
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
      bucket: 'hrd.storage',
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
      bucket: 'hrd.storage',
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
      doc_bucket: 'hrd.storage',
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
      doc_bucket: arg.doc_bucket || 'hrd.storage',
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
      bucket: 'hrd.storage',
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
      bucket: 'hrd.storage',
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
    // try {
    //     await axios.post(
    //       'https://api.telegram.org/bot7682472342:AAHDC3vEasGWLNah3wJkcHGaNIhi21TxA8Y/sendMessage',
    //       {
    //         chat_id: '-4522198775',
    //         text: message?.substring(0, 1000),
    //       },
    //       {
    //         headers: {
    //           'Content-Type': 'application/x-www-form-urlencoded',
    //         },
    //       },
    //     );
    //   return response.data;
    // } catch (error) {
    //   console.log(error);
    // }
  }
}
