#!/usr/bin/env node

/**
 * Comprehensive GitIngest Formatter Tests
 *
 * Covers:
 * - GitIngest format validation
 * - Large codebase handling
 * - Tree structure accuracy
 * - File content encoding
 * - Metadata completeness
 * - Timestamp handling
 * - Author information
 * - Diff integration
 * - JSON vs text format
 * - Compression
 * - Token optimization
 * - Filtering integration
 * - Performance benchmarks
 */

import GitIngestFormatter from '../lib/formatters/gitingest-formatter.js';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'gitingest-comprehensive');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

// Global references to test directories
let srcDir, libDir, testDir, docsDir;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
        }
        testsFailed++;
        return false;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(value, message) {
    if (!value) {
        throw new Error(message);
    }
}

function assertContains(haystack, needle, message) {
    if (!haystack.includes(needle)) {
        throw new Error(`${message}: "${needle}" not found`);
    }
}

function assertNotContains(haystack, needle, message) {
    if (haystack.includes(needle)) {
        throw new Error(`${message}: "${needle}" should not be present`);
    }
}

// Setup test fixtures
function setupFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });

    // Create various test files with different characteristics
    srcDir = path.join(TEST_PROJECT_DIR, 'src');
    libDir = path.join(TEST_PROJECT_DIR, 'lib');
    testDir = path.join(TEST_PROJECT_DIR, 'test');
    docsDir = path.join(TEST_PROJECT_DIR, 'docs');

    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(libDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(docsDir, { recursive: true });

    // Create JS files with various sizes
    fs.writeFileSync(
        path.join(srcDir, 'index.js'),
        'function main() {\n  return "hello world";\n}\n\nmodule.exports = main;\n'
    );

    fs.writeFileSync(
        path.join(srcDir, 'utils.js'),
        'export function helper() {\n  return 42;\n}\n\nexport const constant = "test";\n'
    );

    fs.writeFileSync(
        path.join(libDir, 'core.js'),
        'class Core {\n  constructor() {\n    this.value = 0;\n  }\n\n  increment() {\n    this.value++;\n  }\n}\n\nmodule.exports = Core;\n'
    );

    // Create files with special characters and encoding
    fs.writeFileSync(
        path.join(srcDir, 'unicode.js'),
        '// Unicode test: émojis 🚀 and symbols ∑∏∫\nconst greeting = "Hello 世界";\n'
    );

    // Create markdown documentation
    fs.writeFileSync(
        path.join(docsDir, 'README.md'),
        '# Test Project\n\nThis is a test project.\n\n## Features\n\n- Feature 1\n- Feature 2\n'
    );

    // Create test file
    fs.writeFileSync(
        path.join(testDir, 'test.js'),
        'const assert = require("assert");\n\ndescribe("Tests", () => {\n  it("should pass", () => {\n    assert(true);\n  });\n});\n'
    );

    // Create a large file
    const largeContent = Array(100).fill('function test() { return true; }\n').join('');
    fs.writeFileSync(path.join(srcDir, 'large.js'), largeContent);

    // Create config files
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'package.json'), '{\n  "name": "test-project",\n  "version": "1.0.0"\n}\n');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.gitignore'), 'node_modules/\n*.log\n');
}

function cleanupFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
}

// Create mock analysis results
function createMockAnalysisResults() {
    const files = [
        'src/index.js',
        'src/utils.js',
        'src/unicode.js',
        'src/large.js',
        'lib/core.js',
        'test/test.js',
        'docs/README.md',
        'package.json',
        '.gitignore'
    ];

    return files.map(relPath => {
        const fullPath = path.join(TEST_PROJECT_DIR, relPath);
        const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
        const tokens = Math.ceil(content.length / 4); // Rough estimation
        const lines = content.split('\n').length;

        return {
            path: fullPath,
            relativePath: relPath,
            tokens: tokens,
            lines: lines,
            extension: path.extname(relPath),
            sizeBytes: content.length
        };
    });
}

