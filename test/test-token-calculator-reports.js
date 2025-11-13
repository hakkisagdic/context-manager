#!/usr/bin/env node

/**
 * Token Calculator Report Generation Tests
 * Tests for report generation, export, and context fit analysis
 */

import TokenCalculator from '../lib/analyzers/token-calculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'token-calc-reports');

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

// Setup fixtures directory with test files
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// Create test files
fs.writeFileSync(path.join(FIXTURES_DIR, 'test1.js'), 'function test1() { return "hello"; }');
fs.writeFileSync(path.join(FIXTURES_DIR, 'test2.js'), 'function test2() { return "world"; }');
fs.writeFileSync(path.join(FIXTURES_DIR, 'test3.py'), 'def test3():\n    return "python"');

console.log('🧪 Testing TokenCalculator Report Generation...\n');

// ============================================================================
// SAVE DETAILED REPORT TESTS
// ============================================================================
console.log('💾 saveDetailedReport() Tests');
console.log('-'.repeat(70));

test('TokenCalculator - saveDetailedReport creates file', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    if (!fs.existsSync(reportPath)) {
        throw new Error('Should create report file');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - saveDetailedReport contains valid JSON', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    if (!report.metadata) throw new Error('Should have metadata');
    if (!report.summary) throw new Error('Should have summary');
    if (!report.files) throw new Error('Should have files');

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - saveDetailedReport includes metadata fields', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    if (!report.metadata.generatedAt) throw new Error('Should have generatedAt');
    if (!report.metadata.projectRoot) throw new Error('Should have projectRoot');
    if (!report.metadata.gitignoreRules) throw new Error('Should have gitignoreRules');

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - saveDetailedReport sorts files by tokens', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Verify files are sorted by tokens (descending)
    for (let i = 0; i < report.files.length - 1; i++) {
        if (report.files[i].tokens < report.files[i + 1].tokens) {
            throw new Error('Files should be sorted by tokens (descending)');
        }
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - saveDetailedReport includes all analyzed files', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    if (report.files.length === 0) throw new Error('Should include analyzed files');
    if (report.summary.totalFiles !== report.files.length) {
        throw new Error('Summary totalFiles should match files array length');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

// ============================================================================
// PRINT CONTEXT FIT ANALYSIS TESTS
// ============================================================================
console.log('\n🎯 printContextFitAnalysis() Tests');
console.log('-'.repeat(70));

test('TokenCalculator - printContextFitAnalysis does not throw', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        targetModel: 'gpt-4'
    });

    calculator.run();

    // Should not throw even if profile detection fails
    // (already called by run())
});

test('TokenCalculator - printContextFitAnalysis with unknown model', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        targetModel: 'unknown-model-xyz'
    });

    calculator.run();

    // Should handle unknown models gracefully
    // (already called by run())
});

test('TokenCalculator - printContextFitAnalysis without targetModel', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false
        // No targetModel specified
    });

    calculator.run();

    // Should handle missing targetModel
    // (already called by run())
});

test('TokenCalculator - printContextFitAnalysis after analysis', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        targetModel: 'gpt-4'
    });

    calculator.run();

    // Stats should be populated
    if (calculator.stats.totalFiles === 0) {
        throw new Error('Stats should be populated after run()');
    }
});

// ============================================================================
// PRINT REPORT TESTS
// ============================================================================
console.log('\n📊 printReport() Tests');
console.log('-'.repeat(70));

test('TokenCalculator - printReport does not throw', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });
    calculator.run();

    // Should not throw (already called by run())
});

test('TokenCalculator - printReport after run', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });

    calculator.run();

    if (calculator.stats.totalFiles === 0) {
        throw new Error('Should have stats after run()');
    }
});

// ============================================================================
// PRINT METHODS TESTS
// ============================================================================
console.log('\n📋 Print Helper Methods Tests');
console.log('-'.repeat(70));

test('TokenCalculator - printExtensionStats does not throw', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });
    calculator.run();

    // Already called by run(), test passes if no error
});

test('TokenCalculator - printTopFiles does not throw', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });
    calculator.run();

    // Already called by run(), test passes if no error
});

test('TokenCalculator - printTopDirectories does not throw', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });
    calculator.run();

    // Already called by run(), test passes if no error
});

test('TokenCalculator - print methods with empty stats', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, { verbose: false });

    // Call print methods before analysis (empty stats)
    // Should handle gracefully
    try {
        calculator.printExtensionStats();
        calculator.printTopFiles();
        calculator.printTopDirectories();
    } catch (error) {
        // If it throws, that's a potential bug
        throw new Error('Print methods should handle empty stats gracefully');
    }
});

// ============================================================================
// HANDLE EXPORTS TESTS
// ============================================================================
console.log('\n📤 handleExports() Tests');
console.log('-'.repeat(70));

test('TokenCalculator - handleExports with saveReport option', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    if (!fs.existsSync(reportPath)) {
        throw new Error('Should save report when saveReport=true');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - handleExports with no export options', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false
        // No export options
    });

    calculator.run();

    // Should not throw (handleExports called by run())
});

test('TokenCalculator - handleExports with contextExport option', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        contextExport: true
    });

    calculator.run();

    const contextPath = path.join(FIXTURES_DIR, 'llm-context.json');
    if (!fs.existsSync(contextPath)) {
        throw new Error('Should save context when contextExport=true');
    }

    // Cleanup
    fs.unlinkSync(contextPath);
});

// ============================================================================
// RUN METHOD TESTS
// ============================================================================
console.log('\n🏃 run() Method Tests');
console.log('-'.repeat(70));

test('TokenCalculator - run() executes full workflow', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    // Should create report
    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    if (!fs.existsSync(reportPath)) {
        throw new Error('run() should save report');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

test('TokenCalculator - run() with targetModel option', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        targetModel: 'gpt-4',
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    if (!fs.existsSync(reportPath)) {
        throw new Error('Should save report');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('TokenCalculator - Full workflow: run -> report -> export', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true,
        contextExport: true,
        targetModel: 'gpt-4'
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const contextPath = path.join(FIXTURES_DIR, 'llm-context.json');

    if (!fs.existsSync(reportPath)) {
        throw new Error('Should save detailed report');
    }
    if (!fs.existsSync(contextPath)) {
        throw new Error('Should save LLM context');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
    fs.unlinkSync(contextPath);
});

test('TokenCalculator - Report content validation', () => {
    const calculator = new TokenCalculator(FIXTURES_DIR, {
        verbose: false,
        saveReport: true
    });

    calculator.run();

    const reportPath = path.join(FIXTURES_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Validate report structure
    if (report.summary.totalFiles === 0) {
        throw new Error('Summary should have file count');
    }
    if (report.summary.totalTokens === 0) {
        throw new Error('Summary should have token count');
    }
    if (!report.summary.byExtension) {
        throw new Error('Summary should have byExtension stats');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test fixtures');
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All TokenCalculator report tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
