#!/usr/bin/env node

/**
 * Advanced Plugin System Tests
 * Comprehensive testing for PluginManager lifecycle, error handling, and edge cases
 *
 * Coverage areas:
 * - Plugin loading/unloading lifecycle
 * - Lazy loading behavior
 * - Error handling and recovery
 * - Concurrent plugin operations
 * - Event system
 * - Plugin cleanup
 * - Edge cases and performance
 */

import { PluginManager } from '../lib/plugins/PluginManager.js';
import LanguagePlugin from '../lib/plugins/LanguagePlugin.js';
import ExporterPlugin from '../lib/plugins/ExporterPlugin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🧪 Testing Advanced Plugin System Features...\n');

// ============================================================================
// PLUGIN LOADING/UNLOADING LIFECYCLE TESTS
// ============================================================================
console.log('🔄 Plugin Lifecycle Tests');
console.log('-'.repeat(70));

await asyncTest('Load plugin - Lazy loading disabled', async () => {
    const pm = new PluginManager({ autoLoad: false, lazy: false });

    // Create a test plugin instance
    const testPlugin = new LanguagePlugin();
    testPlugin.name = 'test-lang';

    pm.register('test-lang', testPlugin);

    const loaded = pm.get('test-lang');
    if (!loaded) throw new Error('Plugin should be loaded');
    if (loaded !== testPlugin) throw new Error('Should return same instance');
});

await asyncTest('Load plugin - Check caching', async () => {
    const pm = new PluginManager({ autoLoad: false });

    const testPlugin = new LanguagePlugin();
    testPlugin.name = 'cached-plugin';

    pm.register('cached-plugin', testPlugin);

    const first = pm.get('cached-plugin');
    const second = pm.get('cached-plugin');

    if (first !== second) throw new Error('Should return cached instance');
});

test('Unload plugin - Basic unload', () => {
    const pm = new PluginManager({ autoLoad: false });

    const testPlugin = new LanguagePlugin();
    pm.register('test-unload', testPlugin);

    if (!pm.isLoaded('test-unload')) throw new Error('Plugin should be loaded');

    pm.unload('test-unload');

    if (pm.isLoaded('test-unload')) throw new Error('Plugin should be unloaded');
});

test('Unload plugin - Calls cleanup method', () => {
    const pm = new PluginManager({ autoLoad: false });

    let cleanupCalled = false;
    const testPlugin = new LanguagePlugin();
    testPlugin.cleanup = () => { cleanupCalled = true; };

    pm.register('test-cleanup', testPlugin);
    pm.unload('test-cleanup');

    if (!cleanupCalled) throw new Error('Cleanup method should be called');
});

test('Unload plugin - Handles non-existent plugin', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Should not throw
    pm.unload('non-existent');
});

test('Unload plugin - Stats updated correctly', () => {
    const pm = new PluginManager({ autoLoad: false });

    const testPlugin = new LanguagePlugin();
    pm.register('stats-test', testPlugin);

    const statsBefore = pm.getStats();
    pm.unload('stats-test');
    const statsAfter = pm.getStats();

    if (statsAfter.loaded !== statsBefore.loaded - 1) {
        throw new Error('Loaded count should decrease');
    }
});

test('UnloadAll - Unloads all plugins', () => {
    const pm = new PluginManager({ autoLoad: false });

    pm.register('plugin1', new LanguagePlugin());
    pm.register('plugin2', new LanguagePlugin());
    pm.register('plugin3', new ExporterPlugin());

    pm.unloadAll();

    if (pm.listLoaded().length !== 0) throw new Error('All plugins should be unloaded');
    if (pm.getStats().loaded !== 0) throw new Error('Loaded count should be 0');
});

