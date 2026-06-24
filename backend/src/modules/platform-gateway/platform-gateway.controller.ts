import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PlatformGatewayService } from './platform-gateway.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { UploadFileDto } from 'src/types/api/uploadFile';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Public } from 'src/decorators/public.decorator';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import axios from 'axios';

type AnyRecord = Record<string, unknown>;

/** multer disk storage ใช้ร่วมกันทุก endpoint ที่รับไฟล์ */
const uploadDiskStorage = diskStorage({
  destination: './uploaded_file',
  filename: (_req, file, cb) => {
    cb(null, uuidv4() + extname(file.originalname));
  },
});

const isString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const normalizeFileList = (
  value: unknown,
): { fileName: string; downloadName?: string }[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is AnyRecord => typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      fileName: isString(item.fileName) ? item.fileName : '',
      downloadName: isString(item.downloadName) ? item.downloadName : undefined,
    }))
    .filter((item) => item.fileName !== '');
};

@Controller('api')
export class PlatformGatewayController {
  constructor(
    private readonly platformGatewayService: PlatformGatewayService,
  ) {}

  @Public()
  @Post('/uploadFile')
  @UseInterceptors(FileInterceptor('file', { storage: uploadDiskStorage }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Please send multipart/form-data with a file field named "file".',
      );
    }
    if (!uploadFileDto.fileName) {
      uploadFileDto.fileName = file.originalname; // ใช้ชื่อไฟล์ต้นฉบับถ้าไม่ได้ระบุ fileName
    }
    return this.platformGatewayService.uploadFile(file, uploadFileDto);
  }

  /**
   * Upload รูปตามชนิด (category) — folder ปลายทางถูกกำหนดโดย registry ฝั่ง backend
   * client ส่งแค่ field `category` (semantic) ไม่ต้องรู้ path จริง
   *
   * OptionalJwtAuthGuard: ถ้ามี token จะดึง userId มาทำ per-user folder ได้
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Post('/images/upload')
  @UseInterceptors(FileInterceptor('file', { storage: uploadDiskStorage }))
  async uploadImageByCategory(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: AnyRecord,
    @Req() req: Request & { user?: { userId: number } },
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Please send multipart/form-data with a file field named "file".',
      );
    }
    const category = isString(body?.category) ? body.category : '';
    return this.platformGatewayService.uploadByCategory(
      category,
      file,
      req.user?.userId,
    );
  }

  @Public()
  @Get('/:folder/:fileName')
  async serveFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const fullPath = `${folder}/${fileName}`;
      const result = await this.platformGatewayService.getPublicFile(fullPath);

      // console.log(
      //   `[serveFile] Path: ${fullPath}, Result:`,
      //   JSON.stringify(result),
      // );

      const fileData = result?.result?.file_1 || result?.file_1;
      const fileUrl = typeof fileData === 'string' ? fileData : fileData?.view;

      if (fileUrl) {
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        res.setHeader(
          'Content-Type',
          String(response.headers['content-type'] || 'image/jpeg'),
        );
        return response.data.pipe(res);
      }
      return res.status(404).send('File pre-signed URL not found');
    } catch (error) {
      console.error(
        `[serveFile] Error serving file ${folder}/${fileName}:`,
        error,
      );
      return res.status(500).send('Error retrieving file from gateway');
    }
  }

  @Public()
  @Post('/getFileList')
  getFileList(@Body() body: AnyRecord) {
    const path = isString(body?.path) ? body.path : '/uploaded_files';
    return this.platformGatewayService.getFileList(path);
  }

  @Public()
  @Post('/getPublicFile')
  getPublicFile(@Body() body: AnyRecord) {
    const fileName = isString(body?.fileName) ? body.fileName : '';
    return this.platformGatewayService.getPublicFile(fileName);
  }

  @Public()
  @Post('/getPublicFiles')
  getPublicFiles(@Body() body: AnyRecord) {
    const files =
      normalizeFileList(body?.files) ||
      (isString(body?.fileName) ? [{ fileName: body.fileName }] : []);
    return this.platformGatewayService.getPublicFiles(files);
  }

  @Post('/sendNoti')
  sendNoti(@Body() body: AnyRecord) {
    const message = isString(body?.message) ? body.message : '';
    return this.platformGatewayService.sendNoti(message);
  }

  @Public()
  @Post('/sendEmail')
  sendEmail(@Body() body: AnyRecord) {
    const system = isString(body?.system) ? body.system : '';
    const to = isString(body?.to) ? body.to : '';
    const subject = isString(body?.subject) ? body.subject : '';
    const message = isString(body?.message) ? body.message : '';
    return this.platformGatewayService.sendEmail(system, to, subject, message);
  }

  @Public()
  @Delete('/deleteFile')
  deleteFile(@Body() body: AnyRecord) {
    const fileName = isString(body?.fileName) ? body.fileName : '';
    return this.platformGatewayService.deleteFile(fileName);
  }

  @Public()
  @Post('/timeStamp')
  timeStamp(@Body() body: AnyRecord) {
    return this.platformGatewayService.timeStamp(body);
  }

  @Public()
  @Get('/dsPrefix')
  dsPrefix() {
    return this.platformGatewayService.dsPrefix();
  }

  @Post('/createShortUrl')
  createShortUrl(@Body() body: AnyRecord) {
    return this.platformGatewayService.createShortUrl(body);
  }

  @Post('/getOriginalUrl')
  getOriginalUrl(@Body() body: AnyRecord) {
    return this.platformGatewayService.getOriginalUrl(body);
  }
}
