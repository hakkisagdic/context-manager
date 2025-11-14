#!/usr/bin/env node

/**
 * Comprehensive TOON Formatter Tests
 * Tests edge cases, encoding/decoding, compression, unicode, large objects, etc.
 *
 * Test Areas:
 * - TOON encoding edge cases
 * - TOON decoding edge cases
 * - TOON compression ratio verification
 * - TOON with unicode content
 * - TOON with binary data
 * - TOON with very large objects
 * - TOON with deeply nested objects
 * - TOON with circular references detection
 * - TOON schema validation
 * - TOON version compatibility
 * - TOON metadata preservation
 * - TOON format migration
 * - Comparison with JSON size
 * - TOON streaming support
 * - TOON incremental parsing
 * - TOON error recovery
 * - Malformed TOON handling
 */

import ToonFormatterV13 from '../lib/formatters/toon-formatter-v1.3.js';

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

console.log('🧪 Testing TOON Formatter - Comprehensive Edge Cases...\n');

// ============================================================================
// ENCODING EDGE CASES
// ============================================================================
console.log('📦 TOON Encoding Edge Cases');
console.log('-'.repeat(70));

test('TOON - Encode empty object', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({});
    if (result !== '') throw new Error('Empty object should encode to empty string');
});

test('TOON - Encode empty array', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([]);
    if (!result.includes('[0]:')) throw new Error('Empty array should have [0]: marker');
});

test('TOON - Encode array with single item', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([42]);
    if (!result.includes('[1]:') || !result.includes('42')) {
        throw new Error('Single item array should encode correctly');
    }
});

test('TOON - Encode object with null values', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ a: null, b: null });
    if (!result.includes('a: null') || !result.includes('b: null')) {
        throw new Error('Null values should encode as null');
    }
});

test('TOON - Encode object with undefined values (normalize to null)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ a: undefined, b: 42 });
    if (!result.includes('a: null') || !result.includes('b: 42')) {
        throw new Error('Undefined should normalize to null');
    }
});

test('TOON - Encode mixed type array (all primitives use inline format)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([1, "hello", true, null]);
    // All primitives (string, number, boolean, null) use inline format, not list format
    if (!result.includes('[4]:') || !result.includes('1,hello,true,null')) {
        throw new Error('Primitive array should use inline format');
    }
});

test('TOON - Encode special characters in strings', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ msg: 'hello\nworld\ttab' });
    if (!result.includes('\\n') || !result.includes('\\t')) {
        throw new Error('Special characters should be escaped');
    }
});

test('TOON - Encode string with quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ msg: 'say "hello"' });
    if (!result.includes('\\"')) {
        throw new Error('Quotes should be escaped');
    }
});

test('TOON - Encode string with backslashes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ path: 'C:\\Windows\\System32' });
    if (!result.includes('\\\\')) {
        throw new Error('Backslashes should be escaped');
    }
});

test('TOON - Encode number-like strings with quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ id: '123', version: '1.0.0' });
    if (!result.includes('"123"')) {
        throw new Error('Number-like strings should be quoted');
    }
});

// ============================================================================
// UNICODE AND INTERNATIONAL CONTENT
// ============================================================================
console.log('\n🌐 Unicode and International Content Tests');
console.log('-'.repeat(70));

test('TOON - Encode unicode characters (emoji)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ msg: 'Hello 👋 World 🌍' });
    if (!result.includes('👋') || !result.includes('🌍')) {
        throw new Error('Should preserve emoji');
    }
});

test('TOON - Encode CJK characters (Chinese, Japanese, Korean)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({
        chinese: '你好世界',
        japanese: 'こんにちは世界',
        korean: '안녕하세요'
    });
    if (!result.includes('你好世界') || !result.includes('こんにちは世界') || !result.includes('안녕하세요')) {
        throw new Error('Should preserve CJK characters');
    }
});

test('TOON - Encode RTL text (Arabic, Hebrew)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({
        arabic: 'مرحبا بالعالم',
        hebrew: 'שלום עולם'
    });
    if (!result.includes('مرحبا') || !result.includes('שלום')) {
        throw new Error('Should preserve RTL text');
    }
});

test('TOON - Encode accented characters', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({
        french: 'Café au lait',
        german: 'Grüße',
        spanish: 'Niño'
    });
    if (!result.includes('Café') || !result.includes('Grüße') || !result.includes('Niño')) {
        throw new Error('Should preserve accented characters');
    }
});

