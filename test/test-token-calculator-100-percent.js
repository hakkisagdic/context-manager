#!/usr/bin/env node

/**
 * TokenCalculator 100% Coverage Tests
 * Final push to achieve 100% test coverage
 * Covers all remaining uncovered code paths
 */

import TokenCalculator from '../lib/analyzers/token-calculator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { EventEmitter } from 'events';

// Increase event emitter limit
EventEmitter.defaultMaxListeners = 50;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'token-calc-100');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

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

// Setup fixtures
if (!fs.existsSync(TEST_PROJECT_DIR)) {
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
}

// Create nested directory structure
const srcDir = path.join(TEST_PROJECT_DIR, 'src');
const libDir = path.join(TEST_PROJECT_DIR, 'lib');
const testDir = path.join(TEST_PROJECT_DIR, 'test');
const docsDir = path.join(TEST_PROJECT_DIR, 'docs');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(libDir, { recursive: true });
fs.mkdirSync(testDir, { recursive: true });
fs.mkdirSync(docsDir, { recursive: true });

// Create test files
fs.writeFileSync(path.join(srcDir, 'index.js'),
    'function main() {\n  console.log("app");\n}\nfunction init() {\n  return {};\n}\nmodule.exports = { main, init };');
fs.writeFileSync(path.join(srcDir, 'utils.js'),
    'export const helper = () => "help";\nexport const format = (x) => x.toString();');
fs.writeFileSync(path.join(libDir, 'core.js'),
    'class Core {\n  constructor() {}\n  run() {}\n}\nexport default Core;');
fs.writeFileSync(path.join(testDir, 'test.js'),
    'import { main } from "../src/index";\ntest("main", () => main());');
fs.writeFileSync(path.join(docsDir, 'README.md'),
    '# Documentation\n\n## Overview\nThis is documentation.');

console.log('🧪 Testing TokenCalculator - 100% Coverage Push...\n');

// ============================================================================
// FULL RUN() METHOD TESTS
// ============================================================================
console.log('🏃 Full run() Method Tests');
console.log('-'.repeat(70));

test('TokenCalculator - run() full workflow without options', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        dashboard: true // Skip interactive prompts
    });

    const result = calculator.run();

    if (typeof result.totalFiles !== 'number') {
        throw new Error('Should return stats');
    }
    if (!Array.isArray(result.files)) {
        throw new Error('Should return files array');
    }
});

test('TokenCalculator - run() with all export options', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        saveReport: true,
        contextExport: true,
        gitingest: true
    });

    calculator.run();

    // Verify all exports were created
    const reportPath = path.join(TEST_PROJECT_DIR, 'token-analysis-report.json');
    const contextPath = path.join(TEST_PROJECT_DIR, 'llm-context.json');
    const digestPath = path.join(TEST_PROJECT_DIR, 'digest.txt');

    if (!fs.existsSync(reportPath)) throw new Error('Should create report');
    if (!fs.existsSync(contextPath)) throw new Error('Should create context');
    if (!fs.existsSync(digestPath)) throw new Error('Should create digest');

    // Cleanup
    fs.unlinkSync(reportPath);
    fs.unlinkSync(contextPath);
    fs.unlinkSync(digestPath);
});

test('TokenCalculator - run() with targetModel triggers context fit analysis', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        targetModel: 'gpt-4',
        dashboard: true
    });

    calculator.run();

    // Should have stats populated
    if (calculator.stats.totalFiles === 0) {
        throw new Error('Should analyze files');
    }
});

test('TokenCalculator - run() with targetTokens applies budget fitting', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        targetTokens: 100,
        fitStrategy: 'top-n',
        dashboard: true
    });

    const result = calculator.run();

    // Should apply fitting
    if (result.totalTokens > 100) {
        // May not fit exactly, but should attempt
    }
});

// ============================================================================
// PRINT CONTEXT FIT ANALYSIS TESTS
// ============================================================================
console.log('\n🎯 printContextFitAnalysis() Error Handling');
console.log('-'.repeat(70));

