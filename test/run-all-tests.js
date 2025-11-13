#!/usr/bin/env node

/**
 * Master Test Runner
 * Runs all test suites and generates comprehensive report
 */

import { execSync } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testSuites = [
    { name: 'Basic Functionality', file: 'test.js', critical: true },
    { name: 'Unit Tests', file: 'unit-tests.js', critical: true },
    { name: 'Utility Tests', file: 'test-utils-comprehensive.js', critical: true },
    { name: 'v2.3.x Features', file: 'test-v2.3-features.js', critical: true },
    { name: 'Core Modules', file: 'test-core-modules.js', critical: true },
    { name: 'Additional Utils', file: 'test-additional-utils.js', critical: false }
];

const results = [];
let totalPassed = 0;
let totalFailed = 0;

console.log('🚀 CONTEXT MANAGER - COMPREHENSIVE TEST SUITE');
console.log('='.repeat(80));
console.log(`Testing v2.3.5 - Phase 1 Complete\n`);

for (const suite of testSuites) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📋 Running: ${suite.name}`);
    console.log('═'.repeat(80));

    try {
        const output = execSync(`node ${path.join(__dirname, suite.file)}`, {
            encoding: 'utf8',
            stdio: 'inherit',
            timeout: 30000
        });

        results.push({
            name: suite.name,
            status: 'PASSED',
            critical: suite.critical
        });
        totalPassed++;
    } catch (error) {
        results.push({
            name: suite.name,
            status: 'FAILED',
            critical: suite.critical,
            error: error.message
        });
        totalFailed++;

        if (suite.critical) {
            console.error(`\n❌ CRITICAL TEST FAILED: ${suite.name}`);
        }
    }
}

// ============================================================================
// FINAL REPORT
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('📊 FINAL TEST REPORT');
console.log('='.repeat(80));

console.log('\n🔍 Test Suite Results:\n');
for (const result of results) {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`${status} ${result.name}${critical}`);
    if (result.error) {
        console.log(`   Error: ${result.error}`);
    }
}

console.log('\n📈 Summary:');
console.log(`   Total Suites: ${testSuites.length}`);
console.log(`   ✅ Passed: ${totalPassed}`);
console.log(`   ❌ Failed: ${totalFailed}`);
console.log(`   Success Rate: ${((totalPassed / testSuites.length) * 100).toFixed(1)}%`);

const criticalFailed = results.filter(r => r.status === 'FAILED' && r.critical).length;

if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! v2.3.5 is ready for release!');
    process.exit(0);
} else if (criticalFailed > 0) {
    console.log(`\n⚠️  ${criticalFailed} CRITICAL test suite(s) failed!`);
    console.log('   Please fix critical failures before release.');
    process.exit(1);
} else {
    console.log(`\n⚠️  ${totalFailed} non-critical test suite(s) failed.`);
    console.log('   Review failures but release may proceed.');
    process.exit(0);
}
