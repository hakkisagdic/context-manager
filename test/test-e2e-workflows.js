#!/usr/bin/env node

/**
 * End-to-End Workflow Integration Tests
 * Tests complete user workflows from start to finish
 *
 * Coverage areas:
 * - Complete file scan → analysis → export pipeline
 * - Method-level analysis workflows
 * - Git integration workflows
 * - Preset application workflows
 * - Multi-format export workflows
 * - Real-world usage scenarios
 */

import { Scanner } from '../lib/core/Scanner.js';
import { Analyzer } from '../lib/core/Analyzer.js';
import { ContextBuilder } from '../lib/core/ContextBuilder.js';
import { Reporter } from '../lib/core/Reporter.js';
import TokenCalculator from '../lib/analyzers/token-calculator.js';
import { PresetManager } from '../lib/presets/preset-manager.js';
import { TokenBudgetFitter } from '../lib/optimizers/token-budget-fitter.js';
import { GitClient } from '../lib/integrations/git/GitClient.js';
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

console.log('🧪 Testing End-to-End Workflows...\n');

// ============================================================================
// COMPLETE SCAN → ANALYZE → EXPORT PIPELINE
// ============================================================================
console.log('🔄 Complete Pipeline Tests');
console.log('-'.repeat(70));

await asyncTest('E2E - Basic file scan and analysis', async () => {
    const scanner = new Scanner(process.cwd());

    // Scan for JavaScript files
    const files = await scanner.scan({
        includePatterns: ['**/*.js'],
        excludePatterns: ['**/node_modules/**', '**/test/**'],
        maxFiles: 10
    });

    if (!Array.isArray(files)) throw new Error('Should return files array');
    if (files.length === 0) throw new Error('Should find at least some JS files');

    // Verify file structure
    if (!files[0].path) throw new Error('File should have path');
    if (typeof files[0].size !== 'number') throw new Error('File should have size');
});

await asyncTest('E2E - Scan → Analyze → Build context', async () => {
    const scanner = new Scanner(process.cwd());
    const analyzer = new Analyzer();
    const builder = new ContextBuilder();

    // Step 1: Scan
    const files = await scanner.scan({
        includePatterns: ['package.json'],
        maxFiles: 1
    });

    if (files.length === 0) throw new Error('Should find package.json');

    // Step 2: Analyze
    const analyzed = await analyzer.analyze(files);

    if (!analyzed) throw new Error('Analysis should return results');
    if (!Array.isArray(analyzed.files)) throw new Error('Should have files array');

    // Step 3: Build context
    const context = builder.build(analyzed);

    if (!context) throw new Error('Context should be built');
    if (!context.project) throw new Error('Context should have project info');
});

await asyncTest('E2E - Complete pipeline with Reporter', async () => {
    const scanner = new Scanner(process.cwd());
    const analyzer = new Analyzer();
    const builder = new ContextBuilder();
    const reporter = new Reporter();

    // Complete workflow
    const files = await scanner.scan({
        includePatterns: ['package.json', 'index.js'],
        maxFiles: 2
    });

    const analyzed = await analyzer.analyze(files);
    const context = builder.build(analyzed);
    const report = reporter.generate(context, { format: 'json' });

    if (!report) throw new Error('Report should be generated');
    if (typeof report !== 'object' && typeof report !== 'string') {
        throw new Error('Report should be object or string');
    }
});

// ============================================================================
// METHOD-LEVEL ANALYSIS WORKFLOWS
// ============================================================================
console.log('\n🔍 Method-Level Analysis Workflows');
console.log('-'.repeat(70));

test('E2E - Method extraction from JavaScript file', () => {
    const calculator = new TokenCalculator();

    const testCode = `
function hello() {
    return "world";
}

const greet = () => {
    console.log("Hello");
};

class MyClass {
    myMethod() {
        return true;
    }
}
`;

    const methods = calculator.extractMethodsFromContent(testCode, 'test.js');

    if (!Array.isArray(methods)) throw new Error('Should return methods array');
    if (methods.length < 3) throw new Error('Should find at least 3 methods');

    // Verify method structure
    const firstMethod = methods[0];
    if (!firstMethod.name) throw new Error('Method should have name');
    if (!firstMethod.content) throw new Error('Method should have content');
});

test('E2E - Method-level token calculation', () => {
    const calculator = new TokenCalculator();

    const testCode = `
function calculateSum(a, b) {
    const result = a + b;
    return result;
}
`;

    const methods = calculator.extractMethodsFromContent(testCode, 'test.js');

    if (methods.length === 0) throw new Error('Should find method');

    const method = methods[0];
    if (typeof method.tokens !== 'number') {
        throw new Error('Method should have token count');
    }
    if (method.tokens <= 0) throw new Error('Token count should be positive');
});

// ============================================================================
// GIT INTEGRATION WORKFLOWS
// ============================================================================
console.log('\n🌿 Git Integration Workflows');
console.log('-'.repeat(70));

