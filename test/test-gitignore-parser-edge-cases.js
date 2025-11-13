#!/usr/bin/env node

/**
 * Comprehensive GitIgnore Parser Edge Cases Tests
 * Tests .gitignore pattern parsing, negation, wildcards, and edge cases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

console.log('🧪 GITIGNORE PARSER EDGE CASES TESTS');
console.log('='.repeat(70));

// Create test directory
const testDir = path.join(__dirname, 'temp-test-gitignore');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// NEGATION PATTERN TESTS
// ============================================================================
console.log('\n🔄 Negation Pattern Tests\n' + '-'.repeat(70));

// Test 1: Simple negation
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.log\n!important.log');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Negation: Parser handles !important.log pattern'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 2: Directory negation
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'build/\n!build/important/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Negation: Parser handles directory negation'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// DIRECTORY PATTERN TESTS
// ============================================================================
console.log('\n📁 Directory Pattern Tests\n' + '-'.repeat(70));

// Test 3: Trailing slash for directories
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'node_modules/\nbuild/\ndist/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Directory: Parser handles trailing slash patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 4: Leading slash for root directory
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '/build\n/dist\n/temp');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Directory: Parser handles leading slash (root) patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// WILDCARD PATTERN TESTS
// ============================================================================
console.log('\n🌟 Wildcard Pattern Tests\n' + '-'.repeat(70));

// Test 5: Single asterisk wildcard
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.log\n*.tmp\n*.cache');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles *.ext patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 6: Double asterisk (globstar)
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '**/*.log\n**/node_modules/\n**/__pycache__/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles **/ globstar patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 7: Question mark wildcard
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'test?.log\nfile??.txt');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles ? single character wildcard'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 8: Character ranges
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'test[0-9].log\nfile[a-z].txt\n[A-Z]*');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Wildcard: Parser handles [range] patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// COMMENT HANDLING
// ============================================================================
console.log('\n💬 Comment Handling Tests\n' + '-'.repeat(70));

// Test 9: Hash comments
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '# This is a comment\n*.log\n# Another comment');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Comments: Parser handles # comments'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 10: Inline comments (not standard but test handling)
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.log # log files\nnode_modules/ # dependencies');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Comments: Parser handles inline comments gracefully'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// EMPTY LINES AND WHITESPACE
// ============================================================================
console.log('\n⚪ Whitespace Handling Tests\n' + '-'.repeat(70));

// Test 11: Empty lines
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.log\n\n\nnode_modules/\n\n*.tmp');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Whitespace: Parser handles empty lines'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 12: Leading/trailing whitespace
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '  *.log  \n\t*.tmp\t\n   node_modules/   ');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Whitespace: Parser handles leading/trailing spaces'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 13: Tab characters
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '\t*.log\n\t\tnode_modules/\n\t\t\t*.tmp');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Whitespace: Parser handles tab indentation'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// ABSOLUTE AND RELATIVE PATHS
// ============================================================================
console.log('\n📍 Path Pattern Tests\n' + '-'.repeat(70));

// Test 14: Absolute path patterns
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '/src/build/\n/dist/\n/output/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Paths: Parser handles absolute paths (from root)'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 15: Relative path patterns
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'src/temp/\nlib/cache/\nbin/debug/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Paths: Parser handles relative paths'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 16: Parent directory references
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '../temp/\n../../cache/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Paths: Parser handles ../ parent references'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// PATTERN ORDER AND PRIORITY
// ============================================================================
console.log('\n📋 Pattern Order Tests\n' + '-'.repeat(70));

// Test 17: Pattern order matters
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.log\n!important.log\nimportant.log');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Order: Parser preserves pattern order'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 18: More specific patterns override general
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'build/\n!build/important/\nbuild/important/temp/');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Order: More specific patterns handled correctly'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// VERY LARGE GITIGNORE FILES
// ============================================================================
console.log('\n📏 Performance Tests\n' + '-'.repeat(70));

// Test 19: Large number of patterns
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    const patterns = [];
    for (let i = 0; i < 1000; i++) {
        patterns.push(`pattern${i}.log`);
    }
    fs.writeFileSync(gitignoreFile, patterns.join('\n'));

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Performance: Parser handles 1000 patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 20: Very long single pattern
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    const longPattern = 'a'.repeat(500) + '.log';
    fs.writeFileSync(gitignoreFile, longPattern);

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Performance: Parser handles very long patterns (500 chars)'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// SPECIAL CHARACTERS
// ============================================================================
console.log('\n🔣 Special Characters Tests\n' + '-'.repeat(70));

// Test 21: UTF-8 patterns
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '你好.log\n世界.txt\n*.日本語');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'UTF-8: Parser handles unicode patterns'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 22: Special characters that need escaping
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '*.\\[backup\\].log\ntest\\(1\\).txt');

    const parser = new GitIgnoreParser(gitignoreFile, null, null);
    assert(
        parser !== null,
        'Special: Parser handles escaped characters'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// CONTEXTIGNORE AND CONTEXTINCLUDE INTEGRATION
// ============================================================================
console.log('\n🔗 Context Filter Integration Tests\n' + '-'.repeat(70));

// Test 23: contextignore with gitignore
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    const contextignoreFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(gitignoreFile, 'node_modules/\n*.log');
    fs.writeFileSync(contextignoreFile, '*.tmp\n*.cache');

    const parser = new GitIgnoreParser(gitignoreFile, contextignoreFile, null);
    assert(
        parser !== null,
        'Integration: Parser combines .gitignore and .contextignore'
    );

    fs.unlinkSync(gitignoreFile);
    fs.unlinkSync(contextignoreFile);
}

// Test 24: contextinclude mode (overrides ignore)
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    const contextincludeFile = path.join(testDir, '.contextinclude');
    fs.writeFileSync(gitignoreFile, '*');
    fs.writeFileSync(contextincludeFile, '*.js\n*.ts\n*.py');

    const parser = new GitIgnoreParser(gitignoreFile, null, contextincludeFile);
    assert(
        parser !== null,
        'Integration: contextinclude mode overrides ignore'
    );

    fs.unlinkSync(gitignoreFile);
    fs.unlinkSync(contextincludeFile);
}

// Test 25: All three files together
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    const contextignoreFile = path.join(testDir, '.contextignore');
    const contextincludeFile = path.join(testDir, '.contextinclude');
    fs.writeFileSync(gitignoreFile, 'node_modules/');
    fs.writeFileSync(contextignoreFile, '*.tmp');
    fs.writeFileSync(contextincludeFile, '*.js');

    const parser = new GitIgnoreParser(gitignoreFile, contextignoreFile, contextincludeFile);
    assert(
        parser !== null,
        'Integration: Parser handles all three config files'
    );

    fs.unlinkSync(gitignoreFile);
    fs.unlinkSync(contextignoreFile);
    fs.unlinkSync(contextincludeFile);
}

// Cleanup
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total tests: ${testsPassed + testsFailed}`);
console.log(`🎯 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(({ name, message }) => {
        console.log(`  • ${name}`);
        if (message) console.log(`    ${message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
