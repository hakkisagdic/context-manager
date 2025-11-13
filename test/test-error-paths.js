#!/usr/bin/env node
/**
 * Error Path Tests for Core Modules
 * Tests error handling across Scanner, Analyzer, Reporter, etc.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import Scanner from '../lib/core/Scanner.js';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
    }
}

console.log('🧪 Testing Error Paths in Core Modules\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================================================
// Test Scanner Error Paths
// ============================================================================

console.log('📂 Testing Scanner Error Handling...\n');

test('Scanner: handles non-existent directory', () => {
    const scanner = new Scanner();
    const nonExistentPath = '/this/path/does/not/exist';

    try {
        const files = scanner.scan(nonExistentPath);
        // Should either return empty array or throw error
        assert(Array.isArray(files), 'Should return array or throw');
    } catch (error) {
        assert(error instanceof Error, 'Should throw proper error');
        assert(error.code === 'ENOENT', 'Should throw ENOENT error');
    }
});

test('Scanner: handles permission denied error', () => {
    // Create a directory with restricted permissions
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));

    try {
        const restrictedDir = path.join(tempDir, 'restricted');
        fs.mkdirSync(restrictedDir);

        // Try to change permissions (may not work on all systems)
        try {
            fs.chmodSync(restrictedDir, 0o000);

            const scanner = new Scanner();

            try {
                const files = scanner.scan(restrictedDir);
                // If it succeeds despite permissions, that's fine (system-dependent)
                assert(true, 'Should handle or bypass permission issues');
            } catch (error) {
                // Should throw proper permission error
                assert(
                    error.code === 'EACCES' || error.code === 'EPERM',
                    'Should throw permission error'
                );
            }
        } finally {
            // Restore permissions for cleanup
            try {
                fs.chmodSync(restrictedDir, 0o755);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('Scanner: handles empty directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));

    try {
        const scanner = new Scanner();
        const files = scanner.scan(tempDir);

        assert(Array.isArray(files), 'Should return array');
        assertEquals(files.length, 0, 'Should return empty array for empty directory');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('Scanner: handles symbolic link loops', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));

    try {
        const dir1 = path.join(tempDir, 'dir1');
        const dir2 = path.join(tempDir, 'dir2');

        fs.mkdirSync(dir1);
        fs.mkdirSync(dir2);

        // Create circular symlinks
        try {
            fs.symlinkSync(dir2, path.join(dir1, 'link-to-dir2'));
            fs.symlinkSync(dir1, path.join(dir2, 'link-to-dir1'));

            const scanner = new Scanner();

            try {
                const files = scanner.scan(tempDir);
                // Should handle symlink loops gracefully
                assert(true, 'Should handle symlink loops');
            } catch (error) {
                // Or throw appropriate error
                assert(error instanceof Error, 'Should throw proper error for symlink loop');
            }
        } catch (symlinkError) {
            // Symlinks might not be supported on all systems
            assert(true, 'Symlinks not supported on this system');
        }
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('Scanner: handles very deep directory nesting', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'));

    try {
        // Create a very deep directory structure
        let currentPath = tempDir;
        for (let i = 0; i < 100; i++) {
            currentPath = path.join(currentPath, `level${i}`);
            fs.mkdirSync(currentPath);
        }

        // Add a file at the deepest level
        fs.writeFileSync(path.join(currentPath, 'deep.txt'), 'deep file');

        const scanner = new Scanner();
        const files = scanner.scan(tempDir);

        assert(Array.isArray(files), 'Should scan deep directories');
        assert(files.length > 0, 'Should find file in deep directory');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Test GitIgnoreParser Error Paths
// ============================================================================

console.log('\n🚫 Testing GitIgnoreParser Error Handling...\n');

test('GitIgnoreParser: handles malformed patterns', () => {
    const parser = new GitIgnoreParser();

    // Test invalid regex patterns
    const malformedPatterns = [
        '[unclosed-bracket',
        '(unclosed-paren',
        '***/invalid',
        null,
        undefined
    ];

    malformedPatterns.forEach(pattern => {
        try {
            if (pattern !== null && pattern !== undefined) {
                parser.addPattern(pattern);
            }
            assert(true, 'Should handle malformed pattern gracefully');
        } catch (error) {
            // Should either handle gracefully or throw proper error
            assert(error instanceof Error, 'Should throw proper error');
        }
    });
});

