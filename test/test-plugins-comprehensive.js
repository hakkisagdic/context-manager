#!/usr/bin/env node

/**
 * Comprehensive Plugin System Tests
 * Tests for PluginManager, LanguagePlugin, ExporterPlugin
 */

import { PluginManager } from '../lib/plugins/PluginManager.js';
import { LanguagePlugin } from '../lib/plugins/LanguagePlugin.js';
import { ExporterPlugin } from '../lib/plugins/ExporterPlugin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'plugins');

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

console.log('🧪 Testing Plugin System...\n');

// ============================================================================
// LANGUAGE PLUGIN BASE CLASS TESTS
// ============================================================================
console.log('🔤 LanguagePlugin Base Class Tests');
console.log('-'.repeat(70));

// Create test plugin extending LanguagePlugin
class TestLanguagePlugin extends LanguagePlugin {
    constructor() {
        super();
        this.name = 'test-lang';
        this.extensions = ['.test'];
        this.version = '1.0.0';
    }

    extractMethods(content, filePath) {
        return [{
            name: 'testMethod',
            startLine: 1,
            endLine: 5,
            content: content.substring(0, 50)
        }];
    }
}

test('LanguagePlugin - Constructor sets defaults', () => {
    const plugin = new LanguagePlugin();
    if (plugin.name !== 'base') throw new Error('Should have default name');
    if (!Array.isArray(plugin.extensions)) throw new Error('Should have extensions array');
    if (!plugin.version) throw new Error('Should have version');
});

test('LanguagePlugin - getMetadata returns metadata', () => {
    const plugin = new LanguagePlugin();
    const metadata = plugin.getMetadata();
    if (typeof metadata !== 'object') throw new Error('Should return object');
    if (!metadata.name) throw new Error('Should have name');
    if (!metadata.version) throw new Error('Should have version');
    if (!Array.isArray(metadata.extensions)) throw new Error('Should have extensions');
});

test('LanguagePlugin - supportsAST returns false by default', () => {
    const plugin = new LanguagePlugin();
    if (plugin.supportsAST() !== false) throw new Error('Should return false');
});

test('LanguagePlugin - supportsMethodExtraction returns true by default', () => {
    const plugin = new LanguagePlugin();
    if (plugin.supportsMethodExtraction() !== true) throw new Error('Should return true');
});

test('LanguagePlugin - supportsFrameworkDetection returns false by default', () => {
    const plugin = new LanguagePlugin();
    if (plugin.supportsFrameworkDetection() !== false) throw new Error('Should return false');
});

test('LanguagePlugin - extractMethods throws error', () => {
    const plugin = new LanguagePlugin();
    try {
        plugin.extractMethods('test', 'test.js');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('must be implemented')) {
            throw new Error('Should throw not implemented error');
        }
    }
});

test('LanguagePlugin - detectFramework returns null by default', () => {
    const plugin = new LanguagePlugin();
    const result = plugin.detectFramework('test content');
    if (result !== null) throw new Error('Should return null');
});

test('LanguagePlugin - analyzeComplexity returns line count', () => {
    const plugin = new LanguagePlugin();
    const content = 'line1\nline2\nline3';
    const complexity = plugin.analyzeComplexity(content);
    if (complexity !== 3) throw new Error('Should return line count');
});

test('LanguagePlugin - validate checks string and length', () => {
    const plugin = new LanguagePlugin();
    if (!plugin.validate('test')) throw new Error('Should validate string');
    if (plugin.validate('')) throw new Error('Should reject empty string');
    if (plugin.validate(null)) throw new Error('Should reject null');
});

test('LanguagePlugin - cleanup does not throw', () => {
    const plugin = new LanguagePlugin();
    plugin.cleanup(); // Should not throw
});

test('LanguagePlugin - Subclass can override methods', () => {
    const plugin = new TestLanguagePlugin();
    if (plugin.name !== 'test-lang') throw new Error('Should have custom name');
    if (plugin.extensions[0] !== '.test') throw new Error('Should have custom extension');
});

test('LanguagePlugin - Subclass extractMethods works', () => {
    const plugin = new TestLanguagePlugin();
    const methods = plugin.extractMethods('test content', 'test.test');
    if (!Array.isArray(methods)) throw new Error('Should return array');
    if (methods.length === 0) throw new Error('Should return methods');
    if (methods[0].name !== 'testMethod') throw new Error('Should have method name');
});

test('LanguagePlugin - Subclass metadata includes custom data', () => {
    const plugin = new TestLanguagePlugin();
    const metadata = plugin.getMetadata();
    if (metadata.name !== 'test-lang') throw new Error('Should have custom name');
    if (!metadata.extensions.includes('.test')) throw new Error('Should have custom extension');
});

