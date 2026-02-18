import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HistoryService } from '../history/history.service';
import { HistoryStatus, TestType } from '../schemas/history.schema';

@Injectable()
export class WebPageTestService {
  private readonly googleApiUrl =
    'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  private readonly logger = new Logger(WebPageTestService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly historyService: HistoryService,
  ) {}

  async analyzeUrl(targetUrl: string, userId?: string) {
    const apiKey = this.configService.get<string>('PAGESPEED_API_KEY');

    if (!apiKey) {
      throw new HttpException(
        'Server misconfiguration: API Key missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const params = new URLSearchParams({
      url: targetUrl,
      key: apiKey,
      strategy: 'mobile',
    });

    ['performance', 'seo', 'accessibility', 'best-practices'].forEach((c) =>
      params.append('category', c),
    );

    const requestUrl = `${this.googleApiUrl}?${params.toString()}`;

    try {
      const response = await fetch(requestUrl, {
        headers: {
          accept: 'application/json',
        },
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (response.status === 429) {
        this.logger.warn('PageSpeed rate limit hit');
        throw new HttpException(
          'PageSpeed rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errorJson = await response.json();
          throw new HttpException(
            errorJson?.error?.message || 'PageSpeed request failed',
            response.status,
          );
        }

        throw new HttpException(
          'Non-JSON response from PageSpeed',
          response.status,
        );
      }

      if (!contentType.includes('application/json')) {
        throw new HttpException(
          'Invalid response from PageSpeed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const data = await response.json();

      if (!data?.lighthouseResult) {
        throw new HttpException(
          'Missing lighthouse result',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (userId) {
        const perfScore =
          data.lighthouseResult.categories?.performance?.score ?? 0;

        let status = HistoryStatus.ERROR;
        if (perfScore >= 0.9) status = HistoryStatus.SUCCESS;
        else if (perfScore >= 0.5) status = HistoryStatus.WARNING;

        await this.historyService.create(userId, {
          testType: TestType.WEB,
          title: `Audit: ${targetUrl}`,
          description: `Performance: ${Math.round(
            perfScore * 100,
          )}%, SEO: ${Math.round(
            (data.lighthouseResult.categories?.seo?.score ?? 0) * 100,
          )}%`,
          status,
        });
      }

      return data;
    } catch (err) {
      if (err instanceof HttpException) throw err;

      this.logger.error(err);
      throw new HttpException(
        'Failed to connect to PageSpeed Insights',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
