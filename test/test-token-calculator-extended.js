#!/usr/bin/env node

/**
 * Extended TokenCalculator Tests
 * Tests for advanced features: scan, analyze, methods
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

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'token-calc-extended');
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
const testJsFile = path.join(TEST_PROJECT_DIR, 'app.js');
fs.writeFileSync(testJsFile, `function add(a, b) { return a + b; }\nmodule.exports = { add };\n`);

const testPyFile = path.join(TEST_PROJECT_DIR, 'utils.py');
fs.writeFileSync(testPyFile, `def greet(name):\n    return f"Hello {name}"\n`);

const contextIgnoreFile = path.join(TEST_PROJECT_DIR, '.contextignore');
fs.writeFileSync(contextIgnoreFile, 'node_modules/\n*.log\n');

console.log('🧪 Testing TokenCalculator Extended...\n');

// SCAN DIRECTORY TESTS
console.log('📂 Scan Directory Tests');
console.log('-'.repeat(70));

test('TokenCalculator - scanDirectory returns array', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const files = calc.scanDirectory(TEST_PROJECT_DIR);
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('TokenCalculator - scanDirectory finds files', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const files = calc.scanDirectory(TEST_PROJECT_DIR);
    if (files.length === 0) throw new Error('Should find files');
});

test('TokenCalculator - scanDirectory handles nested dirs', () => {
    const nestedDir = path.join(TEST_PROJECT_DIR, 'src');
    if (!fs.existsSync(nestedDir)) {
        fs.mkdirSync(nestedDir, { recursive: true });
        fs.writeFileSync(path.join(nestedDir, 'helper.js'), 'export const helper = () => {};\n');
    }
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const files = calc.scanDirectory(TEST_PROJECT_DIR);
    if (!files.some(f => f.includes('src'))) throw new Error('Should find nested files');
});

// IS CODE FILE TESTS
console.log('\n💻 Is Code File Tests');
console.log('-'.repeat(70));

test('TokenCalculator - isCodeFile detects JS', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (!calc.isCodeFile('app.js')) throw new Error('Should detect .js');
});

test('TokenCalculator - isCodeFile detects Python', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (!calc.isCodeFile('script.py')) throw new Error('Should detect .py');
});

test('TokenCalculator - isCodeFile rejects text', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (calc.isCodeFile('README.md')) throw new Error('Should not detect .md');
});

// CALCULATE TOKENS TESTS
console.log('\n🔢 Calculate Tokens Tests');
console.log('-'.repeat(70));

test('TokenCalculator - calculateTokens returns number', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const tokens = calc.calculateTokens('Hello', 'test.txt');
    if (typeof tokens !== 'number') throw new Error('Should return number');
});

test('TokenCalculator - calculateTokens varies by content', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const t1 = calc.calculateTokens('Hello', 'test.txt');
    const t2 = calc.calculateTokens('Hello world', 'test.txt');
    if (t2 <= t1) throw new Error('More content = more tokens');
});

// METHOD LEVEL TESTS
console.log('\n🔧 Method Level Tests');
console.log('-'.repeat(70));

test('TokenCalculator - methodLevel option', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    if (!calc.methodAnalyzer) throw new Error('Should init methodAnalyzer');
});

test('TokenCalculator - analyzeFileMethods returns array', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR, { methodLevel: true });
    const methods = calc.analyzeFileMethods('function test() {}', 'test.js');
    if (!Array.isArray(methods)) throw new Error('Should return array');
});

// COUNT FILES TESTS
console.log('\n📊 Count Files Tests');
console.log('-'.repeat(70));

test('TokenCalculator - countFilesInDirectory returns number', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const count = calc.countFilesInDirectory(TEST_PROJECT_DIR);
    if (typeof count !== 'number') throw new Error('Should return number');
});

test('TokenCalculator - countIgnoredFiles updates stats', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const initial = calc.stats.ignoredFiles;
    calc.countIgnoredFiles('node_modules/test.js');
    if (calc.stats.ignoredFiles <= initial) throw new Error('Should increment');
});

// ANALYZE FILE TESTS
console.log('\n📄 Analyze File Tests');
console.log('-'.repeat(70));

test('TokenCalculator - analyzeFile returns object', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const result = calc.analyzeFile(testJsFile);
    if (typeof result !== 'object') throw new Error('Should return object');
});

test('TokenCalculator - analyzeFile includes fields', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const result = calc.analyzeFile(testJsFile);
    if (!result.path || typeof result.tokens !== 'number') {
        throw new Error('Should have required fields');
    }
});

test('TokenCalculator - analyzeFile handles error', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const result = calc.analyzeFile('/nonexistent.js');
    if (!result.error) throw new Error('Should return error info');
});

// GENERATE CONTEXT TESTS
console.log('\n🤖 Generate Context Tests');
console.log('-'.repeat(70));

test('TokenCalculator - generateLLMContext accepts array', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const mockResults = [{ relativePath: 'test.js', tokens: 100 }];
    const context = calc.generateLLMContext(mockResults);
    if (typeof context !== 'string') throw new Error('Should return string');
});

test('TokenCalculator - generateLLMContext is valid JSON', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const mockResults = [{ relativePath: 'test.js', tokens: 100 }];
    const context = calc.generateLLMContext(mockResults);
    JSON.parse(context); // Will throw if invalid
});

test('TokenCalculator - generateCompactPaths groups files', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const mockResults = [
        { relativePath: 'src/app.js', tokens: 100 },
        { relativePath: 'src/util.js', tokens: 200 }
    ];
    const paths = calc.generateCompactPaths(mockResults);
    if (typeof paths !== 'object') throw new Error('Should return object');
});

// EDGE CASES
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('TokenCalculator - stats initialization', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    if (calc.stats.totalFiles !== 0) throw new Error('Should init to 0');
});

test('TokenCalculator - initStats creates all fields', () => {
    const calc = new TokenCalculator(TEST_PROJECT_DIR);
    const stats = calc.initStats();
    if (!stats.byExtension || !stats.byDirectory) {
        throw new Error('Should have all fields');
    }
});

test('TokenCalculator - multiple instances independent', () => {
    const c1 = new TokenCalculator(TEST_PROJECT_DIR);
    const c2 = new TokenCalculator(TEST_PROJECT_DIR);
    c1.stats.totalFiles = 100;
    if (c2.stats.totalFiles === 100) throw new Error('Should be independent');
});

// CLEANUP
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test fixtures');
}

// RESULTS
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All token calculator extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
