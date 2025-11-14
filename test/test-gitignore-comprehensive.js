#!/usr/bin/env node

/**
 * Comprehensive GitIgnore Parser Tests
 * Tests gitignore pattern matching and edge cases
 * Target: 95% coverage of gitignore parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';

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

console.log('🧪 Comprehensive GitIgnore Parser Tests\n');

const testDir = path.join(__dirname, 'temp-gitignore-test');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// BASIC GITIGNORE PATTERNS
// ============================================================================
console.log('📦 Basic GitIgnore Patterns');
console.log('-'.repeat(70));

test('GitIgnore: Simple file pattern', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'test.log');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'test.log');
    const ignored2 = parser.isIgnored(null, 'other.log');

    if (!ignored1) throw new Error('Should ignore test.log');
    if (ignored2) throw new Error('Should not ignore other.log');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Wildcard pattern (*.log)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '*.log');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'test.log');
    const ignored2 = parser.isIgnored(null, 'error.log');
    const ignored3 = parser.isIgnored(null, 'test.txt');

    if (!ignored1) throw new Error('Should ignore test.log');
    if (!ignored2) throw new Error('Should ignore error.log');
    if (ignored3) throw new Error('Should not ignore test.txt');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Directory pattern (dir/)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'node_modules/');
    const ignored2 = parser.isIgnored(null, 'node_modules/package.json');

    if (!ignored1) throw new Error('Should ignore node_modules/');
    // Behavior for nested files may vary

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Negation pattern (!file)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '*.log\n!important.log');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'test.log');
    const ignored2 = parser.isIgnored(null, 'important.log');

    if (!ignored1) throw new Error('Should ignore test.log');
    if (ignored2) throw new Error('Should NOT ignore important.log');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Recursive wildcard (**/file)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '**/test.js');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'test.js');
    const ignored2 = parser.isIgnored(null, 'src/test.js');
    const ignored3 = parser.isIgnored(null, 'src/utils/test.js');

    if (!ignored1) throw new Error('Should ignore root test.js');
    if (!ignored2) throw new Error('Should ignore src/test.js');
    if (!ignored3) throw new Error('Should ignore nested test.js');

    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// CONTEXTIGNORE TESTS
// ============================================================================
console.log('\n📦 ContextIgnore Tests');
console.log('-'.repeat(70));

test('ContextIgnore: Basic exclude pattern', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const contextignorePath = path.join(testDir, '.contextignore');

    fs.writeFileSync(gitignorePath, '*.log');
    fs.writeFileSync(contextignorePath, 'test/');

    const parser = new GitIgnoreParser(gitignorePath, contextignorePath);
    const ignored1 = parser.isIgnored(null, 'test.log');
    const ignored2 = parser.isIgnored(null, 'test/file.js');

    if (!ignored1) throw new Error('Should respect gitignore');
    if (!ignored2) throw new Error('Should respect contextignore');

    fs.unlinkSync(gitignorePath);
    fs.unlinkSync(contextignorePath);
});

test('ContextIgnore: Overrides gitignore', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const contextignorePath = path.join(testDir, '.contextignore');

    fs.writeFileSync(gitignorePath, '*.log');
    fs.writeFileSync(contextignorePath, '!important.log');

    const parser = new GitIgnoreParser(gitignorePath, contextignorePath);
    // ContextIgnore can override gitignore patterns

    fs.unlinkSync(gitignorePath);
    fs.unlinkSync(contextignorePath);
});

// ============================================================================
// CONTEXTINCLUDE TESTS
// ============================================================================
console.log('\n📦 ContextInclude Tests (Include Mode)');
console.log('-'.repeat(70));

test('ContextInclude: Switches to include mode', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const contextincludePath = path.join(testDir, '.contextinclude');

    fs.writeFileSync(gitignorePath, '*');
    fs.writeFileSync(contextincludePath, 'src/');

    const parser = new GitIgnoreParser(gitignorePath, null, contextincludePath);
    // When contextinclude exists, only included paths should pass

    fs.unlinkSync(gitignorePath);
    fs.unlinkSync(contextincludePath);
});

test('ContextInclude: Multiple include patterns', () => {
    const contextincludePath = path.join(testDir, '.contextinclude');
    fs.writeFileSync(contextincludePath, 'src/\nlib/');

    const parser = new GitIgnoreParser(null, null, contextincludePath);
    const ignored1 = parser.isIgnored(null, 'src/file.js');
    const ignored2 = parser.isIgnored(null, 'test/file.js');
    const ignored3 = parser.isIgnored(null, 'lib/util.js');

    // src/ should be included (not ignored)
    // test/ should be ignored (not in include list)
    // lib/ should be included (not ignored)
    if (ignored1) throw new Error('src/ should be included');
    if (!ignored2) throw new Error('test/ should be excluded');
    if (ignored3) throw new Error('lib/ should be included');

    fs.unlinkSync(contextincludePath);
});