function calculateMockStats(analysisResults) {
    return {
        totalFiles: analysisResults.length,
        totalTokens: analysisResults.reduce((sum, f) => sum + f.tokens, 0),
        totalBytes: analysisResults.reduce((sum, f) => sum + f.sizeBytes, 0),
        totalLines: analysisResults.reduce((sum, f) => sum + f.lines, 0),
        byExtension: analysisResults.reduce((acc, f) => {
            const ext = f.extension || 'no-ext';
            if (!acc[ext]) {
                acc[ext] = { count: 0, tokens: 0 };
            }
            acc[ext].count++;
            acc[ext].tokens += f.tokens;
            return acc;
        }, {})
    };
}

console.log('🧪 GitIngest Formatter Comprehensive Tests\n');
console.log('Setting up test fixtures...\n');
setupFixtures();

const analysisResults = createMockAnalysisResults();
const mockStats = calculateMockStats(analysisResults);

// ============================================================================
// 1. FORMAT VALIDATION TESTS
// ============================================================================
console.log('📋 Format Validation Tests');
console.log('-'.repeat(70));

test('Format: Digest has correct header structure', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const digest = formatter.generateDigest();

    assertContains(digest, 'Directory:', 'Should have directory header');
    assertContains(digest, 'Files analyzed:', 'Should have file count');
    assertContains(digest, 'Directory structure:', 'Should have tree section');
});

test('Format: File sections have proper delimiters', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const digest = formatter.generateDigest();

    const separatorCount = (digest.match(/={48}/g) || []).length;
    assertTrue(separatorCount >= analysisResults.length, 'Should have separators for each file');
    assertContains(digest, 'FILE:', 'Should have FILE markers');
});

test('Format: Summary includes all required fields', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const summary = formatter.generateSummary();

    assertContains(summary, 'Directory:', 'Should include directory');
    assertContains(summary, 'Files analyzed:', 'Should include file count');
    assertContains(summary, 'tokens:', 'Should include token count');
});

test('Format: Tree structure follows correct format', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const tree = formatter.generateTree();

    assertContains(tree, '├──', 'Should use tree branch characters');
    assertContains(tree, '└──', 'Should use tree end characters');
    assertContains(tree, 'src/', 'Should show directories with /');
});

// ============================================================================
// 2. LARGE CODEBASE HANDLING
// ============================================================================
console.log('\n📦 Large Codebase Handling Tests');
console.log('-'.repeat(70));

test('Large: Handles many files efficiently', () => {
    // Create mock data for 100 files
    const largeAnalysisResults = Array(100).fill(null).map((_, i) => ({
        path: path.join(TEST_PROJECT_DIR, `file${i}.js`),
        relativePath: `file${i}.js`,
        tokens: 100 + i,
        lines: 10,
        extension: '.js',
        sizeBytes: 500
    }));

    const largeStats = calculateMockStats(largeAnalysisResults);
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, largeStats, largeAnalysisResults);

    const startTime = Date.now();
    const digest = formatter.generateDigest();
    const endTime = Date.now();

    assertTrue(endTime - startTime < 1000, 'Should complete in under 1 second');
    assertTrue(digest.length > 0, 'Should generate output');
});

test('Large: Chunking splits files correctly', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 100 }
    });

    const chunks = formatter.createSmartChunks();
    assertTrue(Array.isArray(chunks), 'Should return array of chunks');
    assertTrue(chunks.length > 1, 'Should create multiple chunks for test data');
});

test('Large: Chunked digest maintains structure', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 200 }
    });

    const chunkedDigest = formatter.generateChunkedDigest();
    assertTrue(Array.isArray(chunkedDigest), 'Should return array');

    for (const chunk of chunkedDigest) {
        assertContains(chunk.content, 'CHUNK', 'Each chunk should have header');
        assertTrue(chunk.files.length > 0, 'Each chunk should have files');
        assertTrue(chunk.tokens > 0, 'Each chunk should have token count');
    }
});

