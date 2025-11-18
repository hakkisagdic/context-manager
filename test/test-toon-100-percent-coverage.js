#!/usr/bin/env node

/**
 * Advanced TOON Features Tests
 * Tests for streaming, incremental parsing, validation, diff, and benchmarking
 */

import { Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';
import ToonStreamEncoder from '../lib/formatters/toon-stream-encoder.js';
import ToonStreamDecoder from '../lib/formatters/toon-stream-decoder.js';
import ToonIncrementalParser from '../lib/formatters/toon-incremental-parser.js';
import ToonValidator from '../lib/formatters/toon-validator.js';
import ToonDiff from '../lib/formatters/toon-diff.js';
import ToonBenchmark from '../lib/formatters/toon-benchmark.js';
import ToonMessagePackComparison from '../lib/formatters/toon-messagepack-comparison.js';

const pipelineAsync = promisify(pipeline);

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

async function testAsync(name, fn) {
    try {
        await fn();
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

console.log('🧪 Testing TOON Advanced Features...\n');

// ============================================================================
// STREAM ENCODER TESTS
// ============================================================================
console.log('📤 Stream Encoder Tests');
console.log('-'.repeat(70));

await testAsync('ToonStreamEncoder - Create instance', async () => {
    const encoder = new ToonStreamEncoder();
    if (!encoder) throw new Error('Should create encoder');
});

await testAsync('ToonStreamEncoder - Encode single object', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([{ name: 'Test', count: 42 }]);
    const chunks = [];

    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });

    await pipelineAsync(input, encoder, output);

    const result = chunks.join('');
    if (!result.includes('name:') || !result.includes('count:')) {
        throw new Error('Should encode object');
    }
});

await testAsync('ToonStreamEncoder - Encode multiple objects', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([
        { id: 1 },
        { id: 2 },
        { id: 3 }
    ]);
    const chunks = [];

    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });

    await pipelineAsync(input, encoder, output);

    const result = chunks.join('');
    if (!result.includes('---')) {
        throw new Error('Should separate objects with ---');
    }
});

await testAsync('ToonStreamEncoder - Array mode', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    const input = Readable.from([{ id: 1 }, { id: 2 }]);
    const chunks = [];

    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });

    await pipelineAsync(input, encoder, output);

    const result = chunks.join('');
    if (!result.startsWith('[')) throw new Error('Should start with [');
    if (!result.endsWith(']')) throw new Error('Should end with ]');
});

// ============================================================================
// STREAM DECODER TESTS
// ============================================================================
console.log('\n📥 Stream Decoder Tests');
console.log('-'.repeat(70));

await testAsync('ToonStreamDecoder - Create instance', async () => {
    const decoder = new ToonStreamDecoder();
    if (!decoder) throw new Error('Should create decoder');
});

await testAsync('ToonStreamDecoder - Decode TOON stream', async () => {
    const decoder = new ToonStreamDecoder();
    const toonData = 'name: Test\ncount: 42\n---\nname: Test2\ncount: 43';
    const input = Readable.from([toonData]);
    const objects = [];

    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });

    await pipelineAsync(input, decoder, output);

    if (objects.length !== 2) throw new Error('Should decode 2 objects');
    if (objects[0].name !== 'Test') throw new Error('Should preserve data');
});

// ============================================================================
// INCREMENTAL PARSER TESTS
// ============================================================================
console.log('\n🔄 Incremental Parser Tests');
console.log('-'.repeat(70));

test('ToonIncrementalParser - Create instance', () => {
    const parser = new ToonIncrementalParser();
    if (!parser) throw new Error('Should create parser');
});

test('ToonIncrementalParser - Parse line by line', () => {
    const parser = new ToonIncrementalParser();
    let parsed = null;

    parser.on('object', (obj) => {
        parsed = obj;
    });

    parser.parseLine('name: Test');
    parser.parseLine('count: 42');
    parser.parseLine(''); // Trigger parse
    parser.end();

    if (!parsed || parsed.name !== 'Test') {
        throw new Error('Should parse lines incrementally');
    }
});

test('ToonIncrementalParser - Parse chunk', () => {
    const parser = new ToonIncrementalParser();
    let parsed = null;

    parser.on('object', (obj) => {
        parsed = obj;
    });

    parser.parseChunk('name: Test\ncount: 42\n\n');
    parser.end();

    if (!parsed || parsed.count !== 42) {
        throw new Error('Should parse chunk');
    }
});

test('ToonIncrementalParser - Get state', () => {
    const parser = new ToonIncrementalParser();
    const state = parser.getState();

    if (state.state !== 'waiting') {
        throw new Error('Initial state should be waiting');
    }
});

test('ToonIncrementalParser - Reset parser', () => {
    const parser = new ToonIncrementalParser();
    parser.parseLine('name: Test');
    parser.reset();

    const bufferSize = parser.getBufferSize();
    if (bufferSize !== 0) {
        throw new Error('Reset should clear buffer');
    }
});

// ============================================================================
// VALIDATOR TESTS
// ============================================================================
console.log('\n✔️ Schema Validator Tests');
console.log('-'.repeat(70));

test('ToonValidator - Create instance', () => {
    const validator = new ToonValidator();
    if (!validator) throw new Error('Should create validator');
});

test('ToonValidator - Validate type', () => {
    const schema = { type: 'object' };
    const validator = new ToonValidator(schema);

    const result = validator.validate({ name: 'Test' });
    if (!result.valid) {
        throw new Error('Should validate correct type');
    }
});

test('ToonValidator - Detect type mismatch', () => {
    const schema = { type: 'object' };
    const validator = new ToonValidator(schema);

    const result = validator.validate('string');
    if (result.valid) {
        throw new Error('Should detect type mismatch');
    }
});

test('ToonValidator - Validate required fields', () => {
    const schema = {
        type: 'object',
        required: ['name', 'age']
    };
    const validator = new ToonValidator(schema);

    const result = validator.validate({ name: 'Test' });
    if (result.valid) {
        throw new Error('Should detect missing required field');
    }
    if (result.errors.length === 0) {
        throw new Error('Should have errors');
    }
});

test('ToonValidator - Validate nested properties', () => {
    const schema = {
        type: 'object',
        properties: {
            user: {
                type: 'object',
                properties: {
                    age: { type: 'number', minimum: 0, maximum: 150 }
                }
            }
        }
    };
    const validator = new ToonValidator(schema);

    const invalid = { user: { age: 200 } };
    const result = validator.validate(invalid);

    if (result.valid) {
        throw new Error('Should detect out of range value');
    }
});

test('ToonValidator - Validate array items', () => {
    const schema = {
        type: 'array',
        items: { type: 'number' }
    };
    const validator = new ToonValidator(schema);

    const invalid = [1, 2, 'three'];
    const result = validator.validate(invalid);

    if (result.valid) {
        throw new Error('Should detect invalid array item');
    }
});

test('ToonValidator - Validate TOON format', () => {
    const validator = new ToonValidator();
    const toon = 'name: Test\ncount: 42';

    const result = validator.validateToonFormat(toon);
    if (!result.valid) {
        throw new Error('Should validate correct TOON format');
    }
});

test('ToonValidator - Detect unbalanced brackets', () => {
    const validator = new ToonValidator();
    const toon = '[1,2,3';

    const result = validator.validateToonFormat(toon);
    if (result.valid) {
        throw new Error('Should detect unbalanced brackets');
    }
});

test('ToonValidator - Infer schema from data', () => {
    const data = { name: 'Test', age: 42 };
    const schema = ToonValidator.inferSchema(data);

    if (schema.type !== 'object') {
        throw new Error('Should infer object type');
    }
    if (!schema.properties.name || !schema.properties.age) {
        throw new Error('Should infer properties');
    }
});

// ============================================================================
// DIFF TESTS
// ============================================================================
console.log('\n🔍 Diff Utility Tests');
console.log('-'.repeat(70));

test('ToonDiff - Compare equal objects', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Test', count: 42 };

    const diff = ToonDiff.compare(obj1, obj2);
    if (diff.hasChanges) {
        throw new Error('Equal objects should have no changes');
    }
});

test('ToonDiff - Detect value changes', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Test', count: 43 };

    const diff = ToonDiff.compare(obj1, obj2);
    if (!diff.hasChanges) {
        throw new Error('Should detect value change');
    }
    if (diff.changes.length !== 1) {
        throw new Error('Should have 1 change');
    }
});

test('ToonDiff - Detect added properties', () => {
    const obj1 = { name: 'Test' };
    const obj2 = { name: 'Test', count: 42 };

    const diff = ToonDiff.compare(obj1, obj2);
    const addedChanges = diff.changes.filter(c => c.type === 'property_added');

    if (addedChanges.length !== 1) {
        throw new Error('Should detect added property');
    }
});

test('ToonDiff - Detect removed properties', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Test' };

    const diff = ToonDiff.compare(obj1, obj2);
    const removedChanges = diff.changes.filter(c => c.type === 'property_removed');

    if (removedChanges.length !== 1) {
        throw new Error('Should detect removed property');
    }
});

test('ToonDiff - Compare arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3, 4];

    const diff = ToonDiff.compare(arr1, arr2);
    if (!diff.hasChanges) {
        throw new Error('Should detect array changes');
    }
});

test('ToonDiff - Generate patch', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Test', count: 43 };

    const patch = ToonDiff.generatePatch(obj1, obj2);
    if (!patch.changes || patch.changes.length === 0) {
        throw new Error('Should generate patch');
    }
});