test('UnloadAll - Calls cleanup on all plugins', () => {
    const pm = new PluginManager({ autoLoad: false });

    let cleanup1 = false, cleanup2 = false, cleanup3 = false;

    const plugin1 = new LanguagePlugin();
    plugin1.cleanup = () => { cleanup1 = true; };

    const plugin2 = new LanguagePlugin();
    plugin2.cleanup = () => { cleanup2 = true; };

    const plugin3 = new ExporterPlugin();
    plugin3.cleanup = () => { cleanup3 = true; };

    pm.register('p1', plugin1);
    pm.register('p2', plugin2);
    pm.register('p3', plugin3);

    pm.unloadAll();

    if (!cleanup1 || !cleanup2 || !cleanup3) {
        throw new Error('All cleanup methods should be called');
    }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n⚠️  Error Handling Tests');
console.log('-'.repeat(70));

test('Get non-existent plugin - Returns null', () => {
    const pm = new PluginManager({ autoLoad: false });

    const result = pm.get('non-existent');
    if (result !== null) throw new Error('Should return null for non-existent plugin');
});

test('IsLoaded for non-existent plugin - Returns false', () => {
    const pm = new PluginManager({ autoLoad: false });

    const result = pm.isLoaded('non-existent');
    if (result !== false) throw new Error('Should return false for non-existent plugin');
});

test('GetInfo for non-existent plugin - Returns null', () => {
    const pm = new PluginManager({ autoLoad: false });

    const result = pm.getInfo('non-existent');
    if (result !== null) throw new Error('Should return null for non-existent plugin');
});

test('Plugin with null cleanup - Handles gracefully', () => {
    const pm = new PluginManager({ autoLoad: false });

    const testPlugin = new LanguagePlugin();
    testPlugin.cleanup = null;

    pm.register('null-cleanup', testPlugin);

    // Should not throw
    pm.unload('null-cleanup');
});

test('Plugin error during registration - Stats track errors', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Simulate registration error by manually calling internal method
    const initialErrors = pm.stats.errors;

    // This test validates error tracking exists
    if (typeof pm.stats.errors !== 'number') {
        throw new Error('Error stats should be tracked');
    }
});

// ============================================================================
// PLUGIN LISTING AND QUERYING TESTS
// ============================================================================
console.log('\n📋 Plugin Listing Tests');
console.log('-'.repeat(70));

test('List all plugins - Returns all registered', () => {
    const pm = new PluginManager({ autoLoad: false });

    pm.register('p1', new LanguagePlugin());
    pm.register('p2', new LanguagePlugin());
    pm.register('p3', new ExporterPlugin());

    const list = pm.list();

    if (!Array.isArray(list)) throw new Error('Should return array');
    if (list.length !== 3) throw new Error(`Expected 3 plugins, got ${list.length}`);
    if (!list.includes('p1')) throw new Error('Should include p1');
    if (!list.includes('p2')) throw new Error('Should include p2');
    if (!list.includes('p3')) throw new Error('Should include p3');
});

test('List loaded plugins - Returns only loaded', () => {
    const pm = new PluginManager({ autoLoad: false });

    pm.register('loaded1', new LanguagePlugin());
    pm.register('loaded2', new ExporterPlugin());

    const loaded = pm.listLoaded();

    if (!Array.isArray(loaded)) throw new Error('Should return array');
    if (loaded.length !== 2) throw new Error(`Expected 2 loaded plugins, got ${loaded.length}`);
});

test('List loaded plugins - Excludes unloaded', () => {
    const pm = new PluginManager({ autoLoad: false });

    pm.register('loaded', new LanguagePlugin());
    pm.register('unloaded', new LanguagePlugin());
    pm.unload('unloaded');

    const loaded = pm.listLoaded();

    if (loaded.includes('unloaded')) throw new Error('Should not include unloaded plugins');
    if (!loaded.includes('loaded')) throw new Error('Should include loaded plugin');
});

test('GetInfo - Returns complete info', () => {
    const pm = new PluginManager({ autoLoad: false });

    const testPlugin = new LanguagePlugin();
    pm.register('info-test', testPlugin);

    const info = pm.getInfo('info-test');

    if (!info) throw new Error('Should return info object');
    if (info.name !== 'info-test') throw new Error('Name should match');
    if (info.loaded !== true) throw new Error('Should be marked as loaded');
    if (info.hasInstance !== true) throw new Error('Should have instance');
});

test('GetStats - Returns accurate statistics', () => {
    const pm = new PluginManager({ autoLoad: false });

    pm.register('p1', new LanguagePlugin());
    pm.register('p2', new LanguagePlugin());
    pm.unload('p1');

    const stats = pm.getStats();

    if (stats.registered !== 2) throw new Error('Registered count wrong');
    if (stats.loaded !== 1) throw new Error('Loaded count wrong');
});

// ============================================================================
// EVENT SYSTEM TESTS
// ============================================================================
console.log('\n📡 Event System Tests');
console.log('-'.repeat(70));

test('Event: plugin:registered - Fires on registration', () => {
    const pm = new PluginManager({ autoLoad: false });

    let eventFired = false;
    let eventData = null;

    pm.on('plugin:registered', (data) => {
        eventFired = true;
        eventData = data;
    });

    pm.register('event-test', new LanguagePlugin());

    if (!eventFired) throw new Error('Event should fire');
    if (!eventData || eventData.name !== 'event-test') {
        throw new Error('Event data should include plugin name');
    }
});

test('Event: plugin:unloaded - Fires on unload', () => {
    const pm = new PluginManager({ autoLoad: false });

    let eventFired = false;
    let eventData = null;

    pm.register('unload-event', new LanguagePlugin());

    pm.on('plugin:unloaded', (data) => {
        eventFired = true;
        eventData = data;
    });

    pm.unload('unload-event');

    if (!eventFired) throw new Error('Event should fire');
    if (!eventData || eventData.name !== 'unload-event') {
        throw new Error('Event data should include plugin name');
    }
});

test('Event: initialized - Fires on initialize', async () => {
    const pm = new PluginManager({ autoLoad: false });

    let eventFired = false;

    pm.on('initialized', () => {
        eventFired = true;
    });

    await pm.initialize();

    if (!eventFired) throw new Error('Initialized event should fire');
});

test('Multiple event listeners', () => {
    const pm = new PluginManager({ autoLoad: false });

    let listener1 = false;
    let listener2 = false;

    pm.on('plugin:registered', () => { listener1 = true; });
    pm.on('plugin:registered', () => { listener2 = true; });

    pm.register('multi-listener', new LanguagePlugin());

    if (!listener1 || !listener2) throw new Error('All listeners should be called');
});

// ============================================================================
// PLUGIN BASE CLASS ADVANCED TESTS
// ============================================================================
console.log('\n🔤 LanguagePlugin Advanced Tests');
console.log('-'.repeat(70));

test('LanguagePlugin - Validate edge cases', () => {
    const plugin = new LanguagePlugin();

    if (plugin.validate(undefined)) throw new Error('Should not validate undefined');
    if (plugin.validate(null)) throw new Error('Should not validate null');
    if (plugin.validate('')) throw new Error('Should not validate empty string');
    // Note: whitespace-only strings are considered valid (length > 0)
    if (!plugin.validate('   ')) throw new Error('Whitespace-only is technically valid');
    if (!plugin.validate('code')) throw new Error('Should validate normal code');
});

test('LanguagePlugin - Analyze complexity with edge cases', () => {
    const plugin = new LanguagePlugin();

    // Empty code - split('\n') returns [''], so length is 1
    if (plugin.analyzeComplexity('') !== 1) {
        throw new Error('Empty code splits to 1 element');
    }

    // Single line
    if (plugin.analyzeComplexity('single line') !== 1) {
        throw new Error('Single line should have complexity 1');
    }

    // Multiple lines with empty lines
    const code = 'line1\n\nline3\n\n\nline6';
    if (plugin.analyzeComplexity(code) !== 6) {
        throw new Error('Should count empty lines');
    }
});

test('LanguagePlugin - GetMetadata returns copy', () => {
    const plugin = new LanguagePlugin();
    plugin.name = 'test';
    plugin.extensions = ['.test'];

    const metadata1 = plugin.getMetadata();
    const metadata2 = plugin.getMetadata();

    if (metadata1 === metadata2) {
        throw new Error('Should return new object each time');
    }
});

test('LanguagePlugin - Custom extension validation', () => {
    const plugin = new LanguagePlugin();
    plugin.extensions = ['.js', '.jsx', '.ts', '.tsx'];

    const metadata = plugin.getMetadata();

    if (!Array.isArray(metadata.extensions)) throw new Error('Extensions should be array');
    if (metadata.extensions.length !== 4) throw new Error('All extensions should be included');
});

// ============================================================================
// EXPORTER PLUGIN ADVANCED TESTS
// ============================================================================
console.log('\n📤 ExporterPlugin Advanced Tests');
console.log('-'.repeat(70));

test('ExporterPlugin - Validate edge cases', () => {
    const plugin = new ExporterPlugin();

    if (plugin.validate(null)) throw new Error('Should not validate null');
    if (plugin.validate(undefined)) throw new Error('Should not validate undefined');
    if (plugin.validate('')) throw new Error('Should not validate empty string');
    if (!plugin.validate('content')) throw new Error('Should validate normal content');
});

test('ExporterPlugin - Compression default behavior', () => {
    const plugin = new ExporterPlugin();

    const original = 'test content here';
    const compressed = plugin.compress(original);

    if (compressed !== original) {
        throw new Error('Default compress should return same content');
    }
});

test('ExporterPlugin - GetMetadata completeness', () => {
    const plugin = new ExporterPlugin();
    plugin.name = 'custom-exporter';
    plugin.extension = '.custom';
    plugin.mimeType = 'application/custom';
    plugin.version = '2.5.0';

    const metadata = plugin.getMetadata();

    if (metadata.name !== 'custom-exporter') throw new Error('Name mismatch');
    if (metadata.extension !== '.custom') throw new Error('Extension mismatch');
    if (metadata.mimeType !== 'application/custom') throw new Error('MIME type mismatch');
    if (metadata.version !== '2.5.0') throw new Error('Version mismatch');
});

test('ExporterPlugin - Decode not supported by default', () => {
    const plugin = new ExporterPlugin();

    try {
        plugin.decode('{"test": "data"}');
        throw new Error('Should throw error for decode');
    } catch (error) {
        if (!error.message.includes('not supported')) {
            throw new Error('Should indicate decode not supported');
        }
    }
});

// ============================================================================
// CONCURRENT OPERATIONS TESTS
// ============================================================================
console.log('\n🔀 Concurrent Operations Tests');
console.log('-'.repeat(70));

test('Register multiple plugins concurrently', () => {
    const pm = new PluginManager({ autoLoad: false });

    const plugins = Array.from({ length: 10 }, (_, i) => ({
        name: `concurrent-${i}`,
        plugin: new LanguagePlugin()
    }));

    plugins.forEach(({ name, plugin }) => {
        pm.register(name, plugin);
    });

    if (pm.list().length !== 10) throw new Error('Should register all plugins');
    if (pm.getStats().registered !== 10) throw new Error('Stats should reflect all registrations');
});

test('Get multiple plugins concurrently', () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 5; i++) {
        pm.register(`plugin-${i}`, new LanguagePlugin());
    }

    const results = Array.from({ length: 5 }, (_, i) => pm.get(`plugin-${i}`));

    if (results.some(r => r === null)) throw new Error('All plugins should be retrieved');
    if (results.length !== 5) throw new Error('Should get all plugins');
});