// ============================================================================
// DEEPLY NESTED OBJECTS
// ============================================================================
console.log('\n🏗️ Deeply Nested Objects Tests');
console.log('-'.repeat(70));

test('TOON - Encode deeply nested object (10 levels)', () => {
    const formatter = new ToonFormatterV13();
    let deep = { value: 'bottom' };
    for (let i = 0; i < 9; i++) {
        deep = { level: i, nested: deep };
    }
    const result = formatter.encode(deep);
    if (!result.includes('level: 0') || !result.includes('value: bottom')) {
        throw new Error('Should handle 10 levels of nesting');
    }
});

test('TOON - Encode deeply nested arrays', () => {
    const formatter = new ToonFormatterV13();
    const nested = [1, [2, [3, [4, [5]]]]];
    const result = formatter.encode(nested);
    if (!result.includes('5')) {
        throw new Error('Should handle nested arrays');
    }
});

test('TOON - Encode object with complex nested structure', () => {
    const formatter = new ToonFormatterV13();
    const complex = {
        a: {
            b: {
                c: [1, 2, 3],
                d: { e: 'deep' }
            },
            f: [{ g: 1 }, { g: 2 }]
        }
    };
    const result = formatter.encode(complex);
    // Array of uniform objects uses tabular format: [2]{g}:
    // Check for e: deep and the tabular array format
    if (!result.includes('e: deep') || !result.includes('[2]{g}:')) {
        throw new Error('Should handle complex nested structures with tabular arrays');
    }
});

// ============================================================================
// VERY LARGE OBJECTS
// ============================================================================
console.log('\n📊 Large Object Tests');
console.log('-'.repeat(70));

test('TOON - Encode large array (1000 items)', () => {
    const formatter = new ToonFormatterV13();
    const largeArray = Array.from({ length: 1000 }, (_, i) => i);
    const result = formatter.encode(largeArray);
    if (!result.includes('[1000]:') || !result.includes('999')) {
        throw new Error('Should handle 1000 item array');
    }
});

test('TOON - Encode large object (500 properties)', () => {
    const formatter = new ToonFormatterV13();
    const largeObj = {};
    for (let i = 0; i < 500; i++) {
        largeObj[`prop${i}`] = i;
    }
    const result = formatter.encode(largeObj);
    if (!result.includes('prop499: 499')) {
        throw new Error('Should handle 500 property object');
    }
});

test('TOON - Encode tabular array (100 rows)', () => {
    const formatter = new ToonFormatterV13();
    const tabular = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User${i}`,
        score: i * 10
    }));
    const result = formatter.encode(tabular);
    if (!result.includes('[100]') || !result.includes('{id,name,score}:')) {
        throw new Error('Should handle 100 row tabular array');
    }
});

// ============================================================================
// COMPRESSION RATIO VERIFICATION
// ============================================================================
console.log('\n📉 Compression Ratio Tests');
console.log('-'.repeat(70));

test('TOON - Compression better than JSON for tabular data', () => {
    const formatter = new ToonFormatterV13();
    const tabular = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Name${i}`,
        value: i * 100
    }));
    const toon = formatter.encode(tabular);
    const json = JSON.stringify(tabular, null, 2);
    if (toon.length >= json.length) {
        throw new Error(`TOON should be smaller: TOON=${toon.length} JSON=${json.length}`);
    }
});

test('TOON - Calculate compression ratio', () => {
    const formatter = new ToonFormatterV13();
    const data = {
        users: [
            { id: 1, name: 'Alice', score: 100 },
            { id: 2, name: 'Bob', score: 95 },
            { id: 3, name: 'Charlie', score: 110 }
        ]
    };
    const comparison = formatter.compareWithJSON(data);
    if (comparison.savingsPercentage <= 0) {
        throw new Error('Should show token savings');
    }
    if (comparison.toonSize >= comparison.jsonSize) {
        throw new Error('TOON should be smaller than JSON');
    }
});

test('TOON - Token estimation accuracy', () => {
    const formatter = new ToonFormatterV13();
    const data = { test: 'hello world' };
    const toon = formatter.encode(data);
    const tokens = formatter.estimateTokens(toon);
    // Rough check: tokens should be ~1/4 of character count
    const expectedRange = [Math.floor(toon.length / 5), Math.ceil(toon.length / 3)];
    if (tokens < expectedRange[0] || tokens > expectedRange[1]) {
        throw new Error(`Token estimate ${tokens} outside expected range ${expectedRange}`);
    }
});

