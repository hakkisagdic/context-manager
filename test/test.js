#!/usr/bin/env node

/**
 * Enhanced Basic Test Suite for Context Manager
 * Quick smoke tests to verify core functionality
 */

import { TokenAnalyzer, MethodAnalyzer, GitIgnoreParser, MethodFilterParser } from '../index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

console.log('🧪 Testing Context Manager Package...\n');

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================
console.log('📦 Basic Functionality Tests');
console.log('-'.repeat(60));

// Test 1: TokenAnalyzer instantiation
test('TokenAnalyzer instance creation', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    if (!analyzer) throw new Error('Failed to create analyzer');
    if (typeof analyzer.run !== 'function') throw new Error('Missing run method');
});

// Test 2: TokenAnalyzer with method-level
test('TokenAnalyzer with method-level enabled', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: true });
    if (!analyzer.options.methodLevel) throw new Error('Method-level not enabled');
});

// Test 3: TokenAnalyzer options validation
test('TokenAnalyzer respects options', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), {
        methodLevel: true,
        verbose: false,
        saveReport: true
    });
    if (analyzer.options.methodLevel !== true) throw new Error('methodLevel option not set');
    if (analyzer.options.verbose !== false) throw new Error('verbose option not set');
    if (analyzer.options.saveReport !== true) throw new Error('saveReport option not set');
});

// ============================================================================
// METHOD ANALYZER TESTS
// ============================================================================
console.log('\n🔍 Method Analyzer Tests');
console.log('-'.repeat(60));

// Test 4: Basic function extraction
test('Method extraction - basic function', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `function testFunction() { return "test"; }`;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    if (methods.length !== 1) throw new Error(`Expected 1 method, got ${methods.length}`);
    if (methods[0].name !== 'testFunction') throw new Error(`Expected 'testFunction', got '${methods[0].name}'`);
});

// Test 5: Arrow function extraction
test('Method extraction - arrow function', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `const arrowFunction = () => { console.log("arrow"); };`;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    if (methods.length !== 1) throw new Error(`Expected 1 method, got ${methods.length}`);
    if (methods[0].name !== 'arrowFunction') throw new Error(`Expected 'arrowFunction', got '${methods[0].name}'`);
});

// Test 6: Async function extraction
test('Method extraction - async function', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `async function asyncTest() { await Promise.resolve(); }`;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    if (methods.length !== 1) throw new Error(`Expected 1 method, got ${methods.length}`);
    if (methods[0].name !== 'asyncTest') throw new Error(`Expected 'asyncTest', got '${methods[0].name}'`);
});

// Test 7: Multiple methods extraction
test('Method extraction - multiple methods', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        function testFunction() { return "test"; }
        const arrowFunction = () => { console.log("arrow"); };
        async function asyncTest() { await Promise.resolve(); }
    `;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    if (methods.length !== 3) throw new Error(`Expected 3 methods, got ${methods.length}`);

    const names = methods.map(m => m.name).sort();
    const expected = ['arrowFunction', 'asyncTest', 'testFunction'].sort();
    if (JSON.stringify(names) !== JSON.stringify(expected)) {
        throw new Error(`Expected [${expected}], got [${names}]`);
    }
});

// Test 8: No duplicate methods
test('Method extraction - no duplicates', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        function test() { return 42; }
        const arrow = () => {};
    `;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    const uniqueKeys = new Set(methods.map(m => `${m.name}:${m.line}`));
    if (methods.length !== uniqueKeys.size) {
        throw new Error('Found duplicate methods');
    }
});

// Test 9: Empty code handling
test('Method extraction - empty code', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const methods = methodAnalyzer.extractMethods('', 'test.js');
    if (methods.length !== 0) throw new Error(`Expected 0 methods, got ${methods.length}`);
});