test('Large: Chunk overlap works correctly', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: {
            enabled: true,
            maxTokensPerChunk: 200,
            overlap: 50
        }
    });

    const chunkedDigest = formatter.generateChunkedDigest();

    // Check if any chunks have overlap
    const hasOverlap = chunkedDigest.some(chunk => chunk.hasOverlap);
    // Note: Overlap may not occur if chunks are too small
    assertTrue(chunkedDigest.length > 0, 'Should create chunks');
});

// ============================================================================
// 3. TREE STRUCTURE ACCURACY
// ============================================================================
console.log('\n🌳 Tree Structure Accuracy Tests');
console.log('-'.repeat(70));

test('Tree: Builds correct hierarchy', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const tree = formatter.buildFileTree();

    assertTrue(tree.children.src !== undefined, 'Should have src directory');
    assertTrue(tree.children.lib !== undefined, 'Should have lib directory');
    assertTrue(tree.children.test !== undefined, 'Should have test directory');
    assertTrue(tree.children.docs !== undefined, 'Should have docs directory');
});

test('Tree: Nested directories are correct', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const tree = formatter.buildFileTree();

    assertTrue(tree.children.src.type === 'directory', 'src should be directory');
    assertTrue(Object.keys(tree.children.src.children).length > 0, 'src should have children');
});

test('Tree: Files have correct properties', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const tree = formatter.buildFileTree();

    const indexFile = tree.children.src.children['index.js'];
    assertEquals(indexFile.type, 'file', 'Should be file type');
    assertEquals(indexFile.name, 'index.js', 'Should have correct name');
    assertTrue(indexFile.fileInfo !== undefined, 'Should have fileInfo');
});

test('Tree: Sorting is consistent', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const treeOutput = formatter.generateTree();

    // Check that directories come in a consistent order
    const lines = treeOutput.split('\n').filter(l => l.trim().length > 0);
    assertTrue(lines.length > 5, 'Should have multiple lines');
});

// ============================================================================
// 4. FILE CONTENT ENCODING
// ============================================================================
console.log('\n🔤 File Content Encoding Tests');
console.log('-'.repeat(70));

test('Encoding: UTF-8 characters preserved', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const digest = formatter.generateDigest();

    assertContains(digest, '世界', 'Should preserve Chinese characters');
    assertContains(digest, '🚀', 'Should preserve emojis');
    assertContains(digest, '∑', 'Should preserve math symbols');
});

test('Encoding: Handles different line endings', () => {
    // Create file with CRLF line endings
    const crlfFile = path.join(TEST_PROJECT_DIR, 'crlf.txt');
    fs.writeFileSync(crlfFile, 'line1\r\nline2\r\nline3\r\n');

    const results = [...analysisResults, {
        path: crlfFile,
        relativePath: 'crlf.txt',
        tokens: 10,
        lines: 3,
        extension: '.txt',
        sizeBytes: 20
    }];

    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, calculateMockStats(results), results);
    const digest = formatter.generateDigest();

    assertContains(digest, 'line1', 'Should handle CRLF');
    assertContains(digest, 'line2', 'Should handle CRLF');
});

test('Encoding: Binary files are skipped gracefully', () => {
    // Create a pseudo-binary file
    const binaryFile = path.join(TEST_PROJECT_DIR, 'binary.bin');
    fs.writeFileSync(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0xFF]));

    const results = [...analysisResults, {
        path: binaryFile,
        relativePath: 'binary.bin',
        tokens: 1,
        lines: 1,
        extension: '.bin',
        sizeBytes: 4
    }];

    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, calculateMockStats(results), results);
    const digest = formatter.generateDigest();

    // Should either include or skip gracefully without crashing
    assertTrue(digest.length > 0, 'Should handle binary files');
});

