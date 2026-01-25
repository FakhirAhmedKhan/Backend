import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private storage = new Storage();
  private bucketName = 'apk-test-uploads'; // create this bucket

  async uploadApk(file: Express.Multer.File): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(file.originalname);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
    });

    return `gs://${this.bucketName}/${file.originalname}`;
  }
}
