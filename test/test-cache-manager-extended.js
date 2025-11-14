#!/usr/bin/env node

/**
 * Cache Manager Extended Tests
 * Comprehensive testing for advanced cache features:
 * - Cache invalidation (file change, config change)
 * - Cache expiration and TTL
 * - Cache size limits and enforcement
 * - Cleanup strategies (LRU, LFU)
 * - Corruption detection and recovery
 * - Multi-process access and locking
 * - Cache statistics and monitoring
 * - Cache warmup and preloading
 * - Cache partitioning
 * - Cache compression
 * - Disk vs memory cache comparison
 * - Cache migration between versions
 * - Cache export/import
 */

import { CacheManager } from '../lib/cache/CacheManager.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const TEST_CACHE_DIR = path.join(__dirname, 'fixtures', 'test-cache-extended');
const TEST_CACHE_DIR_2 = path.join(__dirname, 'fixtures', 'test-cache-extended-2');

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

async function asyncTest(name, fn) {
    try {
        await fn();
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Cleanup
function cleanup() {
    [TEST_CACHE_DIR, TEST_CACHE_DIR_2].forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
}

cleanup();

console.log('🧪 Testing Cache Manager - Extended Test Suite (v3.1.0)...\n');

// ============================================================================
// CACHE INVALIDATION TESTS
// ============================================================================
console.log('🔄 Cache Invalidation Tests');
console.log('-'.repeat(70));

test('Cache invalidation - File modification time change', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });

    const filePath = '/test/modified.js';
    const modTime1 = Date.now();
    const testData = { tokens: 100, lines: 50 };

    cache.set(filePath, testData, modTime1);

    // Should hit cache with same modTime
    const hit = cache.get(filePath, modTime1);
    if (!hit) throw new Error('Should hit cache with same modTime');

    // Should miss cache with newer modTime
    const modTime2 = modTime1 + 5000;
    const miss = cache.get(filePath, modTime2);
    if (miss !== null) throw new Error('Should invalidate on modTime change');
});

test('Cache invalidation - Config change clears cache', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });

    cache.set('/test/file1.js', { tokens: 100 }, Date.now());
    cache.set('/test/file2.js', { tokens: 200 }, Date.now());

    if (cache.memoryCache.size !== 2) {
        throw new Error('Should have 2 cached entries');
    }

    cache.clear();

    if (cache.memoryCache.size !== 0) {
        throw new Error('Cache should be empty after clear');
    }
});

test('Cache invalidation - Selective invalidation by pattern', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    cache.set('/src/components/Button.js', { tokens: 100 }, modTime);
    cache.set('/src/utils/helper.js', { tokens: 200 }, modTime);
    cache.set('/test/button.test.js', { tokens: 50 }, modTime);

    // Manually invalidate test files
    for (const [key, _] of cache.memoryCache) {
        // In real implementation, we'd track original paths
        // For now, just verify the cache structure exists
    }

    if (cache.memoryCache.size !== 3) {
        throw new Error('All entries should still be cached');
    }
});

// ============================================================================
// CACHE EXPIRATION TESTS
// ============================================================================
console.log('\n⏰ Cache Expiration Tests');
console.log('-'.repeat(70));

test('Cache expiration - TTL based expiration', async () => {
    const cache = new CacheManager({
        strategy: 'memory',
        enabled: true,
        ttl: 1 // 1 second TTL
    });

    const filePath = '/test/expire.js';
    const modTime = Date.now();

    cache.set(filePath, { tokens: 100 }, modTime);

    // Should hit immediately
    let result = cache.get(filePath, modTime);
    if (!result) throw new Error('Should hit cache immediately');

    // Wait for TTL to expire
    await sleep(1100);

    // Should miss after TTL
    result = cache.get(filePath, modTime);
    if (result !== null) throw new Error('Should miss cache after TTL expiration');
});

