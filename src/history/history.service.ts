import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateHistoryDto, ListHistoryQueryDto } from './history.dto';
import { History, HistoryDocument, TestType } from '../schemas/history.schema';

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<HistoryDocument>,
  ) { }

  async create(userId: string, dto: CreateHistoryDto) {
    const doc = await this.historyModel.create({
      userId,
      ...dto,
    });
    const result = doc.toObject();
    return { ...result, id: result._id.toString() };
  }

  // ✅ Create history from test result (APK, EXE, or Web)
  async createFromTestResult(
    userId: string,
    testType: TestType,
    testResult: any,
    tags?: string[],
  ) {
    let historyData: any = {
      userId,
      testType,
      title: this.getTitleFromResult(testType, testResult),
      description: this.getDescriptionFromResult(testType, testResult),
      status: this.getStatusFromResult(testResult),
      resultSummary: this.getSummaryFromResult(testType, testResult),
      testTarget: this.getTestTarget(testType, testResult),
      duration: testResult.duration || 0,
      tags: tags || [],
    };

    if (testResult._id || testResult.id) {
      historyData.resultId = (testResult._id || testResult.id).toString();
    }

    const doc = await this.historyModel.create(historyData);
    const result = doc.toObject();
    return { ...result, id: result._id.toString() };
  }

  async findAll(userId: string, query: ListHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, any> = { userId };
    if (query.status) filter.status = query.status;
    if (query.testType) filter.testType = query.testType;

    // ✅ Search by title or description
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { testTarget: { $regex: query.search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      this.historyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.historyModel.countDocuments(filter),
    ]);

    const items = rawItems.map((item) => ({
      ...item,
      id: (item as any)._id.toString(),
    }));

    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  }

  // ✅ Get history by test type
  async findByTestType(userId: string, testType: TestType, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const filter = { userId, testType };

    const [items, total] = await Promise.all([
      this.historyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.historyModel.countDocuments(filter),
    ]);

    const mappedItems = items.map((item) => ({
      ...item,
      id: (item as any)._id.toString(),
    }));

    return {
      items: mappedItems,
      total,
      page,
      limit,
    };
  }

  // ✅ Get statistics
  async getStatistics(userId: string) {
    const stats = await this.historyModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$testType',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] },
          },
          warningCount: {
            $sum: { $cond: [{ $eq: ['$status', 'warning'] }, 1, 0] },
          },
        },
      },
    ]);

    const total = await this.historyModel.countDocuments({ userId });

    return {
      total,
      byTestType: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          total: stat.count,
          success: stat.successCount,
          error: stat.errorCount,
          warning: stat.warningCount,
        };
        return acc;
      }, {} as Record<TestType, any>),
    };
  }

  async removeById(userId: string, id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid history id');
    }

    const deleted = await this.historyModel
      .findOneAndDelete({ _id: id, userId })
      .lean();

    if (!deleted) throw new NotFoundException('History item not found');

    return { message: 'Deleted', id };
  }

  async clearAll(userId: string) {
    const res = await this.historyModel.deleteMany({ userId });
    return { message: 'Cleared', deletedCount: res.deletedCount };
  }

  // ✅ Clear history by test type
  async clearByTestType(userId: string, testType: TestType) {
    const res = await this.historyModel.deleteMany({ userId, testType });
    return { message: `Cleared ${testType} history`, deletedCount: res.deletedCount };
  }

  // ✅ Helper methods
  private getTitleFromResult(testType: TestType, result: any): string {
    if (testType === TestType.WEB) {
      return result.title || `PageSpeed Test: ${result.url}`;
    } else if (testType === TestType.APK) {
      return result.appName || result.title || 'APK Test';
    } else if (testType === TestType.EXE) {
      return result.testName || result.title || 'EXE Test';
    }
    return 'Test Result';
  }

  private getDescriptionFromResult(testType: TestType, result: any): string {
    if (testType === TestType.WEB) {
      return result.description || `Analyzed: ${result.url}`;
    } else if (testType === TestType.APK) {
      return `Package: ${result.packageName || 'N/A'} | Version: ${result.versionName || 'N/A'}`;
    } else if (testType === TestType.EXE) {
      return `Status: ${result.status || 'completed'} | Duration: ${result.duration}ms`;
    }
    return 'Test execution completed';
  }

  private getStatusFromResult(result: any): string {
    if (result.status === 'passed' || result.status === 'success') {
      return 'success';
    } else if (result.status === 'failed' || result.status === 'error') {
      return 'error';
    }
    return 'warning';
  }

  private getSummaryFromResult(testType: TestType, result: any): Record<string, any> {
    if (testType === TestType.WEB) {
      return {
        url: result.url,
        scores: result.scores || {},
        metrics: result.metrics || {},
      };
    } else if (testType === TestType.APK) {
      return {
        packageName: result.packageName,
        appName: result.appName,
        versionName: result.versionName,
        scores: result.scores || {},
        apkSize: result.apkSize,
      };
    } else if (testType === TestType.EXE) {
      return {
        testName: result.testName,
        status: result.status,
        duration: result.duration,
        stepsPassed: result.steps?.filter(s => s.status === 'passed').length || 0,
      };
    }
    return result;
  }

  private getTestTarget(testType: TestType, result: any): string {
    if (testType === TestType.WEB) {
      return result.url || '';
    } else if (testType === TestType.APK) {
      return result.packageName || result.appName || '';
    } else if (testType === TestType.EXE) {
      return result.appPath || result.testName || '';
    }
    return '';
  }
}
