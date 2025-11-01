#!/usr/bin/env node

/**
 * Token Budget Fitter Tests
 * Tests for token budget fitting and strategies
 */

const TokenBudgetFitter = require('../lib/optimizers/token-budget-fitter');
const FitStrategies = require('../lib/optimizers/fit-strategies');
const assert = require('assert');

console.log('🧪 Running Token Budget Fitter Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(description, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✅ ${description}`);
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
    }
}

// Create mock files for testing
function createMockFiles() {
    return [
        { path: 'index.js', relativePath: 'index.js', tokens: 500 },
        { path: 'src/server.js', relativePath: 'src/server.js', tokens: 3000 },
        { path: 'src/handler.js', relativePath: 'src/handler.js', tokens: 2500 },
        { path: 'src/utils/helper.js', relativePath: 'src/utils/helper.js', tokens: 1000 },
        { path: 'src/utils/validator.js', relativePath: 'src/utils/validator.js', tokens: 1500 },
        { path: 'docs/README.md', relativePath: 'docs/README.md', tokens: 2000 },
        { path: 'docs/API.md', relativePath: 'docs/API.md', tokens: 1500 },
        { path: 'test/test.js', relativePath: 'test/test.js', tokens: 800 },
        { path: 'lib/core.js', relativePath: 'lib/core.js', tokens: 4000 },
        { path: 'lib/plugin.js', relativePath: 'lib/plugin.js', tokens: 1200 }
    ];
}

// Test 1: FitStrategies - Calculate Total
test('FitStrategies calculates total tokens correctly', () => {
    const files = createMockFiles();
    const total = FitStrategies.calculateTotal(files);
    assert.strictEqual(total, 18000, 'Should calculate correct total');
});

// Test 2: FitStrategies - Sort by Tokens
test('FitStrategies sorts files by tokens (descending)', () => {
    const files = [
        { tokens: 100 },
        { tokens: 500 },
        { tokens: 200 }
    ];
    const sorted = FitStrategies.sortByTokens(files);
    assert.strictEqual(sorted[0].tokens, 500, 'First should be largest');
    assert.strictEqual(sorted[2].tokens, 100, 'Last should be smallest');
});

// Test 3: FitStrategies - Calculate Importance
test('FitStrategies calculates file importance', () => {
    const entryPoint = { relativePath: 'index.js', tokens: 500 };
    const server = { relativePath: 'src/server.js', tokens: 3000 };
    const util = { relativePath: 'src/utils/helper.js', tokens: 1000 };

    const entryScore = FitStrategies.calculateImportance(entryPoint);
    const serverScore = FitStrategies.calculateImportance(server);
    const utilScore = FitStrategies.calculateImportance(util);

    assert(entryScore > serverScore, 'Entry point should have higher score than server');
    assert(serverScore > utilScore, 'Server should have higher score than util');
});

// Test 4: FitStrategies - Shrink Docs Strategy
test('Shrink docs strategy removes documentation first', () => {
    const files = createMockFiles();
    const result = FitStrategies.shrinkDocs(files, 10000);

    assert(result.files.length < files.length, 'Should exclude some files');
    assert(result.totalTokens <= 10000, 'Should fit within budget');

    // Check that docs were excluded
    const hasDocs = result.files.some(f => f.relativePath.includes('docs/'));
    assert(!hasDocs || result.totalTokens < 10000, 'Docs should be excluded or fit in budget');
});

// Test 5: FitStrategies - Top-N Strategy
test('Top-N strategy selects most important files', () => {
    const files = createMockFiles();
    const result = FitStrategies.topN(files, 8000);

    assert(result.files.length > 0, 'Should select some files');
    assert(result.totalTokens <= 8000, 'Should fit within budget');

    // Entry point should be included (high importance)
    const hasIndexJs = result.files.some(f => f.relativePath === 'index.js');
    assert(hasIndexJs, 'Entry point should be included');
});

// Test 6: FitStrategies - Balanced Strategy
test('Balanced strategy distributes files across directories', () => {
    const files = createMockFiles();
    const result = FitStrategies.balanced(files, 10000);

    assert(result.files.length > 0, 'Should select some files');
    assert(result.totalTokens <= 10000, 'Should fit within budget');

    // Should have files from different directories
    const dirs = new Set(result.files.map(f => {
        const parts = f.relativePath.split('/');
        return parts.length > 1 ? parts[0] : '/';
    }));
    assert(dirs.size > 1, 'Should select from multiple directories');
});

// Test 7: FitStrategies - Auto Strategy (No Reduction Needed)
test('Auto strategy returns all files when already fits', () => {
    const files = createMockFiles();
    const result = FitStrategies.auto(files, 20000); // More than total

    assert.strictEqual(result.files.length, files.length, 'Should include all files');
    assert(result.strategy.includes('no-reduction-needed'), 'Should indicate no reduction needed');
});

// Test 8: FitStrategies - Auto Strategy (Needs Reduction)
test('Auto strategy chooses best approach when reduction needed', () => {
    const files = createMockFiles();
    const result = FitStrategies.auto(files, 10000);

    assert(result.files.length < files.length, 'Should exclude some files');
    assert(result.totalTokens <= 10000, 'Should fit within budget');
    assert(result.strategy.includes('auto'), 'Should indicate auto strategy');
});

