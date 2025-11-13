#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for Utility Classes
 * Tests FileUtils, TokenUtils, and ErrorHandler with extensive coverage
 */

import FileUtils from '../lib/utils/file-utils.js';
import TokenUtils from '../lib/utils/token-utils.js';
import ErrorHandler from '../lib/utils/error-handler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test framework
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

console.log('🧪 COMPREHENSIVE UTILITY TESTS');
console.log('='.repeat(70));

// ============================================================================
// FILEUTILS TESTS
// ============================================================================
console.log('\n📁 FileUtils Tests\n' + '-'.repeat(70));

// Test 1: isText() method - JavaScript files
{
    assert(
        FileUtils.isText('test.js') === true,
        'FileUtils.isText: Detects .js as text file'
    );
    assert(
        FileUtils.isText('test.ts') === true,
        'FileUtils.isText: Detects .ts as text file'
    );
    assert(
        FileUtils.isText('test.jsx') === true,
        'FileUtils.isText: Detects .jsx as text file'
    );
    assert(
        FileUtils.isText('test.tsx') === true,
        'FileUtils.isText: Detects .tsx as text file'
    );
}

// Test 2: isText() method - Various text file types
{
    assert(
        FileUtils.isText('config.json') === true,
        'FileUtils.isText: Detects .json as text file'
    );
    assert(
        FileUtils.isText('README.md') === true,
        'FileUtils.isText: Detects .md as text file'
    );
    assert(
        FileUtils.isText('style.css') === true,
        'FileUtils.isText: Detects .css as text file'
    );
    assert(
        FileUtils.isText('config.yml') === true,
        'FileUtils.isText: Detects .yml as text file'
    );
    assert(
        FileUtils.isText('config.yaml') === true,
        'FileUtils.isText: Detects .yaml as text file'
    );
}

// Test 3: isText() method - Programming languages
{
    assert(
        FileUtils.isText('script.py') === true,
        'FileUtils.isText: Detects .py as text file'
    );
    assert(
        FileUtils.isText('app.rb') === true,
        'FileUtils.isText: Detects .rb as text file'
    );
    assert(
        FileUtils.isText('Main.java') === true,
        'FileUtils.isText: Detects .java as text file'
    );
    assert(
        FileUtils.isText('main.go') === true,
        'FileUtils.isText: Detects .go as text file'
    );
    assert(
        FileUtils.isText('lib.rs') === true,
        'FileUtils.isText: Detects .rs as text file'
    );
    assert(
        FileUtils.isText('Program.cs') === true,
        'FileUtils.isText: Detects .cs as text file'
    );
}

// Test 4: isText() method - Special files by name
{
    assert(
        FileUtils.isText('Dockerfile') === true,
        'FileUtils.isText: Detects Dockerfile as text file'
    );
    assert(
        FileUtils.isText('Makefile') === true,
        'FileUtils.isText: Detects Makefile as text file'
    );
    assert(
        FileUtils.isText('LICENSE') === true,
        'FileUtils.isText: Detects LICENSE as text file'
    );
    assert(
        FileUtils.isText('README') === true,
        'FileUtils.isText: Detects README as text file'
    );
    assert(
        FileUtils.isText('CHANGELOG') === true,
        'FileUtils.isText: Detects CHANGELOG as text file'
    );
}

// Test 5: isText() method - Binary files (should return false)
{
    assert(
        FileUtils.isText('image.png') === false,
        'FileUtils.isText: Rejects .png as non-text file'
    );
    assert(
        FileUtils.isText('video.mp4') === false,
        'FileUtils.isText: Rejects .mp4 as non-text file'
    );
    assert(
        FileUtils.isText('archive.zip') === false,
        'FileUtils.isText: Rejects .zip as non-text file'
    );
    assert(
        FileUtils.isText('binary.exe') === false,
        'FileUtils.isText: Rejects .exe as non-text file'
    );
}

