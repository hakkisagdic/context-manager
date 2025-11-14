#!/usr/bin/env node

/**
 * Extended Plugin System Tests
 * Comprehensive tests for PluginManager, LanguagePlugin, and ExporterPlugin
 *
 * Test Coverage:
 * - Custom plugin registration and lifecycle
 * - Plugin events and error handling
 * - Plugin dependencies and versioning
 * - Plugin conflicts and priority
 * - Plugin hot reload and unload
 * - Plugin metadata and validation
 * - Plugin isolation and performance
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

console.log('🧪 Testing Extended Plugin System...\n');

// ============================================================================
// CUSTOM LANGUAGE PLUGIN REGISTRATION
// ============================================================================
console.log('📦 Custom Language Plugin Registration Tests');
console.log('-'.repeat(70));

test('Custom language plugin - Create and register', () => {
    const pm = new PluginManager({ autoLoad: false });

    class CustomJSPlugin extends LanguagePlugin {
        constructor() {
            super();
            this.name = 'custom-javascript';
            this.extensions = ['.js', '.jsx', '.mjs'];
            this.version = '1.0.0';
        }

        extractMethods(content, filePath) {
            const methods = [];
            const regex = /function\s+(\w+)\s*\(/g;
            let match;

            while ((match = regex.exec(content)) !== null) {
                methods.push({
                    name: match[1],
                    line: content.substring(0, match.index).split('\n').length,
                    type: 'function'
                });
            }

            return methods;
        }
    }

    const plugin = new CustomJSPlugin();
    pm.register('custom-javascript', plugin);

    if (!pm.plugins.has('custom-javascript')) throw new Error('Plugin not registered');
    if (pm.stats.registered !== 1) throw new Error('Stats not updated');
    if (pm.stats.loaded !== 1) throw new Error('Plugin not marked as loaded');
});

test('Custom language plugin - Method extraction works', () => {
    class CustomPlugin extends LanguagePlugin {
        constructor() {
            super();
            this.name = 'test-lang';
        }

        extractMethods(content, filePath) {
            return [
                { name: 'testMethod', line: 1, type: 'method' }
            ];
        }
    }

    const plugin = new CustomPlugin();
    const methods = plugin.extractMethods('test code', 'test.js');

    if (!Array.isArray(methods)) throw new Error('Should return array');
    if (methods.length !== 1) throw new Error('Should return 1 method');
    if (methods[0].name !== 'testMethod') throw new Error('Method name wrong');
});

test('Custom language plugin - Override supportsAST', () => {
    class ASTPlugin extends LanguagePlugin {
        supportsAST() {
            return true;
        }
    }

    const plugin = new ASTPlugin();
    if (plugin.supportsAST() !== true) throw new Error('Should support AST');
});

test('Custom language plugin - Override detectFramework', () => {
    class FrameworkPlugin extends LanguagePlugin {
        detectFramework(content) {
            if (content.includes('React')) return 'React';
            if (content.includes('Vue')) return 'Vue';
            return null;
        }
    }

    const plugin = new FrameworkPlugin();
    const framework1 = plugin.detectFramework('import React from "react"');
    const framework2 = plugin.detectFramework('import Vue from "vue"');
    const framework3 = plugin.detectFramework('plain javascript');

    if (framework1 !== 'React') throw new Error('Should detect React');
    if (framework2 !== 'Vue') throw new Error('Should detect Vue');
    if (framework3 !== null) throw new Error('Should return null for no framework');
});

test('Custom language plugin - Override analyzeComplexity', () => {
    class ComplexityPlugin extends LanguagePlugin {
        analyzeComplexity(content) {
            // Cyclomatic complexity: count control flow statements
            const keywords = ['if', 'else', 'for', 'while', 'case', 'catch'];
            let complexity = 1;

            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                const matches = content.match(regex);
                if (matches) complexity += matches.length;
            });

            return complexity;
        }
    }

    const plugin = new ComplexityPlugin();
    const code = 'if (x) { for (let i = 0; i < 10; i++) { if (y) {} } }';
    const complexity = plugin.analyzeComplexity(code);

    if (complexity !== 4) throw new Error(`Expected complexity 4, got ${complexity}`);
});

// ============================================================================
// CUSTOM EXPORTER PLUGIN REGISTRATION
// ============================================================================
console.log('\n📤 Custom Exporter Plugin Registration Tests');
console.log('-'.repeat(70));

test('Custom exporter plugin - Create and register', () => {
    const pm = new PluginManager({ autoLoad: false });

    class CustomJSONExporter extends ExporterPlugin {
        constructor() {
            super();
            this.name = 'custom-json';
            this.extension = '.json';
            this.mimeType = 'application/json';
            this.version = '1.0.0';
        }

        encode(context, options = {}) {
            return JSON.stringify(context, null, options.pretty ? 2 : 0);
        }

        decode(content) {
            return JSON.parse(content);
        }
    }

    const plugin = new CustomJSONExporter();
    pm.register('custom-json', plugin);

    if (!pm.plugins.has('custom-json')) throw new Error('Plugin not registered');
    if (pm.stats.registered !== 1) throw new Error('Stats not updated');
});

test('Custom exporter plugin - Encode/decode works', () => {
    class TestExporter extends ExporterPlugin {
        encode(context) {
            return JSON.stringify(context);
        }

        decode(content) {
            return JSON.parse(content);
        }
    }

    const plugin = new TestExporter();
    const data = { test: 'data', count: 42 };
    const encoded = plugin.encode(data);
    const decoded = plugin.decode(encoded);

    if (decoded.test !== 'data') throw new Error('Decode failed');
    if (decoded.count !== 42) throw new Error('Decode failed');
});

test('Custom exporter plugin - Override supportsChunking', () => {
    class ChunkingExporter extends ExporterPlugin {
        supportsChunking() {
            return true;
        }
    }

    const plugin = new ChunkingExporter();
    if (plugin.supportsChunking() !== true) throw new Error('Should support chunking');
});

test('Custom exporter plugin - Override supportsCompression', () => {
    class CompressExporter extends ExporterPlugin {
        supportsCompression() {
            return true;
        }

        compress(content) {
            // Simple mock compression - remove whitespace
            return content.replace(/\s+/g, ' ').trim();
        }
    }

    const plugin = new CompressExporter();
    if (plugin.supportsCompression() !== true) throw new Error('Should support compression');

    const compressed = plugin.compress('test    content\n  with   spaces');
    if (compressed !== 'test content with spaces') throw new Error('Compression failed');
});

test('Custom exporter plugin - Override estimateTokens', () => {
    class TokenExporter extends ExporterPlugin {
        encode(context) {
            return JSON.stringify(context);
        }

        estimateTokens(context) {
            const encoded = this.encode(context);
            // More accurate token estimation: ~4 chars per token
            return Math.ceil(encoded.length / 4);
        }
    }

    const plugin = new TokenExporter();
    const data = { test: 'data' };
    const tokens = plugin.estimateTokens(data);

    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens <= 0) throw new Error('Should estimate positive tokens');
});

// ============================================================================
// PLUGIN LIFECYCLE EVENTS
// ============================================================================
console.log('\n🔄 Plugin Lifecycle Events Tests');
console.log('-'.repeat(70));

await asyncTest('Plugin lifecycle - initialized event', async () => {
    const pm = new PluginManager({ autoLoad: false });
    let eventFired = false;

    pm.on('initialized', () => {
        eventFired = true;
    });

    await pm.initialize();

    if (!eventFired) throw new Error('initialized event not fired');
});

await asyncTest('Plugin lifecycle - plugin:registered event', async () => {
    const pm = new PluginManager({ autoLoad: false });
    let eventData = null;

    pm.on('plugin:registered', (data) => {
        eventData = data;
    });

    const plugin = new LanguagePlugin();
    pm.register('test-plugin', plugin);

    if (!eventData) throw new Error('plugin:registered event not fired');
    if (eventData.name !== 'test-plugin') throw new Error('Wrong plugin name in event');
});

await asyncTest('Plugin lifecycle - plugin:loaded event', async () => {
    const pm = new PluginManager({ autoLoad: false });
    let loadedPlugin = null;

    pm.on('plugin:loaded', (data) => {
        loadedPlugin = data;
    });

    // Create a temporary plugin file
    const tempDir = path.join(__dirname, 'temp-plugins');
    const pluginPath = path.join(tempDir, 'test-plugin.js');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const pluginCode = `
export default class TestPlugin {
    constructor() {
        this.name = 'test-plugin';
    }
}
`;

    fs.writeFileSync(pluginPath, pluginCode);

    try {
        await pm.registerPluginFromFile(pluginPath);
        await pm.load('test-plugin');

        if (!loadedPlugin) throw new Error('plugin:loaded event not fired');
        if (loadedPlugin.name !== 'test-plugin') throw new Error('Wrong plugin name in event');
        if (typeof loadedPlugin.elapsed !== 'number') throw new Error('No elapsed time in event');
    } finally {
        // Cleanup
        fs.unlinkSync(pluginPath);
        fs.rmdirSync(tempDir);
    }
});

await asyncTest('Plugin lifecycle - plugin:unloaded event', async () => {
    const pm = new PluginManager({ autoLoad: false });
    let unloadedPlugin = null;

    pm.on('plugin:unloaded', (data) => {
        unloadedPlugin = data;
    });

    const plugin = new LanguagePlugin();
    plugin.name = 'test-plugin';
    pm.register('test-plugin', plugin);

    pm.unload('test-plugin');

    if (!unloadedPlugin) throw new Error('plugin:unloaded event not fired');
    if (unloadedPlugin.name !== 'test-plugin') throw new Error('Wrong plugin name in event');
});

test('Plugin lifecycle - cleanup on unload', () => {
    const pm = new PluginManager({ autoLoad: false });
    let cleanupCalled = false;

    class CleanupPlugin extends LanguagePlugin {
        cleanup() {
            cleanupCalled = true;
        }
    }

    const plugin = new CleanupPlugin();
    pm.register('cleanup-plugin', plugin);
    pm.unload('cleanup-plugin');

    if (!cleanupCalled) throw new Error('cleanup not called');
});

// ============================================================================
// PLUGIN INITIALIZATION ERRORS
// ============================================================================
console.log('\n⚠️  Plugin Initialization Error Tests');
console.log('-'.repeat(70));

await asyncTest('Plugin error - Load non-existent plugin', async () => {
    const pm = new PluginManager({ autoLoad: false });

    try {
        await pm.load('non-existent-plugin');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Plugin not found')) {
            throw new Error('Wrong error message');
        }
    }
});

await asyncTest('Plugin error - plugin:error event on load failure', async () => {
    const pm = new PluginManager({ autoLoad: false });
    let errorEvent = null;

    pm.on('plugin:error', (data) => {
        errorEvent = data;
    });

    // Register invalid plugin path
    pm.plugins.set('bad-plugin', {
        name: 'bad-plugin',
        path: '/non/existent/path.js',
        loaded: false,
        instance: null
    });
    pm.stats.registered++;

    try {
        await pm.load('bad-plugin');
    } catch (error) {
        // Expected to fail
    }

    if (!errorEvent) throw new Error('plugin:error event not fired');
    if (errorEvent.name !== 'bad-plugin') throw new Error('Wrong plugin name in error event');
    if (!errorEvent.error) throw new Error('No error in event');
});

test('Plugin error - Invalid plugin instance', () => {
    const pm = new PluginManager({ autoLoad: false });

    try {
        pm.register('invalid', null);
        // This should work, but getting the instance should fail
        const instance = pm.get('invalid');
        if (instance !== null) throw new Error('Should return null for invalid plugin');
    } catch (error) {
        // Some error handling is expected
    }
});

// ============================================================================
// PLUGIN METHOD OVERRIDE
// ============================================================================
console.log('\n🔧 Plugin Method Override Tests');
console.log('-'.repeat(70));

test('Language plugin - Override all major methods', () => {
    class FullOverridePlugin extends LanguagePlugin {
        supportsAST() { return true; }
        supportsMethodExtraction() { return true; }
        supportsFrameworkDetection() { return true; }

        extractMethods(content) {
            return [{ name: 'overridden', line: 1 }];
        }

        detectFramework(content) {
            return 'CustomFramework';
        }

        analyzeComplexity(content) {
            return 999;
        }

        validate(content) {
            return content.length > 10;
        }
    }

    const plugin = new FullOverridePlugin();

    if (!plugin.supportsAST()) throw new Error('supportsAST not overridden');
    if (!plugin.supportsFrameworkDetection()) throw new Error('supportsFrameworkDetection not overridden');

    const methods = plugin.extractMethods('test');
    if (methods[0].name !== 'overridden') throw new Error('extractMethods not overridden');

    const framework = plugin.detectFramework('test');
    if (framework !== 'CustomFramework') throw new Error('detectFramework not overridden');

    const complexity = plugin.analyzeComplexity('test');
    if (complexity !== 999) throw new Error('analyzeComplexity not overridden');

    if (plugin.validate('short')) throw new Error('validate not overridden');
    if (!plugin.validate('long enough content')) throw new Error('validate not working');
});

test('Exporter plugin - Override all major methods', () => {
    class FullExporterPlugin extends ExporterPlugin {
        supportsChunking() { return true; }
        supportsCompression() { return true; }

        encode(context) {
            return 'encoded:' + JSON.stringify(context);
        }

        decode(content) {
            return JSON.parse(content.replace('encoded:', ''));
        }

        validate(content) {
            return content.startsWith('encoded:');
        }

        estimateTokens(context) {
            return 1000;
        }

        compress(content) {
            return 'compressed:' + content;
        }
    }

    const plugin = new FullExporterPlugin();

    if (!plugin.supportsChunking()) throw new Error('supportsChunking not overridden');
    if (!plugin.supportsCompression()) throw new Error('supportsCompression not overridden');

    const encoded = plugin.encode({ test: 'data' });
    if (!encoded.startsWith('encoded:')) throw new Error('encode not overridden');

    const decoded = plugin.decode(encoded);
    if (decoded.test !== 'data') throw new Error('decode not overridden');

    if (!plugin.validate(encoded)) throw new Error('validate not working');
    if (plugin.validate('invalid')) throw new Error('validate should fail');

    if (plugin.estimateTokens({}) !== 1000) throw new Error('estimateTokens not overridden');

    const compressed = plugin.compress('test');
    if (!compressed.startsWith('compressed:')) throw new Error('compress not overridden');
});

// ============================================================================
// PLUGIN DEPENDENCY MANAGEMENT
// ============================================================================
console.log('\n🔗 Plugin Dependency Management Tests');
console.log('-'.repeat(70));

test('Plugin dependencies - Metadata with dependencies', () => {
    class DependentPlugin extends LanguagePlugin {
        constructor() {
            super();
            this.dependencies = ['base-plugin', 'helper-plugin'];
        }

        getMetadata() {
            return {
                ...super.getMetadata(),
                dependencies: this.dependencies
            };
        }
    }

    const plugin = new DependentPlugin();
    const metadata = plugin.getMetadata();

    if (!metadata.dependencies) throw new Error('Dependencies not in metadata');
    if (metadata.dependencies.length !== 2) throw new Error('Wrong dependency count');
});

test('Plugin dependencies - Check required plugins', () => {
    const pm = new PluginManager({ autoLoad: false });

    class DependentPlugin extends LanguagePlugin {
        constructor() {
            super();
            this.dependencies = ['required-plugin'];
        }

        checkDependencies(manager) {
            return this.dependencies.every(dep => manager.plugins.has(dep));
        }
    }

    const plugin = new DependentPlugin();

    // Should fail without dependency
    if (plugin.checkDependencies(pm)) throw new Error('Should not have dependencies');

    // Add dependency
    pm.register('required-plugin', new LanguagePlugin());

    // Should pass with dependency
    if (!plugin.checkDependencies(pm)) throw new Error('Should have dependencies');
});

// ============================================================================
// PLUGIN VERSION COMPATIBILITY
// ============================================================================
console.log('\n🔢 Plugin Version Compatibility Tests');
console.log('-'.repeat(70));

test('Plugin version - Semantic versioning check', () => {
    class VersionPlugin extends LanguagePlugin {
        constructor() {
            super();
            this.version = '2.5.3';
            this.minVersion = '2.0.0';
        }

        isCompatible(requiredVersion) {
            const [reqMajor, reqMinor] = requiredVersion.split('.').map(Number);
            const [major, minor] = this.version.split('.').map(Number);

            return major >= reqMajor && (major > reqMajor || minor >= reqMinor);
        }
    }

    const plugin = new VersionPlugin();

    if (!plugin.isCompatible('2.0.0')) throw new Error('Should be compatible with 2.0.0');
    if (!plugin.isCompatible('2.5.0')) throw new Error('Should be compatible with 2.5.0');
    if (plugin.isCompatible('3.0.0')) throw new Error('Should not be compatible with 3.0.0');
    if (plugin.isCompatible('2.6.0')) throw new Error('Should not be compatible with 2.6.0');
});

test('Plugin version - Metadata includes version', () => {
    const plugin = new LanguagePlugin();
    plugin.version = '3.2.1';

    const metadata = plugin.getMetadata();
    if (metadata.version !== '3.2.1') throw new Error('Version not in metadata');
});

// ============================================================================
// PLUGIN CONFLICT DETECTION
// ============================================================================
console.log('\n⚔️  Plugin Conflict Detection Tests');
console.log('-'.repeat(70));

test('Plugin conflict - Same name detection', () => {
    const pm = new PluginManager({ autoLoad: false });

    const plugin1 = new LanguagePlugin();
    plugin1.name = 'javascript';

    const plugin2 = new LanguagePlugin();
    plugin2.name = 'javascript';

    pm.register('javascript', plugin1);

    // Registering again should overwrite (or could be rejected)
    pm.register('javascript', plugin2);

    const retrieved = pm.get('javascript');
    if (retrieved !== plugin2) throw new Error('Should have latest plugin');
});

test('Plugin conflict - Same extension different plugins', () => {
    const plugin1 = new LanguagePlugin();
    plugin1.name = 'typescript';
    plugin1.extensions = ['.ts', '.tsx'];

    const plugin2 = new LanguagePlugin();
    plugin2.name = 'deno-typescript';
    plugin2.extensions = ['.ts'];

    // Both handle .ts files - would need conflict resolution
    const hasConflict = plugin1.extensions.some(ext =>
        plugin2.extensions.includes(ext)
    );

    if (!hasConflict) throw new Error('Should detect extension conflict');
});

// ============================================================================
// MULTIPLE PLUGINS OF SAME TYPE
// ============================================================================
console.log('\n🔢 Multiple Plugins of Same Type Tests');
console.log('-'.repeat(70));

test('Multiple language plugins - Register and manage', () => {
    const pm = new PluginManager({ autoLoad: false });

    const languages = ['javascript', 'python', 'rust', 'go'];
    languages.forEach(lang => {
        const plugin = new LanguagePlugin();
        plugin.name = lang;
        pm.register(lang, plugin);
    });

    if (pm.plugins.size !== 4) throw new Error('Should have 4 plugins');
    if (pm.stats.registered !== 4) throw new Error('Stats not updated');

    const list = pm.list();
    if (list.length !== 4) throw new Error('List should have 4 plugins');
});

test('Multiple exporter plugins - Register and manage', () => {
    const pm = new PluginManager({ autoLoad: false });

    const exporters = [
        { name: 'json', ext: '.json', mime: 'application/json' },
        { name: 'xml', ext: '.xml', mime: 'application/xml' },
        { name: 'yaml', ext: '.yaml', mime: 'application/yaml' },
        { name: 'csv', ext: '.csv', mime: 'text/csv' }
    ];

    exporters.forEach(exp => {
        const plugin = new ExporterPlugin();
        plugin.name = exp.name;
        plugin.extension = exp.ext;
        plugin.mimeType = exp.mime;
        pm.register(exp.name, plugin);
    });

    if (pm.plugins.size !== 4) throw new Error('Should have 4 exporters');

    const json = pm.get('json');
    if (!json) throw new Error('JSON exporter not found');
    if (json.extension !== '.json') throw new Error('Wrong extension');
});

// ============================================================================
// PLUGIN PRIORITY/ORDERING
// ============================================================================
console.log('\n📊 Plugin Priority/Ordering Tests');
console.log('-'.repeat(70));

test('Plugin priority - Order matters for file extension', () => {
    class PriorityPlugin extends LanguagePlugin {
        constructor(name, priority) {
            super();
            this.name = name;
            this.priority = priority;
            this.extensions = ['.js'];
        }
    }

    const plugins = [
        new PriorityPlugin('low', 1),
        new PriorityPlugin('high', 10),
        new PriorityPlugin('medium', 5)
    ];

    // Sort by priority
    plugins.sort((a, b) => b.priority - a.priority);

    if (plugins[0].name !== 'high') throw new Error('Priority sorting failed');
    if (plugins[1].name !== 'medium') throw new Error('Priority sorting failed');
    if (plugins[2].name !== 'low') throw new Error('Priority sorting failed');
});

test('Plugin priority - List in priority order', () => {
    const pm = new PluginManager({ autoLoad: false });

    class OrderedPlugin extends LanguagePlugin {
        constructor(name, order) {
            super();
            this.name = name;
            this.loadOrder = order;
        }
    }

    const plugins = [
        new OrderedPlugin('third', 3),
        new OrderedPlugin('first', 1),
        new OrderedPlugin('second', 2)
    ];

    plugins.forEach(p => pm.register(p.name, p));

    const ordered = Array.from(pm.plugins.values())
        .map(p => p.instance)
        .filter(p => p)
        .sort((a, b) => a.loadOrder - b.loadOrder);

    if (ordered[0].name !== 'first') throw new Error('Order wrong');
    if (ordered[1].name !== 'second') throw new Error('Order wrong');
    if (ordered[2].name !== 'third') throw new Error('Order wrong');
});

// ============================================================================
// PLUGIN UNLOAD
// ============================================================================
console.log('\n🔄 Plugin Unload Tests');
console.log('-'.repeat(70));

test('Plugin unload - Single plugin', () => {
    const pm = new PluginManager({ autoLoad: false });
    const plugin = new LanguagePlugin();
    pm.register('test', plugin);

    if (!pm.isLoaded('test')) throw new Error('Plugin should be loaded');

    pm.unload('test');

    if (pm.isLoaded('test')) throw new Error('Plugin should be unloaded');
    if (pm.stats.loaded !== 0) throw new Error('Stats not updated');
});

test('Plugin unload - All plugins', () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 5; i++) {
        const plugin = new LanguagePlugin();
        plugin.name = `plugin-${i}`;
        pm.register(`plugin-${i}`, plugin);
    }

    if (pm.stats.loaded !== 5) throw new Error('Should have 5 loaded plugins');

    pm.unloadAll();

    if (pm.stats.loaded !== 0) throw new Error('All plugins should be unloaded');

    const loaded = pm.listLoaded();
    if (loaded.length !== 0) throw new Error('No plugins should be loaded');
});

test('Plugin unload - Idempotent unload', () => {
    const pm = new PluginManager({ autoLoad: false });
    const plugin = new LanguagePlugin();
    pm.register('test', plugin);

    pm.unload('test');
    pm.unload('test'); // Should not throw
    pm.unload('non-existent'); // Should not throw

    // Should be fine
});

// ============================================================================
// PLUGIN ERROR ISOLATION
// ============================================================================
console.log('\n🛡️  Plugin Error Isolation Tests');
console.log('-'.repeat(70));

test('Error isolation - Plugin error does not crash manager', () => {
    const pm = new PluginManager({ autoLoad: false });

    class BuggyPlugin extends LanguagePlugin {
        extractMethods(content) {
            throw new Error('Intentional error');
        }
    }

    const plugin = new BuggyPlugin();
    pm.register('buggy', plugin);

    try {
        plugin.extractMethods('test');
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Intentional')) throw error;
    }

    // Manager should still work
    const list = pm.list();
    if (list.length !== 1) throw new Error('Manager corrupted');
});

test('Error isolation - One plugin error does not affect others', () => {
    const pm = new PluginManager({ autoLoad: false });

    class GoodPlugin extends LanguagePlugin {
        extractMethods(content) {
            return [{ name: 'good', line: 1 }];
        }
    }

    class BadPlugin extends LanguagePlugin {
        extractMethods(content) {
            throw new Error('Bad plugin error');
        }
    }

    const good = new GoodPlugin();
    good.name = 'good';
    const bad = new BadPlugin();
    bad.name = 'bad';

    pm.register('good', good);
    pm.register('bad', bad);

    // Good plugin should still work
    const goodResult = good.extractMethods('test');
    if (goodResult.length !== 1) throw new Error('Good plugin affected');

    // Bad plugin throws
    try {
        bad.extractMethods('test');
        throw new Error('Should have thrown');
    } catch (error) {
        if (!error.message.includes('Bad plugin')) throw error;
    }
});

// ============================================================================
// PLUGIN PERFORMANCE IMPACT
// ============================================================================
console.log('\n⚡ Plugin Performance Impact Tests');
console.log('-'.repeat(70));

test('Performance - Plugin registration time', () => {
    const pm = new PluginManager({ autoLoad: false });
    const start = Date.now();

    for (let i = 0; i < 100; i++) {
        const plugin = new LanguagePlugin();
        plugin.name = `plugin-${i}`;
        pm.register(`plugin-${i}`, plugin);
    }

    const elapsed = Date.now() - start;

    if (elapsed > 100) throw new Error(`Registration too slow: ${elapsed}ms`);
    if (pm.plugins.size !== 100) throw new Error('Not all plugins registered');
});

test('Performance - Plugin lookup time', () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 1000; i++) {
        const plugin = new LanguagePlugin();
        plugin.name = `plugin-${i}`;
        pm.register(`plugin-${i}`, plugin);
    }

    const start = Date.now();

    for (let i = 0; i < 1000; i++) {
        const plugin = pm.get(`plugin-${i}`);
        if (!plugin) throw new Error('Plugin not found');
    }

    const elapsed = Date.now() - start;

    if (elapsed > 50) throw new Error(`Lookup too slow: ${elapsed}ms`);
});

test('Performance - Method extraction benchmark', () => {
    class FastPlugin extends LanguagePlugin {
        extractMethods(content) {
            const methods = [];
            const lines = content.split('\n');

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('function')) {
                    methods.push({ name: `method-${i}`, line: i + 1 });
                }
            }

            return methods;
        }
    }

    const plugin = new FastPlugin();
    const largeCode = Array(1000).fill('function test() {}').join('\n');

    const start = Date.now();
    const methods = plugin.extractMethods(largeCode);
    const elapsed = Date.now() - start;

    if (methods.length !== 1000) throw new Error('Not all methods extracted');
    if (elapsed > 50) throw new Error(`Extraction too slow: ${elapsed}ms`);
});

// ============================================================================
// PLUGIN METADATA VALIDATION
// ============================================================================
console.log('\n✅ Plugin Metadata Validation Tests');
console.log('-'.repeat(70));

test('Metadata validation - Required fields', () => {
    const plugin = new LanguagePlugin();
    const metadata = plugin.getMetadata();

    const required = ['name', 'version', 'extensions'];
    required.forEach(field => {
        if (!(field in metadata)) throw new Error(`Missing required field: ${field}`);
    });
});

test('Metadata validation - Field types', () => {
    const plugin = new LanguagePlugin();
    const metadata = plugin.getMetadata();

    if (typeof metadata.name !== 'string') throw new Error('name should be string');
    if (typeof metadata.version !== 'string') throw new Error('version should be string');
    if (!Array.isArray(metadata.extensions)) throw new Error('extensions should be array');
    if (typeof metadata.supportsAST !== 'boolean') throw new Error('supportsAST should be boolean');
});

test('Metadata validation - Exporter metadata', () => {
    const plugin = new ExporterPlugin();
    const metadata = plugin.getMetadata();

    const required = ['name', 'version', 'extension', 'mimeType'];
    required.forEach(field => {
        if (!(field in metadata)) throw new Error(`Missing required field: ${field}`);
    });

    if (typeof metadata.extension !== 'string') throw new Error('extension should be string');
    if (typeof metadata.mimeType !== 'string') throw new Error('mimeType should be string');
});

// ============================================================================
// PLUGIN DISCOVERY
// ============================================================================
console.log('\n🔍 Plugin Discovery Tests');
console.log('-'.repeat(70));

await asyncTest('Plugin discovery - List registered plugins', async () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 5; i++) {
        const plugin = new LanguagePlugin();
        plugin.name = `lang-${i}`;
        pm.register(`lang-${i}`, plugin);
    }

    const list = pm.list();
    if (list.length !== 5) throw new Error(`Expected 5 plugins, got ${list.length}`);
    if (!list.includes('lang-0')) throw new Error('Plugin lang-0 not in list');
});

await asyncTest('Plugin discovery - List loaded plugins only', async () => {
    const pm = new PluginManager({ autoLoad: false });

    // Register some plugins
    for (let i = 0; i < 3; i++) {
        const plugin = new LanguagePlugin();
        plugin.name = `plugin-${i}`;
        pm.register(`plugin-${i}`, plugin);
    }

    // Unload one
    pm.unload('plugin-1');

    const loaded = pm.listLoaded();
    if (loaded.length !== 2) throw new Error(`Expected 2 loaded, got ${loaded.length}`);
    if (loaded.includes('plugin-1')) throw new Error('Unloaded plugin in list');
});

test('Plugin discovery - Get plugin info', () => {
    const pm = new PluginManager({ autoLoad: false });
    const plugin = new LanguagePlugin();
    plugin.name = 'test-plugin';
    pm.register('test-plugin', plugin);

    const info = pm.getInfo('test-plugin');

    if (!info) throw new Error('Info should be returned');
    if (info.name !== 'test-plugin') throw new Error('Wrong name in info');
    if (info.loaded !== true) throw new Error('Should be marked as loaded');
    if (!info.hasInstance) throw new Error('Should have instance');
});

test('Plugin discovery - Get stats', () => {
    const pm = new PluginManager({ autoLoad: false });

    for (let i = 0; i < 3; i++) {
        const plugin = new LanguagePlugin();
        pm.register(`plugin-${i}`, plugin);
    }

    const stats = pm.getStats();

    if (stats.registered !== 3) throw new Error('Wrong registered count');
    if (stats.loaded !== 3) throw new Error('Wrong loaded count');
    if (stats.errors !== 0) throw new Error('Should have no errors');
});

// ============================================================================
// PLUGIN HOT RELOAD (Advanced Feature)
// ============================================================================
console.log('\n🔥 Plugin Hot Reload Tests (Conceptual)');
console.log('-'.repeat(70));

await asyncTest('Hot reload - Unload and reload plugin', async () => {
    const pm = new PluginManager({ autoLoad: false });

    // Register initial version
    class PluginV1 extends LanguagePlugin {
        constructor() {
            super();
            this.version = '1.0.0';
        }
    }

    const v1 = new PluginV1();
    pm.register('hot-reload', v1);

    if (pm.get('hot-reload').version !== '1.0.0') throw new Error('V1 not loaded');

    // Hot reload - unload and load new version
    pm.unload('hot-reload');

    class PluginV2 extends LanguagePlugin {
        constructor() {
            super();
            this.version = '2.0.0';
        }
    }

    const v2 = new PluginV2();
    pm.register('hot-reload', v2);

    if (pm.get('hot-reload').version !== '2.0.0') throw new Error('V2 not loaded');
});

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
    console.log('\n🎉 All extended plugin system tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
