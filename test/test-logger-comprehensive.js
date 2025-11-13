#!/usr/bin/env node

/**
 * Comprehensive Logger Tests
 * Tests for centralized logging system
 */

import { getLogger, createLogger } from '../lib/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'logger');

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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing Logger...\n');

// ============================================================================
// LOGGER CONSTRUCTION TESTS
// ============================================================================
console.log('🔨 Logger Construction Tests');
console.log('-'.repeat(70));

test('getLogger - Returns logger instance', () => {
    const logger = getLogger('test');
    if (typeof logger !== 'object') throw new Error('Should return object');
    if (typeof logger.log !== 'function') throw new Error('Should have log method');
});

test('getLogger - Constructor with defaults', () => {
    const logger = getLogger('test-defaults');
    if (!logger.level) throw new Error('Should have default level');
    if (!logger.levels) throw new Error('Should have levels');
    if (!logger.colors) throw new Error('Should have colors');
    if (!logger.icons) throw new Error('Should have icons');
});

test('getLogger - Constructor with options', () => {
    const logger = createLogger({
        level: 'debug',
        logToFile: false,
        silent: true
    });
    if (logger.level !== 'debug') throw new Error('Should set level');
    if (logger.logToFile !== false) throw new Error('Should set logToFile');
    if (logger.silent !== true) throw new Error('Should set silent');
});

test('getLogger - Has log levels', () => {
    const logger = getLogger('test-levels');
    if (typeof logger.levels.error !== 'number') throw new Error('Should have error level');
    if (typeof logger.levels.warn !== 'number') throw new Error('Should have warn level');
    if (typeof logger.levels.info !== 'number') throw new Error('Should have info level');
    if (typeof logger.levels.debug !== 'number') throw new Error('Should have debug level');
    if (typeof logger.levels.trace !== 'number') throw new Error('Should have trace level');
});

test('getLogger - Has colors', () => {
    const logger = getLogger('test-colors');
    if (!logger.colors.error) throw new Error('Should have error color');
    if (!logger.colors.warn) throw new Error('Should have warn color');
    if (!logger.colors.reset) throw new Error('Should have reset color');
});

test('getLogger - Has icons', () => {
    const logger = getLogger('test-icons');
    if (!logger.icons.error) throw new Error('Should have error icon');
    if (!logger.icons.warn) throw new Error('Should have warn icon');
    if (!logger.icons.info) throw new Error('Should have info icon');
});

// ============================================================================
// UTILITY METHOD TESTS
// ============================================================================
console.log('\n🛠️  Utility Method Tests');
console.log('-'.repeat(70));

test('Logger - getDateString returns date', () => {
    const logger = getLogger('test-date');
    const date = logger.getDateString();
    if (typeof date !== 'string') throw new Error('Should return string');
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) throw new Error('Should match YYYY-MM-DD format');
});

test('Logger - getTimestamp returns ISO string', () => {
    const logger = getLogger('test-timestamp');
    const timestamp = logger.getTimestamp();
    if (typeof timestamp !== 'string') throw new Error('Should return string');
    // Should be valid date
    if (isNaN(Date.parse(timestamp))) throw new Error('Should be valid date');
});

test('Logger - shouldLog with level', () => {
    const logger = getLogger('test-should', { level: 'info' });
    if (!logger.shouldLog('error')) throw new Error('Should log error');
    if (!logger.shouldLog('warn')) throw new Error('Should log warn');
    if (!logger.shouldLog('info')) throw new Error('Should log info');
    if (logger.shouldLog('debug')) throw new Error('Should not log debug');
    if (logger.shouldLog('trace')) throw new Error('Should not log trace');
});

test('Logger - shouldLog with debug level', () => {
    const logger = createLogger({ level: 'debug' });
    if (!logger.shouldLog('debug')) throw new Error('Should log debug');
    if (logger.shouldLog('trace')) throw new Error('Should not log trace');
});

test('Logger - formatMessage returns formatted', () => {
    const logger = getLogger('test-format', { silent: true });
    const { consoleMessage, fileMessage } = logger.formatMessage('info', 'test message');

    if (typeof consoleMessage !== 'string') throw new Error('Should have consoleMessage');
    if (typeof fileMessage !== 'string') throw new Error('Should have fileMessage');
    if (!consoleMessage.includes('test message')) throw new Error('Should include message');
    if (!fileMessage.includes('test message')) throw new Error('Should include message');
});

