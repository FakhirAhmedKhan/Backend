import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApkDocument = ApkSchema & Document;

@Schema({ timestamps: true })
export class ApkSchema {
  @Prop({ required: true })
  appName: string;

  @Prop({ required: true })
  packageName: string;

  @Prop({ required: true })
  versionName: string;

  @Prop({ required: true })
  versionCode: string;

  @Prop()
  apkSize: number;

  @Prop({ type: Object })
  scores: {
    overall: number;
    performance: number;
    security: number;
    bestPractices: number;
    accessibility: number;
  };

  @Prop({ type: Object })
  performance: {
    launchTime: number;
    memoryUsage: number;
    cpuUsage: number;
    apkSizeMB: number;
  };

  @Prop({ type: Object })
  security: {
    isSigned: boolean;
    debuggable: boolean;
    permissions: string[];
    dangerousPermissions: string[];
  };

  @Prop({ type: Object })
  metadata: {
    minSdk: string;
    targetSdk: string;
    permissions: string[];
    activities: string[];
    services: string[];
  };

  @Prop({ type: [String] })
  recommendations: string[];

  @Prop()
  apkPath: string;

  @Prop({ default: 'completed' })
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(ApkSchema);
