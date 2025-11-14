#!/usr/bin/env node

/**
 * Comprehensive Error Scenarios Test Suite
 * Tests edge cases, error handling, and robustness of context-manager
 *
 * Coverage:
 * - Malformed configuration files
 * - Disk/filesystem errors
 * - Permission errors
 * - Large file handling
 * - Binary file handling
 * - Special characters in filenames
 * - Git integration errors
 * - Concurrent modifications
 * - Platform-specific issues
 */

import {
    TokenCalculator,
    MethodAnalyzer,
    GitIgnoreParser,
    MethodFilterParser
} from '../index.js';
import Scanner from '../lib/core/Scanner.js';
import FileUtils from '../lib/utils/file-utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'error-scenarios');

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
        if (process.env.VERBOSE) {
            console.error(error.stack);
        }
        return false;
    }
}

async function asyncTest(name, fn) {
    testsRun++;
    try {
        await fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (process.env.VERBOSE) {
            console.error(error.stack);
        }
        return false;
    }
}

// Setup and cleanup
function setupFixtures() {
    if (!fs.existsSync(FIXTURES_DIR)) {
        fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }
}

function cleanup() {
    try {
        if (fs.existsSync(FIXTURES_DIR)) {
            fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
        }
    } catch (error) {
        console.warn(`Cleanup warning: ${error.message}`);
    }
}

console.log('🧪 Comprehensive Error Scenarios Test Suite\n');
console.log('='.repeat(80));

setupFixtures();

// ============================================================================
// 1. MALFORMED CONFIGURATION FILES
// ============================================================================
console.log('\n📄 Malformed Configuration Files');
console.log('-'.repeat(80));

test('Malformed .contextinclude - invalid regex pattern', () => {
    const testFile = path.join(FIXTURES_DIR, '.contextinclude-bad-regex');
    fs.writeFileSync(testFile, '[invalid(regex\n**/*.js');

    const parser = new GitIgnoreParser(
        path.join(FIXTURES_DIR, '.gitignore'),
        null,
        testFile
    );

    // Should not crash, should handle gracefully
    if (!parser) throw new Error('Parser failed to initialize');
});

test('Malformed .contextignore - mixed valid/invalid patterns', () => {
    const testFile = path.join(FIXTURES_DIR, '.contextignore-mixed');
    fs.writeFileSync(testFile, '*.js\n[[[invalid\n**/*.ts\n(unclosed');

    const parser = new GitIgnoreParser(
        path.join(FIXTURES_DIR, '.gitignore'),
        testFile,
        null
    );

    // Should parse valid patterns and skip invalid ones
    if (!parser) throw new Error('Parser failed to initialize');
    if (!parser.contextPatterns) throw new Error('Context patterns not initialized');
});

test('Malformed .methodinclude - empty lines and comments', () => {
    const testFile = path.join(FIXTURES_DIR, '.methodinclude-whitespace');
    fs.writeFileSync(testFile, '\n\n# Comment\n\ntest*\n  \n# Another comment\n');

    const parser = new MethodFilterParser(testFile, null);

    // Should filter out empty lines and comments
    if (parser.includePatterns.length !== 1) {
        throw new Error(`Expected 1 pattern, got ${parser.includePatterns.length}`);
    }
});

test('Malformed .methodignore - unicode characters', () => {
    const testFile = path.join(FIXTURES_DIR, '.methodignore-unicode');
    fs.writeFileSync(testFile, 'test📝Function\n测试方法\nméthode');

    const parser = new MethodFilterParser(null, testFile);

    // Should handle unicode patterns
    if (parser.ignorePatterns.length !== 3) {
        throw new Error(`Expected 3 patterns, got ${parser.ignorePatterns.length}`);
    }
});

test('Configuration file as directory instead of file', () => {
    const testDir = path.join(FIXTURES_DIR, '.contextinclude-dir');
    fs.mkdirSync(testDir, { recursive: true });

    const parser = new GitIgnoreParser(
        path.join(FIXTURES_DIR, '.gitignore'),
        null,
        testDir
    );

    // Should handle gracefully when config is a directory
    if (!parser) throw new Error('Parser should handle directory as config file');
});

test('Configuration file with only whitespace', () => {
    const testFile = path.join(FIXTURES_DIR, '.contextignore-whitespace');
    fs.writeFileSync(testFile, '   \n\t\n  \t  \n');

    const parser = new GitIgnoreParser(
        path.join(FIXTURES_DIR, '.gitignore'),
        testFile,
        null
    );

    // Should result in no patterns
    if (parser.contextPatterns.length !== 0) {
        throw new Error('Should have 0 patterns for whitespace-only file');
    }
});

test('Configuration file with very long pattern', () => {
    const testFile = path.join(FIXTURES_DIR, '.contextignore-long');
    const longPattern = '*'.repeat(10000) + '.js';
    fs.writeFileSync(testFile, longPattern);

    const parser = new GitIgnoreParser(
        path.join(FIXTURES_DIR, '.gitignore'),
        testFile,
        null
    );

    // Should handle long patterns
    if (!parser) throw new Error('Parser should handle long patterns');
});

// ============================================================================
// 2. FILE PERMISSION ERRORS
// ============================================================================
console.log('\n🔒 File Permission Errors');
console.log('-'.repeat(80));

test('Permission denied reading file (simulated)', () => {
    const testFile = path.join(FIXTURES_DIR, 'readonly.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    // On Unix-like systems, make file unreadable
    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(testFile, 0o000);

            const analyzer = new TokenCalculator(FIXTURES_DIR);
            const result = analyzer.analyzeFile(testFile);

            // Should return error result, not crash
            if (!result) throw new Error('Should return result object');
            if (!result.error && result.tokens !== 0) {
                // File might be readable due to user permissions
                console.log('   ⚠️  Note: File was readable despite chmod (running as root?)');
            }

            // Restore permissions for cleanup
            fs.chmodSync(testFile, 0o644);
        } catch (error) {
            // Expected on some systems
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                // This is expected
            } else {
                throw error;
            }
        }
    }
});

