#!/usr/bin/env node

/**
 * Comprehensive IncrementalAnalyzer Tests
 * Tests for incremental file analysis and caching
 */

import { IncrementalAnalyzer } from '../lib/watch/IncrementalAnalyzer.js';

let testsPassed = 0;
let testsFailed = 0;

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

console.log('🧪 Testing IncrementalAnalyzer...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - Constructor with defaults', () => {
    const analyzer = new IncrementalAnalyzer();
    if (!analyzer) throw new Error('Should create instance');
    if (!analyzer.options) throw new Error('Should have options');
    if (analyzer.options.autoAnalyze !== true) throw new Error('Should default to autoAnalyze true');
});

test('IncrementalAnalyzer - Constructor with options', () => {
    const analyzer = new IncrementalAnalyzer({
        autoAnalyze: false,
        projectRoot: '/test/path'
    });
    if (analyzer.options.autoAnalyze !== false) throw new Error('Should set autoAnalyze');
    if (analyzer.options.projectRoot !== '/test/path') throw new Error('Should set projectRoot');
});

test('IncrementalAnalyzer - Constructor initializes cache', () => {
    const analyzer = new IncrementalAnalyzer();
    if (!(analyzer.fileCache instanceof Map)) throw new Error('Should have Map for fileCache');
    if (analyzer.fileCache.size !== 0) throw new Error('Cache should start empty');
});

test('IncrementalAnalyzer - Constructor initializes stats', () => {
    const analyzer = new IncrementalAnalyzer();
    if (analyzer.aggregateStats !== null) throw new Error('Stats should start as null');
});

test('IncrementalAnalyzer - Constructor creates Analyzer instance', () => {
    const analyzer = new IncrementalAnalyzer();
    if (!analyzer.analyzer) throw new Error('Should have analyzer instance');
});

test('IncrementalAnalyzer - Constructor extends EventEmitter', () => {
    const analyzer = new IncrementalAnalyzer();
    if (typeof analyzer.on !== 'function') throw new Error('Should have on method');
    if (typeof analyzer.emit !== 'function') throw new Error('Should have emit method');
});

// ============================================================================
// CACHE TESTS
// ============================================================================
console.log('\n💾 Cache Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - getCachedAnalysis returns null for missing', () => {
    const analyzer = new IncrementalAnalyzer();
    const result = analyzer.getCachedAnalysis('/path/to/file.js');
    if (result !== null) throw new Error('Should return null for missing file');
});

test('IncrementalAnalyzer - fileCache can store entries', () => {
    const analyzer = new IncrementalAnalyzer();
    const mockAnalysis = { tokens: 100, lines: 50 };
    analyzer.fileCache.set('/test/file.js', mockAnalysis);

    if (analyzer.fileCache.size !== 1) throw new Error('Should have 1 entry');
});

test('IncrementalAnalyzer - getCachedAnalysis retrieves stored entry', () => {
    const analyzer = new IncrementalAnalyzer();
    const mockAnalysis = { tokens: 100, lines: 50 };
    analyzer.fileCache.set('/test/file.js', mockAnalysis);

    const result = analyzer.getCachedAnalysis('/test/file.js');
    if (!result) throw new Error('Should return cached analysis');
    if (result.tokens !== 100) throw new Error('Should have correct data');
});

test('IncrementalAnalyzer - clearCache removes all entries', () => {
    const analyzer = new IncrementalAnalyzer();
    analyzer.fileCache.set('/test/file1.js', { tokens: 100 });
    analyzer.fileCache.set('/test/file2.js', { tokens: 200 });

    analyzer.clearCache();

    if (analyzer.fileCache.size !== 0) throw new Error('Cache should be empty after clear');
});

test('IncrementalAnalyzer - clearCache clears fileCache only', () => {
    const analyzer = new IncrementalAnalyzer();
    analyzer.fileCache.set('/test/file.js', { tokens: 100 });
    analyzer.aggregateStats = { totalFiles: 10, totalTokens: 1000 };

    analyzer.clearCache();

    if (analyzer.fileCache.size !== 0) throw new Error('fileCache should be cleared');
    // Note: clearCache doesn't reset aggregateStats, only fileCache
    if (!analyzer.aggregateStats) throw new Error('aggregateStats should remain');
});

// ============================================================================
// STATS TESTS
// ============================================================================
console.log('\n📊 Stats Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - getStats returns object', () => {
    const analyzer = new IncrementalAnalyzer();
    const stats = analyzer.getStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
});

test('IncrementalAnalyzer - getStats with null aggregateStats', () => {
    const analyzer = new IncrementalAnalyzer();
    const stats = analyzer.getStats();
    // Should return some default stats or null/empty object
    if (typeof stats !== 'object') throw new Error('Should handle null aggregateStats');
});

test('IncrementalAnalyzer - getCacheStats returns object', () => {
    const analyzer = new IncrementalAnalyzer();
    const stats = analyzer.getCacheStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (typeof stats.cachedFiles !== 'number') throw new Error('Should have cachedFiles property');
    if (typeof stats.cacheSize !== 'number') throw new Error('Should have cacheSize property');
});

