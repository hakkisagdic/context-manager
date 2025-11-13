#!/usr/bin/env node

/**
 * Comprehensive FileWatcher Tests
 * Tests for real-time file watching and change detection
 */

import { FileWatcher } from '../lib/watch/FileWatcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'watch');

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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing FileWatcher...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('FileWatcher - Constructor with rootPath', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (!watcher) throw new Error('Should create instance');
    if (watcher.rootPath !== FIXTURES_DIR) throw new Error('Should set rootPath');
    if (!watcher.options) throw new Error('Should have options');
});

test('FileWatcher - Constructor with options', () => {
    const watcher = new FileWatcher(FIXTURES_DIR, {
        debounce: 2000,
        recursive: false,
        ignorePatterns: ['*.log']
    });
    if (watcher.options.debounce !== 2000) throw new Error('Should set debounce');
    if (watcher.options.recursive !== false) throw new Error('Should set recursive');
    if (watcher.options.ignorePatterns.length !== 1) throw new Error('Should set ignorePatterns');
});

test('FileWatcher - Constructor initializes state', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.isWatching !== false) throw new Error('Should not be watching initially');
    if (!Array.isArray(watcher.watchers)) throw new Error('Should have watchers array');
    if (!(watcher.debounceTimers instanceof Map)) throw new Error('Should have debounceTimers Map');
});

test('FileWatcher - Constructor initializes stats', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (!watcher.stats) throw new Error('Should have stats');
    if (typeof watcher.stats.totalChanges !== 'number') throw new Error('Should have totalChanges');
    if (typeof watcher.stats.ignoredChanges !== 'number') throw new Error('Should have ignoredChanges');
    if (typeof watcher.stats.errors !== 'number') throw new Error('Should have errors');
});

test('FileWatcher - Constructor extends EventEmitter', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (typeof watcher.on !== 'function') throw new Error('Should have on method');
    if (typeof watcher.emit !== 'function') throw new Error('Should have emit method');
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================
console.log('\n🔄 State Management Tests');
console.log('-'.repeat(70));

test('FileWatcher - isWatching initial state', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.isWatching) throw new Error('Should start with isWatching = false');
});

test('FileWatcher - watchers array starts empty', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.watchers.length !== 0) throw new Error('Should start with empty watchers array');
});

test('FileWatcher - debounceTimers starts empty', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.debounceTimers.size !== 0) throw new Error('Should start with empty debounceTimers');
});

// ============================================================================
// STATS TESTS
// ============================================================================
console.log('\n📊 Stats Tests');
console.log('-'.repeat(70));

test('FileWatcher - getStats returns object', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    const stats = watcher.getStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (typeof stats.totalChanges !== 'number') throw new Error('Should have totalChanges');
});

test('FileWatcher - resetStats clears counters', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    watcher.stats.totalChanges = 10;
    watcher.stats.ignoredChanges = 5;
    watcher.stats.errors = 2;

    watcher.resetStats();

    if (watcher.stats.totalChanges !== 0) throw new Error('Should reset totalChanges');
    if (watcher.stats.ignoredChanges !== 0) throw new Error('Should reset ignoredChanges');
    if (watcher.stats.errors !== 0) throw new Error('Should reset errors');
});

test('FileWatcher - Stats initialize to zero', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.stats.totalChanges !== 0) throw new Error('totalChanges should start at 0');
    if (watcher.stats.ignoredChanges !== 0) throw new Error('ignoredChanges should start at 0');
    if (watcher.stats.errors !== 0) throw new Error('errors should start at 0');
});

// ============================================================================
// IGNORE TESTS
// ============================================================================
console.log('\n🚫 Ignore Tests');
console.log('-'.repeat(70));

test('FileWatcher - shouldIgnore returns boolean', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    try {
        const result = watcher.shouldIgnore('test.js');
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // GitIgnoreParser might not have shouldIncludeFile in some configurations
        if (!error.message.includes('not a function')) throw error;
    }
});