// Test 6: isCode() method - Code files
{
    assert(
        FileUtils.isCode('test.js') === true,
        'FileUtils.isCode: Detects .js as code file'
    );
    assert(
        FileUtils.isCode('test.ts') === true,
        'FileUtils.isCode: Detects .ts as code file'
    );
    assert(
        FileUtils.isCode('test.py') === true,
        'FileUtils.isCode: Detects .py as code file'
    );
    assert(
        FileUtils.isCode('Main.java') === true,
        'FileUtils.isCode: Detects .java as code file'
    );
    assert(
        FileUtils.isCode('main.go') === true,
        'FileUtils.isCode: Detects .go as code file'
    );
    assert(
        FileUtils.isCode('lib.rs') === true,
        'FileUtils.isCode: Detects .rs as code file'
    );
}

// Test 7: isCode() method - Non-code files
{
    assert(
        FileUtils.isCode('README.md') === false,
        'FileUtils.isCode: Rejects .md as non-code file'
    );
    assert(
        FileUtils.isCode('config.json') === false,
        'FileUtils.isCode: Rejects .json as non-code file'
    );
    assert(
        FileUtils.isCode('style.css') === false,
        'FileUtils.isCode: Rejects .css as non-code file'
    );
    assert(
        FileUtils.isCode('image.png') === false,
        'FileUtils.isCode: Rejects .png as non-code file'
    );
}

// Test 8: getType() method - Different categories
{
    assert(
        FileUtils.getType('test.js') === 'code',
        'FileUtils.getType: Categorizes .js as code'
    );
    assert(
        FileUtils.getType('config.json') === 'config',
        'FileUtils.getType: Categorizes .json as config'
    );
    assert(
        FileUtils.getType('README.md') === 'doc',
        'FileUtils.getType: Categorizes .md as doc'
    );
    assert(
        FileUtils.getType('style.css') === 'style',
        'FileUtils.getType: Categorizes .css as style'
    );
    assert(
        FileUtils.getType('image.png') === 'other',
        'FileUtils.getType: Categorizes .png as other'
    );
}

// Test 9: getExtension() method
{
    assert(
        FileUtils.getExtension('test.js') === 'js',
        'FileUtils.getExtension: Returns js for .js file'
    );
    assert(
        FileUtils.getExtension('config.JSON') === 'json',
        'FileUtils.getExtension: Returns lowercase extension'
    );
    assert(
        FileUtils.getExtension('README') === 'no-extension',
        'FileUtils.getExtension: Returns no-extension for files without extension'
    );
    assert(
        FileUtils.getExtension('file.tar.gz') === 'gz',
        'FileUtils.getExtension: Returns last extension for compound extensions'
    );
}

// Test 10: Edge cases
{
    assert(
        FileUtils.isText('') === false,
        'FileUtils.isText: Handles empty string'
    );
    assert(
        FileUtils.isCode('') === false,
        'FileUtils.isCode: Handles empty string'
    );
    assert(
        FileUtils.getType('') === 'other',
        'FileUtils.getType: Handles empty string'
    );
    assert(
        FileUtils.getExtension('') === 'no-extension',
        'FileUtils.getExtension: Handles empty string'
    );
}

// ============================================================================
// TOKENUTILS TESTS
// ============================================================================
console.log('\n📊 TokenUtils Tests\n' + '-'.repeat(70));

// Test 11: estimate() method - Different file types
{
    const jsContent = 'function test() { return 42; }';
    const tokens = TokenUtils.estimate(jsContent, 'test.js');
    assert(
        typeof tokens === 'number' && tokens > 0,
        'TokenUtils.estimate: Returns positive number for JS content',
        `Expected positive number, got ${tokens}`
    );
}

// Test 12: estimate() method - Different programming languages
{
    const pythonContent = 'def hello():\n    print("Hello, World!")';
    const pyTokens = TokenUtils.estimate(pythonContent, 'test.py');
    
    const javaContent = 'public class Test { public static void main(String[] args) {} }';
    const javaTokens = TokenUtils.estimate(javaContent, 'Test.java');
    
    assert(
        pyTokens > 0 && javaTokens > 0,
        'TokenUtils.estimate: Handles different programming languages',
        `Python: ${pyTokens}, Java: ${javaTokens}`
    );
}

// Test 13: estimate() method - JSON content
{
    const jsonContent = '{"name": "test", "version": "1.0.0", "dependencies": {}}';
    const tokens = TokenUtils.estimate(jsonContent, 'package.json');
    assert(
        tokens > 0,
        'TokenUtils.estimate: Handles JSON content',
        `Expected positive tokens, got ${tokens}`
    );
}

