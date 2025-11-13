#!/usr/bin/env node

/**
 * Comprehensive Parser Tests
 * Tests for GitIgnoreParser and MethodFilterParser
 */

import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

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

console.log('🧪 Testing Parsers...\n');

// ============================================================================
// GITIGNORE PARSER TESTS
// ============================================================================
console.log('📋 GitIgnoreParser Tests');
console.log('-'.repeat(70));

// Create test .gitignore file
const testGitignore = path.join(FIXTURES_DIR, 'test.gitignore');
fs.writeFileSync(testGitignore, `node_modules/
*.log
/build
temp/
.DS_Store
`);

// Create test .contextignore file
const testContextIgnore = path.join(FIXTURES_DIR, 'test.contextignore');
fs.writeFileSync(testContextIgnore, `*.test.js
coverage/
`);

// Create test .contextinclude file
const testContextInclude = path.join(FIXTURES_DIR, 'test.contextinclude');
fs.writeFileSync(testContextInclude, `src/
lib/
`);

test('GitIgnoreParser - Constructor creates instance', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    if (typeof parser !== 'object') throw new Error('Should create instance');
    if (!Array.isArray(parser.patterns)) throw new Error('Should have patterns array');
});

test('GitIgnoreParser - Parses gitignore patterns', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    if (parser.patterns.length === 0) throw new Error('Should parse patterns');
});

test('GitIgnoreParser - Handles non-existent gitignore', () => {
    const parser = new GitIgnoreParser('/nonexistent/.gitignore', null, null);
    // Should not throw, just have empty patterns
    if (!Array.isArray(parser.patterns)) throw new Error('Should have empty patterns');
});

test('GitIgnoreParser - convertToRegex converts wildcards', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    const pattern = parser.convertToRegex('*.log');
    if (!pattern.regex) throw new Error('Should create regex');
    if (!pattern.regex.test('error.log')) throw new Error('Should match *.log');
});

test('GitIgnoreParser - convertToRegex handles directory patterns', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    const pattern = parser.convertToRegex('temp/');
    if (!pattern.isDirectory) throw new Error('Should detect directory pattern');
});

test('GitIgnoreParser - convertToRegex handles negation', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    const pattern = parser.convertToRegex('!important.log');
    if (!pattern.isNegation) throw new Error('Should detect negation');
});

test('GitIgnoreParser - convertToRegex handles ** patterns', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    const pattern = parser.convertToRegex('**/*.js');
    if (!pattern.regex.test('src/test/file.js')) {
        throw new Error('Should match recursive pattern');
    }
});

test('GitIgnoreParser - convertToRegex handles root patterns', () => {
    const parser = new GitIgnoreParser(testGitignore, null, null);
    const pattern = parser.convertToRegex('/build');
    // Root patterns should match from start
    if (!pattern.regex.toString().includes('^')) {
        throw new Error('Should anchor to root');
    }
});

test('GitIgnoreParser - parsePatternFile filters comments', () => {
    const commentFile = path.join(FIXTURES_DIR, 'test-comments.gitignore');
    fs.writeFileSync(commentFile, `# Comment
*.log
  # Another comment
node_modules/
`);
    const parser = new GitIgnoreParser(commentFile, null, null);
    // Should only have 2 patterns (comments filtered)
    if (parser.patterns.length !== 2) {
        throw new Error(`Expected 2 patterns, got ${parser.patterns.length}`);
    }
    fs.unlinkSync(commentFile);
});

test('GitIgnoreParser - parsePatternFile filters empty lines', () => {
    const emptyLineFile = path.join(FIXTURES_DIR, 'test-empty.gitignore');
    fs.writeFileSync(emptyLineFile, `*.log

node_modules/

`);
    const parser = new GitIgnoreParser(emptyLineFile, null, null);
    // Should only have 2 patterns (empty lines filtered)
    if (parser.patterns.length !== 2) {
        throw new Error(`Expected 2 patterns, got ${parser.patterns.length}`);
    }
    fs.unlinkSync(emptyLineFile);
});

test('GitIgnoreParser - parsePatternFile handles directory input', () => {
    // Should return empty array for directory
    const parser = new GitIgnoreParser(__dirname, null, null);
    if (parser.patterns.length !== 0) throw new Error('Should handle directory gracefully');
});

test('GitIgnoreParser - with contextIgnore', () => {
    const parser = new GitIgnoreParser(testGitignore, testContextIgnore, null);
    if (parser.contextPatterns.length === 0) {
        throw new Error('Should load context ignore patterns');
    }
    if (parser.hasIncludeFile) throw new Error('Should not have include file');
});

test('GitIgnoreParser - with contextInclude', () => {
    const parser = new GitIgnoreParser(testGitignore, null, testContextInclude);
    if (parser.contextPatterns.length === 0) {
        throw new Error('Should load context include patterns');
    }
    if (!parser.hasIncludeFile) throw new Error('Should have include file');
});

test('GitIgnoreParser - include takes precedence over ignore', () => {
    const parser = new GitIgnoreParser(testGitignore, testContextIgnore, testContextInclude);
    // Include file should be loaded instead of ignore
    if (!parser.hasIncludeFile) throw new Error('Include should take precedence');
});

// ============================================================================
// METHOD FILTER PARSER TESTS
// ============================================================================
console.log('\n🔧 MethodFilterParser Tests');
console.log('-'.repeat(70));

// Create test .methodinclude file
const testMethodInclude = path.join(FIXTURES_DIR, 'test.methodinclude');
fs.writeFileSync(testMethodInclude, `test*
*Handler
MyClass.*
`);

