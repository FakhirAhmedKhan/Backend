import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsArray,
  IsObject,
} from 'class-validator';
import { HistoryStatus, TestType } from '../schemas/history.schema';

export class CreateHistoryDto {
  @IsEnum(TestType)
  testType: TestType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsEnum(HistoryStatus)
  status: HistoryStatus;

  @IsOptional()
  @IsString()
  resultId?: string; // MongoDB ObjectId

  @IsOptional()
  @IsObject()
  resultSummary?: Record<string, any>;

  @IsOptional()
  @IsString()
  testTarget?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ListHistoryQueryDto {
  @IsOptional()
  @IsEnum(HistoryStatus)
  status?: HistoryStatus;

  @IsOptional()
  @IsEnum(TestType)
  testType?: TestType;

  // ✅ pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // ✅ optional search by title
  @IsOptional()
  @IsString()
  search?: string;
}