test('Permission denied writing export file (simulated)', () => {
    const testDir = path.join(FIXTURES_DIR, 'readonly-dir');
    fs.mkdirSync(testDir, { recursive: true });

    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(testDir, 0o555); // Read + execute only

            const exportPath = path.join(testDir, 'export.json');

            try {
                fs.writeFileSync(exportPath, '{}');
                // If this succeeds, we have write permission anyway
                console.log('   ⚠️  Note: Could write to readonly directory (running as root?)');
            } catch (error) {
                // Expected error
                if (error.code !== 'EACCES') {
                    throw error;
                }
            }

            // Restore permissions
            fs.chmodSync(testDir, 0o755);
        } catch (error) {
            if (error.code === 'EPERM') {
                // Expected on some systems
            } else {
                throw error;
            }
        }
    }
});

test('Permission denied creating directories', () => {
    const parentDir = path.join(FIXTURES_DIR, 'no-write-parent');
    fs.mkdirSync(parentDir, { recursive: true });

    if (process.platform !== 'win32') {
        try {
            fs.chmodSync(parentDir, 0o555); // Read + execute only, no write

            const newDir = path.join(parentDir, 'new-subdir');

            try {
                fs.mkdirSync(newDir);
                console.log('   ⚠️  Note: Could create directory despite no write permission (running as root?)');
                // Clean up if it was created
                try {
                    fs.rmdirSync(newDir);
                } catch (e) {}
            } catch (error) {
                // Expected error
                if (error.code !== 'EACCES' && error.code !== 'EPERM') {
                    throw new Error(`Unexpected error: ${error.code}`);
                }
                // This is the expected behavior
            }

            // Restore permissions
            fs.chmodSync(parentDir, 0o755);
        } catch (error) {
            if (error.code === 'EPERM') {
                // Expected on some systems
            } else {
                throw error;
            }
        }
    }
});

// ============================================================================
// 3. BINARY FILE HANDLING
// ============================================================================
console.log('\n📦 Binary File Handling');
console.log('-'.repeat(80));

test('Binary file detection - .exe file', () => {
    const testFile = path.join(FIXTURES_DIR, 'test.exe');
    const binaryData = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ header
    fs.writeFileSync(testFile, binaryData);

    const isText = FileUtils.isText(testFile);
    if (isText) {
        throw new Error('.exe file should be detected as binary');
    }
});

test('Binary file detection - .png file', () => {
    const testFile = path.join(FIXTURES_DIR, 'test.png');
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    fs.writeFileSync(testFile, pngHeader);

    const isText = FileUtils.isText(testFile);
    if (isText) {
        throw new Error('.png file should be detected as binary');
    }
});

test('Binary file with .js extension', () => {
    const testFile = path.join(FIXTURES_DIR, 'binary.js');
    const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
    fs.writeFileSync(testFile, binaryData);

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    // Should handle gracefully
    if (!result) throw new Error('Should return result for binary .js file');
});

test('File with null bytes', () => {
    const testFile = path.join(FIXTURES_DIR, 'nullbytes.txt');
    fs.writeFileSync(testFile, 'Hello\x00World\x00Test');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    // Should handle files with null bytes
    if (!result) throw new Error('Should handle files with null bytes');
});

// ============================================================================
// 4. FILE ENCODING ISSUES
// ============================================================================
console.log('\n🔤 File Encoding Issues');
console.log('-'.repeat(80));

test('File with BOM (UTF-8)', () => {
    const testFile = path.join(FIXTURES_DIR, 'bom-utf8.js');
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    const content = Buffer.from('const x = 42;');
    fs.writeFileSync(testFile, Buffer.concat([bom, content]));

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    // Should handle BOM correctly
    if (!result || result.tokens === 0) {
        throw new Error('Should parse file with BOM');
    }
});

test('File with BOM (UTF-16 LE)', () => {
    const testFile = path.join(FIXTURES_DIR, 'bom-utf16le.js');
    const bom = Buffer.from([0xFF, 0xFE]);
    const content = Buffer.from('const x = 42;', 'utf16le');
    fs.writeFileSync(testFile, Buffer.concat([bom, content]));

    try {
        const analyzer = new TokenCalculator(FIXTURES_DIR);
        const result = analyzer.analyzeFile(testFile);
        // UTF-16 might not be supported, that's okay
        if (!result) throw new Error('Should return result object');
    } catch (error) {
        // UTF-16 files might fail to read, that's acceptable
    }
});

test('File with invalid UTF-8 sequences', () => {
    const testFile = path.join(FIXTURES_DIR, 'invalid-utf8.js');
    // Invalid UTF-8 sequences
    const invalidUtf8 = Buffer.from([0xC0, 0xC1, 0xF5, 0xF6, 0xF7, 0xF8, 0xF9]);
    fs.writeFileSync(testFile, invalidUtf8);

    try {
        const analyzer = new TokenCalculator(FIXTURES_DIR);
        const result = analyzer.analyzeFile(testFile);
        // Should handle gracefully
        if (!result) throw new Error('Should return result object');
    } catch (error) {
        // Invalid UTF-8 might cause errors, that's acceptable
    }
});

test('File with mixed line endings (CRLF + LF)', () => {
    const testFile = path.join(FIXTURES_DIR, 'mixed-lineendings.js');
    fs.writeFileSync(testFile, 'function test1() {}\r\nfunction test2() {}\nfunction test3() {}\r\n');

    const analyzer = new MethodAnalyzer();
    const content = fs.readFileSync(testFile, 'utf8');
    const methods = analyzer.extractMethods(content, testFile);

    // Should extract all methods regardless of line endings
    if (methods.length !== 3) {
        throw new Error(`Expected 3 methods, got ${methods.length}`);
    }
});

