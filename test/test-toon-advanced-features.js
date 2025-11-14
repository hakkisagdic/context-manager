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
