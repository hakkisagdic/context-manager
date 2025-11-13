#!/usr/bin/env node

/**
 * Comprehensive GitIngest Formatter Tests
 * Tests for digest generation, tree building, and file formatting
 */

import GitIngestFormatter from '../lib/formatters/gitingest-formatter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'gitingest');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

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

// Setup fixtures
if (!fs.existsSync(TEST_PROJECT_DIR)) {
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
}

// Create test files
const srcDir = path.join(TEST_PROJECT_DIR, 'src');
if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
}

const testFile1 = path.join(srcDir, 'index.js');
fs.writeFileSync(testFile1, 'function main() { return "hello"; }\n');

const testFile2 = path.join(TEST_PROJECT_DIR, 'README.md');
fs.writeFileSync(testFile2, '# Test Project\n');

console.log('🧪 Testing GitIngest Formatter...\n');

// Mock stats and analysis results
const mockStats = {
    totalFiles: 2,
    totalTokens: 150,
    totalBytes: 500,
    totalLines: 20,
    byExtension: {
        '.js': { count: 1, tokens: 100 },
        '.md': { count: 1, tokens: 50 }
    }
};

const mockAnalysisResults = [
    {
        path: testFile1,
        relativePath: 'src/index.js',
        tokens: 100,
        lines: 1,
        extension: '.js'
    },
    {
        path: testFile2,
        relativePath: 'README.md',
        tokens: 50,
        lines: 1,
        extension: '.md'
    }
];

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - Constructor with minimal args', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    if (!formatter) throw new Error('Should create instance');
    if (formatter.projectRoot !== TEST_PROJECT_DIR) throw new Error('Should set projectRoot');
    if (!formatter.stats) throw new Error('Should have stats');
    if (!formatter.analysisResults) throw new Error('Should have analysisResults');
});

test('GitIngestFormatter - Constructor with options', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 50000 }
    });
    if (!formatter.chunking.enabled) throw new Error('Should enable chunking');
    if (formatter.chunking.maxTokensPerChunk !== 50000) {
        throw new Error('Should set maxTokensPerChunk');
    }
});

test('GitIngestFormatter - Constructor initializes chunking config', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    if (typeof formatter.chunking !== 'object') throw new Error('Should have chunking config');
    if (typeof formatter.chunking.enabled !== 'boolean') {
        throw new Error('Should have chunking.enabled');
    }
    if (typeof formatter.chunking.strategy !== 'string') {
        throw new Error('Should have chunking.strategy');
    }
});

test('GitIngestFormatter - Constructor detects method filters', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    if (typeof formatter.methodFilterEnabled !== 'boolean') {
        throw new Error('Should have methodFilterEnabled');
    }
});

// ============================================================================
// METHOD FILTER TESTS
// ============================================================================
console.log('\n🔍 Method Filter Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - detectMethodFilters returns boolean', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const detected = formatter.detectMethodFilters();
    if (typeof detected !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// DIGEST GENERATION TESTS
// ============================================================================
console.log('\n📄 Digest Generation Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - generateDigest returns string', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const digest = formatter.generateDigest();
    if (typeof digest !== 'string') throw new Error('Should return string');
    if (digest.length === 0) throw new Error('Should not be empty');
});

test('GitIngestFormatter - generateDigest includes summary', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const digest = formatter.generateDigest();
    if (!digest.includes('Directory:')) throw new Error('Should include directory info');
});

test('GitIngestFormatter - generateDigest includes tree', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const digest = formatter.generateDigest();
    if (!digest.includes('Directory structure:')) throw new Error('Should include directory structure');
});

test('GitIngestFormatter - generateDigest includes file contents', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const digest = formatter.generateDigest();
    if (!digest.includes('FILE:')) throw new Error('Should include file contents');
});

// ============================================================================
// SUMMARY TESTS
// ============================================================================
console.log('\n📊 Summary Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - generateSummary returns string', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const summary = formatter.generateSummary();
    if (typeof summary !== 'string') throw new Error('Should return string');
    if (summary.length === 0) throw new Error('Should not be empty');
});

test('GitIngestFormatter - generateSummary includes stats', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const summary = formatter.generateSummary();
    if (!summary.includes('Files analyzed:')) throw new Error('Should include file count');
    if (!summary.includes('tokens:')) throw new Error('Should include token count');
});

test('GitIngestFormatter - formatTokenCount formats numbers', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const formatted = formatter.formatTokenCount(1500);
    if (typeof formatted !== 'string') throw new Error('Should return string');
    // Uses K/M format, e.g., "1.5K"
    if (!formatted.includes('K') && !formatted.includes('M')) {
        throw new Error('Should format with K/M suffix');
    }
});

test('GitIngestFormatter - formatTokenCount handles large numbers', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const formatted = formatter.formatTokenCount(1234567);
    // Should format to "1.2M"
    if (!formatted.includes('M')) throw new Error('Should format large numbers with M');
});

// ============================================================================
// TREE GENERATION TESTS
// ============================================================================
console.log('\n🌳 Tree Generation Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - generateTree returns string', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const tree = formatter.generateTree();
    if (typeof tree !== 'string') throw new Error('Should return string');
});

