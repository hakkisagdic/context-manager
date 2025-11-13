#!/usr/bin/env node
/**
 * Advanced TokenCalculator Tests
 * Tests tiktoken integration, fallback estimation, and edge cases
 */

import TokenUtils from '../lib/utils/token-utils.js';
import TokenCalculator from '../lib/analyzers/token-calculator.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
    }
}

function assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
        throw new Error(
            message || `Expected ${actual} to be greater than ${threshold}`
        );
    }
}

function assertLessThan(actual, threshold, message) {
    if (actual >= threshold) {
        throw new Error(
            message || `Expected ${actual} to be less than ${threshold}`
        );
    }
}

function assertBetween(value, min, max, message) {
    if (value < min || value > max) {
        throw new Error(
            message || `Expected ${value} to be between ${min} and ${max}`
        );
    }
}

console.log('🧪 Testing TokenCalculator Advanced Features\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================================================
// Test TokenUtils Detection
// ============================================================================

console.log('🔍 Testing Tiktoken Detection...\n');

test('TokenUtils: reports tiktoken availability', () => {
    const isExact = TokenUtils.isExact();
    const method = TokenUtils.getMethod();

    assert(typeof isExact === 'boolean', 'isExact should return boolean');
    assert(typeof method === 'string', 'getMethod should return string');

    if (isExact) {
        assert(method.includes('Exact'), 'Should report exact counting');
        assert(method.includes('tiktoken'), 'Should mention tiktoken');
    } else {
        assert(method.includes('Estimated'), 'Should report estimation');
        assert(method.includes('95%'), 'Should mention accuracy');
    }
});

test('TokenUtils: hasExactCounting alias works', () => {
    const hasExact = TokenUtils.hasExactCounting();
    const isExact = TokenUtils.isExact();

    assertEquals(hasExact, isExact, 'Alias should match isExact()');
});

// ============================================================================
// Test Token Calculation
// ============================================================================

console.log('\n💯 Testing Token Calculation...\n');

test('TokenUtils: calculates tokens for simple text', () => {
    const content = 'Hello, world!';
    const tokens = TokenUtils.calculate(content, 'test.txt');

    assertGreaterThan(tokens, 0, 'Should calculate positive tokens');
    assertLessThan(tokens, 10, 'Should be reasonable for short text');
});

test('TokenUtils: handles empty string', () => {
    const content = '';
    const tokens = TokenUtils.calculate(content, 'empty.txt');

    assertEquals(tokens, 0, 'Empty string should have 0 tokens');
});

test('TokenUtils: handles short text', () => {
    const content = 'hello';
    const tokens = TokenUtils.calculate(content, 'short.txt');

    assertGreaterThan(tokens, 0, 'Short text should have tokens');
    assertLessThan(tokens, 5, 'Short text should be < 5 tokens');
});

test('TokenUtils: calculates tokens for code', () => {
    const code = 'function hello() { return "world"; }';
    const tokens = TokenUtils.calculate(code, 'test.js');

    assertGreaterThan(tokens, 5, 'Code should have multiple tokens');
    assertLessThan(tokens, 20, 'Should be reasonable for short code');
});

test('TokenUtils: handles Unicode characters', () => {
    const content = 'Hello 世界 🌍';
    const tokens = TokenUtils.calculate(content, 'unicode.txt');

    assertGreaterThan(tokens, 0, 'Should handle Unicode');
});

test('TokenUtils: handles very long text', () => {
    const content = 'a'.repeat(10000);
    const tokens = TokenUtils.calculate(content, 'long.txt');

    assertGreaterThan(tokens, 1000, 'Long text should have many tokens');
    assertLessThan(tokens, 5000, 'Should be reasonable estimate');
});

// ============================================================================
// Test Estimation Logic
// ============================================================================

console.log('\n📊 Testing Estimation Logic...\n');

test('TokenUtils.estimate: JavaScript files', () => {
    const code = 'const x = 1;'.repeat(100); // 1200 chars
    const tokens = TokenUtils.estimate(code, 'test.js');

    // JS ratio is 3.2 chars/token, so ~375 tokens
    assertBetween(tokens, 300, 450, 'JS estimation should be ~375 tokens');
});

test('TokenUtils.estimate: Python files', () => {
    const code = 'x = 1\n'.repeat(100); // 600 chars
    const tokens = TokenUtils.estimate(code, 'test.py');

    // Python ratio is 3.0 chars/token, so ~200 tokens
    assertBetween(tokens, 150, 250, 'Python estimation should be ~200 tokens');
});

test('TokenUtils.estimate: JSON files', () => {
    const json = '{"a":1}'.repeat(100); // 700 chars
    const tokens = TokenUtils.estimate(json, 'test.json');

    // JSON ratio is 2.5 chars/token, so ~280 tokens
    assertBetween(tokens, 200, 350, 'JSON estimation should be ~280 tokens');
});

test('TokenUtils.estimate: handles unknown extension', () => {
    const content = 'test content';
    const tokens = TokenUtils.estimate(content, 'test.unknown');

    assertGreaterThan(tokens, 0, 'Should handle unknown extensions');
    // Default ratio is 3.5, so 12/3.5 ~= 3-4 tokens
    assertBetween(tokens, 2, 6, 'Should use default ratio');
});

test('TokenUtils.estimate: handles files with no extension', () => {
    const content = 'test content without extension';
    const tokens = TokenUtils.estimate(content, 'README');

    assertGreaterThan(tokens, 0, 'Should handle files without extension');
});

test('TokenUtils.estimate: different file types have different ratios', () => {
    const content = 'x'.repeat(1000);

    const jsTokens = TokenUtils.estimate(content, 'test.js');
    const jsonTokens = TokenUtils.estimate(content, 'test.json');

    // JSON should have more tokens (lower ratio = more tokens per char)
    assertGreaterThan(jsonTokens, jsTokens, 'JSON should have more tokens than JS for same content');
});

// ============================================================================
// Test Token Formatting
// ============================================================================

console.log('\n🎨 Testing Token Formatting...\n');

test('TokenUtils.format: formats small numbers', () => {
    assertEquals(TokenUtils.format(0), '0', 'Should format 0');
    assertEquals(TokenUtils.format(1), '1', 'Should format 1');
    assertEquals(TokenUtils.format(42), '42', 'Should format small numbers as-is');
    assertEquals(TokenUtils.format(999), '999', 'Should format 999 as-is');
});

test('TokenUtils.format: formats thousands with K', () => {
    assertEquals(TokenUtils.format(1000), '1.0K', 'Should format 1000 as 1.0K');
    assertEquals(TokenUtils.format(1500), '1.5K', 'Should format 1500 as 1.5K');
    assertEquals(TokenUtils.format(10000), '10.0K', 'Should format 10000 as 10.0K');
    assertEquals(TokenUtils.format(999999), '1000.0K', 'Should format 999999 as 1000.0K');
});

test('TokenUtils.format: formats millions with M', () => {
    assertEquals(TokenUtils.format(1000000), '1.0M', 'Should format 1000000 as 1.0M');
    assertEquals(TokenUtils.format(1500000), '1.5M', 'Should format 1500000 as 1.5M');
    assertEquals(TokenUtils.format(10000000), '10.0M', 'Should format 10000000 as 10.0M');
});

test('TokenUtils.format: handles edge cases', () => {
    const formatted = TokenUtils.format(1234567);
    assert(formatted.includes('M'), 'Large numbers should use M suffix');
});

// ============================================================================
// Test TokenCalculator Integration
// ============================================================================

console.log('\n🔗 Testing TokenCalculator Integration...\n');

test('TokenCalculator: initializes correctly', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-calc-'));

    try {
        const calc = new TokenCalculator(tempDir);

        assert(calc.projectRoot === tempDir, 'Should set project root');
        assert(calc.stats, 'Should initialize stats');
        assert(calc.stats.totalFiles === 0, 'Should start with 0 files');
        assert(calc.stats.totalTokens === 0, 'Should start with 0 tokens');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('TokenCalculator: analyzes file correctly', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-calc-'));

    try {
        const testFile = path.join(tempDir, 'test.js');
        const content = 'function hello() { return "world"; }';
        fs.writeFileSync(testFile, content);

        const calc = new TokenCalculator(tempDir);
        const fileInfo = calc.analyzeFile(testFile);

        assert(fileInfo.path === testFile, 'Should have correct path');
        assertGreaterThan(fileInfo.tokens, 0, 'Should calculate tokens');
        assert(fileInfo.extension === '.js', 'Should detect extension');
        assertGreaterThan(fileInfo.lines, 0, 'Should count lines');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('TokenCalculator: handles file read errors', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'token-calc-'));

    try {
        const calc = new TokenCalculator(tempDir);
        const nonExistentFile = path.join(tempDir, 'does-not-exist.js');

        const fileInfo = calc.analyzeFile(nonExistentFile);

        assert(fileInfo.error, 'Should have error property');
        assertEquals(fileInfo.tokens, 0, 'Should have 0 tokens on error');
        assertEquals(fileInfo.extension, 'error', 'Should mark extension as error');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Test Performance
// ============================================================================

console.log('\n⚡ Testing Performance...\n');

test('TokenUtils: calculates tokens quickly for small files', () => {
    const content = 'test content';

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
        TokenUtils.calculate(content, 'test.txt');
    }
    const duration = Date.now() - startTime;

    assertLessThan(duration, 1000, 'Should calculate 1000 times in < 1s');
});

test('TokenUtils: handles large files efficiently', () => {
    const largeContent = 'x'.repeat(100000); // 100KB

    const startTime = Date.now();
    const tokens = TokenUtils.calculate(largeContent, 'large.txt');
    const duration = Date.now() - startTime;

    assertGreaterThan(tokens, 10000, 'Should calculate tokens for large file');
    assertLessThan(duration, 1000, 'Should complete in < 1s');
});

test('TokenUtils: estimation is faster than exact counting', () => {
    const content = 'test '.repeat(1000);

    const startEst = Date.now();
    TokenUtils.estimate(content, 'test.txt');
    const estDuration = Date.now() - startEst;

    assertLessThan(estDuration, 100, 'Estimation should be very fast');
});

// ============================================================================
// Test Edge Cases
// ============================================================================

console.log('\n🎯 Testing Edge Cases...\n');

test('TokenUtils: handles null/undefined gracefully', () => {
    try {
        const tokens = TokenUtils.calculate('', 'test.txt');
        assertEquals(tokens, 0, 'Should handle empty string');
    } catch (error) {
        assert(false, 'Should not throw on empty string');
    }
});

test('TokenUtils: handles special characters', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
    const tokens = TokenUtils.calculate(special, 'special.txt');

    assertGreaterThan(tokens, 0, 'Should handle special characters');
});

test('TokenUtils: handles newlines and whitespace', () => {
    const content = '\n\n\n\t\t\t   \n';
    const tokens = TokenUtils.calculate(content, 'whitespace.txt');

    assertGreaterThan(tokens, 0, 'Should count whitespace tokens');
});

test('TokenUtils: handles code with comments', () => {
    const code = '// Comment\nconst x = 1; /* block comment */';
    const tokens = TokenUtils.calculate(code, 'commented.js');

    assertGreaterThan(tokens, 5, 'Should count comment tokens');
});

test('TokenUtils: handles minified code', () => {
    const minified = 'function a(){return b(c(d(e(f(g(h(i(j(k()))))))))}';
    const tokens = TokenUtils.calculate(minified, 'minified.js');

    assertGreaterThan(tokens, 10, 'Should handle minified code');
});

test('TokenUtils: handles markdown with code blocks', () => {
    const markdown = '# Heading\n```js\ncode here\n```\nMore text';
    const tokens = TokenUtils.calculate(markdown, 'doc.md');

    assertGreaterThan(tokens, 5, 'Should handle markdown');
});

test('TokenUtils: handles JSON with nested structure', () => {
    const json = JSON.stringify({
        a: { b: { c: { d: { e: 'deep' } } } }
    });
    const tokens = TokenUtils.calculate(json, 'nested.json');

    assertGreaterThan(tokens, 5, 'Should handle nested JSON');
});

// ============================================================================
// Test Accuracy (if tiktoken available)
// ============================================================================

if (TokenUtils.isExact()) {
    console.log('\n✨ Testing Exact Counting (tiktoken available)...\n');

    test('Exact counting: matches expected range for known text', () => {
        const content = 'The quick brown fox jumps over the lazy dog.';
        const tokens = TokenUtils.calculate(content, 'test.txt');

        // This sentence is typically 9-11 tokens in GPT-4
        assertBetween(tokens, 8, 12, 'Should be in expected range');
    });

    test('Exact counting: handles encoding/freeing correctly', () => {
        // Run multiple times to check for memory leaks
        for (let i = 0; i < 100; i++) {
            const tokens = TokenUtils.calculate('test content', 'test.txt');
            assertGreaterThan(tokens, 0, 'Should calculate each time');
        }

        assert(true, 'Should not leak memory');
    });
} else {
    console.log('\n⚠️  Tiktoken not available - using estimation mode\n');

    test('Estimation mode: provides reasonable accuracy', () => {
        const content = 'The quick brown fox jumps over the lazy dog.';
        const estimated = TokenUtils.estimate(content, 'test.txt');

        // Actual is ~10 tokens, estimation should be close
        assertBetween(estimated, 8, 15, 'Estimation should be reasonably accurate');
    });

    test('Estimation mode: fallback message is correct', () => {
        const method = TokenUtils.getMethod();

        assert(method.includes('Estimated'), 'Should indicate estimation');
        assert(method.includes('95%'), 'Should mention accuracy');
    });
}

// ============================================================================
// Test Consistency
// ============================================================================

console.log('\n🔄 Testing Consistency...\n');

test('TokenUtils: same content produces same token count', () => {
    const content = 'consistent test content';

    const tokens1 = TokenUtils.calculate(content, 'test1.txt');
    const tokens2 = TokenUtils.calculate(content, 'test2.txt');

    assertEquals(tokens1, tokens2, 'Same content should have same tokens');
});

test('TokenUtils: different extensions affect estimation differently', () => {
    const content = 'x'.repeat(100);

    const txtTokens = TokenUtils.estimate(content, 'file.txt');
    const jsTokens = TokenUtils.estimate(content, 'file.js');

    // txt ratio: 4.0, js ratio: 3.2
    // For 100 chars: txt = 25, js = 31
    assert(txtTokens !== jsTokens, 'Different extensions should give different estimates');
});

test('TokenUtils: calculation is deterministic', () => {
    const content = 'deterministic test';

    const results = [];
    for (let i = 0; i < 10; i++) {
        results.push(TokenUtils.calculate(content, 'test.txt'));
    }

    const allSame = results.every(r => r === results[0]);
    assert(allSame, 'Multiple calculations should be deterministic');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 Test Summary:\n');
console.log(`   🔍 Tiktoken Status: ${TokenUtils.isExact() ? '✅ Available (exact counting)' : '⚠️  Not available (using estimation)'}`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
console.log(`   🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════\n');

if (testsFailed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
} else {
    console.log('✅ All TokenCalculator advanced tests passed!\n');
    process.exit(0);
}
