/**
 * @file Cross-browser test suite runner
 * @description Comprehensive test runner for cross-browser responsive testing
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface BrowserConfig {
  name: string;
  userAgent: string;
  viewport: { width: number; height: number };
  pixelRatio: number;
  touchSupport: boolean;
}

interface TestResult {
  browser: string;
  test: string;
  passed: boolean;
  duration: number;
  errors: string[];
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  browserResults: Record<string, { passed: number; failed: number }>;
}

const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    pixelRatio: 1,
    touchSupport: false,
  },
  {
    name: 'Firefox Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    viewport: { width: 1920, height: 1080 },
    pixelRatio: 1,
    touchSupport: false,
  },
  {
    name: 'Safari Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    viewport: { width: 1440, height: 900 },
    pixelRatio: 2,
    touchSupport: false,
  },
  {
    name: 'Edge Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    viewport: { width: 1920, height: 1080 },
    pixelRatio: 1,
    touchSupport: false,
  },
  {
    name: 'iPhone Safari',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    pixelRatio: 2,
    touchSupport: true,
  },
  {
    name: 'iPhone Safari Landscape',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 667, height: 375 },
    pixelRatio: 2,
    touchSupport: true,
  },
  {
    name: 'Android Chrome',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    viewport: { width: 360, height: 640 },
    pixelRatio: 3,
    touchSupport: true,
  },
  {
    name: 'iPad Safari',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 768, height: 1024 },
    pixelRatio: 2,
    touchSupport: true,
  },
  {
    name: 'iPad Safari Landscape',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 768 },
    pixelRatio: 2,
    touchSupport: true,
  },
];

const TEST_SUITES = [
  'cross-browser/browser-responsive.test.tsx',
  'cross-browser/touch-interaction.test.tsx',
  'visual/visual-regression.test.tsx',
  'performance/mobile-performance.test.tsx',
  'accessibility/mobile-navigation.test.tsx',
];

class CrossBrowserTestSuite {
  private results: TestResult[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'test-results', 'cross-browser');
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private async runTestForBrowser(
    browserConfig: BrowserConfig,
    testSuite: string
  ): Promise<TestResult> {
    console.log(`\n🌐 Testing ${testSuite} on ${browserConfig.name}`);
    
    const startTime = Date.now();
    let passed = false;
    const errors: string[] = [];

    try {
      // Set environment variables for the test
      const env = {
        ...process.env,
        BROWSER_NAME: browserConfig.name,
        BROWSER_USER_AGENT: browserConfig.userAgent,
        VIEWPORT_WIDTH: browserConfig.viewport.width.toString(),
        VIEWPORT_HEIGHT: browserConfig.viewport.height.toString(),
        PIXEL_RATIO: browserConfig.pixelRatio.toString(),
        TOUCH_SUPPORT: browserConfig.touchSupport.toString(),
      };

      const command = `npm test -- --testPathPatterns="${testSuite}" --verbose --coverage=false --silent`;
      
      execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
        env,
      });
      
      passed = true;
      console.log(`✅ ${browserConfig.name} - ${testSuite} passed`);
    } catch (error: any) {
      errors.push(error.message);
      console.log(`❌ ${browserConfig.name} - ${testSuite} failed`);
      console.log(`   Error: ${error.message.split('\n')[0]}`);
    }

    const duration = Date.now() - startTime;

    return {
      browser: browserConfig.name,
      test: testSuite,
      passed,
      duration,
      errors,
    };
  }

  private generateSummary(): TestSummary {
    const summary: TestSummary = {
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.passed).length,
      failedTests: this.results.filter(r => !r.passed).length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      browserResults: {},
    };

    // Group results by browser
    this.results.forEach(result => {
      if (!summary.browserResults[result.browser]) {
        summary.browserResults[result.browser] = { passed: 0, failed: 0 };
      }
      
      if (result.passed) {
        summary.browserResults[result.browser].passed++;
      } else {
        summary.browserResults[result.browser].failed++;
      }
    });

    return summary;
  }

  private generateReport(summary: TestSummary): void {
    const reportPath = path.join(this.outputDir, 'cross-browser-report.json');
    const htmlReportPath = path.join(this.outputDir, 'cross-browser-report.html');

    // JSON Report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary,
      results: this.results,
      browserConfigs: BROWSER_CONFIGS,
    };

    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));

    // HTML Report
    const htmlReport = this.generateHtmlReport(jsonReport);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`\n📊 Cross-browser reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  private generateHtmlReport(jsonReport: any): string {
    const { summary, results, browserConfigs } = jsonReport;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Responsive Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .total { color: #007bff; }
        .duration { color: #6c757d; }
        .browser-matrix {
            padding: 30px;
        }
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .matrix-table th,
        .matrix-table td {
            padding: 12px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        .matrix-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .test-pass {
            background: #d4edda;
            color: #155724;
        }
        .test-fail {
            background: #f8d7da;
            color: #721c24;
        }
        .browser-configs {
            padding: 30px;
            background: #f8f9fa;
        }
        .config-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .config-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .config-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #495057;
        }
        .config-details {
            font-size: 0.9em;
            color: #6c757d;
        }
        .results-section {
            padding: 30px;
        }
        .result-item {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 15px;
            overflow: hidden;
        }
        .result-header {
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .result-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .timestamp {
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Cross-Browser Responsive Test Report</h1>
            <p>Comprehensive testing results across different browsers, devices, and screen configurations</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="summary-number total">${summary.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="summary-card">
                <div class="summary-number passed">${summary.passedTests}</div>
                <div>Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number failed">${summary.failedTests}</div>
                <div>Failed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number duration">${(summary.totalDuration / 1000).toFixed(1)}s</div>
                <div>Total Duration</div>
            </div>
        </div>
        
        <div class="browser-matrix">
            <h2>Browser Compatibility Matrix</h2>
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th>Browser</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(summary.browserResults).map(([browser, stats]) => {
                      const total = stats.passed + stats.failed;
                      const successRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : '0';
                      return `
                        <tr>
                            <td><strong>${browser}</strong></td>
                            <td class="test-pass">${stats.passed}</td>
                            <td class="test-fail">${stats.failed}</td>
                            <td>${successRate}%</td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="browser-configs">
            <h2>Browser Configurations</h2>
            <div class="config-grid">
                ${browserConfigs.map((config: BrowserConfig) => `
                    <div class="config-card">
                        <div class="config-title">${config.name}</div>
                        <div class="config-details">
                            <div><strong>Viewport:</strong> ${config.viewport.width}×${config.viewport.height}</div>
                            <div><strong>Pixel Ratio:</strong> ${config.pixelRatio}</div>
                            <div><strong>Touch Support:</strong> ${config.touchSupport ? 'Yes' : 'No'}</div>
                            <div><strong>User Agent:</strong> ${config.userAgent.substring(0, 60)}...</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="results-section">
            <h2>Detailed Results</h2>
            ${results.map((result: TestResult) => `
                <div class="result-item">
                    <div class="result-header">
                        <div>
                            <strong>${result.browser}</strong> - ${result.test}
                        </div>
                        <div class="result-status ${result.passed ? 'status-passed' : 'status-failed'}">
                            ${result.passed ? '✅ PASSED' : '❌ FAILED'}
                        </div>
                    </div>
                    <div style="padding: 15px 20px;">
                        <div><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</div>
                        ${result.errors.length > 0 ? `
                            <div style="margin-top: 10px;">
                                <strong>Errors:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    ${result.errors.map(error => `<li style="color: #dc3545;">${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Generated on ${new Date(jsonReport.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
  }

  public async runAll(): Promise<void> {
    console.log('🚀 Starting Cross-Browser Responsive Test Suite');
    console.log(`Testing ${TEST_SUITES.length} test suites across ${BROWSER_CONFIGS.length} browser configurations...\n`);

    const startTime = Date.now();

    for (const testSuite of TEST_SUITES) {
      console.log(`\n📋 Running test suite: ${testSuite}`);
      
      for (const browserConfig of BROWSER_CONFIGS) {
        const result = await this.runTestForBrowser(browserConfig, testSuite);
        this.results.push(result);
      }
    }

    const totalDuration = Date.now() - startTime;
    const summary = this.generateSummary();

    console.log('\n' + '='.repeat(80));
    console.log('📊 CROSS-BROWSER TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passedTests}`);
    console.log(`❌ Failed: ${summary.failedTests}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('\nBrowser Results:');
    
    Object.entries(summary.browserResults).forEach(([browser, stats]) => {
      const total = stats.passed + stats.failed;
      const successRate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : '0';
      console.log(`  ${browser}: ${stats.passed}/${total} (${successRate}%)`);
    });
    
    console.log('='.repeat(80));

    this.generateReport(summary);

    if (summary.failedTests > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All cross-browser tests passed!');
    }
  }

  public async runForBrowser(browserName: string): Promise<void> {
    const browserConfig = BROWSER_CONFIGS.find(config => 
      config.name.toLowerCase().includes(browserName.toLowerCase())
    );

    if (!browserConfig) {
      console.error(`❌ Browser '${browserName}' not found.`);
      console.log('Available browsers:');
      BROWSER_CONFIGS.forEach(config => console.log(`  - ${config.name}`));
      process.exit(1);
    }

    console.log(`🚀 Running tests for ${browserConfig.name}`);

    for (const testSuite of TEST_SUITES) {
      const result = await this.runTestForBrowser(browserConfig, testSuite);
      this.results.push(result);
    }

    const summary = this.generateSummary();
    this.generateReport(summary);

    if (summary.failedTests > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const runner = new CrossBrowserTestSuite();

if (args.length === 0) {
  runner.runAll();
} else if (args[0] === '--browser' && args[1]) {
  runner.runForBrowser(args[1]);
} else if (args[0] === '--list') {
  console.log('Available browsers:');
  BROWSER_CONFIGS.forEach(config => {
    console.log(`  ${config.name}:`);
    console.log(`    Viewport: ${config.viewport.width}×${config.viewport.height}`);
    console.log(`    Pixel Ratio: ${config.pixelRatio}`);
    console.log(`    Touch: ${config.touchSupport ? 'Yes' : 'No'}`);
    console.log('');
  });
} else {
  console.log('Usage:');
  console.log('  tsx src/__tests__/cross-browser-test-suite.ts           # Run all browsers');
  console.log('  tsx src/__tests__/cross-browser-test-suite.ts --list    # List browsers');
  console.log('  tsx src/__tests__/cross-browser-test-suite.ts --browser <name>  # Run specific browser');
  console.log('');
  console.log('Available browsers:');
  BROWSER_CONFIGS.forEach(config => {
    console.log(`  - ${config.name}`);
  });
}

export default CrossBrowserTestSuite;