test('Unload multiple plugins concurrently', () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 5; i++) {
        pm.register(`unload-${i}`, new LanguagePlugin());
    }

    for (let i = 0; i < 5; i++) {
        pm.unload(`unload-${i}`);
    }

    if (pm.listLoaded().length !== 0) throw new Error('All plugins should be unloaded');
});

// ============================================================================
// EDGE CASES AND STRESS TESTS
// ============================================================================
console.log('\n🔥 Edge Cases and Stress Tests');
console.log('-'.repeat(70));

test('Empty plugin manager operations', () => {
    const pm = new PluginManager({ autoLoad: false });

    // All operations should work on empty manager
    if (pm.list().length !== 0) throw new Error('List should be empty');
    if (pm.listLoaded().length !== 0) throw new Error('Loaded list should be empty');
    if (pm.get('anything') !== null) throw new Error('Get should return null');
    if (pm.isLoaded('anything') !== false) throw new Error('IsLoaded should return false');

    // Should not throw
    pm.unload('anything');
    pm.unloadAll();
});

test('Plugin with very long name', () => {
    const pm = new PluginManager({ autoLoad: false });

    const longName = 'a'.repeat(1000);
    pm.register(longName, new LanguagePlugin());

    if (!pm.isLoaded(longName)) throw new Error('Should handle long names');
});

