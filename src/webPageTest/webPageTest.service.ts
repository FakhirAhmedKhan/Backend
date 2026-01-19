
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebPageTestService {
    private readonly googleApiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    private readonly logger = new Logger(WebPageTestService.name);

    constructor(private readonly configService: ConfigService) { }

    async analyzeUrl(url: string) {
        const apiKey = this.configService.get<string>('PAGESPEED_API_KEY');

        if (!apiKey) {
            this.logger.error('PAGESPEED_API_KEY is missing');
            throw new HttpException(
                'Server misconfiguration: API Key missing',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // 1. Construct the Query Parameters
        const params = new URLSearchParams();
        params.append('url', url);
        params.append('key', apiKey);
        params.append('strategy', 'mobile');
        // Request specific categories to separate performance, seo, accessibility
        params.append('category', 'performance');
        params.append('category', 'seo');
        params.append('category', 'accessibility');

        try {
            // 2. Call the Google API
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

            // 3. Extract and Return Scores
            // Note: Scores are 0-1 (e.g., 0.98).
            const lighthouse = data.lighthouseResult?.categories;
            const audits = data.lighthouseResult?.audits;

            return {
                url: url,
                scores: {
                    performance: lighthouse?.performance?.score ?? 0,
                    seo: lighthouse?.seo?.score ?? 0,
                    accessibility: lighthouse?.accessibility?.score ?? 0,
                },
                metrics: {
                    lcp: audits?.['largest-contentful-paint']?.displayValue || 'N/A',
                    cls: audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
                },
                // Including essential core web vitals if needed, but keeping it minimal as requested
            };

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