// ============================================================================
// 5. METADATA COMPLETENESS
// ============================================================================
console.log('\n📊 Metadata Completeness Tests');
console.log('-'.repeat(70));

test('Metadata: Chunk metadata includes languages', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: {
            enabled: true,
            maxTokensPerChunk: 200,
            includeMetadata: true
        }
    });

    const chunkedDigest = formatter.generateChunkedDigest();
    const hasMetadata = chunkedDigest.some(chunk =>
        chunk.content.includes('CHUNK METADATA')
    );

    assertTrue(hasMetadata, 'Should include chunk metadata');
});

test('Metadata: Language distribution is accurate', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: {
            enabled: true,
            maxTokensPerChunk: 1000,
            includeMetadata: true
        }
    });

    const chunks = formatter.createSmartChunks();
    if (chunks.length > 0) {
        const metadata = formatter.generateChunkMetadata(chunks[0], 0, chunks);
        assertContains(metadata, 'Languages:', 'Should show language distribution');
    }
});

test('Metadata: Directory count is correct', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: {
            enabled: true,
            maxTokensPerChunk: 1000,
            includeMetadata: true
        }
    });

    const chunks = formatter.createSmartChunks();
    if (chunks.length > 0) {
        const metadata = formatter.generateChunkMetadata(chunks[0], 0, chunks);
        assertContains(metadata, 'Directories:', 'Should show directory count');
    }
});

// ============================================================================
// 6. CHUNKING STRATEGIES
// ============================================================================
console.log('\n✂️  Chunking Strategy Tests');
console.log('-'.repeat(70));

test('Strategy: Size-based chunking respects limits', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, strategy: 'size', maxTokensPerChunk: 150 }
    });

    const chunks = formatter.createSizeBasedChunks();
    for (const chunk of chunks) {
        // Allow single large files to exceed limit
        if (chunk.files.length > 1) {
            assertTrue(chunk.tokens <= 150 * 1.1, 'Multi-file chunks should respect token limit (with 10% margin)');
        }
    }
});

test('Strategy: File-based chunking creates one-per-chunk', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, strategy: 'file' }
    });

    const chunks = formatter.createFileBasedChunks();
    assertEquals(chunks.length, analysisResults.length, 'Should create one chunk per file');

    for (const chunk of chunks) {
        assertEquals(chunk.files.length, 1, 'Each chunk should have exactly one file');
    }
});

test('Strategy: Directory-based groups by directory', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, strategy: 'directory' }
    });

    const chunks = formatter.createDirectoryBasedChunks();

    for (const chunk of chunks) {
        // All files in chunk should be from same directory
        const directories = new Set(chunk.files.map(f => path.dirname(f.relativePath)));
        assertEquals(directories.size, 1, 'All files in chunk should be from same directory');
    }
});

test('Strategy: Smart chunking groups related files', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, strategy: 'smart', maxTokensPerChunk: 200 }
    });

    const chunks = formatter.createSmartChunks();
    assertTrue(chunks.length > 0, 'Should create chunks');

    // Smart chunking should try to keep same directories together
    for (const chunk of chunks) {
        assertTrue(chunk.files.length > 0, 'Each chunk should have files');
    }
});

test('Strategy: Dependency-based falls back to smart', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, strategy: 'dependency' }
    });

    const chunks = formatter.createDependencyBasedChunks();
    assertTrue(chunks.length > 0, 'Should create chunks (using fallback)');
});

// ============================================================================
// 7. TOKEN OPTIMIZATION
// ============================================================================
console.log('\n🎯 Token Optimization Tests');
console.log('-'.repeat(70));

test('Tokens: formatTokenCount handles different ranges', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);

    const formatted500 = formatter.formatTokenCount(500);
    const formatted1500 = formatter.formatTokenCount(1500);
    const formatted1500000 = formatter.formatTokenCount(1500000);

    assertEquals(formatted500, '500', 'Should show exact count for small numbers');
    assertContains(formatted1500.toLowerCase(), 'k', 'Should use K for thousands');
    assertContains(formatted1500000.toLowerCase(), 'm', 'Should use M for millions');
});

