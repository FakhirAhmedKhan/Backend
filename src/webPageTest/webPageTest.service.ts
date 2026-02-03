
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HistoryService } from '../history/history.service';
import { HistoryStatus, TestType } from '../history/history.schema';

@Injectable()
export class WebPageTestService {
    private readonly googleApiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    private readonly logger = new Logger(WebPageTestService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly historyService: HistoryService,
    ) { }

    async analyzeUrl(url: string, userId?: string) {
        const apiKey = this.configService.get<string>('PAGESPEED_API_KEY');

        if (!apiKey) {
            this.logger.error('PAGESPEED_API_KEY is missing');
            throw new HttpException(
                'Server misconfiguration: API Key missing',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const params = new URLSearchParams();
        params.append('url', url);
        params.append('key', apiKey);
        params.append('strategy', 'mobile');
        params.append('category', 'performance');
        params.append('category', 'seo');
        params.append('category', 'accessibility');
        params.append('category', 'best-practices');

        try {
            const response = await fetch(`${this.googleApiUrl}?${params.toString()}`);

            if (!response.ok) {
                const errorBody = await response.json();
                this.logger.error(`Google API Error: ${JSON.stringify(errorBody)}`);
                throw new HttpException(
                    errorBody.error?.message || 'Failed to analyze page',
                    response.status,
                );
            }

            const data = await response.json();

            if (!data.lighthouseResult) {
                this.logger.error('No lighthouseResult in API response');
                throw new HttpException(
                    'Invalid response from PageSpeed Insights',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            // Optional: Save to history if userId is provided
            if (userId) {
                const perfScore = data.lighthouseResult.categories?.performance?.score || 0;
                let status = HistoryStatus.ERROR;
                if (perfScore >= 0.9) status = HistoryStatus.SUCCESS;
                else if (perfScore >= 0.5) status = HistoryStatus.WARNING;

                await this.historyService.create(userId, {
                    testType: TestType.WEB,
                    title: `Audit: ${url}`,
                    description: `Performance: ${Math.round(perfScore * 100)}%, SEO: ${Math.round((data.lighthouseResult.categories?.seo?.score || 0) * 100)}%`,
                    status,
                }).catch(err => this.logger.error('Failed to save history', err));
            }

            return data;

        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(error);
            throw new HttpException(
                'An error occurred while connecting to PageSpeed Insights',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
