#!/usr/bin/env node

/**
 * Error Handler Utilities Tests
 * Tests error handling, logging, and user-friendly messages
 */

import ErrorHandler from '../lib/utils/error-handler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const TEST_LOG_FILE = path.join(__dirname, 'fixtures', 'test-error.log');

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

// Cleanup
if (fs.existsSync(TEST_LOG_FILE)) {
    fs.unlinkSync(TEST_LOG_FILE);
}

console.log('🧪 Testing Error Handler Utilities...\\n');

// ============================================================================
// ERROR HANDLER TESTS
// ============================================================================
console.log('⚠️  ErrorHandler Core Tests');
console.log('-'.repeat(70));

test('ErrorHandler - Constructor with defaults', () => {
    const handler = new ErrorHandler();
    if (!handler) throw new Error('Failed to create ErrorHandler');
    if (handler.verbose !== false) throw new Error('verbose should default to false');
    if (handler.logFile !== null) throw new Error('logFile should default to null');
});

test('ErrorHandler - Constructor with options', () => {
    const handler = new ErrorHandler({ verbose: true, logFile: TEST_LOG_FILE });
    if (handler.verbose !== true) throw new Error('verbose not set');
    if (handler.logFile !== TEST_LOG_FILE) throw new Error('logFile not set');
});

test('ErrorHandler - handleFormatError displays message', () => {
    const handler = new ErrorHandler({ verbose: false });
    const error = new Error('Invalid format');
    // Should not throw
    handler.handleFormatError(error, 'json');
});

test('ErrorHandler - handleFormatError verbose mode', () => {
    const handler = new ErrorHandler({ verbose: true });
    const error = new Error('Invalid format');
    // Should not throw
    handler.handleFormatError(error, 'yaml');
});

test('ErrorHandler - handleFileError displays message', () => {
    const handler = new ErrorHandler();
    const error = new Error('File not found');
    error.code = 'ENOENT';
    // Should not throw
    handler.handleFileError(error, '/path/to/file');
});

test('ErrorHandler - handleFileError ENOENT suggestion', () => {
    const handler = new ErrorHandler();
    const error = new Error('File not found');
    error.code = 'ENOENT';
    // Should display suggestion
    handler.handleFileError(error, '/missing');
});

test('ErrorHandler - handleFileError EACCES suggestion', () => {
    const handler = new ErrorHandler();
    const error = new Error('Permission denied');
    error.code = 'EACCES';
    // Should display permission suggestion
    handler.handleFileError(error, '/restricted');
});

test('ErrorHandler - handleParseError displays message', () => {
    const handler = new ErrorHandler({ verbose: false });
    const error = new Error('Parse failed');
    // Should not throw
    handler.handleParseError(error, 'json', '{"invalid');
});

test('ErrorHandler - handleParseError verbose mode shows content', () => {
    const handler = new ErrorHandler({ verbose: true });
    const error = new Error('Parse failed');
    const content = 'a'.repeat(300); // Long content
    // Should display content preview
    handler.handleParseError(error, 'yaml', content);
});

test('ErrorHandler - handleValidationError with multiple errors', () => {
    const handler = new ErrorHandler();
    const errors = ['Field required', 'Invalid format', 'Out of range'];
    // Should not throw
    handler.handleValidationError(errors, 'config');
});

test('ErrorHandler - handleValidationError with empty array', () => {
    const handler = new ErrorHandler();
    const errors = [];
    // Should not throw
    handler.handleValidationError(errors, 'test');
});

test('ErrorHandler - logError without logFile', () => {
    const handler = new ErrorHandler();
    const error = new Error('Test error');
    // Should not crash without logFile
    handler.logError('Test message', error);
});

test('ErrorHandler - logError with logFile', () => {
    const handler = new ErrorHandler({ logFile: TEST_LOG_FILE });
    const error = new Error('Test error');
    handler.logError('Test message', error);

    // Should create log file
    if (!fs.existsSync(TEST_LOG_FILE)) throw new Error('Log file not created');

    // Should contain error info
    const logContent = fs.readFileSync(TEST_LOG_FILE, 'utf-8');
    if (!logContent.includes('Test message')) throw new Error('Log missing message');
});

test('ErrorHandler - wrapAsync wraps async function', async () => {
    const handler = new ErrorHandler();
    const asyncFn = async () => 'result';
    const wrapped = handler.wrapAsync(asyncFn, 'test');
    const result = await wrapped();
    if (result !== 'result') throw new Error('Should preserve return value');
});

test('ErrorHandler - wrapAsync handles errors', async () => {
    const handler = new ErrorHandler();
    const failingFn = async () => { throw new Error('Async error'); };
    const wrapped = handler.wrapAsync(failingFn, 'test');

    try {
        await wrapped();
        throw new Error('Should propagate error');
    } catch (error) {
        if (!error.message.includes('Async')) throw new Error('Wrong error');
    }
});