// Create test .methodignore file
const testMethodIgnore = path.join(FIXTURES_DIR, 'test.methodignore');
fs.writeFileSync(testMethodIgnore, `_private*
*Internal
`);

test('MethodFilterParser - Constructor creates instance', () => {
    const parser = new MethodFilterParser(null, null);
    if (typeof parser !== 'object') throw new Error('Should create instance');
    if (!Array.isArray(parser.includePatterns)) throw new Error('Should have includePatterns');
    if (!Array.isArray(parser.ignorePatterns)) throw new Error('Should have ignorePatterns');
});

test('MethodFilterParser - Loads include patterns', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    if (parser.includePatterns.length !== 3) {
        throw new Error(`Expected 3 patterns, got ${parser.includePatterns.length}`);
    }
    if (!parser.hasIncludeFile) throw new Error('Should detect include file');
});

test('MethodFilterParser - Loads ignore patterns', () => {
    const parser = new MethodFilterParser(null, testMethodIgnore);
    if (parser.ignorePatterns.length !== 2) {
        throw new Error(`Expected 2 patterns, got ${parser.ignorePatterns.length}`);
    }
});

test('MethodFilterParser - Handles non-existent files', () => {
    const parser = new MethodFilterParser('/nonexistent/include', '/nonexistent/ignore');
    if (parser.includePatterns.length !== 0) throw new Error('Should have empty includes');
    if (parser.ignorePatterns.length !== 0) throw new Error('Should have empty ignores');
});

test('MethodFilterParser - parseMethodFile creates regex', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    const pattern = parser.includePatterns[0];
    if (!pattern.regex) throw new Error('Should create regex');
    if (!pattern.pattern) throw new Error('Should preserve original pattern');
});

test('MethodFilterParser - parseMethodFile converts wildcards', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    // Find test* pattern
    const testPattern = parser.includePatterns.find(p => p.pattern === 'test*');
    if (!testPattern) throw new Error('Should have test* pattern');
    if (!testPattern.regex.test('testMethod')) throw new Error('Should match test*');
    if (!testPattern.regex.test('testFoo')) throw new Error('Should match test*');
});

test('MethodFilterParser - parseMethodFile is case insensitive', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    const pattern = parser.includePatterns[0];
    // Regex should be case insensitive
    if (pattern.regex.test('TestMethod') === false) {
        throw new Error('Should be case insensitive');
    }
});

test('MethodFilterParser - parseMethodFile filters comments', () => {
    const commentFile = path.join(FIXTURES_DIR, 'test-comments.methodinclude');
    fs.writeFileSync(commentFile, `# Comment
test*
  # Another comment
*Handler
`);
    const parser = new MethodFilterParser(commentFile, null);
    // Should only have 2 patterns (comments filtered)
    if (parser.includePatterns.length !== 2) {
        throw new Error(`Expected 2 patterns, got ${parser.includePatterns.length}`);
    }
    fs.unlinkSync(commentFile);
});

test('MethodFilterParser - parseMethodFile filters empty lines', () => {
    const emptyLineFile = path.join(FIXTURES_DIR, 'test-empty.methodinclude');
    fs.writeFileSync(emptyLineFile, `test*

*Handler

`);
    const parser = new MethodFilterParser(emptyLineFile, null);
    // Should only have 2 patterns (empty lines filtered)
    if (parser.includePatterns.length !== 2) {
        throw new Error(`Expected 2 patterns, got ${parser.includePatterns.length}`);
    }
    fs.unlinkSync(emptyLineFile);
});

test('MethodFilterParser - shouldIncludeMethod with include mode', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    // Should match test* pattern
    if (!parser.shouldIncludeMethod('testMethod', 'MyFile')) {
        throw new Error('Should include testMethod');
    }
    // Should not match if no pattern matches
    if (parser.shouldIncludeMethod('fooBar', 'MyFile')) {
        throw new Error('Should not include fooBar');
    }
});

test('MethodFilterParser - shouldIncludeMethod with ignore mode', () => {
    const parser = new MethodFilterParser(null, testMethodIgnore);
    // Should exclude _private* pattern
    if (parser.shouldIncludeMethod('_privateMethod', 'MyFile')) {
        throw new Error('Should exclude _privateMethod');
    }
    // Should include if no pattern matches
    if (!parser.shouldIncludeMethod('publicMethod', 'MyFile')) {
        throw new Error('Should include publicMethod');
    }
});

test('MethodFilterParser - shouldIncludeMethod matches by method name', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    // Should match *Handler pattern
    if (!parser.shouldIncludeMethod('errorHandler', 'MyFile')) {
        throw new Error('Should match errorHandler');
    }
});

test('MethodFilterParser - shouldIncludeMethod matches by file.method', () => {
    const parser = new MethodFilterParser(testMethodInclude, null);
    // Should match MyClass.* pattern
    if (!parser.shouldIncludeMethod('init', 'MyClass')) {
        throw new Error('Should match MyClass.init');
    }
});

test('MethodFilterParser - shouldIncludeMethod with both files', () => {
    const parser = new MethodFilterParser(testMethodInclude, testMethodIgnore);
    // Include takes precedence (hasIncludeFile = true)
    if (!parser.hasIncludeFile) throw new Error('Should detect include file');
    // Should use include mode, not ignore mode
    if (parser.shouldIncludeMethod('someMethod', 'MyFile')) {
        throw new Error('Should use include mode');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
fs.unlinkSync(testGitignore);
fs.unlinkSync(testContextIgnore);
fs.unlinkSync(testContextInclude);
fs.unlinkSync(testMethodInclude);
fs.unlinkSync(testMethodIgnore);

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
    console.log('\n🎉 All parser tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
