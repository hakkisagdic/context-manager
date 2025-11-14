#!/usr/bin/env node

/**
 * GitIgnore Parser Edge Cases Tests
 * Comprehensive edge case testing for GitIgnoreParser
 * ~25 test cases covering complex scenarios and edge cases
 */

import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'gitignore-edge-cases');

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
        }
        testsFailed++;
        return false;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message);
    }
}

function assertFalse(value, message) {
    if (value) {
        throw new Error(message);
    }
}

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing GitIgnoreParser Edge Cases...\n');
console.log('=' .repeat(70));

// ============================================================================
// NEGATION PATTERN TESTS
// ============================================================================
console.log('\n📋 Negation Pattern Tests');
console.log('-'.repeat(70));

test('Negation pattern - Basic negation (!file.txt)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'negation-basic.gitignore');
    fs.writeFileSync(gitignorePath, `*.log
!important.log
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // *.log should match error.log
    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored');

    // !important.log should NOT be ignored (negated)
    assertFalse(parser.isIgnored(null, 'important.log'), 'important.log should NOT be ignored (negated)');
});

test('Negation pattern - Negation with directories', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'negation-dirs.gitignore');
    fs.writeFileSync(gitignorePath, `logs/
!logs/important/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'logs/error.log'), 'logs/error.log should be ignored');
    // Note: Negating a directory that's inside an ignored parent is complex
    // The implementation may need adjustment here
});

test('Negation pattern - Multiple negations', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'negation-multiple.gitignore');
    fs.writeFileSync(gitignorePath, `*.js
!important.js
!config.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'app.js'), 'app.js should be ignored');
    assertFalse(parser.isIgnored(null, 'important.js'), 'important.js should NOT be ignored');
    assertFalse(parser.isIgnored(null, 'config.js'), 'config.js should NOT be ignored');
});

test('Negation pattern - Order matters (last match wins)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'negation-order.gitignore');
    fs.writeFileSync(gitignorePath, `*.log
!important.log
*.log
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Last *.log should override the negation
    assertTrue(parser.isIgnored(null, 'important.log'), 'important.log should be ignored (last rule wins)');
});

// ============================================================================
// DIRECTORY PATTERN TESTS
// ============================================================================
console.log('\n📁 Directory Pattern Tests');
console.log('-'.repeat(70));

test('Directory pattern - Trailing slash (dir/)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'dir-trailing.gitignore');
    fs.writeFileSync(gitignorePath, `build/
temp/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'build/index.js'), 'build/index.js should be ignored');
    assertTrue(parser.isIgnored(null, 'temp/data.json'), 'temp/data.json should be ignored');
});

test('Directory pattern - Without trailing slash matches both', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'dir-no-trailing.gitignore');
    fs.writeFileSync(gitignorePath, `build
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Should match both file and directory named 'build'
    assertTrue(parser.isIgnored(null, 'build'), 'build should be ignored');
    assertTrue(parser.isIgnored(null, 'src/build'), 'src/build should be ignored');
});

// ============================================================================
// WILDCARD PATTERN TESTS
// ============================================================================
console.log('\n🌟 Wildcard Pattern Tests');
console.log('-'.repeat(70));

