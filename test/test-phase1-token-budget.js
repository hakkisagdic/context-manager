#!/usr/bin/env node

/**
 * Unit Tests for Token Budget Fitter (v3.1.0)
 * Tests TokenBudgetFitter and FitStrategies functionality
 */

import { TokenBudgetFitter, FitStrategies, TokenBudgetError, ImpossibleFitError } from '../index.js';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        return false;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message);
    }
}

function assertThrows(fn, errorType, message) {
    try {
        fn();
        throw new Error(`${message}: Expected error to be thrown`);
    } catch (error) {
        if (errorType && !(error instanceof errorType)) {
            throw new Error(`${message}: Expected ${errorType.name}, got ${error.constructor.name}`);
        }
    }
}

// Helper to create mock files
function createMockFiles(count, tokensPerFile = 1000) {
    const files = [];
    for (let i = 0; i < count; i++) {
        files.push({
            path: `/test/file${i}.js`,
            relativePath: `file${i}.js`,
            name: `file${i}.js`,
            extension: '.js',
            tokens: tokensPerFile,
            size: tokensPerFile * 4,
            lines: tokensPerFile / 10
        });
    }
    return files;
}

console.log('🧪 Testing Token Budget Fitter (v3.1.0)...\n');

// ============================================================================
// TOKEN BUDGET FITTER INSTANTIATION
// ============================================================================
console.log('📦 TokenBudgetFitter Instantiation');
console.log('-'.repeat(60));

test('TokenBudgetFitter instance creation', () => {
    const fitter = new TokenBudgetFitter(100000, 'auto');
    assertTrue(fitter instanceof TokenBudgetFitter, 'Should create instance');
    assertEquals(fitter.targetTokens, 100000, 'Should set target tokens');
    assertEquals(fitter.strategy, 'auto', 'Should set strategy');
});

test('TokenBudgetFitter with default strategy', () => {
    const fitter = new TokenBudgetFitter(100000);
    assertEquals(fitter.strategy, 'auto', 'Should default to auto strategy');
});

test('TokenBudgetFitter has required methods', () => {
    const fitter = new TokenBudgetFitter(100000);
    assertTrue(typeof fitter.fitToWindow === 'function', 'Should have fitToWindow method');
    assertTrue(typeof fitter.calculateImportance === 'function', 'Should have calculateImportance method');
    assertTrue(typeof fitter.checkFit === 'function', 'Should have checkFit method');
    assertTrue(typeof fitter.recommendStrategy === 'function', 'Should have recommendStrategy method');
    assertTrue(typeof fitter.generateReport === 'function', 'Should have generateReport method');
});

// ============================================================================
// FIT TO WINDOW
// ============================================================================
console.log('\n🎯 Fit To Window');
console.log('-'.repeat(60));

test('Fit files already within budget', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(50, 1000); // 50k tokens total
    
    const result = fitter.fitToWindow(files);
    
    assertEquals(result.files.length, 50, 'Should include all files');
    assertEquals(result.totalTokens, 50000, 'Should have correct token count');
    assertEquals(result.reduction, 0, 'Should have no reduction');
    assertEquals(result.strategy, 'none', 'Should use no strategy');
});

test('Fit files over budget', () => {
    const fitter = new TokenBudgetFitter(50000);
    const files = createMockFiles(100, 1000); // 100k tokens total
    
    const result = fitter.fitToWindow(files);
    
    assertTrue(result.totalTokens <= 50000, 'Should fit within budget');
    assertTrue(result.files.length < 100, 'Should exclude some files');
    assertTrue(result.reduction > 0, 'Should have reduction');
    assertTrue(result.excluded.length > 0, 'Should have excluded files');
});

