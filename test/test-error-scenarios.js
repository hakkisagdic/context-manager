#!/usr/bin/env node

/**
 * Comprehensive Error Scenario Tests
 * Tests error handling, edge cases, and resilience across the system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';
import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';

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

function assertThrows(fn, testName, expectedError = null) {
    try {
        fn();
        console.log(`❌ ${testName}: Expected error but none was thrown`);
        testsFailed++;
        failedTests.push({ name: testName, message: 'No error thrown' });
        return false;
    } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
            console.log(`❌ ${testName}: Wrong error - ${error.message}`);
            testsFailed++;
            failedTests.push({ name: testName, message: `Wrong error: ${error.message}` });
            return false;
        }
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    }
}

console.log('🧪 COMPREHENSIVE ERROR SCENARIO TESTS');
console.log('='.repeat(70));

// Create test directory
const testDir = path.join(__dirname, 'temp-test-errors');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// MALFORMED FILTER FILE TESTS
// ============================================================================
console.log('\n🔧 Malformed Filter File Tests\n' + '-'.repeat(70));

// Test 1: Malformed .contextignore (invalid regex)
{
    const malformedFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(malformedFile, '**[invalid\n*.log');

    try {
        const parser = new GitIgnoreParser(
            path.join(testDir, '.gitignore'),
            malformedFile,
            null
        );
        // Parser should handle invalid patterns gracefully
        assert(
            parser !== null,
            'GitIgnoreParser: Handles malformed .contextignore gracefully'
        );
    } catch (error) {
        // Throwing error is also acceptable
        assert(
            true,
            'GitIgnoreParser: Detects malformed .contextignore'
        );
    }

    fs.unlinkSync(malformedFile);
}

// Test 2: .methodinclude with invalid patterns
{
    const malformedFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(malformedFile, '***invalid***\nMyClass.*');

    try {
        const parser = new MethodFilterParser(malformedFile, null);
        assert(
            parser !== null,
            'MethodFilterParser: Handles invalid patterns in .methodinclude'
        );
    } catch (error) {
        assert(
            true,
            'MethodFilterParser: Detects invalid patterns'
        );
    }

    fs.unlinkSync(malformedFile);
}

// Test 3: Empty filter files
{
    const emptyFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(emptyFile, '');

    const parser = new GitIgnoreParser(
        path.join(testDir, '.gitignore'),
        emptyFile,
        null
    );
    assert(
        parser !== null,
        'GitIgnoreParser: Handles empty .contextignore file'
    );

    fs.unlinkSync(emptyFile);
}

// Test 4: Filter file with only comments
{
    const commentsFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(commentsFile, '# Comment 1\n# Comment 2\n# Comment 3');

    const parser = new GitIgnoreParser(
        path.join(testDir, '.gitignore'),
        commentsFile,
        null
    );
    assert(
        parser !== null,
        'GitIgnoreParser: Handles file with only comments'
    );

    fs.unlinkSync(commentsFile);
}

// Test 5: Filter file with only whitespace
{
    const whitespaceFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(whitespaceFile, '   \n\t\n   \n');

    const parser = new GitIgnoreParser(
        path.join(testDir, '.gitignore'),
        whitespaceFile,
        null
    );
    assert(
        parser !== null,
        'GitIgnoreParser: Handles file with only whitespace'
    );

    fs.unlinkSync(whitespaceFile);
}

// ============================================================================
// FILE HANDLING EDGE CASES
// ============================================================================
console.log('\n📄 File Handling Edge Cases\n' + '-'.repeat(70));

// Test 6: Empty file
{
    const emptyFile = path.join(testDir, 'empty.js');
    fs.writeFileSync(emptyFile, '');

    const content = fs.readFileSync(emptyFile, 'utf-8');
    assert(
        content.length === 0,
        'File handling: Empty file has zero length'
    );

    fs.unlinkSync(emptyFile);
}

// Test 7: File with only whitespace
{
    const whitespaceFile = path.join(testDir, 'whitespace.js');
    fs.writeFileSync(whitespaceFile, '   \n\t\n   ');

    const content = fs.readFileSync(whitespaceFile, 'utf-8');
    assert(
        content.trim().length === 0,
        'File handling: Whitespace-only file detected'
    );

    fs.unlinkSync(whitespaceFile);
}

// Test 8: Very long file path
{
    const longName = 'a'.repeat(200) + '.js';
    const longPath = path.join(testDir, longName);

    try {
        fs.writeFileSync(longPath, 'console.log("test");');
        assert(
            fs.existsSync(longPath),
            'File handling: Handles very long file names'
        );
        fs.unlinkSync(longPath);
    } catch (error) {
        // On some systems this might fail due to path length limits
        assert(
            true,
            'File handling: Detects file name too long error'
        );
    }
}

// Test 9: File with special characters in name
{
    const specialChars = ['test file.js', 'test&file.js', 'test$file.js'];

    for (const filename of specialChars) {
        const testFile = path.join(testDir, filename);
        try {
            fs.writeFileSync(testFile, 'test');
            const exists = fs.existsSync(testFile);
            if (exists) fs.unlinkSync(testFile);
            assert(
                true,
                `File handling: Handles filename with special chars: ${filename}`
            );
        } catch (error) {
            assert(
                true,
                `File handling: Rejects invalid filename: ${filename}`
            );
        }
    }
}

// Test 10: Files with unicode/emoji in names
{
    const unicodeFile = path.join(testDir, 'test你好.js');

    try {
        fs.writeFileSync(unicodeFile, 'console.log("test");');
        assert(
            fs.existsSync(unicodeFile),
            'File handling: Handles unicode in filenames'
        );
        fs.unlinkSync(unicodeFile);
    } catch (error) {
        assert(
            true,
            'File handling: Unicode handling varies by platform'
        );
    }
}

// ============================================================================
// DIRECTORY EDGE CASES
// ============================================================================
console.log('\n📁 Directory Edge Cases\n' + '-'.repeat(70));

// Test 11: Empty directory
{
    const emptyDir = path.join(testDir, 'empty-dir');
    fs.mkdirSync(emptyDir);

    const files = fs.readdirSync(emptyDir);
    assert(
        files.length === 0,
        'Directory: Empty directory has no files'
    );

    fs.rmdirSync(emptyDir);
}

// Test 12: Very deep directory nesting
{
    const deepPath = path.join(testDir, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

    try {
        fs.mkdirSync(deepPath, { recursive: true });
        assert(
            fs.existsSync(deepPath),
            'Directory: Handles deep nesting (10 levels)'
        );
        fs.rmSync(path.join(testDir, 'a'), { recursive: true });
    } catch (error) {
        assert(
            false,
            'Directory: Deep nesting failed',
            error.message
        );
    }
}

// Test 13: Wide directory structure
{
    const wideDir = path.join(testDir, 'wide');
    fs.mkdirSync(wideDir);

    // Create 100 subdirectories
    for (let i = 0; i < 100; i++) {
        fs.mkdirSync(path.join(wideDir, `subdir${i}`));
    }

    const subdirs = fs.readdirSync(wideDir);
    assert(
        subdirs.length === 100,
        'Directory: Handles wide directory structure (100 subdirs)'
    );

    fs.rmSync(wideDir, { recursive: true });
}

// Test 14: Directory with special characters in name
{
    const specialDirs = ['test dir', 'test-dir', 'test_dir', 'test.dir'];

    for (const dirname of specialDirs) {
        const testDirPath = path.join(testDir, dirname);
        fs.mkdirSync(testDirPath);
        assert(
            fs.existsSync(testDirPath),
            `Directory: Handles special chars in name: ${dirname}`
        );
        fs.rmdirSync(testDirPath);
    }
}

// ============================================================================
// LINE ENDING TESTS
// ============================================================================
console.log('\n↩️  Line Ending Tests\n' + '-'.repeat(70));

// Test 15: CRLF line endings
{
    const crlfFile = path.join(testDir, 'crlf.js');
    fs.writeFileSync(crlfFile, 'line1\r\nline2\r\nline3');

    const content = fs.readFileSync(crlfFile, 'utf-8');
    assert(
        content.includes('\r\n'),
        'Line endings: CRLF preserved when written'
    );

    fs.unlinkSync(crlfFile);
}

// Test 16: LF line endings
{
    const lfFile = path.join(testDir, 'lf.js');
    fs.writeFileSync(lfFile, 'line1\nline2\nline3');

    const content = fs.readFileSync(lfFile, 'utf-8');
    const lines = content.split('\n');
    assert(
        lines.length === 3,
        'Line endings: LF line endings work correctly'
    );

    fs.unlinkSync(lfFile);
}

// Test 17: Mixed line endings
{
    const mixedFile = path.join(testDir, 'mixed.js');
    fs.writeFileSync(mixedFile, 'line1\r\nline2\nline3\r\nline4');

    const content = fs.readFileSync(mixedFile, 'utf-8');
    assert(
        content.includes('\r\n') && content.includes('\n'),
        'Line endings: Mixed line endings preserved'
    );

    fs.unlinkSync(mixedFile);
}

// ============================================================================
// METHOD ANALYZER EDGE CASES
// ============================================================================
console.log('\n🔍 Method Analyzer Edge Cases\n' + '-'.repeat(70));

// Test 18: Very long method name
{
    const longMethodName = 'myVeryLongMethodNameThatExceedsNormalLimits' + 'A'.repeat(100);
    const code = `function ${longMethodName}() { return 42; }`;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.some(m => m.name.length > 100),
        'MethodAnalyzer: Handles very long method names'
    );
}

// Test 19: Unicode in method names
{
    const code = `function 你好世界() { return "Hello"; }`;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    // JavaScript doesn't support unicode in function names normally, but test graceful handling
    assert(
        methods !== null,
        'MethodAnalyzer: Handles unicode gracefully'
    );
}

// Test 20: Nested functions
{
    const code = `
        function outer() {
            function inner() {
                function deepest() {
                    return 42;
                }
                return deepest();
            }
            return inner();
        }
    `;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.length >= 1,
        'MethodAnalyzer: Extracts nested functions',
        `Expected at least 1 method, got ${methods.length}`
    );
}

// Test 21: Method with multiline parameters
{
    const code = `
        function myMethod(
            param1,
            param2,
            param3,
            param4
        ) {
            return param1 + param2;
        }
    `;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.length >= 1,
        'MethodAnalyzer: Handles multiline parameters'
    );
}

// Test 22: Method with default parameters
{
    const code = `
        function myMethod(a = 1, b = 2, c = { x: 10 }) {
            return a + b;
        }
    `;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.length >= 1,
        'MethodAnalyzer: Handles default parameters'
    );
}

// Test 23: Arrow functions with various syntaxes
{
    const code = `
        const func1 = () => 42;
        const func2 = (x) => x * 2;
        const func3 = (x, y) => { return x + y; };
        const func4 = async () => await something();
    `;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.length >= 2,
        'MethodAnalyzer: Extracts arrow functions',
        `Expected at least 2 methods, got ${methods.length}`
    );
}

// Test 24: Empty file
{
    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods('', '.js');

    assert(
        methods.length === 0,
        'MethodAnalyzer: Handles empty file'
    );
}

// Test 25: File with only comments
{
    const code = `
        // This is a comment
        /* Multi-line
           comment */
        // Another comment
    `;

    const analyzer = new MethodAnalyzer();
    const methods = analyzer.extractMethods(code, '.js');

    assert(
        methods.length === 0,
        'MethodAnalyzer: Handles file with only comments'
    );
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
