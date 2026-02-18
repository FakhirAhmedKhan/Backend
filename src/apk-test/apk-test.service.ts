// src/apk-analysis/apk-analysis.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import ApkReader = require('adbkit-apkreader');

const execAsync = promisify(exec);

@Injectable()
export class ApkAnalysisService {
  private readonly logger = new Logger(ApkAnalysisService.name);

  async analyzeApk(apkPath: string): Promise<any> {
    this.logger.log(`Analyzing APK: ${apkPath}`);

    try {
      // Parse APK metadata
      const metadata = await this.extractMetadata(apkPath);

      // Analyze security
      const security = await this.analyzeSecurity(metadata);

      // Get APK size
      const apkSize = this.getApkSize(apkPath);

      // Analyze performance characteristics
      const performance = await this.analyzePerformance(apkPath, metadata);

      // Calculate scores
      const scores = this.calculateScores({
        security,
        performance,
        metadata,
        apkSize,
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        security,
        performance,
        scores,
      });

      // Handle label which might be a string or array depending on parser/resources
      const appName = Array.isArray(metadata.application.label)
        ? metadata.application.label[0]
        : metadata.application.label;

      return {
        appName: appName || 'Unknown App',
        packageName: metadata.package,
        versionName: metadata.versionName,
        versionCode: metadata.versionCode.toString(),
        apkSize,
        scores,
        performance,
        security,
        metadata: {
          minSdk: metadata.usesSdk.minSdkVersion,
          targetSdk: metadata.usesSdk.targetSdkVersion,
          permissions: metadata.usesPermissions
            ? metadata.usesPermissions.map((p) => p.name || p)
            : [],
          activities: metadata.application.activity?.map((a) => a.name) || [],
          services: metadata.application.service?.map((s) => s.name) || [],
        },
        recommendations,
        status: 'completed',
      };
    } catch (error) {
      this.logger.error(`Error analyzing APK: ${error.message}`);
      throw error;
    }
  }

  private async extractMetadata(apkPath: string): Promise<any> {
    const reader = await ApkReader.open(apkPath);
    const manifest = await reader.readManifest();
    return manifest;
  }

  private getApkSize(apkPath: string): number {
    const stats = fs.statSync(apkPath);
    return Math.round((stats.size / (1024 * 1024)) * 100) / 100; // MB
  }

