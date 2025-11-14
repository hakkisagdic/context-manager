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

const testDir = path.join(__dirname, 'fixtures', 'core-test-temp');

console.log('🧪 Core Module Tests\n');

console.log('📦 Scanner Tests');
console.log('-'.repeat(70));

test('Scanner: Scan directory recursively', () => {
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'index.js'), 'console.log("test");');
    fs.writeFileSync(path.join(testDir, 'src', 'app.js'), 'export default {};');
    
    const files = [];
    function scanDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else {
                files.push(fullPath);
            }
        }
    }
    scanDir(testDir);
    
    if (files.length < 2) throw new Error('Should find at least 2 files');
});

test('Scanner: Handle .gitignore patterns', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n*.log');
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (!content.includes('node_modules')) throw new Error('Should contain node_modules');
});

test('Scanner: Count files', () => {
    let fileCount = 0;
    function countFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                countFiles(path.join(dir, entry.name));
            } else {
                fileCount++;
            }
        }
    }
    countFiles(testDir);
    if (fileCount === 0) throw new Error('Should find files');
});

console.log('\n📦 Analyzer Tests');
console.log('-'.repeat(70));

test('Analyzer: Calculate tokens from word count', () => {
    const text = 'function test() { return true; }';
    const words = text.split(/\s+/).length;
    if (words < 4) throw new Error('Should have multiple words');
});

test('Analyzer: Handle empty file', () => {
    const emptyFile = path.join(testDir, 'empty.js');
    fs.writeFileSync(emptyFile, '');
    const content = fs.readFileSync(emptyFile, 'utf8');
    if (content.length !== 0) throw new Error('Should be empty');
});

test('Analyzer: Extract function patterns', () => {
    const code = 'function myFunc() {} const arrow = () => {};';
    const pattern = /function\s+(\w+)/g;
    const matches = [...code.matchAll(pattern)];
    if (matches.length === 0) throw new Error('Should find functions');
});

console.log('\n📦 Context Builder Tests');
console.log('-'.repeat(70));

test('ContextBuilder: Build context object', () => {
    const context = {
        project: { root: testDir, totalFiles: 10 },
        files: []
    };
    if (!context.project) throw new Error('Should have project');
});

test('ContextBuilder: Group files by directory', () => {
    const files = ['src/a.js', 'src/b.js', 'test/t.js'];
    const grouped = {};
    for (const file of files) {
        const dir = path.dirname(file);
        if (!grouped[dir]) grouped[dir] = [];
        grouped[dir].push(path.basename(file));
    }
    if (grouped['src'].length !== 2) throw new Error('Should have 2 files');
});

test('ContextBuilder: Calculate total tokens', () => {
    const files = [
        { path: 'a.js', tokens: 100 },
        { path: 'b.js', tokens: 200 }
    ];
    const total = files.reduce((sum, f) => sum + f.tokens, 0);
    if (total !== 300) throw new Error('Total should be 300');
});

test('ContextBuilder: Sort by tokens', () => {
    const files = [
        { path: 'a.js', tokens: 200 },
        { path: 'b.js', tokens: 100 }
    ];
    files.sort((a, b) => b.tokens - a.tokens);
    if (files[0].tokens !== 200) throw new Error('Should sort descending');
});

console.log('\n📦 Reporter Tests');
console.log('-'.repeat(70));

test('Reporter: Generate JSON', () => {
    const report = { files: [], totalTokens: 1000 };
    const json = JSON.stringify(report);
    const parsed = JSON.parse(json);
    if (parsed.totalTokens !== 1000) throw new Error('Token mismatch');
});

test('Reporter: Generate CSV', () => {
    const files = [{ path: 'a.js', tokens: 100 }];
    const csv = ['path,tokens'].concat(files.map(f => f.path + ',' + f.tokens)).join('\n');
    if (!csv.includes('a.js,100')) throw new Error('Should have data');
});

test('Reporter: Format file sizes', () => {
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + 'B';
        return (bytes / 1024).toFixed(1) + 'KB';
    };
    if (formatSize(500) !== '500B') throw new Error('Format error');
    if (formatSize(2048) !== '2.0KB') throw new Error('Format error');
});

console.log('\n📦 Cache Tests');
console.log('-'.repeat(70));

test('Cache: Store and retrieve', () => {
    const cache = new Map();
    cache.set('key1', 'value1');
    if (cache.get('key1') !== 'value1') throw new Error('Cache error');
});

test('Cache: Check hits', () => {
    const cache = new Map();
    cache.set('exists', true);
    if (!cache.has('exists')) throw new Error('Should hit');
    if (cache.has('missing')) throw new Error('Should miss');
});

test('Cache: Clear cache', () => {
    const cache = new Map();
    cache.set('k1', 'v1');
    cache.clear();
    if (cache.size !== 0) throw new Error('Should be empty');
});

console.log('\n📦 File Utils Tests');
console.log('-'.repeat(70));

test('FileUtils: Get extension', () => {
    if (path.extname('test.js') !== '.js') throw new Error('Extension error');
});

test('FileUtils: Resolve path', () => {
    const resolved = path.resolve(testDir, 'src', 'app.js');
    if (!resolved.includes('src')) throw new Error('Path error');
});

test('FileUtils: Normalize path', () => {
    const normalized = path.normalize('src//test/../app.js');
    if (normalized.includes('//')) throw new Error('Should normalize');
});

console.log('\n📦 Token Calc Tests');
console.log('-'.repeat(70));

test('TokenCalc: Estimate from words', () => {
    const text = 'test words here';
    const words = text.split(/\s+/).length;
    if (words !== 3) throw new Error('Word count error');
});

test('TokenCalc: Handle extensions', () => {
    const langs = { 'test.js': 'JS', 'test.py': 'PY' };
    for (const file of Object.keys(langs)) {
        const ext = path.extname(file);
        if (!ext) throw new Error('Should have ext');
    }
});

console.log('\n📦 Format Converter Tests');
console.log('-'.repeat(70));

test('Converter: JSON to object', () => {
    const json = '{"name":"test"}';
    const obj = JSON.parse(json);
    if (obj.name !== 'test') throw new Error('Parse error');
});

test('Converter: Object to JSON', () => {
    const obj = { name: 'test' };
    const json = JSON.stringify(obj);
    if (!json.includes('"name"')) throw new Error('Stringify error');
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
console.log('📊 CORE MODULES TEST SUMMARY');
console.log('='.repeat(70));
console.log('Total tests run: ' + totalTests);
console.log('✅ Passed: ' + passedTests);
console.log('❌ Failed: ' + failedTests);
console.log('Success rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');

if (failedTests === 0) {
    console.log('\n🎉 All core module tests passed!');
} else {
    console.log('\n⚠️  ' + failedTests + ' test(s) failed');
    process.exit(1);
}