// ============================================================================
// EXPORTER PLUGIN BASE CLASS TESTS
// ============================================================================
console.log('\n📦 ExporterPlugin Base Class Tests');
console.log('-'.repeat(70));

// Create test plugin extending ExporterPlugin
class TestExporterPlugin extends ExporterPlugin {
    constructor() {
        super();
        this.name = 'test-export';
        this.extension = '.test';
        this.mimeType = 'text/test';
    }

    encode(context, options = {}) {
        return `Test Export: ${context.project?.name || 'unknown'}`;
    }
}

test('ExporterPlugin - Constructor sets defaults', () => {
    const plugin = new ExporterPlugin();
    if (plugin.name !== 'base') throw new Error('Should have default name');
    if (!plugin.extension) throw new Error('Should have extension');
    if (!plugin.mimeType) throw new Error('Should have mimeType');
    if (!plugin.version) throw new Error('Should have version');
});

test('ExporterPlugin - getMetadata returns metadata', () => {
    const plugin = new ExporterPlugin();
    const metadata = plugin.getMetadata();
    if (typeof metadata !== 'object') throw new Error('Should return object');
    if (!metadata.name) throw new Error('Should have name');
    if (!metadata.extension) throw new Error('Should have extension');
    if (!metadata.mimeType) throw new Error('Should have mimeType');
});

test('ExporterPlugin - supportsChunking returns false by default', () => {
    const plugin = new ExporterPlugin();
    if (plugin.supportsChunking() !== false) throw new Error('Should return false');
});

test('ExporterPlugin - supportsCompression returns false by default', () => {
    const plugin = new ExporterPlugin();
    if (plugin.supportsCompression() !== false) throw new Error('Should return false');
});

test('ExporterPlugin - encode throws error', () => {
    const plugin = new ExporterPlugin();
    try {
        plugin.encode({});
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('must be implemented')) {
            throw new Error('Should throw not implemented error');
        }
    }
});

test('ExporterPlugin - decode throws error', () => {
    const plugin = new ExporterPlugin();
    try {
        plugin.decode('test');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('not supported')) {
            throw new Error('Should throw not supported error');
        }
    }
});

test('ExporterPlugin - validate checks string and length', () => {
    const plugin = new ExporterPlugin();
    if (!plugin.validate('test')) throw new Error('Should validate string');
    if (plugin.validate('')) throw new Error('Should reject empty string');
    if (plugin.validate(null)) throw new Error('Should reject null');
});

test('ExporterPlugin - compress returns content by default', () => {
    const plugin = new ExporterPlugin();
    const content = 'test content';
    if (plugin.compress(content) !== content) {
        throw new Error('Should return content unchanged');
    }
});

test('ExporterPlugin - cleanup does not throw', () => {
    const plugin = new ExporterPlugin();
    plugin.cleanup(); // Should not throw
});

test('ExporterPlugin - Subclass can override methods', () => {
    const plugin = new TestExporterPlugin();
    if (plugin.name !== 'test-export') throw new Error('Should have custom name');
    if (plugin.extension !== '.test') throw new Error('Should have custom extension');
    if (plugin.mimeType !== 'text/test') throw new Error('Should have custom mimeType');
});

test('ExporterPlugin - Subclass encode works', () => {
    const plugin = new TestExporterPlugin();
    const context = { project: { name: 'MyProject' } };
    const encoded = plugin.encode(context);
    if (!encoded.includes('MyProject')) throw new Error('Should encode context');
});

test('ExporterPlugin - Subclass metadata includes custom data', () => {
    const plugin = new TestExporterPlugin();
    const metadata = plugin.getMetadata();
    if (metadata.name !== 'test-export') throw new Error('Should have custom name');
    if (metadata.extension !== '.test') throw new Error('Should have custom extension');
});

test('ExporterPlugin - estimateTokens calculates tokens', () => {
    const plugin = new TestExporterPlugin();
    const context = { project: { name: 'Test' } };
    const tokens = plugin.estimateTokens(context);
    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens <= 0) throw new Error('Should return positive number');
});

// ============================================================================
// PLUGIN MANAGER TESTS
// ============================================================================
console.log('\n🔌 PluginManager Tests');
console.log('-'.repeat(70));

// Create mock plugin file
const mockPluginPath = path.join(FIXTURES_DIR, 'mock-plugin.js');
fs.writeFileSync(mockPluginPath, `
export class MockPlugin {
    constructor() {
        this.name = 'mock';
    }

    test() {
        return 'mock test';
    }
}

export default MockPlugin;
`);