  private async analyzeSecurity(metadata: any): Promise<any> {
    // Handle permissions which might be objects or strings
    const rawPermissions = metadata.usesPermissions || [];
    const permissions = rawPermissions.map((p) => p.name || p);

    const dangerousPermissions = [
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_SMS',
      'android.permission.SEND_SMS',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_PHONE_STATE',
      'android.permission.CALL_PHONE',
      'android.permission.READ_CALL_LOG',
      'android.permission.WRITE_CALL_LOG',
      'android.permission.BODY_SENSORS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ];

    const foundDangerousPerms = permissions.filter((p) =>
      dangerousPermissions.includes(p),
    );

    // Check if debuggable
    const debuggable =
      metadata.application?.debuggable === 'true' ||
      metadata.application?.debuggable === true;

    return {
      isSigned: true, // APK parser assumes it's signed if parseable
      debuggable,
      permissions,
      dangerousPermissions: foundDangerousPerms,
      permissionCount: permissions.length,
      dangerousPermissionCount: foundDangerousPerms.length,
    };
  }

  private async analyzePerformance(
    apkPath: string,
    metadata: any,
  ): Promise<any> {
    const apkSizeMB = this.getApkSize(apkPath);

    // Estimate based on APK characteristics
    const estimatedLaunchTime = this.estimateLaunchTime(apkSizeMB, metadata);
    const estimatedMemory = this.estimateMemoryUsage(apkSizeMB, metadata);

    return {
      apkSizeMB,
      launchTime: estimatedLaunchTime,
      memoryUsage: estimatedMemory,
      cpuUsage: 0, // Would need real device testing
    };
  }

  private estimateLaunchTime(apkSize: number, metadata: any): number {
    // Simple heuristic: larger apps = slower launch
    let baseTime = 1000; // 1 second base

    if (apkSize > 100) baseTime += 1000;
    else if (apkSize > 50) baseTime += 500;
    else if (apkSize > 20) baseTime += 200;

    // More activities = potentially slower
    const activityCount = metadata.application.activity?.length || 0;
    baseTime += activityCount * 50;

    return baseTime;
  }

  private estimateMemoryUsage(apkSize: number, metadata: any): number {
    // Simple heuristic for memory estimation
    let baseMemory = 50; // 50 MB base

    baseMemory += apkSize * 0.5; // Roughly half the APK size

    return Math.round(baseMemory);
  }

  private calculateScores(data: any): any {
    const perfScore = this.calculatePerformanceScore(data.performance);
    const secScore = this.calculateSecurityScore(data.security);
    const bpScore = this.calculateBestPracticesScore(data);
    const accScore = this.calculateAccessibilityScore(data.metadata);

    const weights = {
      performance: 0.3,
      security: 0.3,
      bestPractices: 0.25,
      accessibility: 0.15,
    };

    const overall =
      perfScore * weights.performance +
      secScore * weights.security +
      bpScore * weights.bestPractices +
      accScore * weights.accessibility;

    return {
      overall: Math.round(overall),
      performance: perfScore,
      security: secScore,
      bestPractices: bpScore,
      accessibility: accScore,
    };
  }

  private calculatePerformanceScore(perf: any): number {
    let score = 100;

    // APK size penalties
    if (perf.apkSizeMB > 100) score -= 30;
    else if (perf.apkSizeMB > 50) score -= 20;
    else if (perf.apkSizeMB > 20) score -= 10;

    // Launch time penalties
    if (perf.launchTime > 3000) score -= 20;
    else if (perf.launchTime > 2000) score -= 10;

    // Memory penalties
    if (perf.memoryUsage > 200) score -= 20;
    else if (perf.memoryUsage > 150) score -= 10;

    return Math.max(0, score);
  }

  private calculateSecurityScore(security: any): number {
    let score = 100;

    if (!security.isSigned) score -= 40;
    if (security.debuggable) score -= 30;

    // Dangerous permissions penalty
    score -= Math.min(30, security.dangerousPermissionCount * 5);

    return Math.max(0, score);
  }

  private calculateBestPracticesScore(data: any): number {
    let score = 100;

    const targetSdk = parseInt(data.metadata.targetSdk);
    const currentSdk = 34; // Android 14

    // Outdated SDK penalty
    if (targetSdk < currentSdk - 2) score -= 30;
    else if (targetSdk < currentSdk - 1) score -= 15;

    // Too many permissions
    if (data.security.permissionCount > 20) score -= 20;
    else if (data.security.permissionCount > 10) score -= 10;

    return Math.max(0, score);
  }

  private calculateAccessibilityScore(metadata: any): number {
    // This would require deeper analysis of UI components
    // For now, basic heuristic
    return 70; // Default moderate score
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    if (data.scores.performance < 70) {
      recommendations.push(
        'Optimize APK size using ProGuard/R8 and resource shrinking',
      );
      if (data.performance.apkSizeMB > 50) {
        recommendations.push(
          'Consider using Android App Bundle for smaller downloads',
        );
      }
    }

    if (data.scores.security < 70) {
      if (data.security.debuggable) {
        recommendations.push('Disable debuggable flag in production builds');
      }
      if (data.security.dangerousPermissionCount > 5) {
        recommendations.push(
          'Review and minimize dangerous permissions requested',
        );
      }
    }

    if (data.scores.bestPractices < 70) {
      recommendations.push('Update target SDK to latest Android version');
    }

    return recommendations;
  }
}
