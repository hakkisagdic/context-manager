#!/usr/bin/env node

/**
 * Reporter Tests
 * Tests for report generation, export, and formatting
 */

import { Reporter } from '../lib/core/Reporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

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

async function asyncTest(name, fn) {
    try {
        await fn();
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

console.log('🧪 Testing Reporter...\n');

// Setup test fixtures
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'reporter');
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// Mock context for testing
const mockContext = {
    metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        useCase: 'testing',
        configuration: {
            methodLevel: false
        }
    },
    statistics: {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000
    },
    files: []
};

const mockContextWithLLM = {
    metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        useCase: 'testing',
        targetLLM: {
            name: 'gpt-4',
            contextWindow: 8192
        },
        fitsInContext: true,
        configuration: {
            methodLevel: true
        }
    },
    statistics: {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000
    },
    files: []
};

const mockContextLarge = {
    metadata: {
        generatedAt: new Date().toISOString(),
        totalFiles: 100,
        totalTokens: 50000,
        totalSize: 500000,
        useCase: 'testing',
        targetLLM: {
            name: 'gpt-3.5-turbo',
            contextWindow: 4096
        },
        fitsInContext: false,
        chunksNeeded: 3,
        configuration: {
            methodLevel: false
        }
    },
    statistics: {
        totalFiles: 100,
        totalTokens: 50000,
        totalSize: 500000
    },
    files: []
};

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('Reporter - Constructor with defaults', () => {
    const reporter = new Reporter();
    if (!reporter) throw new Error('Should create instance');
    if (reporter.options.format !== 'toon') throw new Error('Default format should be toon');
    if (reporter.options.verbose !== true) throw new Error('Default verbose should be true');
    if (reporter.options.clipboard !== false) throw new Error('Default clipboard should be false');
});

test('Reporter - Constructor with custom options', () => {
    const reporter = new Reporter({
        format: 'json',
        outputPath: '/test/output.json',
        clipboard: true,
        verbose: false
    });

    if (reporter.options.format !== 'json') throw new Error('Should set format');
    if (reporter.options.outputPath !== '/test/output.json') throw new Error('Should set outputPath');
    if (reporter.options.clipboard !== true) throw new Error('Should set clipboard');
    if (reporter.options.verbose !== false) throw new Error('Should set verbose');
});

test('Reporter - Constructor initializes FormatRegistry', () => {
    const reporter = new Reporter();
    if (!reporter.formatRegistry) throw new Error('Should have formatRegistry');
});

// ============================================================================
// printConsoleReport() TESTS
// ============================================================================
console.log('\n📊 printConsoleReport() Tests');
console.log('-'.repeat(70));

test('Reporter - printConsoleReport with basic stats', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {}
    };

    // Should not throw
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport with language distribution', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {
            javascript: { files: 5, tokens: 3000, size: 30000 },
            python: { files: 3, tokens: 1500, size: 15000 },
            typescript: { files: 2, tokens: 500, size: 5000 }
        }
    };

    // Should not throw and should print language distribution
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport with largest files', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {},
        largestFiles: [
            { path: 'file1.js', tokens: 1000 },
            { path: 'file2.js', tokens: 800 },
            { path: 'file3.js', tokens: 600 }
        ]
    };

    // Should print largest files section
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport with method stats', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {},
        totalMethods: 50,
        includedMethods: 40
    };

    // Should print method analysis section
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport with performance stats', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {},
        analysisTime: 1234,
        cacheHits: 80,
        cacheMisses: 20
    };

    // Should print performance section
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport with all sections', () => {
    const reporter = new Reporter({ verbose: true });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {
            javascript: { files: 5, tokens: 3000, size: 30000 }
        },
        largestFiles: [
            { path: 'file1.js', tokens: 1000 }
        ],
        totalMethods: 50,
        includedMethods: 40,
        analysisTime: 1234,
        cacheHits: 80,
        cacheMisses: 20
    };

    // Should print all sections
    reporter.printConsoleReport(stats);
});

// ============================================================================
// exportToFile() TESTS
// ============================================================================
console.log('\n💾 exportToFile() Tests');
console.log('-'.repeat(70));

await asyncTest('Reporter - exportToFile with TOON format', async () => {
    const reporter = new Reporter();
    const outputPath = path.join(FIXTURES_DIR, 'output.toon');

    await reporter.exportToFile(mockContext, outputPath);

    if (!fs.existsSync(outputPath)) {
        throw new Error('Should create output file');
    }

    const content = fs.readFileSync(outputPath, 'utf-8');
    if (!content) throw new Error('File should have content');

    // Cleanup
    fs.unlinkSync(outputPath);
});