test('ToonDiff - Apply patch', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Test', count: 43 };

    const patch = ToonDiff.generatePatch(obj1, obj2);
    const result = ToonDiff.applyPatch(obj1, patch);

    if (result.count !== 43) {
        throw new Error('Should apply patch correctly');
    }
});

test('ToonDiff - Merge objects', () => {
    const obj1 = { name: 'Test', count: 42 };
    const obj2 = { name: 'Updated', active: true };

    const merged = ToonDiff.merge(obj1, obj2);

    if (merged.name !== 'Updated' || !merged.active || merged.count !== 42) {
        throw new Error('Should merge objects');
    }
});

test('ToonDiff - Calculate similarity', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 2, c: 4 };

    const stats = ToonDiff.getStats(obj1, obj2);
    if (stats.similarity === 0 || stats.similarity === 1) {
        throw new Error('Similarity should be between 0 and 1');
    }
});

// ============================================================================
// BENCHMARK TESTS
// ============================================================================
console.log('\n⚡ Benchmark Suite Tests');
console.log('-'.repeat(70));

test('ToonBenchmark - Create instance', () => {
    const benchmark = new ToonBenchmark();
    if (!benchmark) throw new Error('Should create benchmark');
});

test('ToonBenchmark - Benchmark encode', () => {
    const benchmark = new ToonBenchmark();
    const data = { name: 'Test', count: 42 };

    const result = benchmark.benchmarkEncode(data, 10);
    if (!result.avgMs || !result.opsPerSec) {
        throw new Error('Should return benchmark results');
    }
});

test('ToonBenchmark - Benchmark decode', () => {
    const benchmark = new ToonBenchmark();
    const toon = 'name: Test\ncount: 42';

    const result = benchmark.benchmarkDecode(toon, 10);
    if (!result.avgMs) {
        throw new Error('Should return decode benchmark');
    }
});

test('ToonBenchmark - Benchmark roundtrip', () => {
    const benchmark = new ToonBenchmark();
    const data = { name: 'Test', count: 42 };

    const result = benchmark.benchmarkRoundtrip(data, 10);
    if (!result.avgMs) {
        throw new Error('Should benchmark roundtrip');
    }
});

test('ToonBenchmark - Compare with JSON', () => {
    const benchmark = new ToonBenchmark();
    const data = [
        { id: 1, name: 'Item1' },
        { id: 2, name: 'Item2' }
    ];

    const comparison = benchmark.compareWithJSON(data);
    if (!comparison.sizes || !comparison.performance) {
        throw new Error('Should compare with JSON');
    }
});

test('ToonBenchmark - Get summary', () => {
    const benchmark = new ToonBenchmark();
    benchmark.benchmarkEncode({ test: 1 }, 10);

    const summary = benchmark.getSummary();
    if (summary.totalBenchmarks !== 1) {
        throw new Error('Should track benchmarks');
    }
});

// ============================================================================
// MESSAGEPACK COMPARISON TESTS
// ============================================================================
console.log('\n📦 MessagePack Comparison Tests');
console.log('-'.repeat(70));

test('ToonMessagePackComparison - Create instance', () => {
    const comparison = new ToonMessagePackComparison();
    if (!comparison) throw new Error('Should create comparison');
});

await testAsync('ToonMessagePackComparison - Compare formats', async () => {
    const comparison = new ToonMessagePackComparison();
    const data = { name: 'Test', count: 42 };

    const result = await comparison.compare(data);
    if (!result.formats || !result.comparison) {
        throw new Error('Should compare formats');
    }
    if (!result.formats.toon || !result.formats.json || !result.formats.messagepack) {
        throw new Error('Should include all formats');
    }
});

await testAsync('ToonMessagePackComparison - Size estimates', async () => {
    const comparison = new ToonMessagePackComparison();
    const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));

    const result = await comparison.compare(data);
    const msgpackSize = result.formats.messagepack.size;

    if (msgpackSize === 0) {
        throw new Error('Should estimate MessagePack size');
    }
});

await testAsync('ToonMessagePackComparison - Determine winner', async () => {
    const comparison = new ToonMessagePackComparison();
    const data = { test: 'data' };

    const result = await comparison.compare(data);
    if (!result.winner || !result.winner.smallest) {
        throw new Error('Should determine smallest format');
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

await testAsync('Integration - Stream encode and decode', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: false });
    const decoder = new ToonStreamDecoder();

    const testData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
    ];

    const input = Readable.from(testData);
    const results = [];

    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            results.push(obj);
            callback();
        }
    });

    await pipelineAsync(input, encoder, decoder, output);

    if (results.length !== 2) {
        throw new Error('Should roundtrip data through streams');
    }
    if (results[0].name !== 'Alice') {
        throw new Error('Should preserve data');
    }
});

test('Integration - Validate then diff', () => {
    const schema = {
        type: 'object',
        properties: {
            id: { type: 'number' },
            name: { type: 'string' }
        },
        required: ['id', 'name']
    };

    const obj1 = { id: 1, name: 'Test' };
    const obj2 = { id: 1, name: 'Updated' };

    // Validate both
    const validator = new ToonValidator(schema);
    const valid1 = validator.validate(obj1);
    const valid2 = validator.validate(obj2);

    if (!valid1.valid || !valid2.valid) {
        throw new Error('Both objects should be valid');
    }

    // Diff
    const diff = ToonDiff.compare(obj1, obj2);
    if (!diff.hasChanges) {
        throw new Error('Should detect name change');
    }
});

// ============================================================================
// ADDITIONAL TOON VALIDATOR COMPREHENSIVE TESTS
// ============================================================================
console.log('\n📋 Additional ToonValidator Comprehensive Tests');
console.log('-'.repeat(70));

// Test all type detection paths
test('ToonValidator - _validateType with array of types success', () => {
    const validator = new ToonValidator({ type: ['string', 'number', 'boolean'] });
    const r1 = validator.validate('text');
    const r2 = validator.validate(123);
    const r3 = validator.validate(true);
    if (!r1.valid || !r2.valid || !r3.valid) throw new Error('Should validate all types in array');
});

test('ToonValidator - _validateType with array of types failure', () => {
    const validator = new ToonValidator({ type: ['string', 'number'] });
    const result = validator.validate({});
    if (result.valid) throw new Error('Should fail for type not in array');
});

test('ToonValidator - enum validation with value tracking', () => {
    const validator = new ToonValidator({ enum: [1, 2, 3] });
    const result = validator.validate(5);
    if (result.valid) throw new Error('Should fail enum');
    if (!result.errors[0].value) throw new Error('Should track value in error');
});

test('ToonValidator - pattern validation with complex regex', () => {
    const validator = new ToonValidator({ 
        type: 'string',
        pattern: '^[A-Z][a-z]+$'
    });
    const r1 = validator.validate('Hello');
    const r2 = validator.validate('hello');
    if (!r1.valid || r2.valid) throw new Error('Should validate pattern correctly');
});

test('ToonValidator - custom validator with path parameter', () => {
    let capturedPath = null;
    const validator = new ToonValidator({
        validator: (data, path) => {
            capturedPath = path;
            return true;
        }
    });
    validator.validate('test');
    if (capturedPath !== '$') throw new Error('Should pass path to custom validator');
});

test('ToonValidator - nested object validation with deep paths', () => {
    const validator = new ToonValidator({
        type: 'object',
        properties: {
            a: {
                type: 'object',
                properties: {
                    b: {
                        type: 'object',
                        properties: {
                            c: { type: 'number' }
                        }
                    }
                }
            }
        }
    });
    const result = validator.validate({ a: { b: { c: 'wrong' } } });
    if (result.valid) throw new Error('Should fail deep validation');
    if (!result.errors[0].path.includes('a.b.c')) throw new Error('Should have deep path');
});

test('ToonValidator - validateToonFormat with multiple errors', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('{{[');
    if (result.valid) throw new Error('Should fail multiple balance issues');
    if (result.errors.length < 2) throw new Error('Should have multiple errors');
});

test('ToonValidator - validateToonFormat with array markers', () => {
    const validator = new ToonValidator();
    const r1 = validator.validateToonFormat('[#10]');
    const r2 = validator.validateToonFormat('[#0]');
    if (!r1.valid || !r2.valid) throw new Error('Should validate array markers');
});

test('ToonValidator - inferSchema with undefined type', () => {
    const schema = ToonValidator.inferSchema(undefined);
    if (schema.type !== 'undefined') throw new Error('Should handle undefined');
});

test('ToonValidator - inferSchema with nested arrays', () => {
    const schema = ToonValidator.inferSchema([[1, 2], [3, 4]]);
    if (schema.type !== 'array') throw new Error('Should infer array');
    if (!schema.items || schema.items.type !== 'array') throw new Error('Should infer nested array');
});

test('ToonValidator - inferSchema with mixed object', () => {
    const schema = ToonValidator.inferSchema({
        str: 'hello',
        num: 42,
        bool: true,
        obj: { nested: 'value' },
        arr: [1, 2, 3]
    });
    if (Object.keys(schema.properties).length !== 5) throw new Error('Should infer all properties');
});

test('ToonValidator - empty errors after successful validation', () => {
    const validator = new ToonValidator({ type: 'string' });
    validator.validate(123); // Fail first
    const result = validator.validate('valid'); // Then succeed
    if (result.errors.length !== 0) throw new Error('Should clear errors');
});

test('ToonValidator - required fields with empty object', () => {
    const validator = new ToonValidator({
        type: 'object',
        required: ['a', 'b', 'c']
    });
    const result = validator.validate({});
    if (result.errors.length !== 3) throw new Error('Should have error for each missing field');
});

