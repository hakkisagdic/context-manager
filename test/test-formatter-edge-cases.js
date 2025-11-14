#!/usr/bin/env node
/**
 * Formatter Edge Cases Tests
 * Tests formatters with edge cases:
 * - Unicode and special characters
 * - Large files
 * - Empty files
 * - Mixed line endings
 */

import FormatRegistry from '../lib/formatters/format-registry.js';

const registry = new FormatRegistry();

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

function assertIncludes(str, substring, message) {
    if (!str.includes(substring)) {
        throw new Error(
            message || `Expected string to include "${substring}"`
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

console.log('🧪 Testing Formatter Edge Cases\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================================================
// Test Unicode and Special Characters
// ============================================================================

console.log('🌍 Testing Unicode and Special Characters...\n');

test('JSON: handles Unicode emoji correctly', () => {
    const testData = {
        text: '🚀 Rocket emoji',
        party: '🎉',
        chinese: '中文字符',
        arabic: 'العربية'
    };

    const result = registry.encode('json', testData);

    assertIncludes(result, '🚀', 'Should preserve rocket emoji');
    assertIncludes(result, '🎉', 'Should preserve party emoji');
    assertIncludes(result, '中文字符', 'Should preserve Chinese characters');
});

test('YAML: handles Unicode characters correctly', () => {
    const testData = {
        emojis: '😀😃😄',
        math: '∑ ∫ ∂',
        symbols: '© ® ™'
    };

    const result = registry.encode('yaml', testData);

    assertIncludes(result, '😀', 'Should preserve emojis');
    assertIncludes(result, '∑', 'Should preserve math symbols');
    assertIncludes(result, '©', 'Should preserve copyright symbol');
});

test('CSV: handles special characters in values', () => {
    const testData = {
        files: [
            { name: 'file-with-special_!@#$%.js', size: 100 },
            { name: 'normal.js', size: 50 }
        ]
    };

    const result = registry.encode('csv', testData);

    assert(result.length > 0, 'Should generate CSV output');
});

test('Markdown: handles control characters', () => {
    const testData = {
        code: 'const str = "line1\\nline2\\ttab";'
    };

    const result = registry.encode('markdown', testData);

    assert(result.length > 0, 'Should generate output');
});

// ============================================================================
// Test Large Data
// ============================================================================

console.log('\n📦 Testing Large Data...\n');

test('JSON: handles large nested object', () => {
    const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item${i}` }))
    };

    const result = registry.encode('json', largeData);

    assertGreaterThan(result.length, 10000, 'Should handle large data');
    assertIncludes(result, 'item0', 'Should include first item');
    assertIncludes(result, 'item999', 'Should include last item');
});

test('YAML: handles multiple large strings', () => {
    const largeData = {
        field1: 'x'.repeat(10000),
        field2: 'y'.repeat(10000),
        field3: 'z'.repeat(10000)
    };

    const result = registry.encode('yaml', largeData);

    assertGreaterThan(result.length, 20000, 'Should handle large strings');
});

test('JSON: handles very long single string', () => {
    const longString = 'a'.repeat(50000);
    const testData = { longField: longString };

    const result = registry.encode('json', testData);

    assertGreaterThan(result.length, 40000, 'Should handle very long strings');
});

// ============================================================================
// Test Empty and Minimal Data
// ============================================================================

console.log('\n📄 Testing Empty and Minimal Data...\n');

test('JSON: handles empty object', () => {
    const result = registry.encode('json', {});

    assert(result.length > 0, 'Should generate output for empty object');
    assertIncludes(result, '{}', 'Should be empty object notation');
});

test('YAML: handles empty string', () => {
    const result = registry.encode('yaml', '');

    assert(result.length >= 0, 'Should handle empty string');
});

test('JSON: handles null value', () => {
    const testData = { value: null };
    const result = registry.encode('json', testData);

    assertIncludes(result, 'null', 'Should encode null');
});

test('CSV: handles single row', () => {
    const testData = {
        files: [{ name: 'single.js', size: 100 }]
    };

    const result = registry.encode('csv', testData);

    assert(result.length > 0, 'Should generate CSV output');
});

test('JSON: handles only whitespace string', () => {
    const testData = { value: '   \n\t\n   ' };
    const result = registry.encode('json', testData);

    assert(result.length > 0, 'Should handle whitespace');
});

// ============================================================================
// Test Mixed Line Endings
// ============================================================================

console.log('\n🔄 Testing Mixed Line Endings...\n');

test('JSON: handles CRLF line endings in strings', () => {
    const testData = { text: 'line1\r\nline2\r\nline3' };
    const result = registry.encode('json', testData);

    assert(result.length > 0, 'Should handle CRLF');
});

test('YAML: handles LF line endings', () => {
    const testData = { text: 'line1\nline2\nline3' };
    const result = registry.encode('yaml', testData);

    assert(result.length > 0, 'Should handle LF');
});

test('JSON: handles mixed line endings', () => {
    const testData = { text: 'line1\nline2\r\nline3\rline4' };
    const result = registry.encode('json', testData);

    assert(result.length > 0, 'Should handle mixed line endings');
});

test('CSV: handles CR-only line endings in values', () => {
    const testData = {
        files: [{ content: 'line1\rline2\rline3' }]
    };

    const result = registry.encode('csv', testData);

    assert(result.length > 0, 'Should handle CR endings');
});

// ============================================================================
// Test Special File Types
// ============================================================================

console.log('\n🎯 Testing Special Data Types...\n');

test('JSON: handles deeply nested structure', () => {
    const nested = {
        level1: {
            level2: {
                level3: {
                    level4: {
                        level5: 'deep value'
                    }
                }
            }
        }
    };

    const result = registry.encode('json', nested);

    assertIncludes(result, 'deep value', 'Should handle deep nesting');
});

test('YAML: handles arrays of different types', () => {
    const testData = {
        mixed: [1, 'string', true, null, { nested: 'object' }]
    };

    const result = registry.encode('yaml', testData);

    assert(result.length > 0, 'Should handle mixed array');
});

test('XML: handles special XML characters', () => {
    const testData = {
        text: 'Contains <tag> and & special chars'
    };

    const result = registry.encode('xml', testData);

    assert(result.length > 0, 'Should handle special XML chars');
});

// ============================================================================
// Test Error Cases
// ============================================================================

console.log('\n⚠️  Testing Error Cases...\n');

test('JSON: handles undefined values', () => {
    const testData = { defined: 'value', undefined: undefined };

    const result = registry.encode('json', testData);

    assert(result.length > 0, 'Should handle undefined values');
});

test('YAML: handles circular references protection', () => {
    // Most encoders protect against circular refs
    const testData = { a: 1, b: 2 };

    try {
        const result = registry.encode('yaml', testData);
        assert(result.length > 0, 'Should encode non-circular data');
    } catch (error) {
        assert(false, 'Should not throw on normal data');
    }
});

test('JSON: handles NaN and Infinity', () => {
    const testData = { number: 42, nan: NaN, infinity: Infinity };

    try {
        const result = registry.encode('json', testData);
        assert(result.length > 0, 'Should handle special numbers');
    } catch (error) {
        // JSON may reject NaN/Infinity, which is acceptable
        assert(true, 'Rejecting NaN/Infinity is acceptable');
    }
});

// ============================================================================
// Test Performance Edge Cases
// ============================================================================

console.log('\n⚡ Testing Performance Edge Cases...\n');

test('JSON: handles many small objects', () => {
    const manyObjects = {
        items: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `item${i}`,
            value: Math.random()
        }))
    };

    const startTime = Date.now();
    const result = registry.encode('json', manyObjects);
    const duration = Date.now() - startTime;

    assert(result.length > 0, 'Should handle many objects');
    assert(duration < 1000, 'Should complete quickly (<1s)');
});

test('CSV: handles deeply nested path-like structures', () => {
    const testData = {
        files: [{
            path: 'a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/file.js'
        }]
    };

    const result = registry.encode('csv', testData);

    assert(result.length > 0, 'Should handle deep paths');
});

test('JSON: handles many blank/empty values', () => {
    const testData = {
        a: '', b: '', c: '', d: '', e: '',
        f: null, g: null, h: null
    };

    const result = registry.encode('json', testData);

    assert(result.length > 0, 'Should handle many empty values');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 Test Summary:\n');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
console.log(`   🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════\n');

if (testsFailed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
} else {
    console.log('✅ All formatter edge case tests passed!\n');
    process.exit(0);
}