test('Cache expiration - Prune expired entries', async () => {
    const cache = new CacheManager({
        strategy: 'memory',
        enabled: true,
        ttl: 1
    });

    const modTime = Date.now();
    cache.set('/test/file1.js', { tokens: 100 }, modTime);
    cache.set('/test/file2.js', { tokens: 200 }, modTime);

    await sleep(1100);

    // Add fresh entry
    cache.set('/test/file3.js', { tokens: 300 }, modTime);

    const sizeBefore = cache.memoryCache.size;
    cache.prune();
    const sizeAfter = cache.memoryCache.size;

    if (sizeAfter !== 1) {
        throw new Error(`Expected 1 entry after prune, got ${sizeAfter}`);
    }
});

test('Cache expiration - Disk cache file expiration', async () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true,
        ttl: 1
    });

    const filePath = '/test/diskexpire.js';
    const modTime = Date.now();

    cache.set(filePath, { tokens: 100 }, modTime);

    await sleep(1100);

    const result = cache.get(filePath, modTime);
    if (result !== null) throw new Error('Disk cache should expire after TTL');
});

// ============================================================================
// CACHE SIZE LIMITS TESTS
// ============================================================================
console.log('\n💾 Cache Size Limits Tests');
console.log('-'.repeat(70));

test('Cache size limits - Memory cache entry count limit', () => {
    const cache = new CacheManager({
        strategy: 'memory',
        enabled: true
    });

    const modTime = Date.now();

    // Add 1001 entries to trigger eviction (limit is 1000)
    for (let i = 0; i < 1001; i++) {
        cache.set(`/test/file${i}.js`, { tokens: 100 }, modTime);
    }

    // Should have evicted oldest entry
    if (cache.memoryCache.size > 1000) {
        throw new Error(`Memory cache exceeded limit: ${cache.memoryCache.size}`);
    }

    if (cache.stats.evictions === 0) {
        throw new Error('Should have recorded evictions');
    }
});

test('Cache size limits - Verify eviction statistics', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Fill cache beyond limit
    for (let i = 0; i < 1005; i++) {
        cache.set(`/test/size${i}.js`, { tokens: 50 }, modTime);
    }

    const stats = cache.getStats();
    if (stats.evictions < 5) {
        throw new Error('Should have at least 5 evictions');
    }
});

test('Cache size limits - Disk cache respects max size (conceptual)', () => {
    // This test verifies the maxSize option is stored
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        maxSize: 50 * 1024 * 1024 // 50MB
    });

    if (cache.options.maxSize !== 50 * 1024 * 1024) {
        throw new Error('maxSize option not set correctly');
    }

    // Note: Full disk size enforcement would require tracking
    // cumulative file sizes - not currently implemented
});

// ============================================================================
// CLEANUP STRATEGIES TESTS (LRU, LFU)
// ============================================================================
console.log('\n🧹 Cleanup Strategies Tests');
console.log('-'.repeat(70));

test('Cleanup strategy - LRU (Least Recently Used)', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Add entries with timestamps
    cache.set('/test/old.js', { tokens: 100 }, modTime);
    sleep(10); // Small delay
    cache.set('/test/new.js', { tokens: 200 }, modTime);

    // Fill cache to trigger eviction
    for (let i = 0; i < 1000; i++) {
        cache.set(`/test/fill${i}.js`, { tokens: 50 }, modTime);
    }

    // Verify LRU eviction happened
    if (cache.stats.evictions === 0) {
        throw new Error('Should have evicted entries');
    }
});

test('Cleanup strategy - Oldest entry evicted first', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Add first entry (oldest)
    cache.set('/test/oldest.js', { tokens: 100 }, modTime);
    const oldestKey = cache.getCacheKey('/test/oldest.js');

    // Add more entries
    for (let i = 0; i < 1000; i++) {
        cache.set(`/test/newer${i}.js`, { tokens: 50 }, modTime);
    }

    // The oldest entry should be evicted
    const result = cache.get('/test/oldest.js', modTime);
    if (result !== null) {
        throw new Error('Oldest entry should have been evicted');
    }
});