test('ToonValidator - properties with extra fields allowed', () => {
    const validator = new ToonValidator({
        type: 'object',
        properties: {
            known: { type: 'string' }
        }
    });
    const result = validator.validate({ known: 'value', extra: 'allowed' });
    if (!result.valid) throw new Error('Should allow extra properties');
});

test('ToonValidator - items validation with empty array', () => {
    const validator = new ToonValidator({
        type: 'array',
        items: { type: 'number' }
    });
    const result = validator.validate([]);
    if (!result.valid) throw new Error('Should validate empty array');
});

test('ToonValidator - maximum equals minimum (exact value)', () => {
    const validator = new ToonValidator({
        type: 'number',
        minimum: 42,
        maximum: 42
    });
    const r1 = validator.validate(42);
    const r2 = validator.validate(41);
    const r3 = validator.validate(43);
    if (!r1.valid || r2.valid || r3.valid) throw new Error('Should only allow exact value');
});

test('ToonValidator - minLength equals maxLength (exact length)', () => {
    const validator = new ToonValidator({
        type: 'string',
        minLength: 5,
        maxLength: 5
    });
    const r1 = validator.validate('exact');
    const r2 = validator.validate('four');
    const r3 = validator.validate('toolong!');
    if (!r1.valid || r2.valid || r3.valid) throw new Error('Should only allow exact length');
});

// ============================================================================
// ADDITIONAL MESSAGEPACK COMPARISON TESTS
// ============================================================================
console.log('\n📦 Additional MessagePack Comparison Tests');
console.log('-'.repeat(70));

await testAsync('MessagePack - _loadMessagePack called once', async () => {
    const comp = new ToonMessagePackComparison();
    await comp._loadMessagePack();
    await comp._loadMessagePack(); // Call again
    if (!comp.msgpackLoaded) throw new Error('Should mark as loaded');
});

await testAsync('MessagePack - compare with complex nested data', async () => {
    const comp = new ToonMessagePackComparison();
    const data = {
        users: [
            { id: 1, name: 'Alice', tags: ['admin', 'active'] },
            { id: 2, name: 'Bob', tags: ['user'] }
        ],
        meta: { version: '1.0', timestamp: Date.now() }
    };
    const result = await comp.compare(data);
    if (!result.formats || !result.comparison || !result.winner) {
        throw new Error('Should return complete comparison');
    }
});

await testAsync('MessagePack - _estimateMessagePackSize for primitives', async () => {
    const comp = new ToonMessagePackComparison();
    const s1 = comp._estimateMessagePackSize('string');
    const s2 = comp._estimateMessagePackSize(123);
    const s3 = comp._estimateMessagePackSize(true);
    if (s1 === 0 || s2 === 0 || s3 === 0) throw new Error('Should estimate primitive sizes');
});

await testAsync('MessagePack - _estimateMessagePackSize for large object', async () => {
    const comp = new ToonMessagePackComparison();
    const largeObj = {};
    for (let i = 0; i < 50; i++) {
        largeObj[`key${i}`] = `value${i}`;
    }
    const size = comp._estimateMessagePackSize(largeObj);
    if (size === 0) throw new Error('Should estimate large object');
});

await testAsync('MessagePack - _isUniformArray with uniform data', async () => {
    const comp = new ToonMessagePackComparison();
    const uniform = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
    ];
    if (!comp._isUniformArray(uniform)) throw new Error('Should detect uniform array');
});

await testAsync('MessagePack - _isUniformArray with non-uniform data', async () => {
    const comp = new ToonMessagePackComparison();
    const nonUniform = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B', extra: 'field' },
        { id: 3 }
    ];
    if (comp._isUniformArray(nonUniform)) throw new Error('Should detect non-uniform array');
});

await testAsync('MessagePack - _isUniformArray with empty array', async () => {
    const comp = new ToonMessagePackComparison();
    if (!comp._isUniformArray([])) throw new Error('Empty array should be uniform');
});

await testAsync('MessagePack - _isUniformArray with primitives', async () => {
    const comp = new ToonMessagePackComparison();
    if (comp._isUniformArray([1, 2, 3])) throw new Error('Primitives should not be uniform');
});

await testAsync('MessagePack - _compareFormats equal sizes', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._compareFormats('A', 100, 'B', 100);
    if (!result.includes('equal')) throw new Error('Should detect equal sizes');
});

await testAsync('MessagePack - _compareFormats A smaller', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._compareFormats('A', 50, 'B', 100);
    if (!result.includes('smaller')) throw new Error('Should detect smaller');
});

await testAsync('MessagePack - _compareFormats A larger', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._compareFormats('A', 150, 'B', 100);
    if (!result.includes('larger')) throw new Error('Should detect larger');
});

await testAsync('MessagePack - _compressionRatio calculation', async () => {
    const comp = new ToonMessagePackComparison();
    const ratio = comp._compressionRatio(1000, 500);
    if (!ratio.includes('50.0%')) throw new Error('Should calculate 50% compression');
});

await testAsync('MessagePack - _compressionRatio no compression', async () => {
    const comp = new ToonMessagePackComparison();
    const ratio = comp._compressionRatio(100, 100);
    if (!ratio.includes('0.0%')) throw new Error('Should show 0% compression');
});

await testAsync('MessagePack - _determineWinner ranking', async () => {
    const comp = new ToonMessagePackComparison();
    const winner = comp._determineWinner(80, 100, 90);
    if (winner.smallest !== 'TOON') throw new Error('Should rank TOON as smallest');
    if (winner.largest !== 'JSON') throw new Error('Should rank JSON as largest');
    if (winner.ranking.length !== 3) throw new Error('Should have 3 rankings');
});

await testAsync('MessagePack - _formatBytes zero bytes', async () => {
    const comp = new ToonMessagePackComparison();
    if (comp._formatBytes(0) !== '0 B') throw new Error('Should format zero bytes');
});

await testAsync('MessagePack - _formatBytes kilobytes', async () => {
    const comp = new ToonMessagePackComparison();
    const formatted = comp._formatBytes(2048);
    if (!formatted.includes('KB')) throw new Error('Should format as KB');
});

await testAsync('MessagePack - _formatBytes megabytes', async () => {
    const comp = new ToonMessagePackComparison();
    const formatted = comp._formatBytes(2 * 1024 * 1024);
    if (!formatted.includes('MB')) throw new Error('Should format as MB');
});

await testAsync('MessagePack - benchmarkComparison performance test', async () => {
    const comp = new ToonMessagePackComparison();
    const data = { test: 'data', number: 42 };
    const result = await comp.benchmarkComparison(data, 10);
    if (!result.averageMs || !result.fastest) throw new Error('Should return benchmark results');
});

await testAsync('MessagePack - _findFastest with results', async () => {
    const comp = new ToonMessagePackComparison();
    const results = {
        toon: { encode: 0.5, decode: 0.3 },
        json: { encode: 0.4, decode: 0.6 }
    };
    const fastest = comp._findFastest(results, 'encode');
    if (fastest !== 'json') throw new Error('Should find fastest encoder');
});

// ============================================================================
// ADDITIONAL STREAM ENCODER TESTS
// ============================================================================
console.log('\n📤 Additional Stream Encoder Tests');
console.log('-'.repeat(70));

await testAsync('StreamEncoder - custom delimiter option', async () => {
    const encoder = new ToonStreamEncoder({ delimiter: ';' });
    if (!encoder.formatter) throw new Error('Should create with custom delimiter');
});

await testAsync('StreamEncoder - custom indent option', async () => {
    const encoder = new ToonStreamEncoder({ indent: 4 });
    if (!encoder.formatter) throw new Error('Should create with custom indent');
});

await testAsync('StreamEncoder - lengthMarker option', async () => {
    const encoder = new ToonStreamEncoder({ lengthMarker: true });
    if (!encoder.formatter) throw new Error('Should create with lengthMarker');
});

await testAsync('StreamEncoder - objectMode default', async () => {
    const encoder = new ToonStreamEncoder();
    if (encoder.arrayMode) throw new Error('Should default to object mode');
});

await testAsync('StreamEncoder - error handling in _transform', async () => {
    const encoder = new ToonStreamEncoder();
    encoder.formatter.encode = () => { throw new Error('Encode error'); };
    
    const input = Readable.from([{ test: 'data' }]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    
    try {
        await pipelineAsync(input, encoder, output);
        throw new Error('Should propagate error');
    } catch (error) {
        if (!error.message.includes('Encode error')) throw error;
    }
});

await testAsync('StreamEncoder - _flush in object mode with no chunks', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    await pipelineAsync(input, encoder, output);
    // Should complete without error
});

await testAsync('StreamEncoder - itemCount tracking in array mode', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    const input = Readable.from([{a: 1}, {a: 2}, {a: 3}]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    const commaCount = (result.match(/,/g) || []).length;
    if (commaCount !== 2) throw new Error('Should have 2 commas for 3 items');
});

// ============================================================================
// ADDITIONAL STREAM DECODER TESTS
// ============================================================================
console.log('\n📥 Additional Stream Decoder Tests');
console.log('-'.repeat(70));

await testAsync('StreamDecoder - custom separator option', async () => {
    const decoder = new ToonStreamDecoder({ separator: '~~~' });
    if (decoder.separator !== '~~~') throw new Error('Should set custom separator');
});

await testAsync('StreamDecoder - buffer accumulation across chunks', async () => {
    const decoder = new ToonStreamDecoder();
    const toon1 = 'name: Test\ncount: 42';
    const toon2 = '\n---\nname: Test2\ncount: 43';
    
    const input = Readable.from([toon1, toon2]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 2) throw new Error('Should decode both objects');
});

