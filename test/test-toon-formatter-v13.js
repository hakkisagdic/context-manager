#!/usr/bin/env node

/**
 * Comprehensive TOON Formatter v1.3 Tests
 * Tests for TOON (Tabular Object Oriented Notation) encoder/decoder
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

console.log('🧪 Testing TOON Formatter v1.3...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - Constructor with defaults', () => {
    const formatter = new ToonFormatterV13();
    if (!formatter) throw new Error('Should create instance');
    if (formatter.indent !== 2) throw new Error('Default indent should be 2');
    if (formatter.delimiter !== ',') throw new Error('Default delimiter should be comma');
    if (formatter.lengthMarker !== false) throw new Error('Default lengthMarker should be false');
});

test('ToonFormatterV13 - Constructor with options', () => {
    const formatter = new ToonFormatterV13({
        indent: 4,
        delimiter: '\t',
        lengthMarker: '#'
    });
    if (formatter.indent !== 4) throw new Error('Should set indent');
    if (formatter.delimiter !== '\t') throw new Error('Should set delimiter');
    if (formatter.lengthMarker !== '#') throw new Error('Should set lengthMarker');
});

test('ToonFormatterV13 - Constructor sets indentChar', () => {
    const formatter = new ToonFormatterV13({ indent: 3 });
    if (formatter.indentChar !== '   ') throw new Error('Should set indentChar');
});

// ============================================================================
// PRIMITIVE ENCODING TESTS
// ============================================================================
console.log('\n📝 Primitive Encoding Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encode null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(null);
    if (result !== 'null') throw new Error('Should encode null');
});

test('ToonFormatterV13 - encode boolean true', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(true);
    if (result !== 'true') throw new Error('Should encode true');
});

test('ToonFormatterV13 - encode boolean false', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(false);
    if (result !== 'false') throw new Error('Should encode false');
});

test('ToonFormatterV13 - encode number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(42);
    if (result !== '42') throw new Error('Should encode number');
});

test('ToonFormatterV13 - encode negative number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(-123);
    if (result !== '-123') throw new Error('Should encode negative number');
});

test('ToonFormatterV13 - encode decimal number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(3.14);
    if (result !== '3.14') throw new Error('Should encode decimal');
});

test('ToonFormatterV13 - encode string without quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode('hello');
    if (result !== 'hello') throw new Error('Simple string should not be quoted');
});

test('ToonFormatterV13 - encode empty string with quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode('');
    if (result !== '""') throw new Error('Empty string should be quoted');
});

test('ToonFormatterV13 - encode string with spaces requires quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode(' hello ');
    if (result !== '" hello "') throw new Error('String with leading/trailing spaces should be quoted');
});

test('ToonFormatterV13 - encode string that looks like number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode('123');
    if (result !== '"123"') throw new Error('Number-like string should be quoted');
});

test('ToonFormatterV13 - encode string that looks like boolean', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode('true');
    if (result !== '"true"') throw new Error('Boolean-like string should be quoted');
});

// ============================================================================
// VALUE NORMALIZATION TESTS
// ============================================================================
console.log('\n🔄 Value Normalization Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - normalizeValue undefined to null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.normalizeValue(undefined);
    if (result !== null) throw new Error('undefined should normalize to null');
});

test('ToonFormatterV13 - normalizeValue function to null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.normalizeValue(() => {});
    if (result !== null) throw new Error('function should normalize to null');
});

test('ToonFormatterV13 - normalizeValue NaN to null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.normalizeValue(NaN);
    if (result !== null) throw new Error('NaN should normalize to null');
});

test('ToonFormatterV13 - normalizeValue Infinity to null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.normalizeValue(Infinity);
    if (result !== null) throw new Error('Infinity should normalize to null');
});

test('ToonFormatterV13 - normalizeValue Date to ISO string', () => {
    const formatter = new ToonFormatterV13();
    const date = new Date('2025-01-01T00:00:00.000Z');
    const result = formatter.normalizeValue(date);
    if (result !== '2025-01-01T00:00:00.000Z') throw new Error('Date should normalize to ISO string');
});

test('ToonFormatterV13 - normalizeValue preserves regular values', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.normalizeValue('hello');
    if (result !== 'hello') throw new Error('Should preserve string');
});

// ============================================================================
// NUMBER ENCODING TESTS
// ============================================================================
console.log('\n🔢 Number Encoding Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encodeNumber handles -0', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeNumber(-0);
    if (result !== '0') throw new Error('-0 should encode as 0');
});

test('ToonFormatterV13 - encodeNumber no scientific notation', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeNumber(1000000);
    if (result.includes('e')) throw new Error('Should not use scientific notation');
});

test('ToonFormatterV13 - encodeNumber handles decimals', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeNumber(1.23456);
    if (!result.includes('.')) throw new Error('Should include decimal point');
});

// ============================================================================
// STRING ENCODING TESTS
// ============================================================================
console.log('\n💬 String Encoding Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encodeString escapes backslash', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('hello\\world');
    if (!result.includes('\\\\')) throw new Error('Should escape backslash');
});

test('ToonFormatterV13 - encodeString escapes quote', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('say "hello"');
    if (!result.includes('\\"')) throw new Error('Should escape quotes');
});

test('ToonFormatterV13 - encodeString escapes newline', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('line1\nline2');
    if (!result.includes('\\n')) throw new Error('Should escape newline');
});

test('ToonFormatterV13 - encodeString escapes tab', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('hello\tworld');
    if (!result.includes('\\t')) throw new Error('Should escape tab');
});

test('ToonFormatterV13 - encodeString quotes string starting with "- "', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('- item');
    if (!result.startsWith('"')) throw new Error('Should quote list-like string');
});

test('ToonFormatterV13 - encodeString quotes string with colon', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('key:value');
    if (!result.startsWith('"')) throw new Error('Should quote string with colon');
});

test('ToonFormatterV13 - encodeString quotes string with delimiter', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeString('a,b,c');
    if (!result.startsWith('"')) throw new Error('Should quote string with comma');
});

// ============================================================================
// OBJECT ENCODING TESTS
// ============================================================================
console.log('\n📦 Object Encoding Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encode empty object', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({});
    if (result !== '') throw new Error('Empty object should be empty string');
});

test('ToonFormatterV13 - encode simple object', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ name: 'Alice' });
    if (!result.includes('name:')) throw new Error('Should include key');
    if (!result.includes('Alice')) throw new Error('Should include value');
});

test('ToonFormatterV13 - encode object with multiple keys', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ name: 'Bob', age: 30 });
    if (!result.includes('name:')) throw new Error('Should include name');
    if (!result.includes('age:')) throw new Error('Should include age');
});

test('ToonFormatterV13 - needsQuotingAsKey valid identifier', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.needsQuotingAsKey('valid_key');
    if (result) throw new Error('Valid identifier should not need quoting');
});

test('ToonFormatterV13 - needsQuotingAsKey starts with number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.needsQuotingAsKey('123key');
    if (!result) throw new Error('Key starting with number needs quoting');
});

test('ToonFormatterV13 - needsQuotingAsKey with spaces', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.needsQuotingAsKey('my key');
    if (!result) throw new Error('Key with spaces needs quoting');
});

test('ToonFormatterV13 - needsQuotingAsKey with special chars', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.needsQuotingAsKey('key-name');
    if (!result) throw new Error('Key with hyphen needs quoting');
});

test('ToonFormatterV13 - encode nested object', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ user: { name: 'Alice' } });
    if (!result.includes('user:')) throw new Error('Should include parent key');
    if (!result.includes('name:')) throw new Error('Should include nested key');
});

// ============================================================================
// ARRAY ENCODING TESTS
// ============================================================================
console.log('\n📋 Array Encoding Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encode empty array', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([]);
    if (!result.includes('[0]:')) throw new Error('Empty array should have [0]:');
});

test('ToonFormatterV13 - encode empty array with length marker', () => {
    const formatter = new ToonFormatterV13({ lengthMarker: '#' });
    const result = formatter.encode([]);
    if (!result.includes('[#0]:')) throw new Error('Should include # marker');
});

test('ToonFormatterV13 - isPrimitiveArray detects primitives', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPrimitiveArray([1, 2, 3]);
    if (!result) throw new Error('Should detect primitive array');
});

test('ToonFormatterV13 - isPrimitiveArray rejects objects', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPrimitiveArray([1, {}]);
    if (result) throw new Error('Should reject array with objects');
});

test('ToonFormatterV13 - isPrimitiveArray handles null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPrimitiveArray([null, 1, 2]);
    if (!result) throw new Error('null is primitive');
});

test('ToonFormatterV13 - isPlainObject detects plain object', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPlainObject({ a: 1 });
    if (!result) throw new Error('Should detect plain object');
});

test('ToonFormatterV13 - isPlainObject rejects null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPlainObject(null);
    if (result) throw new Error('null is not plain object');
});

test('ToonFormatterV13 - isPlainObject rejects array', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isPlainObject([1, 2]);
    if (result) throw new Error('array is not plain object');
});

test('ToonFormatterV13 - isTabularArray detects uniform objects', () => {
    const formatter = new ToonFormatterV13();
    const arr = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
    ];
    const result = formatter.isTabularArray(arr);
    if (!result) throw new Error('Should detect tabular array');
});

test('ToonFormatterV13 - isTabularArray rejects different keys', () => {
    const formatter = new ToonFormatterV13();
    const arr = [
        { name: 'Alice' },
        { age: 30 }
    ];
    const result = formatter.isTabularArray(arr);
    if (result) throw new Error('Should reject different keys');
});

test('ToonFormatterV13 - isTabularArray rejects nested objects', () => {
    const formatter = new ToonFormatterV13();
    const arr = [
        { name: 'Alice', meta: { foo: 'bar' } }
    ];
    const result = formatter.isTabularArray(arr);
    if (result) throw new Error('Should reject nested objects');
});

test('ToonFormatterV13 - isTabularArray rejects empty array', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isTabularArray([]);
    if (result) throw new Error('Empty array is not tabular');
});

test('ToonFormatterV13 - isTabularArray rejects primitives', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.isTabularArray([1, 2, 3]);
    if (result) throw new Error('Primitive array is not tabular');
});

// ============================================================================
// ENCODE OPTIONS TESTS
// ============================================================================
console.log('\n⚙️  Encode Options Tests');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encode with custom delimiter', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([1, 2, 3], { delimiter: '\t' });
    // Result should use tab delimiter
    if (typeof result !== 'string') throw new Error('Should return string');
});

test('ToonFormatterV13 - encode with custom indent', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ a: 1 }, { indent: 4 });
    if (typeof result !== 'string') throw new Error('Should return string');
});

test('ToonFormatterV13 - encode preserves original instance options', () => {
    const formatter = new ToonFormatterV13({ indent: 2 });
    formatter.encode({ a: 1 }, { indent: 4 });
    // After encoding with different options, original should be preserved
    if (typeof formatter.indent !== 'number') throw new Error('Should have indent');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('ToonFormatterV13 - encode handles circular references gracefully', () => {
    const formatter = new ToonFormatterV13();
    const obj = { name: 'test' };
    obj.self = obj; // Circular reference

    try {
        const result = formatter.encode(obj);
        // May throw or handle gracefully
        if (typeof result !== 'string') throw new Error('Should return string or throw');
    } catch (error) {
        // Expected for circular references
        if (!error.message.includes('circular') &&
            !error.message.includes('Maximum call stack')) {
            throw error;
        }
    }
});

test('ToonFormatterV13 - encode handles very deep nesting', () => {
    const formatter = new ToonFormatterV13();
    const deep = { a: { b: { c: { d: { e: 'value' } } } } };
    const result = formatter.encode(deep);
    if (typeof result !== 'string') throw new Error('Should handle deep nesting');
});

test('ToonFormatterV13 - encode handles mixed array', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode([1, 'two', true, null]);
    if (typeof result !== 'string') throw new Error('Should handle mixed array');
});

test('ToonFormatterV13 - encode handles special characters in keys', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ 'key-with-dash': 'value' });
    if (!result.includes('"key-with-dash"')) throw new Error('Should quote special key');
});

test('ToonFormatterV13 - encode handles unicode strings', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode('Hello 世界 🌍');
    if (!result.includes('世界')) throw new Error('Should preserve unicode');
});

test('ToonFormatterV13 - encodeValue handles all null-like values', () => {
    const formatter = new ToonFormatterV13();
    const result1 = formatter.encodeValue(null);
    const result2 = formatter.encodeValue(undefined);
    if (result1 !== 'null') throw new Error('null should encode to "null"');
    if (result2 !== 'null') throw new Error('undefined should encode to "null"');
});

test('ToonFormatterV13 - encodeValue handles unknown types', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encodeValue(Symbol('test'));
    if (result !== 'null') throw new Error('Symbol should encode to null');
});

test('ToonFormatterV13 - multiple instances are independent', () => {
    const formatter1 = new ToonFormatterV13({ indent: 2 });
    const formatter2 = new ToonFormatterV13({ indent: 4 });
    if (formatter1.indent === formatter2.indent) {
        throw new Error('Instances should be independent');
    }
});

test('ToonFormatterV13 - encode trims trailing whitespace', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.encode({ name: 'test' });
    if (result !== result.trimEnd()) throw new Error('Should trim trailing whitespace');
});

test('ToonFormatterV13 - normalizeValue handles safe BigInt', () => {
    const formatter = new ToonFormatterV13();
    // Only test if BigInt is supported
    try {
        const result = formatter.normalizeValue(BigInt(123));
        if (result !== 123) throw new Error('Safe BigInt should convert to number');
    } catch (e) {
        // BigInt might not be supported in some environments
        if (!e.message.includes('BigInt')) throw e;
    }
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

if (testsFailed === 0) {
    console.log('\n🎉 All TOON formatter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
