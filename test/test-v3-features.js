#!/usr/bin/env node

/**
 * Test v3.0.0 Features
 * Tests for modular architecture, core modules, and plugin system
 */

import Scanner from '../lib/core/Scanner.js';
import Analyzer from '../lib/core/Analyzer.js';
import ContextBuilder from '../lib/core/ContextBuilder.js';
import Reporter from '../lib/core/Reporter.js';
import PluginManager from '../lib/plugins/PluginManager.js';
import assert from 'assert';
import path from 'path';

console.log('🧪 Testing v3.0.0 Features...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

async function testAsync(name, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`✅ ${name}`);
        passedTests++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

// Test 1: Scanner Module
test('Scanner - Should instantiate', () => {
    const scanner = new Scanner(process.cwd());
    assert(scanner, 'Scanner should exist');
    assert.strictEqual(typeof scanner.scan, 'function', 'Should have scan method');
});

// Test 2: Scanner - Should scan directory
test('Scanner - Should scan current directory', () => {
    const scanner = new Scanner(process.cwd());
    const files = scanner.scan();
    assert(Array.isArray(files), 'Should return array');
    assert(files.length > 0, 'Should find files');
    assert(files[0].relativePath, 'Files should have relativePath');
});

// Test 3: Analyzer Module
test('Analyzer - Should instantiate', () => {
    const analyzer = new Analyzer();
    assert(analyzer, 'Analyzer should exist');
    assert.strictEqual(typeof analyzer.analyze, 'function', 'Should have analyze method');
});

// Test 4: Analyzer - Should analyze files
await testAsync('Analyzer - Should analyze files', async () => {
    const scanner = new Scanner(process.cwd());
    const files = scanner.scan().slice(0, 5); // Test with first 5 files

    const analyzer = new Analyzer();
    const result = await analyzer.analyze(files);

    assert(result.files, 'Should have files in result');
    assert(result.stats, 'Should have stats in result');
    assert(result.stats.totalFiles > 0, 'Should have file count');
    assert(result.stats.totalTokens > 0, 'Should have token count');
});

// Test 5: ContextBuilder Module
test('ContextBuilder - Should instantiate', () => {
    const builder = new ContextBuilder();
    assert(builder, 'ContextBuilder should exist');
    assert.strictEqual(typeof builder.build, 'function', 'Should have build method');
});

// Test 6: ContextBuilder - Should build context
await testAsync('ContextBuilder - Should build context', async () => {
    const scanner = new Scanner(process.cwd());
    const files = scanner.scan().slice(0, 5);

    const analyzer = new Analyzer();
    const result = await analyzer.analyze(files);

    const builder = new ContextBuilder();
    const context = builder.build(result);

    assert(context.metadata, 'Should have metadata');
    assert(context.files, 'Should have files');
    assert(context.statistics, 'Should have statistics');
    assert(context.metadata.totalFiles > 0, 'Should have file count in metadata');
});

// Test 7: Reporter Module
test('Reporter - Should instantiate', () => {
    const reporter = new Reporter();
    assert(reporter, 'Reporter should exist');
    assert.strictEqual(typeof reporter.report, 'function', 'Should have report method');
});

// Test 8: PluginManager Module
test('PluginManager - Should instantiate', () => {
    const manager = new PluginManager({ autoLoad: false });
    assert(manager, 'PluginManager should exist');
    assert.strictEqual(typeof manager.load, 'function', 'Should have load method');
});

// Test 9: PluginManager - Should list plugins
await testAsync('PluginManager - Should discover plugins', async () => {
    const manager = new PluginManager({ autoLoad: false });
    await manager.initialize();

    const plugins = manager.list();
    assert(Array.isArray(plugins), 'Should return array');
    // May be empty if no plugins yet, that's okay
});

// Test 10: ContextBuilder - Should optimize for LLM
await testAsync('ContextBuilder - Should optimize for target LLM', async () => {
    const scanner = new Scanner(process.cwd());
    const files = scanner.scan().slice(0, 5);

    const analyzer = new Analyzer();
    const result = await analyzer.analyze(files);

    const builder = new ContextBuilder({ targetModel: 'claude-sonnet-4.5' });
    const context = builder.build(result);

    assert(context.metadata.targetLLM, 'Should have target LLM info');
    assert.strictEqual(context.metadata.targetLLM.name, 'Claude Sonnet 4.5');
    assert(context.metadata.recommendedFormat, 'Should have recommended format');
});

// Test 11: Scanner Stats
test('Scanner - Should provide statistics', () => {
    const scanner = new Scanner(process.cwd());
    scanner.scan();

    const stats = scanner.getStats();
    assert(stats.filesScanned > 0, 'Should have scanned files');
    assert(stats.directoriesTraversed > 0, 'Should have traversed directories');
});

// Test 12: Analyzer - Language Detection
await testAsync('Analyzer - Should detect languages', async () => {
    const scanner = new Scanner(process.cwd());
    const files = scanner.scan().slice(0, 10);

    const analyzer = new Analyzer();
    const result = await analyzer.analyze(files);

    const distribution = analyzer.getLanguageDistribution();
    assert(Array.isArray(distribution), 'Should return language distribution');
    assert(distribution.length > 0, 'Should have languages');
    assert(distribution[0].language, 'Should have language name');
});

// Results
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${passedTests}/${totalTests} passed`);

if (passedTests === totalTests) {
    console.log('✅ All v3.0.0 core tests passed!');
    process.exit(0);
} else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    process.exit(1);
}
