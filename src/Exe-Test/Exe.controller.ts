// backend/src/Exe-Test/Exe.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ExeService } from './Exe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HistoryService } from '../history/history.service';
import { TestType } from '../schemas/history.schema';

@Controller('tests')
@UseGuards(JwtAuthGuard)
export class ExeController {
  constructor(
    private readonly exeService: ExeService,
    private readonly historyService: HistoryService,
  ) {}

  @Post('run')
  async runTest(@Body() config: any, @Req() req: any) {
    const result = await this.exeService.runElectronTest(config);

    // ✅ Log to history
    const userId = req.user?.userId || req.headers['x-user-id'];
    if (userId) {
      await this.historyService.createFromTestResult(
        userId,
        TestType.EXE,
        result,
        ['automated', 'electron'],
      );
    }

    return result;
  }

  @Get('results')
  async getResults() {
    // Return all test results from MongoDB
    return await this.exeService.getAllResults();
  }

  @Get('results/:id')
  async getResultById(@Param('id') id: string) {
    return await this.exeService.getResultById(id);
  }
}