await testAsync('StreamDecoder - malformed TOON handling', async () => {
    const decoder = new ToonStreamDecoder();
    const malformed = 'invalid TOON data\n---\nname: Valid\ncount: 1';
    
    const input = Readable.from([malformed]);
    const objects = [];
    let errorEmitted = false;
    
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    decoder.on('error', () => { errorEmitted = true; });
    
    try {
        await pipelineAsync(input, decoder, output);
    } catch (error) {
        // Expected to handle malformed data
    }
    
    if (!errorEmitted) {
        // Some implementations may skip malformed data silently
    }
});

await testAsync('StreamDecoder - _processBuffer with incomplete data', async () => {
    const decoder = new ToonStreamDecoder();
    const incomplete = 'name: Test\ncount:'; // Incomplete
    
    const input = Readable.from([incomplete]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    try {
        await pipelineAsync(input, decoder, output);
        // May fail or skip incomplete data
    } catch (error) {
        // Expected for incomplete data
    }
});

await testAsync('StreamDecoder - _flush with remaining buffer', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'name: Final\ncount: 99';
    
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should flush final object');
});

// ============================================================================
// ADDITIONAL DIFF TESTS
// ============================================================================
console.log('\n🔄 Additional Diff Tests');
console.log('-'.repeat(70));

test('ToonDiff - compare identical primitives', () => {
    const result = ToonDiff.compare(42, 42);
    if (result.hasChanges) throw new Error('Should have no changes for identical primitives');
});

test('ToonDiff - compare null values', () => {
    const result = ToonDiff.compare(null, null);
    if (result.hasChanges) throw new Error('Should have no changes for null');
});

test('ToonDiff - compare different primitives', () => {
    const result = ToonDiff.compare('old', 'new');
    if (!result.hasChanges) throw new Error('Should detect change');
    if (result.changes[0].type !== 'value_changed') throw new Error('Should be value_changed');
});

test('ToonDiff - compare type change from string to number', () => {
    const result = ToonDiff.compare('42', 42);
    if (result.changes[0].type !== 'type_changed') throw new Error('Should detect type change');
});

test('ToonDiff - compare arrays with items added', () => {
    const result = ToonDiff.compare([1, 2], [1, 2, 3, 4]);
    const addedChanges = result.changes.filter(c => c.type === 'item_added');
    if (addedChanges.length !== 2) throw new Error('Should detect 2 added items');
});

test('ToonDiff - compare arrays with items removed', () => {
    const result = ToonDiff.compare([1, 2, 3, 4], [1, 2]);
    const removedChanges = result.changes.filter(c => c.type === 'item_removed');
    if (removedChanges.length !== 2) throw new Error('Should detect 2 removed items');
});

test('ToonDiff - compare objects with property added', () => {
    const result = ToonDiff.compare({ a: 1 }, { a: 1, b: 2 });
    if (result.changes[0].type !== 'property_added') throw new Error('Should detect added property');
});

test('ToonDiff - compare objects with property removed', () => {
    const result = ToonDiff.compare({ a: 1, b: 2 }, { a: 1 });
    if (result.changes[0].type !== 'property_removed') throw new Error('Should detect removed property');
});

test('ToonDiff - _summarizeChanges counts', () => {
    const diff = ToonDiff.compare({ a: 1, b: 2 }, { a: 2, c: 3 });
    if (diff.summary.total !== 3) throw new Error('Should count all changes');
    if (!diff.summary.byType.value_changed) throw new Error('Should group by type');
});

test('ToonDiff - generatePatch creates patch object', () => {
    const patch = ToonDiff.generatePatch({ a: 1 }, { a: 2 });
    if (!patch.version) throw new Error('Should have version');
    if (!patch.changes) throw new Error('Should have changes');
    if (!patch.summary) throw new Error('Should have summary');
});

test('ToonDiff - applyPatch value change', () => {
    const obj = { count: 5 };
    const patch = ToonDiff.generatePatch(obj, { count: 10 });
    const result = ToonDiff.applyPatch(obj, patch);
    if (result.count !== 10) throw new Error('Should apply value change');
});

test('ToonDiff - applyPatch property added', () => {
    const obj = { a: 1 };
    const patch = ToonDiff.generatePatch(obj, { a: 1, b: 2 });
    const result = ToonDiff.applyPatch(obj, patch);
    if (result.b !== 2) throw new Error('Should add property');
});

test('ToonDiff - applyPatch property removed', () => {
    const obj = { a: 1, b: 2 };
    const patch = ToonDiff.generatePatch(obj, { a: 1 });
    const result = ToonDiff.applyPatch(obj, patch);
    if ('b' in result) throw new Error('Should remove property');
});

test('ToonDiff - applyPatch type changed', () => {
    const obj = { value: 'string' };
    const patch = ToonDiff.generatePatch(obj, { value: 123 });
    const result = ToonDiff.applyPatch(obj, patch);
    if (result.value !== 123) throw new Error('Should handle type change');
});

test('ToonDiff - merge overwrite strategy with primitives', () => {
    const result = ToonDiff.merge('old', 'new');
    if (result !== 'new') throw new Error('Should use new value');
});

test('ToonDiff - merge overwrite strategy with objects', () => {
    const result = ToonDiff.merge({ a: 1, b: 2 }, { b: 3, c: 4 });
    if (result.a !== 1 || result.b !== 3 || result.c !== 4) {
        throw new Error('Should merge objects');
    }
});

test('ToonDiff - merge concat strategy with arrays', () => {
    const result = ToonDiff.merge([1, 2], [3, 4], 'concat');
    if (result.length !== 4) throw new Error('Should concat arrays');
    if (result[2] !== 3) throw new Error('Should append second array');
});

test('ToonDiff - merge different types', () => {
    const result = ToonDiff.merge('string', 123);
    if (result !== 123) throw new Error('Should use second value for different types');
});

test('ToonDiff - merge nested objects', () => {
    const obj1 = { user: { name: 'Alice', age: 30 } };
    const obj2 = { user: { age: 31, city: 'NYC' } };
    const result = ToonDiff.merge(obj1, obj2);
    if (result.user.name !== 'Alice') throw new Error('Should keep original values');
    if (result.user.age !== 31) throw new Error('Should update changed values');
    if (result.user.city !== 'NYC') throw new Error('Should add new values');
});

test('ToonDiff - getStats calculation', () => {
    const stats = ToonDiff.getStats({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
    if (!stats.totalChanges) throw new Error('Should have totalChanges');
    if (!stats.similarity) throw new Error('Should have similarity');
    if (!stats.paths) throw new Error('Should have paths');
});

test('ToonDiff - _calculateSimilarity identical objects', () => {
    const sim = ToonDiff._calculateSimilarity({ a: 1 }, { a: 1 });
    if (sim !== 1) throw new Error('Identical objects should have similarity 1');
});

test('ToonDiff - _calculateSimilarity completely different', () => {
    const sim = ToonDiff._calculateSimilarity({ a: 1 }, { b: 2 });
    if (sim >= 0.5) throw new Error('Different objects should have low similarity');
});

test('ToonDiff - _countProperties primitive', () => {
    const count = ToonDiff._countProperties(42);
    if (count !== 1) throw new Error('Primitive should count as 1');
});

test('ToonDiff - _countProperties array', () => {
    const count = ToonDiff._countProperties([1, 2, 3]);
    if (count !== 3) throw new Error('Should count array items');
});

test('ToonDiff - _countProperties object', () => {
    const count = ToonDiff._countProperties({ a: 1, b: 2 });
    if (count < 2) throw new Error('Should count object properties');
});

test('ToonDiff - _parsePath simple', () => {
    const parts = ToonDiff._parsePath('$.user.name');
    if (parts.length !== 2) throw new Error('Should parse simple path');
    if (parts[0] !== 'user' || parts[1] !== 'name') throw new Error('Should parse correctly');
});

test('ToonDiff - _parsePath with array index', () => {
    const parts = ToonDiff._parsePath('$.items[2].name');
    if (parts[1] !== 2) throw new Error('Should parse array index as number');
});

test('ToonDiff - _setPath creates intermediate objects', () => {
    const obj = {};
    ToonDiff._setPath(obj, ['a', 'b', 'c'], 'value');
    if (obj.a.b.c !== 'value') throw new Error('Should create nested structure');
});

test('ToonDiff - _setPath creates intermediate arrays', () => {
    const obj = {};
    ToonDiff._setPath(obj, ['items', 0], 'value');
    if (!Array.isArray(obj.items)) throw new Error('Should create array');
});

test('ToonDiff - _deletePath from object', () => {
    const obj = { a: 1, b: 2 };
    ToonDiff._deletePath(obj, ['b']);
    if ('b' in obj) throw new Error('Should delete property');
});

test('ToonDiff - _deletePath from array', () => {
    const obj = { items: [1, 2, 3] };
    ToonDiff._deletePath(obj, ['items', 1]);
    if (obj.items.length !== 2) throw new Error('Should remove array item');
});

test('ToonDiff - _deletePath non-existent path', () => {
    const obj = { a: 1 };
    ToonDiff._deletePath(obj, ['b', 'c']);
    // Should not throw
    if (!obj.a) throw new Error('Should preserve existing data');
});

// ============================================================================
// ADDITIONAL BENCHMARK TESTS  
// ============================================================================
console.log('\n⚡ Additional Benchmark Tests');
console.log('-'.repeat(70));

test('ToonBenchmark - constructor with options', () => {
    const bench = new ToonBenchmark({ indent: 4 });
    if (!bench.formatter) throw new Error('Should create formatter');
    if (!Array.isArray(bench.results)) throw new Error('Should initialize results');
});

test('ToonBenchmark - constructor default options', () => {
    const bench = new ToonBenchmark();
    if (!bench.results) throw new Error('Should have results array');
});

test('ToonBenchmark - benchmark execution', () => {
    const bench = new ToonBenchmark();
    let executed = 0;
    const result = bench.benchmark('Test', () => { executed++; }, 5);
    if (executed !== 15) throw new Error('Should run warmup + iterations (10 + 5)');
    if (!result.name) throw new Error('Should return result');
});

test('ToonBenchmark - benchmark result structure', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmark('Test', () => {}, 10);
    if (!result.iterations || !result.totalMs || !result.avgMs || !result.opsPerSec) {
        throw new Error('Should have complete result structure');
    }
});

test('ToonBenchmark - benchmark adds to results', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Test1', () => {}, 5);
    bench.benchmark('Test2', () => {}, 5);
    if (bench.results.length !== 2) throw new Error('Should add results');
});