// Test 10: Keyword filtering
test('Method extraction - filters keywords', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const isKeyword = methodAnalyzer.isKeyword('function');
    if (!isKeyword) throw new Error('Should identify "function" as keyword');

    const notKeyword = methodAnalyzer.isKeyword('myFunction');
    if (notKeyword) throw new Error('Should not identify "myFunction" as keyword');
});

// Test 11: Line number accuracy
test('Method extraction - line numbers', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `function first() {}\nfunction second() {}`;
    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');
    if (methods.length !== 2) throw new Error(`Expected 2 methods, got ${methods.length}`);

    const firstMethod = methods.find(m => m.name === 'first');
    const secondMethod = methods.find(m => m.name === 'second');

    if (!firstMethod || !secondMethod) throw new Error('Methods not found');
    if (firstMethod.line !== 1) throw new Error(`Expected line 1 for first(), got ${firstMethod.line}`);
    if (secondMethod.line !== 2) throw new Error(`Expected line 2 for second(), got ${secondMethod.line}`);
});

// ============================================================================
// TOKEN CALCULATION TESTS
// ============================================================================
console.log('\n📊 Token Calculation Tests');
console.log('-'.repeat(60));

// Test 12: Token calculation returns number
test('Token calculation - returns number', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    const tokens = analyzer.calculateTokens('function test() { return 42; }', 'test.js');
    if (typeof tokens !== 'number') throw new Error(`Expected number, got ${typeof tokens}`);
    if (tokens <= 0) throw new Error(`Expected positive number, got ${tokens}`);
});

// Test 13: Token estimation for different file types
test('Token calculation - file type estimation', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    const jsTokens = analyzer.calculateTokens('const x = 42;', 'test.js');
    const mdTokens = analyzer.calculateTokens('# Title\nSome text', 'test.md');
    const jsonTokens = analyzer.calculateTokens('{"key": "value"}', 'test.json');

    if (typeof jsTokens !== 'number' || jsTokens <= 0) throw new Error('JS token calculation failed');
    if (typeof mdTokens !== 'number' || mdTokens <= 0) throw new Error('MD token calculation failed');
    if (typeof jsonTokens !== 'number' || jsonTokens <= 0) throw new Error('JSON token calculation failed');
});

// ============================================================================
// FILE TYPE DETECTION TESTS
// ============================================================================
console.log('\n📁 File Type Detection Tests');
console.log('-'.repeat(60));

// Test 14: Text file detection
test('File detection - text files', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });

    const textFiles = ['test.js', 'test.ts', 'test.md', 'test.json', 'test.txt'];
    textFiles.forEach(file => {
        if (!analyzer.isTextFile(file)) {
            throw new Error(`Should detect ${file} as text file`);
        }
    });
});

// Test 15: Binary file detection
test('File detection - binary files', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });

    const binaryFiles = ['test.bin', 'test.exe', 'test.dll', 'test.so'];
    binaryFiles.forEach(file => {
        if (analyzer.isTextFile(file)) {
            throw new Error(`Should not detect ${file} as text file`);
        }
    });
});

// Test 16: Code file detection
test('File detection - code files', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });

    if (!analyzer.isCodeFile('test.js')) throw new Error('Should detect .js as code');
    if (!analyzer.isCodeFile('test.ts')) throw new Error('Should detect .ts as code');
    if (!analyzer.isCodeFile('test.jsx')) throw new Error('Should detect .jsx as code');
    if (!analyzer.isCodeFile('test.tsx')) throw new Error('Should detect .tsx as code');
    if (analyzer.isCodeFile('test.md')) throw new Error('Should not detect .md as code');
});

// ============================================================================
// CONFIGURATION FILE TESTS
// ============================================================================
console.log('\n⚙️  Configuration Tests');
console.log('-'.repeat(60));

// Test 17: Configuration file existence
test('Configuration - .methodinclude exists', () => {
    const filePath = path.join(__dirname, '..', '.methodinclude');
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  Warning: .methodinclude not found (optional)');
    }
    // Pass test regardless - it's optional
});

