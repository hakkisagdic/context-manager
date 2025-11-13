#!/usr/bin/env node

/**
 * Extended IncrementalAnalyzer Tests
 * Tests for file analysis, cache updates, and aggregate stats
 */

import { IncrementalAnalyzer } from '../lib/watch/IncrementalAnalyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'incremental-extended');

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

async function asyncTest(name, fn) {
    try {
        await fn();
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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// Create test file
const testFile = path.join(FIXTURES_DIR, 'test.js');
fs.writeFileSync(testFile, 'function test() { return 42; }\nmodule.exports = { test };\n');

console.log('🧪 Testing IncrementalAnalyzer Extended...\n');

// ============================================================================
// ANALYZE CHANGE TESTS
// ============================================================================
console.log('🔍 analyzeChange() Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - analyzeChange processes file', async () => {
    const analyzer = new IncrementalAnalyzer();
    let analysisComplete = false;

    analyzer.on('analysis:complete', (data) => {
        analysisComplete = true;
    });

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    if (!analysisComplete) throw new Error('Should emit analysis:complete');
});

await asyncTest('IncrementalAnalyzer - analyzeChange updates cache', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    const cached = analyzer.getCachedAnalysis(testFile);
    if (!cached) throw new Error('Should cache analysis result');
    if (typeof cached.tokens !== 'number') throw new Error('Cached result should have tokens');
});

await asyncTest('IncrementalAnalyzer - analyzeChange handles deleted file', async () => {
    const analyzer = new IncrementalAnalyzer();
    let fileDeleted = false;

    // First analyze the file
    const changeEvent1 = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: 100,
        modified: new Date()
    };

    await analyzer.analyzeChange(changeEvent1);

    analyzer.on('file:deleted', () => {
        fileDeleted = true;
    });

    // Now simulate deletion
    const changeEvent2 = {
        path: testFile,
        relativePath: 'test.js',
        exists: false
    };

    await analyzer.analyzeChange(changeEvent2);

    if (!fileDeleted) throw new Error('Should emit file:deleted event');
});

await asyncTest('IncrementalAnalyzer - analyzeChange emits event with data', async () => {
    const analyzer = new IncrementalAnalyzer();
    let eventData = null;

    analyzer.on('analysis:complete', (data) => {
        eventData = data;
    });

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    if (!eventData) throw new Error('Should emit event data');
    if (!eventData.file) throw new Error('Event should have file');
    if (!eventData.analysis) throw new Error('Event should have analysis');
    if (typeof eventData.elapsed !== 'number') throw new Error('Event should have elapsed time');
    if (eventData.cached !== false) throw new Error('Fresh analysis should not be cached');
});

await asyncTest('IncrementalAnalyzer - analyzeChange handles errors gracefully', async () => {
    const analyzer = new IncrementalAnalyzer();

    // analyzeChange should not throw even with bad input
    const changeEvent = {
        path: '/nonexistent/file.js',
        relativePath: 'file.js',
        exists: true,
        size: 0,
        modified: new Date()
    };

    // Should not throw
    await analyzer.analyzeChange(changeEvent);

    // If it completes without throwing, test passes
    if (true) {
        // Test passes - graceful error handling
    }
});

// ============================================================================
// AGGREGATE STATS TESTS
// ============================================================================
console.log('\n📊 updateAggregateStats() Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - updateAggregateStats initializes stats', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    if (!analyzer.aggregateStats) throw new Error('Should initialize aggregateStats');
    if (typeof analyzer.aggregateStats.totalFiles !== 'number') {
        throw new Error('Should have totalFiles');
    }
    if (typeof analyzer.aggregateStats.totalTokens !== 'number') {
        throw new Error('Should have totalTokens');
    }
});

await asyncTest('IncrementalAnalyzer - updateAggregateStats increments on new file', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    if (analyzer.aggregateStats.totalFiles !== 1) {
        throw new Error('Should increment totalFiles');
    }
    if (analyzer.aggregateStats.totalTokens === 0) {
        throw new Error('Should have tokens');
    }
});

await asyncTest('IncrementalAnalyzer - updateAggregateStats updates on re-analysis', async () => {
    const analyzer = new IncrementalAnalyzer();
    const testFile2 = path.join(FIXTURES_DIR, 'update-test.js');
    fs.writeFileSync(testFile2, 'function small() { return 1; }\n');

    const changeEvent1 = {
        path: testFile2,
        relativePath: 'update-test.js',
        exists: true,
        size: fs.statSync(testFile2).size,
        modified: fs.statSync(testFile2).mtime
    };

    await analyzer.analyzeChange(changeEvent1);

    const tokens1 = analyzer.aggregateStats.totalTokens;

    // Update file to be larger
    fs.writeFileSync(testFile2, 'function large() { return 1; }\nfunction another() { return 2; }\nfunction third() { return 3; }\n');

    const changeEvent2 = {
        path: testFile2,
        relativePath: 'update-test.js',
        exists: true,
        size: fs.statSync(testFile2).size,
        modified: fs.statSync(testFile2).mtime
    };

    await analyzer.analyzeChange(changeEvent2);

    const tokens2 = analyzer.aggregateStats.totalTokens;

    // Cleanup
    fs.unlinkSync(testFile2);

    if (tokens2 <= tokens1) {
        throw new Error('Should update tokens on re-analysis');
    }
    if (analyzer.aggregateStats.totalFiles !== 1) {
        throw new Error('totalFiles should stay at 1 on re-analysis');
    }
});