test('Logger - formatMessage with meta', () => {
    const logger = getLogger('test-meta', { silent: true });
    const meta = { key: 'value' };
    const { fileMessage } = logger.formatMessage('info', 'test', meta);

    if (!fileMessage.includes('key')) throw new Error('Should include meta key');
});

test('Logger - formatMessage includes icon', () => {
    const logger = getLogger('test-icon', { silent: true });
    const { consoleMessage } = logger.formatMessage('error', 'test');

    if (!consoleMessage.includes('❌')) throw new Error('Should include error icon');
});

test('Logger - formatMessage includes level', () => {
    const logger = getLogger('test-level', { silent: true });
    const { consoleMessage } = logger.formatMessage('warn', 'test');

    if (!consoleMessage.includes('WARN')) throw new Error('Should include level');
});

// ============================================================================
// LOGGING METHOD TESTS
// ============================================================================
console.log('\n📝 Logging Method Tests');
console.log('-'.repeat(70));

test('Logger - error method', () => {
    const logger = getLogger('test-error', { silent: true, logToFile: false });
    // Should not throw
    logger.error('test error');
});

test('Logger - warn method', () => {
    const logger = getLogger('test-warn', { silent: true, logToFile: false });
    // Should not throw
    logger.warn('test warning');
});

test('Logger - info method', () => {
    const logger = getLogger('test-info', { silent: true, logToFile: false });
    // Should not throw
    logger.info('test info');
});

test('Logger - debug method', () => {
    const logger = getLogger('test-debug', { silent: true, logToFile: false, level: 'debug' });
    // Should not throw
    logger.debug('test debug');
});

test('Logger - trace method', () => {
    const logger = getLogger('test-trace', { silent: true, logToFile: false, level: 'trace' });
    // Should not throw
    logger.trace('test trace');
});

test('Logger - log with meta', () => {
    const logger = getLogger('test-log-meta', { silent: true, logToFile: false });
    // Should not throw
    logger.log('info', 'test', { data: 'value' });
});

test('Logger - custom icon', () => {
    const logger = getLogger('test-custom', { silent: true, logToFile: false });
    // Should not throw
    logger.custom('🚀', 'info', 'custom message');
});

// ============================================================================
// GROUPING TESTS
// ============================================================================
console.log('\n👥 Grouping Tests');
console.log('-'.repeat(70));

test('Logger - group method', () => {
    const logger = getLogger('test-group', { silent: true, logToFile: false });
    // Should not throw
    logger.group('Test Group');
});

test('Logger - groupEnd method', () => {
    const logger = getLogger('test-group-end', { silent: true, logToFile: false });
    // Should not throw
    logger.groupEnd();
});

test('Logger - group with groupEnd', () => {
    const logger = getLogger('test-full-group', { silent: true, logToFile: false });
    logger.group('Group');
    logger.info('Inside group');
    logger.groupEnd();
});

// ============================================================================
// TIMING TESTS
// ============================================================================
console.log('\n⏱️  Timing Tests');
console.log('-'.repeat(70));

test('Logger - time method', () => {
    const logger = getLogger('test-time', { silent: true, logToFile: false });
    // Should not throw
    logger.time('operation');
});

test('Logger - timeEnd method', () => {
    const logger = getLogger('test-time-end', { silent: true, logToFile: false });
    logger.time('op');
    // Should not throw
    logger.timeEnd('op');
});

// ============================================================================
// FILE LOGGING TESTS
// ============================================================================
console.log('\n📁 File Logging Tests');
console.log('-'.repeat(70));

test('Logger - writeToFile disabled', () => {
    const logger = getLogger('test-no-file', { logToFile: false, silent: true });
    // Should not throw
    logger.writeToFile('test message');
});

test('Logger - getLogFilePath returns path', () => {
    const logger = getLogger('test-get-path', { logToFile: false });
    const logPath = logger.getLogFilePath();
    if (typeof logPath !== 'string') throw new Error('Should return string');
    if (!logPath.includes('.log')) throw new Error('Should have .log extension');
});

test('Logger - initializeLogDirectory creates dir', () => {
    const testLogDir = path.join(FIXTURES_DIR, 'logs-test');
    const logger = createLogger({
        logDir: testLogDir,
        logToFile: true
    });

    // Directory should exist after initialization
    if (!fs.existsSync(testLogDir)) throw new Error('Should create log directory');

    // Cleanup
    fs.rmSync(testLogDir, { recursive: true, force: true });
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
    console.log('\n🎉 All logger tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