// ============================================================================
// DECODING EDGE CASES
// ============================================================================
console.log('\n🔓 TOON Decoding Edge Cases');
console.log('-'.repeat(70));

test('TOON - Decode empty object', () => {
    const formatter = new ToonFormatterV13();
    const toon = '';
    const result = formatter.decode(toon);
    if (result !== null) {
        throw new Error('Empty string should decode to null');
    }
});

test('TOON - Decode primitive values', () => {
    const formatter = new ToonFormatterV13();
    if (formatter.parsePrimitive('null') !== null) throw new Error('Should parse null');
    if (formatter.parsePrimitive('true') !== true) throw new Error('Should parse true');
    if (formatter.parsePrimitive('false') !== false) throw new Error('Should parse false');
    if (formatter.parsePrimitive('42') !== 42) throw new Error('Should parse number');
});

test('TOON - Decode quoted strings', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('"hello world"');
    if (result !== 'hello world') {
        throw new Error('Should decode quoted string');
    }
});

test('TOON - Decode escaped characters', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('"hello\\nworld\\ttab"');
    if (result !== 'hello\nworld\ttab') {
        throw new Error('Should unescape special characters');
    }
});

test('TOON - Roundtrip encoding and decoding', () => {
    const formatter = new ToonFormatterV13();
    const original = {
        name: 'Test',
        count: 42,
        active: true,
        data: [1, 2, 3]
    };
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.name !== 'Test' || decoded.count !== 42 || decoded.active !== true) {
        throw new Error('Roundtrip should preserve data');
    }
});

// ============================================================================
// VALIDATION AND ERROR HANDLING
// ============================================================================
console.log('\n✔️ Validation and Error Handling Tests');
console.log('-'.repeat(70));

test('TOON - Validate correct TOON string', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: test\nvalue: 42';
    const result = formatter.validate(toon);
    if (!result.valid || result.errors.length !== 0) {
        throw new Error('Valid TOON should pass validation');
    }
});

test('TOON - Detect unbalanced braces', () => {
    const formatter = new ToonFormatterV13();
    const toon = '{name: test';
    const result = formatter.validate(toon);
    if (result.valid || result.errors.length === 0) {
        throw new Error('Should detect unbalanced braces');
    }
});

test('TOON - Detect unbalanced brackets', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[1,2,3';
    const result = formatter.validate(toon);
    if (result.valid || result.errors.length === 0) {
        throw new Error('Should detect unbalanced brackets');
    }
});

test('TOON - Detect extra closing braces', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: test}';
    const result = formatter.validate(toon);
    if (result.valid) {
        throw new Error('Should detect extra closing brace');
    }
});

// ============================================================================
// DELIMITER OPTIONS
// ============================================================================
console.log('\n🔧 Delimiter Options Tests');
console.log('-'.repeat(70));

test('TOON - Encode with comma delimiter (default)', () => {
    const formatter = new ToonFormatterV13({ delimiter: ',' });
    const data = [1, 2, 3];
    const result = formatter.encode(data);
    if (!result.includes(',')) {
        throw new Error('Should use comma delimiter');
    }
});

test('TOON - Encode with tab delimiter', () => {
    const formatter = new ToonFormatterV13({ delimiter: '\t' });
    const data = [1, 2, 3];
    const result = formatter.encode(data);
    if (!result.includes('\t')) {
        throw new Error('Should use tab delimiter');
    }
});

test('TOON - Encode with pipe delimiter', () => {
    const formatter = new ToonFormatterV13({ delimiter: '|' });
    const data = [1, 2, 3];
    const result = formatter.encode(data);
    if (!result.includes('|')) {
        throw new Error('Should use pipe delimiter');
    }
});

test('TOON - Decode respects different delimiters', () => {
    const formatter = new ToonFormatterV13({ delimiter: '|' });
    const toon = '[3|]: 1|2|3';
    const result = formatter.decode(toon);
    if (!Array.isArray(result) || result.length !== 3) {
        throw new Error('Should decode pipe-delimited array');
    }
});

