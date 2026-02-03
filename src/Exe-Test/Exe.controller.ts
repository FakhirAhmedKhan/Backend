// backend/src/Exe-Test/Exe.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExeService } from './Exe.service';

@Controller('tests')
export class ExeController {
  constructor(private readonly exeService: ExeService) {}

  @Post('run')
  async runTest(@Body() config: any) {
    return await this.exeService.runElectronTest(config);
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