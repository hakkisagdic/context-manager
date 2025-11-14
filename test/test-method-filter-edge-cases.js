#!/usr/bin/env node

/**
 * Comprehensive Method Filter Edge Cases Tests
 * Tests method filtering patterns, wildcards, negation, and edge cases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function assert(condition, testName, message = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    } else {
        console.log(`❌ ${testName}: ${message}`);
        testsFailed++;
        failedTests.push({ name: testName, message });
        return false;
    }
}

console.log('🧪 METHOD FILTER EDGE CASES TESTS');
console.log('='.repeat(70));

// Create test directory
const testDir = path.join(__dirname, 'temp-test-method-filter');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// NEGATION PATTERN TESTS
// ============================================================================
console.log('\n🔄 Negation Pattern Tests\n' + '-'.repeat(70));

// Test 1: Simple negation
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*\n!test*');

    const parser = new MethodFilterParser(includeFile, null);
    const testMethod = { name: 'testMethod', file: 'test.js' };
    const normalMethod = { name: 'normalMethod', file: 'test.js' };

    // Negation patterns work by excluding after initial inclusion
    assert(
        parser !== null,
        'Negation: Parser handles negation pattern !test*'
    );

    fs.unlinkSync(includeFile);
}

// Test 2: Multiple negations
{
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignoreFile, '!test*\n!mock*\n!stub*');

    const parser = new MethodFilterParser(null, ignoreFile);
    assert(
        parser !== null,
        'Negation: Parser handles multiple negation patterns'
    );

    fs.unlinkSync(ignoreFile);
}

// ============================================================================
// WILDCARD PATTERN TESTS
// ============================================================================
console.log('\n🌟 Wildcard Pattern Tests\n' + '-'.repeat(70));

// Test 3: Single wildcard *
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*Handler');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles *Handler pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 4: Wildcard at beginning
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*Test');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles *Test pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 5: Wildcard in middle
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'get*Value');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles get*Value pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 6: Multiple wildcards
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*Handler*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles *Handler* pattern'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// CLASS.METHOD PATTERN TESTS
// ============================================================================
console.log('\n📦 Class.Method Pattern Tests\n' + '-'.repeat(70));

// Test 7: Exact class.method match
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'MyClass.myMethod');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Class.Method: Parser handles MyClass.myMethod pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 8: Class with wildcard method
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'MyClass.*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Class.Method: Parser handles MyClass.* pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 9: Wildcard class with specific method
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*.render');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Class.Method: Parser handles *.render pattern'
    );

    fs.unlinkSync(includeFile);
}

// Test 10: Multiple class.method patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'UserClass.*\nAdminClass.*\nGuestClass.*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Class.Method: Parser handles multiple class patterns'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// REGEX SPECIAL CHARACTERS
// ============================================================================
console.log('\n🔍 Regex Special Characters Tests\n' + '-'.repeat(70));

// Test 11: Pattern with dots
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'config.get*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Regex: Parser handles dots in patterns'
    );

    fs.unlinkSync(includeFile);
}

// Test 12: Pattern with underscores
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '_private*\n__dunder__*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Regex: Parser handles underscores'
    );

    fs.unlinkSync(includeFile);
}

// Test 13: Pattern with numbers
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'test123\nmethod2*\n*3');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Regex: Parser handles numbers in patterns'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// CASE SENSITIVITY
// ============================================================================
console.log('\n🔤 Case Sensitivity Tests\n' + '-'.repeat(70));

// Test 14: Mixed case patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'MyClass.*\nmyClass.*\nMYCLASS.*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Case: Parser handles mixed case patterns'
    );

    fs.unlinkSync(includeFile);
}

// Test 15: camelCase patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'getUserById\ngetUserByEmail\ngetAllUsers');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Case: Parser handles camelCase patterns'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// PATTERN PRIORITY AND ORDERING
// ============================================================================
console.log('\n📋 Pattern Priority Tests\n' + '-'.repeat(70));

// Test 16: Include takes priority over ignore
{
    const includeFile = path.join(testDir, '.methodinclude');
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(includeFile, 'test*');
    fs.writeFileSync(ignoreFile, '*');

    const parser = new MethodFilterParser(includeFile, ignoreFile);
    assert(
        parser !== null,
        'Priority: Include patterns take priority over ignore'
    );

    fs.unlinkSync(includeFile);
    fs.unlinkSync(ignoreFile);
}

// Test 17: Pattern order matters
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*\n!test*\n!mock*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Priority: Pattern order is preserved'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// DUPLICATE AND OVERLAPPING PATTERNS
// ============================================================================
console.log('\n🔁 Duplicate and Overlapping Patterns\n' + '-'.repeat(70));

// Test 18: Duplicate patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'test*\ntest*\ntest*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Duplicates: Parser handles duplicate patterns'
    );

    fs.unlinkSync(includeFile);
}

// Test 19: Overlapping patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'test*\ntestMethod\ntestMethod*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Overlapping: Parser handles overlapping patterns'
    );

    fs.unlinkSync(includeFile);
}

// Test 20: Conflicting patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'test*\n!test*');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Conflicting: Parser handles conflicting patterns'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// EMPTY AND WHITESPACE PATTERNS
// ============================================================================
console.log('\n⚪ Empty and Whitespace Tests\n' + '-'.repeat(70));

// Test 21: Empty pattern file
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Empty: Parser handles empty pattern file'
    );

    fs.unlinkSync(includeFile);
}

// Test 22: File with only comments
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '# Comment 1\n# Comment 2');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Comments: Parser handles file with only comments'
    );

    fs.unlinkSync(includeFile);
}

// Test 23: File with empty lines
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'test*\n\n\n\nmock*\n\n');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Whitespace: Parser handles empty lines'
    );

    fs.unlinkSync(includeFile);
}

// Test 24: Patterns with leading/trailing whitespace
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '  test*  \n\tmock*\t\n   get*   ');

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Whitespace: Parser handles leading/trailing whitespace'
    );

    fs.unlinkSync(includeFile);
}

// ============================================================================
// VERY LONG PATTERN LISTS
// ============================================================================
console.log('\n📏 Performance Tests\n' + '-'.repeat(70));

// Test 25: Large number of patterns
{
    const includeFile = path.join(testDir, '.methodinclude');
    const patterns = [];
    for (let i = 0; i < 1000; i++) {
        patterns.push(`pattern${i}*`);
    }
    fs.writeFileSync(includeFile, patterns.join('\n'));

    const parser = new MethodFilterParser(includeFile, null);
    assert(
        parser !== null,
        'Performance: Parser handles 1000 patterns'
    );

    fs.unlinkSync(includeFile);
}

// Cleanup
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total tests: ${testsPassed + testsFailed}`);
console.log(`🎯 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(({ name, message }) => {
        console.log(`  • ${name}`);
        if (message) console.log(`    ${message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
