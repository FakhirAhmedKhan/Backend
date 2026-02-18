import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApkSchema, ReportSchema } from 'src/schemas/Apk.schema';
import { ApkAnalysisController } from './apk-test.controller';
import { ApkAnalysisService } from './apk-test.service';
import { HistoryModule } from '../history/history.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ApkSchema.name, schema: ReportSchema }]),
    HistoryModule,
    AuthModule,
  ],
  controllers: [ApkAnalysisController],
  providers: [ApkAnalysisService],
})
export class ApkAnalysisModule {}