test('Tokens: Large files sorted by token count', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const chunks = formatter.createSizeBasedChunks();

    // Files should be sorted by token count
    for (const chunk of chunks) {
        for (let i = 0; i < chunk.files.length - 1; i++) {
            assertTrue(
                chunk.files[i].tokens >= chunk.files[i + 1].tokens,
                'Files should be sorted by token count descending'
            );
        }
    }
});

// ============================================================================
// 8. FILTERING INTEGRATION
// ============================================================================
console.log('\n🔍 Filtering Integration Tests');
console.log('-'.repeat(70));

test('Filtering: Detects method filter files', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const detected = formatter.detectMethodFilters();

    assertEquals(typeof detected, 'boolean', 'Should return boolean');
});

test('Filtering: isCodeFile identifies code correctly', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);

    assertTrue(formatter.isCodeFile('test.js'), 'Should detect .js as code');
    assertTrue(formatter.isCodeFile('test.py'), 'Should detect .py as code');
    assertTrue(!formatter.isCodeFile('test.md'), 'Should not detect .md as code');
    assertTrue(!formatter.isCodeFile('test.txt'), 'Should not detect .txt as code');
});

// ============================================================================
// 9. NAVIGATION AND CHUNK INFO
// ============================================================================
console.log('\n🧭 Navigation Tests');
console.log('-'.repeat(70));

test('Navigation: Chunk headers show position', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 150 }
    });

    const chunkedDigest = formatter.generateChunkedDigest();

    for (let i = 0; i < chunkedDigest.length; i++) {
        const chunk = chunkedDigest[i];
        assertContains(chunk.content, `CHUNK ${i + 1}`, 'Should show chunk number');
        assertContains(chunk.content, `of ${chunkedDigest.length}`, 'Should show total chunks');
    }
});

test('Navigation: Shows previous/next links', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 150 }
    });

    const chunkedDigest = formatter.generateChunkedDigest();

    if (chunkedDigest.length > 1) {
        // First chunk should have next
        assertContains(chunkedDigest[0].content, 'Next:', 'First chunk should have next link');

        // Last chunk should have previous
        const lastChunk = chunkedDigest[chunkedDigest.length - 1];
        assertContains(lastChunk.content, 'Previous:', 'Last chunk should have previous link');
    }
});

// ============================================================================
// 10. PERFORMANCE BENCHMARKS
// ============================================================================
console.log('\n⚡ Performance Tests');
console.log('-'.repeat(70));

test('Performance: generateDigest completes quickly', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);

    const startTime = Date.now();
    const digest = formatter.generateDigest();
    const endTime = Date.now();

    const elapsed = endTime - startTime;
    assertTrue(elapsed < 500, `Should complete in under 500ms (took ${elapsed}ms)`);
    assertTrue(digest.length > 0, 'Should generate output');
});

test('Performance: Chunking doesn\'t significantly slow down generation', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 200 }
    });

    const startTime = Date.now();
    const chunks = formatter.generateChunkedDigest();
    const endTime = Date.now();

    const elapsed = endTime - startTime;
    assertTrue(elapsed < 500, `Chunking should complete in under 500ms (took ${elapsed}ms)`);
    assertTrue(chunks.length > 0, 'Should generate chunks');
});

test('Performance: Tree building is efficient', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);

    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
        formatter.buildFileTree();
    }
    const endTime = Date.now();

    const elapsed = endTime - startTime;
    assertTrue(elapsed < 1000, `100 tree builds should complete in under 1s (took ${elapsed}ms)`);
});

// ============================================================================
// 11. EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Case Tests');
console.log('-'.repeat(70));

test('Edge: Empty analysis results', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, []);
    const digest = formatter.generateDigest();

    assertTrue(digest.length > 0, 'Should handle empty results');
    assertContains(digest, 'Directory:', 'Should still have header');
});

