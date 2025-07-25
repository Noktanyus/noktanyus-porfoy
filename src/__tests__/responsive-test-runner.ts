/**
 * @file Responsive test runner utility
 * @description Utility to run responsive tests across different configurations and generate reports
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestConfig {
  name: string;
  pattern: string;
  description: string;
}

interface TestResult {
  config: TestConfig;
  passed: boolean;
  failed: boolean;
  output: string;
  duration: number;
}

const TEST_CONFIGS: TestConfig[] = [
  {
    name: 'responsive-unit',
    pattern: '**/*.responsive.test.tsx',
    description: 'Unit tests for responsive component behavior',
  },
  {
    name: 'visual-regression',
    pattern: '**/visual/*.test.tsx',
    description: 'Visual regression tests for different breakpoints',
  },
  {
    name: 'accessibility-mobile',
    pattern: '**/accessibility/*.test.tsx',
    description: 'Accessibility tests for mobile navigation',
  },
  {
    name: 'touch-interaction',
    pattern: '**/*touch*.test.tsx',
    description: 'Touch interaction functionality tests',
  },
  {
    name: 'cross-browser',
    pattern: '**/cross-browser/*.test.tsx',
    description: 'Cross-browser responsive behavior tests',
  },
  {
    name: 'mobile-performance',
    pattern: '**/performance/mobile-performance.test.tsx',
    description: 'Mobile device performance optimization tests',
  },
];

class ResponsiveTestRunner {
  private results: TestResult[] = [];
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'test-results', 'responsive');
    this.ensureOutputDir();
  }

  private ensureOutputDir(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  private runTestConfig(config: TestConfig): TestResult {
    console.log(`\n🧪 Running ${config.name}: ${config.description}`);
    
    const startTime = Date.now();
    let passed = false;
    let output = '';

    try {
      const command = `npm test -- --testPathPatterns="${config.pattern}" --verbose --coverage=false`;
      output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
      });
      passed = true;
      console.log(`✅ ${config.name} passed`);
    } catch (error: any) {
      output = error.stdout + error.stderr;
      console.log(`❌ ${config.name} failed`);
      console.log(error.message);
    }

    const duration = Date.now() - startTime;

    return {
      config,
      passed,
      failed: !passed,
      output,
      duration,
    };
  }

  private generateReport(): void {
    const reportPath = path.join(this.outputDir, 'responsive-test-report.json');
    const htmlReportPath = path.join(this.outputDir, 'responsive-test-report.html');

    // JSON Report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => r.failed).length,
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      },
      results: this.results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));

    // HTML Report
    const htmlReport = this.generateHtmlReport(jsonReport);
    fs.writeFileSync(htmlReportPath, htmlReport);

    console.log(`\n📊 Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  private generateHtmlReport(jsonReport: any): string {
    const { summary, results } = jsonReport;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responsive Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
        .results {
            padding: 30px;
        }
        .result-item {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 20px;
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
        .result-title {
            font-weight: bold;
            font-size: 1.1em;
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
        .result-details {
            padding: 20px;
        }
        .result-output {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 15px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
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
            <h1>📱 Responsive Test Report</h1>
            <p>Comprehensive testing results for responsive components and mobile interactions</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <div class="summary-number total">${summary.total}</div>
                <div>Total Test Suites</div>
            </div>
            <div class="summary-card">
                <div class="summary-number passed">${summary.passed}</div>
                <div>Passed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number failed">${summary.failed}</div>
                <div>Failed</div>
            </div>
            <div class="summary-card">
                <div class="summary-number duration">${(summary.totalDuration / 1000).toFixed(1)}s</div>
                <div>Total Duration</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${results.map((result: any) => `
                <div class="result-item">
                    <div class="result-header">
                        <div>
                            <div class="result-title">${result.config.name}</div>
                            <div style="color: #6c757d; font-size: 0.9em;">${result.config.description}</div>
                        </div>
                        <div class="result-status ${result.passed ? 'status-passed' : 'status-failed'}">
                            ${result.passed ? '✅ PASSED' : '❌ FAILED'}
                        </div>
                    </div>
                    <div class="result-details">
                        <p><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>
                        <p><strong>Pattern:</strong> <code>${result.config.pattern}</code></p>
                        ${result.output ? `
                            <details>
                                <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">
                                    View Output
                                </summary>
                                <div class="result-output">${result.output}</div>
                            </details>
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
    console.log('🚀 Starting Responsive Test Suite');
    console.log(`Running ${TEST_CONFIGS.length} test configurations...\n`);

    const startTime = Date.now();

    for (const config of TEST_CONFIGS) {
      const result = this.runTestConfig(config);
      this.results.push(result);
    }

    const totalDuration = Date.now() - startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => r.failed).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESPONSIVE TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Test Suites: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(60));

    this.generateReport();

    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All responsive tests passed!');
    }
  }

  public async runSingle(configName: string): Promise<void> {
    const config = TEST_CONFIGS.find(c => c.name === configName);
    
    if (!config) {
      console.error(`❌ Test configuration '${configName}' not found.`);
      console.log('Available configurations:');
      TEST_CONFIGS.forEach(c => console.log(`  - ${c.name}: ${c.description}`));
      process.exit(1);
    }

    console.log(`🚀 Running single test configuration: ${config.name}`);
    
    const result = this.runTestConfig(config);
    this.results.push(result);
    
    this.generateReport();

    if (!result.passed) {
      console.log('\n❌ Test failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n✅ Test passed!');
    }
  }
}

// CLI Interface
const args = process.argv.slice(2);
const runner = new ResponsiveTestRunner();

if (args.length === 0) {
  runner.runAll();
} else if (args[0] === '--config' && args[1]) {
  runner.runSingle(args[1]);
} else if (args[0] === '--list') {
  console.log('Available test configurations:');
  TEST_CONFIGS.forEach(config => {
    console.log(`  ${config.name}: ${config.description}`);
    console.log(`    Pattern: ${config.pattern}`);
    console.log('');
  });
} else {
  console.log('Usage:');
  console.log('  npm run test:responsive              # Run all responsive tests');
  console.log('  npm run test:responsive --list       # List available configurations');
  console.log('  npm run test:responsive --config <name>  # Run specific configuration');
  console.log('');
  console.log('Available configurations:');
  TEST_CONFIGS.forEach(config => {
    console.log(`  - ${config.name}`);
  });
}

export default ResponsiveTestRunner;