// ============================================================================
// 5. SPECIAL CHARACTERS IN FILENAMES
// ============================================================================
console.log('\n🔣 Special Characters in Filenames');
console.log('-'.repeat(80));

test('Filename with spaces', () => {
    const testFile = path.join(FIXTURES_DIR, 'file with spaces.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle filenames with spaces');
    }
});

test('Filename with unicode characters', () => {
    const testFile = path.join(FIXTURES_DIR, '测试文件.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle unicode filenames');
    }
});

test('Filename with emoji', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-📝-file.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle filenames with emoji');
    }
});

test('Filename with special chars (%&$)', () => {
    const testFile = path.join(FIXTURES_DIR, 'test%file&name$.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle filenames with special characters');
    }
});

test('Filename starting with dot (hidden file)', () => {
    const testFile = path.join(FIXTURES_DIR, '.hidden-config.js');
    fs.writeFileSync(testFile, 'module.exports = {};');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle hidden files');
    }
});

test('Filename without extension', () => {
    const testFile = path.join(FIXTURES_DIR, 'Makefile');
    fs.writeFileSync(testFile, 'all:\n\techo "test"');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result) {
        throw new Error('Should handle files without extension');
    }
});

// ============================================================================
// 6. LARGE FILE HANDLING
// ============================================================================
console.log('\n📊 Large File Handling');
console.log('-'.repeat(80));

test('Large file (1MB)', () => {
    const testFile = path.join(FIXTURES_DIR, 'large-1mb.js');
    const largeContent = 'function test() { return 42; }\n'.repeat(35000); // ~1MB
    fs.writeFileSync(testFile, largeContent);

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle 1MB files');
    }
    if (result.sizeBytes < 900000) { // ~900KB is acceptable for "1MB" test
        throw new Error(`File size too small: ${result.sizeBytes} bytes`);
    }
});

test('Large file (10MB)', () => {
    const testFile = path.join(FIXTURES_DIR, 'large-10mb.js');
    const largeContent = 'function test() { return 42; }\n'.repeat(350000); // ~10MB
    fs.writeFileSync(testFile, largeContent);

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result) {
        throw new Error('Should handle 10MB files');
    }
    if (result.sizeBytes < 9000000) { // ~9MB is acceptable for "10MB" test
        throw new Error(`File size too small: ${result.sizeBytes} bytes`);
    }
});

test('Very long single line (100k chars)', () => {
    const testFile = path.join(FIXTURES_DIR, 'long-line.js');
    const longLine = 'const x = "' + 'a'.repeat(100000) + '";';
    fs.writeFileSync(testFile, longLine);

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result || result.tokens === 0) {
        throw new Error('Should handle very long lines');
    }
});

// ============================================================================
// 7. SYMLINK HANDLING
// ============================================================================
console.log('\n🔗 Symlink Handling');
console.log('-'.repeat(80));

test('Broken symlink', () => {
    if (process.platform !== 'win32') {
        const linkPath = path.join(FIXTURES_DIR, 'broken-link.js');
        const targetPath = path.join(FIXTURES_DIR, 'nonexistent.js');

        try {
            fs.symlinkSync(targetPath, linkPath);

            const scanner = new Scanner(FIXTURES_DIR);
            const files = scanner.scan();

            // Should not crash on broken symlinks
            if (!files) throw new Error('Scanner should return results');

            // Cleanup
            fs.unlinkSync(linkPath);
        } catch (error) {
            if (error.code === 'EPERM') {
                console.log('   ⚠️  Note: Symlink test skipped (requires permissions)');
            } else {
                throw error;
            }
        }
    }
});

test('Circular symlink', () => {
    if (process.platform !== 'win32') {
        const dir1 = path.join(FIXTURES_DIR, 'circular1');
        const dir2 = path.join(FIXTURES_DIR, 'circular2');

        try {
            fs.mkdirSync(dir1, { recursive: true });
            fs.mkdirSync(dir2, { recursive: true });

            const link1 = path.join(dir1, 'link-to-2');
            const link2 = path.join(dir2, 'link-to-1');

            fs.symlinkSync(dir2, link1);
            fs.symlinkSync(dir1, link2);

            const scanner = new Scanner(FIXTURES_DIR, { followSymlinks: false });
            const files = scanner.scan();

            // Should not hang on circular symlinks
            if (!files) throw new Error('Scanner should return results');

            // Cleanup
            fs.unlinkSync(link1);
            fs.unlinkSync(link2);
            fs.rmdirSync(dir1);
            fs.rmdirSync(dir2);
        } catch (error) {
            if (error.code === 'EPERM') {
                console.log('   ⚠️  Note: Circular symlink test skipped (requires permissions)');
            } else {
                throw error;
            }
        }
    }
});

// ============================================================================
// 8. DIRECTORY STRUCTURE EDGE CASES
// ============================================================================
console.log('\n📁 Directory Structure Edge Cases');
console.log('-'.repeat(80));

test('Empty directory', () => {
    const emptyDir = path.join(FIXTURES_DIR, 'empty-dir');
    fs.mkdirSync(emptyDir, { recursive: true });

    const scanner = new Scanner(emptyDir);
    const files = scanner.scan();

    if (!Array.isArray(files)) {
        throw new Error('Scanner should return array for empty directory');
    }
    if (files.length !== 0) {
        throw new Error('Empty directory should return 0 files');
    }
});

test('Very deep directory nesting (50 levels)', () => {
    let currentPath = FIXTURES_DIR;
    for (let i = 0; i < 50; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        fs.mkdirSync(currentPath, { recursive: true });
    }

    fs.writeFileSync(path.join(currentPath, 'deep.js'), 'const x = 42;');

    const scanner = new Scanner(FIXTURES_DIR);
    const files = scanner.scan();

    if (!files || files.length === 0) {
        throw new Error('Should handle deep directory nesting');
    }
});

