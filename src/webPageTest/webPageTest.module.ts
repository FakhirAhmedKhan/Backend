
import { Module } from '@nestjs/common';
import { WebPageTestController } from './webPageTest.controller';
import { WebPageTestService } from './webPageTest.service';

@Module({
    controllers: [WebPageTestController],
    providers: [WebPageTestService],
})
export class WebPageTestModule { }