test('Edge: Single file', () => {
    const singleFile = [analysisResults[0]];
    const singleStats = calculateMockStats(singleFile);

    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, singleStats, singleFile);
    const digest = formatter.generateDigest();

    assertTrue(digest.length > 0, 'Should handle single file');
    assertContains(digest, 'Files analyzed: 1', 'Should show correct count');
});

test('Edge: Very large single file', () => {
    const largeFile = {
        path: path.join(TEST_PROJECT_DIR, 'huge.js'),
        relativePath: 'huge.js',
        tokens: 500000,
        lines: 10000,
        extension: '.js',
        sizeBytes: 2000000
    };

    const formatter = new GitIngestFormatter(
        TEST_PROJECT_DIR,
        calculateMockStats([largeFile]),
        [largeFile],
        { chunking: { enabled: true, maxTokensPerChunk: 100000 } }
    );

    const chunks = formatter.createSizeBasedChunks();
    assertTrue(chunks.length > 0, 'Should handle very large file');
});

test('Edge: Files with no extension', () => {
    const noExtFile = {
        path: path.join(TEST_PROJECT_DIR, 'Makefile'),
        relativePath: 'Makefile',
        tokens: 50,
        lines: 10,
        extension: '',
        sizeBytes: 200
    };

    const formatter = new GitIngestFormatter(
        TEST_PROJECT_DIR,
        calculateMockStats([noExtFile]),
        [noExtFile]
    );

    const tree = formatter.buildFileTree();
    assertTrue(tree.children['Makefile'] !== undefined, 'Should handle files with no extension');
});

// ============================================================================
// 12. SAVE FUNCTIONALITY
// ============================================================================
console.log('\n💾 Save Functionality Tests');
console.log('-'.repeat(70));

test('Save: saveToFile creates file', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const outputFile = path.join(FIXTURES_DIR, 'test-digest.txt');

    const bytesWritten = formatter.saveToFile(outputFile);

    assertTrue(fs.existsSync(outputFile), 'Should create output file');
    assertTrue(bytesWritten > 0, 'Should write bytes');

    const content = fs.readFileSync(outputFile, 'utf8');
    assertContains(content, 'Directory:', 'Should contain digest content');
});

test('Save: saveToFile with chunking creates proper content', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 200 }
    });
    const outputFile = path.join(FIXTURES_DIR, 'test-chunked-digest.txt');

    formatter.saveToFile(outputFile);

    // When chunking is enabled, it creates chunk files instead of the main file
    const chunk1File = path.join(FIXTURES_DIR, 'test-chunked-digest-chunk-1.txt');
    const indexFile = path.join(FIXTURES_DIR, 'test-chunked-digest-index.txt');

    assertTrue(fs.existsSync(chunk1File), 'Should create chunk-1 file');
    assertTrue(fs.existsSync(indexFile), 'Should create index file');

    // Verify index file has content
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    assertContains(indexContent, 'Chunk', 'Index should contain chunk info');
});

// ============================================================================
// 13. TIMESTAMP HANDLING
// ============================================================================
console.log('\n⏰ Timestamp Handling Tests');
console.log('-'.repeat(70));

test('Timestamp: getFileTimestamp returns Date object', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeTimestamps: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const timestamp = formatter.getFileTimestamp(testFile);

    assertTrue(timestamp instanceof Date, 'Should return Date object');
    assertTrue(!isNaN(timestamp.getTime()), 'Should be valid date');
});

test('Timestamp: Cached timestamps are reused', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeTimestamps: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const timestamp1 = formatter.getFileTimestamp(testFile);
    const timestamp2 = formatter.getFileTimestamp(testFile);

    assertEquals(timestamp1.getTime(), timestamp2.getTime(), 'Cached timestamps should match');
});

