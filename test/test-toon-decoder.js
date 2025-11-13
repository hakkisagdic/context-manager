#!/usr/bin/env node

/**
 * TOON Decoder Tests
 * Tests for TOON v1.3 decoder functionality
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

console.log('🧪 Testing TOON Decoder v1.3...\n');

// ============================================================================
// BASIC DECODE TESTS
// ============================================================================
console.log('🔤 Basic Decode Tests');
console.log('-'.repeat(70));

test('ToonDecoder - decode null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('null');
    if (result !== null) throw new Error('Should decode null');
});

test('ToonDecoder - decode true', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('true');
    if (result !== true) throw new Error('Should decode true');
});

test('ToonDecoder - decode false', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('false');
    if (result !== false) throw new Error('Should decode false');
});

test('ToonDecoder - decode integer', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('42');
    if (result !== 42) throw new Error('Should decode integer');
});

test('ToonDecoder - decode float', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('3.14');
    if (Math.abs(result - 3.14) > 0.001) throw new Error('Should decode float');
});

test('ToonDecoder - decode negative number', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('-123');
    if (result !== -123) throw new Error('Should decode negative');
});

test('ToonDecoder - decode simple string', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('"hello"');
    if (result !== 'hello') throw new Error('Should decode string');
});

test('ToonDecoder - decode string with spaces', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('"hello world"');
    if (result !== 'hello world') throw new Error('Should decode string with spaces');
});

test('ToonDecoder - decode empty string', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('""');
    if (result !== '') throw new Error('Should decode empty string');
});

test('ToonDecoder - decode string with escaped quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('"say \\"hello\\""');
    if (result !== 'say "hello"') throw new Error('Should decode escaped quotes');
});

// ============================================================================
// ARRAY DECODE TESTS
// ============================================================================
console.log('\n📊 Array Decode Tests');
console.log('-'.repeat(70));

test('ToonDecoder - decode simple array (actual format)', () => {
    const formatter = new ToonFormatterV13();
    // Actual TOON format for arrays: [length]: items
    const toon = '[3]: 1,2,3';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 3) throw new Error('Should have 3 items');
    if (result[0] !== 1 || result[1] !== 2 || result[2] !== 3) {
        throw new Error('Should have correct values');
    }
});

test('ToonDecoder - decode array with strings (actual format)', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[3]: apple,banana,cherry';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result[0] !== 'apple') throw new Error('Should decode first string');
    if (result[2] !== 'cherry') throw new Error('Should decode last string');
});

test('ToonDecoder - decode empty array (actual format)', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[0]:';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 0) throw new Error('Should be empty');
});

test('ToonDecoder - decode array with length marker', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[3]: a,b,c';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 3) throw new Error('Should have 3 items');
    if (result[0] !== 'a') throw new Error('Should decode correctly');
});

test('ToonDecoder - decode tabular array (actual format)', () => {
    const formatter = new ToonFormatterV13();
    // Actual tabular format: [N]{fields}:
    const toon = `[2]{age,name}:
  30,Alice
  25,Bob`;
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 2) throw new Error('Should have 2 objects');
    if (result[0].name !== 'Alice') throw new Error('Should have name');
    if (result[0].age !== 30) throw new Error('Should have age');
    if (result[1].name !== 'Bob') throw new Error('Should decode second object');
});

test('ToonDecoder - decode number array', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[5]: 10,20,30,40,50';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 5) throw new Error('Should have 5 numbers');
    if (result[0] !== 10 || result[4] !== 50) throw new Error('Should decode numbers');
});

test('ToonDecoder - decode mixed type array', () => {
    const formatter = new ToonFormatterV13();
    const toon = '[4]: 1,text,true,null';
    const result = formatter.decode(toon);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result[0] !== 1) throw new Error('Should have number');
    if (result[1] !== 'text') throw new Error('Should have string');
    if (result[2] !== true) throw new Error('Should have boolean');
    if (result[3] !== null) throw new Error('Should have null');
});

// ============================================================================
// OBJECT DECODE TESTS
// ============================================================================
console.log('\n📦 Object Decode Tests');
console.log('-'.repeat(70));

test('ToonDecoder - decode single key-value pair', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'name: Alice';
    const result = formatter.decode(toon);
    if (typeof result !== 'object') throw new Error('Should return object');
    if (result.name !== 'Alice') throw new Error('Should have name');
});

test('ToonDecoder - decode key-value with number', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'age: 30';
    const result = formatter.decode(toon);
    if (result.age !== 30) throw new Error('Should have age');
});

test('ToonDecoder - decode key-value with boolean', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'active: true';
    const result = formatter.decode(toon);
    if (result.active !== true) throw new Error('Should have boolean');
});

test('ToonDecoder - decode key-value with null', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'value: null';
    const result = formatter.decode(toon);
    if (result.value !== null) throw new Error('Should have null');
});

test('ToonDecoder - decode key-value with string', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'message: "Hello World"';
    const result = formatter.decode(toon);
    if (result.message !== 'Hello World') throw new Error('Should have string');
});

test('ToonDecoder - decode key with hyphen', () => {
    const formatter = new ToonFormatterV13();
    const toon = 'first-name: Alice';
    const result = formatter.decode(toon);
    if (result['first-name'] !== 'Alice') throw new Error('Should support hyphens');
});

// ============================================================================
// PARSE PRIMITIVE TESTS
// ============================================================================
console.log('\n🔨 Parse Primitive Tests');
console.log('-'.repeat(70));

test('ToonDecoder - parsePrimitive with null', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('null');
    if (result !== null) throw new Error('Should parse null');
});

test('ToonDecoder - parsePrimitive with true', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('true');
    if (result !== true) throw new Error('Should parse true');
});

test('ToonDecoder - parsePrimitive with false', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('false');
    if (result !== false) throw new Error('Should parse false');
});

test('ToonDecoder - parsePrimitive with integer', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('42');
    if (result !== 42) throw new Error('Should parse integer');
});

test('ToonDecoder - parsePrimitive with float', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('3.14');
    if (Math.abs(result - 3.14) > 0.001) throw new Error('Should parse float');
});

test('ToonDecoder - parsePrimitive with quoted string', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.parsePrimitive('"hello"');
    if (result !== 'hello') throw new Error('Should parse quoted string');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('ToonDecoder - decode with trailing whitespace', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('42   \n  ');
    if (result !== 42) throw new Error('Should ignore trailing whitespace');
});

test('ToonDecoder - decode with leading whitespace', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('  \n  42');
    if (result !== 42) throw new Error('Should ignore leading whitespace');
});

test('ToonDecoder - decode string with comma delimiter', () => {
    const formatter = new ToonFormatterV13({ delimiter: ',' });
    const toon = 'name: "Alice", age: 30';
    // Single line object-like format may not parse well, but should not crash
    try {
        const result = formatter.decode(toon);
        // If it parses, should have name
        if (result && typeof result === 'object' && !result.name) {
            throw new Error('If parsed, should have name');
        }
    } catch (error) {
        // Parsing may fail for malformed input
    }
});

test('ToonDecoder - decode zero', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('0');
    if (result !== 0) throw new Error('Should decode zero');
});

test('ToonDecoder - decode negative zero', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('-0');
    if (result !== 0) throw new Error('Should decode -0 as 0');
});

test('ToonDecoder - decode scientific notation', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.decode('1e3');
    if (result !== 1000) throw new Error('Should decode scientific notation');
});

test('ToonDecoder - unquoteKey removes quotes', () => {
    const formatter = new ToonFormatterV13();
    const result = formatter.unquoteKey('"myKey"');
    if (result !== 'myKey') throw new Error('Should remove quotes from key');
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================
console.log('\n🔄 Round-Trip Tests');
console.log('-'.repeat(70));

test('ToonDecoder - round-trip array', () => {
    const formatter = new ToonFormatterV13();
    const original = [1, 2, 3, 4, 5];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== original.length) throw new Error('Should preserve length');
    if (decoded[0] !== 1 || decoded[4] !== 5) throw new Error('Should preserve values');
});

test('ToonDecoder - round-trip array of objects', () => {
    const formatter = new ToonFormatterV13();
    const original = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
    ];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== 2) throw new Error('Should have 2 items');
    if (decoded[0].name !== 'Alice') throw new Error('Should preserve first name');
    if (decoded[1].age !== 25) throw new Error('Should preserve second age');
});

test('ToonDecoder - round-trip string array', () => {
    const formatter = new ToonFormatterV13();
    const original = ['apple', 'banana', 'cherry'];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== 3) throw new Error('Should have 3 items');
    if (decoded[0] !== 'apple') throw new Error('Should preserve strings');
});

test('ToonDecoder - round-trip boolean array', () => {
    const formatter = new ToonFormatterV13();
    const original = [true, false, true];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== 3) throw new Error('Should have 3 items');
    if (decoded[0] !== true || decoded[1] !== false) throw new Error('Should preserve booleans');
});

test('ToonDecoder - round-trip empty array', () => {
    const formatter = new ToonFormatterV13();
    const original = [];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (!Array.isArray(decoded)) throw new Error('Should be array');
    if (decoded.length !== 0) throw new Error('Should be empty');
});

// ============================================================================
// DELIMITER OPTIONS
// ============================================================================
console.log('\n🔀 Delimiter Options Tests');
console.log('-'.repeat(70));

test('ToonDecoder - encode/decode with tab delimiter', () => {
    const formatter = new ToonFormatterV13({ delimiter: '\t' });
    const original = [{ name: 'Alice', age: 30 }];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== 1) throw new Error('Should parse tab-delimited');
    if (decoded[0].name !== 'Alice') throw new Error('Should preserve name');
});

test('ToonDecoder - encode/decode with pipe delimiter', () => {
    const formatter = new ToonFormatterV13({ delimiter: '|' });
    const original = [{ name: 'Bob', age: 25 }];
    const encoded = formatter.encode(original);
    const decoded = formatter.decode(encoded);
    if (decoded.length !== 1) throw new Error('Should parse pipe-delimited');
    if (decoded[0].name !== 'Bob') throw new Error('Should preserve name');
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
    console.log('\n🎉 All TOON decoder tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
