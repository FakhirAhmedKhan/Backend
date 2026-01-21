import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoryDocument = History & Document;

export enum HistoryStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

@Schema({ timestamps: true })
export class History {
  // ✅ user ownership
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 500 })
  description: string;

  @Prop({ required: true, enum: Object.values(HistoryStatus) })
  status: HistoryStatus;
}

export const HistorySchema = SchemaFactory.createForClass(History);

// ✅ indexes for fast "my history newest-first" + filters
HistorySchema.index({ userId: 1, createdAt: -1 });
HistorySchema.index({ userId: 1, status: 1, createdAt: -1 });