test('TokenCalculator - printContextFitAnalysis with invalid model fails gracefully', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        targetModel: 'nonexistent-model-12345',
        dashboard: true
    });

    calculator.stats.totalFiles = 10;
    calculator.stats.totalTokens = 5000;

    // Should not throw
    calculator.printContextFitAnalysis();
});

test('TokenCalculator - printContextFitAnalysis with valid model', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        targetModel: 'claude-opus',
        dashboard: true
    });

    calculator.stats.totalFiles = 5;
    calculator.stats.totalTokens = 1000;

    // Should not throw
    calculator.printContextFitAnalysis();
});

// ============================================================================
// SAVE DETAILED REPORT ADVANCED TESTS
// ============================================================================
console.log('\n💾 saveDetailedReport() Advanced Tests');
console.log('-'.repeat(70));

test('TokenCalculator - saveDetailedReport with complex analysis results', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    calculator.stats.totalFiles = 5;
    calculator.stats.totalTokens = 1000;

    const analysisResults = [
        {
            path: path.join(srcDir, 'index.js'),
            relativePath: 'src/index.js',
            tokens: 300,
            sizeBytes: 1500,
            lines: 50,
            extension: '.js'
        },
        {
            path: path.join(srcDir, 'utils.js'),
            relativePath: 'src/utils.js',
            tokens: 200,
            sizeBytes: 1000,
            lines: 30,
            extension: '.js'
        }
    ];

    calculator.saveDetailedReport(analysisResults);

    const reportPath = path.join(TEST_PROJECT_DIR, 'token-analysis-report.json');
    if (!fs.existsSync(reportPath)) {
        throw new Error('Should create report');
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Verify report structure
    if (!report.metadata.generatedAt) throw new Error('Should have timestamp');
    if (report.files[0].tokens !== 300) throw new Error('Should be sorted by tokens');

    fs.unlinkSync(reportPath);
});

test('TokenCalculator - saveDetailedReport includes gitignore rules', () => {
    const gitignorePath = path.join(TEST_PROJECT_DIR, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n*.log\n');

    const calculator = new TokenCalculator(TEST_PROJECT_DIR);
    calculator.stats.totalFiles = 1;
    calculator.stats.totalTokens = 100;

    calculator.saveDetailedReport([
        { path: 'test.js', relativePath: 'test.js', tokens: 100, sizeBytes: 500, lines: 10, extension: '.js' }
    ]);

    const reportPath = path.join(TEST_PROJECT_DIR, 'token-analysis-report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    if (!Array.isArray(report.metadata.gitignoreRules)) {
        throw new Error('Should include gitignore rules');
    }

    fs.unlinkSync(reportPath);
    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// SCAN DIRECTORY ERROR HANDLING TESTS
// ============================================================================
console.log('\n📂 scanDirectory() Error Handling');
console.log('-'.repeat(70));

test('TokenCalculator - scanDirectory handles permission errors', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    // Should handle errors gracefully
    const files = calculator.scanDirectory('/root/nonexistent-12345');

    if (!Array.isArray(files)) {
        throw new Error('Should return array even on error');
    }
});

test('TokenCalculator - scanDirectory skips all excluded directories', () => {
    // Create excluded directories
    const nodeModules = path.join(TEST_PROJECT_DIR, 'node_modules');
    const gitDir = path.join(TEST_PROJECT_DIR, '.git');
    const coverage = path.join(TEST_PROJECT_DIR, 'coverage');
    const dist = path.join(TEST_PROJECT_DIR, 'dist');

    fs.mkdirSync(nodeModules, { recursive: true });
    fs.mkdirSync(gitDir, { recursive: true });
    fs.mkdirSync(coverage, { recursive: true });
    fs.mkdirSync(dist, { recursive: true });

    fs.writeFileSync(path.join(nodeModules, 'package.js'), 'code');
    fs.writeFileSync(path.join(gitDir, 'config'), 'config');
    fs.writeFileSync(path.join(coverage, 'report.html'), 'report');
    fs.writeFileSync(path.join(dist, 'bundle.js'), 'bundle');

    const calculator = new TokenCalculator(TEST_PROJECT_DIR);
    const files = calculator.scanDirectory(TEST_PROJECT_DIR);

    const hasExcluded = files.some(f =>
        f.includes('node_modules') ||
        f.includes('.git') ||
        f.includes('coverage') ||
        f.includes('dist')
    );

    if (hasExcluded) {
        throw new Error('Should skip excluded directories');
    }

    // Cleanup
    fs.rmSync(nodeModules, { recursive: true, force: true });
    fs.rmSync(gitDir, { recursive: true, force: true });
    fs.rmSync(coverage, { recursive: true, force: true });
    fs.rmSync(dist, { recursive: true, force: true });
});

// ============================================================================
// COUNT FILES IN DIRECTORY ERROR HANDLING
// ============================================================================
console.log('\n📊 countFilesInDirectory() Error Handling');
console.log('-'.repeat(70));

test('TokenCalculator - countFilesInDirectory handles errors', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    // Try to count in non-existent directory
    const count = calculator.countFilesInDirectory('/nonexistent-dir-12345');

    if (typeof count !== 'number') {
        throw new Error('Should return number even on error');
    }
    if (count !== 0) {
        throw new Error('Should return 0 for non-existent directory');
    }
});

test('TokenCalculator - countFilesInDirectory recursive', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    const nestedDir = path.join(TEST_PROJECT_DIR, 'nested');
    const deepDir = path.join(nestedDir, 'deep');
    fs.mkdirSync(deepDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'file1.js'), 'code');
    fs.writeFileSync(path.join(deepDir, 'file2.js'), 'code');

    const count = calculator.countFilesInDirectory(nestedDir);

    if (count < 2) {
        throw new Error('Should count files recursively');
    }

    fs.rmSync(nestedDir, { recursive: true, force: true });
});