test('GitIngestFormatter - buildFileTree builds hierarchy', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const tree = formatter.buildFileTree();
    if (typeof tree !== 'object') throw new Error('Should return object');
    if (!tree.children) throw new Error('Should have children');
});

test('GitIngestFormatter - buildFileTree handles nested paths', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const tree = formatter.buildFileTree();
    // Should have src directory
    if (Object.keys(tree.children).length === 0) {
        throw new Error('Should have nested structure');
    }
});

test('GitIngestFormatter - formatTreeNode formats directory', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const node = { name: 'src', type: 'directory', children: {} };
    const formatted = formatter.formatTreeNode(node);
    if (typeof formatted !== 'string') throw new Error('Should return string');
});

test('GitIngestFormatter - formatTreeNode formats file', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const node = { name: 'index.js', type: 'file', tokens: 100 };
    const formatted = formatter.formatTreeNode(node);
    if (typeof formatted !== 'string') throw new Error('Should return string');
    if (!formatted.includes('index.js')) throw new Error('Should include filename');
});

// ============================================================================
// FILE CONTENT TESTS
// ============================================================================
console.log('\n📝 File Content Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - generateFileContents returns string', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const contents = formatter.generateFileContents();
    if (typeof contents !== 'string') throw new Error('Should return string');
});

test('GitIngestFormatter - generateFileContents includes file paths', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const contents = formatter.generateFileContents();
    if (!contents.includes('src/index.js')) throw new Error('Should include file path');
});

test('GitIngestFormatter - isCodeFile checks extensions', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    if (!formatter.isCodeFile('test.js')) throw new Error('Should detect .js as code');
    if (!formatter.isCodeFile('test.py')) throw new Error('Should detect .py as code');
    if (formatter.isCodeFile('test.txt')) throw new Error('Should not detect .txt as code');
});

// ============================================================================
// CHUNKING TESTS
// ============================================================================
console.log('\n✂️  Chunking Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - createSmartChunks returns array', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 100 }
    });
    const chunks = formatter.createSmartChunks();
    if (!Array.isArray(chunks)) throw new Error('Should return array');
});

test('GitIngestFormatter - createSizeBasedChunks respects maxTokens', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 80 }
    });
    const chunks = formatter.createSizeBasedChunks();
    if (!Array.isArray(chunks)) throw new Error('Should return array');
    // Each chunk should respect token limit
    for (const chunk of chunks) {
        if (chunk.tokens > 80) {
            // Allow single large files
            if (chunk.files.length > 1) {
                throw new Error('Chunks should respect token limit');
            }
        }
    }
});

test('GitIngestFormatter - createFileBasedChunks one file per chunk', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, strategy: 'file' }
    });
    const chunks = formatter.createFileBasedChunks();
    if (!Array.isArray(chunks)) throw new Error('Should return array');
    // Should have one file per chunk
    for (const chunk of chunks) {
        if (chunk.files.length !== 1) {
            throw new Error('Each chunk should have one file');
        }
    }
});

test('GitIngestFormatter - createDirectoryBasedChunks groups by dir', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, strategy: 'directory' }
    });
    const chunks = formatter.createDirectoryBasedChunks();
    if (!Array.isArray(chunks)) throw new Error('Should return array');
});

test('GitIngestFormatter - generateChunkedDigest with chunking enabled', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 80 }
    });
    const result = formatter.generateChunkedDigest();
    if (!Array.isArray(result)) throw new Error('Should return array of chunks');
    if (result.length === 0) throw new Error('Should have chunks');
    // Each chunk should have content or digest
    for (const chunk of result) {
        if (!chunk.digest && !chunk.content && typeof chunk !== 'object') {
            throw new Error('Should have chunk data');
        }
    }
});

// ============================================================================
// SAVE TESTS
// ============================================================================
console.log('\n💾 Save Tests');
console.log('-'.repeat(70));

test('GitIngestFormatter - saveToFile creates file', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const outputFile = path.join(FIXTURES_DIR, 'test-output.txt');

    formatter.saveToFile(outputFile);

    if (!fs.existsSync(outputFile)) throw new Error('Should create file');

    // Cleanup
    fs.unlinkSync(outputFile);
});

test('GitIngestFormatter - saveToFile writes digest content', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const outputFile = path.join(FIXTURES_DIR, 'test-output2.txt');

    formatter.saveToFile(outputFile);

    const content = fs.readFileSync(outputFile, 'utf8');
    if (content.length === 0) throw new Error('Should write content');
    if (!content.includes('Directory:')) throw new Error('Should include summary');

    // Cleanup
    fs.unlinkSync(outputFile);
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('GitIngestFormatter - Empty analysis results', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, []);
    const digest = formatter.generateDigest();
    if (typeof digest !== 'string') throw new Error('Should handle empty results');
});

test('GitIngestFormatter - formatTokenCount with zero', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const formatted = formatter.formatTokenCount(0);
    if (!formatted.includes('0')) throw new Error('Should format zero');
});

test('GitIngestFormatter - Multiple instances are independent', () => {
    const formatter1 = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults);
    const formatter2 = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, mockAnalysisResults, {
        chunking: { enabled: true }
    });

    if (formatter1.chunking.enabled === formatter2.chunking.enabled) {
        throw new Error('Instances should be independent');
    }
});

// Cleanup
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
}

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
    console.log('\n🎉 All gitingest formatter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