// Test 14: estimate() method - Markdown content
{
    const mdContent = '# Title\n\nThis is a **markdown** document with `code` blocks.';
    const tokens = TokenUtils.estimate(mdContent, 'README.md');
    assert(
        tokens > 0,
        'TokenUtils.estimate: Handles Markdown content',
        `Expected positive tokens, got ${tokens}`
    );
}

// Test 15: estimate() method - Unknown file type (uses default)
{
    const content = 'Some random content in an unknown file type.';
    const tokens = TokenUtils.estimate(content, 'unknown.xyz');
    assert(
        tokens > 0,
        'TokenUtils.estimate: Handles unknown file types with default ratio',
        `Expected positive tokens, got ${tokens}`
    );
}

// Test 16: format() method - Different token counts
{
    assert(
        TokenUtils.format(500) === '500',
        'TokenUtils.format: Formats small numbers as-is'
    );
    assert(
        TokenUtils.format(1500) === '1.5K',
        'TokenUtils.format: Formats thousands with K suffix'
    );
    assert(
        TokenUtils.format(1500000) === '1.5M',
        'TokenUtils.format: Formats millions with M suffix'
    );
    assert(
        TokenUtils.format(0) === '0',
        'TokenUtils.format: Handles zero'
    );
}

// Test 17: getMethod() method
{
    const method = TokenUtils.getMethod();
    assert(
        typeof method === 'string' && method.length > 0,
        'TokenUtils.getMethod: Returns non-empty string',
        `Got: ${method}`
    );
    assert(
        method.includes('Exact') || method.includes('Estimated'),
        'TokenUtils.getMethod: Contains expected method description'
    );
}

// Test 18: isExact() and hasExactCounting() methods
{
    const isExact = TokenUtils.isExact();
    const hasExact = TokenUtils.hasExactCounting();
    
    assert(
        typeof isExact === 'boolean',
        'TokenUtils.isExact: Returns boolean'
    );
    assert(
        isExact === hasExact,
        'TokenUtils.hasExactCounting: Returns same value as isExact (backward compatibility)'
    );
}

// Test 19: calculate() method - Falls back to estimate when tiktoken unavailable
{
    const content = 'function test() { return "hello"; }';
    const tokens = TokenUtils.calculate(content, 'test.js');
    assert(
        typeof tokens === 'number' && tokens > 0,
        'TokenUtils.calculate: Returns positive number',
        `Expected positive number, got ${tokens}`
    );
}

// Test 20: Edge cases for TokenUtils
{
    assert(
        TokenUtils.estimate('', 'test.js') === 0,
        'TokenUtils.estimate: Handles empty content'
    );
    assert(
        TokenUtils.format(999) === '999',
        'TokenUtils.format: Handles edge case just under 1K'
    );
    assert(
        TokenUtils.format(1000) === '1.0K',
        'TokenUtils.format: Handles exact 1K'
    );
    assert(
        TokenUtils.format(999999) === '1000.0K',
        'TokenUtils.format: Handles edge case just under 1M'
    );
}

// ============================================================================
// ERRORHANDLER TESTS
// ============================================================================
console.log('\n⚠️  ErrorHandler Tests\n' + '-'.repeat(70));

// Test 21: ErrorHandler instantiation
{
    const handler = new ErrorHandler();
    assert(
        handler instanceof ErrorHandler,
        'ErrorHandler: Basic instantiation'
    );
    assert(
        handler.verbose === false,
        'ErrorHandler: Default verbose is false'
    );
    assert(
        handler.logFile === null,
        'ErrorHandler: Default logFile is null'
    );
}

// Test 22: ErrorHandler with options
{
    const handler = new ErrorHandler({ verbose: true, logFile: 'test.log' });
    assert(
        handler.verbose === true,
        'ErrorHandler: Verbose option set correctly'
    );
    assert(
        handler.logFile === 'test.log',
        'ErrorHandler: LogFile option set correctly'
    );
}

// Test 23: validateFormat() method - valid format
{
    const handler = new ErrorHandler();
    const supportedFormats = ['json', 'xml', 'yaml'];
    
    // Should not throw for valid format
    try {
        handler.validateFormat('json', supportedFormats);
        assert(true, 'ErrorHandler.validateFormat: Accepts valid format');
    } catch (error) {
        assert(false, 'ErrorHandler.validateFormat: Should not throw for valid format', error.message);
    }
}

