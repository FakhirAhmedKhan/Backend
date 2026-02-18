import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WebPageTestService } from './webPageTest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('web-page-test')
export class WebPageTestController {
  constructor(private readonly webPageTestService: WebPageTestService) {}

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  async analyze(@Req() req: any, @Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL query parameter is required');
    }

    // Extract userId from JWT (set by guard)
    const userId = req.user?.userId;

    return this.webPageTestService.analyzeUrl(url, userId);
  }
}