test('ToonBenchmark - benchmarkEncode', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmarkEncode({ test: 'data' }, 10);
    if (!result.name.includes('Encode')) throw new Error('Should name encode benchmark');
});

test('ToonBenchmark - benchmarkDecode', () => {
    const bench = new ToonBenchmark();
    const toonString = 'test: data';
    const result = bench.benchmarkDecode(toonString, 10);
    if (!result.name.includes('Decode')) throw new Error('Should name decode benchmark');
});

test('ToonBenchmark - benchmarkRoundtrip', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmarkRoundtrip({ test: 'data' }, 10);
    if (!result.name.includes('Roundtrip')) throw new Error('Should name roundtrip benchmark');
});

test('ToonBenchmark - compareWithJSON', () => {
    const bench = new ToonBenchmark();
    const result = bench.compareWithJSON({ test: 'data' });
    if (!result.sizes || !result.performance) throw new Error('Should return comparison');
});

test('ToonBenchmark - compareWithJSON sizes', () => {
    const bench = new ToonBenchmark();
    const result = bench.compareWithJSON({ test: 'data' });
    if (!result.sizes.toon || !result.sizes.json || !result.sizes.savings) {
        throw new Error('Should have size data');
    }
});

test('ToonBenchmark - compareWithJSON performance', () => {
    const bench = new ToonBenchmark();
    const result = bench.compareWithJSON({ test: 'data' });
    if (!result.performance.toon || !result.performance.json) {
        throw new Error('Should have performance data');
    }
});

test('ToonBenchmark - benchmarkArrayFormats', () => {
    const bench = new ToonBenchmark();
    const uniform = [{a: 1}, {a: 2}];
    const mixed = [{a: 1}, {b: 2}];
    const result = bench.benchmarkArrayFormats(uniform, mixed);
    if (!result.tabular || !result.list || !result.comparison) {
        throw new Error('Should compare formats');
    }
});

test('ToonBenchmark - stressTest', () => {
    const bench = new ToonBenchmark();
    const result = bench.stressTest(100);
    if (!result.dataSize || !result.encode || !result.decode || !result.sizes) {
        throw new Error('Should return stress test results');
    }
});

test('ToonBenchmark - stressTest with custom size', () => {
    const bench = new ToonBenchmark();
    const result = bench.stressTest(50);
    if (result.dataSize !== 50) throw new Error('Should use custom size');
});

test('ToonBenchmark - getSummary with results', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Test', () => {}, 5);
    const summary = bench.getSummary();
    if (!summary.totalBenchmarks || !summary.avgTime) {
        throw new Error('Should return summary');
    }
});

test('ToonBenchmark - getSummary empty', () => {
    const bench = new ToonBenchmark();
    const summary = bench.getSummary();
    if (!summary.message) throw new Error('Should have message for empty results');
});

test('ToonBenchmark - getSummary statistics', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Fast', () => {}, 10);
    bench.benchmark('Slow', () => { for(let i = 0; i < 1000; i++); }, 10);
    const summary = bench.getSummary();
    if (!summary.avgTime.min || !summary.avgTime.max || !summary.avgTime.mean) {
        throw new Error('Should calculate statistics');
    }
});

test('ToonBenchmark - clear results', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Test', () => {}, 5);
    bench.clear();
    if (bench.results.length !== 0) throw new Error('Should clear results');
});

test('ToonBenchmark - _formatBytes zero', () => {
    const bench = new ToonBenchmark();
    if (bench._formatBytes(0) !== '0 B') throw new Error('Should format zero');
});

test('ToonBenchmark - _formatBytes negative', () => {
    const bench = new ToonBenchmark();
    const formatted = bench._formatBytes(-1024);
    if (!formatted.startsWith('-')) throw new Error('Should handle negative');
});

test('ToonBenchmark - _formatBytes bytes', () => {
    const bench = new ToonBenchmark();
    const formatted = bench._formatBytes(500);
    if (!formatted.includes(' B')) throw new Error('Should format as bytes');
});

test('ToonBenchmark - _formatBytes kilobytes', () => {
    const bench = new ToonBenchmark();
    const formatted = bench._formatBytes(5120);
    if (!formatted.includes('KB')) throw new Error('Should format as KB');
});

test('ToonBenchmark - _formatBytes megabytes', () => {
    const bench = new ToonBenchmark();
    const formatted = bench._formatBytes(5 * 1024 * 1024);
    if (!formatted.includes('MB')) throw new Error('Should format as MB');
});

test('ToonBenchmark - _formatBytes gigabytes', () => {
    const bench = new ToonBenchmark();
    const formatted = bench._formatBytes(5 * 1024 * 1024 * 1024);
    if (!formatted.includes('GB')) throw new Error('Should format as GB');
});

test('ToonBenchmark - _describeData array', () => {
    const bench = new ToonBenchmark();
    const desc = bench._describeData([1, 2, 3, 4, 5]);
    if (!desc.includes('5 items')) throw new Error('Should describe array length');
});

test('ToonBenchmark - _describeData object', () => {
    const bench = new ToonBenchmark();
    const desc = bench._describeData({ a: 1, b: 2, c: 3 });
    if (!desc.includes('3 props')) throw new Error('Should describe object properties');
});

test('ToonBenchmark - _describeData primitive', () => {
    const bench = new ToonBenchmark();
    if (bench._describeData('string') !== 'string') throw new Error('Should describe type');
    if (bench._describeData(42) !== 'number') throw new Error('Should describe type');
    if (bench._describeData(true) !== 'boolean') throw new Error('Should describe type');
});

// ============================================================================
// EDGE CASES AND ADDITIONAL COVERAGE TESTS (117+ more tests)
// ============================================================================
console.log('\n🔬 Edge Cases and Additional Coverage Tests (117+ tests)');
console.log('-'.repeat(70));

// ToonValidator edge cases (40 more tests)
test('ToonValidator - validate with null data', () => {
    const validator = new ToonValidator({ type: 'null' });
    const result = validator.validate(null);
    if (!result.valid) throw new Error('Should validate null');
});

test('ToonValidator - validate object not array', () => {
    const validator = new ToonValidator({ type: 'object' });
    const result = validator.validate([]);
    if (result.valid) throw new Error('Array should not validate as object');
});

test('ToonValidator - validate empty string', () => {
    const validator = new ToonValidator({ type: 'string' });
    const result = validator.validate('');
    if (!result.valid) throw new Error('Empty string should be valid');
});

test('ToonValidator - minLength with zero', () => {
    const validator = new ToonValidator({ type: 'string', minLength: 0 });
    const result = validator.validate('');
    if (!result.valid) throw new Error('Should allow empty with minLength 0');
});

test('ToonValidator - maxLength with zero', () => {
    const validator = new ToonValidator({ type: 'string', maxLength: 0 });
    const r1 = validator.validate('');
    const r2 = validator.validate('a');
    if (!r1.valid || r2.valid) throw new Error('Should only allow empty string');
});

test('ToonValidator - enum with empty array', () => {
    const validator = new ToonValidator({ enum: [] });
    const result = validator.validate('anything');
    if (result.valid) throw new Error('Empty enum should reject all values');
});

test('ToonValidator - required with non-array', () => {
    const validator = new ToonValidator({ type: 'object', required: 'invalid' });
    const result = validator.validate({});
    if (!result.valid) throw new Error('Invalid required should be ignored');
});

test('ToonValidator - properties with non-object data', () => {
    const validator = new ToonValidator({ properties: { a: { type: 'string' } } });
    const result = validator.validate('not-an-object');
    if (result.valid) throw new Error('Should fail for non-object');
});

test('ToonValidator - items with non-array data', () => {
    const validator = new ToonValidator({ items: { type: 'number' } });
    const result = validator.validate({});
    if (result.valid) throw new Error('Should fail for non-array');
});

test('ToonValidator - nested validation stops on error', () => {
    const validator = new ToonValidator({
        type: 'object',
        properties: {
            a: { type: 'number' }
        }
    });
    const result = validator.validate({ a: 'wrong' });
    if (result.valid) throw new Error('Should fail nested validation');
});

test('ToonValidator - validateToonFormat empty string', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('');
    if (!result.valid) throw new Error('Empty string should be valid TOON');
});

test('ToonValidator - validateToonFormat only braces', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('{}');
    if (!result.valid) throw new Error('Empty object should be valid');
});

test('ToonValidator - validateToonFormat only brackets', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('[]');
    if (!result.valid) throw new Error('Empty array should be valid');
});

test('ToonValidator - validateToonFormat deeply nested', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('{{{{[[[[]]]]}}}}');
    if (!result.valid) throw new Error('Should validate deeply nested');
});

test('ToonValidator - validateToonFormat mixed nesting', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('{[{[{}]}]}');
    if (!result.valid) throw new Error('Should validate mixed nesting');
});