test('Fit result has correct structure', () => {
    const fitter = new TokenBudgetFitter(50000);
    const files = createMockFiles(100, 1000);
    
    const result = fitter.fitToWindow(files);
    
    assertTrue(Array.isArray(result.files), 'Should have files array');
    assertTrue(typeof result.totalTokens === 'number', 'Should have totalTokens');
    assertTrue(typeof result.originalTokens === 'number', 'Should have originalTokens');
    assertTrue(typeof result.reduction === 'number', 'Should have reduction');
    assertTrue(typeof result.reductionPercent === 'number', 'Should have reductionPercent');
    assertTrue(typeof result.strategy === 'string', 'Should have strategy');
    assertTrue(Array.isArray(result.excluded), 'Should have excluded array');
    assertTrue(result.metadata, 'Should have metadata');
});

test('Fit result metadata has correct fields', () => {
    const fitter = new TokenBudgetFitter(50000);
    const files = createMockFiles(100, 1000);
    
    const result = fitter.fitToWindow(files);
    
    assertTrue(typeof result.metadata.entryPointsPreserved === 'number', 'Should have entryPointsPreserved');
    assertTrue(typeof result.metadata.filesIncluded === 'number', 'Should have filesIncluded');
    assertTrue(typeof result.metadata.filesExcluded === 'number', 'Should have filesExcluded');
    assertTrue(typeof result.metadata.averageImportance === 'number', 'Should have averageImportance');
});

// ============================================================================
// IMPORTANCE SCORING
// ============================================================================
console.log('\n⭐ Importance Scoring');
console.log('-'.repeat(60));

test('Calculate importance for regular file', () => {
    const fitter = new TokenBudgetFitter(100000);
    const file = {
        relativePath: 'lib/utils/helper.js',
        extension: '.js'
    };
    
    const importance = fitter.calculateImportance(file);
    
    assertTrue(importance >= 0 && importance <= 100, 'Should be between 0 and 100');
    assertTrue(importance > 40, 'Should have reasonable importance');
});

test('Entry point has high importance', () => {
    const fitter = new TokenBudgetFitter(100000);
    const entryPoint = {
        relativePath: 'index.js',
        extension: '.js',
        isEntryPoint: true
    };
    const regularFile = {
        relativePath: 'lib/utils/helper.js',
        extension: '.js',
        isEntryPoint: false
    };
    
    const entryImportance = fitter.calculateImportance(entryPoint);
    const regularImportance = fitter.calculateImportance(regularFile);
    
    assertTrue(entryImportance > regularImportance, 'Entry point should have higher importance');
    assertTrue(entryImportance >= 80, 'Entry point should have high score');
});

test('Core directory files have higher importance', () => {
    const fitter = new TokenBudgetFitter(100000);
    const coreFile = {
        relativePath: 'src/core/api.js',
        extension: '.js'
    };
    const utilFile = {
        relativePath: 'src/utils/helper.js',
        extension: '.js'
    };
    
    const coreImportance = fitter.calculateImportance(coreFile);
    const utilImportance = fitter.calculateImportance(utilFile);
    
    assertTrue(coreImportance > utilImportance, 'Core file should have higher importance');
});

test('Test files have lower importance', () => {
    const fitter = new TokenBudgetFitter(100000);
    const testFile = {
        relativePath: 'test/unit/api.test.js',
        extension: '.js'
    };
    const srcFile = {
        relativePath: 'src/api.js',
        extension: '.js'
    };
    
    const testImportance = fitter.calculateImportance(testFile);
    const srcImportance = fitter.calculateImportance(srcFile);
    
    assertTrue(testImportance < srcImportance, 'Test file should have lower importance');
});

test('Priority patterns increase importance', () => {
    const fitter = new TokenBudgetFitter(100000);
    const file = {
        relativePath: 'src/api/handler.js',
        extension: '.js'
    };
    
    const normalImportance = fitter.calculateImportance(file);
    const priorityImportance = fitter.calculateImportance(file, {
        priorityPatterns: ['src/api/**']
    });
    
    assertTrue(priorityImportance > normalImportance, 'Priority pattern should increase importance');
});

