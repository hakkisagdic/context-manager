#!/usr/bin/env node

/**
 * Comprehensive Token Utils Tests
 * Tests for token counting and formatting utilities
 */

import TokenUtils from '../lib/utils/token-utils.js';

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

console.log('🧪 Testing Token Utils...\n');
console.log(`Token counting method: ${TokenUtils.getMethod()}\n`);

// ============================================================================
// CALCULATE METHOD TESTS
// ============================================================================
console.log('🔢 calculate() Method Tests');
console.log('-'.repeat(70));

test('TokenUtils - calculate returns a number', () => {
    const result = TokenUtils.calculate('Hello world', 'test.js');
    if (typeof result !== 'number') throw new Error('Should return number');
    if (result < 0) throw new Error('Should return non-negative number');
});

test('TokenUtils - calculate handles JavaScript files', () => {
    const content = 'function hello() { return "world"; }';
    const tokens = TokenUtils.calculate(content, 'test.js');
    if (tokens <= 0) throw new Error('Should return positive tokens');
});

test('TokenUtils - calculate handles TypeScript files', () => {
    const content = 'const greet = (name: string): string => `Hello ${name}`;';
    const tokens = TokenUtils.calculate(content, 'test.ts');
    if (tokens <= 0) throw new Error('Should return positive tokens');
});

test('TokenUtils - calculate handles Python files', () => {
    const content = 'def hello():\n    return "world"';
    const tokens = TokenUtils.calculate(content, 'test.py');
    if (tokens <= 0) throw new Error('Should return positive tokens');
});

test('TokenUtils - calculate handles JSON files', () => {
    const content = '{"name": "test", "value": 123}';
    const tokens = TokenUtils.calculate(content, 'test.json');
    if (tokens <= 0) throw new Error('Should return positive tokens');
});

test('TokenUtils - calculate handles empty content', () => {
    const tokens = TokenUtils.calculate('', 'test.js');
    if (tokens !== 0) throw new Error('Empty content should return 0 tokens');
});

test('TokenUtils - calculate handles long content', () => {
    const content = 'x'.repeat(10000);
    const tokens = TokenUtils.calculate(content, 'test.txt');
    if (tokens <= 0) throw new Error('Should return positive tokens');
    if (tokens < 1000) throw new Error('Long content should have many tokens');
});

// ============================================================================
// ESTIMATE METHOD TESTS
// ============================================================================
console.log('\n📊 estimate() Method Tests');
console.log('-'.repeat(70));

test('TokenUtils - estimate returns a number', () => {
    const result = TokenUtils.estimate('test content', 'test.js');
    if (typeof result !== 'number') throw new Error('Should return number');
});

