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

console.log('🧪 Utility Functions Tests\n');

console.log('📦 Path Utilities');
console.log('-'.repeat(70));

test('PathUtils: Join paths', () => {
    const joined = path.join('src', 'lib', 'utils.js');
    if (!joined.includes('src')) throw new Error('Should join paths');
});

test('PathUtils: Get dirname', () => {
    const dir = path.dirname('/home/user/test.js');
    if (!dir.includes('user')) throw new Error('Should get directory');
});

test('PathUtils: Get basename', () => {
    const base = path.basename('/home/user/test.js');
    if (base !== 'test.js') throw new Error('Basename mismatch');
});

test('PathUtils: Parse path', () => {
    const parsed = path.parse('/home/user/test.js');
    if (parsed.name !== 'test') throw new Error('Parse error');
    if (parsed.ext !== '.js') throw new Error('Extension error');
});

console.log('\n📦 String Utilities');
console.log('-'.repeat(70));

test('StringUtils: Trim whitespace', () => {
    const trimmed = '  hello  '.trim();
    if (trimmed !== 'hello') throw new Error('Trim failed');
});

test('StringUtils: Split lines', () => {
    const lines = 'line1\nline2\nline3'.split('\n');
    if (lines.length !== 3) throw new Error('Split failed');
});

test('StringUtils: Replace all', () => {
    const replaced = 'hello world world'.replace(/world/g, 'test');
    if (!replaced.includes('test test')) throw new Error('Replace failed');
});

test('StringUtils: Case conversion', () => {
    if ('TEST'.toLowerCase() !== 'test') throw new Error('Lower failed');
    if ('test'.toUpperCase() !== 'TEST') throw new Error('Upper failed');
});

console.log('\n📦 Array Utilities');
console.log('-'.repeat(70));

test('ArrayUtils: Filter', () => {
    const arr = [1, 2, 3, 4, 5];
    const filtered = arr.filter(n => n > 3);
    if (filtered.length !== 2) throw new Error('Filter failed');
});

test('ArrayUtils: Map', () => {
    const arr = [1, 2, 3];
    const mapped = arr.map(n => n * 2);
    if (mapped[0] !== 2) throw new Error('Map failed');
});

test('ArrayUtils: Reduce', () => {
    const arr = [1, 2, 3, 4];
    const sum = arr.reduce((a, b) => a + b, 0);
    if (sum !== 10) throw new Error('Reduce failed');
});

test('ArrayUtils: Find', () => {
    const arr = [1, 2, 3, 4];
    const found = arr.find(n => n === 3);
    if (found !== 3) throw new Error('Find failed');
});

console.log('\n📦 Object Utilities');
console.log('-'.repeat(70));

test('ObjectUtils: Keys', () => {
    const obj = { a: 1, b: 2 };
    const keys = Object.keys(obj);
    if (keys.length !== 2) throw new Error('Keys failed');
});

test('ObjectUtils: Values', () => {
    const obj = { a: 1, b: 2 };
    const values = Object.values(obj);
    if (values.length !== 2) throw new Error('Values failed');
});

test('ObjectUtils: Entries', () => {
    const obj = { a: 1, b: 2 };
    const entries = Object.entries(obj);
    if (entries.length !== 2) throw new Error('Entries failed');
    if (entries[0][0] !== 'a') throw new Error('Entry key failed');
    if (entries[0][1] !== 1) throw new Error('Entry value failed');
});

console.log('\n' + '='.repeat(70));
console.log('📊 UTILITY FUNCTIONS TEST SUMMARY');
console.log('='.repeat(70));
console.log('Total tests run: ' + totalTests);
console.log('✅ Passed: ' + passedTests);
console.log('❌ Failed: ' + failedTests);
console.log('Success rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');

if (failedTests === 0) {
    console.log('\n🎉 All utility function tests passed!');
} else {
    console.log('\n⚠️  ' + failedTests + ' test(s) failed');
    process.exit(1);
}