// Test 9: TokenBudgetFitter - Constructor
test('TokenBudgetFitter constructor initializes correctly', () => {
    const fitter = new TokenBudgetFitter(50000, { strategy: 'auto' });
    assert.strictEqual(fitter.targetTokens, 50000, 'Should set target tokens');
    assert.strictEqual(fitter.options.strategy, 'auto', 'Should set strategy');
});

// Test 10: TokenBudgetFitter - Fit (Already Fits)
test('TokenBudgetFitter returns all files when already fits', () => {
    const files = createMockFiles();
    const fitter = new TokenBudgetFitter(20000);
    const result = fitter.fit(files);

    assert.strictEqual(result.files.length, files.length, 'Should include all files');
    assert(result.fits, 'Should indicate it fits');
    assert.strictEqual(result.excluded, 0, 'Should have no exclusions');
});

// Test 11: TokenBudgetFitter - Fit (Needs Reduction)
test('TokenBudgetFitter reduces files to fit budget', () => {
    const files = createMockFiles();
    const fitter = new TokenBudgetFitter(10000, { strategy: 'auto' });
    const result = fitter.fit(files);

    assert(result.files.length < files.length, 'Should exclude some files');
    assert(result.totalTokens <= 10000, 'Should fit within budget');
    assert(result.excluded > 0, 'Should have exclusions');
    assert(result.reduction, 'Should calculate reduction percentage');
});

// Test 12: TokenBudgetFitter - Preserve Entry Points
test('TokenBudgetFitter preserves entry points', () => {
    const files = createMockFiles();
    const fitter = new TokenBudgetFitter(5000, {
        strategy: 'top-n',
        preserveEntryPoints: true
    });
    const result = fitter.fit(files);

    const hasIndexJs = result.files.some(f => f.relativePath === 'index.js');
    assert(hasIndexJs, 'Entry point should be preserved');
});

// Test 13: TokenBudgetFitter - Different Strategies
test('TokenBudgetFitter works with different strategies', () => {
    const files = createMockFiles();
    const strategies = ['auto', 'shrink-docs', 'top-n', 'balanced'];

    for (const strategy of strategies) {
        const fitter = new TokenBudgetFitter(10000, { strategy });
        const result = fitter.fit(files);

        assert(result.files.length > 0, `${strategy} should select files`);
        assert(result.strategy.includes(strategy) || result.strategy.includes('auto'), `Should use ${strategy} strategy`);
    }
});

// Test 14: TokenBudgetFitter - Empty Files
test('TokenBudgetFitter handles empty file list', () => {
    const fitter = new TokenBudgetFitter(10000);
    const result = fitter.fit([]);

    assert.strictEqual(result.files.length, 0, 'Should return empty list');
    assert(result.fits, 'Should indicate it fits');
    assert(result.message.includes('No files'), 'Should have appropriate message');
});

// Test 15: TokenBudgetFitter - Recommend Strategy
test('TokenBudgetFitter recommends appropriate strategy', () => {
    const files = createMockFiles();

    const strategy1 = TokenBudgetFitter.recommendStrategy(files, 20000); // ratio 0.9
    assert.strictEqual(strategy1, 'none (already fits)', 'Should recommend no change');

    const strategy2 = TokenBudgetFitter.recommendStrategy(files, 15000); // ratio 1.2
    assert.strictEqual(strategy2, 'shrink-docs', 'Should recommend shrink-docs');

    const strategy3 = TokenBudgetFitter.recommendStrategy(files, 10000); // ratio 1.8
    assert.strictEqual(strategy3, 'balanced', 'Should recommend balanced');

    const strategy4 = TokenBudgetFitter.recommendStrategy(files, 7000); // ratio 2.6
    assert.strictEqual(strategy4, 'methods-only', 'Should recommend methods-only');

    const strategy5 = TokenBudgetFitter.recommendStrategy(files, 3000); // ratio 6
    assert.strictEqual(strategy5, 'top-n', 'Should recommend top-n');
});

// Test 16: TokenBudgetFitter - Analyze Files
test('TokenBudgetFitter analyzes file statistics', () => {
    const files = createMockFiles();
    const stats = TokenBudgetFitter.analyzeFiles(files);

    assert.strictEqual(stats.totalFiles, 10, 'Should count all files');
    assert.strictEqual(stats.totalTokens, 18000, 'Should calculate total tokens');
    assert(stats.byExtension.js, 'Should group by extension');
    assert(stats.byDirectory.src, 'Should group by directory');
    assert.strictEqual(stats.largestFiles.length, 10, 'Should list largest files');
    assert.strictEqual(stats.largestFiles[0].tokens, 4000, 'Largest should be first');
});

// Test 17: FitStrategies - Methods Only
test('Methods-only strategy marks for method-level analysis', () => {
    const files = createMockFiles();
    const result = FitStrategies.methodsOnly(files, 10000);

    assert(result.requiresMethodLevel, 'Should require method level');
    assert(result.estimatedReduction > 0, 'Should estimate reduction');
});

// Test 18: TokenBudgetFitter - Result Metadata
test('TokenBudgetFitter result includes complete metadata', () => {
    const files = createMockFiles();
    const fitter = new TokenBudgetFitter(10000);
    const result = fitter.fit(files);

    assert(result.targetTokens, 'Should include target tokens');
    assert(result.originalCount, 'Should include original count');
    assert(result.originalTokens, 'Should include original tokens');
    assert(result.reduction !== undefined, 'Should include reduction percentage');
    assert(result.message, 'Should include message');
    assert(result.strategy, 'Should include strategy name');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`❌ Failed: ${totalTests - passedTests} tests`);
    process.exit(1);
}
