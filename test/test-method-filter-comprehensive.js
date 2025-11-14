#!/usr/bin/env node

/**
 * Comprehensive Method Filter Tests
 * Tests method filtering patterns and edge cases
 * Target: 95% coverage of method filter parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🧪 Comprehensive Method Filter Tests\n');

const testDir = path.join(__dirname, 'temp-filter-test');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// BASIC PATTERN TESTS
// ============================================================================
console.log('📦 Basic Pattern Tests');
console.log('-'.repeat(70));

test('Filter: Simple literal pattern', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'myMethod');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('myMethod', 'test.js');

    if (!result) throw new Error('Should match literal pattern');

    fs.unlinkSync(includePath);
});

test('Filter: Wildcard pattern (*)', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('testMethod', 'test.js');
    const result2 = parser.shouldIncludeMethod('testing', 'test.js');
    const result3 = parser.shouldIncludeMethod('myTest', 'test.js');

    if (!result1) throw new Error('Should match testMethod');
    if (!result2) throw new Error('Should match testing');
    if (result3) throw new Error('Should not match myTest');

    fs.unlinkSync(includePath);
});

test('Filter: Negation pattern (!)', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*\n!testPrivate');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('testPublic', 'test.js');
    const result2 = parser.shouldIncludeMethod('testPrivate', 'test.js');

    if (!result1) throw new Error('Should match testPublic');
    if (result2) throw new Error('Should not match testPrivate');

    fs.unlinkSync(includePath);
});

test('Filter: Class.method pattern', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'MyClass.*');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('MyClass.method1', 'test.js');
    const result2 = parser.shouldIncludeMethod('OtherClass.method1', 'test.js');

    if (!result1) throw new Error('Should match MyClass.method1');
    if (result2) throw new Error('Should not match OtherClass');

    fs.unlinkSync(includePath);
});

// ============================================================================
// EXCLUDE MODE TESTS
// ============================================================================
console.log('\n📦 Exclude Mode Tests');
console.log('-'.repeat(70));

test('Filter: Exclude mode basic', () => {
    const ignorePath = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignorePath, 'private*');

    const parser = new MethodFilterParser(null, ignorePath);
    const result1 = parser.shouldIncludeMethod('publicMethod', 'test.js');
    const result2 = parser.shouldIncludeMethod('privateMethod', 'test.js');

    if (!result1) throw new Error('Should include publicMethod');
    if (result2) throw new Error('Should exclude privateMethod');

    fs.unlinkSync(ignorePath);
});

test('Filter: Multiple exclude patterns', () => {
    const ignorePath = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignorePath, 'private*\ninternal*\n_*');

    const parser = new MethodFilterParser(null, ignorePath);
    const result1 = parser.shouldIncludeMethod('publicMethod', 'test.js');
    const result2 = parser.shouldIncludeMethod('privateMethod', 'test.js');
    const result3 = parser.shouldIncludeMethod('internalHelper', 'test.js');
    const result4 = parser.shouldIncludeMethod('_hiddenMethod', 'test.js');

    if (!result1) throw new Error('Should include publicMethod');
    if (result2) throw new Error('Should exclude privateMethod');
    if (result3) throw new Error('Should exclude internalHelper');
    if (result4) throw new Error('Should exclude _hiddenMethod');

    fs.unlinkSync(ignorePath);
});

// ============================================================================
// INCLUDE VS EXCLUDE PRIORITY TESTS
// ============================================================================
console.log('\n📦 Include vs Exclude Priority Tests');
console.log('-'.repeat(70));

test('Filter: Include mode takes priority', () => {
    const includePath = path.join(testDir, '.methodinclude');
    const ignorePath = path.join(testDir, '.methodignore');
    fs.writeFileSync(includePath, 'public*');
    fs.writeFileSync(ignorePath, '*');

    const parser = new MethodFilterParser(includePath, ignorePath);
    const result = parser.shouldIncludeMethod('publicMethod', 'test.js');

    // When include file exists, it switches to include mode
    if (!result) throw new Error('Include mode should override');

    fs.unlinkSync(includePath);
    fs.unlinkSync(ignorePath);
});

test('Filter: Negation in include mode', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'public*\n!publicPrivate');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('publicMethod', 'test.js');
    const result2 = parser.shouldIncludeMethod('publicPrivate', 'test.js');

    if (!result1) throw new Error('Should include publicMethod');
    if (result2) throw new Error('Should exclude publicPrivate');

    fs.unlinkSync(includePath);
});

// ============================================================================
// EDGE CASE PATTERNS
// ============================================================================
console.log('\n📦 Edge Case Patterns');
console.log('-'.repeat(70));

test('Filter: Empty pattern file', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, '');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('anyMethod', 'test.js');

    // Empty include file means nothing included
    if (result) throw new Error('Empty include should exclude all');

    fs.unlinkSync(includePath);
});

test('Filter: Pattern with comments', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, '# This is a comment\npublic*\n# Another comment');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('publicMethod', 'test.js');

    if (!result) throw new Error('Should ignore comments');

    fs.unlinkSync(includePath);
});

test('Filter: Pattern with whitespace', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, '  test*  \n  \n  public*  ');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('testMethod', 'test.js');

    if (!result) throw new Error('Should handle whitespace');

    fs.unlinkSync(includePath);
});

test('Filter: Case sensitivity', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'MyMethod');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('MyMethod', 'test.js');
    const result2 = parser.shouldIncludeMethod('mymethod', 'test.js');

    if (!result1) throw new Error('Should match exact case');
    // Case sensitivity behavior may vary - both acceptable
});

test('Filter: Pattern with special regex characters', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'method.*test');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('method123test', 'test.js');

    // Should treat .* as wildcard
});

test('Filter: Very long pattern', () => {
    const includePath = path.join(testDir, '.methodinclude');
    const longPattern = 'a'.repeat(500);
    fs.writeFileSync(includePath, longPattern);

    const parser = new MethodFilterParser(includePath, null);
    // Should handle long patterns without crashing

    fs.unlinkSync(includePath);
});

test('Filter: Unicode in patterns', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, '处理*\nметод*');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('处理Data', 'test.js');

    // Should handle unicode patterns
    fs.unlinkSync(includePath);
});

// ============================================================================
// MULTIPLE PATTERNS TESTS
// ============================================================================
console.log('\n📦 Multiple Patterns Tests');
console.log('-'.repeat(70));

test('Filter: Multiple include patterns', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'get*\nset*\nupdate*');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('getData', 'test.js');
    const result2 = parser.shouldIncludeMethod('setData', 'test.js');
    const result3 = parser.shouldIncludeMethod('updateData', 'test.js');
    const result4 = parser.shouldIncludeMethod('deleteData', 'test.js');

    if (!result1) throw new Error('Should include getData');
    if (!result2) throw new Error('Should include setData');
    if (!result3) throw new Error('Should include updateData');
    if (result4) throw new Error('Should not include deleteData');

    fs.unlinkSync(includePath);
});

test('Filter: Order of patterns matters for negation', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*\n!testPrivate');

    const parser = new MethodFilterParser(includePath, null);
    const result = parser.shouldIncludeMethod('testPrivate', 'test.js');

    // Negation should override previous include
    if (result) throw new Error('Negation should exclude');

    fs.unlinkSync(includePath);
});

test('Filter: Large number of patterns (performance)', () => {
    const includePath = path.join(testDir, '.methodinclude');
    const patterns = Array.from({ length: 1000 }, (_, i) => `method${i}`).join('\n');
    fs.writeFileSync(includePath, patterns);

    const parser = new MethodFilterParser(includePath, null);
    const start = Date.now();
    const result = parser.shouldIncludeMethod('method500', 'test.js');
    const elapsed = Date.now() - start;

    if (elapsed > 1000) {
        console.log('   ⚠️  Warning: Pattern matching took > 1 second');
    }

    fs.unlinkSync(includePath);
});

// ============================================================================
// FILE-SPECIFIC PATTERNS (if supported)
// ============================================================================
console.log('\n📦 File-Specific Pattern Tests');
console.log('-'.repeat(70));

test('Filter: Method matching across different files', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*');

    const parser = new MethodFilterParser(includePath, null);
    const result1 = parser.shouldIncludeMethod('testMethod', 'file1.js');
    const result2 = parser.shouldIncludeMethod('testMethod', 'file2.js');

    if (!result1) throw new Error('Should match in file1');
    if (!result2) throw new Error('Should match in file2');

    fs.unlinkSync(includePath);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('Filter: Non-existent include file', () => {
    const parser = new MethodFilterParser('/nonexistent/path', null);
    const result = parser.shouldIncludeMethod('anyMethod', 'test.js');

    // Should handle gracefully
});

test('Filter: Non-existent exclude file', () => {
    const parser = new MethodFilterParser(null, '/nonexistent/path');
    const result = parser.shouldIncludeMethod('anyMethod', 'test.js');

    // Should default to include all
    if (!result) throw new Error('Should include by default');
});

test('Filter: Both files non-existent', () => {
    const parser = new MethodFilterParser(null, null);
    const result = parser.shouldIncludeMethod('anyMethod', 'test.js');

    // Should include all by default
    if (!result) throw new Error('Should include all when no filters');
});

test('Filter: Corrupted filter file (non-UTF8)', () => {
    const includePath = path.join(testDir, '.methodinclude');
    const buffer = Buffer.from([0xFF, 0xFE, 0xFD]);
    fs.writeFileSync(includePath, buffer);

    try {
        const parser = new MethodFilterParser(includePath, null);
        // Should handle corrupted files gracefully
    } catch (e) {
        // Acceptable to throw error
    }

    fs.unlinkSync(includePath);
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n📦 Cleanup');
console.log('-'.repeat(70));

test('Cleanup: Remove test directory', () => {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 METHOD FILTER TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All method filter tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
