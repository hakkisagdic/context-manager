#!/usr/bin/env node

/**
 * Rule Tracer Tests
 * Tests for rule debugging and pattern analysis
 */

const RuleTracer = require('../lib/debug/rule-tracer');
const GitIgnoreParser = require('../lib/parsers/gitignore-parser');
const MethodFilterParser = require('../lib/parsers/method-filter-parser');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Rule Tracer Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✅ ${description}`);
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
    }
}

// Setup: Create temporary test directory and files
const testDir = path.join(__dirname, '.rule-tracer-test');
const tempFiles = {
    gitignore: path.join(testDir, '.gitignore'),
    calcIgnore: path.join(testDir, '.calculatorignore'),
    calcInclude: path.join(testDir, '.calculatorinclude'),
    methodIgnore: path.join(testDir, '.methodignore'),
    methodInclude: path.join(testDir, '.methodinclude')
};

function setupTestFiles() {
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    // .gitignore
    fs.writeFileSync(tempFiles.gitignore,
        'node_modules/\n.env\n*.log\n'
    );

    // .calculatorignore (EXCLUDE mode)
    fs.writeFileSync(tempFiles.calcIgnore,
        'test/**\ndocs/**\n*.md\n'
    );

    // .calculatorinclude (INCLUDE mode)
    // Note: Using simpler patterns due to GitIgnoreParser ** handling
    fs.writeFileSync(tempFiles.calcInclude,
        'src/**\nlib/**\nindex.js\n'
    );

    // .methodignore
    fs.writeFileSync(tempFiles.methodIgnore,
        'test*\n*Helper\nprivate*\n'
    );

    // .methodinclude
    fs.writeFileSync(tempFiles.methodInclude,
        'handle*\nprocess*\nServer.*\n'
    );
}

function cleanupTestFiles() {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

// Setup test environment
setupTestFiles();

// Test 1: RuleTracer Constructor
test('RuleTracer initializes correctly', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    assert(tracer.gitIgnoreParser, 'Should have gitIgnoreParser');
    assert(Array.isArray(tracer.traces), 'Should initialize traces array');
});

// Test 2: RuleTracer with Method Filter
test('RuleTracer initializes with method filter', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const methodFilter = new MethodFilterParser(tempFiles.methodInclude, null);
    const tracer = new RuleTracer(parser, methodFilter);

    assert(tracer.methodFilter, 'Should have methodFilter');
});

// Test 3: Trace File - Gitignore Exclusion
test('traceFile detects .gitignore exclusions', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const filePath = path.join(testDir, 'node_modules/package/index.js');
    const trace = tracer.traceFile(filePath, testDir);

    assert.strictEqual(trace.included, false, 'Should be excluded');
    assert.strictEqual(trace.type, 'gitignore', 'Should be gitignore type');
    assert(trace.reason.includes('gitignore'), 'Reason should mention gitignore');
});

// Test 4: Trace File - Calculator EXCLUDE Mode
test('traceFile detects calculator exclusions (EXCLUDE mode)', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, tempFiles.calcIgnore, null);
    const tracer = new RuleTracer(parser);

    const filePath = path.join(testDir, 'test/test.js');
    const trace = tracer.traceFile(filePath, testDir);

    assert.strictEqual(trace.included, false, 'Should be excluded');
    assert.strictEqual(trace.mode, 'EXCLUDE', 'Should be EXCLUDE mode');
    assert(trace.reason.includes('exclude pattern'), 'Should mention exclude pattern');
});

// Test 5: Trace File - Calculator INCLUDE Mode
test('traceFile detects calculator inclusions (INCLUDE mode)', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, null, tempFiles.calcInclude);
    const tracer = new RuleTracer(parser);

    const filePath = path.join(testDir, 'src/server.js');
    const trace = tracer.traceFile(filePath, testDir);

    assert.strictEqual(trace.included, true, 'Should be included');
    assert.strictEqual(trace.mode, 'INCLUDE', 'Should be INCLUDE mode');
    assert(trace.reason.includes('include pattern'), 'Should mention include pattern');
});

// Test 6: Trace File - No Match in INCLUDE Mode
test('traceFile excludes non-matching files in INCLUDE mode', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, null, tempFiles.calcInclude);
    const tracer = new RuleTracer(parser);

    const filePath = path.join(testDir, 'docs/README.md');
    const trace = tracer.traceFile(filePath, testDir);

    assert.strictEqual(trace.included, false, 'Should be excluded');
    assert.strictEqual(trace.mode, 'INCLUDE', 'Should be INCLUDE mode');
    assert(trace.reason.includes('No include pattern matched'), 'Should explain no match');
});

// Test 7: Trace File - Default Inclusion
test('traceFile includes files when no rules match', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const filePath = path.join(testDir, 'src/index.js');
    const trace = tracer.traceFile(filePath, testDir);

    assert.strictEqual(trace.included, true, 'Should be included');
    assert.strictEqual(trace.type, 'default', 'Should be default type');
    assert(trace.reason.includes('No exclusion rules'), 'Should explain default inclusion');
});

// Test 8: Test Pattern - Glob Matching
test('testPattern matches glob patterns correctly', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    assert(tracer.testPattern('test/foo/bar.js', 'test/**'), 'Should match test/**');
    assert(tracer.testPattern('src/utils.js', 'src/*.js'), 'Should match src/*.js');
    assert(!tracer.testPattern('src/foo/bar.js', 'src/*.js'), 'Should not match nested');
    assert(tracer.testPattern('file.test.js', '*.test.js'), 'Should match *.test.js');
});

// Test 9: Test Pattern - Regex Matching
test('testPattern matches regex patterns', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const regex = /^test\/.*/;
    assert(tracer.testPattern('test/foo.js', regex), 'Should match regex');
    assert(!tracer.testPattern('src/test.js', regex), 'Should not match regex');
});

// Test 10: Trace Method - No Filter
test('traceMethod includes all methods when no filter', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser, null);

    const trace = tracer.traceMethod('handleRequest', 'server.js');

    assert.strictEqual(trace.included, true, 'Should be included');
    assert(trace.reason.includes('No method filtering'), 'Should explain no filtering');
});

// Test 11: Trace Method - INCLUDE Mode Match
test('traceMethod includes matching methods in INCLUDE mode', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const methodFilter = new MethodFilterParser(tempFiles.methodInclude, null);
    const tracer = new RuleTracer(parser, methodFilter);

    const trace = tracer.traceMethod('handleRequest', 'server.js');

    assert.strictEqual(trace.included, true, 'Should be included');
    assert.strictEqual(trace.mode, 'INCLUDE', 'Should be INCLUDE mode');
    assert(trace.reason.includes('include pattern'), 'Should mention include pattern');
});

// Test 12: Trace Method - INCLUDE Mode No Match
test('traceMethod excludes non-matching methods in INCLUDE mode', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const methodFilter = new MethodFilterParser(tempFiles.methodInclude, null);
    const tracer = new RuleTracer(parser, methodFilter);

    const trace = tracer.traceMethod('helper', 'utils.js');

    assert.strictEqual(trace.included, false, 'Should be excluded');
    assert.strictEqual(trace.mode, 'INCLUDE', 'Should be INCLUDE mode');
    assert(trace.reason.includes('No include pattern'), 'Should explain no match');
});

// Test 13: Trace Method - EXCLUDE Mode Match
test('traceMethod excludes matching methods in EXCLUDE mode', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const methodFilter = new MethodFilterParser(null, tempFiles.methodIgnore);
    const tracer = new RuleTracer(parser, methodFilter);

    const trace = tracer.traceMethod('testHelper', 'utils.js');

    assert.strictEqual(trace.included, false, 'Should be excluded');
    assert.strictEqual(trace.mode, 'EXCLUDE', 'Should be EXCLUDE mode');
    assert(trace.reason.includes('exclude pattern'), 'Should mention exclude pattern');
});

// Test 14: Trace Method - EXCLUDE Mode No Match
test('traceMethod includes non-matching methods in EXCLUDE mode', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const methodFilter = new MethodFilterParser(null, tempFiles.methodIgnore);
    const tracer = new RuleTracer(parser, methodFilter);

    const trace = tracer.traceMethod('handleRequest', 'server.js');

    assert.strictEqual(trace.included, true, 'Should be included');
    assert.strictEqual(trace.mode, 'EXCLUDE', 'Should be EXCLUDE mode');
    assert(trace.reason.includes('No exclude pattern'), 'Should explain no match');
});

// Test 15: Analyze Patterns - INCLUDE Mode
test('analyzePatterns analyzes include patterns', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, null, tempFiles.calcInclude);
    const tracer = new RuleTracer(parser);

    const files = [
        { relativePath: 'src/server.js' },
        { relativePath: 'lib/utils.js' },
        { relativePath: 'test/test.js' },
        { relativePath: 'index.js' }
    ];

    const analysis = tracer.analyzePatterns(files);

    assert(analysis.includePatterns.length > 0, 'Should have include patterns');

    // Find the src/**/*.js pattern
    const srcPattern = analysis.includePatterns.find(p => p.pattern.includes('src'));
    assert(srcPattern, 'Should find src pattern');
    assert(srcPattern.matches > 0, 'Should have matches');
    assert(srcPattern.examples.length > 0, 'Should have examples');
});

// Test 16: Analyze Patterns - EXCLUDE Mode
test('analyzePatterns analyzes exclude patterns', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, tempFiles.calcIgnore, null);
    const tracer = new RuleTracer(parser);

    const files = [
        { relativePath: 'src/server.js' },
        { relativePath: 'test/test.js' },
        { relativePath: 'docs/README.md' }
    ];

    const analysis = tracer.analyzePatterns(files);

    assert(analysis.excludePatterns.length > 0, 'Should have exclude patterns');

    // Find the test/** pattern
    const testPattern = analysis.excludePatterns.find(p => p.pattern.includes('test'));
    assert(testPattern, 'Should find test pattern');
    assert(testPattern.matches > 0, 'Should have matches');
});

// Test 17: Analyze Patterns - Unused Patterns Detection
test('analyzePatterns detects unused patterns', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, tempFiles.calcIgnore, null);
    const tracer = new RuleTracer(parser);

    const files = [
        { relativePath: 'src/server.js' }
    ];

    const analysis = tracer.analyzePatterns(files);

    // test/** and docs/** and *.md patterns should have no matches
    const unusedPatterns = analysis.excludePatterns.filter(p => !p.used);
    assert(unusedPatterns.length > 0, 'Should detect unused patterns');
});

// Test 18: Match Method Pattern - Wildcard
test('matchesMethodPattern matches wildcards', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    assert(tracer.matchesMethodPattern('handleRequest', 'server.js', 'handle*'), 'Should match handle*');
    assert(tracer.matchesMethodPattern('handleError', 'server.js', 'handle*'), 'Should match handle*');
    assert(!tracer.matchesMethodPattern('processData', 'server.js', 'handle*'), 'Should not match handle*');
});

// Test 19: Match Method Pattern - Class.method
test('matchesMethodPattern matches Class.method patterns', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    assert(tracer.matchesMethodPattern('start', 'Server.js', 'Server.*'), 'Should match Server.*');
    assert(tracer.matchesMethodPattern('start', 'MyServer.js', 'Server.*'), 'Should match partial class name');
    assert(!tracer.matchesMethodPattern('start', 'Client.js', 'Server.*'), 'Should not match different class');
});

// Test 20: Match Method Pattern - Exact Match
test('matchesMethodPattern matches exact method names', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    assert(tracer.matchesMethodPattern('handleRequest', 'server.js', 'handleRequest'), 'Should match exact');
    assert(!tracer.matchesMethodPattern('handleError', 'server.js', 'handleRequest'), 'Should not match different method');
});

// Test 21: Print Trace Output
test('printTrace outputs correctly without errors', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const trace = {
        file: 'test.js',
        included: true,
        reason: 'Test reason',
        rule: { pattern: '*.js', line: 1 },
        mode: 'INCLUDE'
    };

    // Should not throw
    assert.doesNotThrow(() => {
        const oldLog = console.log;
        console.log = () => {}; // Suppress output
        tracer.printTrace(trace);
        console.log = oldLog;
    }, 'Should print without error');
});

// Test 22: Print Method Trace Output
test('printMethodTrace outputs correctly without errors', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const trace = {
        method: 'handleRequest',
        file: 'server.js',
        included: true,
        reason: 'Test reason',
        rule: { pattern: 'handle*', line: 1 },
        mode: 'INCLUDE'
    };

    // Should not throw
    assert.doesNotThrow(() => {
        const oldLog = console.log;
        console.log = () => {}; // Suppress output
        tracer.printMethodTrace(trace);
        console.log = oldLog;
    }, 'Should print without error');
});

// Test 23: Print Pattern Analysis Output
test('printPatternAnalysis outputs correctly', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore, null, tempFiles.calcInclude);
    const tracer = new RuleTracer(parser);

    const analysis = {
        includePatterns: [
            { pattern: 'src/**', line: 1, matches: 5, examples: ['src/a.js'], mode: 'INCLUDE', used: true }
        ],
        excludePatterns: []
    };

    // Should not throw
    assert.doesNotThrow(() => {
        const oldLog = console.log;
        console.log = () => {}; // Suppress output
        tracer.printPatternAnalysis(analysis);
        console.log = oldLog;
    }, 'Should print without error');
});

// Test 24: Find Matching Rule
test('findMatchingRule finds first matching rule', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const rules = [
        { pattern: 'test/**', original: 'test/**' },
        { pattern: 'src/**', original: 'src/**' }
    ];

    const match = tracer.findMatchingRule('test/foo.js', rules);

    assert(match, 'Should find match');
    assert.strictEqual(match.pattern, 'test/**', 'Should match first rule');
    assert.strictEqual(match.line, 1, 'Should have line number');
});

// Test 25: Find Matching Rule - No Match
test('findMatchingRule returns null when no match', () => {
    const parser = new GitIgnoreParser(tempFiles.gitignore);
    const tracer = new RuleTracer(parser);

    const rules = [
        { pattern: 'test/**', original: 'test/**' }
    ];

    const match = tracer.findMatchingRule('src/foo.js', rules);

    assert.strictEqual(match, null, 'Should return null for no match');
});

// Cleanup
cleanupTestFiles();

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`❌ Failed: ${totalTests - passedTests} tests`);
    process.exit(1);
}