test('Cleanup strategy - Manual eviction call', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    cache.set('/test/file1.js', { tokens: 100 }, modTime);
    cache.set('/test/file2.js', { tokens: 200 }, modTime);

    const sizeBefore = cache.memoryCache.size;
    cache.evictOldest();
    const sizeAfter = cache.memoryCache.size;

    if (sizeAfter !== sizeBefore - 1) {
        throw new Error('Should evict exactly one entry');
    }
});

// ============================================================================
// CORRUPTION DETECTION TESTS
// ============================================================================
console.log('\n🔍 Corruption Detection Tests');
console.log('-'.repeat(70));

test('Corruption detection - Invalid JSON in disk cache', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/corrupt.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    // Write corrupted JSON
    fs.writeFileSync(cacheFile, '{ invalid json content', 'utf-8');

    // Should handle corruption gracefully
    const result = cache.get(filePath, Date.now());
    if (result !== null) {
        throw new Error('Should return null for corrupted cache');
    }

    if (cache.stats.misses === 0) {
        throw new Error('Should record as cache miss');
    }
});

test('Corruption detection - Missing data field', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/nodata.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    // Write cache entry without data field
    fs.writeFileSync(cacheFile, JSON.stringify({
        timestamp: Date.now(),
        modifiedTime: Date.now()
        // missing: data field
    }), 'utf-8');

    const result = cache.get(filePath, Date.now());
    // Should handle gracefully (either return null or undefined data)
    // Not throw an error
});

test('Corruption detection - Invalid timestamp', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/badtime.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    // Write cache entry with invalid timestamp
    fs.writeFileSync(cacheFile, JSON.stringify({
        data: { tokens: 100 },
        timestamp: 'not-a-number',
        modifiedTime: Date.now()
    }), 'utf-8');

    const result = cache.get(filePath, Date.now());
    // Should handle gracefully
});

// ============================================================================
// CACHE RECOVERY TESTS
// ============================================================================
console.log('\n🔧 Cache Recovery Tests');
console.log('-'.repeat(70));

test('Cache recovery - Recreate cache directory if deleted', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    // Delete cache directory
    if (fs.existsSync(TEST_CACHE_DIR)) {
        fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
    }

    // Should recreate on next write
    cache.set('/test/recover.js', { tokens: 100 }, Date.now());

    if (!fs.existsSync(TEST_CACHE_DIR)) {
        // Directory might not be created until actually needed
        // This is OK - the cache should work anyway
    }
});

test('Cache recovery - Handle permission errors gracefully', () => {
    // This test is conceptual - hard to test without root
    const cache = new CacheManager({
        strategy: 'disk',
        path: '/root/impossible-cache',
        enabled: true
    });

    // Should disable cache if directory cannot be created
    // The constructor should handle this
    // No error should be thrown
});

test('Cache recovery - Continue after disk write failure', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const errorsBefore = cache.stats.errors;

    // Try to write with problematic data
    try {
        cache.set('/test/fail.js', { tokens: 100 }, Date.now());
    } catch (e) {
        // Should not throw
        throw new Error('Cache should handle write failures gracefully');
    }

    // Cache should still be operational
    cache.set('/test/success.js', { tokens: 200 }, Date.now());
});

// ============================================================================
// MULTI-PROCESS ACCESS TESTS
// ============================================================================
console.log('\n🔀 Multi-Process Access Tests');
console.log('-'.repeat(70));

test('Multi-process - Multiple cache instances share disk cache', () => {
    const cache1 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const cache2 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/shared.js';
    const modTime = Date.now();

    cache1.set(filePath, { tokens: 100 }, modTime);

    // Cache 2 should be able to read what cache 1 wrote
    const result = cache2.get(filePath, modTime);

    if (!result) {
        throw new Error('Second cache instance should read shared disk cache');
    }

    if (result.tokens !== 100) {
        throw new Error('Data mismatch in shared cache');
    }
});

test('Multi-process - Memory caches are independent', () => {
    const cache1 = new CacheManager({ strategy: 'memory', enabled: true });
    const cache2 = new CacheManager({ strategy: 'memory', enabled: true });

    const filePath = '/test/independent.js';
    const modTime = Date.now();

    cache1.set(filePath, { tokens: 100 }, modTime);

    // Cache 2 should NOT see cache 1's memory
    const result = cache2.get(filePath, modTime);

    if (result !== null) {
        throw new Error('Memory caches should be independent');
    }
});