test('PluginManager - Constructor creates instance', () => {
    const manager = new PluginManager({ autoLoad: false });
    if (typeof manager !== 'object') throw new Error('Should create instance');
    if (!(manager.plugins instanceof Map)) throw new Error('Should have plugins Map');
    if (!(manager.loaded instanceof Map)) throw new Error('Should have loaded Map');
});

test('PluginManager - Constructor accepts options', () => {
    const manager = new PluginManager({
        pluginPaths: ['./custom'],
        autoLoad: false,
        lazy: false
    });
    if (!manager.options.pluginPaths.includes('./custom')) {
        throw new Error('Should accept custom plugin paths');
    }
    if (manager.options.autoLoad !== false) throw new Error('Should accept autoLoad');
    if (manager.options.lazy !== false) throw new Error('Should accept lazy');
});

test('PluginManager - Has stats object', () => {
    const manager = new PluginManager({ autoLoad: false });
    if (typeof manager.stats !== 'object') throw new Error('Should have stats');
    if (typeof manager.stats.registered !== 'number') throw new Error('Should have registered count');
    if (typeof manager.stats.loaded !== 'number') throw new Error('Should have loaded count');
});

test('PluginManager - list returns array', () => {
    const manager = new PluginManager({ autoLoad: false });
    const list = manager.list();
    if (!Array.isArray(list)) throw new Error('Should return array');
});

test('PluginManager - listLoaded returns array', () => {
    const manager = new PluginManager({ autoLoad: false });
    const loaded = manager.listLoaded();
    if (!Array.isArray(loaded)) throw new Error('Should return array');
});

test('PluginManager - getStats returns stats object', () => {
    const manager = new PluginManager({ autoLoad: false });
    const stats = manager.getStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (typeof stats.registered !== 'number') throw new Error('Should have registered');
});

test('PluginManager - get returns null for unknown plugin', () => {
    const manager = new PluginManager({ autoLoad: false });
    const plugin = manager.get('nonexistent');
    if (plugin !== null) throw new Error('Should return null');
});

test('PluginManager - isLoaded returns false for unknown plugin', () => {
    const manager = new PluginManager({ autoLoad: false });
    if (manager.isLoaded('nonexistent')) throw new Error('Should return false');
});

test('PluginManager - getInfo returns null for unknown plugin', () => {
    const manager = new PluginManager({ autoLoad: false });
    const info = manager.getInfo('nonexistent');
    if (info !== null) throw new Error('Should return null');
});

// Async tests
await asyncTest('PluginManager - initialize emits event', async () => {
    const manager = new PluginManager({ autoLoad: false });
    let eventFired = false;
    manager.on('initialized', () => { eventFired = true; });
    await manager.initialize();
    if (!eventFired) throw new Error('Should emit initialized event');
});

await asyncTest('PluginManager - register adds plugin', async () => {
    const manager = new PluginManager({ autoLoad: false });
    const mockPlugin = new TestLanguagePlugin();
    manager.register('test-plugin', mockPlugin);

    if (!manager.isLoaded('test-plugin')) throw new Error('Should mark as loaded');
    if (manager.get('test-plugin') !== mockPlugin) throw new Error('Should return instance');
});

await asyncTest('PluginManager - register updates stats', async () => {
    const manager = new PluginManager({ autoLoad: false });
    const initialStats = manager.getStats();

    manager.register('test', new TestLanguagePlugin());

    const newStats = manager.getStats();
    if (newStats.registered !== initialStats.registered + 1) {
        throw new Error('Should increment registered count');
    }
});

await asyncTest('PluginManager - unload removes instance', async () => {
    const manager = new PluginManager({ autoLoad: false });
    manager.register('test', new TestLanguagePlugin());

    manager.unload('test');

    if (manager.isLoaded('test')) throw new Error('Should mark as not loaded');
    if (manager.get('test') !== null) throw new Error('Should clear instance');
});

await asyncTest('PluginManager - unloadAll unloads all plugins', async () => {
    const manager = new PluginManager({ autoLoad: false });
    manager.register('test1', new TestLanguagePlugin());
    manager.register('test2', new TestLanguagePlugin());

    manager.unloadAll();

    const loaded = manager.listLoaded();
    if (loaded.length !== 0) throw new Error('Should unload all plugins');
});

await asyncTest('PluginManager - getInfo returns plugin info', async () => {
    const manager = new PluginManager({ autoLoad: false });
    manager.register('test', new TestLanguagePlugin());

    const info = manager.getInfo('test');
    if (typeof info !== 'object') throw new Error('Should return object');
    if (info.name !== 'test') throw new Error('Should have name');
    if (!info.loaded) throw new Error('Should be loaded');
});

// Cleanup
fs.unlinkSync(mockPluginPath);
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmdirSync(FIXTURES_DIR, { recursive: true });
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
    console.log('\n🎉 All plugin system tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
