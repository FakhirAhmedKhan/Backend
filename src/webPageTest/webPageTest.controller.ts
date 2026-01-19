
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { WebPageTestService } from './webPageTest.service';

@Controller('web-page-test')
export class WebPageTestController {
    constructor(private readonly webPageTestService: WebPageTestService) { }

    @Get('audit')
    async analyze(@Query('url') url: string) {
        if (!url) {
            throw new BadRequestException('URL query parameter is required');
        }
        return this.webPageTestService.analyzeUrl(url);
    }
}