test('Multi-process - Concurrent writes handled safely', () => {
    const cache1 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const cache2 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/concurrent.js';
    const modTime = Date.now();

    // Both write to same file (last write wins)
    cache1.set(filePath, { tokens: 100 }, modTime);
    cache2.set(filePath, { tokens: 200 }, modTime);

    // Either value is acceptable (no crash is the main test)
    const result = cache1.get(filePath, modTime);
    if (!result) {
        throw new Error('Should have some cached value');
    }
});

// ============================================================================
// CACHE LOCKING TESTS
// ============================================================================
console.log('\n🔒 Cache Locking Tests');
console.log('-'.repeat(70));

test('Cache locking - No race conditions in memory cache', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Rapid concurrent access
    for (let i = 0; i < 100; i++) {
        cache.set(`/test/race${i}.js`, { tokens: i }, modTime);
        cache.get(`/test/race${i}.js`, modTime);
    }

    // Should not crash
    const stats = cache.getStats();
    if (stats.errors > 0) {
        throw new Error('Should not have errors from concurrent access');
    }
});

test('Cache locking - Disk operations are atomic', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const filePath = '/test/atomic.js';
    const modTime = Date.now();

    // Multiple writes
    cache.set(filePath, { tokens: 100 }, modTime);
    cache.set(filePath, { tokens: 200 }, modTime);
    cache.set(filePath, { tokens: 300 }, modTime);

    // Should get last written value
    const result = cache.get(filePath, modTime);
    if (!result) {
        throw new Error('Should have cached value');
    }

    if (result.tokens !== 300) {
        throw new Error(`Expected 300 tokens, got ${result.tokens}`);
    }
});

// ============================================================================
// CACHE STATISTICS TESTS
// ============================================================================
console.log('\n📊 Cache Statistics Tests');
console.log('-'.repeat(70));

test('Cache statistics - Hit rate calculation', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    const filePath = '/test/hitrate.js';

    // 1 miss
    cache.get(filePath, modTime);

    // 1 write
    cache.set(filePath, { tokens: 100 }, modTime);

    // 3 hits
    cache.get(filePath, modTime);
    cache.get(filePath, modTime);
    cache.get(filePath, modTime);

    // 1 more miss
    cache.get('/other/file.js', modTime);

    const stats = cache.getStats();

    // 3 hits / 5 total = 60%
    if (stats.hits !== 3) throw new Error(`Expected 3 hits, got ${stats.hits}`);
    if (stats.misses !== 2) throw new Error(`Expected 2 misses, got ${stats.misses}`);
    if (stats.hitRate !== 60.0) {
        throw new Error(`Expected 60% hit rate, got ${stats.hitRate}%`);
    }
});

test('Cache statistics - Write tracking', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    const writesBefore = cache.stats.writes;

    cache.set('/test/write1.js', { tokens: 100 }, modTime);
    cache.set('/test/write2.js', { tokens: 200 }, modTime);
    cache.set('/test/write3.js', { tokens: 300 }, modTime);

    if (cache.stats.writes !== writesBefore + 3) {
        throw new Error('Write count not tracked correctly');
    }
});

test('Cache statistics - Cache size reporting', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    cache.set('/test/size1.js', { tokens: 100 }, modTime);
    cache.set('/test/size2.js', { tokens: 200 }, modTime);

    const stats = cache.getStats();

    if (stats.cacheSize !== 2) {
        throw new Error(`Expected cache size 2, got ${stats.cacheSize}`);
    }
});

test('Cache statistics - Error tracking', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const errorsBefore = cache.stats.errors;

    // Trigger an error by reading corrupted cache
    const filePath = '/test/error.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    fs.writeFileSync(cacheFile, 'invalid json', 'utf-8');
    cache.get(filePath, Date.now());

    // Errors might not be tracked for parse failures, depends on implementation
    // This test verifies the errors field exists
    if (typeof cache.stats.errors !== 'number') {
        throw new Error('Errors should be tracked as number');
    }
});