// ============================================================================
// HANDLE FILE DELETED WITH STATS TESTS
// ============================================================================
console.log('\n🗑️  handleFileDeleted() with Stats Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - handleFileDeleted updates aggregateStats', async () => {
    const analyzer = new IncrementalAnalyzer();

    // First analyze a file
    const changeEvent1 = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent1);

    const totalFilesBefore = analyzer.aggregateStats.totalFiles;
    const totalTokensBefore = analyzer.aggregateStats.totalTokens;

    // Now delete it
    const changeEvent2 = {
        path: testFile,
        relativePath: 'test.js',
        exists: false
    };

    await analyzer.analyzeChange(changeEvent2);

    if (analyzer.aggregateStats.totalFiles >= totalFilesBefore) {
        throw new Error('Should decrement totalFiles');
    }
    if (analyzer.aggregateStats.totalTokens >= totalTokensBefore) {
        throw new Error('Should decrement totalTokens');
    }
});

await asyncTest('IncrementalAnalyzer - handleFileDeleted emits event with oldTokens', async () => {
    const analyzer = new IncrementalAnalyzer();
    let deletedEvent = null;

    const changeEvent1 = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent1);

    analyzer.on('file:deleted', (data) => {
        deletedEvent = data;
    });

    const changeEvent2 = {
        path: testFile,
        relativePath: 'test.js',
        exists: false
    };

    await analyzer.analyzeChange(changeEvent2);

    if (!deletedEvent) throw new Error('Should emit file:deleted');
    if (!deletedEvent.file) throw new Error('Event should have file');
    if (typeof deletedEvent.oldTokens !== 'number') {
        throw new Error('Event should have oldTokens');
    }
});

// ============================================================================
// GET STATS TESTS
// ============================================================================
console.log('\n📈 getStats() Extended Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - getStats returns object after analysis', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    const stats = analyzer.getStats();

    if (typeof stats !== 'object') throw new Error('Should return stats object');
    // Stats content depends on implementation
});

await asyncTest('IncrementalAnalyzer - aggregateStats populated after analysis', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    if (!analyzer.aggregateStats) {
        throw new Error('Should have aggregateStats after analysis');
    }
    if (typeof analyzer.aggregateStats.totalFiles !== 'number') {
        throw new Error('aggregateStats should have totalFiles');
    }
});

// ============================================================================
// CACHE STATS TESTS
// ============================================================================
console.log('\n💾 getCacheStats() Extended Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - getCacheStats after analysis', async () => {
    const analyzer = new IncrementalAnalyzer();

    const changeEvent = {
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    };

    await analyzer.analyzeChange(changeEvent);

    const cacheStats = analyzer.getCacheStats();

    if (cacheStats.cachedFiles !== 1) {
        throw new Error('Should have 1 cached file');
    }
    if (cacheStats.cacheSize === 0) {
        throw new Error('Cache size should be > 0');
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

await asyncTest('IncrementalAnalyzer - multiple file analysis', async () => {
    const analyzer = new IncrementalAnalyzer();
    const file1 = path.join(FIXTURES_DIR, 'file1.js');
    const file2 = path.join(FIXTURES_DIR, 'file2.js');

    fs.writeFileSync(file1, 'const a = 1;\n');
    fs.writeFileSync(file2, 'const b = 2;\n');

    await analyzer.analyzeChange({
        path: file1,
        relativePath: 'file1.js',
        exists: true,
        size: fs.statSync(file1).size,
        modified: fs.statSync(file1).mtime
    });

    await analyzer.analyzeChange({
        path: file2,
        relativePath: 'file2.js',
        exists: true,
        size: fs.statSync(file2).size,
        modified: fs.statSync(file2).mtime
    });

    fs.unlinkSync(file1);
    fs.unlinkSync(file2);

    if (analyzer.aggregateStats.totalFiles !== 2) {
        throw new Error('Should track multiple files');
    }
});

await asyncTest('IncrementalAnalyzer - clearCache resets file cache but keeps stats', async () => {
    const analyzer = new IncrementalAnalyzer();

    await analyzer.analyzeChange({
        path: testFile,
        relativePath: 'test.js',
        exists: true,
        size: fs.statSync(testFile).size,
        modified: fs.statSync(testFile).mtime
    });

    analyzer.clearCache();

    if (analyzer.fileCache.size !== 0) {
        throw new Error('Should clear file cache');
    }
    if (!analyzer.aggregateStats) {
        throw new Error('Should keep aggregate stats');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test fixtures');
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
    console.log('\n🎉 All IncrementalAnalyzer extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
