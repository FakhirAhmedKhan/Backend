// backend/src/schemas/Exe.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ExeTestResult extends Document {
  @Prop({ required: false })
  testName: string;

  @Prop()
  appPath: string;

  @Prop()
  status: string; // running, passed, failed

  @Prop()
  duration: number; // in milliseconds

  @Prop({ type: Array })
  steps: {
    step: string;
    status: string;
    timestamp: Date;
  }[];

  @Prop({ type: Array })
  screenshots: string[]; // Base64 encoded

  @Prop({ type: Array })
  errorMessages: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  createdAt: Date;
}

export const ExeTestResultSchema = SchemaFactory.createForClass(ExeTestResult);