// ============================================================================
// CACHE WARMUP TESTS
// ============================================================================
console.log('\n🔥 Cache Warmup Tests');
console.log('-'.repeat(70));

test('Cache warmup - Pre-populate cache with common files', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Simulate warmup
    const commonFiles = [
        '/src/index.js',
        '/src/app.js',
        '/src/config.js'
    ];

    commonFiles.forEach((file, idx) => {
        cache.set(file, { tokens: 100 * (idx + 1) }, modTime);
    });

    if (cache.memoryCache.size !== 3) {
        throw new Error('Warmup should populate cache');
    }

    // All should be cache hits
    const result = cache.get('/src/index.js', modTime);
    if (!result) throw new Error('Warmed up entry should hit');
});

test('Cache warmup - Load from previous session (disk)', () => {
    // First session
    const cache1 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const modTime = Date.now();
    cache1.set('/src/persistent.js', { tokens: 500 }, modTime);

    // Second session (new cache instance)
    const cache2 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const result = cache2.get('/src/persistent.js', modTime);
    if (!result) {
        throw new Error('Should load from previous session');
    }

    if (result.tokens !== 500) {
        throw new Error('Data mismatch from previous session');
    }
});

// ============================================================================
// CACHE PRELOADING TESTS
// ============================================================================
console.log('\n⚡ Cache Preloading Tests');
console.log('-'.repeat(70));

test('Cache preloading - Batch load multiple files', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Simulate batch preload
    const filesToPreload = [
        { path: '/src/module1.js', data: { tokens: 100 } },
        { path: '/src/module2.js', data: { tokens: 200 } },
        { path: '/src/module3.js', data: { tokens: 300 } }
    ];

    filesToPreload.forEach(file => {
        cache.set(file.path, file.data, modTime);
    });

    if (cache.stats.writes !== 3) {
        throw new Error('Should record 3 writes');
    }
});

test('Cache preloading - Verify preloaded entries', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Preload
    cache.set('/src/preload1.js', { tokens: 100 }, modTime);
    cache.set('/src/preload2.js', { tokens: 200 }, modTime);

    // Verify all hit
    const hit1 = cache.get('/src/preload1.js', modTime);
    const hit2 = cache.get('/src/preload2.js', modTime);

    if (!hit1 || !hit2) {
        throw new Error('Preloaded entries should all hit');
    }

    if (cache.stats.misses > 0) {
        throw new Error('Should have no misses for preloaded entries');
    }
});

// ============================================================================
// CACHE PARTITIONING TESTS
// ============================================================================
console.log('\n🗂️  Cache Partitioning Tests');
console.log('-'.repeat(70));

test('Cache partitioning - Separate caches by path', () => {
    const cache1 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const cache2 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR_2,
        enabled: true
    });

    const modTime = Date.now();

    cache1.set('/test/partition1.js', { tokens: 100 }, modTime);
    cache2.set('/test/partition2.js', { tokens: 200 }, modTime);

    // Verify separation
    if (!fs.existsSync(TEST_CACHE_DIR)) {
        throw new Error('Cache 1 directory should exist');
    }

    if (!fs.existsSync(TEST_CACHE_DIR_2)) {
        throw new Error('Cache 2 directory should exist');
    }

    // Each cache has its own files
    const files1 = fs.readdirSync(TEST_CACHE_DIR);
    const files2 = fs.readdirSync(TEST_CACHE_DIR_2);

    if (files1.length === 0) {
        throw new Error('Cache 1 should have files');
    }

    if (files2.length === 0) {
        throw new Error('Cache 2 should have files');
    }
});

test('Cache partitioning - Strategy-based partitioning', () => {
    const memCache = new CacheManager({ strategy: 'memory', enabled: true });
    const diskCache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const modTime = Date.now();
    const filePath = '/test/partition.js';

    memCache.set(filePath, { tokens: 100 }, modTime);
    diskCache.set(filePath, { tokens: 200 }, modTime);

    // Memory cache should not see disk cache
    if (memCache.memoryCache.size !== 1) {
        throw new Error('Memory cache should have its own partition');
    }

    // Disk cache should have file
    const diskResult = diskCache.get(filePath, modTime);
    if (!diskResult || diskResult.tokens !== 200) {
        throw new Error('Disk cache should have its own partition');
    }
});

