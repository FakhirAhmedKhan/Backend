import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHistoryDto, ListHistoryQueryDto } from './history.dto';
import { HistoryService } from './history.service';

/**
 * Helper to extract userId from request.
 * Supports both JWT (req.user) and a fallback header for easy manual testing.
 */
function getUserId(req: any): string {
  const userId = req.user?.userId || req.headers['x-user-id'];
  if (!userId) {
    throw new UnauthorizedException('User identity not found');
  }
  return userId;
}

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateHistoryDto) {
    const userId = getUserId(req);
    return this.historyService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: ListHistoryQueryDto) {
    const userId = getUserId(req);
    return this.historyService.findAll(userId, query);
  }

  @Delete(':id')
  removeById(@Req() req: Request, @Param('id') id: string) {
    const userId = getUserId(req);
    return this.historyService.removeById(userId, id);
  }

  @Delete()
  clearAll(@Req() req: Request) {
    const userId = getUserId(req);
    return this.historyService.clearAll(userId);
  }
}