// ============================================================================
// STRATEGY RECOMMENDATION
// ============================================================================
console.log('\n💡 Strategy Recommendation');
console.log('-'.repeat(60));

test('Recommend shrink-docs for lots of documentation', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = [
        ...createMockFiles(50, 1000), // 50k code
        ...createMockFiles(60, 1000).map(f => ({ ...f, relativePath: `docs/${f.relativePath}` })) // 60k docs
    ];
    
    const strategy = fitter.recommendStrategy(files, 100000);
    assertEquals(strategy, 'shrink-docs', 'Should recommend shrink-docs');
});

test('Recommend balanced for moderate overage', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(130, 1000); // 130k tokens (30% over)
    
    const strategy = fitter.recommendStrategy(files, 100000);
    assertEquals(strategy, 'balanced', 'Should recommend balanced');
});

test('Recommend methods-only for significant overage', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(160, 1000); // 160k tokens (60% over)
    
    const strategy = fitter.recommendStrategy(files, 100000);
    assertEquals(strategy, 'methods-only', 'Should recommend methods-only');
});

test('Recommend top-n for extreme overage', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(200, 1000); // 200k tokens (100% over)
    
    const strategy = fitter.recommendStrategy(files, 100000);
    assertEquals(strategy, 'top-n', 'Should recommend top-n');
});

// ============================================================================
// FIT STRATEGIES
// ============================================================================
console.log('\n🎲 Fit Strategies');
console.log('-'.repeat(60));

test('Auto strategy selects appropriate strategy', () => {
    const files = createMockFiles(150, 1000); // 150k tokens
    const result = FitStrategies.auto(files, 100000);
    
    assertTrue(Array.isArray(result.files), 'Should return files array');
    assertTrue(Array.isArray(result.excluded), 'Should return excluded array');
    
    const totalTokens = result.files.reduce((sum, f) => sum + f.tokens, 0);
    assertTrue(totalTokens <= 100000, 'Should fit within budget');
});

test('Shrink-docs strategy removes documentation', () => {
    const codeFiles = createMockFiles(50, 1000);
    const docFiles = createMockFiles(60, 1000).map(f => ({ 
        ...f, 
        relativePath: `docs/${f.relativePath}`,
        extension: '.md'
    }));
    const files = [...codeFiles, ...docFiles];
    
    const result = FitStrategies.shrinkDocs(files, 100000);
    
    const totalTokens = result.files.reduce((sum, f) => sum + f.tokens, 0);
    assertTrue(totalTokens <= 100000, 'Should fit within budget');
    
    // Should prefer code files over docs
    const codeCount = result.files.filter(f => f.extension === '.js').length;
    const docCount = result.files.filter(f => f.extension === '.md').length;
    assertTrue(codeCount >= docCount, 'Should prefer code files');
});

test('Methods-only strategy marks files for method extraction', () => {
    const files = createMockFiles(150, 1000);
    const result = FitStrategies.methodsOnly(files, 100000);
    
    const totalTokens = result.files.reduce((sum, f) => sum + f.tokens, 0);
    assertTrue(totalTokens <= 100000, 'Should fit within budget');
    
    // Check if files are marked for method extraction
    const hasMethodsOnly = result.files.some(f => f.methodsOnly === true);
    assertTrue(hasMethodsOnly, 'Should mark files for method extraction');
});

test('Top-n strategy selects most important files', () => {
    const files = createMockFiles(150, 1000);
    // Mark some files as entry points
    files[0].isEntryPoint = true;
    files[0].importance = 95;
    files[1].importance = 90;
    files[2].importance = 85;
    
    const result = FitStrategies.topN(files, 100000);
    
    const totalTokens = result.files.reduce((sum, f) => sum + f.tokens, 0);
    assertTrue(totalTokens <= 100000, 'Should fit within budget');
    
    // Entry point should be included
    const hasEntryPoint = result.files.some(f => f.isEntryPoint);
    assertTrue(hasEntryPoint, 'Should include entry point');
});

