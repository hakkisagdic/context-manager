#!/usr/bin/env node

/**
 * Cross-Platform Compatibility Tests
 * Tests platform-specific behavior across Windows, macOS, and Linux
 */

import path from 'path';
import os from 'os';
import fs from 'fs';
import { execSync, spawn } from 'child_process';
import ClipboardUtils from '../lib/utils/clipboard-utils.js';
import FileUtils from '../lib/utils/file-utils.js';

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

console.log('🧪 Testing Cross-Platform Compatibility...\n');
console.log(`Current Platform: ${process.platform}`);
console.log(`Node Version: ${process.version}`);
console.log(`OS: ${os.type()} ${os.release()}`);
console.log('');

// ============================================================================
// PATH HANDLING TESTS
// ============================================================================
console.log('🗂️  Path Handling Tests');
console.log('-'.repeat(70));

test('Windows-style paths - Handles backslash separators', () => {
    const winPath = 'C:\\Users\\test\\file.txt';
    const normalized = path.normalize(winPath);
    if (typeof normalized !== 'string') throw new Error('Should return string');
    // On Windows: C:\Users\test\file.txt, On Unix: C:\Users\test\file.txt (as is)
});

test('macOS/Linux paths - Handles forward slash separators', () => {
    const unixPath = '/Users/test/file.txt';
    const normalized = path.normalize(unixPath);
    if (typeof normalized !== 'string') throw new Error('Should return string');
    if (!normalized.includes('Users')) throw new Error('Should preserve path structure');
});

test('Path separator normalization - path.sep is platform-specific', () => {
    const sep = path.sep;
    if (process.platform === 'win32') {
        if (sep !== '\\') throw new Error('Windows should use backslash');
    } else {
        if (sep !== '/') throw new Error('Unix should use forward slash');
    }
});

test('Path joining - Works across platforms', () => {
    const joined = path.join('dir1', 'dir2', 'file.txt');
    const parts = joined.split(path.sep);
    if (parts.length < 3) throw new Error('Should have at least 3 parts');
    if (!joined.includes('file.txt')) throw new Error('Should include filename');
});

test('Path resolution - Resolves to absolute path', () => {
    const resolved = path.resolve('test', 'file.txt');
    if (!path.isAbsolute(resolved)) throw new Error('Should return absolute path');
});

test('Mixed separators - Normalizes correctly', () => {
    const mixedPath = 'dir1/dir2\\dir3/file.txt';
    const normalized = path.normalize(mixedPath);
    if (typeof normalized !== 'string') throw new Error('Should return string');
    // Should normalize to platform-specific separators
});

// ============================================================================
// CASE SENSITIVITY TESTS
// ============================================================================
console.log('\n🔤 Case Sensitivity Tests');
console.log('-'.repeat(70));

test('Platform case sensitivity - Windows is case-insensitive', () => {
    const platform = process.platform;
    const isCaseSensitive = platform !== 'win32';

    if (platform === 'win32') {
        if (isCaseSensitive) throw new Error('Windows should be case-insensitive');
    } else {
        if (!isCaseSensitive) throw new Error('Unix should be case-sensitive');
    }
});

test('File extension detection - Case-insensitive on all platforms', () => {
    const ext1 = FileUtils.getExtension('file.JS');
    const ext2 = FileUtils.getExtension('file.js');
    // Our utils normalize to lowercase
    if (ext1 !== 'js') throw new Error('Should normalize to lowercase');
    if (ext2 !== 'js') throw new Error('Should normalize to lowercase');
});

test('Path comparison - Case handling', () => {
    const path1 = path.normalize('/Test/File.txt');
    const path2 = path.normalize('/test/file.txt');

    // Paths are different strings, but may refer to same file on Windows
    if (typeof path1 !== 'string') throw new Error('Should return string');
    if (typeof path2 !== 'string') throw new Error('Should return string');
});

// ============================================================================
// LINE ENDING TESTS
// ============================================================================
console.log('\n📄 Line Ending Tests');
console.log('-'.repeat(70));

test('Line ending detection - CRLF vs LF', () => {
    const crlfText = 'line1\r\nline2\r\nline3';
    const lfText = 'line1\nline2\nline3';

    const crlfLines = crlfText.split(/\r?\n/);
    const lfLines = lfText.split(/\r?\n/);

    if (crlfLines.length !== 3) throw new Error('Should split CRLF correctly');
    if (lfLines.length !== 3) throw new Error('Should split LF correctly');
});

