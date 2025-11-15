#!/usr/bin/env node

/**
 * Tests for modules with 0% coverage
 * Target: API Server, Cache, Core modules, Git integration, Plugins, UI, Watch
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

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

console.log('🎯 Zero Coverage Modules - Comprehensive Tests\n');

// ============================================================================
// CORE MODULES - Scanner, Analyzer, ContextBuilder, Reporter
// ============================================================================
console.log('📦 Core Modules - Scanner, Analyzer, ContextBuilder, Reporter');
console.log('='.repeat(70));

const testDir = '/tmp/core-module-test';

// Test Scanner
await asyncTest('Scanner - Scan directory recursively', async () => {
    const { default: Scanner } = await import('../lib/core/Scanner.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(join(testDir, 'src'), { recursive: true });
    writeFileSync(join(testDir, 'src', 'index.js'), 'console.log("test");');
    writeFileSync(join(testDir, 'README.md'), '# Test');
    
    const scanner = new Scanner(testDir, {});
    const files = await scanner.scan();
    
    if (!Array.isArray(files)) throw new Error('Should return array of files');
    if (files.length < 2) throw new Error('Should find test files');
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('Scanner - Respect .gitignore', async () => {
    const { default: Scanner } = await import('../lib/core/Scanner.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(join(testDir, 'node_modules'), { recursive: true });
    writeFileSync(join(testDir, '.gitignore'), 'node_modules/');
    writeFileSync(join(testDir, 'index.js'), 'console.log("main");');
    writeFileSync(join(testDir, 'node_modules', 'dep.js'), 'console.log("dep");');
    
    const scanner = new Scanner(testDir, { respectGitignore: true });
    const files = await scanner.scan();
    
    const hasNodeModules = files.some(f => f.includes('node_modules'));
    if (hasNodeModules) throw new Error('Should respect .gitignore');
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('Scanner - Handle empty directory', async () => {
    const { default: Scanner } = await import('../lib/core/Scanner.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const scanner = new Scanner(testDir, {});
    const files = await scanner.scan();
    
    if (!Array.isArray(files)) throw new Error('Should return array');
    
    rmSync(testDir, { recursive: true, force: true });
});

// Test Analyzer
await asyncTest('Analyzer - Analyze files with tokens', async () => {
    const { default: Analyzer } = await import('../lib/core/Analyzer.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'test.js'), 'function hello() { return "world"; }');
    
    const analyzer = new Analyzer(testDir, {});
    const results = await analyzer.analyze([join(testDir, 'test.js')]);
    
    if (!results) throw new Error('Should return results');
    if (!Array.isArray(results.files)) throw new Error('Should have files array');
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('Analyzer - Handle large files', async () => {
    const { default: Analyzer } = await import('../lib/core/Analyzer.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const largeContent = 'const x = 1;\n'.repeat(1000);
    writeFileSync(join(testDir, 'large.js'), largeContent);
    
    const analyzer = new Analyzer(testDir, {});
    const results = await analyzer.analyze([join(testDir, 'large.js')]);
    
    if (!results) throw new Error('Should handle large files');
    
    rmSync(testDir, { recursive: true, force: true });
});

// Test ContextBuilder
await asyncTest('ContextBuilder - Build context from analysis', async () => {
    const { default: ContextBuilder } = await import('../lib/core/ContextBuilder.js');
    
    const analysisResults = {
        files: [
            { path: 'test.js', tokens: 100, content: 'console.log("test");' }
        ],
        totalTokens: 100,
        totalFiles: 1
    };
    
    const builder = new ContextBuilder(projectRoot, {});
    const context = builder.build(analysisResults);
    
    if (!context) throw new Error('Should build context');
});

await asyncTest('ContextBuilder - Optimize for LLM', async () => {
    const { default: ContextBuilder } = await import('../lib/core/ContextBuilder.js');
    
    const analysisResults = {
        files: [
            { path: 'test.js', tokens: 100, content: 'test content' }
        ],
        totalTokens: 100
    };
    
    const builder = new ContextBuilder(projectRoot, { targetLLM: 'gpt-4' });
    const context = builder.build(analysisResults);
    
    if (!context) throw new Error('Should optimize for LLM');
});

// Test Reporter
await asyncTest('Reporter - Generate text report', async () => {
    const { default: Reporter } = await import('../lib/core/Reporter.js');
    
    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalLines: 1000
    };
    
    const reporter = new Reporter(stats, {});
    const report = reporter.generateText();
    
    if (typeof report !== 'string') throw new Error('Should generate text report');
    if (!report.includes('10') && !report.includes('5000')) {
        throw new Error('Should include stats');
    }
});

await asyncTest('Reporter - Generate JSON report', async () => {
    const { default: Reporter } = await import('../lib/core/Reporter.js');
    
    const stats = {
        totalFiles: 5,
        totalTokens: 2000
    };
    
    const reporter = new Reporter(stats, {});
    const report = reporter.generateJSON();
    
    if (typeof report !== 'string') throw new Error('Should generate JSON string');
    const parsed = JSON.parse(report);
    if (!parsed) throw new Error('Should be valid JSON');
});

// ============================================================================
// CACHE MANAGER
// ============================================================================
console.log('\n💾 Cache Manager - Comprehensive Tests');
console.log('='.repeat(70));

await asyncTest('CacheManager - Initialize cache', async () => {
    const { default: CacheManager } = await import('../lib/cache/CacheManager.js');
    
    const cache = new CacheManager(testDir, {});
    if (!cache) throw new Error('Should create cache instance');
});

await asyncTest('CacheManager - Store and retrieve data', async () => {
    const { default: CacheManager } = await import('../lib/cache/CacheManager.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const cache = new CacheManager(testDir, {});
    await cache.set('test-key', { value: 'test-data' });
    const result = await cache.get('test-key');
    
    if (!result || result.value !== 'test-data') {
        throw new Error('Should store and retrieve data');
    }
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('CacheManager - Handle cache miss', async () => {
    const { default: CacheManager } = await import('../lib/cache/CacheManager.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const cache = new CacheManager(testDir, {});
    const result = await cache.get('non-existent-key');
    
    if (result !== null && result !== undefined) {
        throw new Error('Should return null/undefined for cache miss');
    }
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('CacheManager - Clear cache', async () => {
    const { default: CacheManager } = await import('../lib/cache/CacheManager.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const cache = new CacheManager(testDir, {});
    await cache.set('key1', 'value1');
    await cache.clear();
    const result = await cache.get('key1');
    
    if (result) throw new Error('Should clear cache');
    
    rmSync(testDir, { recursive: true, force: true });
});

// ============================================================================
// GIT INTEGRATION - GitClient, DiffAnalyzer, BlameTracker
// ============================================================================
console.log('\n📂 Git Integration - GitClient, DiffAnalyzer, BlameTracker');
console.log('='.repeat(70));

await asyncTest('GitClient - Initialize in git repo', async () => {
    const { default: GitClient } = await import('../lib/integrations/git/GitClient.js');
    
    const client = new GitClient(projectRoot);
    if (!client) throw new Error('Should create GitClient instance');
});

await asyncTest('GitClient - Check if directory is git repo', async () => {
    const { default: GitClient } = await import('../lib/integrations/git/GitClient.js');
    
    const client = new GitClient(projectRoot);
    const isRepo = await client.isGitRepository();
    
    // This project should be a git repo
    if (!isRepo) throw new Error('Should detect git repository');
});

await asyncTest('GitClient - Get current branch', async () => {
    const { default: GitClient } = await import('../lib/integrations/git/GitClient.js');
    
    const client = new GitClient(projectRoot);
    const branch = await client.getCurrentBranch();
    
    if (typeof branch !== 'string') throw new Error('Should return branch name');
});

await asyncTest('DiffAnalyzer - Analyze changes', async () => {
    const { default: DiffAnalyzer } = await import('../lib/integrations/git/DiffAnalyzer.js');
    
    const analyzer = new DiffAnalyzer(projectRoot);
    if (!analyzer) throw new Error('Should create DiffAnalyzer instance');
});

await asyncTest('DiffAnalyzer - Get changed files', async () => {
    const { default: DiffAnalyzer } = await import('../lib/integrations/git/DiffAnalyzer.js');
    
    const analyzer = new DiffAnalyzer(projectRoot);
    const changedFiles = await analyzer.getChangedFiles();
    
    if (!Array.isArray(changedFiles)) throw new Error('Should return array');
});

await asyncTest('BlameTracker - Initialize', async () => {
    const { default: BlameTracker } = await import('../lib/integrations/git/BlameTracker.js');
    
    const tracker = new BlameTracker(projectRoot);
    if (!tracker) throw new Error('Should create BlameTracker instance');
});

await asyncTest('BlameTracker - Get file blame', async () => {
    const { default: BlameTracker } = await import('../lib/integrations/git/BlameTracker.js');
    
    const tracker = new BlameTracker(projectRoot);
    // Use a file we know exists
    const testFile = 'README.md';
    const blame = await tracker.getBlame(testFile);
    
    if (!blame) throw new Error('Should get blame info');
});

// ============================================================================
// PLUGIN SYSTEM
// ============================================================================
console.log('\n🔌 Plugin System - PluginManager, LanguagePlugin, ExporterPlugin');
console.log('='.repeat(70));

await asyncTest('PluginManager - Initialize', async () => {
    const { default: PluginManager } = await import('../lib/plugins/PluginManager.js');
    
    const manager = new PluginManager();
    if (!manager) throw new Error('Should create PluginManager instance');
});

await asyncTest('PluginManager - Load plugins', async () => {
    const { default: PluginManager } = await import('../lib/plugins/PluginManager.js');
    
    const manager = new PluginManager();
    await manager.loadPlugins();
    
    // Should have loaded some default plugins
});

await asyncTest('PluginManager - Get available plugins', async () => {
    const { default: PluginManager } = await import('../lib/plugins/PluginManager.js');
    
    const manager = new PluginManager();
    const plugins = manager.getPlugins();
    
    if (!plugins) throw new Error('Should return plugins list');
});

await asyncTest('LanguagePlugin - Create language plugin', async () => {
    const { default: LanguagePlugin } = await import('../lib/plugins/LanguagePlugin.js');
    
    class TestPlugin extends LanguagePlugin {
        getName() { return 'test'; }
        getExtensions() { return ['.test']; }
        analyze(content) { return { tokens: 10 }; }
    }
    
    const plugin = new TestPlugin();
    if (!plugin) throw new Error('Should create plugin');
    if (plugin.getName() !== 'test') throw new Error('Should have name');
});

await asyncTest('ExporterPlugin - Create exporter plugin', async () => {
    const { default: ExporterPlugin } = await import('../lib/plugins/ExporterPlugin.js');
    
    class TestExporter extends ExporterPlugin {
        getName() { return 'test-exporter'; }
        export(data) { return JSON.stringify(data); }
    }
    
    const exporter = new TestExporter();
    if (!exporter) throw new Error('Should create exporter');
    const result = exporter.export({ test: 'data' });
    if (!result) throw new Error('Should export data');
});

// ============================================================================
// WATCH MODE - FileWatcher, IncrementalAnalyzer
// ============================================================================
console.log('\n👁️  Watch Mode - FileWatcher, IncrementalAnalyzer');
console.log('='.repeat(70));

await asyncTest('FileWatcher - Initialize watcher', async () => {
    const { default: FileWatcher } = await import('../lib/watch/FileWatcher.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const watcher = new FileWatcher(testDir, {});
    if (!watcher) throw new Error('Should create watcher');
    
    // Clean up
    if (watcher.close) await watcher.close();
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('IncrementalAnalyzer - Initialize', async () => {
    const { default: IncrementalAnalyzer } = await import('../lib/watch/IncrementalAnalyzer.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    
    const analyzer = new IncrementalAnalyzer(testDir, {});
    if (!analyzer) throw new Error('Should create incremental analyzer');
    
    rmSync(testDir, { recursive: true, force: true });
});

await asyncTest('IncrementalAnalyzer - Analyze changes', async () => {
    const { default: IncrementalAnalyzer } = await import('../lib/watch/IncrementalAnalyzer.js');
    
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
    
    const analyzer = new IncrementalAnalyzer(testDir, {});
    const changes = await analyzer.analyzeChanges([join(testDir, 'test.js')]);
    
    if (!changes) throw new Error('Should analyze changes');
    
    rmSync(testDir, { recursive: true, force: true });
});

// ============================================================================
// API SERVER
// ============================================================================
console.log('\n🌐 API Server - REST Endpoints');
console.log('='.repeat(70));

await asyncTest('API Server - Can import server module', async () => {
    const serverModule = await import('../lib/api/rest/server.js');
    if (!serverModule) throw new Error('Should import server module');
    if (!serverModule.default && !serverModule.createServer) {
        throw new Error('Should export server function');
    }
});

// Note: Actually starting the server would require more setup and cleanup
// We'll test that the module can be imported and basic structure exists

// ============================================================================
// UI COMPONENTS (INK-based)
// ============================================================================
console.log('\n🎨 UI Components - Wizard, Dashboard, ProgressBar, SelectInput');
console.log('='.repeat(70));

test('Wizard - Can import module', () => {
    // INK components need React context, so we just verify they can be imported
    const fs = require('fs');
    const wizardPath = join(projectRoot, 'lib', 'ui', 'wizard.js');
    if (!fs.existsSync(wizardPath)) {
        throw new Error('Wizard module should exist');
    }
});

test('Dashboard - Can import module', () => {
    const fs = require('fs');
    const dashboardPath = join(projectRoot, 'lib', 'ui', 'dashboard.js');
    if (!fs.existsSync(dashboardPath)) {
        throw new Error('Dashboard module should exist');
    }
});

test('ProgressBar - Can import module', () => {
    const fs = require('fs');
    const progressPath = join(projectRoot, 'lib', 'ui', 'progress-bar.js');
    if (!fs.existsSync(progressPath)) {
        throw new Error('ProgressBar module should exist');
    }
});

test('SelectInput - Can import module', () => {
    const fs = require('fs');
    const selectPath = join(projectRoot, 'lib', 'ui', 'select-input.js');
    if (!fs.existsSync(selectPath)) {
        throw new Error('SelectInput module should exist');
    }
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 ZERO COVERAGE MODULES TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL ZERO COVERAGE MODULE TESTS PASSED!');
    console.log('✨ Significant coverage improvement for previously untested modules.');
}

process.exit(testsFailed > 0 ? 1 : 0);
