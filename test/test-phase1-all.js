#!/usr/bin/env node

/**
 * Phase 1 Test Runner
 * Runs all Phase 1 Core Enhancements tests
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [
    'test-phase1-presets.js',
    'test-phase1-token-budget.js',
    'test-phase1-rule-tracer.js'
];

console.log('🧪 Running Phase 1 Core Enhancements Test Suite\n');
console.log('═'.repeat(70));

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let failedSuites = [];

for (const test of tests) {
    const testPath = join(__dirname, test);
    const testName = test.replace('test-phase1-', '').replace('.js', '');
    
    console.log(`\n📦 Running ${testName} tests...`);
    console.log('-'.repeat(70));
    
    try {
        const output = execSync(`node "${testPath}"`, {
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        
        // Parse output for test counts
        const passedMatch = output.match(/✅ Passed: (\d+)/);
        const failedMatch = output.match(/❌ Failed: (\d+)/);
        const totalMatch = output.match(/Total tests: (\d+)/);
        
        if (totalMatch) totalTests += parseInt(totalMatch[1], 10);
        if (passedMatch) totalPassed += parseInt(passedMatch[1], 10);
        if (failedMatch) totalFailed += parseInt(failedMatch[1], 10);
        
        // Show output
        console.log(output);
        
    } catch (error) {
        console.error(`❌ Test suite failed: ${testName}`);
        console.error(error.stdout || error.message);
        failedSuites.push(testName);
        
        // Try to parse counts from error output
        const output = error.stdout || '';
        const passedMatch = output.match(/✅ Passed: (\d+)/);
        const failedMatch = output.match(/❌ Failed: (\d+)/);
        const totalMatch = output.match(/Total tests: (\d+)/);
        
        if (totalMatch) totalTests += parseInt(totalMatch[1], 10);
        if (passedMatch) totalPassed += parseInt(passedMatch[1], 10);
        if (failedMatch) totalFailed += parseInt(failedMatch[1], 10);
    }
}

// Final summary
console.log('\n' + '═'.repeat(70));
console.log('📊 PHASE 1 TEST SUITE SUMMARY');
console.log('═'.repeat(70));
console.log(`\nTest Suites: ${tests.length}`);
console.log(`  ✅ Passed: ${tests.length - failedSuites.length}`);
console.log(`  ❌ Failed: ${failedSuites.length}`);

console.log(`\nTotal Tests: ${totalTests}`);
console.log(`  ✅ Passed: ${totalPassed}`);
console.log(`  ❌ Failed: ${totalFailed}`);
console.log(`  Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

if (failedSuites.length > 0) {
    console.log(`\n❌ Failed Suites:`);
    failedSuites.forEach(suite => {
        console.log(`  • ${suite}`);
    });
}

console.log('\n' + '═'.repeat(70));

if (failedSuites.length > 0 || totalFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All Phase 1 tests passed!');
    process.exit(0);
}