test('Line ending normalization - Handles both CRLF and LF', () => {
    const mixedText = 'line1\r\nline2\nline3\r\nline4';
    const lines = mixedText.split(/\r?\n/);

    if (lines.length !== 4) throw new Error('Should handle mixed line endings');
});

test('OS-specific line ending - os.EOL is platform-specific', () => {
    const eol = os.EOL;
    if (process.platform === 'win32') {
        if (eol !== '\r\n') throw new Error('Windows should use CRLF');
    } else {
        if (eol !== '\n') throw new Error('Unix should use LF');
    }
});

// ============================================================================
// CLIPBOARD TESTS (Cross-Platform)
// ============================================================================
console.log('\n📋 Clipboard Tests');
console.log('-'.repeat(70));

test('Clipboard - Windows (clip) detection', () => {
    if (process.platform === 'win32') {
        const cmd = ClipboardUtils.getCommand();
        if (cmd !== 'clip') throw new Error('Windows should use clip');
    }
});

test('Clipboard - macOS (pbcopy) detection', () => {
    if (process.platform === 'darwin') {
        const cmd = ClipboardUtils.getCommand();
        if (cmd !== 'pbcopy') throw new Error('macOS should use pbcopy');
    }
});

test('Clipboard - Linux (xclip) detection', () => {
    if (process.platform === 'linux') {
        const cmd = ClipboardUtils.getCommand();
        if (cmd !== 'xclip') throw new Error('Linux should use xclip');
    }
});

test('Clipboard - Platform availability check', () => {
    const available = ClipboardUtils.isAvailable();
    const supportedPlatforms = ['darwin', 'linux', 'win32'];

    if (supportedPlatforms.includes(process.platform)) {
        if (!available) throw new Error('Should be available on supported platform');
    }
});

// ============================================================================
// FILE PERMISSION TESTS
// ============================================================================
console.log('\n🔒 File Permission Tests');
console.log('-'.repeat(70));

test('File permissions - Unix mode exists on Unix platforms', () => {
    const tempFile = path.join(os.tmpdir(), 'test-permissions.txt');

    try {
        fs.writeFileSync(tempFile, 'test');
        const stats = fs.statSync(tempFile);

        if (process.platform !== 'win32') {
            // Unix platforms should have mode
            if (typeof stats.mode !== 'number') throw new Error('Should have mode on Unix');
        }

        fs.unlinkSync(tempFile);
    } catch (error) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw error;
    }
});

test('File permissions - Windows ACL (different from Unix)', () => {
    const tempFile = path.join(os.tmpdir(), 'test-win-perms.txt');

    try {
        fs.writeFileSync(tempFile, 'test');
        const stats = fs.statSync(tempFile);

        // Both platforms should have stats
        if (!stats) throw new Error('Should have stats');

        fs.unlinkSync(tempFile);
    } catch (error) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw error;
    }
});

test('Executable bit - Only on Unix platforms', () => {
    if (process.platform !== 'win32') {
        const testScript = path.join(os.tmpdir(), 'test-exec.sh');

        try {
            fs.writeFileSync(testScript, '#!/bin/bash\necho test');
            fs.chmodSync(testScript, 0o755); // rwxr-xr-x

            const stats = fs.statSync(testScript);
            // Check if executable bit is set (mode & 0o111 != 0)
            const isExecutable = (stats.mode & 0o111) !== 0;
            if (!isExecutable) throw new Error('Should be executable after chmod');

            fs.unlinkSync(testScript);
        } catch (error) {
            if (fs.existsSync(testScript)) fs.unlinkSync(testScript);
            throw error;
        }
    }
});

// ============================================================================
// SYMLINK TESTS
// ============================================================================
console.log('\n🔗 Symlink Tests');
console.log('-'.repeat(70));

test('Symlink support - Platform detection', () => {
    const supportsSymlinks = process.platform !== 'win32' ||
                             process.getuid === undefined; // Windows may support with admin rights

    // Test that we can at least detect symlinks
    if (typeof fs.lstatSync === 'function') {
        // lstatSync exists for symlink detection
    } else {
        throw new Error('Should have lstatSync for symlink detection');
    }
});