await asyncTest('Reporter - exportToFile with JSON format', async () => {
    const reporter = new Reporter();
    const outputPath = path.join(FIXTURES_DIR, 'output.json');

    await reporter.exportToFile(mockContext, outputPath);

    if (!fs.existsSync(outputPath)) {
        throw new Error('Should create output file');
    }

    const content = fs.readFileSync(outputPath, 'utf-8');
    // Should be valid JSON
    const parsed = JSON.parse(content);
    if (!parsed) throw new Error('Should create valid JSON');

    // Cleanup
    fs.unlinkSync(outputPath);
});

await asyncTest('Reporter - exportToFile detects format from extension', async () => {
    const reporter = new Reporter({ format: 'toon' });
    const outputPath = path.join(FIXTURES_DIR, 'output.yaml');

    await reporter.exportToFile(mockContext, outputPath);

    if (!fs.existsSync(outputPath)) {
        throw new Error('Should create output file');
    }

    // Cleanup
    fs.unlinkSync(outputPath);
});

await asyncTest('Reporter - exportToFile handles errors', async () => {
    const reporter = new Reporter();
    const invalidPath = '/invalid/path/that/does/not/exist/output.json';

    let errorThrown = false;
    try {
        await reporter.exportToFile(mockContext, invalidPath);
    } catch (error) {
        errorThrown = true;
    }

    if (!errorThrown) throw new Error('Should throw error for invalid path');
});

// ============================================================================
// detectFormatFromPath() TESTS
// ============================================================================
console.log('\n🔍 detectFormatFromPath() Tests');
console.log('-'.repeat(70));

test('Reporter - detectFormatFromPath for .toon', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.toon');
    if (format !== 'toon') throw new Error('Should detect toon format');
});

test('Reporter - detectFormatFromPath for .json', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.json');
    if (format !== 'json') throw new Error('Should detect json format');
});

test('Reporter - detectFormatFromPath for .yaml', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.yaml');
    if (format !== 'yaml') throw new Error('Should detect yaml format');
});

test('Reporter - detectFormatFromPath for .yml', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.yml');
    if (format !== 'yaml') throw new Error('Should detect yaml format from .yml');
});

test('Reporter - detectFormatFromPath for .md', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.md');
    if (format !== 'markdown') throw new Error('Should detect markdown format');
});

test('Reporter - detectFormatFromPath for .csv', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.csv');
    if (format !== 'csv') throw new Error('Should detect csv format');
});

test('Reporter - detectFormatFromPath for .xml', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.xml');
    if (format !== 'xml') throw new Error('Should detect xml format');
});

test('Reporter - detectFormatFromPath for .txt (gitingest)', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file.txt');
    if (format !== 'gitingest') throw new Error('Should detect gitingest format for .txt');
});

test('Reporter - detectFormatFromPath for unknown extension', () => {
    const reporter = new Reporter({ format: 'json' });
    const format = reporter.detectFormatFromPath('/path/to/file.unknown');
    if (format !== 'json') throw new Error('Should fallback to options.format');
});

test('Reporter - detectFormatFromPath without extension', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('/path/to/file');
    if (format !== 'toon') throw new Error('Should fallback to default toon format');
});

// ============================================================================
// getAverageTokens() TESTS
// ============================================================================
console.log('\n📈 getAverageTokens() Tests');
console.log('-'.repeat(70));

test('Reporter - getAverageTokens with normal stats', () => {
    const reporter = new Reporter();
    const stats = {
        totalFiles: 10,
        totalTokens: 5000
    };

    const avg = reporter.getAverageTokens(stats);
    if (avg !== '500') throw new Error('Should calculate average correctly');
});

test('Reporter - getAverageTokens with zero files', () => {
    const reporter = new Reporter();
    const stats = {
        totalFiles: 0,
        totalTokens: 0
    };

    const avg = reporter.getAverageTokens(stats);
    if (avg !== 'N/A') throw new Error('Should return N/A for zero files');
});

test('Reporter - getAverageTokens with large numbers', () => {
    const reporter = new Reporter();
    const stats = {
        totalFiles: 1000,
        totalTokens: 5000000
    };

    const avg = reporter.getAverageTokens(stats);
    if (avg !== '5,000') throw new Error('Should format large numbers with commas');
});

// ============================================================================
// generateSummary() TESTS
// ============================================================================
console.log('\n📝 generateSummary() Tests');
console.log('-'.repeat(70));

