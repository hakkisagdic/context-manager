#!/usr/bin/env node

/**
 * Unit Tests for Rule Tracer (v3.1.0)
 * Tests RuleTracer functionality
 */

import { RuleTracer } from '../index.js';

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

console.log('🧪 Testing Rule Tracer (v3.1.0)...\n');

// ============================================================================
// RULE TRACER INSTANTIATION
// ============================================================================
console.log('📦 RuleTracer Instantiation');
console.log('-'.repeat(60));

test('RuleTracer instance creation', () => {
    const tracer = new RuleTracer();
    assertTrue(tracer instanceof RuleTracer, 'Should create instance');
    assertFalse(tracer.isEnabled(), 'Should be disabled by default');
});

test('RuleTracer with options', () => {
    const tracer = new RuleTracer({ maxExamples: 10 });
    assertEquals(tracer.options.maxExamples, 10, 'Should set custom options');
});

test('RuleTracer has required methods', () => {
    const tracer = new RuleTracer();
    assertTrue(typeof tracer.enable === 'function', 'Should have enable method');
    assertTrue(typeof tracer.disable === 'function', 'Should have disable method');
    assertTrue(typeof tracer.recordFileDecision === 'function', 'Should have recordFileDecision method');
    assertTrue(typeof tracer.recordMethodDecision === 'function', 'Should have recordMethodDecision method');
    assertTrue(typeof tracer.getTrace === 'function', 'Should have getTrace method');
    assertTrue(typeof tracer.generateReport === 'function', 'Should have generateReport method');
});

// ============================================================================
// ENABLE/DISABLE
// ============================================================================
console.log('\n🔘 Enable/Disable');
console.log('-'.repeat(60));

test('Enable tracing', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    assertTrue(tracer.isEnabled(), 'Should be enabled');
});

test('Disable tracing', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    tracer.disable();
    assertFalse(tracer.isEnabled(), 'Should be disabled');
});

test('isEnabled returns correct state', () => {
    const tracer = new RuleTracer();
    assertFalse(tracer.isEnabled(), 'Should be disabled initially');
    tracer.enable();
    assertTrue(tracer.isEnabled(), 'Should be enabled after enable()');
    tracer.disable();
    assertFalse(tracer.isEnabled(), 'Should be disabled after disable()');
});

// ============================================================================
// FILE DECISION RECORDING
// ============================================================================
console.log('\n📁 File Decision Recording');
console.log('-'.repeat(60));

test('Record file decision when enabled', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Matched include pattern',
        rule: 'src/**/*.js',
        ruleSource: '.contextinclude'
    });
    
    const trace = tracer.getTrace();
    assertEquals(trace.files.size, 1, 'Should record one file decision');
});

test('Do not record when disabled', () => {
    const tracer = new RuleTracer();
    // Not enabled
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    const trace = tracer.getTrace();
    assertEquals(trace.files.size, 0, 'Should not record when disabled');
});

test('Record multiple file decisions', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Matched include pattern'
    });
    
    tracer.recordFileDecision('test/test.js', {
        included: false,
        reason: 'Matched exclude pattern'
    });
    
    const trace = tracer.getTrace();
    assertEquals(trace.files.size, 2, 'Should record multiple decisions');
});

test('Get specific file decision', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test reason',
        rule: 'src/**'
    });
    
    const decision = tracer.getFileDecision('src/index.js');
    assertTrue(decision !== null, 'Should find decision');
    assertEquals(decision.included, true, 'Should have correct included value');
    assertEquals(decision.reason, 'Test reason', 'Should have correct reason');
});

test('Get non-existent file decision returns null', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    const decision = tracer.getFileDecision('non-existent.js');
    assertEquals(decision, null, 'Should return null for non-existent file');
});

// ============================================================================
// METHOD DECISION RECORDING
// ============================================================================
console.log('\n🎯 Method Decision Recording');
console.log('-'.repeat(60));

test('Record method decision when enabled', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordMethodDecision('src/server.js', 'handleRequest', {
        included: true,
        reason: 'Matched method pattern',
        rule: '*Handler'
    });
    
    const trace = tracer.getTrace();
    assertTrue(trace.methods.size > 0, 'Should record method decision');
});

test('Record multiple methods for same file', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordMethodDecision('src/server.js', 'handleRequest', {
        included: true,
        reason: 'Matched pattern'
    });
    
    tracer.recordMethodDecision('src/server.js', 'processData', {
        included: true,
        reason: 'Matched pattern'
    });
    
    const methods = tracer.getMethodDecisions('src/server.js');
    assertEquals(methods.size, 2, 'Should record multiple methods');
});