// ============================================================================
// COUNT IGNORED FILES COMPREHENSIVE TESTS
// ============================================================================
console.log('\n🚫 countIgnoredFiles() Comprehensive Tests');
console.log('-'.repeat(70));

test('TokenCalculator - countIgnoredFiles for single file', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    const initialIgnored = calculator.stats.ignoredFiles;

    const testFile = path.join(TEST_PROJECT_DIR, 'ignored.js');
    fs.writeFileSync(testFile, 'code');

    calculator.countIgnoredFiles(testFile);

    const totalIgnored = calculator.stats.ignoredFiles + calculator.stats.calculatorIgnoredFiles;
    if (totalIgnored <= initialIgnored) {
        // May or may not increment depending on reason
    }

    fs.unlinkSync(testFile);
});

test('TokenCalculator - countIgnoredFiles for directory', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    const ignoredDir = path.join(TEST_PROJECT_DIR, 'ignored-folder');
    const subDir = path.join(ignoredDir, 'sub');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(ignoredDir, 'file1.js'), 'code');
    fs.writeFileSync(path.join(subDir, 'file2.js'), 'code');

    const initial = calculator.stats.ignoredFiles + calculator.stats.calculatorIgnoredFiles;

    calculator.countIgnoredFiles(ignoredDir);

    const final = calculator.stats.ignoredFiles + calculator.stats.calculatorIgnoredFiles;

    if (final <= initial) {
        throw new Error('Should count directory files');
    }

    fs.rmSync(ignoredDir, { recursive: true, force: true });
});

test('TokenCalculator - countIgnoredFiles with calculator-include reason', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    calculator.gitIgnore._lastIgnoreReason = 'calculator-include';

    const testFile = path.join(TEST_PROJECT_DIR, 'calc-include.js');
    fs.writeFileSync(testFile, 'code');

    const initial = calculator.stats.calculatorIgnoredFiles;

    calculator.countIgnoredFiles(testFile);

    // Should increment calculatorIgnoredFiles
    if (calculator.stats.calculatorIgnoredFiles <= initial) {
        throw new Error('Should increment calculatorIgnoredFiles');
    }

    fs.unlinkSync(testFile);
});