// Test 24: validateFormat() method - invalid format
{
    const handler = new ErrorHandler();
    const supportedFormats = ['json', 'xml', 'yaml'];
    
    assertThrows(
        () => handler.validateFormat('invalid', supportedFormats),
        'ErrorHandler.validateFormat: Throws for invalid format',
        'Unsupported format'
    );
}

// Test 25: createUserMessage() method
{
    const handler = new ErrorHandler();
    
    // Test with known error code
    const enoentError = { code: 'ENOENT', message: 'no such file or directory' };
    const userMessage = handler.createUserMessage(enoentError, 'File operation');
    assert(
        userMessage.includes('File operation') && userMessage.includes('File not found'),
        'ErrorHandler.createUserMessage: Creates user-friendly message for ENOENT'
    );
    
    // Test with unknown error code
    const unknownError = { message: 'Something went wrong' };
    const unknownMessage = handler.createUserMessage(unknownError);
    assert(
        unknownMessage === 'Something went wrong',
        'ErrorHandler.createUserMessage: Uses original message for unknown errors'
    );
}

// Test 26: wrapAsync() method
{
    const handler = new ErrorHandler();
    
    // Test successful async function
    const successFn = async (x) => x * 2;
    const wrappedSuccess = handler.wrapAsync(successFn, 'test operation');
    
    wrappedSuccess(5).then(result => {
        assert(
            result === 10,
            'ErrorHandler.wrapAsync: Preserves successful function behavior'
        );
    }).catch(() => {
        assert(false, 'ErrorHandler.wrapAsync: Should not throw for successful function');
    });
    
    // Test failing async function
    const failFn = async () => { throw new Error('Test error'); };
    const wrappedFail = handler.wrapAsync(failFn, 'test operation');
    
    wrappedFail().catch(error => {
        assert(
            error.message === 'Test error',
            'ErrorHandler.wrapAsync: Preserves original error'
        );
    });
}

// Test 27: Error handling methods (basic functionality)
{
    const handler = new ErrorHandler();
    
    // Test that error handling methods don't throw
    try {
        const testError = new Error('Test error');
        handler.handleFormatError(testError, 'json');
        handler.handleFileError(testError, 'test.txt');
        handler.handleParseError(testError, 'json', '{"invalid": json}');
        handler.handleValidationError(['Error 1', 'Error 2'], 'test context');
        
        assert(true, 'ErrorHandler: All error handling methods execute without throwing');
    } catch (error) {
        assert(false, 'ErrorHandler: Error handling methods should not throw', error.message);
    }
}

// Test 28: logError() method without log file
{
    const handler = new ErrorHandler();
    
    try {
        handler.logError('Test message', new Error('Test error'));
        assert(true, 'ErrorHandler.logError: Handles no log file gracefully');
    } catch (error) {
        assert(false, 'ErrorHandler.logError: Should not throw when no log file', error.message);
    }
}

// Test 29: Error code mapping
{
    const handler = new ErrorHandler();
    
    const testCases = [
        { code: 'ENOENT', expected: 'File not found' },
        { code: 'EACCES', expected: 'Permission denied' },
        { code: 'EISDIR', expected: 'Expected file, got directory' },
        { code: 'ENOTDIR', expected: 'Expected directory, got file' }
    ];
    
    for (const testCase of testCases) {
        const error = { code: testCase.code, message: 'original message' };
        const userMessage = handler.createUserMessage(error);
        assert(
            userMessage === testCase.expected,
            `ErrorHandler.createUserMessage: Maps ${testCase.code} correctly`
        );
    }
}

// Test 30: Edge cases for ErrorHandler
{
    const handler = new ErrorHandler();
    
    // Test with null/undefined inputs
    try {
        handler.createUserMessage({ message: null });
        handler.createUserMessage({ message: undefined });
        assert(true, 'ErrorHandler: Handles null/undefined messages gracefully');
    } catch (error) {
        assert(false, 'ErrorHandler: Should handle null/undefined gracefully', error.message);
    }
}

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 COMPREHENSIVE UTILITY TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
        console.log(`   • ${test.name}: ${test.message}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 ALL UTILITY TESTS PASSED!');
    console.log('📈 Test coverage significantly improved for utility classes.');
}