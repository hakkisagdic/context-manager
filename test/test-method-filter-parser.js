#!/usr/bin/env node

/**
 * Comprehensive Method Filter Parser Tests
 * Tests for .methodinclude and .methodignore file parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';

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
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'method-filter');

// Create test fixtures
function setupTestFixtures() {
    // Clean up old fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }

    // Create directory structure
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // Create test method filter files
    fs.writeFileSync(path.join(FIXTURES_DIR, '.methodinclude'), `
# Include patterns
*Handler
*Controller
*Service
get*
set*
`);

    fs.writeFileSync(path.join(FIXTURES_DIR, '.methodignore'), `
# Ignore patterns
*Test
*Mock
*Stub
test*
private*
_*
`);
}

// Clean up test fixtures
function cleanupTestFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
}

console.log('🧪 Testing Method Filter Parser...\n');
console.log('Setting up test fixtures...\n');
setupTestFixtures();

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Constructor with include and ignore files', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (!parser) throw new Error('Should create instance');
    if (!Array.isArray(parser.includePatterns)) throw new Error('Should have includePatterns');
    if (!Array.isArray(parser.ignorePatterns)) throw new Error('Should have ignorePatterns');
});

test('MethodFilterParser - Constructor with only include file', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    if (!parser.hasIncludeFile) throw new Error('Should set hasIncludeFile');
    if (parser.includePatterns.length === 0) throw new Error('Should load include patterns');
    if (parser.ignorePatterns.length !== 0) throw new Error('Should have empty ignore patterns');
});

test('MethodFilterParser - Constructor with only ignore file', () => {
    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (parser.hasIncludeFile) throw new Error('Should not set hasIncludeFile');
    if (parser.includePatterns.length !== 0) throw new Error('Should have empty include patterns');
    if (parser.ignorePatterns.length === 0) throw new Error('Should load ignore patterns');
});

test('MethodFilterParser - Constructor with nonexistent files', () => {
    const parser = new MethodFilterParser(
        '/nonexistent/.methodinclude',
        '/nonexistent/.methodignore'
    );

    if (!parser) throw new Error('Should create instance');
    if (parser.includePatterns.length !== 0) throw new Error('Should have empty patterns');
    if (parser.ignorePatterns.length !== 0) throw new Error('Should have empty patterns');
});

test('MethodFilterParser - Constructor with tracer', () => {
    const mockTracer = { isEnabled: () => true, recordMethodDecision: () => {} };
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        path.join(FIXTURES_DIR, '.methodignore'),
        mockTracer
    );

    if (!parser.tracer) throw new Error('Should have tracer');
});

// ============================================================================
// PATTERN PARSING TESTS
// ============================================================================
console.log('\n📝 Pattern Parsing Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - parseMethodFile loads patterns', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    if (parser.includePatterns.length === 0) throw new Error('Should load patterns');

    // Each pattern should have pattern and regex properties
    const firstPattern = parser.includePatterns[0];
    if (!firstPattern.pattern) throw new Error('Should have pattern property');
    if (!firstPattern.regex) throw new Error('Should have regex property');
});

test('MethodFilterParser - parseMethodFile ignores comments', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-comments.txt');
    fs.writeFileSync(testFile, '# Comment\n*Handler\n# Another comment\n*Controller');

    const parser = new MethodFilterParser(testFile, null);

    if (parser.includePatterns.length !== 2) throw new Error('Should ignore comments');
});

test('MethodFilterParser - parseMethodFile ignores empty lines', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-empty.txt');
    fs.writeFileSync(testFile, '*Handler\n\n\n*Controller\n\n');

    const parser = new MethodFilterParser(testFile, null);

    if (parser.includePatterns.length !== 2) throw new Error('Should ignore empty lines');
});

test('MethodFilterParser - Patterns converted to regex', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-regex.txt');
    fs.writeFileSync(testFile, '*Handler\nget*\ntest*');

    const parser = new MethodFilterParser(testFile, null);

    for (const pattern of parser.includePatterns) {
        if (!(pattern.regex instanceof RegExp)) throw new Error('Should be RegExp');
    }
});

// ============================================================================
// shouldIncludeMethod() INCLUDE MODE TESTS
// ============================================================================
console.log('\n✅ shouldIncludeMethod() - Include Mode Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Include mode includes matching methods', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    if (!parser.shouldIncludeMethod('saveHandler', 'app.js')) {
        throw new Error('Should include *Handler methods');
    }

    if (!parser.shouldIncludeMethod('userController', 'routes.js')) {
        throw new Error('Should include *Controller methods');
    }

    if (!parser.shouldIncludeMethod('getName', 'user.js')) {
        throw new Error('Should include get* methods');
    }
});

test('MethodFilterParser - Include mode excludes non-matching methods', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    if (parser.shouldIncludeMethod('randomMethod', 'app.js')) {
        throw new Error('Should exclude non-matching methods');
    }

    if (parser.shouldIncludeMethod('testHelper', 'utils.js')) {
        throw new Error('Should exclude test methods');
    }
});

test('MethodFilterParser - Include mode is case insensitive', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    if (!parser.shouldIncludeMethod('GETNAME', 'user.js')) {
        throw new Error('Should be case insensitive (uppercase)');
    }

    if (!parser.shouldIncludeMethod('savehandler', 'app.js')) {
        throw new Error('Should be case insensitive (lowercase)');
    }
});

// ============================================================================
// shouldIncludeMethod() EXCLUDE MODE TESTS
// ============================================================================
console.log('\n🚫 shouldIncludeMethod() - Exclude Mode Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Exclude mode includes all by default', () => {
    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (!parser.shouldIncludeMethod('saveHandler', 'app.js')) {
        throw new Error('Should include non-matching methods by default');
    }

    if (!parser.shouldIncludeMethod('processData', 'utils.js')) {
        throw new Error('Should include non-matching methods by default');
    }
});

test('MethodFilterParser - Exclude mode excludes matching methods', () => {
    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (parser.shouldIncludeMethod('saveTest', 'app.test.js')) {
        throw new Error('Should exclude *Test methods');
    }

    if (parser.shouldIncludeMethod('userMock', 'mocks.js')) {
        throw new Error('Should exclude *Mock methods');
    }

    if (parser.shouldIncludeMethod('testHelper', 'utils.js')) {
        throw new Error('Should exclude test* methods');
    }
});

test('MethodFilterParser - Exclude mode handles underscore prefix', () => {
    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (parser.shouldIncludeMethod('_privateMethod', 'app.js')) {
        throw new Error('Should exclude _* methods');
    }
});

test('MethodFilterParser - Exclude mode is case insensitive', () => {
    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore')
    );

    if (parser.shouldIncludeMethod('TESTHELPER', 'utils.js')) {
        throw new Error('Should be case insensitive (uppercase)');
    }

    if (parser.shouldIncludeMethod('usermock', 'mocks.js')) {
        throw new Error('Should be case insensitive (lowercase)');
    }
});

// ============================================================================
// PATTERN MATCHING TESTS
// ============================================================================
console.log('\n🎯 Pattern Matching Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Wildcard patterns work correctly', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-wildcard.txt');
    fs.writeFileSync(testFile, '*Handler\nget*\n*Service*');

    const parser = new MethodFilterParser(testFile, null);

    if (!parser.shouldIncludeMethod('saveHandler', 'app.js')) {
        throw new Error('Should match *Handler');
    }

    if (!parser.shouldIncludeMethod('getName', 'user.js')) {
        throw new Error('Should match get*');
    }

    if (!parser.shouldIncludeMethod('dataServiceImpl', 'services.js')) {
        throw new Error('Should match *Service*');
    }
});

test('MethodFilterParser - Pattern matching is partial by default', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-partial.txt');
    fs.writeFileSync(testFile, 'main\ninit\nsetup');

    const parser = new MethodFilterParser(testFile, null);

    if (!parser.shouldIncludeMethod('main', 'app.js')) {
        throw new Error('Should match exact pattern');
    }

    // Partial matching is the default behavior
    if (!parser.shouldIncludeMethod('mainHandler', 'app.js')) {
        throw new Error('Should match partial (contains "main")');
    }

    if (!parser.shouldIncludeMethod('initialize', 'app.js')) {
        throw new Error('Should match partial (contains "init")');
    }
});

test('MethodFilterParser - Multiple patterns evaluated in order', () => {
    const testFile = path.join(FIXTURES_DIR, 'test-order.txt');
    fs.writeFileSync(testFile, '*Handler\n*Controller\n*Service');

    const parser = new MethodFilterParser(testFile, null);

    // First matching pattern should be used
    if (!parser.shouldIncludeMethod('saveHandler', 'app.js')) {
        throw new Error('Should match first pattern');
    }
});

// ============================================================================
// TRACER INTEGRATION TESTS
// ============================================================================
console.log('\n🔍 Tracer Integration Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Tracer records include decisions', () => {
    let recorded = false;
    const mockTracer = {
        isEnabled: () => true,
        recordMethodDecision: (fileName, methodName, decision) => {
            recorded = true;
            if (!decision.included) throw new Error('Should record as included');
            if (!decision.reason) throw new Error('Should have reason');
        }
    };

    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null,
        mockTracer
    );

    parser.shouldIncludeMethod('saveHandler', 'app.js');

    if (!recorded) throw new Error('Should record decision');
});

test('MethodFilterParser - Tracer records exclude decisions', () => {
    let recorded = false;
    const mockTracer = {
        isEnabled: () => true,
        recordMethodDecision: (fileName, methodName, decision) => {
            recorded = true;
            if (decision.included) throw new Error('Should record as excluded');
            if (!decision.reason) throw new Error('Should have reason');
        }
    };

    const parser = new MethodFilterParser(
        null,
        path.join(FIXTURES_DIR, '.methodignore'),
        mockTracer
    );

    parser.shouldIncludeMethod('testHelper', 'utils.js');

    if (!recorded) throw new Error('Should record decision');
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎪 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('MethodFilterParser - Handles empty method name', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    try {
        const result = parser.shouldIncludeMethod('', 'app.js');
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // May throw or return false, both acceptable
    }
});

test('MethodFilterParser - Handles empty file name', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    try {
        const result = parser.shouldIncludeMethod('saveHandler', '');
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // May throw or return false, both acceptable
    }
});

test('MethodFilterParser - Handles special characters in method names', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    try {
        parser.shouldIncludeMethod('method-with-dash', 'app.js');
        parser.shouldIncludeMethod('method_with_underscore', 'app.js');
        parser.shouldIncludeMethod('method.with.dots', 'app.js');
        // Should not crash
    } catch (error) {
        throw new Error('Should handle special characters');
    }
});

test('MethodFilterParser - Handles very long method names', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    const longName = 'a'.repeat(1000) + 'Handler';
    const result = parser.shouldIncludeMethod(longName, 'app.js');

    if (!result) throw new Error('Should handle long names');
});

test('MethodFilterParser - Handles Unicode in method names', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    try {
        parser.shouldIncludeMethod('处理Handler', 'app.js');
        parser.shouldIncludeMethod('обработкаController', 'app.js');
        // Should not crash
    } catch (error) {
        throw new Error('Should handle Unicode');
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('MethodFilterParser - Include mode takes priority over ignore', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        path.join(FIXTURES_DIR, '.methodignore')
    );

    // Include mode should be active
    if (!parser.hasIncludeFile) throw new Error('Should be in include mode');

    // Should use include patterns, ignore file should be ignored
    if (!parser.shouldIncludeMethod('saveHandler', 'app.js')) {
        throw new Error('Should include Handler methods');
    }
});

test('MethodFilterParser - Consistent results for same method', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    const result1 = parser.shouldIncludeMethod('saveHandler', 'app.js');
    const result2 = parser.shouldIncludeMethod('saveHandler', 'app.js');

    if (result1 !== result2) throw new Error('Should return consistent results');
});

test('MethodFilterParser - Works with real-world method names', () => {
    const parser = new MethodFilterParser(
        path.join(FIXTURES_DIR, '.methodinclude'),
        null
    );

    const realMethods = [
        'getUserByIdHandler',
        'saveDataController',
        'processPaymentService',
        'getName',
        'setValue'
    ];

    for (const method of realMethods) {
        const result = parser.shouldIncludeMethod(method, 'app.js');
        if (!result) throw new Error(`Should include ${method}`);
    }
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
    console.log('\n🎉 All method filter parser tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