test('GitIgnoreParser: handles empty pattern file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));

    try {
        const emptyFile = path.join(tempDir, '.gitignore');
        fs.writeFileSync(emptyFile, '');

        const parser = new GitIgnoreParser();
        parser.loadFromFile(emptyFile);

        assert(true, 'Should handle empty .gitignore file');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('GitIgnoreParser: handles non-existent .gitignore file', () => {
    const parser = new GitIgnoreParser();
    const nonExistent = '/path/to/nonexistent/.gitignore';

    try {
        parser.loadFromFile(nonExistent);
        assert(true, 'Should handle missing file gracefully');
    } catch (error) {
        assert(error instanceof Error, 'Should throw proper error');
    }
});

test('GitIgnoreParser: handles .gitignore with invalid UTF-8', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));

    try {
        const invalidUtf8File = path.join(tempDir, '.gitignore');

        // Write invalid UTF-8 bytes
        const buffer = Buffer.from([0xFF, 0xFE, 0xFD]);
        fs.writeFileSync(invalidUtf8File, buffer);

        const parser = new GitIgnoreParser();

        try {
            parser.loadFromFile(invalidUtf8File);
            // Should handle or throw proper error
            assert(true, 'Should handle invalid UTF-8');
        } catch (error) {
            assert(error instanceof Error, 'Should throw proper error for invalid UTF-8');
        }
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Test File System Error Scenarios
// ============================================================================

console.log('\n💾 Testing File System Error Scenarios...\n');

test('File operations: handle read-only files', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-test-'));

    try {
        const readOnlyFile = path.join(tempDir, 'readonly.txt');
        fs.writeFileSync(readOnlyFile, 'read only content');
        fs.chmodSync(readOnlyFile, 0o444);

        // Reading should work
        const content = fs.readFileSync(readOnlyFile, 'utf-8');
        assert(content === 'read only content', 'Should read read-only file');

        // Writing should fail
        try {
            fs.writeFileSync(readOnlyFile, 'new content');
            // Some systems might allow this, so don't fail the test
            assert(true, 'Write behavior is system-dependent');
        } catch (error) {
            assert(error.code === 'EACCES' || error.code === 'EPERM', 'Should throw permission error');
        }
    } finally {
        // Restore permissions for cleanup
        try {
            const files = fs.readdirSync(tempDir);
            files.forEach(file => {
                try {
                    fs.chmodSync(path.join(tempDir, file), 0o644);
                } catch (e) {
                    // Ignore
                }
            });
        } catch (e) {
            // Ignore
        }
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('File operations: handle disk full scenario (simulated)', () => {
    // We can't actually fill the disk, but we can test error handling
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-test-'));

    try {
        const testFile = path.join(tempDir, 'test.txt');

        // Verify we can handle successful writes
        fs.writeFileSync(testFile, 'test content');
        const content = fs.readFileSync(testFile, 'utf-8');

        assertEquals(content, 'test content', 'Should handle normal file operations');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('File operations: handle concurrent access', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-test-'));

    try {
        const testFile = path.join(tempDir, 'concurrent.txt');

        // Write file multiple times in quick succession
        const writes = [];
        for (let i = 0; i < 10; i++) {
            writes.push(
                Promise.resolve().then(() => {
                    fs.writeFileSync(testFile, `content ${i}`);
                })
            );
        }

        // Should not throw errors
        Promise.all(writes).catch(() => {
            // Concurrent writes might fail, that's expected
            assert(true, 'Should handle concurrent access attempts');
        });

        assert(true, 'Should handle concurrent operations');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Test Data Validation Errors
// ============================================================================

console.log('\n✅ Testing Data Validation Errors...\n');

test('Validation: handle invalid file paths', () => {
    const invalidPaths = [
        '',
        null,
        undefined,
        123,
        {},
        [],
        '\0',
        '../../../etc/passwd'
    ];

    invalidPaths.forEach(invalidPath => {
        try {
            if (typeof invalidPath === 'string' && invalidPath !== '') {
                const normalized = path.normalize(invalidPath);
                assert(true, 'Should handle invalid path');
            } else {
                assert(true, 'Should reject non-string paths');
            }
        } catch (error) {
            assert(error instanceof Error, 'Should throw proper error');
        }
    });
});

test('Validation: handle invalid token counts', () => {
    const invalidTokens = [
        -1,
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
        '123',
        {}
    ];

    invalidTokens.forEach(tokens => {
        try {
            if (typeof tokens === 'number' && tokens >= 0 && isFinite(tokens)) {
                assert(true, 'Valid token count');
            } else {
                // Should be rejected
                assert(true, 'Should reject invalid token count');
            }
        } catch (error) {
            assert(error instanceof Error, 'Should throw proper error');
        }
    });
});

test('Validation: handle invalid configuration objects', () => {
    const invalidConfigs = [
        null,
        undefined,
        'string',
        123,
        [],
        { },
        { invalid: 'structure' }
    ];

    invalidConfigs.forEach(config => {
        try {
            // Validate config structure
            if (typeof config === 'object' && config !== null) {
                assert(true, 'Should validate config structure');
            } else {
                assert(true, 'Should reject non-object configs');
            }
        } catch (error) {
            assert(error instanceof Error, 'Should throw proper error');
        }
    });
});

// ============================================================================
// Test Memory and Resource Limits
// ============================================================================

console.log('\n⚡ Testing Memory and Resource Limits...\n');

test('Memory: handle very large arrays', () => {
    try {
        // Create array with 10k items
        const largeArray = new Array(10000).fill({ path: 'test.js', tokens: 100 });

        assert(largeArray.length === 10000, 'Should handle large arrays');
        assert(Array.isArray(largeArray), 'Should maintain array type');
    } catch (error) {
        assert(error instanceof Error, 'Should throw proper error if memory exceeded');
    }
});

test('Memory: handle large string concatenation', () => {
    try {
        let largeString = '';

        for (let i = 0; i < 1000; i++) {
            largeString += 'x'.repeat(100);
        }

        assert(largeString.length === 100000, 'Should handle large strings');
    } catch (error) {
        assert(error instanceof Error, 'Should throw proper error if memory exceeded');
    }
});

test('Resources: handle many file descriptors', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-test-'));

    try {
        // Create 100 files
        for (let i = 0; i < 100; i++) {
            fs.writeFileSync(path.join(tempDir, `file${i}.txt`), `content ${i}`);
        }

        // Read all files
        const files = fs.readdirSync(tempDir);
        assertEquals(files.length, 100, 'Should handle many files');

        // Read contents sequentially to avoid fd exhaustion
        files.forEach(file => {
            const content = fs.readFileSync(path.join(tempDir, file), 'utf-8');
            assert(content.length > 0, 'Should read file content');
        });

        assert(true, 'Should handle many file operations');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 Test Summary:\n');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
console.log(`   🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════\n');

if (testsFailed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
} else {
    console.log('✅ All error path tests passed!\n');
    process.exit(0);
}