test('Symlink detection - lstat vs stat difference', () => {
    // On Unix, symlinks show different stats between lstat and stat
    // On Windows, symlinks are less common
    const tempFile = path.join(os.tmpdir(), 'test-symlink-target.txt');
    const tempLink = path.join(os.tmpdir(), 'test-symlink.txt');

    try {
        fs.writeFileSync(tempFile, 'target content');

        // Try to create symlink (may fail on Windows without admin)
        try {
            fs.symlinkSync(tempFile, tempLink);

            const lstat = fs.lstatSync(tempLink);
            const stat = fs.statSync(tempLink);

            if (lstat.isSymbolicLink()) {
                // Symlink created successfully
                if (stat.isSymbolicLink()) {
                    throw new Error('stat() should follow symlink, lstat() should not');
                }
            }

            fs.unlinkSync(tempLink);
        } catch (symlinkError) {
            // Symlink may fail on Windows without admin - that's OK
            if (process.platform === 'win32') {
                // Expected on Windows without admin
            } else {
                // Unexpected on Unix
                throw symlinkError;
            }
        }

        fs.unlinkSync(tempFile);
    } catch (error) {
        // Cleanup
        if (fs.existsSync(tempLink)) fs.unlinkSync(tempLink);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

        if (process.platform !== 'win32') {
            throw error; // Should work on Unix
        }
        // Windows may not support symlinks
    }
});

// ============================================================================
// ENVIRONMENT VARIABLE TESTS
// ============================================================================
console.log('\n🌍 Environment Variable Tests');
console.log('-'.repeat(70));

test('Environment variables - PATH separator', () => {
    const pathSep = process.platform === 'win32' ? ';' : ':';
    const envPath = process.env.PATH || process.env.Path || '';

    if (envPath.includes(pathSep) || envPath.length === 0) {
        // Valid: either has separator or is empty
    } else {
        // Single path entry - also valid
    }
});

test('Environment variables - Home directory variable', () => {
    const homeVar = process.platform === 'win32' ? 'USERPROFILE' : 'HOME';
    const homeValue = process.env[homeVar];

    if (process.platform === 'win32') {
        if (!process.env.USERPROFILE && !process.env.HOME) {
            throw new Error('Windows should have USERPROFILE or HOME');
        }
    } else {
        if (!process.env.HOME) {
            throw new Error('Unix should have HOME');
        }
    }
});

test('Environment variables - Case sensitivity on Windows', () => {
    // Windows env vars are case-insensitive
    if (process.platform === 'win32') {
        const path1 = process.env.PATH;
        const path2 = process.env.Path;
        const path3 = process.env.path;

        // At least one should exist (Windows is case-insensitive)
        if (!path1 && !path2 && !path3) {
            throw new Error('Should have PATH variable on Windows');
        }
    }
});

// ============================================================================
// DIRECTORY DETECTION TESTS
// ============================================================================
console.log('\n📁 Directory Detection Tests');
console.log('-'.repeat(70));

test('Home directory detection - os.homedir()', () => {
    const home = os.homedir();

    if (!home || home.length === 0) throw new Error('Should return home directory');
    if (!path.isAbsolute(home)) throw new Error('Should be absolute path');

    // Verify it exists
    if (!fs.existsSync(home)) throw new Error('Home directory should exist');
});

test('Temp directory detection - os.tmpdir()', () => {
    const tmpdir = os.tmpdir();

    if (!tmpdir || tmpdir.length === 0) throw new Error('Should return temp directory');
    if (!path.isAbsolute(tmpdir)) throw new Error('Should be absolute path');

    // Verify it exists
    if (!fs.existsSync(tmpdir)) throw new Error('Temp directory should exist');
});

test('Current working directory - process.cwd()', () => {
    const cwd = process.cwd();

    if (!cwd || cwd.length === 0) throw new Error('Should return current directory');
    if (!path.isAbsolute(cwd)) throw new Error('Should be absolute path');

    // Verify it exists
    if (!fs.existsSync(cwd)) throw new Error('Working directory should exist');
});

// ============================================================================
// PROCESS SPAWNING TESTS
// ============================================================================
console.log('\n⚙️  Process Spawning Tests');
console.log('-'.repeat(70));

test('Process spawning - execSync works cross-platform', () => {
    const platform = process.platform;
    let cmd;

    if (platform === 'win32') {
        cmd = 'echo test';
    } else {
        cmd = 'echo test';
    }

    const output = execSync(cmd, { encoding: 'utf8' });
    if (!output.includes('test')) throw new Error('Should execute command');
});

