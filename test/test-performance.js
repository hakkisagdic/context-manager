#!/usr/bin/env node

/**
 * Performance Benchmarks for Context Manager
 * Comprehensive performance testing suite with ~20 benchmarks
 */

import { Scanner } from '../lib/core/Scanner.js';
import { Analyzer } from '../lib/core/Analyzer.js';
import { Reporter } from '../lib/core/Reporter.js';
import { CacheManager } from '../lib/cache/CacheManager.js';
import { FileWatcher } from '../lib/watch/FileWatcher.js';
import { IncrementalAnalyzer } from '../lib/watch/IncrementalAnalyzer.js';
import TokenCalculator from '../lib/analyzers/token-calculator.js';
import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';
import TokenUtils from '../lib/utils/token-utils.js';
import FileUtils from '../lib/utils/file-utils.js';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';
import FormatRegistry from '../lib/formatters/format-registry.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let benchmarksRun = 0;
let benchmarksPassed = 0;
let benchmarksFailed = 0;
let performanceResults = [];

// Helper to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper to format duration
function formatDuration(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

// Benchmark framework
function benchmark(name, fn, options = {}) {
    benchmarksRun++;
    const targetTime = options.targetTime || null;
    const targetMemory = options.targetMemory || null;
    const iterations = options.iterations || 1;

    try {
        console.log(`\n⏱️  ${name}`);

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const startMemory = process.memoryUsage();
        const startTime = Date.now();

        let result;
        for (let i = 0; i < iterations; i++) {
            result = fn();
        }

        const endTime = Date.now();
        const endMemory = process.memoryUsage();

        const duration = (endTime - startTime) / iterations;
        const memoryDelta = {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external,
            rss: endMemory.rss - startMemory.rss
        };

        const perfData = {
            name,
            duration,
            durationFormatted: formatDuration(duration),
            memory: memoryDelta,
            memoryFormatted: formatBytes(memoryDelta.heapUsed),
            result,
            iterations,
            timestamp: new Date().toISOString()
        };

        performanceResults.push(perfData);

        console.log(`   ⏱️  Duration: ${perfData.durationFormatted}`);
        console.log(`   💾 Memory: ${perfData.memoryFormatted} (heap)`);

        if (result && typeof result === 'object') {
            if (result.throughput) {
                console.log(`   📊 Throughput: ${result.throughput}`);
            }
            if (result.details) {
                console.log(`   ℹ️  ${result.details}`);
            }
        }

        // Check targets
        let passed = true;
        if (targetTime && duration > targetTime) {
            console.log(`   ⚠️  WARNING: Exceeded target time (${formatDuration(targetTime)})`);
            passed = false;
        }
        if (targetMemory && memoryDelta.heapUsed > targetMemory) {
            console.log(`   ⚠️  WARNING: Exceeded target memory (${formatBytes(targetMemory)})`);
            passed = false;
        }

        if (passed) {
            benchmarksPassed++;
            console.log(`   ✅ Passed`);
        } else {
            benchmarksFailed++;
            console.log(`   ⚠️  Performance target not met`);
        }

        return perfData;

    } catch (error) {
        benchmarksFailed++;
        console.error(`   ❌ Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n   ')}`);
        }
        return null;
    }
}

// Test fixtures
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'performance');
const TEMP_DIR = path.join(__dirname, 'fixtures', 'temp-perf');

// Create test fixtures
function setupFixtures() {
    console.log('🔧 Setting up performance test fixtures...');

    // Clean up temp dir
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Create sample files for testing
    const sampleJS = `
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

async function processData(items) {
    const results = [];
    for (const item of items) {
        results.push(await transform(item));
    }
    return results;
}

class DataProcessor {
    constructor(config) {
        this.config = config;
    }

    async process(data) {
        return await this.transform(data);
    }

    transform(data) {
        return data.map(item => item * 2);
    }
}

export { fibonacci, processData, DataProcessor };
`;

    const sampleLargeJS = sampleJS.repeat(100); // ~100KB file
    const sampleHugeJS = sampleJS.repeat(1000); // ~1MB file
    const sample10MB = sampleJS.repeat(10000); // ~10MB file
    const sample100MB = sampleJS.repeat(100000); // ~100MB file

    fs.writeFileSync(path.join(TEMP_DIR, 'small.js'), sampleJS);
    fs.writeFileSync(path.join(TEMP_DIR, 'large.js'), sampleLargeJS);
    fs.writeFileSync(path.join(TEMP_DIR, 'huge.js'), sampleHugeJS);

    console.log('   Creating 10MB test file...');
    fs.writeFileSync(path.join(TEMP_DIR, 'file-10mb.js'), sample10MB);

    console.log('   Creating 100MB test file (this may take a moment)...');
    fs.writeFileSync(path.join(TEMP_DIR, 'file-100mb.js'), sample100MB);

    console.log('✅ Fixtures created\n');
}

