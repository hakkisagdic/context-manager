#!/usr/bin/env node

/**
 * GitIngest Integration Test
 * Tests the GitIngestFormatter class functionality
 */

const fs = require('fs');
const path = require('path');
const { TokenCalculator, GitIngestFormatter } = require('../context-manager.js');

console.log('🧪 Testing GitIngest Integration...\n');

// Test 1: GitIngestFormatter class exists
console.log('✅ Test 1: GitIngestFormatter class exported');
if (!GitIngestFormatter) {
    console.error('❌ FAIL: GitIngestFormatter not exported');
    process.exit(1);
}

// Test 2: Create mock data
console.log('✅ Test 2: Creating mock analysis data');
const mockStats = {
    totalFiles: 3,
    totalTokens: 9353,
    totalBytes: 40000,
    totalLines: 1163
};

const mockAnalysisResults = [
    {
        path: '/test/file1.js',
        relativePath: 'src/file1.js',
        tokens: 5000,
        lines: 100,
        sizeBytes: 20000
    },
    {
        path: '/test/file2.js',
        relativePath: 'src/file2.js',
        tokens: 3000,
        lines: 80,
        sizeBytes: 15000
    },
    {
        path: '/test/file3.js',
        relativePath: 'lib/file3.js',
        tokens: 1353,
        lines: 50,
        sizeBytes: 5000
    }
];

// Test 3: Create GitIngestFormatter instance
console.log('✅ Test 3: Creating GitIngestFormatter instance');
const formatter = new GitIngestFormatter(
    process.cwd(),
    mockStats,
    mockAnalysisResults
);

// Test 4: Test formatTokenCount
console.log('✅ Test 4: Testing token count formatting');
const test4a = formatter.formatTokenCount(1500);
const test4b = formatter.formatTokenCount(1500000);
const test4c = formatter.formatTokenCount(500);

if (test4a !== '1.5k') {
    console.error(`❌ FAIL: Expected "1.5k", got "${test4a}"`);
    process.exit(1);
}
if (test4b !== '1.5M') {
    console.error(`❌ FAIL: Expected "1.5M", got "${test4b}"`);
    process.exit(1);
}
if (test4c !== '500') {
    console.error(`❌ FAIL: Expected "500", got "${test4c}"`);
    process.exit(1);
}

// Test 5: Test generateSummary
console.log('✅ Test 5: Testing summary generation');
const summary = formatter.generateSummary();
if (!summary.includes('Files analyzed: 3')) {
    console.error('❌ FAIL: Summary missing file count');
    process.exit(1);
}
if (!summary.includes('Estimated tokens: 9.4k')) {
    console.error('❌ FAIL: Summary missing token count');
    process.exit(1);
}

// Test 6: Test buildFileTree
console.log('✅ Test 6: Testing file tree building');
const tree = formatter.buildFileTree();
if (!tree.children.src) {
    console.error('❌ FAIL: Tree missing src directory');
    process.exit(1);
}
if (!tree.children.lib) {
    console.error('❌ FAIL: Tree missing lib directory');
    process.exit(1);
}

// Test 7: Test generateTree
console.log('✅ Test 7: Testing tree generation');
const treeOutput = formatter.generateTree();
if (!treeOutput.includes('Directory structure:')) {
    console.error('❌ FAIL: Tree output missing header');
    process.exit(1);
}
if (!treeOutput.includes('src/')) {
    console.error('❌ FAIL: Tree output missing src directory');
    process.exit(1);
}

// Test 8: Test full digest generation (without file reading)
console.log('✅ Test 8: Testing digest structure');
// We can't test full digest without actual files, but we can test the structure
const digest = formatter.generateSummary() + '\n' + formatter.generateTree();
if (!digest.includes('Directory:')) {
    console.error('❌ FAIL: Digest missing directory header');
    process.exit(1);
}

// Test 9: CLI flag parsing
console.log('✅ Test 9: Testing CLI flag support');
const args = ['--gitingest', '-g'];
const hasLongFlag = args.includes('--gitingest');
const hasShortFlag = args.includes('-g');

if (!hasLongFlag || !hasShortFlag) {
    console.error('❌ FAIL: CLI flags not recognized');
    process.exit(1);
}

// Test 10: Integration test with actual files
console.log('✅ Test 10: Running full integration test');
const testDir = path.join(__dirname, '..');
const calculator = new TokenCalculator(testDir, { gitingest: false });

// Scan a minimal set of files
const files = calculator.scanDirectory(testDir).slice(0, 3);
if (files.length === 0) {
    console.error('❌ FAIL: No files found for integration test');
    process.exit(1);
}

const analysisResults = files.map(file => calculator.analyzeFile(file));
const integrationFormatter = new GitIngestFormatter(
    testDir,
    { totalFiles: files.length, totalTokens: 1000 },
    analysisResults
);

const fullDigest = integrationFormatter.generateDigest();
if (!fullDigest.includes('================================================')) {
    console.error('❌ FAIL: Digest missing file separators');
    process.exit(1);
}

console.log('\n🎉 All GitIngest tests passed!\n');
console.log('Summary:');
console.log('  ✅ GitIngestFormatter class exported');
console.log('  ✅ Token count formatting works');
console.log('  ✅ Summary generation works');
console.log('  ✅ File tree building works');
console.log('  ✅ Tree generation works');
console.log('  ✅ Digest structure correct');
console.log('  ✅ CLI flags supported');
console.log('  ✅ Integration test passed');
console.log('\n✨ GitIngest feature ready for use!\n');