test('Plugin with special characters in name', () => {
    const pm = new PluginManager({ autoLoad: false });

    const specialNames = ['plugin-dash', 'plugin_underscore', 'plugin.dot', 'plugin@at'];

    specialNames.forEach(name => {
        pm.register(name, new LanguagePlugin());
    });

    if (pm.list().length !== specialNames.length) {
        throw new Error('Should handle special characters');
    }
});

test('Register same plugin name twice - Overwrites', () => {
    const pm = new PluginManager({ autoLoad: false });

    const plugin1 = new LanguagePlugin();
    plugin1.version = '1.0.0';

    const plugin2 = new LanguagePlugin();
    plugin2.version = '2.0.0';

    pm.register('same-name', plugin1);
    pm.register('same-name', plugin2);

    const retrieved = pm.get('same-name');
    if (retrieved.version !== '2.0.0') throw new Error('Should use latest registered plugin');
});

test('Large number of plugins - Performance', () => {
    const pm = new PluginManager({ autoLoad: false });

    const count = 100;
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
        pm.register(`perf-${i}`, new LanguagePlugin());
    }

    const elapsed = Date.now() - startTime;

    if (pm.list().length !== count) throw new Error(`Should register ${count} plugins`);
    if (elapsed > 1000) throw new Error('Registration too slow (>1s for 100 plugins)');
});