// Generate large test directory structure
function generateLargeCodebase(fileCount, baseDir) {
    console.log(`   Creating ${fileCount} test files...`);

    if (fs.existsSync(baseDir)) {
        fs.rmSync(baseDir, { recursive: true, force: true });
    }
    fs.mkdirSync(baseDir, { recursive: true });

    const sampleCode = `
export function testFunction${Math.random()}() {
    return "test";
}
`;

    const filesPerDir = 100;
    const dirCount = Math.ceil(fileCount / filesPerDir);

    for (let d = 0; d < dirCount; d++) {
        const dirPath = path.join(baseDir, `dir${d}`);
        fs.mkdirSync(dirPath, { recursive: true });

        const filesInThisDir = Math.min(filesPerDir, fileCount - (d * filesPerDir));
        for (let f = 0; f < filesInThisDir; f++) {
            const filePath = path.join(dirPath, `file${f}.js`);
            fs.writeFileSync(filePath, sampleCode);
        }
    }

    console.log(`   ✅ Created ${fileCount} files in ${dirCount} directories`);
}

// Cleanup
function cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

console.log('🚀 Context Manager Performance Benchmarks\n');
console.log('='.repeat(80));

setupFixtures();

// ============================================================================
// SCANNING PERFORMANCE BENCHMARKS
// ============================================================================
console.log('\n📂 File System Scanning Benchmarks');
console.log('='.repeat(80));

benchmark('Small codebase scan (100 files)', () => {
    const testDir = path.join(TEMP_DIR, 'scan-100');
    generateLargeCodebase(100, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        filesScanned: files.length,
        throughput: `${files.length} files`,
        details: `${scanner.stats.directoriesTraversed} directories traversed`
    };
}, { targetTime: 1000 });

benchmark('Medium codebase scan (1,000 files)', () => {
    const testDir = path.join(TEMP_DIR, 'scan-1000');
    generateLargeCodebase(1000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        filesScanned: files.length,
        throughput: `${files.length} files`,
        details: `${scanner.stats.directoriesTraversed} directories traversed`
    };
}, { targetTime: 3000 });

benchmark('Large codebase scan (10,000 files)', () => {
    const testDir = path.join(TEMP_DIR, 'scan-10k');
    generateLargeCodebase(10000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        filesScanned: files.length,
        throughput: `${(files.length / 1000).toFixed(1)}k files`,
        details: `${scanner.stats.directoriesTraversed} directories traversed`
    };
}, { targetTime: 10000 });

benchmark('Very large codebase scan (50,000 files)', () => {
    const testDir = path.join(TEMP_DIR, 'scan-50k');
    console.log('   ⚠️  Warning: Creating 50,000 files may take a while...');
    generateLargeCodebase(50000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        filesScanned: files.length,
        throughput: `${(files.length / 1000).toFixed(1)}k files`,
        details: `${scanner.stats.directoriesTraversed} directories traversed, ${(files.length / (Date.now() / 1000)).toFixed(0)} files/sec`
    };
}, { targetTime: 30000 });

benchmark('Extreme codebase scan (100,000 files)', () => {
    const testDir = path.join(TEMP_DIR, 'scan-100k');
    console.log('   ⚠️  Warning: Creating 100,000 files may take several minutes...');
    generateLargeCodebase(100000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        filesScanned: files.length,
        throughput: `${(files.length / 1000).toFixed(1)}k files`,
        details: `${scanner.stats.directoriesTraversed} directories traversed, ${(files.length / (Date.now() / 1000)).toFixed(0)} files/sec`
    };
}, { targetTime: 60000 });

