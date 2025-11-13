#!/usr/bin/env node

/**
 * Extended FileWatcher Tests
 * Tests for actual file watching, start/stop, and event handling
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

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'watch-extended');

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

// Create initial test file
const testFile = path.join(FIXTURES_DIR, 'test.txt');
fs.writeFileSync(testFile, 'initial content\n');

console.log('🧪 Testing FileWatcher Extended...\n');

// ============================================================================
// START/STOP TESTS
// ============================================================================
console.log('▶️  Start/Stop Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - start() initializes watching', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    watcher.start();

    if (!watcher.isWatching) throw new Error('Should be watching');
    if (watcher.watchers.length === 0) throw new Error('Should have active watchers');

    watcher.stop();
});

await asyncTest('FileWatcher - start() emits watch:started event', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let eventEmitted = false;

    watcher.on('watch:started', (data) => {
        eventEmitted = true;
        if (!data.path) throw new Error('Event should include path');
    });

    watcher.start();

    if (!eventEmitted) throw new Error('Should emit watch:started');

    watcher.stop();
});

await asyncTest('FileWatcher - start() when already watching warns', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    watcher.start();

    // Second start should not crash
    watcher.start();

    if (!watcher.isWatching) throw new Error('Should still be watching');

    watcher.stop();
});

await asyncTest('FileWatcher - stop() clears watchers', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    watcher.start();
    watcher.stop();

    if (watcher.isWatching) throw new Error('Should not be watching');
    if (watcher.watchers.length !== 0) throw new Error('Should clear watchers');
    if (watcher.debounceTimers.size !== 0) throw new Error('Should clear timers');
});

await asyncTest('FileWatcher - stop() emits watch:stopped event', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let eventEmitted = false;

    watcher.on('watch:stopped', () => {
        eventEmitted = true;
    });

    watcher.start();
    watcher.stop();

    if (!eventEmitted) throw new Error('Should emit watch:stopped');
});

await asyncTest('FileWatcher - stop() when not watching is safe', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);

    // Stop without starting should not crash
    watcher.stop();

    if (watcher.isWatching) throw new Error('Should not be watching');
});

// ============================================================================
// FILE CHANGE DETECTION TESTS
// ============================================================================
console.log('\n📝 File Change Detection Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - detects file modification', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    let changeDetected = false;

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'test.txt') {
            changeDetected = true;
        }
    });

    watcher.start();

    // Modify file
    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(testFile, 'modified content\n');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    if (!changeDetected) throw new Error('Should detect file modification');
});

await asyncTest('FileWatcher - detects file creation', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    let changeDetected = false;
    const newFile = path.join(FIXTURES_DIR, 'new-file.txt');

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'new-file.txt') {
            changeDetected = true;
        }
    });

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(newFile, 'new content\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    // Cleanup
    if (fs.existsSync(newFile)) {
        fs.unlinkSync(newFile);
    }

    if (!changeDetected) throw new Error('Should detect file creation');
});

await asyncTest('FileWatcher - detects file deletion', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    let changeDetected = false;
    const deleteFile = path.join(FIXTURES_DIR, 'delete-me.txt');

    // Create file to delete
    fs.writeFileSync(deleteFile, 'will be deleted\n');

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'delete-me.txt') {
            changeDetected = true;
        }
    });

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.unlinkSync(deleteFile);

    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    if (!changeDetected) throw new Error('Should detect file deletion');
});

await asyncTest('FileWatcher - event includes file metadata', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    let eventData = null;

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'test.txt') {
            eventData = event;
        }
    });

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(testFile, 'metadata test\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    if (!eventData) throw new Error('Should receive event');
    if (!eventData.type) throw new Error('Event should have type');
    if (!eventData.path) throw new Error('Event should have path');
    if (!eventData.relativePath) throw new Error('Event should have relativePath');
    if (typeof eventData.timestamp !== 'number') throw new Error('Event should have timestamp');
    if (typeof eventData.exists !== 'boolean') throw new Error('Event should have exists');
});

await asyncTest('FileWatcher - event includes size for existing files', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    let eventData = null;

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'test.txt' && event.exists) {
            eventData = event;
        }
    });

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(testFile, 'size test content\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    if (!eventData) throw new Error('Should receive event');
    if (typeof eventData.size !== 'number') throw new Error('Event should have size');
    if (!eventData.modified) throw new Error('Event should have modified time');
});

// ============================================================================
// DEBOUNCE TESTS
// ============================================================================
console.log('\n⏱️  Debounce Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - debounces rapid changes', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 150 });
    let changeCount = 0;

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'test.txt') {
            changeCount++;
        }
    });

    watcher.start();

    // Make multiple rapid changes
    await new Promise(resolve => setTimeout(resolve, 50));
    for (let i = 0; i < 5; i++) {
        fs.writeFileSync(testFile, `change ${i}\n`);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 250));

    watcher.stop();

    // Should only emit once due to debounce
    if (changeCount > 2) throw new Error(`Should debounce changes (got ${changeCount} events)`);
});

await asyncTest('FileWatcher - custom debounce time', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 50 });
    let changeDetected = false;

    watcher.on('file:changed', (event) => {
        if (event.relativePath === 'test.txt') {
            changeDetected = true;
        }
    });

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 30));
    fs.writeFileSync(testFile, 'fast debounce\n');

    // Wait for shorter debounce
    await new Promise(resolve => setTimeout(resolve, 100));

    watcher.stop();

    if (!changeDetected) throw new Error('Should respect custom debounce');
});

// ============================================================================
// IGNORE PATTERNS TESTS
// ============================================================================
console.log('\n🚫 Ignore Patterns Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - shouldIgnore() method exists', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);

    if (typeof watcher.shouldIgnore !== 'function') {
        throw new Error('Should have shouldIgnore method');
    }

    const result = watcher.shouldIgnore('test.txt');
    if (typeof result !== 'boolean') {
        throw new Error('shouldIgnore should return boolean');
    }
});

await asyncTest('FileWatcher - uses GitIgnoreParser for ignore rules', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);

    if (!watcher.gitIgnore) {
        throw new Error('Should have gitIgnore parser');
    }

    if (typeof watcher.gitIgnore.isIgnored !== 'function') {
        throw new Error('GitIgnore parser should have isIgnored method');
    }
});

// ============================================================================
// STATS TRACKING TESTS
// ============================================================================
console.log('\n📊 Stats Tracking Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - tracks totalChanges', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR, { debounce: 100 });
    const initialTotal = watcher.stats.totalChanges;

    watcher.start();

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(testFile, 'stats test 1\n');

    await new Promise(resolve => setTimeout(resolve, 50));
    fs.writeFileSync(testFile, 'stats test 2\n');

    await new Promise(resolve => setTimeout(resolve, 200));

    watcher.stop();

    if (watcher.stats.totalChanges <= initialTotal) {
        throw new Error('Should track total changes');
    }
});

await asyncTest('FileWatcher - getStats includes runtime info', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    watcher.start();

    const stats = watcher.getStats();

    if (typeof stats.isWatching !== 'boolean') throw new Error('Should include isWatching');
    if (typeof stats.activeWatchers !== 'number') throw new Error('Should include activeWatchers');
    if (typeof stats.pendingDebounce !== 'number') throw new Error('Should include pendingDebounce');

    watcher.stop();
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n⚠️  Error Handling Tests');
console.log('-'.repeat(70));

await asyncTest('FileWatcher - handles handleFileChange with null filename', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);

    // Should not crash
    watcher.handleFileChange('change', null);

    // Stats should not increase
    if (watcher.stats.totalChanges !== 0) {
        throw new Error('Should ignore null filename');
    }
});

await asyncTest('FileWatcher - emitFileChange handles missing file stats', async () => {
    const watcher = new FileWatcher(FIXTURES_DIR);
    let eventReceived = false;

    watcher.on('file:changed', (event) => {
        eventReceived = true;
        // Should have event even if file doesn't exist
        if (!event.path) throw new Error('Should have path');
    });

    // Emit change for non-existent file
    watcher.emitFileChange('rename', '/nonexistent/file.txt', 'file.txt');

    if (!eventReceived) throw new Error('Should emit event');
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
    console.log('\n🎉 All FileWatcher extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