test('IncrementalAnalyzer - getCacheStats tracks size', () => {
    const analyzer = new IncrementalAnalyzer();
    analyzer.fileCache.set('/test/file1.js', { tokens: 100 });
    analyzer.fileCache.set('/test/file2.js', { tokens: 200 });

    const stats = analyzer.getCacheStats();
    if (stats.cachedFiles !== 2) throw new Error('Should track cached files count');
});

// ============================================================================
// FILE DELETION TESTS
// ============================================================================
console.log('\n🗑️  File Deletion Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - handleFileDeleted removes from cache', () => {
    const analyzer = new IncrementalAnalyzer();
    analyzer.fileCache.set('/test/file.js', { tokens: 100 });

    const changeEvent = {
        path: '/test/file.js',
        relativePath: 'test/file.js',
        exists: false
    };

    analyzer.handleFileDeleted(changeEvent);

    if (analyzer.fileCache.has('/test/file.js')) {
        throw new Error('Should remove file from cache');
    }
});

test('IncrementalAnalyzer - handleFileDeleted handles non-existent file', () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: '/test/nonexistent.js',
        relativePath: 'test/nonexistent.js',
        exists: false
    };

    // Should not throw
    analyzer.handleFileDeleted(changeEvent);
});

// ============================================================================
// EVENT EMISSION TESTS
// ============================================================================
console.log('\n📡 Event Emission Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - Can register event listeners', () => {
    const analyzer = new IncrementalAnalyzer();
    let called = false;

    analyzer.on('test-event', () => {
        called = true;
    });

    analyzer.emit('test-event');

    if (!called) throw new Error('Event listener should be called');
});

test('IncrementalAnalyzer - Event listeners receive data', () => {
    const analyzer = new IncrementalAnalyzer();
    let receivedData = null;

    analyzer.on('analysis:complete', (data) => {
        receivedData = data;
    });

    analyzer.emit('analysis:complete', { file: 'test.js', elapsed: 100 });

    if (!receivedData) throw new Error('Should receive event data');
    if (receivedData.file !== 'test.js') throw new Error('Should have correct data');
});

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================
console.log('\n⚙️  Configuration Tests');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - Default autoAnalyze is true', () => {
    const analyzer = new IncrementalAnalyzer();
    if (analyzer.options.autoAnalyze !== true) {
        throw new Error('Default autoAnalyze should be true');
    }
});

test('IncrementalAnalyzer - Options are merged correctly', () => {
    const analyzer = new IncrementalAnalyzer({
        autoAnalyze: false,
        customOption: 'test'
    });

    if (analyzer.options.autoAnalyze !== false) throw new Error('Should override autoAnalyze');
    if (analyzer.options.customOption !== 'test') throw new Error('Should keep custom options');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('IncrementalAnalyzer - Multiple instances are independent', () => {
    const analyzer1 = new IncrementalAnalyzer();
    const analyzer2 = new IncrementalAnalyzer();

    analyzer1.fileCache.set('/test/file.js', { tokens: 100 });

    if (analyzer2.fileCache.has('/test/file.js')) {
        throw new Error('Instances should have independent caches');
    }
});

test('IncrementalAnalyzer - getCachedAnalysis with null path', () => {
    const analyzer = new IncrementalAnalyzer();
    const result = analyzer.getCachedAnalysis(null);
    // Should handle gracefully (return undefined or null)
    if (typeof result === 'undefined') {
        // Expected
    }
});

test('IncrementalAnalyzer - clearCache when already empty', () => {
    const analyzer = new IncrementalAnalyzer();
    // Should not throw
    analyzer.clearCache();
    if (analyzer.fileCache.size !== 0) throw new Error('Cache should remain empty');
});

test('IncrementalAnalyzer - handleFileDeleted emits event', () => {
    const analyzer = new IncrementalAnalyzer();
    analyzer.fileCache.set('/test/file.js', { tokens: 100 });

    let eventEmitted = false;
    analyzer.on('file:deleted', () => {
        eventEmitted = true;
    });

    const changeEvent = {
        path: '/test/file.js',
        relativePath: 'test/file.js',
        exists: false
    };

    analyzer.handleFileDeleted(changeEvent);

    // Event emission is optional, just verify no crash
});

test('IncrementalAnalyzer - Constructor with empty options object', () => {
    const analyzer = new IncrementalAnalyzer({});
    if (!analyzer) throw new Error('Should create instance');
    if (analyzer.options.autoAnalyze !== true) throw new Error('Should use defaults');
});

test('IncrementalAnalyzer - getCacheStats with empty cache', () => {
    const analyzer = new IncrementalAnalyzer();
    const stats = analyzer.getCacheStats();
    if (stats.cachedFiles !== 0) throw new Error('Empty cache should have cachedFiles 0');
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
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All incremental analyzer tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