test('Get method decisions for file', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordMethodDecision('src/api.js', 'getData', {
        included: true,
        reason: 'Test'
    });
    
    const methods = tracer.getMethodDecisions('src/api.js');
    assertTrue(methods !== null, 'Should find methods');
    assertTrue(methods.has('getData'), 'Should have recorded method');
});

test('Get method decisions for non-existent file returns null', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    const methods = tracer.getMethodDecisions('non-existent.js');
    assertEquals(methods, null, 'Should return null for non-existent file');
});

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================
console.log('\n🔍 Pattern Analysis');
console.log('-'.repeat(60));

test('Analyze patterns from decisions', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        rule: 'src/**/*.js',
        ruleSource: '.contextinclude'
    });
    
    tracer.recordFileDecision('src/server.js', {
        included: true,
        rule: 'src/**/*.js',
        ruleSource: '.contextinclude'
    });
    
    const trace = tracer.getTrace();
    const patterns = trace.patterns;
    
    assertTrue(patterns.length > 0, 'Should have pattern analysis');
    
    const pattern = patterns.find(p => p.pattern === 'src/**/*.js');
    assertTrue(pattern !== undefined, 'Should find pattern');
    assertEquals(pattern.matchCount, 2, 'Should count matches');
});

test('Pattern analysis includes examples', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/file1.js', {
        included: true,
        rule: 'src/**',
        ruleSource: '.contextinclude'
    });
    
    tracer.recordFileDecision('src/file2.js', {
        included: true,
        rule: 'src/**',
        ruleSource: '.contextinclude'
    });
    
    const trace = tracer.getTrace();
    const pattern = trace.patterns.find(p => p.pattern === 'src/**');
    
    assertTrue(pattern.examples.length > 0, 'Should have examples');
    assertTrue(pattern.examples.includes('src/file1.js'), 'Should include first file');
});

test('Pattern analysis limits examples', () => {
    const tracer = new RuleTracer({ maxExamples: 3 });
    tracer.enable();
    
    for (let i = 0; i < 10; i++) {
        tracer.recordFileDecision(`src/file${i}.js`, {
            included: true,
            rule: 'src/**',
            ruleSource: '.contextinclude'
        });
    }
    
    const trace = tracer.getTrace();
    const pattern = trace.patterns.find(p => p.pattern === 'src/**');
    
    assertTrue(pattern.examples.length <= 3, 'Should limit examples to maxExamples');
});

test('Get pattern statistics', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        rule: 'src/**',
        ruleSource: '.contextinclude'
    });
    
    const stats = tracer.getPatternStats('src/**');
    
    assertTrue(stats !== null, 'Should return stats');
    assertEquals(stats.pattern, 'src/**', 'Should have correct pattern');
    assertEquals(stats.matchCount, 1, 'Should have match count');
    assertTrue(Array.isArray(stats.examples), 'Should have examples array');
});

test('Get stats for non-existent pattern returns null', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    const stats = tracer.getPatternStats('non-existent/**');
    assertEquals(stats, null, 'Should return null for non-existent pattern');
});

// ============================================================================
// TRACE RESULTS
// ============================================================================
console.log('\n📊 Trace Results');
console.log('-'.repeat(60));

test('Get trace returns correct structure', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    const trace = tracer.getTrace();
    
    assertTrue(trace.files instanceof Map, 'Should have files Map');
    assertTrue(trace.methods instanceof Map, 'Should have methods Map');
    assertTrue(Array.isArray(trace.patterns), 'Should have patterns array');
    assertTrue(trace.summary, 'Should have summary');
});

test('Trace summary has correct fields', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    tracer.recordFileDecision('test/test.js', {
        included: false,
        reason: 'Test'
    });
    
    const trace = tracer.getTrace();
    const summary = trace.summary;
    
    assertEquals(summary.totalFiles, 2, 'Should count total files');
    assertEquals(summary.includedFiles, 1, 'Should count included files');
    assertEquals(summary.excludedFiles, 1, 'Should count excluded files');
    assertTrue(typeof summary.totalMethods === 'number', 'Should have totalMethods');
    assertTrue(typeof summary.includedMethods === 'number', 'Should have includedMethods');
    assertTrue(typeof summary.excludedMethods === 'number', 'Should have excludedMethods');
});

test('Trace summary counts methods correctly', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordMethodDecision('src/api.js', 'getData', {
        included: true,
        reason: 'Test'
    });
    
    tracer.recordMethodDecision('src/api.js', 'setData', {
        included: false,
        reason: 'Test'
    });
    
    const trace = tracer.getTrace();
    const summary = trace.summary;
    
    assertEquals(summary.totalMethods, 2, 'Should count total methods');
    assertEquals(summary.includedMethods, 1, 'Should count included methods');
    assertEquals(summary.excludedMethods, 1, 'Should count excluded methods');
});

