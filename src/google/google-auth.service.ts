import { Injectable } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';

@Injectable()
export class GoogleAuthService {
    private auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    async getAccessToken(): Promise<string> {
        const client = await this.auth.getClient();
        const token = await client.getAccessToken();
        return token.token!;
    }
}
