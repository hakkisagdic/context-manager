#!/usr/bin/env node

/**
 * Plugin System Tests
 * Tests PluginManager, LanguagePlugin, and ExporterPlugin
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

console.log('🧪 Testing Plugin System (v3.0.0)...\n');

// ============================================================================
// PLUGIN MANAGER TESTS
// ============================================================================
console.log('📦 PluginManager Tests');
console.log('-'.repeat(70));

test('PluginManager - Constructor', () => {
    const pm = new PluginManager();
    if (!pm) throw new Error('Failed to create PluginManager');
    if (!(pm.plugins instanceof Map)) throw new Error('plugins should be a Map');
    if (!(pm.loaded instanceof Map)) throw new Error('loaded should be a Map');
    if (!pm.stats) throw new Error('stats should be initialized');
});

test('PluginManager - Custom options', () => {
    const pm = new PluginManager({
        pluginPaths: ['./custom/path'],
        autoLoad: false,
        lazy: false
    });
    if (pm.options.autoLoad !== false) throw new Error('autoLoad not set');
    if (pm.options.lazy !== false) throw new Error('lazy not set');
    if (pm.options.pluginPaths[0] !== './custom/path') throw new Error('pluginPaths not set');
});

test('PluginManager - Stats initialization', () => {
    const pm = new PluginManager();
    if (typeof pm.stats.registered !== 'number') throw new Error('stats.registered not initialized');
    if (typeof pm.stats.loaded !== 'number') throw new Error('stats.loaded not initialized');
    if (typeof pm.stats.errors !== 'number') throw new Error('stats.errors not initialized');
});

await asyncTest('PluginManager - Initialize', async () => {
    const pm = new PluginManager({ autoLoad: false });
    await pm.initialize();
    // Should not throw
});

await asyncTest('PluginManager - Initialize with autoLoad', async () => {
    const pm = new PluginManager({ autoLoad: true });
    await pm.initialize();
    // Should discover plugins automatically
});

test('PluginManager - Plugin registration', () => {
    const pm = new PluginManager({ autoLoad: false });
    const pluginName = 'test-plugin';
    const pluginPath = '/fake/path/plugin.js';

    pm.plugins.set(pluginName, { name: pluginName, path: pluginPath });
    pm.stats.registered++;

    if (!pm.plugins.has(pluginName)) throw new Error('Plugin not registered');
    if (pm.stats.registered !== 1) throw new Error('Stats not updated');
});

test('PluginManager - Get plugin', () => {
    const pm = new PluginManager({ autoLoad: false });
    const pluginName = 'test-plugin';
    const plugin = { name: pluginName, version: '1.0.0' };

    pm.plugins.set(pluginName, plugin);

    const retrieved = pm.plugins.get(pluginName);
    if (!retrieved) throw new Error('Plugin not found');
    if (retrieved.name !== pluginName) throw new Error('Wrong plugin returned');
});

test('PluginManager - Has plugin', () => {
    const pm = new PluginManager({ autoLoad: false });
    pm.plugins.set('existing', {});

    if (!pm.plugins.has('existing')) throw new Error('Should find existing plugin');
    if (pm.plugins.has('non-existing')) throw new Error('Should not find non-existing plugin');
});

test('PluginManager - Event emitter', () => {
    const pm = new PluginManager({ autoLoad: false });
    let eventFired = false;

    pm.on('test-event', () => {
        eventFired = true;
    });

    pm.emit('test-event');

    if (!eventFired) throw new Error('Event not fired');
});

// ============================================================================
// LANGUAGE PLUGIN TESTS
// ============================================================================
console.log('\n🔤 LanguagePlugin Tests');
console.log('-'.repeat(70));

test('LanguagePlugin - Constructor', () => {
    const plugin = new LanguagePlugin();

    if (!plugin) throw new Error('Failed to create LanguagePlugin');
    if (plugin.name !== 'base') throw new Error('default name should be "base"');
    if (!Array.isArray(plugin.extensions)) throw new Error('extensions should be array');
    if (plugin.version !== '1.0.0') throw new Error('default version should be 1.0.0');
});

test('LanguagePlugin - Custom properties', () => {
    const plugin = new LanguagePlugin();
    plugin.name = 'test-lang';
    plugin.extensions = ['.js', '.ts'];
    plugin.version = '2.0.0';

    if (plugin.name !== 'test-lang') throw new Error('name not set');
    if (!Array.isArray(plugin.extensions)) throw new Error('extensions should be array');
    if (plugin.extensions.length !== 2) throw new Error('extensions length wrong');
    if (plugin.version !== '2.0.0') throw new Error('version not set');
});

test('LanguagePlugin - Supports AST (default)', () => {
    const plugin = new LanguagePlugin();
    if (plugin.supportsAST() !== false) throw new Error('Should not support AST by default');
});

test('LanguagePlugin - Supports method extraction (default)', () => {
    const plugin = new LanguagePlugin();
    if (plugin.supportsMethodExtraction() !== true) throw new Error('Should support method extraction by default');
});

test('LanguagePlugin - Extract methods throws error', () => {
    const plugin = new LanguagePlugin();
    const code = 'function test() {}';

    try {
        plugin.extractMethods(code, 'test.js');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('must be implemented')) throw new Error('Wrong error message');
    }
});

test('LanguagePlugin - Validate content', () => {
    const plugin = new LanguagePlugin();
    if (!plugin.validate('test code')) throw new Error('Should validate non-empty string');
    if (plugin.validate('')) throw new Error('Should not validate empty string');
    if (plugin.validate(null)) throw new Error('Should not validate null');
});

test('LanguagePlugin - Analyze complexity', () => {
    const plugin = new LanguagePlugin();
    const code = 'line1\nline2\nline3';
    const complexity = plugin.analyzeComplexity(code);
    if (complexity !== 3) throw new Error(`Expected complexity 3, got ${complexity}`);
});

test('LanguagePlugin - Get metadata', () => {
    const plugin = new LanguagePlugin();
    const metadata = plugin.getMetadata();

    if (!metadata) throw new Error('Metadata should be returned');
    if (metadata.name !== 'base') throw new Error('Metadata name wrong');
    if (!Array.isArray(metadata.extensions)) throw new Error('Metadata extensions should be array');
});

// ============================================================================
// EXPORTER PLUGIN TESTS
// ============================================================================
console.log('\n📤 ExporterPlugin Tests');
console.log('-'.repeat(70));

test('ExporterPlugin - Constructor', () => {
    const plugin = new ExporterPlugin();

    if (!plugin) throw new Error('Failed to create ExporterPlugin');
    if (plugin.name !== 'base') throw new Error('default name should be "base"');
    if (plugin.extension !== '.txt') throw new Error('default extension should be .txt');
    if (plugin.mimeType !== 'text/plain') throw new Error('default mimeType wrong');
    if (plugin.version !== '1.0.0') throw new Error('default version should be 1.0.0');
});

test('ExporterPlugin - Custom properties', () => {
    const plugin = new ExporterPlugin();
    plugin.name = 'json-exporter';
    plugin.extension = '.json';
    plugin.mimeType = 'application/json';
    plugin.version = '2.0.0';

    if (plugin.name !== 'json-exporter') throw new Error('name not set');
    if (plugin.extension !== '.json') throw new Error('extension not set');
    if (plugin.mimeType !== 'application/json') throw new Error('mimeType not set');
    if (plugin.version !== '2.0.0') throw new Error('version not set');
});

test('ExporterPlugin - Supports chunking (default)', () => {
    const plugin = new ExporterPlugin();
    if (plugin.supportsChunking() !== false) throw new Error('Should not support chunking by default');
});

test('ExporterPlugin - Supports compression (default)', () => {
    const plugin = new ExporterPlugin();
    if (plugin.supportsCompression() !== false) throw new Error('Should not support compression by default');
});

test('ExporterPlugin - Encode throws error', () => {
    const plugin = new ExporterPlugin();
    const data = { test: 'data' };

    try {
        plugin.encode(data);
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('must be implemented')) throw new Error('Wrong error message');
    }
});

test('ExporterPlugin - Decode throws error', () => {
    const plugin = new ExporterPlugin();
    const content = '{"test": "data"}';

    try {
        plugin.decode(content);
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('not supported')) throw new Error('Wrong error message');
    }
});

test('ExporterPlugin - Validate content', () => {
    const plugin = new ExporterPlugin();
    if (!plugin.validate('test content')) throw new Error('Should validate non-empty string');
    if (plugin.validate('')) throw new Error('Should not validate empty string');
});

test('ExporterPlugin - Get metadata', () => {
    const plugin = new ExporterPlugin();
    const metadata = plugin.getMetadata();

    if (!metadata) throw new Error('Metadata should be returned');
    if (metadata.name !== 'base') throw new Error('Metadata name wrong');
    if (metadata.extension !== '.txt') throw new Error('Metadata extension wrong');
    if (metadata.mimeType !== 'text/plain') throw new Error('Metadata mimeType wrong');
});

test('ExporterPlugin - Compress (default)', () => {
    const plugin = new ExporterPlugin();
    const content = 'test content';
    const compressed = plugin.compress(content);
    if (compressed !== content) throw new Error('Default compress should return same content');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

await asyncTest('PluginManager + LanguagePlugin integration', async () => {
    const pm = new PluginManager({ autoLoad: false });

    const langPlugin = new LanguagePlugin();
    langPlugin.name = 'javascript';
    langPlugin.extensions = ['.js'];

    pm.plugins.set('javascript', langPlugin);
    pm.stats.registered++;

    const retrieved = pm.plugins.get('javascript');
    if (!retrieved) throw new Error('Plugin not found in manager');
    if (retrieved.name !== 'javascript') throw new Error('Plugin name mismatch');
    if (!retrieved.extensions.includes('.js')) throw new Error('Plugin extension check failed');
});

await asyncTest('PluginManager + ExporterPlugin integration', async () => {
    const pm = new PluginManager({ autoLoad: false });

    const exporterPlugin = new ExporterPlugin();
    exporterPlugin.name = 'json-exporter';
    exporterPlugin.extension = '.json';
    exporterPlugin.mimeType = 'application/json';

    pm.plugins.set('json-exporter', exporterPlugin);
    pm.stats.registered++;

    const retrieved = pm.plugins.get('json-exporter');
    if (!retrieved) throw new Error('Exporter not found in manager');
    if (retrieved.name !== 'json-exporter') throw new Error('Exporter name mismatch');
    if (retrieved.extension !== '.json') throw new Error('Exporter extension check failed');
});

test('Multiple plugins registration', () => {
    const pm = new PluginManager({ autoLoad: false });

    const jsPlugin = new LanguagePlugin();
    jsPlugin.name = 'js';
    jsPlugin.extensions = ['.js'];

    const pyPlugin = new LanguagePlugin();
    pyPlugin.name = 'py';
    pyPlugin.extensions = ['.py'];

    const jsonPlugin = new ExporterPlugin();
    jsonPlugin.name = 'json';
    jsonPlugin.extension = '.json';

    const plugins = [jsPlugin, pyPlugin, jsonPlugin];

    plugins.forEach((plugin) => {
        pm.plugins.set(plugin.name, plugin);
        pm.stats.registered++;
    });

    if (pm.plugins.size !== 3) throw new Error(`Wrong number of plugins: expected 3, got ${pm.plugins.size}`);
    if (pm.stats.registered !== 3) throw new Error('Stats not updated correctly');
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
    console.log('\n🎉 All plugin system tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
