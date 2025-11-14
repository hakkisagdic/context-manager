#!/usr/bin/env node

/**
 * Performance Integration Benchmarks for Context Manager
 * Tests for Watch Mode, API Server, and Network operations
 */

import { APIServer } from '../lib/api/rest/server.js';
import { FileWatcher } from '../lib/watch/FileWatcher.js';
import { IncrementalAnalyzer } from '../lib/watch/IncrementalAnalyzer.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
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

// Helper to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
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

// Async benchmark framework
async function benchmarkAsync(name, fn, options = {}) {
    benchmarksRun++;
    const targetTime = options.targetTime || null;
    const targetMemory = options.targetMemory || null;
    const iterations = options.iterations || 1;

    try {
        console.log(`\n⏱️  ${name}`);

        if (global.gc) {
            global.gc();
        }

        const startMemory = process.memoryUsage();
        const startTime = Date.now();

        let result;
        for (let i = 0; i < iterations; i++) {
            result = await fn();
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
const TEMP_DIR = path.join(__dirname, 'fixtures', 'temp-perf-integration');
const API_PORT = 3456; // Non-standard port to avoid conflicts

// Setup
function setupFixtures() {
    console.log('🔧 Setting up integration test fixtures...');

    // Clean up temp dir
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    // Create test files
    for (let i = 0; i < 50; i++) {
        const content = `export function test${i}() { return ${i}; }\n`;
        fs.writeFileSync(path.join(TEMP_DIR, `file${i}.js`), content);
    }

    console.log('✅ Fixtures created\n');
}

// Cleanup
function cleanup() {
    console.log('\n🧹 Cleaning up...');
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
}

// Helper to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🚀 Context Manager Integration Performance Benchmarks\n');
console.log('='.repeat(80));

setupFixtures();

// ============================================================================
// WATCH MODE PERFORMANCE BENCHMARKS
// ============================================================================
console.log('\n👁️  Watch Mode Performance Benchmarks');
console.log('='.repeat(80));

await benchmarkAsync('Watch mode - FileWatcher startup time', async () => {
    const watcher = new FileWatcher(TEMP_DIR, {
        onChange: () => {}
    });

    const start = Date.now();
    await watcher.start();
    const elapsed = Date.now() - start;

    await watcher.stop();
    await wait(100); // Wait for cleanup

    return {
        throughput: `Started in ${elapsed}ms`,
        details: `Watching ${TEMP_DIR}`
    };
}, { targetTime: 500 });

await benchmarkAsync('Watch mode - incremental analysis speed', async () => {
    const testFile = path.join(TEMP_DIR, 'incremental-test.js');
    fs.writeFileSync(testFile, 'export const test = 1;');

    const analyzer = new IncrementalAnalyzer({
        rootPath: TEMP_DIR,
        methodLevel: false
    });

    // Analyze file initially
    const fileInfo = {
        path: testFile,
        relativePath: 'incremental-test.js',
        name: 'incremental-test.js',
        extension: '.js',
        size: fs.statSync(testFile).size,
        modified: Date.now(),
        exists: true
    };

    await analyzer.analyzeChange(fileInfo);

    // Modify file
    fs.writeFileSync(testFile, 'export const test = 2;');
    fileInfo.size = fs.statSync(testFile).size;
    fileInfo.modified = Date.now();

    // Measure incremental analysis time
    const start = Date.now();
    await analyzer.analyzeChange(fileInfo);
    const elapsed = Date.now() - start;

    return {
        throughput: `${elapsed}ms for incremental update`,
        details: `Single file re-analysis`
    };
}, { targetTime: 100 });

await benchmarkAsync('Watch mode - batch incremental analysis', async () => {
    const fileCount = 20;
    const analyzer = new IncrementalAnalyzer({
        rootPath: TEMP_DIR,
        methodLevel: false
    });

    // Create test files
    const files = [];
    for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(TEMP_DIR, `batch-${i}.js`);
        fs.writeFileSync(filePath, `export const test${i} = ${i};`);
        files.push({
            path: filePath,
            relativePath: `batch-${i}.js`,
            name: `batch-${i}.js`,
            extension: '.js',
            size: fs.statSync(filePath).size,
            modified: Date.now(),
            exists: true
        });
    }

    // Measure batch analysis time
    const start = Date.now();
    for (const fileInfo of files) {
        await analyzer.analyzeChange(fileInfo);
    }
    const elapsed = Date.now() - start;

    const avgTime = elapsed / fileCount;

    return {
        throughput: `${fileCount} files in ${elapsed}ms`,
        details: `Avg per file: ${Math.round(avgTime)}ms`
    };
}, { targetTime: 2000 });

// ============================================================================
// API SERVER PERFORMANCE BENCHMARKS
// ============================================================================
console.log('\n🌐 API Server Performance Benchmarks');
console.log('='.repeat(80));

await benchmarkAsync('API server - startup time', async () => {
    const server = new APIServer({
        port: API_PORT,
        host: 'localhost'
    });

    const startTime = Date.now();

    // Start server in background
    const startupPromise = new Promise((resolve) => {
        server.start();
        // Wait for server to be ready
        const checkInterval = setInterval(() => {
            if (server.isRunning) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 10);
    });

    await startupPromise;
    const elapsed = Date.now() - startTime;

    // Stop server
    server.stop();
    await wait(100); // Wait for cleanup

    return {
        throughput: `Started in ${elapsed}ms`,
        details: `Port: ${API_PORT}`
    };
}, { targetTime: 200 });

await benchmarkAsync('API server - endpoint response time', async () => {
    const server = new APIServer({
        port: API_PORT,
        host: 'localhost'
    });

    server.start();
    await wait(200); // Wait for server to be ready

    // Test health endpoint
    const start = Date.now();
    try {
        const response = await makeRequest(`http://localhost:${API_PORT}/api/v1/health`);
        const elapsed = Date.now() - start;

        server.stop();
        await wait(100);

        return {
            throughput: `${elapsed}ms response time`,
            details: `Status: ${response.statusCode}`
        };
    } catch (error) {
        server.stop();
        await wait(100);
        throw error;
    }
}, { targetTime: 100 });

await benchmarkAsync('API server - throughput (requests/second)', async () => {
    const server = new APIServer({
        port: API_PORT,
        host: 'localhost'
    });

    server.start();
    await wait(200);

    const iterations = 100;
    const requests = [];

    const start = Date.now();

    // Send requests sequentially for reliable measurement
    for (let i = 0; i < iterations; i++) {
        try {
            await makeRequest(`http://localhost:${API_PORT}/api/v1/health`);
        } catch (error) {
            // Ignore errors for throughput test
        }
    }

    const elapsed = Date.now() - start;
    const rps = Math.round((iterations / elapsed) * 1000);

    server.stop();
    await wait(100);

    return {
        throughput: `${rps} requests/sec`,
        details: `${iterations} requests in ${elapsed}ms`
    };
}, { targetTime: 5000 });

await benchmarkAsync('API server - concurrent requests handling', async () => {
    const server = new APIServer({
        port: API_PORT,
        host: 'localhost'
    });

    server.start();
    await wait(200);

    const concurrentRequests = 50;
    const requests = [];

    const start = Date.now();

    // Send all requests concurrently
    for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
            makeRequest(`http://localhost:${API_PORT}/api/v1/health`)
                .catch(() => ({ statusCode: 500 })) // Handle errors
        );
    }

    const responses = await Promise.all(requests);
    const elapsed = Date.now() - start;

    const successful = responses.filter(r => r.statusCode === 200 || r.statusCode === 404).length;

    server.stop();
    await wait(100);

    return {
        throughput: `${successful}/${concurrentRequests} successful`,
        details: `Completed in ${elapsed}ms, ${Math.round((concurrentRequests / elapsed) * 1000)} req/sec`
    };
}, { targetTime: 2000 });

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 INTEGRATION PERFORMANCE BENCHMARK SUMMARY');
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
const resultsPath = path.join(__dirname, 'fixtures', 'performance-integration-results.json');
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

console.log('\n✅ Integration performance benchmarks complete!\n');

// Exit with appropriate code
process.exit(benchmarksFailed > 0 ? 1 : 0);
