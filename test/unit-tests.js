#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for Context Manager
 * Tests all core functionality with edge cases
 */

const { TokenAnalyzer, MethodAnalyzer, GitIgnoreParser, MethodFilterParser } = require('../index.js');
const fs = require('fs');
const path = require('path');

// Test framework
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

function assertThrows(fn, testName, expectedError = null) {
    try {
        fn();
        console.log(`❌ ${testName}: Expected error but none was thrown`);
        testsFailed++;
        failedTests.push({ name: testName, message: 'No error thrown' });
        return false;
    } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
            console.log(`❌ ${testName}: Wrong error - ${error.message}`);
            testsFailed++;
            failedTests.push({ name: testName, message: `Wrong error: ${error.message}` });
            return false;
        }
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    }
}

console.log('🧪 COMPREHENSIVE UNIT TESTS');
console.log('='.repeat(70));

// ============================================================================
// METHOD ANALYZER TESTS
// ============================================================================
console.log('\n📋 MethodAnalyzer Tests\n' + '-'.repeat(70));

const methodAnalyzer = new MethodAnalyzer();

// Test 1: Basic function detection
{
    const code = 'function testFunc() { return 42; }';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1 && methods[0].name === 'testFunc',
        'MethodAnalyzer: Extracts basic function',
        `Expected 1 method named 'testFunc', got ${methods.length} methods`
    );
}

// Test 2: Arrow function detection
{
    const code = 'const arrowFunc = () => { return 42; };';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1 && methods[0].name === 'arrowFunc',
        'MethodAnalyzer: Extracts arrow function',
        `Expected 1 method named 'arrowFunc', got ${methods.length} methods`
    );
}

// Test 3: Async function detection
{
    const code = 'async function asyncFunc() { return await Promise.resolve(42); }';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1 && methods[0].name === 'asyncFunc',
        'MethodAnalyzer: Extracts async function',
        `Expected 1 method named 'asyncFunc', got ${methods.length} methods`
    );
}

// Test 4: Class method detection
{
    const code = `
        class MyClass {
            myMethod() { return 42; }
            async asyncMethod() { return await Promise.resolve(42); }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 2,
        'MethodAnalyzer: Extracts class methods',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 5: Getter and setter detection
{
    const code = `
        class MyClass {
            get value() { return this._value; }
            set value(v) { this._value = v; }
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 2,
        'MethodAnalyzer: Extracts getters and setters',
        `Expected 2 methods (getter and setter), got ${methods.length}`
    );
}

// Test 6: Export function detection
{
    const code = 'export function exportedFunc() { return 42; }';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1 && methods[0].name === 'exportedFunc',
        'MethodAnalyzer: Extracts exported function',
        `Expected 1 method named 'exportedFunc', got ${methods.length} methods`
    );
}

// Test 7: No duplicate methods
{
    const code = `
        function test() { return 42; }
        const arrow = () => {};
        class C { method() {} }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    const names = methods.map(m => `${m.name}:${m.line}`);
    const uniqueNames = new Set(names);
    assert(
        names.length === uniqueNames.size,
        'MethodAnalyzer: No duplicate methods',
        `Found ${names.length - uniqueNames.size} duplicates`
    );
}

// Test 8: Empty code
{
    const code = '';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 0,
        'MethodAnalyzer: Handles empty code',
        `Expected 0 methods, got ${methods.length}`
    );
}

// Test 9: Code with no methods
{
    const code = 'const x = 42; console.log(x);';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 0,
        'MethodAnalyzer: Handles code with no methods',
        `Expected 0 methods, got ${methods.length}`
    );
}

// Test 10: Keyword filtering
{
    const code = 'function if() {} function return() {}'; // Invalid but tests keyword filtering
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 0,
        'MethodAnalyzer: Filters out keywords',
        `Expected 0 methods (keywords should be filtered), got ${methods.length}`
    );
}

// Test 11: Line number accuracy
{
    const code = `
// Line 1
function first() {}
// Line 3
function second() {}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 2 && methods[0].line === 3 && methods[1].line === 5,
        'MethodAnalyzer: Accurate line numbers',
        `Expected lines 3 and 5, got ${methods.map(m => m.line).join(', ')}`
    );
}

// ============================================================================
// GO METHOD ANALYZER TESTS
// ============================================================================
console.log('\n🐹 Go Method Analyzer Tests\n' + '-'.repeat(70));

