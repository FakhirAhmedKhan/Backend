// backend/src/Exe-Test/Exe.service.ts
import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExeTestResult } from 'src/schemas/Exe.schema';

@Injectable()
export class ExeService {
  constructor(
    @InjectModel(ExeTestResult.name) 
    private testResultModel: Model<ExeTestResult>
  ) {}

  async runElectronTest(config: {
    appPath: string;
    testScript: string;
    testName: string;
  }) {
    const startTime = Date.now();
    const results: any = {
      testName: config.testName,
      status: 'running',
      steps: [],
      screenshots: [],
      errorMessages: [],
    };

    try {
      // Launch Electron app using Playwright
      const electronApp = await chromium.launch({
        executablePath: config.appPath,
        args: [],
      });

      // Execute test script
      const page = await electronApp.newPage();
      
      // Example: Run automated tests
      await this.executeTestSteps(page, config.testScript, results);

      results.status = 'passed';
      
      await electronApp.close();
    } catch (error: any) {
      results.status = 'failed';
      results.errorMessages.push(error.message);
    }

    const endTime = Date.now();
    results['duration'] = endTime - startTime;

    // Save to MongoDB
    const testResult = new this.testResultModel(results);
    await testResult.save();

    return results;
  }

  private async executeTestSteps(page: any, script: string, results: any) {
    // Parse and execute test script
    // This is where you'd implement your test DSL or execute playwright commands
    
    try {
      // Example test steps
      await page.waitForSelector('#app');
      results.steps.push({ step: 'App loaded', status: 'passed' });

      // Take screenshot
      const screenshot = await page.screenshot();
      results.screenshots.push(screenshot.toString('base64'));

      // Execute custom test commands from script
      const testCommands = this.parseTestScript(script);
      for (const command of testCommands) {
        await this.executeCommand(page, command, results);
      }
    } catch (error: any) {
      results.errorMessages.push(error.message);
      throw error;
    }
  }

  private parseTestScript(script: string) {
    // Parse your custom test script format
    // Could be JSON, YAML, or custom DSL
    return JSON.parse(script);
  }

  private async executeCommand(page: any, command: any, results: any) {
    switch (command.action) {
      case 'click':
        await page.click(command.selector);
        results.steps.push({ 
          step: `Clicked ${command.selector}`, 
          status: 'passed' 
        });
        break;
      
      case 'type':
        await page.fill(command.selector, command.text);
        results.steps.push({ 
          step: `Typed in ${command.selector}`, 
          status: 'passed' 
        });
        break;
      
      case 'assert':
        const element = await page.$(command.selector);
        const text = await element.textContent();
        if (text === command.expected) {
          results.steps.push({ 
            step: `Assert passed: ${command.selector}`, 
            status: 'passed' 
          });
        } else {
          throw new Error(`Expected ${command.expected}, got ${text}`);
        }
        break;

      case 'screenshot':
        const screenshot = await page.screenshot();
        results.screenshots.push(screenshot.toString('base64'));
        break;
    }
  }

  async getAllResults() {
    return await this.testResultModel.find().exec();
  }

  async getResultById(id: string) {
    return await this.testResultModel.findById(id).exec();
  }
}