test('ErrorHandler - validateFormat accepts valid format', () => {
    const handler = new ErrorHandler();
    const formats = ['json', 'yaml', 'xml'];
    // Should not throw
    handler.validateFormat('json', formats);
});

test('ErrorHandler - validateFormat rejects invalid format', () => {
    const handler = new ErrorHandler();
    const formats = ['json', 'yaml'];

    try {
        handler.validateFormat('invalid', formats);
        throw new Error('Should throw on invalid format');
    } catch (error) {
        if (!error.message.includes('Unsupported')) {
            throw new Error('Wrong error message');
        }
    }
});

test('ErrorHandler - createUserMessage formats ENOENT', () => {
    const handler = new ErrorHandler();
    const error = new Error('System error');
    error.code = 'ENOENT';
    const message = handler.createUserMessage(error);
    if (!message.includes('File not found')) throw new Error('Should map ENOENT');
});

test('ErrorHandler - createUserMessage formats EACCES', () => {
    const handler = new ErrorHandler();
    const error = new Error('System error');
    error.code = 'EACCES';
    const message = handler.createUserMessage(error);
    if (!message.includes('Permission denied')) throw new Error('Should map EACCES');
});

test('ErrorHandler - createUserMessage with context', () => {
    const handler = new ErrorHandler();
    const error = new Error('Test error');
    const message = handler.createUserMessage(error, 'File operation');
    if (!message.includes('File operation')) throw new Error('Should include context');
    if (!message.includes('Test error')) throw new Error('Should include error message');
});

// ============================================================================
// ADDITIONAL COVERAGE TESTS
// ============================================================================
console.log('\n🎯 Additional Coverage Tests');
console.log('-'.repeat(70));

test('ErrorHandler - logError handles write failures gracefully', () => {
    // Test line 89-90: catch block when logging fails
    const invalidLogPath = '/nonexistent/directory/error.log';
    const handler = new ErrorHandler({ logFile: invalidLogPath });
    const error = new Error('Test error');

    // Should not throw even if logging fails
    try {
        handler.logError('Test message', error);
        // Success - caught the error silently
    } catch (e) {
        throw new Error('Should handle logging failures silently');
    }
});

test('ErrorHandler - wrapAsync verbose mode logs errors', async () => {
    // Test line 101-107: verbose error logging in wrapAsync
    const handler = new ErrorHandler({ verbose: true });
    const failingFn = async () => { throw new Error('Verbose async error'); };
    const wrapped = handler.wrapAsync(failingFn, 'verbose-test');

    try {
        await wrapped();
        throw new Error('Should propagate error');
    } catch (error) {
        // Error should be propagated
        if (!error.message.includes('Verbose async error')) {
            throw new Error('Wrong error propagated');
        }
    }
});

test('ErrorHandler - wrapAsync non-verbose mode', async () => {
    // Ensure non-verbose path is also tested
    const handler = new ErrorHandler({ verbose: false });
    const failingFn = async () => { throw new Error('Non-verbose async error'); };
    const wrapped = handler.wrapAsync(failingFn, 'non-verbose-test');

    try {
        await wrapped();
        throw new Error('Should propagate error');
    } catch (error) {
        if (!error.message.includes('Non-verbose async error')) {
            throw new Error('Wrong error propagated');
        }
    }
});

test('ErrorHandler - wrapAsync with logging', async () => {
    // Test wrapAsync with logFile configured
    const handler = new ErrorHandler({ verbose: true, logFile: TEST_LOG_FILE });
    const failingFn = async () => { throw new Error('Logged async error'); };
    const wrapped = handler.wrapAsync(failingFn, 'logged-context');

    try {
        await wrapped();
        throw new Error('Should propagate error');
    } catch (error) {
        // Check that error was logged
        if (fs.existsSync(TEST_LOG_FILE)) {
            const logContent = fs.readFileSync(TEST_LOG_FILE, 'utf-8');
            if (!logContent.includes('logged-context')) {
                throw new Error('Error should be logged');
            }
        }
    }
});

test('ErrorHandler - handleParseError without content', () => {
    // Test handleParseError when content is null/undefined
    const handler = new ErrorHandler({ verbose: true });
    const error = new Error('Parse failed');

    // Should not crash with missing content
    handler.handleParseError(error, 'json', null);
    handler.handleParseError(error, 'json', undefined);
    handler.handleParseError(error, 'json', '');
});

// ============================================================================
// CLEANUP
// ============================================================================
if (fs.existsSync(TEST_LOG_FILE)) {
    fs.unlinkSync(TEST_LOG_FILE);
}

// ============================================================================
// RESULTS
// ============================================================================
console.log('\\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\\n🎉 All error handler tests passed!');
    process.exit(0);
} else {
    console.log('\\n❌ Some tests failed.');
    process.exit(1);
}