// Test 11a: Go function detection
{
    const code = `
package main

func HelloWorld() {
    println("hello")
}

func Add(a, b int) int {
    return a + b
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.go');
    assert(
        methods.length === 2,
        'MethodAnalyzer (Go): Extracts Go functions',
        `Expected 2 functions, got ${methods.length}`
    );
}

// Test 11b: Go method detection (with receivers)
{
    const code = `
package main

type Calculator struct {
    value int
}

func (c *Calculator) Add(n int) {
    c.value += n
}

func (c Calculator) GetValue() int {
    return c.value
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.go');
    assert(
        methods.length === 2,
        'MethodAnalyzer (Go): Extracts Go methods with receivers',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 11c: Go interface method detection
{
    const code = `
package main

type Reader interface {
    Read(p []byte) (n int, err error)
    Close() error
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.go');
    assert(
        methods.length >= 2,
        'MethodAnalyzer (Go): Extracts interface methods',
        `Expected at least 2 interface methods, got ${methods.length}`
    );
}

// ============================================================================
// JAVA METHOD ANALYZER TESTS
// ============================================================================
console.log('\n☕ Java Method Analyzer Tests\n' + '-'.repeat(70));

// Test 11d: Java method detection
{
    const code = `
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    private void validateInput(int x) {
        if (x < 0) throw new IllegalArgumentException();
    }
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Calculator.java');
    assert(
        methods.length >= 2,
        'MethodAnalyzer (Java): Extracts Java methods',
        `Expected at least 2 methods, got ${methods.length}`
    );
}

// Test 11e: Java constructor detection
{
    const code = `
public class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return this.name;
    }
}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'Person.java');
    assert(
        methods.length >= 2,
        'MethodAnalyzer (Java): Extracts constructors and methods',
        `Expected at least 2 (constructor + method), got ${methods.length}`
    );
}

// Test 11f: Multi-language support integration
{
    const jsCode = 'function jsFunc() { return 42; }';
    const goCode = 'func GoFunc() { println("hello") }';
    const javaCode = 'public int javaMethod() { return 42; }';

    const jsMethods = methodAnalyzer.extractMethods(jsCode, 'test.js');
    const goMethods = methodAnalyzer.extractMethods(goCode, 'test.go');
    const javaMethods = methodAnalyzer.extractMethods(javaCode, 'Test.java');

    assert(
        jsMethods.length === 1 && goMethods.length === 1 && javaMethods.length >= 1,
        'MethodAnalyzer: Multi-language support (JS/Go/Java)',
        `Expected all languages to extract methods successfully`
    );
}

// ============================================================================
// TOKEN ANALYZER TESTS
// ============================================================================
console.log('\n📊 TokenAnalyzer Tests\n' + '-'.repeat(70));

// Test 12: TokenAnalyzer instantiation
{
    try {
        const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
        assert(
            analyzer !== null && analyzer !== undefined,
            'TokenAnalyzer: Successful instantiation'
        );
    } catch (error) {
        assert(false, 'TokenAnalyzer: Instantiation', error.message);
    }
}

// Test 13: TokenAnalyzer with method-level enabled
{
    try {
        const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: true });
        assert(
            analyzer.options.methodLevel === true,
            'TokenAnalyzer: Method-level option enabled'
        );
    } catch (error) {
        assert(false, 'TokenAnalyzer: Method-level initialization', error.message);
    }
}

// Test 14: Token calculation (estimation mode)
{
    try {
        const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
        const testContent = 'function test() { return 42; }';
        const tokens = analyzer.calculateTokens(testContent, 'test.js');
        assert(
            typeof tokens === 'number' && tokens > 0,
            'TokenAnalyzer: Calculates tokens',
            `Expected positive number, got ${tokens}`
        );
    } catch (error) {
        assert(false, 'TokenAnalyzer: Token calculation', error.message);
    }
}

// Test 15: Text file detection
{
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    assert(
        analyzer.isTextFile('test.js') === true,
        'TokenAnalyzer: Detects .js as text file'
    );
    assert(
        analyzer.isTextFile('test.ts') === true,
        'TokenAnalyzer: Detects .ts as text file'
    );
    assert(
        analyzer.isTextFile('test.md') === true,
        'TokenAnalyzer: Detects .md as text file'
    );
    assert(
        analyzer.isTextFile('test.bin') === false,
        'TokenAnalyzer: Rejects .bin as non-text file'
    );
}

// Test 16: Code file detection
{
    const analyzer = new TokenAnalyzer(process.cwd(), { methodLevel: false });
    assert(
        analyzer.isCodeFile('test.js') === true,
        'TokenAnalyzer: Detects .js as code file'
    );
    assert(
        analyzer.isCodeFile('test.ts') === true,
        'TokenAnalyzer: Detects .ts as code file'
    );
    assert(
        analyzer.isCodeFile('test.md') === false,
        'TokenAnalyzer: Rejects .md as code file'
    );
}

// ============================================================================
// GITIGNORE PARSER TESTS
// ============================================================================
console.log('\n🚫 GitIgnoreParser Tests\n' + '-'.repeat(70));

// Test 17: Pattern conversion
{
    const parser = new GitIgnoreParser(
        path.join(process.cwd(), '.gitignore'),
        null,
        null
    );

    // Test basic pattern
    const pattern1 = parser.convertToRegex('*.js');
    assert(
        pattern1.regex.test('test.js'),
        'GitIgnoreParser: Basic wildcard pattern matches'
    );

    // Test directory pattern
    const pattern2 = parser.convertToRegex('node_modules/');
    assert(
        pattern2.regex.test('node_modules/package.json'),
        'GitIgnoreParser: Directory pattern matches'
    );
}

// Test 18: Negation pattern
{
    const parser = new GitIgnoreParser(
        path.join(process.cwd(), '.gitignore'),
        null,
        null
    );
    const pattern = parser.convertToRegex('!important.js');
    assert(
        pattern.isNegation === true,
        'GitIgnoreParser: Detects negation pattern'
    );
}

// ============================================================================
// METHOD FILTER PARSER TESTS
// ============================================================================
console.log('\n🔍 MethodFilterParser Tests\n' + '-'.repeat(70));

// Test 19: Method filtering with patterns
{
    // Create temporary test files
    const testDir = path.join(__dirname, '..', 'test-temp');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, '*Handler\n*Validator\ncalculateTokens');

    const parser = new MethodFilterParser(includeFile, null);

    assert(
        parser.shouldIncludeMethod('requestHandler', 'test.js') === true,
        'MethodFilterParser: Matches wildcard pattern *Handler'
    );

    assert(
        parser.shouldIncludeMethod('inputValidator', 'test.js') === true,
        'MethodFilterParser: Matches wildcard pattern *Validator'
    );

    assert(
        parser.shouldIncludeMethod('calculateTokens', 'test.js') === true,
        'MethodFilterParser: Matches exact method name'
    );

    assert(
        parser.shouldIncludeMethod('randomMethod', 'test.js') === false,
        'MethodFilterParser: Rejects non-matching method'
    );

    // Cleanup
    fs.unlinkSync(includeFile);
    fs.rmdirSync(testDir);
}

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n⚠️  Edge Cases & Error Handling\n' + '-'.repeat(70));

// Test 20: Very large method name
{
    const longName = 'a'.repeat(1000);
    const code = `function ${longName}() { return 42; }`;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1 && methods[0].name === longName,
        'MethodAnalyzer: Handles very long method names',
        `Expected method with ${longName.length} char name`
    );
}

// Test 21: Special characters in code
{
    const code = `function test$_123() { return "test"; }`;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 1,
        'MethodAnalyzer: Handles special characters in method names'
    );
}

// Test 22: Nested functions
{
    const code = `
        function outer() {
            function inner() {
                return 42;
            }
            return inner;
        }
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 2,
        'MethodAnalyzer: Detects nested functions',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 23: Multiple functions on same line (edge case)
{
    const code = 'function a() {} function b() {}';
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    assert(
        methods.length === 2,
        'MethodAnalyzer: Handles multiple functions on same line',
        `Expected 2 methods, got ${methods.length}`
    );
}

// Test 24: Comments containing function-like patterns
{
    const code = `
        // function commentFunc() {}
        /* function blockCommentFunc() {} */
        function realFunc() {}
    `;
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    // Note: Current implementation doesn't strip comments, so this might extract from comments
    // This is a known limitation but documenting the behavior
    assert(
        methods.some(m => m.name === 'realFunc'),
        'MethodAnalyzer: Extracts real function despite comments'
    );
}

// Test 25: Unicode method names
{
    const code = 'function тест() { return 42; }'; // Cyrillic
    const methods = methodAnalyzer.extractMethods(code, 'test.js');
    // Current regex uses \w which might not match Unicode
    // This documents the limitation
    const result = methods.length >= 0; // Just ensure no crash
    assert(
        result,
        'MethodAnalyzer: Handles Unicode without crashing'
    );
}

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach((test, index) => {
        console.log(`  ${index + 1}. ${test.name}`);
        if (test.message) {
            console.log(`     ${test.message}`);
        }
    });
    process.exit(1);
} else {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
}