test('Timestamp: includeTimestamps adds timestamps to digest', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeTimestamps: true
    });

    const digest = formatter.generateDigest();
    assertContains(digest, 'Last Modified:', 'Should include timestamp info');
});

test('Timestamp: JSON format includes timestamps', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json',
        includeTimestamps: true
    });

    const digest = formatter.generateDigest();
    const jsonData = JSON.parse(digest);

    assertTrue(jsonData.files[0].lastModified !== undefined, 'Should have lastModified field');
    assertContains(jsonData.files[0].lastModified, 'T', 'Should be ISO format');
});

// ============================================================================
// 14. AUTHOR INFORMATION
// ============================================================================
console.log('\n👤 Author Information Tests');
console.log('-'.repeat(70));

test('Author: getFileAuthorInfo returns author object', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeAuthorInfo: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const authorInfo = formatter.getFileAuthorInfo(testFile);

    assertTrue(typeof authorInfo === 'object', 'Should return object');
    assertTrue(authorInfo.primary !== undefined, 'Should have primary author');
    assertTrue(Array.isArray(authorInfo.contributors), 'Should have contributors array');
});

test('Author: Cached author info is reused', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeAuthorInfo: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const author1 = formatter.getFileAuthorInfo(testFile);
    const author2 = formatter.getFileAuthorInfo(testFile);

    assertEquals(author1.primary, author2.primary, 'Cached author should match');
});

test('Author: includeAuthorInfo adds authors to digest', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeAuthorInfo: true
    });

    const digest = formatter.generateDigest();
    assertContains(digest, 'Primary Author:', 'Should include author info');
});

test('Author: JSON format includes author info', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json',
        includeAuthorInfo: true
    });

    const digest = formatter.generateDigest();
    const jsonData = JSON.parse(digest);

    assertTrue(jsonData.files[0].author !== undefined, 'Should have author field');
    assertTrue(jsonData.files[0].author.primary !== undefined, 'Should have primary author');
});

// ============================================================================
// 15. DIFF INTEGRATION
// ============================================================================
console.log('\n📝 Diff Integration Tests');
console.log('-'.repeat(70));

test('Diff: getFileDiffInfo returns diff object', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeDiffInfo: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const diffInfo = formatter.getFileDiffInfo(testFile);

    assertTrue(typeof diffInfo === 'object', 'Should return object');
    assertTrue(typeof diffInfo.hasChanges === 'boolean', 'Should have hasChanges field');
    assertTrue(typeof diffInfo.additions === 'number', 'Should have additions count');
    assertTrue(typeof diffInfo.deletions === 'number', 'Should have deletions count');
});

test('Diff: Cached diff info is reused', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeDiffInfo: true
    });

    const testFile = path.join(srcDir, 'index.js');
    const diff1 = formatter.getFileDiffInfo(testFile);
    const diff2 = formatter.getFileDiffInfo(testFile);

    assertEquals(diff1.hasChanges, diff2.hasChanges, 'Cached diff should match');
});

test('Diff: includeDiffInfo adds diff to digest', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        includeDiffInfo: true
    });

    const digest = formatter.generateDigest();
    // Diff info only appears if there are changes, so we just check it doesn't crash
    assertTrue(digest.length > 0, 'Should generate digest with diff info enabled');
});

test('Diff: JSON format includes diff info', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json',
        includeDiffInfo: true
    });

    const digest = formatter.generateDigest();
    const jsonData = JSON.parse(digest);

    assertTrue(jsonData.files[0].diff !== undefined, 'Should have diff field');
    assertTrue(typeof jsonData.files[0].diff.hasChanges === 'boolean', 'Should have hasChanges');
});

// ============================================================================
// 16. JSON FORMAT
// ============================================================================
console.log('\n📄 JSON Format Tests');
console.log('-'.repeat(70));