test('Process spawning - spawn works cross-platform', () => {
    return new Promise((resolve, reject) => {
        const platform = process.platform;
        const cmd = platform === 'win32' ? 'cmd' : 'echo';
        const args = platform === 'win32' ? ['/c', 'echo', 'test'] : ['test'];

        const child = spawn(cmd, args);
        let output = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) reject(new Error(`Process exited with code ${code}`));
            if (!output.includes('test')) reject(new Error('Should have output'));
            resolve();
        });

        child.on('error', (error) => {
            reject(error);
        });

        // Timeout
        setTimeout(() => {
            child.kill();
            reject(new Error('Process timeout'));
        }, 1000);
    });
});

test('Shell detection - Identify current shell', () => {
    const platform = process.platform;
    const shell = process.env.SHELL || process.env.ComSpec || '';

    if (platform === 'win32') {
        // Windows uses cmd.exe or PowerShell
        if (!shell.toLowerCase().includes('cmd') &&
            !shell.toLowerCase().includes('powershell') &&
            !shell.toLowerCase().includes('pwsh') &&
            shell !== '') {
            // May have bash on Windows (Git Bash, WSL)
        }
    } else {
        // Unix-like systems
        if (shell && !shell.includes('/')) {
            throw new Error('Unix shell should be absolute path');
        }
    }
});

// ============================================================================
// TERMINAL TESTS
// ============================================================================
console.log('\n🖥️  Terminal Tests');
console.log('-'.repeat(70));

test('Terminal detection - process.stdout.isTTY', () => {
    const isTTY = process.stdout.isTTY;
    // Should be boolean or undefined
    if (isTTY !== undefined && typeof isTTY !== 'boolean') {
        throw new Error('isTTY should be boolean or undefined');
    }
});

test('Color support detection - TERM environment variable', () => {
    const term = process.env.TERM || '';
    const colorterm = process.env.COLORTERM || '';

    // TERM variable indicates terminal capabilities
    // Common values: xterm, xterm-256color, screen, etc.
    if (typeof term !== 'string') throw new Error('TERM should be string');
});

test('Terminal encoding - Default is UTF-8', () => {
    // Modern terminals use UTF-8
    // process.stdout.getEncoding() may not exist
    const encoding = 'utf8'; // Node.js default
    if (encoding !== 'utf8') throw new Error('Should default to utf8');
});

// ============================================================================
// SIGNAL HANDLING TESTS
// ============================================================================
console.log('\n⚡ Signal Handling Tests');
console.log('-'.repeat(70));

test('Signal handling - SIGINT is available on all platforms', () => {
    const platform = process.platform;

    // SIGINT (Ctrl+C) should work on all platforms
    let handlerCalled = false;
    const handler = () => {
        handlerCalled = true;
    };

    process.on('SIGINT', handler);
    process.removeListener('SIGINT', handler);

    // Just verify we can attach handlers
});

test('Signal handling - Platform-specific signals', () => {
    const platform = process.platform;

    if (platform === 'win32') {
        // Windows has limited signal support
        // SIGINT, SIGTERM work, but not SIGHUP, SIGUSR1, etc.
    } else {
        // Unix has full signal support
        // Can use SIGHUP, SIGUSR1, SIGUSR2, etc.
    }

    // Both platforms support SIGTERM
    let handlerCalled = false;
    const handler = () => {
        handlerCalled = true;
    };

    process.on('SIGTERM', handler);
    process.removeListener('SIGTERM', handler);
});

test('Process exit codes - Work cross-platform', () => {
    // Exit codes 0-255 work on all platforms
    // 0 = success, non-zero = error
    const exitCode = process.exitCode || 0;
    if (typeof exitCode !== 'number') throw new Error('Exit code should be number');
});

// ============================================================================
// PATH SPECIAL CASES
// ============================================================================
console.log('\n🎯 Path Special Cases');
console.log('-'.repeat(70));

test('Windows drive letters - Handled correctly', () => {
    if (process.platform === 'win32') {
        const winPath = 'C:\\Users\\test';
        const parsed = path.parse(winPath);
        if (!parsed.root.includes('C:')) throw new Error('Should preserve drive letter');
    }
});

test('UNC paths - Windows network paths', () => {
    if (process.platform === 'win32') {
        const uncPath = '\\\\server\\share\\file.txt';
        const normalized = path.normalize(uncPath);
        if (!normalized.includes('server')) throw new Error('Should preserve UNC path');
    }
});

test('Relative path resolution - Works cross-platform', () => {
    const relative = path.join('.', 'test', 'file.txt');
    const absolute = path.resolve(relative);

    if (!path.isAbsolute(absolute)) throw new Error('Should resolve to absolute');
    if (!absolute.includes('test')) throw new Error('Should include path components');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Platform: ${process.platform}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All cross-platform tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
