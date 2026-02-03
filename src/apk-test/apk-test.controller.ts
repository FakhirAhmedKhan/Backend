// src/apk-analysis/apk-analysis.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import { ApkAnalysisService } from './apk-test.service';
import { ApkDocument, ApkSchema } from 'src/schemas/Apk.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from '../history/history.service';
import { TestType } from '../history/history.schema';

@Controller('api/apk')
@UseGuards(JwtAuthGuard)
export class ApkAnalysisController {
  constructor(
    private readonly apkAnalysisService: ApkAnalysisService,
    private readonly historyService: HistoryService,
    @InjectModel(ApkSchema.name) private reportModel: Model<ApkDocument>,
  ) { }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('apk', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + '-' + uniqueSuffix + '.apk');
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.android.package-archive' ||
          file.originalname.endsWith('.apk')) {
          cb(null, true);
        } else {
          cb(new HttpException('Only APK files are allowed', HttpStatus.BAD_REQUEST), false);
        }
      },
    }),
  )
  async uploadApk(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Analyze the APK
      const analysisResult = await this.apkAnalysisService.analyzeApk(file.path);

      // Save to MongoDB
      const report = new this.reportModel({
        ...analysisResult,
        apkPath: file.path,
      });
      await report.save();

      // ✅ Log to history
      const userId = req.user?.userId || req.headers['x-user-id'];
      if (userId) {
        await this.historyService.createFromTestResult(
          userId,
          TestType.APK,
          { ...analysisResult, _id: report._id },
          ['uploaded', 'auto'],
        );
      }

      return {
        success: true,
        reportId: report._id,
        data: analysisResult,
      };
    } catch (error) {
      // Clean up uploaded file on error
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('reports')
  async getAllReports() {
    const reports = await this.reportModel.find().sort({ createdAt: -1 }).exec();
    return reports;
  }

  @Get('report/:id')
  async getReport(@Param('id') id: string) {
    const report = await this.reportModel.findById(id).exec();
    if (!report) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }
    return report;
  }
}