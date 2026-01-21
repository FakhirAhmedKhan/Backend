import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateHistoryDto, ListHistoryQueryDto } from './history.dto';
import { History, HistoryDocument } from './history.schema';

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

  async findAll(userId: string, query: ListHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, any> = { userId };
    if (query.status) filter.status = query.status;

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
}
