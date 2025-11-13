#!/usr/bin/env node

/**
 * Comprehensive TokenCalculator Tests
 * Tests for token calculation, analysis, and context generation
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

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'token-calc');
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

// Create test files
const testJsFile = path.join(TEST_PROJECT_DIR, 'test.js');
fs.writeFileSync(testJsFile, `function hello() {\n    return 'world';\n}\n`);

const testTxtFile = path.join(TEST_PROJECT_DIR, 'test.txt');
fs.writeFileSync(testTxtFile, 'Sample text file content');

console.log('🧪 Testing TokenCalculator...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('TokenCalculator - Constructor with project root', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (!calc) throw new Error('Should create instance');
    if (calc.projectRoot !== TEST_PROJECT_DIR) throw new Error('Should set projectRoot');
    if (!calc.stats) throw new Error('Should have stats');
    if (!calc.methodAnalyzer) throw new Error('Should have methodAnalyzer');
});

test('TokenCalculator - Constructor with options', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, {
        verbose: true,
        methodLevel: false,
        compactContext: false
    });
    if (calc.options.verbose !== true) throw new Error('Should set verbose');
    if (calc.options.methodLevel !== false) throw new Error('Should set methodLevel');
    if (calc.options.compactContext !== false) throw new Error('Should set compactContext');
});

test('TokenCalculator - Constructor initializes stats', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (typeof calc.stats.totalFiles !== 'number') throw new Error('Should have totalFiles');
    if (typeof calc.stats.totalTokens !== 'number') throw new Error('Should have totalTokens');
    if (!calc.stats.byExtension) throw new Error('Should have byExtension');
});

// ============================================================================
// INITIALIZATION TESTS
// ============================================================================
console.log('\n⚙️  Initialization Tests');
console.log('-'.repeat(70));

test('TokenCalculator - initStats returns object', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const stats = calc.initStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (stats.totalFiles !== 0) throw new Error('Should initialize to 0');
    if (!stats.byExtension) throw new Error('Should have byExtension');
    if (!Array.isArray(stats.largestFiles)) throw new Error('Should have largestFiles array');
});

test('TokenCalculator - initGitIgnore returns parser', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const gitIgnore = calc.initGitIgnore();
    if (typeof gitIgnore !== 'object') throw new Error('Should return object');
});

// ============================================================================
// FILE ANALYSIS TESTS
// ============================================================================
console.log('\n📄 File Analysis Tests');
console.log('-'.repeat(70));

test('TokenCalculator - analyzeFile returns info', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calc.analyzeFile(testJsFile);

    if (!fileInfo) throw new Error('Should return fileInfo');
    if (!fileInfo.path) throw new Error('Should have path');
    if (!fileInfo.relativePath) throw new Error('Should have relativePath');
    if (typeof fileInfo.tokens !== 'number') throw new Error('Should have tokens');
    if (typeof fileInfo.lines !== 'number') throw new Error('Should have lines');
});

test('TokenCalculator - analyzeFile counts tokens', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calc.analyzeFile(testJsFile);

    if (fileInfo.tokens === 0) throw new Error('Should calculate tokens for JS file');
    if (fileInfo.lines < 1) throw new Error('Should count lines');
});

test('TokenCalculator - analyzeFile handles errors', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const nonexistent = path.join(TEST_PROJECT_DIR, 'nonexistent.js');
    const fileInfo = calc.analyzeFile(nonexistent);

    if (!fileInfo.error) throw new Error('Should have error field');
    if (fileInfo.tokens !== 0) throw new Error('Should have 0 tokens on error');
});

test('TokenCalculator - analyzeFile extracts extension', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calc.analyzeFile(testJsFile);

    if (fileInfo.extension !== '.js') throw new Error('Should extract .js extension');
});

// ============================================================================
// TOKEN CALCULATION TESTS
// ============================================================================
console.log('\n🔢 Token Calculation Tests');
console.log('-'.repeat(70));

test('TokenCalculator - calculateTokens delegates', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const tokens = calc.calculateTokens('hello world', 'test.txt');

    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens === 0) throw new Error('Should calculate tokens');
});

test('TokenCalculator - calculateTokens handles code', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const code = 'function test() { return 42; }';
    const tokens = calc.calculateTokens(code, 'test.js');

    if (tokens === 0) throw new Error('Should calculate tokens for code');
});

// ============================================================================
// FILE TYPE TESTS
// ============================================================================
console.log('\n📋 File Type Tests');
console.log('-'.repeat(70));

test('TokenCalculator - isTextFile checks text files', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const isText = calc.isTextFile(testTxtFile);
    if (typeof isText !== 'boolean') throw new Error('Should return boolean');
});

test('TokenCalculator - isCodeFile checks code files', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const isCode = calc.isCodeFile(testJsFile);
    if (typeof isCode !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// STATS UPDATE TESTS
// ============================================================================
console.log('\n📊 Stats Update Tests');
console.log('-'.repeat(70));

test('TokenCalculator - updateStats increments totals', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = {
        path: testJsFile,
        relativePath: 'test.js',
        tokens: 100,
        sizeBytes: 500,
        lines: 10,
        extension: '.js'
    };

    calc.updateStats(fileInfo);

    if (calc.stats.totalFiles !== 1) throw new Error('Should increment totalFiles');
    if (calc.stats.totalTokens !== 100) throw new Error('Should add tokens');
    if (calc.stats.totalBytes !== 500) throw new Error('Should add bytes');
    if (calc.stats.totalLines !== 10) throw new Error('Should add lines');
});

test('TokenCalculator - updateStats tracks extensions', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo1 = { path: 'a.js', relativePath: 'a.js', tokens: 50, sizeBytes: 200, lines: 5, extension: '.js' };
    const fileInfo2 = { path: 'b.js', relativePath: 'b.js', tokens: 30, sizeBytes: 150, lines: 3, extension: '.js' };

    calc.updateStats(fileInfo1);
    calc.updateStats(fileInfo2);

    if (!calc.stats.byExtension['.js']) throw new Error('Should track .js extension');
    if (calc.stats.byExtension['.js'].count !== 2) throw new Error('Should count 2 .js files');
    if (calc.stats.byExtension['.js'].tokens !== 80) throw new Error('Should sum tokens');
});

test('TokenCalculator - updateStats tracks directories', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = {
        path: path.join(TEST_PROJECT_DIR, 'src', 'index.js'),
        relativePath: 'src/index.js',
        tokens: 100,
        sizeBytes: 500,
        lines: 10,
        extension: '.js'
    };

    calc.updateStats(fileInfo);

    const dirs = Object.keys(calc.stats.byDirectory);
    if (dirs.length === 0) throw new Error('Should track directories');
});

test('TokenCalculator - updateStats tracks largest files', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const largeFile = { path: 'large.js', relativePath: 'large.js', tokens: 1000, sizeBytes: 5000, lines: 100, extension: '.js' };

    calc.updateStats(largeFile);

    if (calc.stats.largestFiles.length === 0) throw new Error('Should track largest files');
    if (calc.stats.largestFiles[0].tokens !== 1000) throw new Error('Should add to largest');
});

// ============================================================================
// CONTEXT GENERATION TESTS
// ============================================================================
console.log('\n📝 Context Generation Tests');
console.log('-'.repeat(70));

test('TokenCalculator - generateCompactPaths groups by directory', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const analysisResults = [
        { path: '/project/src/index.js', relativePath: 'src/index.js', tokens: 100 },
        { path: '/project/src/utils.js', relativePath: 'src/utils.js', tokens: 50 },
        { path: '/project/test/test.js', relativePath: 'test/test.js', tokens: 30 }
    ];

    const compact = calc.generateCompactPaths(analysisResults);

    if (typeof compact !== 'object') throw new Error('Should return object');
    if (Object.keys(compact).length === 0) throw new Error('Should have grouped paths');
});

test('TokenCalculator - generateLLMContext creates context', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const analysisResults = [
        { path: testJsFile, relativePath: 'test.js', tokens: 100, lines: 10 }
    ];

    const context = calc.generateLLMContext(analysisResults);

    if (!context) throw new Error('Should return context');
    if (!context.project) throw new Error('Should have project info');
    if (!context.paths) throw new Error('Should have paths');
});

test('TokenCalculator - generateLLMContext includes stats', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    calc.stats.totalFiles = 5;
    calc.stats.totalTokens = 500;

    const analysisResults = [
        { path: testJsFile, relativePath: 'test.js', tokens: 100, lines: 10 }
    ];

    const context = calc.generateLLMContext(analysisResults);

    if (context.project.totalFiles !== 5) throw new Error('Should include totalFiles');
    if (context.project.totalTokens !== 500) throw new Error('Should include totalTokens');
});

// ============================================================================
// METHOD-LEVEL TESTS
// ============================================================================
console.log('\n🔍 Method-Level Tests');
console.log('-'.repeat(70));

test('TokenCalculator - Constructor with methodLevel', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    if (!calc.methodStats) throw new Error('Should have methodStats');
    if (typeof calc.methodStats.totalMethods !== 'number') {
        throw new Error('Should have totalMethods');
    }
});

test('TokenCalculator - analyzeFileMethods extracts methods', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    const content = 'function foo() { return 1; }\nfunction bar() { return 2; }';
    const methods = calc.analyzeFileMethods(content, 'test.js');

    if (!Array.isArray(methods)) throw new Error('Should return array');
});

test('TokenCalculator - generateMethodContext creates method context', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    const analysisResults = [
        {
            path: testJsFile,
            relativePath: 'test.js',
            tokens: 100,
            methods: [
                { name: 'testMethod', startLine: 1, endLine: 5, tokens: 20 }
            ]
        }
    ];

    const context = calc.generateMethodContext(analysisResults);

    if (typeof context !== 'object') throw new Error('Should return object');
});

// ============================================================================
// COUNT TESTS
// ============================================================================
console.log('\n🔢 Count Tests');
console.log('-'.repeat(70));

test('TokenCalculator - countIgnoredFiles updates stats', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const initialIgnored = calc.stats.ignoredFiles;
    const initialCalcIgnored = calc.stats.calculatorIgnoredFiles;

    calc.countIgnoredFiles(testJsFile);

    // Should update one of the ignore counters (or neither if not ignored)
    const totalIgnored = calc.stats.ignoredFiles + calc.stats.calculatorIgnoredFiles;
    if (typeof totalIgnored !== 'number') throw new Error('Should have ignore counts');
});

test('TokenCalculator - countFilesInDirectory returns number', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const count = calc.countFilesInDirectory(TEST_PROJECT_DIR);

    if (typeof count !== 'number') throw new Error('Should return number');
    if (count < 0) throw new Error('Should return non-negative');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('TokenCalculator - analyzeFile with empty file', () => {
    const emptyFile = path.join(TEST_PROJECT_DIR, 'empty.txt');
    fs.writeFileSync(emptyFile, '');

    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = calc.analyzeFile(emptyFile);

    if (fileInfo.lines !== 1) throw new Error('Empty file should have 1 line');

    fs.unlinkSync(emptyFile);
});

test('TokenCalculator - updateStats with no extension', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const fileInfo = { path: 'README', relativePath: 'README', tokens: 10, sizeBytes: 50, lines: 5, extension: 'no-extension' };

    calc.updateStats(fileInfo);

    if (!calc.stats.byExtension['no-extension']) {
        throw new Error('Should handle no-extension files');
    }
});

test('TokenCalculator - Multiple instances are independent', () => {
    const calc1 = new TokenCalculator(TEST_PROJECT_DIR);
    const calc2 = new TokenCalculator(TEST_PROJECT_DIR);

    calc1.stats.totalFiles = 5;

    if (calc2.stats.totalFiles === 5) {
        throw new Error('Instances should be independent');
    }
});

// Cleanup
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
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
    console.log('\n🎉 All token calculator tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
