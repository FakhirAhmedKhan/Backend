import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoryDocument = History & Document;

export enum HistoryStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum TestType {
  WEB = 'web',
  APK = 'apk',
  EXE = 'exe',
}

@Schema({ timestamps: true })
export class History {
  // ✅ user ownership
  @Prop({ required: true, index: true })
  userId: string;

  // ✅ test type (web, apk, exe)
  @Prop({ required: true, enum: Object.values(TestType), index: true })
  testType: TestType;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  @Prop({ required: true, enum: Object.values(HistoryStatus) })
  status: HistoryStatus;

  // ✅ reference to the actual test result document
  @Prop({ required: false })
  resultId: string; // MongoDB ObjectId as string

  // ✅ store summary data for quick access without joining
  @Prop({ type: Object, required: false })
  resultSummary?: Record<string, any>;

  // ✅ URL or app name being tested
  @Prop({ required: false, trim: true })
  testTarget?: string;

  // ✅ execution duration in milliseconds
  @Prop({ required: false })
  duration?: number;

  // ✅ tags for better organization
  @Prop({ type: [String], default: [] })
  tags?: string[];
}

export const HistorySchema = SchemaFactory.createForClass(History);

// ✅ indexes for fast "my history newest-first" + filters
HistorySchema.index({ userId: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, status: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, testType: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, testType: 1, status: 1 });
HistorySchema.index({ resultId: 1 });