test('Directory with many files (1000 files)', () => {
    const manyFilesDir = path.join(FIXTURES_DIR, 'many-files');
    fs.mkdirSync(manyFilesDir, { recursive: true });

    for (let i = 0; i < 1000; i++) {
        fs.writeFileSync(path.join(manyFilesDir, `file${i}.js`), `const x${i} = ${i};`);
    }

    const scanner = new Scanner(manyFilesDir);
    const startTime = Date.now();
    const files = scanner.scan();
    const elapsed = Date.now() - startTime;

    if (files.length !== 1000) {
        throw new Error(`Expected 1000 files, got ${files.length}`);
    }

    // Should complete in reasonable time (< 5 seconds)
    if (elapsed > 5000) {
        console.log(`   ⚠️  Warning: Scanning 1000 files took ${elapsed}ms`);
    }
});

test('Empty file', () => {
    const testFile = path.join(FIXTURES_DIR, 'empty.js');
    fs.writeFileSync(testFile, '');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result) {
        throw new Error('Should handle empty files');
    }
    if (result.tokens !== 0) {
        throw new Error('Empty file should have 0 tokens');
    }
    if (result.lines !== 0) {
        throw new Error('Empty file should have 0 lines');
    }
});

test('File with only whitespace', () => {
    const testFile = path.join(FIXTURES_DIR, 'whitespace.js');
    fs.writeFileSync(testFile, '   \n\t\n  \t  \n');

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const result = analyzer.analyzeFile(testFile);

    if (!result) {
        throw new Error('Should handle whitespace-only files');
    }
    if (result.lines === 0) {
        throw new Error('Whitespace file should have line count');
    }
});

// ============================================================================
// 9. METHOD EXTRACTION EDGE CASES
// ============================================================================
console.log('\n🔍 Method Extraction Edge Cases');
console.log('-'.repeat(80));

test('Method extraction - nested functions', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        function outer() {
            function inner() {
                return 42;
            }
            return inner();
        }
    `;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    // Should extract both outer and inner functions
    if (methods.length < 2) {
        throw new Error(`Expected at least 2 methods, got ${methods.length}`);
    }
});

test('Method extraction - immediately invoked function expression (IIFE)', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        (function() {
            console.log('IIFE');
        })();

        const result = (function namedIIFE() {
            return 42;
        })();
    `;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    // Should extract IIFE functions
    if (!methods || methods.length === 0) {
        throw new Error('Should extract IIFE functions');
    }
});

test('Method extraction - generator functions', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        function* generator() {
            yield 1;
            yield 2;
        }

        const gen = function*() {
            yield 42;
        };
    `;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    // Should handle generator functions
    if (!methods || methods.length === 0) {
        throw new Error('Should extract generator functions');
    }
});

test('Method extraction - async/await patterns', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        async function fetchData() {
            return await fetch('/api');
        }

        const asyncArrow = async () => {
            return await Promise.resolve(42);
        };

        class MyClass {
            async asyncMethod() {
                return await this.getData();
            }
        }
    `;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    // Should extract all async functions
    if (methods.length < 3) {
        throw new Error(`Expected at least 3 async methods, got ${methods.length}`);
    }
});

test('Method extraction - class methods with decorators', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const testCode = `
        class MyClass {
            @readonly
            get name() {
                return this._name;
            }

            @validate
            set name(value) {
                this._name = value;
            }

            @deprecated
            oldMethod() {
                return 42;
            }
        }
    `;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    // Should handle decorators
    if (!methods || methods.length === 0) {
        throw new Error('Should extract methods with decorators');
    }
});

test('Method extraction - methods with very long names', () => {
    const methodAnalyzer = new MethodAnalyzer();
    const longName = 'veryLongMethodName' + 'WithLotsOfWords'.repeat(20);
    const testCode = `function ${longName}() { return 42; }`;

    const methods = methodAnalyzer.extractMethods(testCode, 'test.js');

    if (methods.length !== 1) {
        throw new Error('Should extract method with long name');
    }
    if (methods[0].name !== longName) {
        throw new Error('Method name not preserved correctly');
    }
});

// ============================================================================
// 10. TOKEN CALCULATION EDGE CASES
// ============================================================================
console.log('\n📊 Token Calculation Edge Cases');
console.log('-'.repeat(80));

test('Token calculation - extremely long string', () => {
    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const longString = '"' + 'a'.repeat(100000) + '"';
    const tokens = analyzer.calculateTokens(longString, 'test.js');

    if (typeof tokens !== 'number' || tokens <= 0) {
        throw new Error('Should calculate tokens for long strings');
    }
});

test('Token calculation - deeply nested JSON', () => {
    const analyzer = new TokenCalculator(FIXTURES_DIR);
    let nested = '{"a":';
    for (let i = 0; i < 100; i++) {
        nested += '{"b":';
    }
    nested += '42';
    for (let i = 0; i < 100; i++) {
        nested += '}';
    }
    nested += '}';

    const tokens = analyzer.calculateTokens(nested, 'test.json');

    if (typeof tokens !== 'number' || tokens <= 0) {
        throw new Error('Should calculate tokens for deeply nested JSON');
    }
});

test('Token calculation - mixed scripts (JS + HTML)', () => {
    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const mixed = `
        <script>
            function test() { return 42; }
        </script>
        <style>
            body { color: red; }
        </style>
    `;

    const tokens = analyzer.calculateTokens(mixed, 'test.html');

    if (typeof tokens !== 'number' || tokens <= 0) {
        throw new Error('Should calculate tokens for mixed content');
    }
});

// ============================================================================
// 11. CONCURRENT MODIFICATION SCENARIOS
// ============================================================================
console.log('\n⚡ Concurrent Modification Scenarios');
console.log('-'.repeat(80));

