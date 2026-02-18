import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExeTestController } from './Exe.controller';
import { ExeTestService } from './Exe.service';
import { ExeTestResult, ExeTestResultSchema } from 'src/schemas/Exe.schema';
import { HistoryModule } from '../history/history.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExeTestResult.name, schema: ExeTestResultSchema },
    ]),
    HistoryModule,
    AuthModule,
  ],
  controllers: [ExeTestController],
  providers: [ExeTestService],
  exports: [ExeTestService],
})
export class ExeModule {}