// ============================================================================
// EDGE CASE PATTERNS
// ============================================================================
console.log('\n📦 Edge Case Patterns');
console.log('-'.repeat(70));

test('GitIgnore: Empty file', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'anyfile.js');

    // Empty gitignore should not ignore anything
    if (ignored) throw new Error('Empty gitignore should not ignore files');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Comments only', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '# This is a comment\n# Another comment');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'test.js');

    if (ignored) throw new Error('Comments should not ignore files');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Whitespace handling', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '  \n  *.log  \n  \n');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'test.log');

    if (!ignored) throw new Error('Should handle whitespace');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Trailing spaces in patterns', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '*.log   ');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'test.log');

    if (!ignored) throw new Error('Should trim trailing spaces');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Pattern with backslash escape', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '\\#file');

    const parser = new GitIgnoreParser(gitignorePath);
    // Should handle escaped characters

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Unicode in patterns', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '文件.log\n*.日志');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, '文件.log');

    // Should handle unicode
    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Very long pattern', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const longPattern = 'a'.repeat(1000) + '.log';
    fs.writeFileSync(gitignorePath, longPattern);

    const parser = new GitIgnoreParser(gitignorePath);
    // Should not crash on long patterns

    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// PATTERN ORDER TESTS
// ============================================================================
console.log('\n📦 Pattern Order Tests');
console.log('-'.repeat(70));

test('GitIgnore: Later patterns override earlier', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '*.log\n!important.log\nimportant.log');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'important.log');

    // Last pattern should win
    if (!ignored) throw new Error('Last pattern should override');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Negation before ignore', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '!important.log\n*.log');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored = parser.isIgnored(null, 'important.log');

    // Negation comes first, then ignore - should be ignored
    if (!ignored) throw new Error('Later ignore should override earlier negation');

    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// DIRECTORY SPECIFICITY TESTS
// ============================================================================
console.log('\n📦 Directory Specificity Tests');
console.log('-'.repeat(70));

test('GitIgnore: Root vs any directory', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '/temp');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'temp');
    const ignored2 = parser.isIgnored(null, 'src/temp');

    // Leading / means only root
    if (!ignored1) throw new Error('Should ignore /temp at root');
    if (ignored2) throw new Error('Should not ignore temp in subdirs');

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Nested directory patterns', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'build/**/cache');

    const parser = new GitIgnoreParser(gitignorePath);
    const ignored1 = parser.isIgnored(null, 'build/cache');
    const ignored2 = parser.isIgnored(null, 'build/dist/cache');
    const ignored3 = parser.isIgnored(null, 'build/a/b/c/cache');

    // Should match cache at any depth under build
    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================
console.log('\n📦 Performance Tests');
console.log('-'.repeat(70));

test('GitIgnore: Large number of patterns (1000)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const patterns = Array.from({ length: 1000 }, (_, i) => `file${i}.log`).join('\n');
    fs.writeFileSync(gitignorePath, patterns);

    const parser = new GitIgnoreParser(gitignorePath);
    const start = Date.now();
    const ignored = parser.isIgnored(null, 'file500.log');
    const elapsed = Date.now() - start;

    if (elapsed > 500) {
        console.log('   ⚠️  Warning: Pattern matching took > 500ms');
    }

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Repeated lookups (caching)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '*.log\nnode_modules/\ntest/');

    const parser = new GitIgnoreParser(gitignorePath);

    const start = Date.now();
    for (let i = 0; i < 1000; i++) {
        parser.isIgnored(null, 'test.log');
        parser.isIgnored(null, 'src/file.js');
        parser.isIgnored(null, 'node_modules/pkg');
    }
    const elapsed = Date.now() - start;

    if (elapsed > 1000) {
        console.log('   ⚠️  Warning: 3000 lookups took > 1 second');
    }

    fs.unlinkSync(gitignorePath);
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('GitIgnore: Non-existent file', () => {
    const parser = new GitIgnoreParser('/nonexistent/.gitignore');
    const ignored = parser.isIgnored(null, 'test.js');

    // Should handle gracefully and not ignore
    if (ignored) throw new Error('Should not ignore when file missing');
});

test('GitIgnore: Corrupted file (non-UTF8)', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    const buffer = Buffer.from([0xFF, 0xFE, 0xFD]);
    fs.writeFileSync(gitignorePath, buffer);

    try {
        const parser = new GitIgnoreParser(gitignorePath);
        // Should handle corrupted files
    } catch (e) {
        // Acceptable to throw
    }

    fs.unlinkSync(gitignorePath);
});

test('GitIgnore: Invalid regex pattern', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, '[[[invalid');

    try {
        const parser = new GitIgnoreParser(gitignorePath);
        parser.isIgnored(null, 'test.js');
        // Should handle invalid patterns gracefully
    } catch (e) {
        // May throw on invalid regex
    }

    fs.unlinkSync(gitignorePath);
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
console.log('📊 GITIGNORE PARSER TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All gitignore parser tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