// ============================================================================
// TOKEN CALCULATION PERFORMANCE
// ============================================================================
console.log('\n🔢 Token Calculation Benchmarks');
console.log('='.repeat(80));

benchmark('Token calculation - small file (1KB)', () => {
    const filePath = path.join(TEMP_DIR, 'small.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const iterations = 1000;
    let totalTokens = 0;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        totalTokens += TokenUtils.calculate(content, filePath);
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${Math.round(totalTokens / iterations)} tokens per file`
    };
}, { iterations: 1 });

benchmark('Token calculation - large file (100KB)', () => {
    const filePath = path.join(TEMP_DIR, 'large.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const iterations = 100;
    let totalTokens = 0;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        totalTokens += TokenUtils.calculate(content, filePath);
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${Math.round(totalTokens / iterations)} tokens per file`
    };
}, { iterations: 1 });

benchmark('Token calculation - huge file (1MB)', () => {
    const filePath = path.join(TEMP_DIR, 'huge.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const iterations = 10;
    let totalTokens = 0;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        totalTokens += TokenUtils.calculate(content, filePath);
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${Math.round(totalTokens / iterations)} tokens per file`
    };
}, { iterations: 1 });

benchmark('Token calculation - very large file (10MB)', () => {
    const filePath = path.join(TEMP_DIR, 'file-10mb.js');
    const content = fs.readFileSync(filePath, 'utf-8');
    const iterations = 3;
    let totalTokens = 0;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        totalTokens += TokenUtils.calculate(content, filePath);
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${Math.round(totalTokens / iterations)} tokens per file, ${formatBytes(content.length)} size`
    };
}, { iterations: 1, targetTime: 30000 });

benchmark('Token calculation - extreme file (100MB)', () => {
    const filePath = path.join(TEMP_DIR, 'file-100mb.js');
    console.log('   ⚠️  Reading 100MB file...');
    const content = fs.readFileSync(filePath, 'utf-8');

    const start = Date.now();
    const totalTokens = TokenUtils.calculate(content, filePath);
    const elapsed = Date.now() - start;

    return {
        throughput: `${(1 / (elapsed / 1000)).toFixed(2)} files/sec`,
        details: `${totalTokens} tokens, ${formatBytes(content.length)} size`
    };
}, { iterations: 1, targetTime: 60000 });

// ============================================================================
// METHOD EXTRACTION PERFORMANCE
// ============================================================================
console.log('\n🔍 Method Extraction Benchmarks');
console.log('='.repeat(80));

benchmark('Method extraction - small file', () => {
    const content = fs.readFileSync(path.join(TEMP_DIR, 'small.js'), 'utf-8');
    const analyzer = new MethodAnalyzer();
    const iterations = 1000;

    const start = Date.now();
    let totalMethods = 0;
    for (let i = 0; i < iterations; i++) {
        const methods = analyzer.extractMethods(content, 'test.js');
        totalMethods += methods.length;
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${totalMethods / iterations} methods per file`
    };
}, { iterations: 1 });

benchmark('Method extraction - large file', () => {
    const content = fs.readFileSync(path.join(TEMP_DIR, 'large.js'), 'utf-8');
    const analyzer = new MethodAnalyzer();
    const iterations = 100;

    const start = Date.now();
    let totalMethods = 0;
    for (let i = 0; i < iterations; i++) {
        const methods = analyzer.extractMethods(content, 'test.js');
        totalMethods += methods.length;
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(iterations / (elapsed / 1000))} files/sec`,
        details: `${totalMethods / iterations} methods per file`
    };
}, { iterations: 1 });

// ============================================================================
// MEMORY USAGE BENCHMARKS
// ============================================================================
console.log('\n💾 Memory Usage Benchmarks');
console.log('='.repeat(80));

benchmark('Memory usage - analyze 1,000 files', () => {
    const testDir = path.join(TEMP_DIR, 'memory-1000');
    generateLargeCodebase(1000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: false });
    const result = analyzer.analyze(files);

    return {
        filesAnalyzed: files.length,
        throughput: `${files.length} files analyzed`,
        details: `${result.stats?.totalTokens || 'N/A'} total tokens`
    };
}, { targetMemory: 100 * 1024 * 1024 }); // 100MB target