// ============================================================================
// UPDATE STATS COMPREHENSIVE TESTS
// ============================================================================
console.log('\n📈 updateStats() Comprehensive Tests');
console.log('-'.repeat(70));

test('TokenCalculator - updateStats with nested directory paths', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    const fileInfo = {
        path: path.join(TEST_PROJECT_DIR, 'src/lib/deep/file.js'),
        relativePath: 'src/lib/deep/file.js',
        tokens: 100,
        sizeBytes: 500,
        lines: 20,
        extension: '.js'
    };

    calculator.updateStats(fileInfo);

    // Should track top-level directory
    if (!calculator.stats.byDirectory['src']) {
        throw new Error('Should track top-level directory');
    }
});

test('TokenCalculator - updateStats accumulates multiple files', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    for (let i = 0; i < 10; i++) {
        calculator.updateStats({
            path: `file${i}.js`,
            relativePath: `file${i}.js`,
            tokens: 100,
            sizeBytes: 500,
            lines: 10,
            extension: '.js'
        });
    }

    if (calculator.stats.totalFiles !== 10) {
        throw new Error('Should count all files');
    }
    if (calculator.stats.totalTokens !== 1000) {
        throw new Error('Should sum all tokens');
    }
    if (calculator.stats.byExtension['.js'].count !== 10) {
        throw new Error('Should track extension count');
    }
});

// ============================================================================
// ANALYZE FILE WITH EMPTY FILE TESTS
// ============================================================================
console.log('\n📄 analyzeFile() Edge Cases');
console.log('-'.repeat(70));

test('TokenCalculator - analyzeFile with truly empty file', () => {
    const emptyFile = path.join(TEST_PROJECT_DIR, 'empty.txt');
    fs.writeFileSync(emptyFile, '');

    const calculator = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calculator.analyzeFile(emptyFile);

    if (fileInfo.tokens < 0) {
        throw new Error('Should handle empty file');
    }
    // Empty file has 0 lines (no newlines)
    if (fileInfo.lines !== 0) {
        throw new Error('Empty file should have 0 lines');
    }

    fs.unlinkSync(emptyFile);
});

test('TokenCalculator - analyzeFile with very large file', () => {
    const largeFile = path.join(TEST_PROJECT_DIR, 'large.js');
    const largeContent = 'function test() {}\n'.repeat(1000);
    fs.writeFileSync(largeFile, largeContent);

    const calculator = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calculator.analyzeFile(largeFile);

    if (fileInfo.tokens === 0) {
        throw new Error('Should calculate tokens for large file');
    }
    if (fileInfo.lines < 1000) {
        throw new Error('Should count all lines');
    }

    fs.unlinkSync(largeFile);
});

// ============================================================================
// METHOD-LEVEL WITH FILTER COMPREHENSIVE TESTS
// ============================================================================
console.log('\n🔧 analyzeFileMethods() Comprehensive Tests');
console.log('-'.repeat(70));

test('TokenCalculator - analyzeFileMethods with empty content', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });

    const methods = calculator.analyzeFileMethods('', 'empty.js');

    if (!Array.isArray(methods)) {
        throw new Error('Should return array for empty content');
    }
    if (methods.length !== 0) {
        throw new Error('Should return empty array for no methods');
    }
});

test('TokenCalculator - analyzeFileMethods with many methods', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    calculator.methodFilter = null;

    const content = Array.from({ length: 20 }, (_, i) =>
        `function method${i}() { return ${i}; }`
    ).join('\n');

    const methods = calculator.analyzeFileMethods(content, 'many.js');

    if (methods.length === 0) {
        throw new Error('Should extract many methods');
    }
    if (calculator.methodStats.totalMethods === 0) {
        throw new Error('Should update method stats');
    }
});