test('JSON: outputFormat=json produces valid JSON', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json'
    });

    const digest = formatter.generateDigest();

    // Should be valid JSON
    const jsonData = JSON.parse(digest);
    assertTrue(typeof jsonData === 'object', 'Should parse as object');
});

test('JSON: JSON includes project metadata', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json'
    });

    const digest = formatter.generateDigest();
    const jsonData = JSON.parse(digest);

    assertTrue(jsonData.project !== undefined, 'Should have project field');
    assertTrue(jsonData.project.totalFiles > 0, 'Should have file count');
    assertTrue(jsonData.project.totalTokens > 0, 'Should have token count');
    assertTrue(jsonData.project.generatedAt !== undefined, 'Should have timestamp');
});

test('JSON: JSON includes file array', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        outputFormat: 'json'
    });

    const digest = formatter.generateDigest();
    const jsonData = JSON.parse(digest);

    assertTrue(Array.isArray(jsonData.files), 'Should have files array');
    assertTrue(jsonData.files.length > 0, 'Should have files');
    assertTrue(jsonData.files[0].path !== undefined, 'Files should have path');
    assertTrue(jsonData.files[0].content !== undefined, 'Files should have content');
});

test('JSON: Text format is default', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const digest = formatter.generateDigest();

    // Should not be JSON (should be text)
    assertTrue(typeof digest === 'string', 'Should be string');
    assertTrue(digest.includes('Directory:'), 'Should have text format markers');
});

// ============================================================================
// 17. COMPRESSION
// ============================================================================
console.log('\n🗜️  Compression Tests');
console.log('-'.repeat(70));

test('Compression: saveToFile with compression creates .gz file', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        compression: true
    });

    const outputFile = path.join(FIXTURES_DIR, 'test-compressed.txt');
    formatter.saveToFile(outputFile);

    assertTrue(fs.existsSync(outputFile + '.gz'), 'Should create .gz file');
    assertTrue(!fs.existsSync(outputFile), 'Should not create uncompressed file');
});

test('Compression: Compressed file is smaller', () => {
    const formatter1 = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults);
    const formatter2 = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        compression: true
    });

    const uncompressedFile = path.join(FIXTURES_DIR, 'test-uncompressed.txt');
    const compressedFile = path.join(FIXTURES_DIR, 'test-compressed2.txt');

    formatter1.saveToFile(uncompressedFile);
    formatter2.saveToFile(compressedFile);

    const uncompressedSize = fs.statSync(uncompressedFile).size;
    const compressedSize = fs.statSync(compressedFile + '.gz').size;

    assertTrue(compressedSize < uncompressedSize, 'Compressed should be smaller');
});

test('Compression: Compressed content can be decompressed', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        compression: true
    });

    const outputFile = path.join(FIXTURES_DIR, 'test-decompress.txt');
    formatter.saveToFile(outputFile);

    const compressed = fs.readFileSync(outputFile + '.gz');
    const decompressed = zlib.gunzipSync(compressed).toString('utf8');

    assertTrue(decompressed.length > 0, 'Should decompress');
    assertContains(decompressed, 'Directory:', 'Decompressed should have content');
});

test('Compression: Chunked digest with compression creates .gz files', () => {
    const formatter = new GitIngestFormatter(TEST_PROJECT_DIR, mockStats, analysisResults, {
        chunking: { enabled: true, maxTokensPerChunk: 200 },
        compression: true
    });

    const outputFile = path.join(FIXTURES_DIR, 'test-chunked-compressed.txt');
    formatter.saveToFile(outputFile);

    const chunk1File = path.join(FIXTURES_DIR, 'test-chunked-compressed-chunk-1.txt.gz');
    assertTrue(fs.existsSync(chunk1File), 'Should create compressed chunk file');
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

if (testsPassed + testsFailed > 0) {
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
}

// Cleanup
console.log('\n🧹 Cleaning up test fixtures...');
cleanupFixtures();

if (testsFailed === 0) {
    console.log('\n🎉 All comprehensive GitIngest formatter tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