// ============================================================================
// REPORT GENERATION
// ============================================================================
console.log('\n📝 Report Generation');
console.log('-'.repeat(60));

test('Generate report when enabled', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Matched pattern',
        rule: 'src/**'
    });
    
    const report = tracer.generateReport();
    
    assertTrue(typeof report === 'string', 'Should return string report');
    assertTrue(report.length > 0, 'Should have content');
    assertTrue(report.includes('RULE TRACE REPORT'), 'Should have header');
});

test('Generate report when disabled', () => {
    const tracer = new RuleTracer();
    // Not enabled
    
    const report = tracer.generateReport();
    
    assertTrue(report.includes('not enabled'), 'Should indicate tracing not enabled');
});

test('Report includes file decisions', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test reason'
    });
    
    const report = tracer.generateReport();
    
    assertTrue(report.includes('src/index.js'), 'Should include file name');
    assertTrue(report.includes('INCLUDED'), 'Should show inclusion status');
});

test('Report includes pattern analysis', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        rule: 'src/**',
        ruleSource: '.contextinclude'
    });
    
    const report = tracer.generateReport();
    
    assertTrue(report.includes('Pattern Analysis'), 'Should have pattern analysis section');
    assertTrue(report.includes('src/**'), 'Should include pattern');
});

test('Generate summary', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    const summary = tracer.generateSummary();
    
    assertTrue(typeof summary === 'string', 'Should return string');
    assertTrue(summary.includes('Rule Trace'), 'Should mention rule trace');
    assertTrue(summary.includes('files'), 'Should mention files');
});

// ============================================================================
// JSON EXPORT
// ============================================================================
console.log('\n💾 JSON Export');
console.log('-'.repeat(60));

test('Export trace as JSON', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    const json = tracer.exportJSON();
    
    assertTrue(typeof json === 'object', 'Should return object');
    assertTrue(json.summary, 'Should have summary');
    assertTrue(Array.isArray(json.files), 'Should have files array');
    assertTrue(Array.isArray(json.methods), 'Should have methods array');
    assertTrue(Array.isArray(json.patterns), 'Should have patterns array');
});

test('Exported JSON has correct structure', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test reason',
        rule: 'src/**'
    });
    
    const json = tracer.exportJSON();
    
    assertEquals(json.files.length, 1, 'Should have one file');
    
    const file = json.files[0];
    assertEquals(file.file, 'src/index.js', 'Should have file path');
    assertEquals(file.included, true, 'Should have included status');
    assertEquals(file.reason, 'Test reason', 'Should have reason');
});

// ============================================================================
// CLEAR TRACE DATA
// ============================================================================
console.log('\n🧹 Clear Trace Data');
console.log('-'.repeat(60));

test('Clear trace data', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test'
    });
    
    let trace = tracer.getTrace();
    assertEquals(trace.files.size, 1, 'Should have one file before clear');
    
    tracer.clear();
    
    trace = tracer.getTrace();
    assertEquals(trace.files.size, 0, 'Should have no files after clear');
});

test('Clear resets all data', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        rule: 'src/**'
    });
    
    tracer.recordMethodDecision('src/api.js', 'getData', {
        included: true,
        rule: '*Data'
    });
    
    tracer.clear();
    
    const trace = tracer.getTrace();
    assertEquals(trace.files.size, 0, 'Should clear files');
    assertEquals(trace.methods.size, 0, 'Should clear methods');
    assertEquals(trace.patterns.length, 0, 'Should clear patterns');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🔬 Edge Cases');
console.log('-'.repeat(60));

test('Handle decision without rule', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'No rule specified'
    });
    
    const trace = tracer.getTrace();
    assertEquals(trace.files.size, 1, 'Should record decision without rule');
});

test('Handle decision without ruleSource', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    tracer.recordFileDecision('src/index.js', {
        included: true,
        reason: 'Test',
        rule: 'src/**'
    });
    
    const trace = tracer.getTrace();
    const pattern = trace.patterns.find(p => p.pattern === 'src/**');
    assertTrue(pattern !== undefined, 'Should handle missing ruleSource');
});

test('Handle empty trace', () => {
    const tracer = new RuleTracer();
    tracer.enable();
    
    const trace = tracer.getTrace();
    
    assertEquals(trace.files.size, 0, 'Should handle empty trace');
    assertEquals(trace.summary.totalFiles, 0, 'Should have zero count');
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
