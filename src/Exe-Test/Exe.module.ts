import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExeController } from './Exe.controller';
import { ExeService } from './Exe.service';
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
  controllers: [ExeController],
  providers: [ExeService],
  exports: [ExeService],
})
export class ExeModule {}