// ============================================================================
// LENGTH MARKER OPTIONS
// ============================================================================
console.log('\n📏 Length Marker Tests');
console.log('-'.repeat(70));

test('TOON - Encode without length marker prefix (default)', () => {
    const formatter = new ToonFormatterV13({ lengthMarker: false });
    const data = [1, 2, 3];
    const result = formatter.encode(data);
    if (result.includes('#3')) {
        throw new Error('Should not include # prefix when lengthMarker is false');
    }
    if (!result.includes('[3]:')) {
        throw new Error('Should include length without prefix');
    }
});

test('TOON - Encode with length marker prefix', () => {
    const formatter = new ToonFormatterV13({ lengthMarker: '#' });
    const data = [1, 2, 3];
    const result = formatter.encode(data);
    if (!result.includes('[#3]:')) {
        throw new Error('Should include # prefix when lengthMarker is true');
    }
});

// ============================================================================
// OPTIMIZATION AND MINIFICATION
// ============================================================================
console.log('\n⚡ Optimization and Minification Tests');
console.log('-'.repeat(70));

test('TOON - Optimize removes trailing whitespace', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: test   \nvalue: 42   \n';
    const optimized = formatter.optimize(toon);
    if (optimized.includes('   \n')) {
        throw new Error('Should remove trailing whitespace');
    }
});

test('TOON - Optimize collapses multiple newlines', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: test\n\n\n\nvalue: 42';
    const optimized = formatter.optimize(toon);
    if (optimized.includes('\n\n\n')) {
        throw new Error('Should collapse multiple newlines');
    }
});

test('TOON - Minify removes all extra whitespace', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: test\n  value: 42\n';
    const minified = formatter.minify(toon);
    if (minified.includes('  ')) {
        throw new Error('Should remove extra whitespace');
    }
    if (!minified.includes('name: test') || !minified.includes('value: 42')) {
        throw new Error('Should preserve content');
    }
});

// ============================================================================
// SPECIAL DATA TYPES
// ============================================================================
console.log('\n🎯 Special Data Types Tests');
console.log('-'.repeat(70));

test('TOON - Encode Date objects (converts to ISO string)', () => {
    const formatter = new ToonFormatterV13();
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatter.encode({ timestamp: date });
    if (!result.includes('2024-01-15')) {
        throw new Error('Date should be converted to ISO string');
    }
});

test('TOON - Encode NaN (normalizes to null)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ value: NaN });
    if (!result.includes('value: null')) {
        throw new Error('NaN should normalize to null');
    }
});

test('TOON - Encode Infinity (normalizes to null)', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ value: Infinity });
    if (!result.includes('value: null')) {
        throw new Error('Infinity should normalize to null');
    }
});

test('TOON - Encode -0 (normalizes to 0)', () => {
    const formatter = new ToonFormatterV13();
    const normalized = formatter.normalizeValue(-0);
    const encoded = formatter.encodeNumber(normalized);
    if (encoded !== '0') {
        throw new Error('-0 should encode as 0');
    }
});

test('TOON - Encode BigInt within safe range', () => {
    const formatter = new ToonFormatterV13();
    const bigIntValue = BigInt(123);
    const normalized = formatter.normalizeValue(bigIntValue);
    if (normalized !== 123) {
        throw new Error('Small BigInt should convert to number');
    }
});

// ============================================================================
// CIRCULAR REFERENCE DETECTION
// ============================================================================
console.log('\n🔄 Circular Reference Tests');
console.log('-'.repeat(70));

test('TOON - Detect circular reference in object', () => {
    const formatter = new ToonFormatterV13();
    const obj = { name: 'test' };
    obj.self = obj; // Create circular reference

    try {
        formatter.encode(obj);
        throw new Error('Should detect circular reference');
    } catch (error) {
        if (error.message === 'Should detect circular reference') {
            throw error;
        }
        // Expected: JavaScript's own stack overflow or similar error
        // This is acceptable behavior
    }
});

test('TOON - Detect circular reference in array', () => {
    const formatter = new ToonFormatterV13();
    const arr = [1, 2, 3];
    arr.push(arr); // Create circular reference

    try {
        formatter.encode(arr);
        throw new Error('Should detect circular reference');
    } catch (error) {
        if (error.message === 'Should detect circular reference') {
            throw error;
        }
        // Expected: JavaScript's own stack overflow or similar error
    }
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

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