test('Reporter - generateSummary with basic context', () => {
    const reporter = new Reporter();
    const summary = reporter.generateSummary(mockContext);

    if (!summary) throw new Error('Should generate summary');
    if (!summary.includes('Context Manager')) throw new Error('Should include title');
    if (!summary.includes('Files: 10')) throw new Error('Should include file count');
    if (!summary.includes('5,000')) throw new Error('Should include token count');
});

test('Reporter - generateSummary with target LLM (fits)', () => {
    const reporter = new Reporter();
    const summary = reporter.generateSummary(mockContextWithLLM);

    if (!summary.includes('gpt-4')) throw new Error('Should include LLM name');
    if (!summary.includes('Fits in context: Yes')) throw new Error('Should show fits in context');
    if (summary.includes('Chunks needed')) throw new Error('Should not show chunks when fits');
});

test('Reporter - generateSummary with target LLM (does not fit)', () => {
    const reporter = new Reporter();
    const summary = reporter.generateSummary(mockContextLarge);

    if (!summary.includes('gpt-3.5-turbo')) throw new Error('Should include LLM name');
    if (!summary.includes('Fits in context: No')) throw new Error('Should show does not fit');
    if (!summary.includes('Chunks needed: 3')) throw new Error('Should show chunks needed');
});

test('Reporter - generateSummary with method level enabled', () => {
    const reporter = new Reporter();
    const summary = reporter.generateSummary(mockContextWithLLM);

    if (!summary.includes('Method Analysis: Enabled')) {
        throw new Error('Should show method analysis enabled');
    }
});

test('Reporter - generateSummary with method level disabled', () => {
    const reporter = new Reporter();
    const summary = reporter.generateSummary(mockContext);

    if (!summary.includes('Method Analysis: Disabled')) {
        throw new Error('Should show method analysis disabled');
    }
});

// ============================================================================
// exportMultiple() TESTS
// ============================================================================
console.log('\n📦 exportMultiple() Tests');
console.log('-'.repeat(70));

await asyncTest('Reporter - exportMultiple with valid formats', async () => {
    const reporter = new Reporter();
    const formats = ['json', 'yaml'];

    const results = await reporter.exportMultiple(mockContext, formats);

    if (results.length !== 2) throw new Error('Should return results for all formats');

    // Check both succeeded
    for (const result of results) {
        if (!result.success) throw new Error(`Format ${result.format} should succeed`);
        if (!result.path) throw new Error('Should have path');

        // Cleanup
        if (fs.existsSync(result.path)) {
            fs.unlinkSync(result.path);
        }
    }
});

await asyncTest('Reporter - exportMultiple handles errors gracefully', async () => {
    const reporter = new Reporter();

    // Override exportToFile to throw error for specific format
    const originalExportToFile = reporter.exportToFile.bind(reporter);
    reporter.exportToFile = async (context, outputPath) => {
        if (outputPath.endsWith('.bad')) {
            throw new Error('Simulated error');
        }
        return originalExportToFile(context, outputPath);
    };

    const formats = ['json', 'bad'];
    const results = await reporter.exportMultiple(mockContext, formats);

    if (results.length !== 2) throw new Error('Should return results for all formats');

    // JSON should succeed
    if (!results[0].success) throw new Error('JSON export should succeed');

    // BAD should fail
    if (results[1].success) throw new Error('BAD export should fail');
    if (!results[1].error) throw new Error('Failed result should have error message');

    // Cleanup successful export
    if (results[0].path && fs.existsSync(results[0].path)) {
        fs.unlinkSync(results[0].path);
    }
});

await asyncTest('Reporter - exportMultiple with empty formats array', async () => {
    const reporter = new Reporter();
    const results = await reporter.exportMultiple(mockContext, []);

    if (results.length !== 0) throw new Error('Should return empty array for empty formats');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔄 Integration Tests');
console.log('-'.repeat(70));

await asyncTest('Reporter - report() with verbose, file, and clipboard options', async () => {
    const outputPath = path.join(FIXTURES_DIR, 'integration-test.json');

    const reporter = new Reporter({
        verbose: true,
        outputPath: outputPath,
        clipboard: false  // Don't actually copy to clipboard in tests
    });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {
            javascript: { files: 5, tokens: 3000, size: 30000 }
        }
    };

    await reporter.report(mockContext, stats);

    // Should create file
    if (!fs.existsSync(outputPath)) {
        throw new Error('Should create output file');
    }

    // Cleanup
    fs.unlinkSync(outputPath);
});

await asyncTest('Reporter - report() with verbose=false skips console output', async () => {
    const reporter = new Reporter({
        verbose: false
    });

    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 50000,
        byLanguage: {}
    };

    // Should not throw
    await reporter.report(mockContext, stats);
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
    console.log('\n🎉 All Reporter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
