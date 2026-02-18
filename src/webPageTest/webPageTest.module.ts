import { Module } from '@nestjs/common';
import { WebPageTestController } from './webPageTest.controller';
import { WebPageTestService } from './webPageTest.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [HistoryModule],
  controllers: [WebPageTestController],
  providers: [WebPageTestService],
})
export class WebPageTestModule {}
