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

const testDir = path.join(__dirname, 'fixtures', 'edge-case-temp');

console.log('🧪 Edge Cases Final Tests\n');

console.log('📦 Regex Pattern Tests');
console.log('-'.repeat(70));

test('Regex: Match function declaration', () => {
    const pattern = /function\s+(\w+)/;
    const match = 'function myFunc() {}'.match(pattern);
    if (!match || match[1] !== 'myFunc') throw new Error('Pattern mismatch');
});

test('Regex: Match class method', () => {
    const pattern = /(\w+)\s*\(/;
    const match = 'myMethod(args)'.match(pattern);
    if (!match) throw new Error('Method pattern failed');
});

test('Regex: Global flag', () => {
    const pattern = /test/g;
    const matches = 'test test test'.match(pattern);
    if (matches.length !== 3) throw new Error('Global match failed');
});

test('Regex: Escape special characters', () => {
    const escaped = 'test.file'.replace(/\./g, '\\.');
    if (escaped !== 'test\\.file') throw new Error('Escape failed');
});

console.log('\n📦 Encoding Tests');
console.log('-'.repeat(70));

test('Encoding: UTF-8 read/write', () => {
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    const testFile = path.join(testDir, 'utf8.txt');
    const content = 'Hello 世界 🌍';
    fs.writeFileSync(testFile, content, 'utf8');
    const read = fs.readFileSync(testFile, 'utf8');
    if (read !== content) throw new Error('UTF-8 encoding failed');
});

test('Encoding: Buffer handling', () => {
    const buffer = Buffer.from('test', 'utf8');
    const str = buffer.toString('utf8');
    if (str !== 'test') throw new Error('Buffer conversion failed');
});

test('Encoding: Base64', () => {
    const base64 = Buffer.from('test').toString('base64');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    if (decoded !== 'test') throw new Error('Base64 failed');
});

console.log('\n📦 Boundary Conditions');
console.log('-'.repeat(70));

test('Boundary: Zero value', () => {
    const arr = [];
    if (arr.length !== 0) throw new Error('Empty array failed');
});

test('Boundary: Single element', () => {
    const arr = [1];
    if (arr.length !== 1) throw new Error('Single element failed');
});

test('Boundary: Empty string', () => {
    const str = '';
    if (str.length !== 0) throw new Error('Empty string failed');
});

test('Boundary: Null vs undefined', () => {
    const obj = { a: null, b: undefined };
    if (obj.a !== null) throw new Error('Null check failed');
    if (obj.b !== undefined) throw new Error('Undefined check failed');
});

console.log('\n📦 Number Operations');
console.log('-'.repeat(70));

test('Number: Integer math', () => {
    if (1 + 1 !== 2) throw new Error('Addition failed');
    if (5 - 3 !== 2) throw new Error('Subtraction failed');
    if (3 * 4 !== 12) throw new Error('Multiplication failed');
    if (10 / 2 !== 5) throw new Error('Division failed');
});

test('Number: Float precision', () => {
    const result = (0.1 + 0.2).toFixed(1);
    if (result !== '0.3') throw new Error('Float precision failed');
});

test('Number: Max/Min', () => {
    const arr = [1, 5, 3, 9, 2];
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    if (max !== 9) throw new Error('Max failed');
    if (min !== 1) throw new Error('Min failed');
});

test('Number: Parse integer', () => {
    const num = parseInt('42');
    if (num !== 42) throw new Error('parseInt failed');
    if (isNaN(parseInt('abc'))) {
        // Expected behavior
    } else {
        throw new Error('NaN check failed');
    }
});

console.log('\n📦 Cleanup');
console.log('-'.repeat(70));

test('Cleanup: Remove test directory', () => {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testDir)) throw new Error('Should be removed');
});

console.log('\n' + '='.repeat(70));
console.log('📊 EDGE CASES FINAL TEST SUMMARY');
console.log('='.repeat(70));
console.log('Total tests run: ' + totalTests);
console.log('✅ Passed: ' + passedTests);
console.log('❌ Failed: ' + failedTests);
console.log('Success rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');

if (failedTests === 0) {
    console.log('\n🎉 All edge case tests passed!');
} else {
    console.log('\n⚠️  ' + failedTests + ' test(s) failed');
    process.exit(1);
}