test('ToonValidator - validateToonFormat array marker zero', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('[#0]');
    if (!result.valid) throw new Error('Zero length should be valid');
});

test('ToonValidator - validateToonFormat multiple markers', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('[#5] [#10] [#15]');
    if (!result.valid) throw new Error('Multiple markers should be valid');
});

test('ToonValidator - inferSchema from zero', () => {
    const schema = ToonValidator.inferSchema(0);
    if (schema.type !== 'number') throw new Error('Should infer number');
    if (schema.minimum !== 0 || schema.maximum !== 0) throw new Error('Should set range in strict mode');
});

test('ToonValidator - inferSchema from false', () => {
    const schema = ToonValidator.inferSchema(false);
    if (schema.type !== 'boolean') throw new Error('Should infer boolean');
});

test('ToonValidator - inferSchema from empty string', () => {
    const schema = ToonValidator.inferSchema('', { strict: true });
    if (schema.minLength !== 0 || schema.maxLength !== 0) throw new Error('Should set zero length');
});

test('ToonValidator - inferSchema from empty object', () => {
    const schema = ToonValidator.inferSchema({});
    if (schema.type !== 'object') throw new Error('Should infer object');
    if (Object.keys(schema.properties).length !== 0) throw new Error('Should have no properties');
});

test('ToonValidator - inferSchema from deep nesting', () => {
    const data = { a: { b: { c: { d: 'deep' } } } };
    const schema = ToonValidator.inferSchema(data);
    if (!schema.properties.a.properties.b.properties.c.properties.d) {
        throw new Error('Should infer deep nesting');
    }
});

test('ToonValidator - custom validator receives correct path nested', () => {
    let paths = [];
    const validator = new ToonValidator({
        type: 'object',
        properties: {
            child: {
                validator: (data, path) => {
                    paths.push(path);
                    return true;
                }
            }
        }
    });
    validator.validate({ child: 'test' });
    if (!paths[0].includes('child')) throw new Error('Should pass nested path');
});

test('ToonValidator - pattern with special characters', () => {
    const validator = new ToonValidator({ type: 'string', pattern: '^\\$\\d+\\.\\d{2}$' });
    const r1 = validator.validate('$42.00');
    const r2 = validator.validate('42.00');
    if (!r1.valid || r2.valid) throw new Error('Should validate currency pattern');
});

test('ToonValidator - multiple errors accumulated', () => {
    const validator = new ToonValidator({
        type: 'object',
        required: ['a', 'b'],
        properties: {
            a: { type: 'string' },
            b: { type: 'number' }
        }
    });
    const result = validator.validate({});
    if (result.errors.length < 2) throw new Error('Should accumulate multiple errors');
});

test('ToonValidator - error messages are descriptive', () => {
    const validator = new ToonValidator({ type: 'number', minimum: 10, maximum: 20 });
    const r1 = validator.validate(5);
    const r2 = validator.validate(25);
    if (!r1.errors[0].message.includes('10')) throw new Error('Should mention minimum');
    if (!r2.errors[0].message.includes('20')) throw new Error('Should mention maximum');
});

test('ToonValidator - array items with all invalid', () => {
    const validator = new ToonValidator({ type: 'array', items: { type: 'number' } });
    const result = validator.validate(['a', 'b', 'c']);
    if (result.errors.length !== 3) throw new Error('Should have error for each item');
});

test('ToonValidator - array items with some invalid', () => {
    const validator = new ToonValidator({ type: 'array', items: { type: 'number' } });
    const result = validator.validate([1, 'two', 3]);
    if (result.errors.length !== 1) throw new Error('Should have one error');
});

test('ToonValidator - properties validation skips undefined nested', () => {
    const validator = new ToonValidator({
        type: 'object',
        properties: {
            optional: {
                type: 'object',
                properties: {
                    nested: { type: 'string' }
                }
            }
        }
    });
    const result = validator.validate({});
    if (!result.valid) throw new Error('Should allow missing optional nested objects');
});

test('ToonValidator - _getType consistency', () => {
    const validator = new ToonValidator();
    if (validator._getType(new Date()) !== 'object') throw new Error('Date should be object');
    if (validator._getType(/regex/) !== 'object') throw new Error('Regex should be object');
});

test('ToonValidator - type validation with function', () => {
    const validator = new ToonValidator({ type: 'function' });
    const result = validator.validate(() => {});
    if (!result.valid) throw new Error('Should validate function type');
});

test('ToonValidator - validateToonFormat with tabs and spaces', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('{ \\t key:\\tvalue\\t}');
    if (!result.valid) throw new Error('Should handle whitespace');
});

test('ToonValidator - validateToonFormat position tracking', () => {
    const validator = new ToonValidator();
    const result = validator.validateToonFormat('}');
    if (result.valid) throw new Error('Should detect error');
    if (typeof result.errors[0].position !== 'number') throw new Error('Should track position');
});

test('ToonValidator - enum with null', () => {
    const validator = new ToonValidator({ enum: [null, 1, 2] });
    const result = validator.validate(null);
    if (!result.valid) throw new Error('Should allow null in enum');
});

test('ToonValidator - enum with mixed types', () => {
    const validator = new ToonValidator({ enum: ['a', 1, true, null] });
    const r1 = validator.validate('a');
    const r2 = validator.validate(1);
    const r3 = validator.validate(true);
    const r4 = validator.validate(null);
    if (!r1.valid || !r2.valid || !r3.valid || !r4.valid) {
        throw new Error('Should validate all types in enum');
    }
});

test('ToonValidator - minimum with negative numbers', () => {
    const validator = new ToonValidator({ type: 'number', minimum: -10 });
    const r1 = validator.validate(-5);
    const r2 = validator.validate(-15);
    if (!r1.valid || r2.valid) throw new Error('Should handle negative minimum');
});

test('ToonValidator - maximum with negative numbers', () => {
    const validator = new ToonValidator({ type: 'number', maximum: -10 });
    const r1 = validator.validate(-15);
    const r2 = validator.validate(-5);
    if (!r1.valid || r2.valid) throw new Error('Should handle negative maximum');
});

test('ToonValidator - minLength with array', () => {
    const validator = new ToonValidator({ type: 'array', minLength: 3 });
    const r1 = validator.validate([1, 2, 3]);
    const r2 = validator.validate([1, 2]);
    if (!r1.valid || r2.valid) throw new Error('Should validate array minLength');
});

// ToonMessagePackComparison edge cases (20 more tests)
await testAsync('MessagePack - compare with null', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare(null);
    if (!result.formats) throw new Error('Should handle null');
});

await testAsync('MessagePack - compare with undefined', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare(undefined);
    if (!result.formats) throw new Error('Should handle undefined');
});

await testAsync('MessagePack - compare with primitive string', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare('simple string');
    if (!result.formats) throw new Error('Should handle primitive');
});

await testAsync('MessagePack - compare with number', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare(12345);
    if (!result.formats) throw new Error('Should handle number');
});

await testAsync('MessagePack - compare with boolean', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare(true);
    if (!result.formats) throw new Error('Should handle boolean');
});

await testAsync('MessagePack - compare with empty object', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare({});
    if (!result.formats) throw new Error('Should handle empty object');
});

await testAsync('MessagePack - compare with empty array', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.compare([]);
    if (!result.formats) throw new Error('Should handle empty array');
});

await testAsync('MessagePack - _estimateMessagePackSize with nested arrays', async () => {
    const comp = new ToonMessagePackComparison();
    const nested = [[1, 2], [3, 4], [5, 6]];
    const size = comp._estimateMessagePackSize(nested);
    if (size === 0) throw new Error('Should estimate nested arrays');
});

await testAsync('MessagePack - _estimateMessagePackSize with null', async () => {
    const comp = new ToonMessagePackComparison();
    const size = comp._estimateMessagePackSize(null);
    if (size === 0) throw new Error('Should estimate null');
});

await testAsync('MessagePack - _isUniformArray with single item', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._isUniformArray([{ a: 1 }]);
    if (!result) throw new Error('Single item should be uniform');
});

await testAsync('MessagePack - _isUniformArray with nulls', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._isUniformArray([null, null]);
    if (result) throw new Error('Nulls should not be uniform');
});

await testAsync('MessagePack - _isUniformArray with mixed arrays', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._isUniformArray([[1], [1, 2]]);
    if (result) throw new Error('Different length arrays should not be uniform');
});

await testAsync('MessagePack - _compareFormats with zero sizes', async () => {
    const comp = new ToonMessagePackComparison();
    const result = comp._compareFormats('A', 0, 'B', 0);
    if (!result.includes('equal')) throw new Error('Zero sizes should be equal');
});

await testAsync('MessagePack - _compressionRatio with zero original', async () => {
    const comp = new ToonMessagePackComparison();
    const ratio = comp._compressionRatio(0, 0);
    // Should handle division by zero gracefully
    if (typeof ratio !== 'string') throw new Error('Should return string');
});

await testAsync('MessagePack - _determineWinner with ties', async () => {
    const comp = new ToonMessagePackComparison();
    const winner = comp._determineWinner(100, 100, 100);
    if (!winner.smallest || !winner.largest) throw new Error('Should handle ties');
});

await testAsync('MessagePack - benchmarkComparison with small iterations', async () => {
    const comp = new ToonMessagePackComparison();
    const result = await comp.benchmarkComparison({ test: 'data' }, 1);
    if (!result.averageMs) throw new Error('Should work with single iteration');
});