benchmark('Memory usage - analyze with method extraction', () => {
    const testDir = path.join(TEMP_DIR, 'memory-methods');
    generateLargeCodebase(500, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: true });
    const result = analyzer.analyze(files);

    return {
        filesAnalyzed: files.length,
        throughput: `${files.length} files with methods`,
        details: `${result.stats?.totalMethods || 'N/A'} total methods`
    };
}, { targetMemory: 150 * 1024 * 1024 }); // 150MB target

benchmark('Memory leak detection - repeated analysis', () => {
    const testDir = path.join(TEMP_DIR, 'memory-leak');
    generateLargeCodebase(100, testDir);

    if (global.gc) {
        global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    const memorySnapshots = [];

    // Run analysis 10 times
    for (let i = 0; i < 10; i++) {
        const scanner = new Scanner(testDir);
        const files = scanner.scan();
        const analyzer = new Analyzer({ methodLevel: true });
        analyzer.analyze(files);

        if (global.gc) {
            global.gc();
        }

        memorySnapshots.push(process.memoryUsage().heapUsed);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    const avgGrowthPerIteration = memoryGrowth / 10;

    // Check if memory is growing linearly (potential leak)
    const isLeaking = avgGrowthPerIteration > 5 * 1024 * 1024; // > 5MB per iteration

    return {
        throughput: isLeaking ? '⚠️  Potential leak detected' : '✅ No significant leak',
        details: `Memory growth: ${formatBytes(memoryGrowth)}, avg per iteration: ${formatBytes(avgGrowthPerIteration)}`
    };
}, { iterations: 1 });

benchmark('Parallel processing efficiency (simulated)', () => {
    const testDir = path.join(TEMP_DIR, 'parallel-test');
    generateLargeCodebase(500, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    // Sequential processing
    const seqStart = Date.now();
    const analyzer1 = new Analyzer({ methodLevel: false });
    analyzer1.analyze(files);
    const seqTime = Date.now() - seqStart;

    // Parallel processing simulation (split into chunks)
    const chunkSize = Math.ceil(files.length / 4);
    const chunks = [];
    for (let i = 0; i < files.length; i += chunkSize) {
        chunks.push(files.slice(i, i + chunkSize));
    }

    const parallelStart = Date.now();
    const results = chunks.map(chunk => {
        const analyzer = new Analyzer({ methodLevel: false });
        return analyzer.analyze(chunk);
    });
    const parallelTime = Date.now() - parallelStart;

    const speedup = (seqTime / parallelTime).toFixed(2);

    return {
        throughput: `${speedup}x speedup (4 chunks)`,
        details: `Sequential: ${seqTime}ms, Parallel: ${parallelTime}ms`
    };
}, { iterations: 1 });

// ============================================================================
// CACHE PERFORMANCE BENCHMARKS
// ============================================================================
console.log('\n🗄️  Cache Performance Benchmarks');
console.log('='.repeat(80));

benchmark('Cache - memory cache write/read speed', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const iterations = 10000;

    const testData = { tokens: 100, lines: 50, methods: [] };
    const modifiedTime = Date.now();

    // Write test
    const writeStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        cache.set(`/test/file${i}.js`, testData, modifiedTime);
    }
    const writeElapsed = Date.now() - writeStart;

    // Read test
    const readStart = Date.now();
    let hits = 0;
    for (let i = 0; i < iterations; i++) {
        const result = cache.get(`/test/file${i}.js`, modifiedTime);
        if (result) hits++;
    }
    const readElapsed = Date.now() - readStart;

    return {
        throughput: `${Math.round(iterations / (writeElapsed / 1000))} writes/sec, ${Math.round(iterations / (readElapsed / 1000))} reads/sec`,
        details: `${hits}/${iterations} cache hits (${((hits/iterations) * 100).toFixed(1)}%)`
    };
}, { iterations: 1 });

benchmark('Cache - hit rate measurement', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });

    const testData = { tokens: 100, lines: 50 };
    const modifiedTime = Date.now();
    const fileCount = 1000;

    // Populate cache
    for (let i = 0; i < fileCount; i++) {
        cache.set(`/test/file${i}.js`, testData, modifiedTime);
    }

    // Test cache hits
    let hits = 0;
    for (let i = 0; i < fileCount; i++) {
        const result = cache.get(`/test/file${i}.js`, modifiedTime);
        if (result) hits++;
    }

    const hitRate = (hits / fileCount) * 100;

    return {
        throughput: `${hitRate.toFixed(1)}% hit rate`,
        details: `${hits}/${fileCount} cache hits`
    };
}, { iterations: 1 });