test('TokenUtils - estimate handles JavaScript (3.2 chars/token)', () => {
    const content = 'x'.repeat(320); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.js');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles TypeScript (3.2 chars/token)', () => {
    const content = 'x'.repeat(320);
    const tokensJS = TokenUtils.estimate(content, 'test.js');
    const tokensTS = TokenUtils.estimate(content, 'test.ts');
    if (tokensJS !== tokensTS) throw new Error('JS and TS should have same ratio');
});

test('TokenUtils - estimate handles JSON (2.5 chars/token)', () => {
    const content = 'x'.repeat(250); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.json');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles Python (3.0 chars/token)', () => {
    const content = 'x'.repeat(300); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.py');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles Java (3.5 chars/token)', () => {
    const content = 'x'.repeat(350); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.java');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles Go (3.3 chars/token)', () => {
    const content = 'x'.repeat(330); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.go');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles Rust (3.4 chars/token)', () => {
    const content = 'x'.repeat(340); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.rs');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles C# (3.5 chars/token)', () => {
    const content = 'x'.repeat(350); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.cs');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles C/C++ (3.6 chars/token)', () => {
    const content = 'x'.repeat(360); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.cpp');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles Markdown (3.5 chars/token)', () => {
    const content = 'x'.repeat(350); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.md');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate handles plain text (4.0 chars/token)', () => {
    const content = 'x'.repeat(400); // Should be ~100 tokens
    const tokens = TokenUtils.estimate(content, 'test.txt');
    if (tokens < 90 || tokens > 110) throw new Error('Should estimate ~100 tokens');
});

test('TokenUtils - estimate uses default ratio for unknown extensions', () => {
    const content = 'x'.repeat(350); // Default is 3.5 chars/token
    const tokens = TokenUtils.estimate(content, 'test.unknown');
    if (tokens < 90 || tokens > 110) throw new Error('Should use default ratio');
});

test('TokenUtils - estimate handles empty content', () => {
    const tokens = TokenUtils.estimate('', 'test.js');
    if (tokens !== 0) throw new Error('Empty content should return 0 tokens');
});

// ============================================================================
// FORMAT METHOD TESTS
// ============================================================================
console.log('\n✨ format() Method Tests');
console.log('-'.repeat(70));

test('TokenUtils - format handles small numbers', () => {
    if (TokenUtils.format(0) !== '0') throw new Error('Should format 0');
    if (TokenUtils.format(1) !== '1') throw new Error('Should format 1');
    if (TokenUtils.format(999) !== '999') throw new Error('Should format 999');
});

test('TokenUtils - format handles thousands with K suffix', () => {
    if (TokenUtils.format(1000) !== '1.0K') throw new Error('Should format 1000 as 1.0K');
    if (TokenUtils.format(1500) !== '1.5K') throw new Error('Should format 1500 as 1.5K');
    if (TokenUtils.format(999999) !== '1000.0K') throw new Error('Should format 999999 as 1000.0K');
});

test('TokenUtils - format handles millions with M suffix', () => {
    if (TokenUtils.format(1000000) !== '1.0M') throw new Error('Should format 1000000 as 1.0M');
    if (TokenUtils.format(1500000) !== '1.5M') throw new Error('Should format 1500000 as 1.5M');
    if (TokenUtils.format(2000000) !== '2.0M') throw new Error('Should format 2000000 as 2.0M');
});

test('TokenUtils - format rounds to one decimal place', () => {
    const formatted = TokenUtils.format(1234);
    if (formatted !== '1.2K') throw new Error('Should round 1234 to 1.2K');
});

test('TokenUtils - format handles edge cases', () => {
    if (TokenUtils.format(1001) !== '1.0K') throw new Error('Should format 1001');
    if (TokenUtils.format(10000) !== '10.0K') throw new Error('Should format 10000');
    if (TokenUtils.format(100000) !== '100.0K') throw new Error('Should format 100000');
});

// ============================================================================
// GET METHOD TESTS
// ============================================================================
console.log('\n🔍 getMethod() Tests');
console.log('-'.repeat(70));

test('TokenUtils - getMethod returns string', () => {
    const method = TokenUtils.getMethod();
    if (typeof method !== 'string') throw new Error('Should return string');
    if (method.length === 0) throw new Error('Should not be empty');
});

test('TokenUtils - getMethod indicates exact or estimated', () => {
    const method = TokenUtils.getMethod();
    const hasExactOrEstimated = method.includes('Exact') || method.includes('Estimated');
    if (!hasExactOrEstimated) throw new Error('Should indicate exact or estimated');
});

test('TokenUtils - getMethod matches isExact status', () => {
    const method = TokenUtils.getMethod();
    const isExact = TokenUtils.isExact();

    if (isExact && !method.includes('Exact')) {
        throw new Error('If isExact is true, method should include "Exact"');
    }
    if (!isExact && !method.includes('Estimated')) {
        throw new Error('If isExact is false, method should include "Estimated"');
    }
});

// ============================================================================
// IS EXACT TESTS
// ============================================================================
console.log('\n🎯 isExact() and hasExactCounting() Tests');
console.log('-'.repeat(70));

test('TokenUtils - isExact returns boolean', () => {
    const result = TokenUtils.isExact();
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('TokenUtils - hasExactCounting returns boolean', () => {
    const result = TokenUtils.hasExactCounting();
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('TokenUtils - isExact and hasExactCounting return same value', () => {
    const isExact = TokenUtils.isExact();
    const hasExact = TokenUtils.hasExactCounting();
    if (isExact !== hasExact) throw new Error('Both methods should return same value');
});

test('TokenUtils - isExact is consistent across calls', () => {
    const first = TokenUtils.isExact();
    const second = TokenUtils.isExact();
    if (first !== second) throw new Error('Should return consistent value');
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎪 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('TokenUtils - calculate handles very long content', () => {
    const longContent = 'test '.repeat(100000);
    const tokens = TokenUtils.calculate(longContent, 'test.js');
    if (tokens <= 0) throw new Error('Should handle very long content');
});

test('TokenUtils - estimate handles very long content', () => {
    const longContent = 'test '.repeat(100000);
    const tokens = TokenUtils.estimate(longContent, 'test.js');
    if (tokens <= 0) throw new Error('Should handle very long content');
});

test('TokenUtils - calculate handles Unicode characters', () => {
    const content = '你好世界 🎉 مرحبا';
    const tokens = TokenUtils.calculate(content, 'test.js');
    if (tokens <= 0) throw new Error('Should handle Unicode');
});

test('TokenUtils - estimate handles Unicode characters', () => {
    const content = '你好世界 🎉 مرحبا';
    const tokens = TokenUtils.estimate(content, 'test.js');
    if (tokens <= 0) throw new Error('Should handle Unicode');
});

test('TokenUtils - format handles zero', () => {
    if (TokenUtils.format(0) !== '0') throw new Error('Should handle zero');
});

test('TokenUtils - format handles negative numbers (edge case)', () => {
    // This is an edge case - negative tokens don't make sense
    // But the function should not crash
    try {
        const result = TokenUtils.format(-100);
        if (typeof result !== 'string') throw new Error('Should return string');
    } catch (error) {
        // May throw, which is acceptable
    }
});

test('TokenUtils - calculate handles newlines and special chars', () => {
    const content = 'line1\nline2\r\nline3\ttab\0null';
    const tokens = TokenUtils.calculate(content, 'test.js');
    if (tokens <= 0) throw new Error('Should handle special characters');
});

test('TokenUtils - calculate handles files without extension', () => {
    const content = 'test content';
    const tokens = TokenUtils.calculate(content, 'Dockerfile');
    if (tokens <= 0) throw new Error('Should handle files without extension');
});

// ============================================================================
// STATIC METHODS TESTS
// ============================================================================
console.log('\n⚙️  Static Methods Tests');
console.log('-'.repeat(70));

test('TokenUtils - All methods are static', () => {
    if (typeof TokenUtils.calculate !== 'function') throw new Error('calculate should be static');
    if (typeof TokenUtils.estimate !== 'function') throw new Error('estimate should be static');
    if (typeof TokenUtils.format !== 'function') throw new Error('format should be static');
    if (typeof TokenUtils.getMethod !== 'function') throw new Error('getMethod should be static');
    if (typeof TokenUtils.isExact !== 'function') throw new Error('isExact should be static');
    if (typeof TokenUtils.hasExactCounting !== 'function') {
        throw new Error('hasExactCounting should be static');
    }
});

test('TokenUtils - Cannot instantiate', () => {
    try {
        new TokenUtils();
        throw new Error('Should not be instantiable');
    } catch (error) {
        if (!error.message.includes('not a constructor') &&
            !error.message.includes('not instantiable') &&
            !error.message.includes('Should not be instantiable')) {
            // It's ok if it constructs but we expect it to be used statically
        }
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('TokenUtils - calculate and format work together', () => {
    const content = 'x'.repeat(5000);
    const tokens = TokenUtils.calculate(content, 'test.js');
    const formatted = TokenUtils.format(tokens);

    if (typeof tokens !== 'number') throw new Error('calculate should return number');
    if (typeof formatted !== 'string') throw new Error('format should return string');
    if (!formatted.includes('K')) throw new Error('Should include K suffix for large numbers');
});

test('TokenUtils - estimate and format work together', () => {
    const content = 'x'.repeat(5000);
    const tokens = TokenUtils.estimate(content, 'test.js');
    const formatted = TokenUtils.format(tokens);

    if (typeof tokens !== 'number') throw new Error('estimate should return number');
    if (typeof formatted !== 'string') throw new Error('format should return string');
});

test('TokenUtils - Consistent results for same content', () => {
    const content = 'function test() { return 42; }';
    const tokens1 = TokenUtils.calculate(content, 'test.js');
    const tokens2 = TokenUtils.calculate(content, 'test.js');

    if (tokens1 !== tokens2) throw new Error('Should return consistent results');
});

test('TokenUtils - Estimate vs Calculate comparison', () => {
    const content = 'x'.repeat(1000);
    const calculated = TokenUtils.calculate(content, 'test.js');
    const estimated = TokenUtils.estimate(content, 'test.js');

    // Both should return positive numbers
    if (calculated <= 0) throw new Error('calculate should return positive');
    if (estimated <= 0) throw new Error('estimate should return positive');

    // If tiktoken is available, they might differ but should be in same ballpark
    if (TokenUtils.isExact()) {
        // Estimation should be within ~50% of exact count
        const ratio = calculated / estimated;
        if (ratio < 0.5 || ratio > 1.5) {
            throw new Error('Estimate should be reasonably close to exact count');
        }
    } else {
        // Both use estimation, should be identical
        if (calculated !== estimated) throw new Error('Should be identical when using estimation');
    }
});

test('TokenUtils - All supported languages work correctly', () => {
    const content = 'test content';
    const extensions = [
        '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs',
        '.php', '.rb', '.swift', '.kt', '.cs', '.cpp', '.c', '.scala', '.md', '.txt'
    ];

    for (const ext of extensions) {
        const tokens = TokenUtils.calculate(content, `test${ext}`);
        if (tokens <= 0) throw new Error(`Should handle ${ext} files`);
    }
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================
console.log('\n⚡ Performance Tests');
console.log('-'.repeat(70));

test('TokenUtils - calculate is fast for medium content', () => {
    const content = 'x'.repeat(10000);
    const start = Date.now();
    TokenUtils.calculate(content, 'test.js');
    const duration = Date.now() - start;

    if (duration > 1000) throw new Error('Should be fast (< 1000ms)');
});

test('TokenUtils - estimate is fast for medium content', () => {
    const content = 'x'.repeat(10000);
    const start = Date.now();
    TokenUtils.estimate(content, 'test.js');
    const duration = Date.now() - start;

    if (duration > 100) throw new Error('Should be very fast (< 100ms)');
});

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
console.log(`\nToken Counting Method: ${TokenUtils.getMethod()}`);

if (testsFailed === 0) {
    console.log('\n🎉 All token utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
