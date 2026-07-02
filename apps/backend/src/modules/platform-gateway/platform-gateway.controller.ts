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
import { UploadImageCategoryDto } from './dto/upload-image-category.dto';
import { SendEmailDto } from './dto/send-email.dto';
import {
  FileNameDto,
  GetFileListDto,
  SendNotiDto,
} from './dto/file-name.dto';
import { GetPublicFilesDto } from './dto/get-public-files.dto';

// endpoint ที่ forward body ดิบไป upstream (createShortUrl/getOriginalUrl/timeStamp)
// ยังคงรับ AnyRecord เพราะ shape ขึ้นกับ payload ปลายทาง — DTO เข้มจะตัด field ที่จำเป็นทิ้ง
type AnyRecord = Record<string, unknown>;

/** multer disk storage ใช้ร่วมกันทุก endpoint ที่รับไฟล์ */
const uploadDiskStorage = diskStorage({
  destination: './uploaded_file',
  filename: (_req, file, cb) => {
    cb(null, uuidv4() + extname(file.originalname));
  },
});

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
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post('/images/upload')
  @UseInterceptors(FileInterceptor('file', { storage: uploadDiskStorage }))
  async uploadImageByCategory(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageCategoryDto,
    @Req() req: Request & { user?: { userId: number } },
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Please send multipart/form-data with a file field named "file".',
      );
    }
    return this.platformGatewayService.uploadByCategory(
      body.category,
      file,
      req.user?.userId,
    );
  }

  // เสิร์ฟไฟล์ folder ชั้นเดียว เช่น page_builder/<uuid> (shared)
  @Public()
  @Get('/:folder/:fileName')
  async serveFile(
    @Param('folder') folder: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    return this.streamPublicFile(`${folder}/${fileName}`, res);
  }

  // เสิร์ฟไฟล์ folder สองชั้น เช่น user_images/<userId>/<uuid> (per-user)
  @Public()
  @Get('/:folder/:sub/:fileName')
  async serveNestedFile(
    @Param('folder') folder: string,
    @Param('sub') sub: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    return this.streamPublicFile(`${folder}/${sub}/${fileName}`, res);
  }

  /** ดึงไฟล์จาก gateway แล้ว stream กลับ — ใช้ร่วมกันทุก serve route (logic อยู่ในชั้น service) */
  private async streamPublicFile(fullPath: string, res: Response) {
    const { stream, contentType } =
      await this.platformGatewayService.getPublicFileStream(fullPath);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  }

  @Public()
  @Post('/getFileList')
  getFileList(@Body() body: GetFileListDto) {
    return this.platformGatewayService.getFileList(
      body.path ?? '/uploaded_files',
    );
  }

  @Public()
  @Post('/getPublicFile')
  getPublicFile(@Body() body: FileNameDto) {
    return this.platformGatewayService.getPublicFile(body.fileName);
  }

  @Public()
  @Post('/getPublicFiles')
  getPublicFiles(@Body() body: GetPublicFilesDto) {
    const files =
      body.files ?? (body.fileName ? [{ fileName: body.fileName }] : []);
    return this.platformGatewayService.getPublicFiles(files);
  }

  @Post('/sendNoti')
  sendNoti(@Body() body: SendNotiDto) {
    return this.platformGatewayService.sendNoti(body.message);
  }

  @Public()
  @Post('/sendEmail')
  sendEmail(@Body() body: SendEmailDto) {
    return this.platformGatewayService.sendEmail(
      body.system,
      body.to,
      body.subject,
      body.message,
    );
  }

  @Public()
  @Delete('/deleteFile')
  deleteFile(@Body() body: FileNameDto) {
    return this.platformGatewayService.deleteFile(body.fileName);
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