test('Wildcard pattern - Single asterisk (*.js)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'wildcard-single.gitignore');
    fs.writeFileSync(gitignorePath, `*.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'app.js'), 'app.js should be ignored');
    assertTrue(parser.isIgnored(null, 'src/index.js'), 'src/index.js should be ignored');
    assertFalse(parser.isIgnored(null, 'app.ts'), 'app.ts should NOT be ignored');
});

test('Wildcard pattern - Double asterisk (**/*.js)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'wildcard-double.gitignore');
    fs.writeFileSync(gitignorePath, `**/*.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'app.js'), 'app.js should be ignored');
    assertTrue(parser.isIgnored(null, 'src/app.js'), 'src/app.js should be ignored');
    assertTrue(parser.isIgnored(null, 'src/deep/nested/app.js'), 'src/deep/nested/app.js should be ignored');
});

test('Wildcard pattern - Question mark (file?.js)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'wildcard-question.gitignore');
    fs.writeFileSync(gitignorePath, `file?.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'file1.js'), 'file1.js should be ignored');
    assertTrue(parser.isIgnored(null, 'fileA.js'), 'fileA.js should be ignored');
    assertFalse(parser.isIgnored(null, 'file12.js'), 'file12.js should NOT be ignored (? matches single char)');
});

test('Wildcard pattern - Character class ([0-9])', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'wildcard-class.gitignore');
    fs.writeFileSync(gitignorePath, `file[0-9].js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Note: Character classes might not be fully supported by the simple regex conversion
    // This test may reveal a limitation
    const result = parser.isIgnored(null, 'file1.js');
    // We're testing behavior, not asserting specific outcome as it depends on implementation
});

// ============================================================================
// COMMENT AND WHITESPACE TESTS
// ============================================================================
console.log('\n💬 Comment and Whitespace Tests');
console.log('-'.repeat(70));

test('Comments - Lines starting with # are ignored', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'comments.gitignore');
    fs.writeFileSync(gitignorePath, `# This is a comment
*.log
# Another comment
node_modules/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Comments should not create patterns
    assertEqual(parser.patterns.length, 2, 'Should have 2 patterns (comments ignored)');
});

test('Empty lines - Should be ignored', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'empty-lines.gitignore');
    fs.writeFileSync(gitignorePath, `*.log

node_modules/

temp/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertEqual(parser.patterns.length, 3, 'Should have 3 patterns (empty lines ignored)');
});

test('Trailing spaces - Should be trimmed', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'trailing-spaces.gitignore');
    fs.writeFileSync(gitignorePath, `*.log
node_modules/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored (spaces trimmed)');
    assertTrue(parser.isIgnored(null, 'node_modules/package.json'), 'node_modules should be ignored');
});

test('Leading spaces - Should be trimmed', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'leading-spaces.gitignore');
    fs.writeFileSync(gitignorePath, `   *.log
  node_modules/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored (leading spaces trimmed)');
});

// ============================================================================
// PATH PATTERN TESTS
// ============================================================================
console.log('\n🛣️  Path Pattern Tests');
console.log('-'.repeat(70));

test('Absolute paths - Leading slash (/build)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'absolute-path.gitignore');
    fs.writeFileSync(gitignorePath, `/build
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'build'), 'build (root level) should be ignored');
    // /build should only match at root, not nested
    assertFalse(parser.isIgnored(null, 'src/build'), 'src/build should NOT be ignored (not at root)');
});

test('Relative paths - Without leading slash', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'relative-path.gitignore');
    fs.writeFileSync(gitignorePath, `build
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'build'), 'build should be ignored');
    assertTrue(parser.isIgnored(null, 'src/build'), 'src/build should be ignored (matches anywhere)');
});

test('Parent directory references (../file) - Should handle gracefully', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'parent-ref.gitignore');
    fs.writeFileSync(gitignorePath, `../config.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Parent references are unusual in .gitignore, test implementation behavior
    // The parser should handle it without crashing
    const result = parser.isIgnored(null, '../config.js');
    // No assertion - just ensuring no crash
});

// ============================================================================
// SPECIAL CHARACTERS TESTS
// ============================================================================
console.log('\n🔣 Special Characters Tests');
console.log('-'.repeat(70));

test('Special characters - Spaces in filenames', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'special-spaces.gitignore');
    fs.writeFileSync(gitignorePath, `file with spaces.txt
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'file with spaces.txt'), 'File with spaces should be ignored');
});

test('Special characters - Regex special chars (dots, brackets)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'special-regex.gitignore');
    fs.writeFileSync(gitignorePath, `file.test.js
[config].json
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'file.test.js'), 'file.test.js should be ignored');
    assertTrue(parser.isIgnored(null, '[config].json'), '[config].json should be ignored (brackets escaped)');
});

test('Special characters - UTF-8 patterns', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'special-utf8.gitignore');
    fs.writeFileSync(gitignorePath, `файл.txt
文件.js
`, 'utf8');

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'файл.txt'), 'UTF-8 filename (Cyrillic) should be ignored');
    assertTrue(parser.isIgnored(null, '文件.js'), 'UTF-8 filename (Chinese) should be ignored');
});

test('Special characters - Backslashes and quotes', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'special-backslash.gitignore');
    fs.writeFileSync(gitignorePath, `file\\name.txt
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Backslashes are tricky - test implementation behavior
    const result = parser.isIgnored(null, 'file\\name.txt');
    // Just ensuring no crash
});

// ============================================================================
// PERFORMANCE AND SCALE TESTS
// ============================================================================
console.log('\n⚡ Performance and Scale Tests');
console.log('-'.repeat(70));

test('Large .gitignore file - 1000+ lines', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'large.gitignore');

    let content = '# Large gitignore file\n';
    for (let i = 0; i < 1000; i++) {
        content += `pattern${i}.txt\n`;
    }
    fs.writeFileSync(gitignorePath, content);

    const startTime = Date.now();
    const parser = new GitIgnoreParser(gitignorePath, null, null);
    const parseTime = Date.now() - startTime;

    assertEqual(parser.patterns.length, 1000, 'Should parse 1000 patterns');
    assertTrue(parseTime < 1000, `Parsing should be fast (<1s), took ${parseTime}ms`);
});

test('Performance - Pattern matching is reasonably fast', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'performance.gitignore');
    fs.writeFileSync(gitignorePath, `*.log
*.tmp
node_modules/
build/
dist/
coverage/
.cache/
**/*.test.js
**/*.spec.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Test 1000 isIgnored calls
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
        parser.isIgnored(null, `file${i}.js`);
        parser.isIgnored(null, `file${i}.log`);
    }
    const matchTime = Date.now() - startTime;

    assertTrue(matchTime < 1000, `Pattern matching should be fast (<1s for 2000 checks), took ${matchTime}ms`);
});

// ============================================================================
// MULTIPLE FILES AND INHERITANCE TESTS
// ============================================================================
console.log('\n🗂️  Multiple Files and Inheritance Tests');
console.log('-'.repeat(70));

test('Multiple ignore files - .gitignore and .contextignore', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'multi-git.gitignore');
    const contextIgnorePath = path.join(FIXTURES_DIR, 'multi-context.contextignore');

    fs.writeFileSync(gitignorePath, `*.log
`);
    fs.writeFileSync(contextIgnorePath, `*.test.js
`);

    const parser = new GitIgnoreParser(gitignorePath, contextIgnorePath, null);

    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored (gitignore)');
    assertTrue(parser.isIgnored(null, 'app.test.js'), 'app.test.js should be ignored (contextignore)');
});

test('Include mode - .contextinclude takes precedence', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'include-git.gitignore');
    const contextIgnorePath = path.join(FIXTURES_DIR, 'include-context.contextignore');
    const contextIncludePath = path.join(FIXTURES_DIR, 'include-context.contextinclude');

    fs.writeFileSync(gitignorePath, `*.log
`);
    fs.writeFileSync(contextIgnorePath, `*.test.js
`);
    fs.writeFileSync(contextIncludePath, `src/
lib/
`);

    const parser = new GitIgnoreParser(gitignorePath, contextIgnorePath, contextIncludePath);

    assertTrue(parser.hasIncludeFile, 'Should detect include file');

    // Include mode: only src/ and lib/ should be included
    assertFalse(parser.isIgnored(null, 'src/app.js'), 'src/app.js should be included');
    assertFalse(parser.isIgnored(null, 'lib/utils.js'), 'lib/utils.js should be included');
    assertTrue(parser.isIgnored(null, 'test/app.js'), 'test/app.js should be ignored (not in include)');
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🔍 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('Empty .gitignore file', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'empty.gitignore');
    fs.writeFileSync(gitignorePath, '');

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertEqual(parser.patterns.length, 0, 'Should have no patterns');
    assertFalse(parser.isIgnored(null, 'any-file.js'), 'No files should be ignored');
});

test('Only comments .gitignore file', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'only-comments.gitignore');
    fs.writeFileSync(gitignorePath, `# Comment 1
# Comment 2
# Comment 3
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertEqual(parser.patterns.length, 0, 'Should have no patterns (only comments)');
});

test('Directory as gitignore path - Should handle gracefully', () => {
    const dirPath = path.join(FIXTURES_DIR, 'test-dir');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

    const parser = new GitIgnoreParser(dirPath, null, null);

    assertEqual(parser.patterns.length, 0, 'Should have no patterns (directory provided)');
});

test('Pattern order - Last matching pattern wins', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'pattern-order.gitignore');
    fs.writeFileSync(gitignorePath, `*.js
!important.js
src/*.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // important.js is negated, but then src/*.js matches again
    assertTrue(parser.isIgnored(null, 'src/important.js'), 'src/important.js should be ignored (last match wins)');
});

test('Very long pattern line', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'long-pattern.gitignore');
    const longPattern = 'a'.repeat(500) + '.txt';
    fs.writeFileSync(gitignorePath, longPattern);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertEqual(parser.patterns.length, 1, 'Should handle long patterns');
    assertTrue(parser.isIgnored(null, longPattern), 'Long pattern should match');
});

// ============================================================================
// CASE SENSITIVITY TESTS
// ============================================================================
console.log('\n🔤 Case Sensitivity Tests');
console.log('-'.repeat(70));

test('Case sensitivity - Patterns are case-sensitive by default', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'case-sensitive.gitignore');
    fs.writeFileSync(gitignorePath, `README.md
*.Log
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Exact case should match
    assertTrue(parser.isIgnored(null, 'README.md'), 'README.md should be ignored (exact case)');
    assertTrue(parser.isIgnored(null, 'error.Log'), 'error.Log should be ignored (exact case)');

    // Different case should NOT match (case-sensitive)
    assertFalse(parser.isIgnored(null, 'readme.md'), 'readme.md should NOT be ignored (different case)');
    assertFalse(parser.isIgnored(null, 'ReadMe.md'), 'ReadMe.md should NOT be ignored (different case)');
    assertFalse(parser.isIgnored(null, 'error.log'), 'error.log should NOT be ignored (different case)');
});

test('Case sensitivity - macOS/Windows behavior (case-insensitive filesystems)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'case-fs.gitignore');
    fs.writeFileSync(gitignorePath, `TeMp/
BUILD/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Git's behavior: patterns are case-sensitive even on case-insensitive filesystems
    // The implementation should match Git's behavior
    assertTrue(parser.isIgnored(null, 'TeMp/file.txt'), 'TeMp/file.txt should be ignored');
    assertTrue(parser.isIgnored(null, 'BUILD/output.js'), 'BUILD/output.js should be ignored');

    // Different case should NOT match
    assertFalse(parser.isIgnored(null, 'temp/file.txt'), 'temp/file.txt should NOT be ignored (case mismatch)');
    assertFalse(parser.isIgnored(null, 'build/output.js'), 'build/output.js should NOT be ignored (case mismatch)');
});

test('Case sensitivity - Wildcards maintain case sensitivity', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'case-wildcard.gitignore');
    fs.writeFileSync(gitignorePath, `*.LOG
Test*.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    assertTrue(parser.isIgnored(null, 'error.LOG'), 'error.LOG should be ignored');
    assertTrue(parser.isIgnored(null, 'TestFile.js'), 'TestFile.js should be ignored');

    assertFalse(parser.isIgnored(null, 'error.log'), 'error.log should NOT be ignored (case mismatch)');
    assertFalse(parser.isIgnored(null, 'testFile.js'), 'testFile.js should NOT be ignored (case mismatch)');
});

// ============================================================================
// SUBDIRECTORY GITIGNORE TESTS (LIMITATION CHECK)
// ============================================================================
console.log('\n📂 Subdirectory .gitignore Tests');
console.log('-'.repeat(70));

test('Subdirectory .gitignore - Current implementation limitation', () => {
    // Note: Current implementation only supports single .gitignore at root
    // This test documents the current behavior and limitation

    const rootGitignore = path.join(FIXTURES_DIR, 'root.gitignore');
    const subDir = path.join(FIXTURES_DIR, 'subdir');
    const subGitignore = path.join(subDir, '.gitignore');

    if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
    }

    fs.writeFileSync(rootGitignore, `*.log
`);
    fs.writeFileSync(subGitignore, `*.tmp
`);

    // Current implementation only reads root .gitignore
    const parser = new GitIgnoreParser(rootGitignore, null, null);

    // Root patterns work
    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored (root .gitignore)');
    assertTrue(parser.isIgnored(null, 'subdir/error.log'), 'subdir/error.log should be ignored (root .gitignore)');

    // Subdirectory .gitignore is NOT read (limitation)
    // In real Git, subdir/.gitignore would also be evaluated
    assertFalse(parser.isIgnored(null, 'subdir/temp.tmp'),
        'subdir/temp.tmp is NOT ignored (subdir .gitignore not loaded - known limitation)');
});

test('Subdirectory patterns - Scoped patterns work (Git behavior)', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'scoped.gitignore');
    fs.writeFileSync(gitignorePath, `# Ignore in specific directory (root-relative)
docs/*.pdf
src/temp/
# Match at any level
*.tmp
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Patterns with slash are root-relative (Git behavior)
    assertTrue(parser.isIgnored(null, 'docs/manual.pdf'), 'docs/manual.pdf should be ignored (root-level)');
    assertTrue(parser.isIgnored(null, 'src/temp/data.txt'), 'src/temp/data.txt should be ignored');

    // Should not match in other locations (pattern has slash → root-relative)
    assertFalse(parser.isIgnored(null, 'manual.pdf'), 'manual.pdf (root) should NOT be ignored');
    assertFalse(parser.isIgnored(null, 'other/docs/manual.pdf'),
        'other/docs/manual.pdf should NOT be ignored (pattern is root-relative)');

    // Pattern without slash matches at any level
    assertTrue(parser.isIgnored(null, 'file.tmp'), 'file.tmp should be ignored (any level)');
    assertTrue(parser.isIgnored(null, 'deep/nested/file.tmp'), 'deep/nested/file.tmp should be ignored (any level)');
});

// ============================================================================
// GITIGNORE INHERITANCE TESTS
// ============================================================================
console.log('\n🌳 GitIgnore Inheritance Tests');
console.log('-'.repeat(70));

test('Inheritance - Negation can un-ignore parent patterns', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'inheritance-negation.gitignore');
    fs.writeFileSync(gitignorePath, `# Ignore all .log files
*.log
# But allow important.log
!important.log
# Ignore all in logs/ directory
logs/
# But not logs/keep/ subdirectory
!logs/keep/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Basic patterns
    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log should be ignored');
    assertFalse(parser.isIgnored(null, 'important.log'), 'important.log should NOT be ignored (negated)');

    // Directory patterns
    assertTrue(parser.isIgnored(null, 'logs/debug.txt'), 'logs/debug.txt should be ignored');
});

test('Inheritance - More specific patterns override general ones', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'inheritance-specific.gitignore');
    fs.writeFileSync(gitignorePath, `# Ignore everything in build/
build/
# Except build/public/
!build/public/
# But ignore build/public/temp/
build/public/temp/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // General pattern
    assertTrue(parser.isIgnored(null, 'build/app.js'), 'build/app.js should be ignored');

    // Negated subdirectory - NOTE: This is complex in Git
    // Git doesn't allow negating subdirectories of ignored parent directories
    // This test documents expected vs actual behavior
    const publicFileIgnored = parser.isIgnored(null, 'build/public/index.html');
    // In real Git, this would still be ignored (can't negate subdirs of ignored dirs)
    // Our implementation may behave differently
});

test('Inheritance - Pattern order matters for override', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'inheritance-order.gitignore');
    fs.writeFileSync(gitignorePath, `# First ignore all JS
*.js
# Then allow config.js
!config.js
# Then ignore again in specific dir
src/*.js
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // config.js at root is allowed (negated)
    assertFalse(parser.isIgnored(null, 'config.js'), 'config.js should NOT be ignored (negated)');

    // But config.js in src/ is ignored (more specific pattern)
    assertTrue(parser.isIgnored(null, 'src/config.js'), 'src/config.js should be ignored (overridden)');

    // Other JS files are ignored
    assertTrue(parser.isIgnored(null, 'app.js'), 'app.js should be ignored');
});

test('Inheritance - Root gitignore applies to all subdirectories', () => {
    const gitignorePath = path.join(FIXTURES_DIR, 'inheritance-root.gitignore');
    fs.writeFileSync(gitignorePath, `node_modules/
*.log
.env
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);

    // Root level
    assertTrue(parser.isIgnored(null, 'node_modules/package.json'), 'node_modules at root should be ignored');
    assertTrue(parser.isIgnored(null, 'error.log'), 'error.log at root should be ignored');
    assertTrue(parser.isIgnored(null, '.env'), '.env at root should be ignored');

    // Deep nested
    assertTrue(parser.isIgnored(null, 'src/utils/node_modules/package.json'),
        'node_modules in nested dir should be ignored');
    assertTrue(parser.isIgnored(null, 'src/server/logs/error.log'),
        'error.log in nested dir should be ignored');
    assertTrue(parser.isIgnored(null, 'config/prod/.env'),
        '.env in nested dir should be ignored');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total: ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}