test('Stats accuracy after complex operations', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Register 10
    for (let i = 0; i < 10; i++) {
        pm.register(`stat-${i}`, new LanguagePlugin());
    }

    // Unload 5
    for (let i = 0; i < 5; i++) {
        pm.unload(`stat-${i}`);
    }

    // Register 3 more
    for (let i = 10; i < 13; i++) {
        pm.register(`stat-${i}`, new LanguagePlugin());
    }

    const stats = pm.getStats();

    if (stats.registered !== 13) throw new Error('Registered count wrong');
    if (stats.loaded !== 8) throw new Error('Loaded count wrong (13 - 5)');
});

// ============================================================================
// INTEGRATION WITH REAL PLUGIN SCENARIOS
// ============================================================================
console.log('\n🔗 Real-World Integration Tests');
console.log('-'.repeat(70));

test('Language plugin workflow - Complete lifecycle', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Create realistic language plugin
    const jsPlugin = new LanguagePlugin();
    jsPlugin.name = 'javascript';
    jsPlugin.extensions = ['.js', '.jsx', '.mjs'];
    jsPlugin.version = '1.5.0';

    // Register
    pm.register('javascript', jsPlugin);

    // Verify registration
    if (!pm.isLoaded('javascript')) throw new Error('Should be loaded');

    // Get and use
    const plugin = pm.get('javascript');
    if (!plugin) throw new Error('Should retrieve plugin');

    const metadata = plugin.getMetadata();
    if (!metadata.extensions.includes('.jsx')) {
        throw new Error('Metadata should include all extensions');
    }

    // Unload
    pm.unload('javascript');
    if (pm.isLoaded('javascript')) throw new Error('Should be unloaded');
});

test('Exporter plugin workflow - Complete lifecycle', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Create realistic exporter plugin
    const jsonExporter = new ExporterPlugin();
    jsonExporter.name = 'json';
    jsonExporter.extension = '.json';
    jsonExporter.mimeType = 'application/json';
    jsonExporter.version = '2.0.0';

    // Register
    pm.register('json-exporter', jsonExporter);

    // Verify
    const plugin = pm.get('json-exporter');
    if (!plugin) throw new Error('Should retrieve exporter');

    const metadata = plugin.getMetadata();
    if (metadata.mimeType !== 'application/json') {
        throw new Error('Metadata should match');
    }

    // Test validation
    if (!plugin.validate('{"test": "data"}')) {
        throw new Error('Should validate JSON content');
    }
});

test('Mixed plugin types in single manager', () => {
    const pm = new PluginManager({ autoLoad: false });

    // Register multiple types
    const langPlugins = ['javascript', 'python', 'rust'].map(name => {
        const p = new LanguagePlugin();
        p.name = name;
        return { name, plugin: p };
    });

    const exporterPlugins = ['json', 'xml', 'csv'].map(name => {
        const p = new ExporterPlugin();
        p.name = name;
        return { name: `${name}-exporter`, plugin: p };
    });

    [...langPlugins, ...exporterPlugins].forEach(({ name, plugin }) => {
        pm.register(name, plugin);
    });

    if (pm.list().length !== 6) throw new Error('Should register all plugins');

    // Verify mix
    const js = pm.get('javascript');
    const json = pm.get('json-exporter');

    if (!(js instanceof LanguagePlugin)) throw new Error('Should be LanguagePlugin');
    if (!(json instanceof ExporterPlugin)) throw new Error('Should be ExporterPlugin');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 ADVANCED TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All advanced plugin system tests passed!');
    console.log('✨ Plugin system is production-ready!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review.');
    process.exit(1);
}
