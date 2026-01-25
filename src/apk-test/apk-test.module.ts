import { Module } from '@nestjs/common';
import { ApkTestController } from './apk-test.controller';
import { ApkTestService } from './apk-test.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { StorageService } from '../google/storage.service';

@Module({
    controllers: [ApkTestController],
    providers: [ApkTestService, GoogleAuthService, StorageService],
})
export class ApkTestModule { }