// ============================================================================
// FILE I/O PERFORMANCE
// ============================================================================
console.log('\n📄 File I/O Performance Benchmarks');
console.log('='.repeat(80));

benchmark('File I/O - read 1,000 small files', () => {
    const testDir = path.join(TEMP_DIR, 'io-1000');
    generateLargeCodebase(1000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const start = Date.now();
    let totalBytes = 0;
    for (const file of files) {
        const content = fs.readFileSync(file.path, 'utf-8');
        totalBytes += content.length;
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round(files.length / (elapsed / 1000))} files/sec`,
        details: `${formatBytes(totalBytes)} total read`
    };
}, { iterations: 1 });

// ============================================================================
// PATTERN MATCHING PERFORMANCE
// ============================================================================
console.log('\n🔎 Pattern Matching Performance Benchmarks');
console.log('='.repeat(80));

benchmark('Pattern matching - GitIgnore parser', () => {
    const testDir = path.join(TEMP_DIR, 'gitignore-test');
    fs.mkdirSync(testDir, { recursive: true });

    const gitignorePath = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignorePath, `
node_modules/
*.log
dist/
build/
.env
*.tmp
test/fixtures/
**/*.test.js
coverage/
.cache/
`);

    const parser = new GitIgnoreParser(gitignorePath, null, null);
    const iterations = 10000;

    const testPaths = [
        'src/index.js',
        'node_modules/package/index.js',
        'dist/bundle.js',
        'test.log',
        'build/output.js',
        'src/components/Button.js',
        'test/fixtures/sample.js',
        'coverage/report.html'
    ];

    const start = Date.now();
    let ignoredCount = 0;
    for (let i = 0; i < iterations; i++) {
        for (const testPath of testPaths) {
            if (parser.isIgnored(testPath, testPath)) {
                ignoredCount++;
            }
        }
    }
    const elapsed = Date.now() - start;

    return {
        throughput: `${Math.round((iterations * testPaths.length) / (elapsed / 1000))} checks/sec`,
        details: `${ignoredCount} paths ignored`
    };
}, { iterations: 1 });

benchmark('Pattern matching - Method filter parser', () => {
    const testDir = path.join(TEMP_DIR, 'methodfilter-test');
    fs.mkdirSync(testDir, { recursive: true });

    const filterPath = path.join(testDir, '.methodignore');
    fs.writeFileSync(filterPath, `
test*
*Test
*_test
private*
_*
get*
set*
`);

    const parser = new MethodFilterParser(null, filterPath);
    const iterations = 10000;

    const testMethods = [
        'testFunction',
        'myTest',
        'helper_test',
        'privateMethod',
        '_internal',
        'getName',
        'setName',
        'processData',
        'calculateTotal'
    ];

    const start = Date.now();
    let includedCount = 0;
    for (let i = 0; i < iterations; i++) {
        for (const method of testMethods) {
            if (parser.shouldIncludeMethod(method, 'test.js')) {
                includedCount++;
            }
        }
    }
    const elapsed = Date.now() - start;
    const ignoredCount = (iterations * testMethods.length) - includedCount;

    return {
        throughput: `${Math.round((iterations * testMethods.length) / (elapsed / 1000))} checks/sec`,
        details: `${ignoredCount} methods ignored`
    };
}, { iterations: 1 });

benchmark('Regex compilation caching efficiency', () => {
    const analyzer = new MethodAnalyzer();
    const iterations = 1000;

    // Test with pre-compiled (cached) regexes
    const cachedStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        const testCode = `function test${i}() { return ${i}; }`;
        analyzer.extractMethods(testCode, 'test.js');
    }
    const cachedTime = Date.now() - cachedStart;

    // Test with fresh regex compilation (simulate no cache)
    const freshStart = Date.now();
    for (let i = 0; i < iterations; i++) {
        const testCode = `function test${i}() { return ${i}; }`;
        const freshAnalyzer = new MethodAnalyzer();
        freshAnalyzer.extractMethods(testCode, 'test.js');
    }
    const freshTime = Date.now() - freshStart;

    const improvement = ((freshTime - cachedTime) / freshTime * 100).toFixed(1);

    return {
        throughput: `${improvement}% faster with caching`,
        details: `Cached: ${cachedTime}ms, Fresh: ${freshTime}ms`
    };
}, { iterations: 1 });

// ============================================================================
// DIRECTORY TRAVERSAL BENCHMARKS
// ============================================================================
console.log('\n🌳 Directory Traversal Benchmarks');
console.log('='.repeat(80));

benchmark('Deep directory traversal (50 levels)', () => {
    const testDir = path.join(TEMP_DIR, 'deep-dir');

    // Create deep nested structure
    let currentDir = testDir;
    for (let i = 0; i < 50; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        fs.mkdirSync(currentDir, { recursive: true });
        fs.writeFileSync(path.join(currentDir, 'file.js'), 'export const test = 1;');
    }

    const scanner = new Scanner(testDir, { maxDepth: Infinity });
    const files = scanner.scan();

    return {
        throughput: `${files.length} files found`,
        details: `${scanner.stats.directoriesTraversed} directories traversed`
    };
}, { targetTime: 1000 });

benchmark('Wide directory traversal (100 files per dir)', () => {
    const testDir = path.join(TEMP_DIR, 'wide-dir');
    fs.mkdirSync(testDir, { recursive: true });

    // Create 10 directories with 100 files each
    for (let d = 0; d < 10; d++) {
        const dirPath = path.join(testDir, `dir${d}`);
        fs.mkdirSync(dirPath, { recursive: true });

        for (let f = 0; f < 100; f++) {
            fs.writeFileSync(path.join(dirPath, `file${f}.js`), 'export const test = 1;');
        }
    }

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        throughput: `${files.length} files found`,
        details: `${scanner.stats.directoriesTraversed} directories traversed`
    };
}, { targetTime: 2000 });

benchmark('Extreme deep directory traversal (150 levels)', () => {
    const testDir = path.join(TEMP_DIR, 'extreme-deep-dir');

    // Create very deep nested structure
    let currentDir = testDir;
    for (let i = 0; i < 150; i++) {
        currentDir = path.join(currentDir, `level${i}`);
        fs.mkdirSync(currentDir, { recursive: true });
        fs.writeFileSync(path.join(currentDir, 'file.js'), 'export const test = 1;');
    }

    const scanner = new Scanner(testDir, { maxDepth: Infinity });
    const files = scanner.scan();

    return {
        throughput: `${files.length} files found`,
        details: `${scanner.stats.directoriesTraversed} directories traversed, max depth: 150`
    };
}, { targetTime: 2000 });

benchmark('Very wide directory traversal (1,000 files per dir)', () => {
    const testDir = path.join(TEMP_DIR, 'very-wide-dir');
    fs.mkdirSync(testDir, { recursive: true });

    // Create 5 directories with 1000 files each
    for (let d = 0; d < 5; d++) {
        const dirPath = path.join(testDir, `dir${d}`);
        fs.mkdirSync(dirPath, { recursive: true });

        for (let f = 0; f < 1000; f++) {
            fs.writeFileSync(path.join(dirPath, `file${f}.js`), 'export const test = 1;');
        }
    }

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    return {
        throughput: `${files.length} files found`,
        details: `${scanner.stats.directoriesTraversed} directories, ${Math.round(files.length / scanner.stats.directoriesTraversed)} files/dir avg`
    };
}, { targetTime: 5000 });

// ============================================================================
// EXPORT GENERATION BENCHMARKS
// ============================================================================
console.log('\n📤 Export Generation Benchmarks');
console.log('='.repeat(80));

benchmark('Export generation - JSON format (1,000 files)', () => {
    const testDir = path.join(TEMP_DIR, 'export-1000');
    generateLargeCodebase(1000, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: false });
    const result = analyzer.analyze(files);

    const jsonOutput = JSON.stringify(result, null, 2);

    return {
        throughput: `${files.length} files exported`,
        details: `${formatBytes(jsonOutput.length)} JSON size`
    };
}, { targetTime: 3000 });

benchmark('Export generation - Method-level export', () => {
    const testDir = path.join(TEMP_DIR, 'export-methods');
    generateLargeCodebase(500, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: true });
    const result = analyzer.analyze(files);

    const jsonOutput = JSON.stringify(result, null, 2);

    return {
        throughput: `${files.length} files with methods`,
        details: `${formatBytes(jsonOutput.length)} JSON size`
    };
}, { targetTime: 5000 });

benchmark('Export all formats - performance comparison', () => {
    const testDir = path.join(TEMP_DIR, 'export-all-formats');
    generateLargeCodebase(200, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: false });
    const result = analyzer.analyze(files);

    const registry = new FormatRegistry();
    const formats = ['json', 'json-compact', 'yaml', 'csv', 'xml', 'markdown', 'toon'];
    const results = {};

    for (const format of formats) {
        const start = Date.now();
        try {
            const output = registry.encode(format, result);
            const elapsed = Date.now() - start;
            results[format] = {
                time: elapsed,
                size: output.length
            };
        } catch (error) {
            results[format] = {
                time: 0,
                size: 0,
                error: error.message
            };
        }
    }

    // Find best (smallest) format
    const formatSizes = Object.entries(results)
        .filter(([_, data]) => !data.error)
        .map(([format, data]) => ({ format, size: data.size }))
        .sort((a, b) => a.size - b.size);

    const best = formatSizes[0];
    const worst = formatSizes[formatSizes.length - 1];
    const reduction = ((worst.size - best.size) / worst.size * 100).toFixed(1);

    return {
        throughput: `${formats.length} formats exported`,
        details: `Best: ${best.format} (${formatBytes(best.size)}), Worst: ${worst.format} (${formatBytes(worst.size)}), ${reduction}% reduction`
    };
}, { iterations: 1 });

benchmark('Export - TOON format compression ratio', () => {
    const testDir = path.join(TEMP_DIR, 'export-toon');
    generateLargeCodebase(500, testDir);

    const scanner = new Scanner(testDir);
    const files = scanner.scan();

    const analyzer = new Analyzer({ methodLevel: false });
    const result = analyzer.analyze(files);

    const registry = new FormatRegistry();

    // Standard JSON
    const jsonOutput = registry.encode('json', result);

    // TOON format
    const toonOutput = registry.encode('toon', result);

    const reduction = ((jsonOutput.length - toonOutput.length) / jsonOutput.length * 100).toFixed(1);

    return {
        throughput: `${reduction}% token reduction`,
        details: `JSON: ${formatBytes(jsonOutput.length)}, TOON: ${formatBytes(toonOutput.length)}`
    };
}, { targetTime: 3000 });

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 PERFORMANCE BENCHMARK SUMMARY');
console.log('='.repeat(80));

console.log(`\nTotal Benchmarks: ${benchmarksRun}`);
console.log(`✅ Passed: ${benchmarksPassed}`);
console.log(`⚠️  Failed/Warnings: ${benchmarksFailed}`);

if (performanceResults.length > 0) {
    console.log('\n📈 Performance Metrics:');
    console.log('-'.repeat(80));

    const sortedByDuration = [...performanceResults].sort((a, b) => b.duration - a.duration);

    console.log('\n⏱️  Slowest Benchmarks:');
    sortedByDuration.slice(0, 5).forEach((result, i) => {
        console.log(`   ${i + 1}. ${result.name}: ${result.durationFormatted}`);
    });

    const sortedByMemory = [...performanceResults].sort((a, b) => b.memory.heapUsed - a.memory.heapUsed);

    console.log('\n💾 Highest Memory Usage:');
    sortedByMemory.slice(0, 5).forEach((result, i) => {
        if (result.memory.heapUsed > 0) {
            console.log(`   ${i + 1}. ${result.name}: ${formatBytes(result.memory.heapUsed)}`);
        }
    });

    const totalDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\n⏱️  Total Execution Time: ${formatDuration(totalDuration)}`);
}

// Save detailed results
const resultsPath = path.join(__dirname, 'fixtures', 'performance-results.json');
fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
        total: benchmarksRun,
        passed: benchmarksPassed,
        failed: benchmarksFailed
    },
    results: performanceResults,
    environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        totalMemory: formatBytes(os.totalmem())
    }
}, null, 2));

console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

cleanup();

console.log('\n✅ Performance benchmarks complete!\n');

// Exit with appropriate code
process.exit(benchmarksFailed > 0 ? 1 : 0);
