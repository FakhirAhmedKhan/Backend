// exe-test/exe-test.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ExeTestService } from './Exe.service';

@Controller('exe-test')
export class ExeTestController {
  constructor(private readonly exeService: ExeTestService) { }

  @Post('run')
  @UseInterceptors(FileInterceptor('exeFile'))
  async runTest(@UploadedFile() file: Express.Multer.File) {
    return this.exeService.runExeTest(file);
  }
}