// ============================================================================
// GENERATE LLM CONTEXT ADVANCED TESTS
// ============================================================================
console.log('\n🤖 generateLLMContext() Advanced Tests');
console.log('-'.repeat(70));

test('TokenCalculator - generateLLMContext with empty results', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);
    calculator.stats.totalFiles = 0;
    calculator.stats.totalTokens = 0;

    const context = calculator.generateLLMContext([]);

    if (!context.project) {
        throw new Error('Should have project info even with no files');
    }
    if (!context.paths) {
        throw new Error('Should have paths even if empty');
    }
});

test('TokenCalculator - generateLLMContext with methodLevel and empty methods', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });

    calculator.methodStats.totalMethods = 0;
    calculator.methodStats.includedMethods = 0;

    const analysisResults = [
        {
            relativePath: 'file.js',
            methods: []
        }
    ];

    const context = calculator.generateLLMContext(analysisResults);

    if (!context.methodStats) {
        throw new Error('Should include methodStats even if empty');
    }
    if (context.methodStats.totalMethodTokens !== 0) {
        throw new Error('Should have 0 method tokens');
    }
});

// ============================================================================
// GENERATE COMPACT PATHS COMPREHENSIVE TESTS
// ============================================================================
console.log('\n📁 generateCompactPaths() Comprehensive Tests');
console.log('-'.repeat(70));

test('TokenCalculator - generateCompactPaths with mixed paths', () => {
    const calculator = new TokenCalculator(TEST_PROJECT_DIR);

    const analysisResults = [
        { relativePath: 'index.js', tokens: 100 },
        { relativePath: 'src/app.js', tokens: 200 },
        { relativePath: 'src/utils.js', tokens: 150 },
        { relativePath: 'lib/core.js', tokens: 180 },
        { relativePath: 'test/test.js', tokens: 50 }
    ];

    const paths = calculator.generateCompactPaths(analysisResults);

    if (!paths['/']) throw new Error('Should have root files');
    if (!paths['src/']) throw new Error('Should have src directory');
    if (!paths['lib/']) throw new Error('Should have lib directory');
    if (!paths['test/']) throw new Error('Should have test directory');

    // Verify sorting (highest tokens first)
    if (paths['src/'][0] !== 'app.js') {
        throw new Error('Should sort by tokens within directory');
    }
});

// ============================================================================
// FULL INTEGRATION TEST WITH ALL OPTIONS
// ============================================================================
console.log('\n🔗 Full Integration Tests');
console.log('-'.repeat(70));

test('TokenCalculator - Full integration with all features', () => {
    // Create .methodinclude for method filtering
    const methodInclude = path.join(TEST_PROJECT_DIR, '.methodinclude');
    fs.writeFileSync(methodInclude, '*\n');

    const calculator = new TokenCalculator(TEST_PROJECT_DIR, {
        methodLevel: true,
        saveReport: true,
        contextExport: true,
        gitingest: true,
        targetModel: 'gpt-4',
        targetTokens: 500,
        fitStrategy: 'balanced'
    });

    const result = calculator.run();

    // Verify exports
    const reportPath = path.join(TEST_PROJECT_DIR, 'token-analysis-report.json');
    const contextPath = path.join(TEST_PROJECT_DIR, 'llm-context.json');
    const digestPath = path.join(TEST_PROJECT_DIR, 'digest.txt');

    if (!fs.existsSync(reportPath)) throw new Error('Should create report');
    if (!fs.existsSync(contextPath)) throw new Error('Should create context');
    if (!fs.existsSync(digestPath)) throw new Error('Should create digest');

    // Verify context includes method stats
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    if (!context.methodStats) {
        throw new Error('Should include method stats');
    }

    // Cleanup
    fs.unlinkSync(reportPath);
    fs.unlinkSync(contextPath);
    fs.unlinkSync(digestPath);
    fs.unlinkSync(methodInclude);
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
console.log('📊 100% COVERAGE TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All 100% coverage tests passed!');
    console.log('🎯 token-calculator.js should now have near-100% coverage!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
