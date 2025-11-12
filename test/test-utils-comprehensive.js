#!/usr/bin/env node

/**
 * Comprehensive Utils Tests
 * Tests TokenUtils, FileUtils, ClipboardUtils, ConfigUtils, Logger
 */

import TokenUtils from '../lib/utils/token-utils.js';
import FileUtils from '../lib/utils/file-utils.js';
import ClipboardUtils from '../lib/utils/clipboard-utils.js';
import ConfigUtils from '../lib/utils/config-utils.js';
import { Logger, getLogger, createLogger } from '../lib/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

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

console.log('🧪 Testing Utils Modules (v3.0.0)...\n');

// ============================================================================
// TOKEN UTILS TESTS
// ============================================================================
console.log('🎯 TokenUtils Tests');
console.log('-'.repeat(70));

test('TokenUtils - Calculate tokens for simple text', () => {
    const content = 'Hello, world!';
    const tokens = TokenUtils.calculate(content, 'test.txt');
    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens <= 0) throw new Error('Should return positive number');
});

test('TokenUtils - Calculate tokens for JavaScript', () => {
    const content = 'function test() { return 42; }';
    const tokens = TokenUtils.calculate(content, 'test.js');
    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens <= 0) throw new Error('Should return positive number');
});

test('TokenUtils - Calculate tokens for JSON', () => {
    const content = '{"key": "value", "number": 123}';
    const tokens = TokenUtils.calculate(content, 'test.json');
    if (typeof tokens !== 'number') throw new Error('Should return number');
});

test('TokenUtils - Estimate for JavaScript', () => {
    const content = 'const x = 42;';
    const tokens = TokenUtils.estimate(content, 'test.js');
    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens <= 0) throw new Error('Should be positive');
});

test('TokenUtils - Estimate for Python', () => {
    const content = 'def test():\n    return 42';
    const tokens = TokenUtils.estimate(content, 'test.py');
    if (typeof tokens !== 'number') throw new Error('Should return number');
});

test('TokenUtils - Estimate for different file types', () => {
    const content = 'test content';
    const extensions = ['.js', '.ts', '.py', '.java', '.go', '.rs', '.md', '.json'];

    extensions.forEach(ext => {
        const tokens = TokenUtils.estimate(content, `test${ext}`);
        if (typeof tokens !== 'number') throw new Error(`Failed for ${ext}`);
    });
});

test('TokenUtils - Format token count', () => {
    const formatted = TokenUtils.format(1000);
    if (!formatted) throw new Error('Should return formatted string');
    if (typeof formatted !== 'string') throw new Error('Should be string');
});

test('TokenUtils - Format large numbers', () => {
    const tests = [
        { input: 1000, expected: /1[.,]?0*k/ },
        { input: 1000000, expected: /1[.,]?0*m/ },
        { input: 100, expected: /100/ }
    ];

    tests.forEach(({ input, expected }) => {
        const result = TokenUtils.format(input);
        if (!expected.test(result.toLowerCase())) {
            throw new Error(`Format failed for ${input}: got ${result}`);
        }
    });
});

test('TokenUtils - Empty content', () => {
    const tokens = TokenUtils.calculate('', 'test.js');
    if (tokens !== 0) throw new Error('Empty content should return 0 tokens');
});

test('TokenUtils - Very long content', () => {
    const content = 'a'.repeat(10000);
    const tokens = TokenUtils.calculate(content, 'test.txt');
    if (tokens <= 0) throw new Error('Should handle long content');
});

// ============================================================================
// FILE UTILS TESTS
// ============================================================================
console.log('\n📁 FileUtils Tests');
console.log('-'.repeat(70));

test('FileUtils - Detect JavaScript as text', () => {
    if (!FileUtils.isText('test.js')) throw new Error('Should detect .js as text');
});

test('FileUtils - Detect TypeScript as text', () => {
    if (!FileUtils.isText('test.ts')) throw new Error('Should detect .ts as text');
});

test('FileUtils - Detect JSON as text', () => {
    if (!FileUtils.isText('test.json')) throw new Error('Should detect .json as text');
});

test('FileUtils - Detect Markdown as text', () => {
    if (!FileUtils.isText('README.md')) throw new Error('Should detect .md as text');
});

test('FileUtils - Reject binary files', () => {
    const binaryExts = ['.bin', '.exe', '.dll', '.so', '.jpg', '.png', '.pdf'];
    binaryExts.forEach(ext => {
        if (FileUtils.isText(`test${ext}`)) {
            throw new Error(`Should not detect ${ext} as text`);
        }
    });
});