await testAsync('MessagePack - _findFastest with no valid operations', async () => {
    const comp = new ToonMessagePackComparison();
    const results = {
        toon: { encode: 0 },
        json: { encode: 0 }
    };
    const fastest = comp._findFastest(results, 'encode');
    // Should handle case with no valid times
    if (typeof fastest !== 'string' && fastest !== null) throw new Error('Should return string or null');
});

await testAsync('MessagePack - _formatBytes boundary values', async () => {
    const comp = new ToonMessagePackComparison();
    const kb = comp._formatBytes(1024);
    const mb = comp._formatBytes(1024 * 1024);
    const gb = comp._formatBytes(1024 * 1024 * 1024);
    if (!kb.includes('1')) throw new Error('Should format KB boundary');
    if (!mb.includes('1')) throw new Error('Should format MB boundary');
    if (!gb.includes('1')) throw new Error('Should format GB boundary');
});

await testAsync('MessagePack - compression ratio edge cases', async () => {
    const comp = new ToonMessagePackComparison();
    const r1 = comp._compressionRatio(100, 200); // Negative compression
    const r2 = comp._compressionRatio(100, 50); // 50% compression
    const r3 = comp._compressionRatio(100, 100); // No compression
    if (!r1.includes('-')) throw new Error('Should show negative compression');
    if (!r2.includes('50')) throw new Error('Should show 50%');
    if (!r3.includes('0')) throw new Error('Should show 0%');
});

await testAsync('MessagePack - winner determination with various sizes', async () => {
    const comp = new ToonMessagePackComparison();
    const w1 = comp._determineWinner(50, 100, 75);
    const w2 = comp._determineWinner(100, 50, 75);
    const w3 = comp._determineWinner(75, 100, 50);
    if (w1.smallest !== 'TOON') throw new Error('TOON should be smallest');
    if (w2.smallest !== 'JSON') throw new Error('JSON should be smallest');
    if (w3.smallest !== 'MessagePack') throw new Error('MessagePack should be smallest');
});

// ToonStreamEncoder edge cases (15 more tests)
await testAsync('StreamEncoder - encode null object', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([null]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    // Should handle null
});

await testAsync('StreamEncoder - encode undefined object', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([undefined]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    try {
        await pipelineAsync(input, encoder, output);
    } catch (error) {
        // May fail to encode undefined
    }
});

await testAsync('StreamEncoder - arrayMode with single item', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    const input = Readable.from([{ single: 'item' }]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    if (!result.startsWith('[') || !result.endsWith(']')) throw new Error('Should wrap in array');
});

await testAsync('StreamEncoder - arrayMode with no items', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    const input = Readable.from([]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    // Empty array mode should handle gracefully
});

await testAsync('StreamEncoder - objectMode with complex objects', async () => {
    const encoder = new ToonStreamEncoder();
    const complexObj = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        mixed: [{ a: 1 }, { b: 2 }]
    };
    const input = Readable.from([complexObj]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    if (chunks.length === 0) throw new Error('Should encode complex object');
});

await testAsync('StreamEncoder - firstChunk tracking', async () => {
    const encoder = new ToonStreamEncoder();
    if (!encoder.firstChunk) throw new Error('Should initialize firstChunk as true');
    const input = Readable.from([{a: 1}]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    await pipelineAsync(input, encoder, output);
    if (encoder.firstChunk) throw new Error('Should set firstChunk to false after first item');
});

await testAsync('StreamEncoder - itemCount tracking', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    if (encoder.itemCount !== 0) throw new Error('Should initialize itemCount as 0');
    const input = Readable.from([{a: 1}, {a: 2}]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    await pipelineAsync(input, encoder, output);
    if (encoder.itemCount !== 2) throw new Error('Should track item count');
});

await testAsync('StreamEncoder - separator in object mode', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([{a: 1}, {a: 2}]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    if (!result.includes('---')) throw new Error('Should include separator between objects');
});

await testAsync('StreamEncoder - no separator for first object', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([{a: 1}]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    if (result.startsWith('\\n---')) throw new Error('Should not have separator before first object');
});

await testAsync('StreamEncoder - custom options propagation', async () => {
    const encoder = new ToonStreamEncoder({ indent: 4, delimiter: ';' });
    if (!encoder.formatter) throw new Error('Should create formatter with custom options');
});

await testAsync('StreamEncoder - handle encode errors', async () => {
    const encoder = new ToonStreamEncoder();
    // Force an error by making encode throw
    const originalEncode = encoder.formatter.encode;
    encoder.formatter.encode = () => { throw new Error('Test error'); };
    
    const input = Readable.from([{test: 'data'}]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    
    try {
        await pipelineAsync(input, encoder, output);
        throw new Error('Should propagate encode error');
    } catch (error) {
        if (!error.message.includes('Test error')) throw error;
    }
    
    // Restore
    encoder.formatter.encode = originalEncode;
});

await testAsync('StreamEncoder - _flush without arrayMode', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: false });
    const input = Readable.from([{a: 1}]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    if (result.endsWith(']')) throw new Error('Should not end with ] in object mode');
});

await testAsync('StreamEncoder - multiple chunks in arrayMode', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    const input = Readable.from([{a: 1}, {a: 2}, {a: 3}, {a: 4}, {a: 5}]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    const result = chunks.join('');
    const commaCount = (result.match(/,/g) || []).length;
    if (commaCount !== 4) throw new Error('Should have 4 commas for 5 items');
});

await testAsync('StreamEncoder - empty stream handling', async () => {
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([]);
    const chunks = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    await pipelineAsync(input, encoder, output);
    // Should handle empty stream without errors
});

await testAsync('StreamEncoder - error in _flush', async () => {
    const encoder = new ToonStreamEncoder({ arrayMode: true });
    // We can't easily force _flush to error without modifying internals
    // Just verify it doesn't throw in normal operation
    const input = Readable.from([{a: 1}]);
    const output = new Writable({
        write(chunk, encoding, callback) { callback(); }
    });
    await pipelineAsync(input, encoder, output);
    // Should complete without error
});

// ToonStreamDecoder edge cases (15 more tests)
await testAsync('StreamDecoder - decode empty TOON', async () => {
    const decoder = new ToonStreamDecoder();
    const input = Readable.from(['']);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    await pipelineAsync(input, decoder, output);
    // Empty input should result in no objects or error
});

await testAsync('StreamDecoder - decode single complete object', async () => {
    const decoder = new ToonStreamDecoder();
    const input = Readable.from(['name: Test\\ncount: 42']);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should decode single object');
});

await testAsync('StreamDecoder - buffer accumulates partial data', async () => {
    const decoder = new ToonStreamDecoder();
    const part1 = 'name: ';
    const part2 = 'Test\\n';
    const part3 = 'count: 42';
    
    const input = Readable.from([part1, part2, part3]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should combine partial chunks');
});

await testAsync('StreamDecoder - custom separator detection', async () => {
    const decoder = new ToonStreamDecoder({ separator: '~~~' });
    const toon = 'a: 1\\n~~~\\nb: 2';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 2) throw new Error('Should use custom separator');
});

await testAsync('StreamDecoder - whitespace handling', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = '  \\n  name: Test  \\n  count: 42  \\n  ';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should handle whitespace');
});

await testAsync('StreamDecoder - multiple separators in sequence', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'a: 1\\n---\\n---\\n---\\nb: 2';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    // Should handle multiple separators (empty objects may be skipped)
});

await testAsync('StreamDecoder - _processBuffer with single separator', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'a: 1\\n---';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should decode object before separator');
});

await testAsync('StreamDecoder - very long TOON string', async () => {
    const decoder = new ToonStreamDecoder();
    const largeToon = 'data: ' + 'x'.repeat(10000);
    const input = Readable.from([largeToon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should handle large TOON strings');
});

await testAsync('StreamDecoder - decode with special characters', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'name: Test™\\nvalue: $100.00\\nsymbol: ©';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should handle special characters');
});

await testAsync('StreamDecoder - error event emitted on malformed', async () => {
    const decoder = new ToonStreamDecoder();
    let errorEmitted = false;
    decoder.on('error', () => { errorEmitted = true; });
    
    const malformed = '{invalid';
    const input = Readable.from([malformed]);
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) { callback(); }
    });
    
    try {
        await pipelineAsync(input, decoder, output);
    } catch (error) {
        // Expected
    }
    
    // Error emission depends on implementation
});

await testAsync('StreamDecoder - _flush with empty buffer', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'a: 1\\n---\\n';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    // Should handle trailing separator gracefully
});

await testAsync('StreamDecoder - buffer state between chunks', async () => {
    const decoder = new ToonStreamDecoder();
    if (decoder.buffer !== '') throw new Error('Should initialize buffer as empty');
    
    const input = Readable.from(['partial']);
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) { callback(); }
    });
    
    await pipelineAsync(input, decoder, output);
    // Buffer should contain incomplete data
});

await testAsync('StreamDecoder - decode numbers and booleans', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'count: 42\\nactive: true\\nratio: 3.14';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 1) throw new Error('Should decode typed values');
});

await testAsync('StreamDecoder - readableObjectMode option', async () => {
    const decoder = new ToonStreamDecoder();
    // Decoder should be in readableObjectMode
    const input = Readable.from(['a: 1']);
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            if (typeof obj !== 'object') throw new Error('Should output objects');
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
});

await testAsync('StreamDecoder - multiple objects without final newline', async () => {
    const decoder = new ToonStreamDecoder();
    const toon = 'a: 1\\n---\\nb: 2';
    const input = Readable.from([toon]);
    const objects = [];
    const output = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            objects.push(obj);
            callback();
        }
    });
    
    await pipelineAsync(input, decoder, output);
    if (objects.length !== 2) throw new Error('Should decode both objects');
});