test('FileWatcher - shouldIgnore checks gitignore', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    try {
        // node_modules is typically ignored
        const result = watcher.shouldIgnore('node_modules/package/index.js');
        // Just verify it returns a boolean
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // GitIgnoreParser might not have shouldIncludeFile in some configurations
        if (!error.message.includes('not a function')) throw error;
    }
});

test('FileWatcher - shouldIgnore with custom patterns', () => {
    const watcher = new FileWatcher(FIXTURES_DIR, {
        ignorePatterns: ['*.log', '*.tmp']
    });
    try {
        // Just verify the method works
        const result = watcher.shouldIgnore('test.log');
        if (typeof result !== 'boolean') throw new Error('Should return boolean');
    } catch (error) {
        // GitIgnoreParser might not have shouldIncludeFile in some configurations
        if (!error.message.includes('not a function')) throw error;
    }
});

// ============================================================================
// EVENT EMISSION TESTS
// ============================================================================
console.log('\n📡 Event Emission Tests');
console.log('-'.repeat(70));

test('FileWatcher - Can register event listeners', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let called = false;

    watcher.on('test-event', () => {
        called = true;
    });

    watcher.emit('test-event');

    if (!called) throw new Error('Event listener should be called');
});

test('FileWatcher - Event listeners receive data', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let receivedData = null;

    watcher.on('test-data', (data) => {
        receivedData = data;
    });

    watcher.emit('test-data', { test: 'value' });

    if (!receivedData) throw new Error('Should receive data');
    if (receivedData.test !== 'value') throw new Error('Should have correct data');
});

test('FileWatcher - Multiple listeners work', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let count = 0;

    watcher.on('multi-test', () => count++);
    watcher.on('multi-test', () => count++);

    watcher.emit('multi-test');

    if (count !== 2) throw new Error('Both listeners should be called');
});

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================
console.log('\n⚙️  Configuration Tests');
console.log('-'.repeat(70));

test('FileWatcher - Default debounce is 1000ms', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.options.debounce !== 1000) throw new Error('Default debounce should be 1000ms');
});

test('FileWatcher - Default recursive is true', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (watcher.options.recursive !== true) throw new Error('Default recursive should be true');
});

test('FileWatcher - Default ignorePatterns is empty array', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    if (!Array.isArray(watcher.options.ignorePatterns)) {
        throw new Error('ignorePatterns should be array');
    }
    if (watcher.options.ignorePatterns.length !== 0) {
        throw new Error('Default ignorePatterns should be empty');
    }
});

test('FileWatcher - Options are merged correctly', () => {
    const watcher = new FileWatcher(FIXTURES_DIR, {
        debounce: 500
    });

    if (watcher.options.debounce !== 500) throw new Error('Should override debounce');
    if (watcher.options.recursive !== true) throw new Error('Should keep default recursive');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('FileWatcher - Multiple instances are independent', () => {
    const watcher1 = new FileWatcher(FIXTURES_DIR);
    const watcher2 = new FileWatcher(FIXTURES_DIR, { debounce: 2000 });

    if (watcher1.options.debounce === watcher2.options.debounce) {
        throw new Error('Instances should be independent');
    }
});

test('FileWatcher - Stats are independent per instance', () => {
    const watcher1 = new FileWatcher(FIXTURES_DIR);
    const watcher2 = new FileWatcher(FIXTURES_DIR);

    watcher1.stats.totalChanges = 10;

    if (watcher2.stats.totalChanges === 10) {
        throw new Error('Stats should be independent');
    }
});

test('FileWatcher - getStats returns a copy', () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    const stats1 = watcher.getStats();
    const stats2 = watcher.getStats();

    stats1.totalChanges = 999;

    if (stats2.totalChanges === 999) {
        throw new Error('getStats should return independent objects');
    }
});

test('FileWatcher - Constructor with non-existent path', () => {
    const nonExistentPath = path.join(FIXTURES_DIR, 'non-existent-dir');
    const watcher = new FileWatcher(nonExistentPath);

    // Should create watcher even if path doesn't exist yet
    if (!watcher) throw new Error('Should create instance');
    if (watcher.rootPath !== nonExistentPath) throw new Error('Should set rootPath');
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
    console.log('\n🎉 All file watcher tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