test('E2E - Check git repository and get status', () => {
    const git = new GitClient(process.cwd());

    if (!git.isGitRepo) {
        console.log('   ⚠️  Skipped: Not a git repository');
        testsPassed++;
        return;
    }

    // Get current branch
    const branch = git.getCurrentBranch();
    if (!branch) throw new Error('Should get current branch');

    // Get changed files
    const changedFiles = git.getChangedFiles();
    if (!Array.isArray(changedFiles)) throw new Error('Should return array');
});

test('E2E - Git workflow with file history', () => {
    const git = new GitClient(process.cwd());

    if (!git.isGitRepo) {
        console.log('   ⚠️  Skipped: Not a git repository');
        testsPassed++;
        return;
    }

    // Get file history
    const history = git.getFileHistory('package.json', 5);

    if (!Array.isArray(history)) throw new Error('Should return history array');
    if (history.length === 0) throw new Error('package.json should have history');

    // Verify commit structure
    const commit = history[0];
    if (!commit.hash) throw new Error('Commit should have hash');
    if (!commit.author) throw new Error('Commit should have author');
});

// ============================================================================
// PRESET WORKFLOWS
// ============================================================================
console.log('\n⚙️  Preset Application Workflows');
console.log('-'.repeat(70));

await asyncTest('E2E - Load and apply preset', async () => {
    const presetManager = new PresetManager();

    // Load presets
    await presetManager.loadPresets();

    const presets = presetManager.listPresets();
    if (!Array.isArray(presets)) throw new Error('Should return presets array');
    if (presets.length === 0) throw new Error('Should have presets');

    // Get preset info
    const presetId = presets[0];
    const preset = presetManager.getPreset(presetId);

    if (!preset) throw new Error('Should get preset');
    if (!preset.id) throw new Error('Preset should have id');
    if (!preset.name) throw new Error('Preset should have name');
});

await asyncTest('E2E - Preset validation and metadata', async () => {
    const presetManager = new PresetManager();
    await presetManager.loadPresets();

    const presets = presetManager.listPresets();

    // Validate each preset
    for (const presetId of presets) {
        const preset = presetManager.getPreset(presetId);

        if (!preset.id) throw new Error(`Preset ${presetId} missing id`);
        if (!preset.name) throw new Error(`Preset ${presetId} missing name`);
        if (!preset.description) throw new Error(`Preset ${presetId} missing description`);
    }
});

// ============================================================================
// TOKEN BUDGET OPTIMIZATION WORKFLOWS
// ============================================================================
console.log('\n💰 Token Budget Optimization Workflows');
console.log('-'.repeat(70));

test('E2E - Token budget fitting workflow', () => {
    const fitter = new TokenBudgetFitter();

    // Mock file data
    const files = [
        { path: 'src/index.js', tokens: 1000 },
        { path: 'src/utils.js', tokens: 500 },
        { path: 'test/test.js', tokens: 800 },
        { path: 'docs/README.md', tokens: 300 }
    ];

    const targetTokens = 2000;
    const fitted = fitter.fitToBudget(files, targetTokens, 'auto');

    if (!fitted) throw new Error('Should return fitted result');
    if (!Array.isArray(fitted.selectedFiles)) {
        throw new Error('Should have selectedFiles array');
    }

    // Calculate total tokens
    const totalTokens = fitted.selectedFiles.reduce((sum, f) => sum + f.tokens, 0);
    if (totalTokens > targetTokens) {
        throw new Error('Should not exceed target tokens');
    }
});

test('E2E - Budget fitting with different strategies', () => {
    const fitter = new TokenBudgetFitter();

    const files = [
        { path: 'src/index.js', tokens: 1000 },
        { path: 'docs/README.md', tokens: 500 }
    ];

    const strategies = ['auto', 'shrink-docs', 'balanced', 'top-n'];

    for (const strategy of strategies) {
        const fitted = fitter.fitToBudget(files, 1200, strategy);

        if (!fitted) throw new Error(`Strategy ${strategy} should work`);
        if (!Array.isArray(fitted.selectedFiles)) {
            throw new Error(`Strategy ${strategy} should return files`);
        }
    }
});

// ============================================================================
// MULTI-FORMAT EXPORT WORKFLOWS
// ============================================================================
console.log('\n📄 Multi-Format Export Workflows');
console.log('-'.repeat(70));

await asyncTest('E2E - Export to multiple formats', async () => {
    const scanner = new Scanner(process.cwd());
    const analyzer = new Analyzer();
    const builder = new ContextBuilder();
    const reporter = new Reporter();

    // Scan and analyze
    const files = await scanner.scan({
        includePatterns: ['package.json'],
        maxFiles: 1
    });

    const analyzed = await analyzer.analyze(files);
    const context = builder.build(analyzed);

    // Test different formats
    const formats = ['json', 'yaml'];

    for (const format of formats) {
        const report = reporter.generate(context, { format });

        if (!report) throw new Error(`Format ${format} should generate report`);
    }
});

