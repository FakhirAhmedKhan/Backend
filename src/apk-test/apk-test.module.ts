// src/apk-analysis/apk-analysis.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApkSchema, ReportSchema } from 'src/schemas/Apk.schema';
import { ApkAnalysisController } from './apk-test.controller';
import { ApkAnalysisService } from './apk-test.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: ApkSchema.name, schema: ReportSchema }]),
    ],
    controllers: [ApkAnalysisController],
    providers: [ApkAnalysisService],
})
export class ApkAnalysisModule { }