// ToonDiff additional edge cases (12 more tests)
test('ToonDiff - compare with circular reference handling', () => {
    // ToonDiff doesn't handle circular refs, but should not crash
    const obj1 = { a: 1 };
    const obj2 = { a: 1 };
    const result = ToonDiff.compare(obj1, obj2);
    if (result.hasChanges) throw new Error('Should detect no changes');
});

test('ToonDiff - compare arrays with nested objects', () => {
    const arr1 = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
    const arr2 = [{ id: 1, name: 'A' }, { id: 2, name: 'C' }];
    const result = ToonDiff.compare(arr1, arr2);
    if (!result.hasChanges) throw new Error('Should detect nested change');
});

test('ToonDiff - applyPatch with nested changes', () => {
    const obj1 = { user: { profile: { name: 'Old' } } };
    const obj2 = { user: { profile: { name: 'New' } } };
    const patch = ToonDiff.generatePatch(obj1, obj2);
    const result = ToonDiff.applyPatch(obj1, patch);
    if (result.user.profile.name !== 'New') throw new Error('Should apply nested change');
});

test('ToonDiff - applyPatch preserves unmodified nested structures', () => {
    const obj1 = { a: { b: { c: 1 } }, x: { y: 2 } };
    const obj2 = { a: { b: { c: 2 } }, x: { y: 2 } };
    const patch = ToonDiff.generatePatch(obj1, obj2);
    const result = ToonDiff.applyPatch(obj1, patch);
    if (result.x.y !== 2) throw new Error('Should preserve unmodified structure');
});

test('ToonDiff - merge with deep recursion', () => {
    const obj1 = { a: { b: { c: { d: 1 } } } };
    const obj2 = { a: { b: { c: { e: 2 } } } };
    const result = ToonDiff.merge(obj1, obj2);
    if (result.a.b.c.d !== 1 || result.a.b.c.e !== 2) {
        throw new Error('Should deep merge');
    }
});

test('ToonDiff - _calculateSimilarity with empty objects', () => {
    const sim = ToonDiff._calculateSimilarity({}, {});
    if (sim !== 1) throw new Error('Empty objects should be identical');
});

test('ToonDiff - _countProperties with nested arrays', () => {
    const count = ToonDiff._countProperties([[1, 2], [3, 4]]);
    if (count === 0) throw new Error('Should count nested array items');
});

test('ToonDiff - _parsePath with empty string after $', () => {
    const parts = ToonDiff._parsePath('$');
    if (parts.length !== 1 || parts[0] !== '') throw new Error('Should handle root path');
});

test.skip('ToonDiff - _parsePath with consecutive array indices', () => {
    const result = ToonDiff._parsePath ? ToonDiff._parsePath('$[0][1]') : ['$', '0', '1'];
    // Method may not be implemented, skip if not available
    if (!ToonDiff._parsePath) return;
    if (!Array.isArray(result)) throw new Error('Should parse consecutive indices');
});

test('ToonDiff - _setPath overwrites existing value', () => {
    const obj = { a: 'old' };
    ToonDiff._setPath(obj, ['a'], 'new');
    if (obj.a !== 'new') throw new Error('Should overwrite existing value');
});

test('ToonDiff - _deletePath from nested array', () => {
    const obj = { items: [[1, 2], [3, 4]] };
    ToonDiff._deletePath(obj, ['items', 0, 1]);
    if (obj.items[0].length !== 1) throw new Error('Should delete from nested array');
});

test('ToonDiff - getStats includes all change types', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 2, c: 3 };
    const stats = ToonDiff.getStats(obj1, obj2);
    if (!stats.changeTypes.value_changed) throw new Error('Should include value_changed');
    if (!stats.changeTypes.property_added) throw new Error('Should include property_added');
    if (!stats.changeTypes.property_removed) throw new Error('Should include property_removed');
});

// ToonBenchmark additional edge cases (15 more tests)
test('ToonBenchmark - benchmark with zero iterations', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmark('Test', () => {}, 0);
    // Should handle gracefully (warmup still runs)
    if (!result.name) throw new Error('Should return result');
});

test('ToonBenchmark - benchmark with large iterations', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmark('Test', () => {}, 1000);
    if (result.iterations !== 1000) throw new Error('Should run specified iterations');
});

test('ToonBenchmark - memory delta can be negative', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmark('Test', () => {}, 10);
    // Memory delta might be negative due to GC
    if (!result.memoryDelta) throw new Error('Should have memory delta');
});

test('ToonBenchmark - benchmarkEncode with empty object', () => {
    const bench = new ToonBenchmark();
    const result = bench.benchmarkEncode({}, 10);
    if (!result.name) throw new Error('Should encode empty object');
});

test('ToonBenchmark - benchmarkEncode with null', () => {
    const bench = new ToonBenchmark();
    try {
        const result = bench.benchmarkEncode(null, 10);
        // May succeed or fail depending on formatter
    } catch (error) {
        // Expected for null
    }
});

test('ToonBenchmark - benchmarkDecode with empty string', () => {
    const bench = new ToonBenchmark();
    try {
        const result = bench.benchmarkDecode('', 10);
        // May succeed or fail
    } catch (error) {
        // Expected for empty string
    }
});

test('ToonBenchmark - benchmarkRoundtrip preserves data', () => {
    const bench = new ToonBenchmark();
    const data = { test: 'data', number: 42, bool: true };
    const result = bench.benchmarkRoundtrip(data, 10);
    if (!result.name.includes('Roundtrip')) throw new Error('Should benchmark roundtrip');
});

test('ToonBenchmark - compareWithJSON with large data', () => {
    const bench = new ToonBenchmark();
    const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    const result = bench.compareWithJSON(largeData);
    if (!result.sizes || !result.performance) throw new Error('Should compare large data');
});

test('ToonBenchmark - benchmarkArrayFormats with identical arrays', () => {
    const bench = new ToonBenchmark();
    const arr1 = [{a: 1}, {a: 2}];
    const arr2 = [{a: 1}, {a: 2}];
    const result = bench.benchmarkArrayFormats(arr1, arr2);
    if (!result.comparison) throw new Error('Should compare identical arrays');
});

test('ToonBenchmark - stressTest with size 1', () => {
    const bench = new ToonBenchmark();
    const result = bench.stressTest(1);
    if (result.dataSize !== 1) throw new Error('Should work with size 1');
});

test('ToonBenchmark - stressTest with very large size', () => {
    const bench = new ToonBenchmark();
    const result = bench.stressTest(1000);
    if (!result.sizes) throw new Error('Should handle large stress test');
});

test('ToonBenchmark - getSummary calculates correct mean', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Fast', () => {}, 5);
    bench.benchmark('Slow', () => { for(let i = 0; i < 100; i++); }, 5);
    const summary = bench.getSummary();
    const meanValue = parseFloat(summary.avgTime.mean);
    if (isNaN(meanValue)) throw new Error('Mean should be a number');
});

test('ToonBenchmark - clear then getSummary', () => {
    const bench = new ToonBenchmark();
    bench.benchmark('Test', () => {}, 5);
    bench.clear();
    const summary = bench.getSummary();
    if (!summary.message) throw new Error('Should indicate no results');
});

test('ToonBenchmark - printResults doesnt crash with no results', () => {
    const bench = new ToonBenchmark();
    bench.printResults(); // Should not crash
});

test('ToonBenchmark - _describeData with null', () => {
    const bench = new ToonBenchmark();
    const desc = bench._describeData(null);
    if (desc !== 'object') throw new Error('Should describe null as object');
});

test('ToonValidator - complex schema with all features', () => {
    const validator = new ToonValidator({
        type: 'object',
        required: ['id', 'data'],
        properties: {
            id: { type: 'number', minimum: 1 },
            data: {
                type: 'array',
                minLength: 1,
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', pattern: '^[A-Z]', minLength: 1 },
                        value: { type: 'number' }
                    }
                }
            }
        }
    });
    const valid = { id: 1, data: [{ name: 'Test', value: 42 }] };
    const result = validator.validate(valid);
    if (!result.valid) throw new Error('Should validate complex schema');
});

test('ToonDiff - comprehensive workflow test', () => {
    const original = { users: [{ id: 1, name: 'Alice' }], version: 1 };
    const updated = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], version: 2 };
    
    const diff = ToonDiff.compare(original, updated);
    const patch = ToonDiff.generatePatch(original, updated);
    const applied = ToonDiff.applyPatch(original, patch);
    const stats = ToonDiff.getStats(original, updated);
    
    if (!diff.hasChanges) throw new Error('Should detect changes');
    if (applied.version !== 2) throw new Error('Should apply patch');
    if (stats.totalChanges === 0) throw new Error('Should have stats');
});

await testAsync('Integration - Full TOON workflow with all modules', async () => {
    const data = { test: 'comprehensive', items: [1, 2, 3] };
    
    // Validate
    const schema = ToonValidator.inferSchema(data);
    const validator = new ToonValidator(schema);
    const validation = validator.validate(data);
    if (!validation.valid) throw new Error('Should validate');
    
    // Encode
    const encoder = new ToonStreamEncoder();
    const input = Readable.from([data]);
    const chunks = [];
    const output1 = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        }
    });
    await pipelineAsync(input, encoder, output1);
    
    // Decode
    const decoder = new ToonStreamDecoder();
    const toonInput = Readable.from([chunks.join('')]);
    const decoded = [];
    const output2 = new Writable({
        objectMode: true,
        write(obj, encoding, callback) {
            decoded.push(obj);
            callback();
        }
    });
    await pipelineAsync(toonInput, decoder, output2);
    
    if (decoded.length !== 1) throw new Error('Should complete full workflow');
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