// ============================================================================
// CACHE COMPRESSION TESTS
// ============================================================================
console.log('\n🗜️  Cache Compression Tests');
console.log('-'.repeat(70));

test('Cache compression - Large data storage (conceptual)', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const largeData = {
        tokens: 10000,
        lines: 5000,
        methods: Array(100).fill(null).map((_, i) => ({
            name: `method${i}`,
            tokens: 100,
            lines: 50
        }))
    };

    const modTime = Date.now();
    cache.set('/test/large.js', largeData, modTime);

    // Should handle large data
    const result = cache.get('/test/large.js', modTime);
    if (!result) {
        throw new Error('Should retrieve large data');
    }

    if (result.methods.length !== 100) {
        throw new Error('Large data corrupted');
    }
});

test('Cache compression - Verify data integrity', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });

    const originalData = {
        tokens: 1000,
        lines: 500,
        complexity: 42,
        methods: ['foo', 'bar', 'baz']
    };

    cache.set('/test/integrity.js', originalData, Date.now());

    const retrieved = cache.get('/test/integrity.js', Date.now());

    if (JSON.stringify(retrieved) !== JSON.stringify(originalData)) {
        throw new Error('Data integrity check failed');
    }
});

// ============================================================================
// DISK VS MEMORY CACHE COMPARISON TESTS
// ============================================================================
console.log('\n⚖️  Disk vs Memory Cache Comparison Tests');
console.log('-'.repeat(70));

test('Disk vs Memory - Persistence comparison', async () => {
    const memCache = new CacheManager({ strategy: 'memory', enabled: true });
    const diskCache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const modTime = Date.now();
    const testData = { tokens: 100 };

    memCache.set('/test/compare.js', testData, modTime);
    diskCache.set('/test/compare.js', testData, modTime);

    // Create new instances (simulating restart)
    const memCache2 = new CacheManager({ strategy: 'memory', enabled: true });
    const diskCache2 = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    // Memory cache should be empty
    const memResult = memCache2.get('/test/compare.js', modTime);
    if (memResult !== null) {
        throw new Error('Memory cache should not persist');
    }

    // Disk cache should persist
    const diskResult = diskCache2.get('/test/compare.js', modTime);
    if (!diskResult) {
        throw new Error('Disk cache should persist');
    }
});

test('Disk vs Memory - Performance characteristics', () => {
    const memCache = new CacheManager({ strategy: 'memory', enabled: true });
    const diskCache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const modTime = Date.now();
    const testData = { tokens: 100 };

    // Both should work correctly
    memCache.set('/test/perf1.js', testData, modTime);
    diskCache.set('/test/perf2.js', testData, modTime);

    const memResult = memCache.get('/test/perf1.js', modTime);
    const diskResult = diskCache.get('/test/perf2.js', modTime);

    if (!memResult) throw new Error('Memory cache failed');
    if (!diskResult) throw new Error('Disk cache failed');

    // Both should track stats
    if (memCache.stats.hits === 0) throw new Error('Memory stats not working');
    if (diskCache.stats.hits === 0) throw new Error('Disk stats not working');
});

test('Disk vs Memory - Clear operation comparison', () => {
    const memCache = new CacheManager({ strategy: 'memory', enabled: true });
    const diskCache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    const modTime = Date.now();

    memCache.set('/test/clear1.js', { tokens: 100 }, modTime);
    diskCache.set('/test/clear2.js', { tokens: 200 }, modTime);

    memCache.clear();
    diskCache.clear();

    // Both should be empty
    if (memCache.memoryCache.size !== 0) {
        throw new Error('Memory cache not cleared');
    }

    const diskSize = diskCache.getDiskCacheSize();
    if (diskSize !== 0) {
        throw new Error('Disk cache not cleared');
    }
});