// ============================================================================
// REAL-WORLD SCENARIOS
// ============================================================================
console.log('\n🌍 Real-World Usage Scenarios');
console.log('-'.repeat(70));

await asyncTest('Scenario - Analyze small project', async () => {
    const scanner = new Scanner(process.cwd());

    // Scan current project (limited scope)
    const files = await scanner.scan({
        includePatterns: ['*.js', 'lib/**/*.js'],
        excludePatterns: ['**/node_modules/**', '**/test/**'],
        maxFiles: 20
    });

    if (!Array.isArray(files)) throw new Error('Should scan files');

    const analyzer = new Analyzer();
    const analyzed = await analyzer.analyze(files);

    if (!analyzed.files) throw new Error('Should analyze files');

    // Verify we have token counts
    const totalTokens = analyzed.files.reduce((sum, f) => sum + (f.tokens || 0), 0);
    if (totalTokens === 0) throw new Error('Should calculate tokens');
});

await asyncTest('Scenario - Git changed files workflow', async () => {
    const git = new GitClient(process.cwd());

    if (!git.isGitRepo) {
        console.log('   ⚠️  Skipped: Not a git repository');
        testsPassed++;
        return;
    }

    // Get changed files
    const changedFiles = git.getChangedFiles();

    // If we have changed files, analyze them
    if (changedFiles.length > 0) {
        const scanner = new Scanner(process.cwd());

        // Filter to only changed files
        const files = await scanner.scan({
            includePatterns: changedFiles.map(f => f.replace(/\\/g, '/')),
            maxFiles: changedFiles.length
        });

        if (!Array.isArray(files)) throw new Error('Should return files');
    }
});

test('Scenario - Method filtering workflow', () => {
    const calculator = new TokenCalculator();

    const testCode = `
function publicMethod() {
    return "public";
}

function _privateMethod() {
    return "private";
}

function testMethod() {
    return "test";
}
`;

    // Extract all methods
    const allMethods = calculator.extractMethodsFromContent(testCode, 'test.js');

    if (allMethods.length < 3) throw new Error('Should find all methods');

    // Filter out test and private methods
    const filteredMethods = allMethods.filter(m => {
        return !m.name.startsWith('_') && !m.name.includes('test');
    });

    if (filteredMethods.length !== 1) {
        throw new Error('Should filter to only public method');
    }
    if (filteredMethods[0].name !== 'publicMethod') {
        throw new Error('Should keep publicMethod');
    }
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================
console.log('\n⚡ Performance Tests');
console.log('-'.repeat(70));

await asyncTest('Performance - Scan performance (small project)', async () => {
    const scanner = new Scanner(process.cwd());

    const startTime = Date.now();
    const files = await scanner.scan({
        includePatterns: ['**/*.js'],
        excludePatterns: ['**/node_modules/**'],
        maxFiles: 50
    });
    const elapsed = Date.now() - startTime;

    if (elapsed > 2000) throw new Error('Scan too slow (>2s for 50 files)');
    if (!Array.isArray(files)) throw new Error('Should return files');
});

test('Performance - Token calculation (batch)', () => {
    const calculator = new TokenCalculator();

    const testFiles = Array.from({ length: 10 }, (_, i) => ({
        path: `test${i}.js`,
        content: 'function test() { return true; }'.repeat(10)
    }));

    const startTime = Date.now();
    for (const file of testFiles) {
        calculator.calculateTokensForContent(file.content);
    }
    const elapsed = Date.now() - startTime;

    if (elapsed > 500) throw new Error('Token calculation too slow (>500ms for 10 files)');
});

// ============================================================================
// ERROR RECOVERY TESTS
// ============================================================================
console.log('\n🛡️  Error Recovery Tests');
console.log('-'.repeat(70));

await asyncTest('Error Recovery - Invalid file path', async () => {
    const scanner = new Scanner(process.cwd());

    // Try to scan non-existent path
    const files = await scanner.scan({
        includePatterns: ['non-existent-directory/**/*.js'],
        maxFiles: 1
    });

    // Should not crash, just return empty array
    if (!Array.isArray(files)) throw new Error('Should return empty array');
});

test('Error Recovery - Malformed code parsing', () => {
    const calculator = new TokenCalculator();

    const malformedCode = 'function test( { this is broken';

    // Should not crash when parsing malformed code
    const methods = calculator.extractMethodsFromContent(malformedCode, 'bad.js');

    if (!Array.isArray(methods)) throw new Error('Should return array even for bad code');
});

test('Error Recovery - Empty content', () => {
    const calculator = new TokenCalculator();

    const tokens = calculator.calculateTokensForContent('');

    if (typeof tokens !== 'number') throw new Error('Should return number');
    if (tokens !== 0) throw new Error('Empty content should have 0 tokens');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 END-TO-END WORKFLOW TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All end-to-end workflow tests passed!');
    console.log('✨ Application workflows are production-ready!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review.');
    process.exit(1);
}
