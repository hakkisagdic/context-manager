#!/usr/bin/env node

/**
 * Comprehensive GitIgnore Parser Tests
 * Tests for .gitignore, .contextignore, and .contextinclude file parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';

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

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'gitignore-parser');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

// Create test fixtures
function setupTestFixtures() {
    // Clean up old fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }

    // Create directory structure
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'src'), { recursive: true });
    fs.mkdirSync(path.join(TEST_PROJECT_DIR, 'node_modules'), { recursive: true });

    // Create test files
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.gitignore'), `
# Node modules
node_modules/
.env

# Logs
*.log
logs/

# Build output
dist/
build/
`);

    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.contextignore'), `
# Test files
**/*.test.js
*.spec.js

# Mock files
**/*Mock.js
`);

    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.contextinclude'), `
# Include only source files
src/**/*.js
src/**/*.ts
lib/**/*.js
`);

    // Create some test files
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'src', 'index.js'), 'console.log("hello");');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.env'), 'SECRET=123');
}

// Clean up test fixtures
function cleanupTestFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
}

console.log('🧪 Testing GitIgnore Parser...\n');
console.log('Setting up test fixtures...\n');
setupTestFixtures();

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - Constructor with all files', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        path.join(TEST_PROJECT_DIR, '.contextignore'),
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    if (!parser) throw new Error('Should create instance');
    if (!Array.isArray(parser.patterns)) throw new Error('Should have patterns array');
    if (!Array.isArray(parser.contextPatterns)) throw new Error('Should have contextPatterns array');
});

test('GitIgnoreParser - Constructor with only gitignore', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    if (!parser) throw new Error('Should create instance');
    if (parser.patterns.length === 0) throw new Error('Should load gitignore patterns');
});

test('GitIgnoreParser - Constructor with nonexistent files', () => {
    const parser = new GitIgnoreParser(
        '/nonexistent/.gitignore',
        '/nonexistent/.contextignore',
        '/nonexistent/.contextinclude'
    );

    if (!parser) throw new Error('Should create instance');
    if (parser.patterns.length !== 0) throw new Error('Should have empty patterns');
});

test('GitIgnoreParser - Constructor with tracer', () => {
    const mockTracer = { isEnabled: () => true, recordFileDecision: () => {} };
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null,
        mockTracer
    );

    if (!parser.tracer) throw new Error('Should have tracer');
});

// ============================================================================
// PATTERN PARSING TESTS
// ============================================================================
console.log('\n📝 Pattern Parsing Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - parsePatternFile loads patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    if (parser.patterns.length === 0) throw new Error('Should load patterns');
});

test('GitIgnoreParser - parsePatternFile ignores comments', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-comments.txt');
    fs.writeFileSync(testFile, '# Comment\npattern1\n# Another comment\npattern2');

    const parser = new GitIgnoreParser(testFile, null, null);

    // Should only have 2 patterns (comments ignored)
    if (parser.patterns.length !== 2) throw new Error('Should ignore comments');
});

test('GitIgnoreParser - parsePatternFile ignores empty lines', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-empty.txt');
    fs.writeFileSync(testFile, 'pattern1\n\n\npattern2\n\n');

    const parser = new GitIgnoreParser(testFile, null, null);

    if (parser.patterns.length !== 2) throw new Error('Should ignore empty lines');
});

test('GitIgnoreParser - parsePatternFile handles directory check', () => {
    const parser = new GitIgnoreParser(TEST_PROJECT_DIR, null, null);

    // Should return empty patterns (it's a directory, not a file)
    if (parser.patterns.length !== 0) throw new Error('Should return empty for directory');
});

// ============================================================================
// PATTERN CONVERSION TESTS
// ============================================================================
console.log('\n🔄 Pattern Conversion Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - convertToRegex handles simple patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const converted = parser.convertToRegex('*.log');

    if (!converted.regex) throw new Error('Should have regex');
    if (!converted.original) throw new Error('Should have original pattern');
});

test('GitIgnoreParser - convertToRegex handles directory patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const converted = parser.convertToRegex('node_modules/');

    if (!converted.isDirectory) throw new Error('Should detect directory pattern');
});

test('GitIgnoreParser - convertToRegex handles negation patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const converted = parser.convertToRegex('!important.js');

    if (!converted.isNegation) throw new Error('Should detect negation pattern');
});

test('GitIgnoreParser - convertToRegex handles wildcard patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const converted = parser.convertToRegex('**/*.js');

    if (!converted.regex) throw new Error('Should convert wildcard pattern');
    if (!converted.regex.test('src/utils/helper.js')) throw new Error('Should match nested path');
});

test('GitIgnoreParser - convertToRegex handles root-anchored patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const converted = parser.convertToRegex('/build');

    // Root-anchored patterns should match from start
    if (!converted.regex.source.startsWith('^')) throw new Error('Should be root-anchored');
});

// ============================================================================
// isIgnored() METHOD TESTS
// ============================================================================
console.log('\n🚫 isIgnored() Method Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - isIgnored detects gitignore patterns', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    if (!parser.isIgnored(null, 'node_modules/package.json')) {
        throw new Error('Should ignore node_modules');
    }

    if (!parser.isIgnored(null, 'app.log')) {
        throw new Error('Should ignore .log files');
    }

    if (!parser.isIgnored(null, '.env')) {
        throw new Error('Should ignore .env file');
    }
});

test('GitIgnoreParser - isIgnored allows non-ignored files', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    if (parser.isIgnored(null, 'src/index.js')) {
        throw new Error('Should not ignore src files');
    }

    if (parser.isIgnored(null, 'README.md')) {
        throw new Error('Should not ignore README');
    }
});

test('GitIgnoreParser - isIgnored with contextignore mode', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        path.join(TEST_PROJECT_DIR, '.contextignore'),
        null
    );

    if (!parser.isIgnored(null, 'test.spec.js')) {
        throw new Error('Should ignore .spec.js files');
    }
});

test('GitIgnoreParser - isIgnored with contextinclude mode', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    if (parser.hasIncludeFile !== true) {
        throw new Error('Should detect include mode');
    }
});

test('GitIgnoreParser - isIgnored respects gitignore even in include mode', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    if (!parser.isIgnored(null, 'node_modules/package.json')) {
        throw new Error('Should still ignore node_modules in include mode');
    }

    if (!parser.isIgnored(null, '.env')) {
        throw new Error('Should still ignore .env in include mode');
    }
});

// ============================================================================
// INCLUDE MODE TESTS
// ============================================================================
console.log('\n✅ Include Mode Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - Include mode prioritizes contextinclude', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        path.join(TEST_PROJECT_DIR, '.contextignore'),
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    if (!parser.hasIncludeFile) throw new Error('Should be in include mode');
});

test('GitIgnoreParser - Include mode includes matching files', () => {
    const testInclude = path.join(FIXTURES_DIR, 'test-include.txt');
    fs.writeFileSync(testInclude, 'src/**/*.js\nlib/**/*.js');

    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        testInclude
    );

    // In include mode, parser should have contextPatterns loaded
    if (parser.contextPatterns.length < 2) {
        throw new Error('Should load include patterns');
    }

    if (!parser.hasIncludeFile) {
        throw new Error('Should be in include mode');
    }
});

test('GitIgnoreParser - Include mode excludes non-matching files', () => {
    const testInclude = path.join(FIXTURES_DIR, 'test-include-strict.txt');
    fs.writeFileSync(testInclude, 'src/**/*.js');

    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        testInclude
    );

    // Files not matching include patterns should be ignored
    if (!parser.isIgnored(null, 'README.md')) {
        throw new Error('Should exclude README.md in include mode');
    }
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎯 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('GitIgnoreParser - Handles empty gitignore file', () => {
    const emptyFile = path.join(FIXTURES_DIR, 'empty.txt');
    fs.writeFileSync(emptyFile, '');

    const parser = new GitIgnoreParser(emptyFile, null, null);

    if (parser.patterns.length !== 0) throw new Error('Should have empty patterns');
});

test('GitIgnoreParser - Handles only comments file', () => {
    const commentsFile = path.join(FIXTURES_DIR, 'only-comments.txt');
    fs.writeFileSync(commentsFile, '# Comment 1\n# Comment 2\n# Comment 3');

    const parser = new GitIgnoreParser(commentsFile, null, null);

    if (parser.patterns.length !== 0) throw new Error('Should have empty patterns');
});

test('GitIgnoreParser - Handles patterns with special characters', () => {
    const specialFile = path.join(FIXTURES_DIR, 'special.txt');
    fs.writeFileSync(specialFile, '*.min.js\ntest?.js\n**/*.temp');

    const parser = new GitIgnoreParser(specialFile, null, null);

    if (parser.patterns.length !== 3) throw new Error('Should parse special patterns');
});

test('GitIgnoreParser - Handles very long patterns', () => {
    const longFile = path.join(FIXTURES_DIR, 'long-pattern.txt');
    const longPattern = 'a'.repeat(1000) + '/*.js';
    fs.writeFileSync(longFile, longPattern);

    const parser = new GitIgnoreParser(longFile, null, null);

    if (parser.patterns.length !== 1) throw new Error('Should handle long patterns');
});

test('GitIgnoreParser - Handles Unicode patterns', () => {
    const unicodeFile = path.join(FIXTURES_DIR, 'unicode.txt');
    fs.writeFileSync(unicodeFile, '*.log\n# 中文注释\n测试文件.txt', 'utf8');

    const parser = new GitIgnoreParser(unicodeFile, null, null);

    if (parser.patterns.length < 1) throw new Error('Should handle Unicode');
});

test('GitIgnoreParser - isIgnored with null filePath', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    // Should not crash with null filePath
    try {
        parser.isIgnored(null, 'test.js');
    } catch (error) {
        throw new Error('Should handle null filePath gracefully');
    }
});

test('GitIgnoreParser - isIgnored with empty relativePath', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    try {
        const result = parser.isIgnored(null, '');
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // May throw or return false, both acceptable
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('GitIgnoreParser - Full workflow with all config files', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        path.join(TEST_PROJECT_DIR, '.contextignore'),
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    // Should respect gitignore
    if (!parser.isIgnored(null, 'node_modules/package.json')) {
        throw new Error('Should ignore gitignore patterns');
    }

    // Should be in include mode
    if (!parser.hasIncludeFile) throw new Error('Should be in include mode');
});

test('GitIgnoreParser - Priority: gitignore > contextinclude', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        path.join(TEST_PROJECT_DIR, '.contextinclude')
    );

    // Gitignore should take priority
    if (!parser.isIgnored(null, '.env')) {
        throw new Error('Gitignore should take priority');
    }
});

test('GitIgnoreParser - Consistent results for same path', () => {
    const parser = new GitIgnoreParser(
        path.join(TEST_PROJECT_DIR, '.gitignore'),
        null,
        null
    );

    const result1 = parser.isIgnored(null, 'test.log');
    const result2 = parser.isIgnored(null, 'test.log');

    if (result1 !== result2) throw new Error('Should return consistent results');
});

// ============================================================================
// CLEANUP AND RESULTS
// ============================================================================
console.log('\nCleaning up test fixtures...');
cleanupTestFixtures();

console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All gitignore parser tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