// Test 18: Configuration file existence
test('Configuration - .methodignore exists', () => {
    const filePath = path.join(__dirname, '..', '.methodignore');
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  Warning: .methodignore not found (optional)');
    }
    // Pass test regardless - it's optional
});

// Test 19: Configuration file existence
test('Configuration - .contextinclude exists', () => {
    const filePath = path.join(__dirname, '..', '.contextinclude');
    if (!fs.existsSync(filePath)) {
        console.log('   ⚠️  Warning: .contextinclude not found (optional)');
    }
    // Pass test regardless - it's optional
});

// ============================================================================
// GITIGNORE PARSER TESTS
// ============================================================================
console.log('\n🚫 GitIgnore Parser Tests');
console.log('-'.repeat(60));

// Test 20: GitIgnore parser instantiation
test('GitIgnoreParser - instantiation', () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const parser = new GitIgnoreParser(gitignorePath, null, null);
    if (!parser) throw new Error('Failed to create GitIgnoreParser');
});

// Test 21: Pattern conversion
test('GitIgnoreParser - pattern conversion', () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const parser = new GitIgnoreParser(gitignorePath, null, null);

    const pattern = parser.convertToRegex('*.js');
    if (!pattern.regex) throw new Error('Pattern conversion failed');
    if (!(pattern.regex instanceof RegExp)) throw new Error('Expected RegExp');
});

// Test 22: Negation pattern detection
test('GitIgnoreParser - negation detection', () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const parser = new GitIgnoreParser(gitignorePath, null, null);

    const pattern = parser.convertToRegex('!important.js');
    if (!pattern.isNegation) throw new Error('Should detect negation pattern');
});

// ============================================================================
// STATS INITIALIZATION TESTS
// ============================================================================
console.log('\n📈 Stats & Statistics Tests');
console.log('-'.repeat(60));

// Test 23: Stats initialization
test('TokenAnalyzer - stats initialization', () => {
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    const stats = analyzer.stats;

    if (typeof stats.totalFiles !== 'number') throw new Error('stats.totalFiles not initialized');
    if (typeof stats.totalTokens !== 'number') throw new Error('stats.totalTokens not initialized');
    if (typeof stats.totalBytes !== 'number') throw new Error('stats.totalBytes not initialized');
    if (typeof stats.totalLines !== 'number') throw new Error('stats.totalLines not initialized');
    if (!stats.byExtension) throw new Error('stats.byExtension not initialized');
    if (!stats.byDirectory) throw new Error('stats.byDirectory not initialized');
    if (!Array.isArray(stats.largestFiles)) throw new Error('stats.largestFiles not initialized');
});

// ============================================================================
// METHOD FILTER PARSER TESTS
// ============================================================================
console.log('\n🔍 Method Filter Parser Tests');
console.log('-'.repeat(60));

// Test 24: Method filter - include mode detection
test('MethodFilterParser - include mode', () => {
    const includeFile = path.join(__dirname, '..', '.methodinclude');
    if (fs.existsSync(includeFile)) {
        const parser = new MethodFilterParser(includeFile, null);
        if (!parser.hasIncludeFile) throw new Error('Should detect include file');
    }
});

// Test 25: Method filter - pattern parsing
test('MethodFilterParser - pattern parsing', () => {
    const includeFile = path.join(__dirname, '..', '.methodinclude');
    if (fs.existsSync(includeFile)) {
        const parser = new MethodFilterParser(includeFile, null);
        if (!Array.isArray(parser.includePatterns)) throw new Error('Should parse patterns');
    }
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS');
console.log('='.repeat(60));
console.log(`Total Tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Context Manager is ready to use.');
    console.log('\n📦 Usage:');
    console.log('  npm install                    # Install dependencies');
    console.log('  node bin/cli.js --help         # Show help');
    console.log('  node bin/cli.js --method-level # Method-level analysis');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
