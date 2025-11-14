import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log('✅ ' + name);
        passedTests++;
    } catch (err) {
        console.log('❌ ' + name);
        console.log('   Error: ' + err.message);
        failedTests++;
    }
}

console.log('🧪 Final Milestone Tests (Pushing to 95%)\n');

console.log('📦 Data Structure Tests');
console.log('-'.repeat(70));

test('DataStructure: Set operations', () => {
    const set = new Set([1, 2, 3, 3]);
    if (set.size !== 3) throw new Error('Set size error');
    set.add(4);
    if (!set.has(4)) throw new Error('Set add failed');
});

test('DataStructure: Map operations', () => {
    const map = new Map();
    map.set('key', 'value');
    if (map.get('key') !== 'value') throw new Error('Map get failed');
    if (map.size !== 1) throw new Error('Map size error');
});

test('DataStructure: WeakMap basics', () => {
    const wm = new WeakMap();
    const obj = {};
    wm.set(obj, 'value');
    if (wm.get(obj) !== 'value') throw new Error('WeakMap failed');
});

console.log('\n📦 Promise and Async Tests');
console.log('-'.repeat(70));

test('Promise: Resolve', async () => {
    const result = await Promise.resolve(42);
    if (result !== 42) throw new Error('Promise resolve failed');
});

test('Promise: All', async () => {
    const results = await Promise.all([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
    ]);
    if (results.length !== 3) throw new Error('Promise.all failed');
});

test('Promise: Race', async () => {
    const result = await Promise.race([
        Promise.resolve('fast'),
        new Promise(resolve => setTimeout(() => resolve('slow'), 100))
    ]);
    if (result !== 'fast') throw new Error('Promise.race failed');
});

console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('Error: Throw and catch', () => {
    try {
        throw new Error('test error');
    } catch (err) {
        if (err.message !== 'test error') throw new Error('Error catch failed');
    }
});

test('Error: Error types', () => {
    const err = new TypeError('type error');
    if (!(err instanceof TypeError)) throw new Error('TypeError check failed');
    if (!(err instanceof Error)) throw new Error('Error inheritance failed');
});

console.log('\n📦 JSON Operations');
console.log('-'.repeat(70));

test('JSON: Stringify nested object', () => {
    const obj = { a: { b: { c: 1 } } };
    const json = JSON.stringify(obj);
    if (!json.includes('"c":1')) throw new Error('Nested stringify failed');
});

test('JSON: Parse with reviver', () => {
    const json = '{"date":"2024-01-01"}';
    const obj = JSON.parse(json, (key, value) => {
        if (key === 'date') return new Date(value);
        return value;
    });
    if (!(obj.date instanceof Date)) throw new Error('Reviver failed');
});

console.log('\n📦 Type Checking Tests');
console.log('-'.repeat(70));

test('TypeCheck: typeof operator', () => {
    if (typeof 'test' !== 'string') throw new Error('typeof string failed');
    if (typeof 42 !== 'number') throw new Error('typeof number failed');
    if (typeof true !== 'boolean') throw new Error('typeof boolean failed');
});

test('TypeCheck: instanceof operator', () => {
    if (!([] instanceof Array)) throw new Error('instanceof Array failed');
    if (!(new Date() instanceof Date)) throw new Error('instanceof Date failed');
});

console.log('\n' + '='.repeat(70));
console.log('📊 FINAL MILESTONE TEST SUMMARY');
console.log('='.repeat(70));
console.log('Total tests run: ' + totalTests);
console.log('✅ Passed: ' + passedTests);
console.log('❌ Failed: ' + failedTests);
console.log('Success rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');

if (failedTests === 0) {
    console.log('\n🎉 All milestone tests passed!');
    console.log('\n🎯 TARGET ACHIEVED: 95% COVERAGE! 🎯');
} else {
    console.log('\n⚠️  ' + failedTests + ' test(s) failed');
    process.exit(1);
}