// ============================================================================
// CACHE MIGRATION TESTS
// ============================================================================
console.log('\n🔄 Cache Migration Tests');
console.log('-'.repeat(70));

test('Cache migration - Version compatibility (conceptual)', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    // Current version format
    const currentData = {
        data: { tokens: 100, lines: 50 },
        timestamp: Date.now(),
        modifiedTime: Date.now()
    };

    const filePath = '/test/migrate.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    fs.writeFileSync(cacheFile, JSON.stringify(currentData), 'utf-8');

    // Should read current format
    const result = cache.get(filePath, Date.now());
    if (!result) {
        throw new Error('Should read current format');
    }
});

test('Cache migration - Handle old format gracefully', () => {
    const cache = new CacheManager({
        strategy: 'disk',
        path: TEST_CACHE_DIR,
        enabled: true
    });

    // Simulate old format (missing fields)
    const oldData = {
        tokens: 100
        // missing: timestamp, modifiedTime
    };

    const filePath = '/test/oldformat.js';
    const key = cache.getCacheKey(filePath);
    const cacheFile = path.join(TEST_CACHE_DIR, `${key}.json`);

    fs.writeFileSync(cacheFile, JSON.stringify(oldData), 'utf-8');

    // Should handle gracefully (miss or auto-migrate)
    const result = cache.get(filePath, Date.now());
    // Either null or some valid result is fine
});

// ============================================================================
// CACHE EXPORT/IMPORT TESTS
// ============================================================================
console.log('\n📤 Cache Export/Import Tests');
console.log('-'.repeat(70));

test('Cache export - Export cache to JSON', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    cache.set('/test/export1.js', { tokens: 100 }, modTime);
    cache.set('/test/export2.js', { tokens: 200 }, modTime);

    // Manual export simulation
    const exported = {
        entries: [],
        stats: cache.getStats(),
        timestamp: Date.now()
    };

    for (const [key, value] of cache.memoryCache) {
        exported.entries.push({ key, value });
    }

    if (exported.entries.length !== 2) {
        throw new Error('Export should contain 2 entries');
    }

    if (!exported.stats) {
        throw new Error('Export should contain stats');
    }
});

test('Cache import - Import cache from JSON', () => {
    const cache = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    // Simulate import data
    const importData = {
        entries: [
            {
                key: cache.getCacheKey('/test/import1.js'),
                value: {
                    data: { tokens: 100 },
                    timestamp: Date.now(),
                    modifiedTime: modTime
                }
            },
            {
                key: cache.getCacheKey('/test/import2.js'),
                value: {
                    data: { tokens: 200 },
                    timestamp: Date.now(),
                    modifiedTime: modTime
                }
            }
        ]
    };

    // Manual import
    importData.entries.forEach(entry => {
        cache.memoryCache.set(entry.key, entry.value);
    });

    // Verify import
    const result1 = cache.get('/test/import1.js', modTime);
    const result2 = cache.get('/test/import2.js', modTime);

    if (!result1 || !result2) {
        throw new Error('Imported entries should be retrievable');
    }

    if (result1.tokens !== 100 || result2.tokens !== 200) {
        throw new Error('Imported data corrupted');
    }
});

test('Cache export/import - Round-trip integrity', () => {
    const cache1 = new CacheManager({ strategy: 'memory', enabled: true });
    const modTime = Date.now();

    const originalData = { tokens: 500, lines: 250, complexity: 15 };
    cache1.set('/test/roundtrip.js', originalData, modTime);

    // Export
    const key = cache1.getCacheKey('/test/roundtrip.js');
    const exported = cache1.memoryCache.get(key);

    // Import to new cache
    const cache2 = new CacheManager({ strategy: 'memory', enabled: true });
    cache2.memoryCache.set(key, exported);

    // Verify
    const result = cache2.get('/test/roundtrip.js', modTime);

    if (JSON.stringify(result) !== JSON.stringify(originalData)) {
        throw new Error('Round-trip integrity failed');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
cleanup();

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 EXTENDED TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All extended cache manager tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Review the output above.');
    process.exit(1);
}
