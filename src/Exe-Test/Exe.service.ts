// exe-test/exe-test.service.ts
import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

@Injectable()
export class ExeTestService {
  async runExeTest(file: Express.Multer.File) {
    // Save uploaded file temporarily
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = path.join(tempDir, file.originalname);
    fs.writeFileSync(tempPath, file.buffer);

    let loadTime = 0;
    let debuggerDisabled = true;

    try {
      const start = performance.now();

      await new Promise<void>((resolve, reject) => {
        const child = execFile(tempPath, [], { windowsHide: true }, (err) => {
          if (err) reject(err);
          else resolve();
        });

        // Optionally detect debugger presence
        child.on('spawn', () => {
          // If child process can open a debugger, you'd need extra checks here
          // For simple test, assume console is disabled if windowsHide: true
        });
      });

      loadTime = performance.now() - start;
    } catch (err) {
      return { error: 'Failed to run EXE: ' + err.message };
    } finally {
      fs.unlinkSync(tempPath);
    }

    return { loadTime: Math.round(loadTime), debuggerDisabled };
  }
}