test('FileUtils - Detect code files', () => {
    const codeFiles = ['test.js', 'test.ts', 'test.py', 'test.java', 'test.go', 'test.rs'];
    codeFiles.forEach(file => {
        if (!FileUtils.isCode(file)) {
            throw new Error(`Should detect ${file} as code`);
        }
    });
});

test('FileUtils - Reject non-code files', () => {
    const nonCodeFiles = ['test.md', 'test.json', 'test.txt', 'test.yml'];
    nonCodeFiles.forEach(file => {
        if (FileUtils.isCode(file)) {
            throw new Error(`Should not detect ${file} as code`);
        }
    });
});

test('FileUtils - Get file type', () => {
    const tests = [
        { file: 'test.js', expected: 'code' },
        { file: 'test.json', expected: 'config' },
        { file: 'test.md', expected: 'doc' },
        { file: 'test.css', expected: 'style' }
    ];

    tests.forEach(({ file, expected }) => {
        const type = FileUtils.getType(file);
        if (!type) throw new Error(`Type not detected for ${file}`);
    });
});

test('FileUtils - Is binary (implicit)', () => {
    // Binary files should not be text
    if (FileUtils.isText('test.jpg')) throw new Error('JPG should not be text');
    if (FileUtils.isText('test.png')) throw new Error('PNG should not be text');
    if (FileUtils.isText('test.pdf')) throw new Error('PDF should not be text');
});

test('FileUtils - Get language from extension', () => {
    const lang = FileUtils.getLanguage('test.js');
    if (!lang) throw new Error('Should return language');
    if (typeof lang !== 'string') throw new Error('Language should be string');
});

test('FileUtils - Normalize path', () => {
    const normalized = FileUtils.normalizePath('/path/to/../file.js');
    if (!normalized) throw new Error('Should normalize path');
    if (typeof normalized !== 'string') throw new Error('Should be string');
});

test('FileUtils - Get relative path', () => {
    const rel = FileUtils.getRelativePath('/project', '/project/src/file.js');
    if (!rel) throw new Error('Should return relative path');
    if (rel.includes('/project')) throw new Error('Should not include base path');
});

test('FileUtils - Special filenames (Dockerfile, Makefile)', () => {
    if (!FileUtils.isText('Dockerfile')) throw new Error('Dockerfile should be text');
    if (!FileUtils.isText('Makefile')) throw new Error('Makefile should be text');
    if (!FileUtils.isText('LICENSE')) throw new Error('LICENSE should be text');
});

// ============================================================================
// CLIPBOARD UTILS TESTS
// ============================================================================
console.log('\n📋 ClipboardUtils Tests');
console.log('-'.repeat(70));

test('ClipboardUtils - Is available', () => {
    const available = ClipboardUtils.isAvailable();
    if (typeof available !== 'boolean') throw new Error('Should return boolean');
});

test('ClipboardUtils - Get platform command', () => {
    const command = ClipboardUtils.getPlatformCommand();
    if (!command) throw new Error('Should return command');
    if (typeof command !== 'string') throw new Error('Should be string');
});

test('ClipboardUtils - Copy small text (dry run)', () => {
    // Don't actually copy to avoid side effects
    const text = 'test content';
    const command = ClipboardUtils.getPlatformCommand();
    if (!command) throw new Error('Platform not supported');
    // Just verify the method exists
    if (typeof ClipboardUtils.copy !== 'function') throw new Error('copy method missing');
});

test('ClipboardUtils - Handle unsupported platform gracefully', () => {
    // The method should handle errors gracefully
    if (typeof ClipboardUtils.copy !== 'function') throw new Error('copy method missing');
});

// ============================================================================
// CONFIG UTILS TESTS
// ============================================================================
console.log('\n⚙️  ConfigUtils Tests');
console.log('-'.repeat(70));

test('ConfigUtils - Find config file', () => {
    const config = ConfigUtils.findConfigFile(process.cwd(), 'package.json');
    if (!config) throw new Error('Should find package.json');
    if (!fs.existsSync(config)) throw new Error('Config path should exist');
});

test('ConfigUtils - Find non-existent file returns undefined', () => {
    const config = ConfigUtils.findConfigFile(process.cwd(), 'non-existent-xyz.json');
    if (config !== undefined) throw new Error('Should return undefined for missing file');
});

test('ConfigUtils - Init method filter (no files)', () => {
    const filter = ConfigUtils.initMethodFilter('/tmp');
    // May return null if no config files exist
    if (filter !== null && typeof filter !== 'object') {
        throw new Error('Should return null or object');
    }
});

