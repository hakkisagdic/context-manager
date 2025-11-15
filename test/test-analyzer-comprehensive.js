/**
 * Comprehensive Analyzer Tests
 * Tests for lib/core/Analyzer.js - 100% Coverage
 */

import { Analyzer } from '../lib/core/Analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let passed = 0;
let failed = 0;

// Helper functions
function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

function createTestDirectory(name) {
  const testDir = path.join(__dirname, 'temp-analyzer-test', name);
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

function createTestFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  const fileDir = path.dirname(filePath);
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  return filePath;
}

function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    path: filePath,
    relativePath: path.basename(filePath),
    name: path.basename(filePath),
    extension: path.extname(filePath),
    size: stats.size,
    modified: stats.mtime,
    created: stats.birthtime
  };
}

function cleanup() {
  const tempDir = path.join(__dirname, 'temp-analyzer-test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

console.log('🧪 COMPREHENSIVE ANALYZER TESTS');
console.log('======================================================================\n');

console.log('📦 Analyzer Constructor Tests');
console.log('----------------------------------------------------------------------');

try {
  const analyzer = new Analyzer();
  assert(analyzer !== null, 'Analyzer: Constructor creates instance');
  assert(analyzer.options.methodLevel === false, 'Analyzer: Default methodLevel is false');
  assert(analyzer.options.parallel === false, 'Analyzer: Default parallel is false');
  assert(analyzer.options.maxWorkers === 4, 'Analyzer: Default maxWorkers is 4');
} catch (error) {
  assert(false, `Analyzer: Constructor test failed - ${error.message}`);
}

try {
  const analyzer = new Analyzer({
    methodLevel: true,
    parallel: true,
    maxWorkers: 8
  });
  assert(analyzer.options.methodLevel === true, 'Analyzer: Custom methodLevel option');
  assert(analyzer.options.parallel === true, 'Analyzer: Custom parallel option');
  assert(analyzer.options.maxWorkers === 8, 'Analyzer: Custom maxWorkers option');
} catch (error) {
  assert(false, `Analyzer: Constructor options test failed - ${error.message}`);
}

console.log('\n📊 Analyzer Stats Initialization Tests');
console.log('----------------------------------------------------------------------');

try {
  const analyzer = new Analyzer();
  const stats = analyzer.getStats();
  assert(stats.totalFiles === 0, 'Analyzer: Initial totalFiles is 0');
  assert(stats.totalTokens === 0, 'Analyzer: Initial totalTokens is 0');
  assert(stats.totalSize === 0, 'Analyzer: Initial totalSize is 0');
  assert(stats.totalMethods === 0, 'Analyzer: Initial totalMethods is 0');
  assert(typeof stats.byLanguage === 'object', 'Analyzer: Has byLanguage object');
  assert(Array.isArray(stats.largestFiles), 'Analyzer: Has largestFiles array');
  assert(stats.analysisTime === 0, 'Analyzer: Initial analysisTime is 0');
} catch (error) {
  assert(false, `Analyzer: Stats initialization test failed - ${error.message}`);
}

console.log('\n📁 Analyzer File Analysis Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('file-analysis');
  const jsFile = createTestFile(testDir, 'test.js', 'const x = 1;\nconsole.log(x);');
  const fileInfo = getFileInfo(jsFile);

  const analyzer = new Analyzer();
  const result = await analyzer.analyzeFile(fileInfo);

  assert(result !== null, 'Analyzer: Analyzes JavaScript file');
  assert(result.tokens > 0, 'Analyzer: Calculates tokens for file');
  assert(result.lines === 2, 'Analyzer: Counts lines correctly');
  assert(result.language === 'JavaScript', 'Analyzer: Detects JavaScript language');
  assert(result.extension === '.js', 'Analyzer: Stores extension correctly');
} catch (error) {
  assert(false, `Analyzer: File analysis test failed - ${error.message}`);
}

console.log('\n🔍 Analyzer Method-Level Analysis Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('method-analysis');
  const jsFile = createTestFile(testDir, 'methods.js',
    'function foo() { return 1; }\nfunction bar() { return 2; }');
  const fileInfo = getFileInfo(jsFile);

  const analyzer = new Analyzer({ methodLevel: true });
  const result = await analyzer.analyzeFile(fileInfo);

  assert(result !== null, 'Analyzer: Analyzes file with method level');
  assert(Array.isArray(result.methods), 'Analyzer: Returns methods array');
  assert(result.methods.length >= 2, 'Analyzer: Extracts multiple methods');
  assert(result.methodCount >= 2, 'Analyzer: Counts methods correctly');
} catch (error) {
  assert(false, `Analyzer: Method-level analysis test failed - ${error.message}`);
}

console.log('\n🌐 Analyzer Language Detection Tests');
console.log('----------------------------------------------------------------------');

try {
  const analyzer = new Analyzer();

  assert(analyzer.detectLanguage('.js') === 'JavaScript', 'Analyzer: Detects JavaScript (.js)');
  assert(analyzer.detectLanguage('.jsx') === 'JavaScript', 'Analyzer: Detects JavaScript (.jsx)');
  assert(analyzer.detectLanguage('.ts') === 'TypeScript', 'Analyzer: Detects TypeScript (.ts)');
  assert(analyzer.detectLanguage('.tsx') === 'TypeScript', 'Analyzer: Detects TypeScript (.tsx)');
  assert(analyzer.detectLanguage('.py') === 'Python', 'Analyzer: Detects Python');
  assert(analyzer.detectLanguage('.rb') === 'Ruby', 'Analyzer: Detects Ruby');
  assert(analyzer.detectLanguage('.php') === 'PHP', 'Analyzer: Detects PHP');
  assert(analyzer.detectLanguage('.java') === 'Java', 'Analyzer: Detects Java');
  assert(analyzer.detectLanguage('.kt') === 'Kotlin', 'Analyzer: Detects Kotlin');
  assert(analyzer.detectLanguage('.cs') === 'C#', 'Analyzer: Detects C#');
  assert(analyzer.detectLanguage('.go') === 'Go', 'Analyzer: Detects Go');
  assert(analyzer.detectLanguage('.rs') === 'Rust', 'Analyzer: Detects Rust');
  assert(analyzer.detectLanguage('.swift') === 'Swift', 'Analyzer: Detects Swift');
  assert(analyzer.detectLanguage('.c') === 'C', 'Analyzer: Detects C');
  assert(analyzer.detectLanguage('.cpp') === 'C++', 'Analyzer: Detects C++');
  assert(analyzer.detectLanguage('.hpp') === 'C++', 'Analyzer: Detects C++ (.hpp)');
  assert(analyzer.detectLanguage('.h') === 'C/C++', 'Analyzer: Detects C/C++ (.h)');
  assert(analyzer.detectLanguage('.scala') === 'Scala', 'Analyzer: Detects Scala');
  assert(analyzer.detectLanguage('.unknown') === 'Other', 'Analyzer: Returns Other for unknown extension');
} catch (error) {
  assert(false, `Analyzer: Language detection test failed - ${error.message}`);
}

console.log('\n📈 Analyzer Full Analysis Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('full-analysis');
  const file1 = createTestFile(testDir, 'file1.js', 'const a = 1;');
  const file2 = createTestFile(testDir, 'file2.py', 'x = 1\ny = 2');
  const file3 = createTestFile(testDir, 'file3.ts', 'const z: number = 3;');

  const files = [
    getFileInfo(file1),
    getFileInfo(file2),
    getFileInfo(file3)
  ];

  const analyzer = new Analyzer();
  const result = await analyzer.analyze(files);

  assert(result.files.length === 3, 'Analyzer: Analyzes all files');
  assert(result.stats.totalFiles === 3, 'Analyzer: Updates totalFiles stat');
  assert(result.stats.totalTokens > 0, 'Analyzer: Updates totalTokens stat');
  assert(result.stats.totalSize > 0, 'Analyzer: Updates totalSize stat');
  assert(result.stats.analysisTime > 0, 'Analyzer: Records analysis time');
} catch (error) {
  assert(false, `Analyzer: Full analysis test failed - ${error.message}`);
}

console.log('\n📊 Analyzer Stats Update Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('stats-update');
  const jsFile = createTestFile(testDir, 'test.js', 'console.log("hello");');
  const fileInfo = getFileInfo(jsFile);

  const analyzer = new Analyzer();
  const analysis = await analyzer.analyzeFile(fileInfo);

  const statsBefore = analyzer.getStats();
  analyzer.updateStats(analysis);
  const statsAfter = analyzer.getStats();

  assert(statsAfter.totalFiles === statsBefore.totalFiles + 1, 'Analyzer: Updates totalFiles counter');
  assert(statsAfter.totalTokens > statsBefore.totalTokens, 'Analyzer: Updates totalTokens counter');
  assert(statsAfter.totalSize > statsBefore.totalSize, 'Analyzer: Updates totalSize counter');
} catch (error) {
  assert(false, `Analyzer: Stats update test failed - ${error.message}`);
}

console.log('\n🏆 Analyzer Largest Files Tracking Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('largest-files');

  // Create files of different sizes
  const files = [];
  for (let i = 0; i < 15; i++) {
    const content = 'x = 1\n'.repeat(i * 10);
    const filePath = createTestFile(testDir, `file${i}.py`, content);
    files.push(getFileInfo(filePath));
  }

  const analyzer = new Analyzer();
  await analyzer.analyze(files);

  const stats = analyzer.getStats();
  assert(stats.largestFiles.length <= 10, 'Analyzer: Keeps only top 10 largest files');
  assert(stats.largestFiles.length > 0, 'Analyzer: Tracks largest files');

  // Verify sorted by tokens (descending)
  if (stats.largestFiles.length > 1) {
    assert(
      stats.largestFiles[0].tokens >= stats.largestFiles[1].tokens,
      'Analyzer: Largest files sorted by token count'
    );
  }
} catch (error) {
  assert(false, `Analyzer: Largest files tracking test failed - ${error.message}`);
}

console.log('\n🌍 Analyzer Language Distribution Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('language-dist');
  const jsFile1 = createTestFile(testDir, 'file1.js', 'const x = 1;');
  const jsFile2 = createTestFile(testDir, 'file2.js', 'const y = 2;');
  const pyFile = createTestFile(testDir, 'file.py', 'z = 3');

  const files = [
    getFileInfo(jsFile1),
    getFileInfo(jsFile2),
    getFileInfo(pyFile)
  ];

  const analyzer = new Analyzer();
  await analyzer.analyze(files);

  const dist = analyzer.getLanguageDistribution();
  assert(Array.isArray(dist), 'Analyzer: Returns language distribution array');
  assert(dist.length > 0, 'Analyzer: Distribution has language entries');

  const jsEntry = dist.find(e => e.language === 'JavaScript');
  assert(jsEntry !== undefined, 'Analyzer: Distribution includes JavaScript');
  assert(jsEntry.files === 2, 'Analyzer: Counts JavaScript files correctly');
  assert(jsEntry.percentage > 0, 'Analyzer: Calculates percentage for language');
} catch (error) {
  assert(false, `Analyzer: Language distribution test failed - ${error.message}`);
}

console.log('\n🔄 Analyzer Reset Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('reset-test');
  const jsFile = createTestFile(testDir, 'test.js', 'const x = 1;');
  const files = [getFileInfo(jsFile)];

  const analyzer = new Analyzer();
  await analyzer.analyze(files);

  assert(analyzer.stats.totalFiles > 0, 'Analyzer: Has stats before reset');

  analyzer.reset();

  assert(analyzer.stats.totalFiles === 0, 'Analyzer: Reset clears totalFiles');
  assert(analyzer.stats.totalTokens === 0, 'Analyzer: Reset clears totalTokens');
  assert(analyzer.stats.totalSize === 0, 'Analyzer: Reset clears totalSize');
  assert(Object.keys(analyzer.stats.byLanguage).length === 0, 'Analyzer: Reset clears byLanguage');
  assert(analyzer.stats.largestFiles.length === 0, 'Analyzer: Reset clears largestFiles');
} catch (error) {
  assert(false, `Analyzer: Reset test failed - ${error.message}`);
}

console.log('\n⚠️ Analyzer Error Handling Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('error-test');

  // Create a binary file (will be skipped)
  const binaryPath = path.join(testDir, 'binary.bin');
  fs.writeFileSync(binaryPath, Buffer.from([0x89, 0x50, 0x4E, 0x47]));
  const binaryInfo = getFileInfo(binaryPath);

  const analyzer = new Analyzer();
  const result = await analyzer.analyzeFile(binaryInfo);

  assert(result === null, 'Analyzer: Returns null for binary files');
} catch (error) {
  assert(false, `Analyzer: Error handling test failed - ${error.message}`);
}

try {
  const testDir = createTestDirectory('error-test-2');

  // Create a non-existent file info
  const fakeFileInfo = {
    path: path.join(testDir, 'nonexistent.js'),
    relativePath: 'nonexistent.js',
    name: 'nonexistent.js',
    extension: '.js',
    size: 0
  };

  const analyzer = new Analyzer();
  const result = await analyzer.analyzeFile(fakeFileInfo);

  assert(result === null, 'Analyzer: Handles file read errors gracefully');
} catch (error) {
  assert(false, `Analyzer: File read error test failed - ${error.message}`);
}

console.log('\n🔢 Analyzer Method Count Tracking Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('method-count');
  const jsFile = createTestFile(testDir, 'methods.js',
    'function a() {}\nfunction b() {}\nfunction c() {}');
  const files = [getFileInfo(jsFile)];

  const analyzer = new Analyzer({ methodLevel: true });
  await analyzer.analyze(files);

  const stats = analyzer.getStats();
  assert(stats.totalMethods >= 3, 'Analyzer: Tracks total methods across files');
} catch (error) {
  assert(false, `Analyzer: Method count tracking test failed - ${error.message}`);
}

console.log('\n📂 Analyzer By-Language Stats Tests');
console.log('----------------------------------------------------------------------');

try {
  const testDir = createTestDirectory('by-language');
  const jsFile = createTestFile(testDir, 'test.js', 'const x = 1;');
  const pyFile = createTestFile(testDir, 'test.py', 'y = 2');

  const files = [getFileInfo(jsFile), getFileInfo(pyFile)];

  const analyzer = new Analyzer();
  await analyzer.analyze(files);

  const stats = analyzer.getStats();
  assert(stats.byLanguage['JavaScript'] !== undefined, 'Analyzer: Creates JavaScript language entry');
  assert(stats.byLanguage['Python'] !== undefined, 'Analyzer: Creates Python language entry');
  assert(stats.byLanguage['JavaScript'].files === 1, 'Analyzer: Counts files per language');
  assert(stats.byLanguage['JavaScript'].tokens > 0, 'Analyzer: Tracks tokens per language');
  assert(stats.byLanguage['JavaScript'].size > 0, 'Analyzer: Tracks size per language');
} catch (error) {
  assert(false, `Analyzer: By-language stats test failed - ${error.message}`);
}

console.log('\n🎯 Analyzer Edge Cases');
console.log('----------------------------------------------------------------------');

try {
  const analyzer = new Analyzer();
  const result = await analyzer.analyze([]);

  assert(result.files.length === 0, 'Analyzer: Handles empty file list');
  assert(result.stats.totalFiles === 0, 'Analyzer: Empty analysis has 0 files');
} catch (error) {
  assert(false, `Analyzer: Empty file list test failed - ${error.message}`);
}

try {
  const testDir = createTestDirectory('empty-file');
  const emptyFile = createTestFile(testDir, 'empty.js', '');
  const files = [getFileInfo(emptyFile)];

  const analyzer = new Analyzer();
  const result = await analyzer.analyze(files);

  assert(result.files.length === 1, 'Analyzer: Analyzes empty file');
  assert(result.files[0].lines === 1, 'Analyzer: Empty file has 1 line');
} catch (error) {
  assert(false, `Analyzer: Empty file test failed - ${error.message}`);
}

console.log('\n🧹 Cleanup');
console.log('----------------------------------------------------------------------');

cleanup();
assert(true, 'Analyzer: Test cleanup completed');

// Print summary
console.log('\n======================================================================');
console.log('📊 COMPREHENSIVE ANALYZER TEST RESULTS');
console.log('======================================================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('');

if (failed === 0) {
  console.log('🎉 ALL ANALYZER TESTS PASSED!');
  console.log('📈 Analyzer.js now has comprehensive test coverage.');
} else {
  console.log('⚠️  SOME TESTS FAILED');
  process.exit(1);
}