test('Balanced strategy optimizes efficiency', () => {
    const files = createMockFiles(150, 1000);
    const result = FitStrategies.balanced(files, 100000);
    
    const totalTokens = result.files.reduce((sum, f) => sum + f.tokens, 0);
    assertTrue(totalTokens <= 100000, 'Should fit within budget');
    assertTrue(result.files.length > 0, 'Should include some files');
});

// ============================================================================
// FIT REPORT GENERATION
// ============================================================================
console.log('\n📊 Fit Report Generation');
console.log('-'.repeat(60));

test('Generate fit report', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(150, 1000);
    const result = fitter.fitToWindow(files);
    
    const report = fitter.generateReport(result);
    
    assertTrue(report.summary, 'Should have summary');
    assertTrue(report.details, 'Should have details');
    assertTrue(typeof report.summary === 'string', 'Summary should be string');
    assertTrue(typeof report.details === 'object', 'Details should be object');
});

test('Fit report details have correct fields', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(150, 1000);
    const result = fitter.fitToWindow(files);
    
    const report = fitter.generateReport(result);
    
    assertTrue(report.details.strategy, 'Should have strategy');
    assertTrue(typeof report.details.targetTokens === 'number', 'Should have targetTokens');
    assertTrue(typeof report.details.actualTokens === 'number', 'Should have actualTokens');
    assertTrue(report.details.fit, 'Should have fit quality');
});

test('Fit report includes recommendations', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(150, 1000);
    const result = fitter.fitToWindow(files);
    
    const report = fitter.generateReport(result);
    
    assertTrue(Array.isArray(report.recommendations), 'Should have recommendations array');
});

// ============================================================================
// CHECK FIT
// ============================================================================
console.log('\n✅ Check Fit');
console.log('-'.repeat(60));

test('Check fit returns true when within budget', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(50, 1000); // 50k tokens
    
    const fits = fitter.checkFit(files);
    assertTrue(fits, 'Should return true when within budget');
});

test('Check fit returns false when over budget', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(150, 1000); // 150k tokens
    
    const fits = fitter.checkFit(files);
    assertFalse(fits, 'Should return false when over budget');
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
console.log('\n❌ Error Handling');
console.log('-'.repeat(60));

test('TokenBudgetError has correct properties', () => {
    const error = new TokenBudgetError('Test error');
    assertEquals(error.name, 'TokenBudgetError', 'Should have correct name');
    assertTrue(error.message.includes('Test error'), 'Should have correct message');
});

test('ImpossibleFitError has correct properties', () => {
    const error = new ImpossibleFitError(10000, 50000);
    assertEquals(error.name, 'ImpossibleFitError', 'Should have correct name');
    assertEquals(error.targetTokens, 10000, 'Should store target tokens');
    assertEquals(error.minTokens, 50000, 'Should store min tokens');
    assertTrue(error.message.includes('10000'), 'Should include target in message');
    assertTrue(error.message.includes('50000'), 'Should include min in message');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🔬 Edge Cases');
console.log('-'.repeat(60));

test('Handle empty file list', () => {
    const fitter = new TokenBudgetFitter(100000);
    const result = fitter.fitToWindow([]);
    
    assertEquals(result.files.length, 0, 'Should handle empty list');
    assertEquals(result.totalTokens, 0, 'Should have zero tokens');
});

test('Handle single file', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(1, 50000);
    
    const result = fitter.fitToWindow(files);
    
    assertEquals(result.files.length, 1, 'Should include single file');
    assertEquals(result.totalTokens, 50000, 'Should have correct tokens');
});

test('Handle files with zero tokens', () => {
    const fitter = new TokenBudgetFitter(100000);
    const files = createMockFiles(10, 0);
    
    const result = fitter.fitToWindow(files);
    
    assertEquals(result.totalTokens, 0, 'Should handle zero tokens');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`Total tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