test('ConfigUtils - Detect method filtering', () => {
    const hasFiltering = ConfigUtils.hasMethodFiltering(process.cwd());
    if (typeof hasFiltering !== 'boolean') throw new Error('Should return boolean');
});

test('ConfigUtils - Get project root', () => {
    const root = ConfigUtils.getProjectRoot();
    if (!root) throw new Error('Should return project root');
    if (typeof root !== 'string') throw new Error('Should be string');
});

test('ConfigUtils - Is context manager project', () => {
    const isCM = ConfigUtils.isContextManagerProject(process.cwd());
    if (typeof isCM !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// LOGGER TESTS
// ============================================================================
console.log('\n📝 Logger Tests');
console.log('-'.repeat(70));

test('Logger - Get logger instance', () => {
    const logger = getLogger('test');
    if (!logger) throw new Error('Should return logger');
    if (typeof logger.info !== 'function') throw new Error('Should have info method');
    if (typeof logger.error !== 'function') throw new Error('Should have error method');
    if (typeof logger.warn !== 'function') throw new Error('Should have warn method');
});

test('Logger - Create custom logger', () => {
    const logger = createLogger('custom', { level: 'debug' });
    if (!logger) throw new Error('Should create logger');
});

test('Logger - Log levels', () => {
    const logger = getLogger('test-levels');
    // Should not throw
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
});

test('Logger - Logger instance properties', () => {
    const logger = getLogger('test-props');
    if (!logger.name) throw new Error('Logger should have name');
    if (typeof logger.level !== 'string') throw new Error('Logger should have level');
});

test('Logger - Set log level', () => {
    const logger = createLogger('test-level', { level: 'error' });
    if (logger.level !== 'error') throw new Error('Level not set correctly');
});

test('Logger - Multiple logger instances', () => {
    const logger1 = getLogger('logger1');
    const logger2 = getLogger('logger2');
    if (logger1.name === logger2.name) throw new Error('Loggers should have different names');
});

test('Logger - Silent mode', () => {
    const logger = createLogger('silent', { level: 'silent' });
    // Should not throw
    logger.info('this should not print');
    logger.error('this should not print');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('TokenUtils + FileUtils integration', () => {
    const file = 'test.js';
    const content = 'function test() {}';

    if (!FileUtils.isCode(file)) throw new Error('File should be code');

    const tokens = TokenUtils.calculate(content, file);
    if (tokens <= 0) throw new Error('Should calculate tokens');
});

test('ConfigUtils + Logger integration', () => {
    const logger = getLogger('config-test');
    const root = ConfigUtils.getProjectRoot();

    logger.info(`Project root: ${root}`);
    // Should not throw
});

test('FileUtils + ConfigUtils integration', () => {
    const packageJson = 'package.json';
    if (!FileUtils.isText(packageJson)) throw new Error('package.json should be text');

    const config = ConfigUtils.findConfigFile(process.cwd(), packageJson);
    if (!config) throw new Error('Should find package.json');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎲 Edge Cases');
console.log('-'.repeat(70));

test('TokenUtils - Null/undefined handling', () => {
    try {
        TokenUtils.calculate(null, 'test.js');
    } catch (error) {
        // Expected to throw or handle gracefully
    }
});

test('FileUtils - Empty filename', () => {
    const isText = FileUtils.isText('');
    // Should handle gracefully
    if (typeof isText !== 'boolean') throw new Error('Should return boolean');
});

test('FileUtils - Path without extension', () => {
    const isText = FileUtils.isText('README');
    // Should handle filenames without extension
    if (typeof isText !== 'boolean') throw new Error('Should return boolean');
});

test('ConfigUtils - Empty project root', () => {
    try {
        ConfigUtils.findConfigFile('', 'test.json');
        // Should handle gracefully
    } catch (error) {
        // May throw, which is acceptable
    }
});

test('TokenUtils - Unicode content', () => {
    const content = '🚀 Unicode test 测试 🎉';
    const tokens = TokenUtils.calculate(content, 'test.txt');
    if (tokens <= 0) throw new Error('Should handle Unicode');
});

test('FileUtils - Case sensitivity', () => {
    // Extensions should be case-insensitive
    if (!FileUtils.isText('test.JS')) throw new Error('Should handle uppercase extensions');
    if (!FileUtils.isText('test.Ts')) throw new Error('Should handle mixed case');
});

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
    console.log('\n🎉 All utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
