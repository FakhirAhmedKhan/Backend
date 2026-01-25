import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApkTestService } from './apk-test.service';
import { CreateTestDto } from './create-test.dto';

@Controller('apk-test')
export class ApkTestController {
  constructor(private readonly service: ApkTestService) {}

  @Post()
  @UseInterceptors(FileInterceptor('apk'))
  runTest(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateTestDto,
  ) {
    return this.service.runTest(file, dto);
  }

  @Get(':matrixId')
  getStatus(@Param('matrixId') matrixId: string) {
    return this.service.getStatus(matrixId);
  }
}
