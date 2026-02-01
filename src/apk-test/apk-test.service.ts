import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GoogleAuthService } from '../google/google-auth.service';
import { StorageService } from '../google/storage.service';
import { CreateTestDto } from './create-test.dto';

@Injectable()
export class ApkTestService {
    private projectId = 'web-tester-apk';

    constructor(
        private readonly auth: GoogleAuthService,
        private readonly storage: StorageService,
    ) { }

    async runTest(file: Express.Multer.File, dto: CreateTestDto) {
        // 1️⃣ Upload APK
        const gcsPath = await this.storage.uploadApk(file);

        // 2️⃣ Auth token
        const token = await this.auth.getAccessToken();

        // 3️⃣ Call Test Lab API
        try {
            const response = await axios.post(
                `https://testing.googleapis.com/v1/projects/${this.projectId}/testMatrices`,
                {
                    testSpecification: {
                        androidRoboTest: {
                            appApk: { gcsPath },
                        },
                    },
                    environmentMatrix: {
                        androidDeviceList: {
                            androidDevices: [
                                {
                                    androidModelId: dto.modelId, // e.g., 'pixel2'
                                    androidVersionId: dto.versionId, // e.g., '28'
                                    locale: 'en',
                                    orientation: 'portrait',
                                },
                            ],
                        },
                    },
                    resultStorage: {
                        googleCloudStorage: {
                            gcsPath: `gs://${this.storage.getBucketName()}/results/${Date.now()}/`,
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            return {
                matrixId: response.data.testMatrixId,
                state: response.data.state,
                resultUrl: `https://console.firebase.google.com/project/${this.projectId}/testlab/histories`,
            };
        } catch (error) {
            console.error('❌ Test Lab API Error Details:', JSON.stringify(error.response?.data || error.message, null, 2));
            throw error;
        }
    }

    async getStatus(matrixId: string) {
        const token = await this.auth.getAccessToken();

        const response = await axios.get(
            `https://testing.googleapis.com/v1/projects/${this.projectId}/testMatrices/${matrixId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        return response.data;
    }
}