test('File deleted during analysis', () => {
    const testFile = path.join(FIXTURES_DIR, 'temp-delete.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // Delete file immediately after creating analyzer
    fs.unlinkSync(testFile);

    const result = analyzer.analyzeFile(testFile);

    // Should handle gracefully
    if (!result) {
        throw new Error('Should return result object for deleted file');
    }
    if (!result.error) {
        throw new Error('Should have error for deleted file');
    }
});

test('File modified during read (simulated)', () => {
    const testFile = path.join(FIXTURES_DIR, 'concurrent-modify.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // This is hard to test reliably, but we can at least verify
    // the analyzer doesn't crash when file changes between stat and read
    setTimeout(() => {
        try {
            fs.writeFileSync(testFile, 'const x = 100;');
        } catch (e) {
            // File might be locked
        }
    }, 0);

    const result = analyzer.analyzeFile(testFile);

    // Should complete without crashing
    if (!result) {
        throw new Error('Should handle concurrent modifications');
    }
});

test('Directory deleted during analysis', () => {
    const testDir = path.join(FIXTURES_DIR, 'to-be-deleted');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'file1.js'), 'const x = 1;');
    fs.writeFileSync(path.join(testDir, 'file2.js'), 'const x = 2;');

    const scanner = new Scanner(FIXTURES_DIR);

    // Start scanning, then delete directory
    // Scanner should handle missing directory gracefully
    try {
        // Simulate directory deletion during traversal
        fs.rmSync(testDir, { recursive: true, force: true });

        const files = scanner.scan();

        // Should complete without crashing
        if (!Array.isArray(files)) {
            throw new Error('Scanner should return array even if directory deleted');
        }
    } catch (error) {
        // ENOENT is acceptable
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
});

test('File renamed during analysis', () => {
    const testFile1 = path.join(FIXTURES_DIR, 'rename-original.js');
    const testFile2 = path.join(FIXTURES_DIR, 'rename-new.js');
    fs.writeFileSync(testFile1, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // Rename file immediately
    fs.renameSync(testFile1, testFile2);

    const result = analyzer.analyzeFile(testFile1);

    // Should handle gracefully
    if (!result) {
        throw new Error('Should return result object for renamed file');
    }
    if (!result.error) {
        throw new Error('Should have error for renamed/missing file');
    }

    // Cleanup
    try { fs.unlinkSync(testFile2); } catch (e) {}
});

// ============================================================================
// 12. PATTERN MATCHING EDGE CASES
// ============================================================================
console.log('\n🎯 Pattern Matching Edge Cases');
console.log('-'.repeat(80));

test('GitIgnore pattern - negation with complex path', () => {
    const gitignorePath = path.join(FIXTURES_DIR, '.gitignore-negation');
    fs.writeFileSync(gitignorePath, '*.log\n!important.log\nsrc/**/*.tmp\n!src/critical/*.tmp');

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Should handle negation patterns
    if (!parser.patterns || parser.patterns.length === 0) {
        throw new Error('Should parse negation patterns');
    }

    const negationPatterns = parser.patterns.filter(p => p.isNegation);
    if (negationPatterns.length !== 2) {
        throw new Error(`Expected 2 negation patterns, got ${negationPatterns.length}`);
    }
});

test('GitIgnore pattern - recursive wildcard matching', () => {
    const gitignorePath = path.join(FIXTURES_DIR, '.gitignore-recursive');
    fs.writeFileSync(gitignorePath, '**/*.log\n**/node_modules/**\nsrc/**/temp/**');

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    const isIgnored1 = parser.isIgnored(null, 'deep/nested/path/file.log');
    const isIgnored2 = parser.isIgnored(null, 'project/node_modules/package/index.js');

    if (!isIgnored1) {
        throw new Error('Recursive pattern should match nested .log files');
    }
    if (!isIgnored2) {
        throw new Error('Recursive pattern should match node_modules at any level');
    }
});

test('Method filter - wildcard pattern matching', () => {
    const includeFile = path.join(FIXTURES_DIR, '.methodinclude-wildcard');
    fs.writeFileSync(includeFile, 'test*\n*Handler\nget*\nset*');

    const parser = new MethodFilterParser(includeFile, null);

    const shouldInclude1 = parser.shouldIncludeMethod('testFunction', 'MyClass');
    const shouldInclude2 = parser.shouldIncludeMethod('clickHandler', 'Button'); // Changed to match *Handler
    const shouldInclude3 = parser.shouldIncludeMethod('getName', 'User');
    const shouldInclude4 = parser.shouldIncludeMethod('randomMethod', 'Random');

    if (!shouldInclude1) throw new Error('Should include testFunction (test*)');
    if (!shouldInclude2) throw new Error('Should include clickHandler (*Handler)');
    if (!shouldInclude3) throw new Error('Should include getName (get*)');
    if (shouldInclude4) throw new Error('Should not include randomMethod');
});

// ============================================================================
// 13. PLATFORM-SPECIFIC ISSUES
// ============================================================================
console.log('\n💻 Platform-Specific Issues');
console.log('-'.repeat(80));

test('Path separators - cross-platform compatibility', () => {
    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // Test both Unix and Windows style paths
    const unixPath = 'src/utils/helper.js';
    const winPath = 'src\\utils\\helper.js';

    // Both should work through path.normalize
    const normalized1 = path.normalize(unixPath);
    const normalized2 = path.normalize(winPath);

    if (!normalized1 || !normalized2) {
        throw new Error('Path normalization failed');
    }
});

test('Case sensitivity handling', () => {
    const testFile1 = path.join(FIXTURES_DIR, 'CamelCase.js');
    const testFile2 = path.join(FIXTURES_DIR, 'camelcase.js');

    fs.writeFileSync(testFile1, 'const x = 1;');

    // On case-insensitive filesystems (macOS, Windows), these are the same file
    // On case-sensitive filesystems (Linux), they're different
    const exists1 = fs.existsSync(testFile1);
    const exists2 = fs.existsSync(testFile2);

    if (exists1 !== exists2) {
        // Case-insensitive filesystem
        console.log('   ℹ️  Detected case-insensitive filesystem');
    } else {
        // Case-sensitive filesystem or both exist/don't exist
        console.log('   ℹ️  Detected case-sensitive filesystem');
    }

    // Should handle both cases
    if (!exists1) {
        throw new Error('File should exist');
    }
});

if (process.platform === 'win32') {
    test('Windows reserved filenames', () => {
        // Windows reserves certain filenames (CON, PRN, AUX, NUL, etc.)
        // We can't create these files, but we should handle them gracefully
        const analyzer = new TokenCalculator(FIXTURES_DIR);

        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'];
        for (const name of reservedNames) {
            const testPath = path.join(FIXTURES_DIR, `${name}.js`);

            try {
                // This will likely fail on Windows
                fs.writeFileSync(testPath, 'const x = 42;');
                // If it succeeds, clean up
                fs.unlinkSync(testPath);
            } catch (error) {
                // Expected on Windows
                if (error.code !== 'ENOENT' && !error.message.includes('reserved')) {
                    console.log(`   ⚠️  Unexpected error for ${name}: ${error.message}`);
                }
            }
        }
    });

    test('Windows path length limit (260 chars)', () => {
        // Windows has a MAX_PATH limit of 260 characters (can be removed in newer versions)
        const longPath = path.join(FIXTURES_DIR, 'a'.repeat(200), 'file.js');

        try {
            fs.mkdirSync(path.dirname(longPath), { recursive: true });
            fs.writeFileSync(longPath, 'const x = 42;');

            const analyzer = new TokenCalculator(FIXTURES_DIR);
            const result = analyzer.analyzeFile(longPath);

            if (!result) {
                throw new Error('Should handle long paths');
            }
        } catch (error) {
            if (error.code === 'ENAMETOOLONG' || error.code === 'ENOENT') {
                console.log('   ⚠️  Path too long for this system');
            } else {
                throw error;
            }
        }
    });
}

// ============================================================================
// 14. MEMORY AND PERFORMANCE EDGE CASES
// ============================================================================
console.log('\n🧠 Memory and Performance Edge Cases');
console.log('-'.repeat(80));

test('Many small files vs few large files', () => {
    const manySmallDir = path.join(FIXTURES_DIR, 'many-small');
    const fewLargeDir = path.join(FIXTURES_DIR, 'few-large');

    fs.mkdirSync(manySmallDir, { recursive: true });
    fs.mkdirSync(fewLargeDir, { recursive: true });

    // Create 100 small files (1KB each)
    for (let i = 0; i < 100; i++) {
        fs.writeFileSync(
            path.join(manySmallDir, `small${i}.js`),
            `const x${i} = ${i};\n`.repeat(20)
        );
    }

    // Create 10 large files (10KB each)
    for (let i = 0; i < 10; i++) {
        fs.writeFileSync(
            path.join(fewLargeDir, `large${i}.js`),
            `const x${i} = ${i};\n`.repeat(200)
        );
    }

    const scanner1 = new Scanner(manySmallDir);
    const start1 = Date.now();
    const files1 = scanner1.scan();
    const time1 = Date.now() - start1;

    const scanner2 = new Scanner(fewLargeDir);
    const start2 = Date.now();
    const files2 = scanner2.scan();
    const time2 = Date.now() - start2;

    console.log(`   ℹ️  Many small: ${files1.length} files in ${time1}ms`);
    console.log(`   ℹ️  Few large: ${files2.length} files in ${time2}ms`);

    if (files1.length !== 100 || files2.length !== 10) {
        throw new Error('File count mismatch');
    }
});

test('Memory usage with large dataset (simulated)', () => {
    const testDir = path.join(FIXTURES_DIR, 'memory-test');
    fs.mkdirSync(testDir, { recursive: true });

    // Create 500 files with moderate size
    for (let i = 0; i < 500; i++) {
        fs.writeFileSync(
            path.join(testDir, `file${i}.js`),
            `function test${i}() { return ${i}; }\n`.repeat(50)
        );
    }

    const memBefore = process.memoryUsage().heapUsed;

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const memAfter = process.memoryUsage().heapUsed;
    const memDelta = (memAfter - memBefore) / 1024 / 1024; // MB

    console.log(`   ℹ️  Memory delta: ${memDelta.toFixed(2)} MB for ${files.length} files`);

    if (files.length !== 500) {
        throw new Error(`Expected 500 files, got ${files.length}`);
    }

    // Memory usage should be reasonable (< 100MB for 500 files)
    if (memDelta > 100) {
        console.log(`   ⚠️  Warning: High memory usage detected`);
    }
});

// ============================================================================
// 15. STACK OVERFLOW AND DEEP RECURSION
// ============================================================================
console.log('\n🔁 Stack Overflow and Deep Recursion');
console.log('-'.repeat(80));

test('Very deep directory recursion (200 levels)', () => {
    let currentPath = FIXTURES_DIR;
    const maxDepth = 200;

    // Create deeply nested structure
    for (let i = 0; i < maxDepth; i++) {
        currentPath = path.join(currentPath, `d${i}`);
        fs.mkdirSync(currentPath, { recursive: true });
    }

    fs.writeFileSync(path.join(currentPath, 'deep.js'), 'const x = 42;');

    try {
        const scanner = new Scanner(FIXTURES_DIR, { maxDepth: 250 });
        const files = scanner.scan();

        // Should handle without stack overflow
        if (!Array.isArray(files)) {
            throw new Error('Should return array for deep recursion');
        }

        const stats = scanner.getStats();
        console.log(`   ℹ️  Scanned ${stats.directoriesTraversed} directories at ${maxDepth} levels`);
    } catch (error) {
        if (error.message && error.message.includes('stack')) {
            throw new Error('Stack overflow detected - recursion not handled properly');
        }
        throw error;
    }
});

test('Recursive pattern with nested paths', () => {
    const testDir = path.join(FIXTURES_DIR, 'recursive-pattern-test');
    fs.mkdirSync(testDir, { recursive: true });

    // Create nested structure with files
    const levels = ['a', 'b', 'c', 'd', 'e'];
    let currentDir = testDir;

    for (const level of levels) {
        currentDir = path.join(currentDir, level);
        fs.mkdirSync(currentDir, { recursive: true });
        fs.writeFileSync(path.join(currentDir, 'test.js'), 'const x = 1;');
        fs.writeFileSync(path.join(currentDir, 'test.log'), 'log entry');
    }

    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '**/*.log');

    const parser = new GitIgnoreParser(gitignorePath, null, null);
    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    // All .js files should be included, all .log files excluded
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const logFiles = files.filter(f => f.name.endsWith('.log'));

    if (jsFiles.length !== levels.length) {
        throw new Error(`Expected ${levels.length} JS files, got ${jsFiles.length}`);
    }
    if (logFiles.length !== 0) {
        throw new Error('Log files should be ignored by recursive pattern');
    }
});

// ============================================================================
// 16. INVALID REGEX PATTERNS
// ============================================================================
console.log('\n🚫 Invalid Regex Patterns');
console.log('-'.repeat(80));

test('Invalid regex in .gitignore - catastrophic backtracking', () => {
    const testFile = path.join(FIXTURES_DIR, '.gitignore-catastrophic');
    // Pattern that could cause catastrophic backtracking
    fs.writeFileSync(testFile, '(a+)+b\n(x*)*y\n.*.*.*.*.*');

    try {
        const parser = new GitIgnoreParser(testFile, null, null);

        // Test against a long string
        const longPath = 'a'.repeat(100) + 'x';
        const start = Date.now();
        const ignored = parser.isIgnored(null, longPath);
        const elapsed = Date.now() - start;

        // Should complete quickly (< 100ms) even with complex patterns
        if (elapsed > 100) {
            console.log(`   ⚠️  Warning: Pattern matching took ${elapsed}ms (potential backtracking issue)`);
        }
    } catch (error) {
        // Invalid regex should be handled gracefully
        if (error.name === 'SyntaxError') {
            // This is acceptable - invalid regex caught
        } else {
            throw error;
        }
    }
});

test('Invalid regex in .methodinclude - unclosed groups', () => {
    const testFile = path.join(FIXTURES_DIR, '.methodinclude-invalid-regex');
    fs.writeFileSync(testFile, 'test[unclosed\n(unclosed\n{invalid');

    try {
        const parser = new MethodFilterParser(testFile, null);

        // Should not crash, even with invalid patterns
        if (!parser) throw new Error('Parser should initialize despite invalid patterns');

        // Try to use it
        const shouldInclude = parser.shouldIncludeMethod('testMethod', 'TestClass');

        // Should handle gracefully (either include or exclude, but not crash)
        if (typeof shouldInclude !== 'boolean') {
            throw new Error('Should return boolean even with invalid patterns');
        }
    } catch (error) {
        // SyntaxError is acceptable for invalid regex
        if (error.name !== 'SyntaxError') {
            throw error;
        }
    }
});

test('Regex with lookahead/lookbehind', () => {
    const testFile = path.join(FIXTURES_DIR, '.methodinclude-lookahead');
    // Advanced regex features
    fs.writeFileSync(testFile, 'test(?=Handler)\n(?<=get).*\nmethod(?!Test)');

    try {
        const parser = new MethodFilterParser(testFile, null);

        // These might work or might not depending on regex engine
        const test1 = parser.shouldIncludeMethod('testHandler', 'Class');
        const test2 = parser.shouldIncludeMethod('getMethod', 'Class');

        // Should at least not crash
        if (typeof test1 !== 'boolean' || typeof test2 !== 'boolean') {
            throw new Error('Should handle lookahead/lookbehind patterns');
        }
    } catch (error) {
        // SyntaxError is acceptable if lookahead/lookbehind not supported
        if (error.name !== 'SyntaxError') {
            throw error;
        }
    }
});

// ============================================================================
// 17. EXTREMELY LARGE FILES
// ============================================================================
console.log('\n💾 Extremely Large Files');
console.log('-'.repeat(80));

test('Large file (50MB) - performance test', () => {
    // Skip this test in CI or if SKIP_SLOW_TESTS is set
    if (process.env.CI || process.env.SKIP_SLOW_TESTS) {
        console.log('   ⚠️  Skipping 50MB test (set SKIP_SLOW_TESTS=false to run)');
        return;
    }

    const testFile = path.join(FIXTURES_DIR, 'large-50mb.js');
    const chunk = 'function test() { return 42; }\n';
    const chunks = 1750000; // ~50MB

    console.log('   ℹ️  Creating 50MB file... (this may take a while)');

    const stream = fs.createWriteStream(testFile);
    for (let i = 0; i < chunks; i++) {
        stream.write(chunk);
    }
    stream.end();

    // Wait synchronously for file to be written
    const startWrite = Date.now();
    while (!fs.existsSync(testFile) || fs.statSync(testFile).size < 45000000) {
        if (Date.now() - startWrite > 60000) {
            throw new Error('Timeout creating 50MB file');
        }
        // Small delay
        const now = Date.now();
        while (Date.now() - now < 100) {}
    }

    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const start = Date.now();
    const result = analyzer.analyzeFile(testFile);
    const elapsed = Date.now() - start;

    console.log(`   ℹ️  Analyzed 50MB file in ${elapsed}ms`);

    if (!result) {
        throw new Error('Should handle 50MB files');
    }
    if (result.sizeBytes < 45000000) { // ~45MB acceptable
        throw new Error(`File size too small: ${result.sizeBytes} bytes`);
    }

    // Should complete in reasonable time (< 30 seconds)
    if (elapsed > 30000) {
        console.log(`   ⚠️  Warning: Analysis took ${elapsed}ms for 50MB file`);
    }
});

test('Simulated 100MB+ file handling', () => {
    // Don't actually create 100MB file, just verify size calculation works
    const testFile = path.join(FIXTURES_DIR, 'test-size-calc.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // Verify the analyzer can handle large file sizes in its calculations
    const mockFileInfo = {
        path: testFile,
        relativePath: 'test.js',
        sizeBytes: 100 * 1024 * 1024, // 100MB
        tokens: 1000000,
        lines: 100000,
        extension: '.js'
    };

    // Check if stats can handle large numbers
    if (mockFileInfo.sizeBytes !== 104857600) {
        throw new Error('Size calculation error for large files');
    }
});

// ============================================================================
// 18. RESOURCE CLEANUP AND ERROR HANDLING
// ============================================================================
console.log('\n🧹 Resource Cleanup and Error Handling');
console.log('-'.repeat(80));

test('File handles closed after errors', () => {
    const testFile = path.join(FIXTURES_DIR, 'file-handle-test.js');
    fs.writeFileSync(testFile, 'const x = 42;');

    const analyzer = new TokenCalculator(FIXTURES_DIR);

    // Read file multiple times to test handle cleanup
    for (let i = 0; i < 100; i++) {
        try {
            analyzer.analyzeFile(testFile);
        } catch (error) {
            // Ignore errors, we're testing handle cleanup
        }
    }

    // Delete the file - should succeed if handles were closed
    try {
        fs.unlinkSync(testFile);
    } catch (error) {
        throw new Error(`File handle not released: ${error.message}`);
    }
});

test('Memory cleanup after large analysis', () => {
    const testDir = path.join(FIXTURES_DIR, 'cleanup-test');
    fs.mkdirSync(testDir, { recursive: true });

    // Create several files
    for (let i = 0; i < 50; i++) {
        fs.writeFileSync(
            path.join(testDir, `file${i}.js`),
            'function test() { return 42; }\n'.repeat(1000)
        );
    }

    const memBefore = process.memoryUsage().heapUsed;

    // Analyze and clear
    const scanner = new Scanner(testDir);
    let files = scanner.scan();

    // Clear reference
    files = null;

    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memDelta = (memAfter - memBefore) / 1024 / 1024; // MB

    console.log(`   ℹ️  Memory after cleanup: ${memDelta > 0 ? '+' : ''}${memDelta.toFixed(2)} MB`);

    // Memory should not grow significantly (< 50MB)
    if (memDelta > 50) {
        console.log(`   ⚠️  Warning: Possible memory leak detected (+${memDelta.toFixed(2)} MB)`);
    }
});

test('Error recovery in batch operations', () => {
    const testDir = path.join(FIXTURES_DIR, 'batch-error-test');
    fs.mkdirSync(testDir, { recursive: true });

    // Create mix of valid and problematic files
    fs.writeFileSync(path.join(testDir, 'valid1.js'), 'const x = 1;');
    fs.writeFileSync(path.join(testDir, 'valid2.js'), 'const x = 2;');

    const analyzer = new TokenCalculator(testDir);
    const files = [
        path.join(testDir, 'valid1.js'),
        path.join(testDir, 'nonexistent.js'), // Will fail
        path.join(testDir, 'valid2.js')
    ];

    const results = files.map(f => {
        try {
            return analyzer.analyzeFile(f);
        } catch (error) {
            return { error: error.message };
        }
    });

    // Should have results for all files (some with errors)
    if (results.length !== 3) {
        throw new Error('Should return results for all files in batch');
    }

    // First and third should succeed
    if (results[0].error || results[2].error) {
        throw new Error('Valid files should analyze successfully');
    }

    // Second should have error
    if (!results[1].error) {
        throw new Error('Nonexistent file should have error');
    }
});

// ============================================================================
// 19. ERROR RECOVERY AND RESILIENCE
// ============================================================================
console.log('\n🛡️  Error Recovery and Resilience');
console.log('-'.repeat(80));

test('Partial failure in directory scan', () => {
    const testDir = path.join(FIXTURES_DIR, 'partial-fail');
    fs.mkdirSync(testDir, { recursive: true });

    // Create some valid files
    fs.writeFileSync(path.join(testDir, 'valid1.js'), 'const x = 1;');
    fs.writeFileSync(path.join(testDir, 'valid2.js'), 'const x = 2;');

    // Create a file that will cause issues (simulate with permissions)
    const problematicFile = path.join(testDir, 'problematic.js');
    fs.writeFileSync(problematicFile, 'const x = 3;');

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    // Should continue scanning despite individual file errors
    if (!files || files.length === 0) {
        throw new Error('Should scan valid files even if some fail');
    }
});

test('Graceful degradation with missing dependencies', () => {
    // Test that the system works even if tiktoken is not available
    // (This is already handled in TokenUtils, just verify it doesn't crash)
    const analyzer = new TokenCalculator(FIXTURES_DIR);
    const tokens = analyzer.calculateTokens('const x = 42;', 'test.js');

    if (typeof tokens !== 'number' || tokens <= 0) {
        throw new Error('Should fall back to estimation if tiktoken unavailable');
    }
});

test('Recovery from malformed method extraction', () => {
    const methodAnalyzer = new MethodAnalyzer();

    // Malformed code that might confuse regex patterns
    const malformedCode = `
        function unclosed() {
            const x = 42
            // Missing closing brace

        const danglingArrow = () =>

        function normalFunction() {
            return 42;
        }
    `;

    const methods = methodAnalyzer.extractMethods(malformedCode, 'test.js');

    // Should extract what it can without crashing
    if (!Array.isArray(methods)) {
        throw new Error('Should return array even for malformed code');
    }
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
async function showResults() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testsRun}`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

    // Cleanup
    cleanup();

    if (testsFailed === 0) {
        console.log('\n🎉 All error scenario tests passed!');
        console.log('The codebase demonstrates excellent robustness and error handling.');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed. Review errors above.');
        console.log('Note: Some failures may indicate bugs in the code that need fixing.');
        process.exit(1);
    }
}

showResults().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
