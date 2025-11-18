#!/usr/bin/env node

/**
 * Test Infrastructure Verification Script
 * Verifies that all test infrastructure components are properly set up
 */

import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const checks = [];

function check(name, condition, details = '') {
    checks.push({ name, passed: condition, details });
    const icon = condition ? '✓' : '✗';
    console.log(`${icon} ${name}`);
    if (details && !condition) {
        console.log(`  ${details}`);
    }
}

async function verifyInfrastructure() {
    console.log('🔍 Verifying Test Infrastructure...\n');
    
    // Check directory structure
    console.log('📁 Directory Structure:');
    check('test/unit/ exists', existsSync(join(__dirname, 'unit')));
    check('test/integration/ exists', existsSync(join(__dirname, 'integration')));
    check('test/property/ exists', existsSync(join(__dirname, 'property')));
    check('test/fixtures/generators/ exists', existsSync(join(__dirname, 'fixtures', 'generators')));
    check('test/helpers/ exists', existsSync(join(__dirname, 'helpers')));
    
    // Check generator files
    console.log('\n🔧 Generator Files:');
    check('file-generators.js exists', existsSync(join(__dirname, 'fixtures', 'generators', 'file-generators.js')));
    check('code-generators.js exists', existsSync(join(__dirname, 'fixtures', 'generators', 'code-generators.js')));
    check('config-generators.js exists', existsSync(join(__dirname, 'fixtures', 'generators', 'config-generators.js')));
    check('context-generators.js exists', existsSync(join(__dirname, 'fixtures', 'generators', 'context-generators.js')));
    
    // Check helper files
    console.log('\n🛠️  Helper Files:');
    check('test-runner.js exists', existsSync(join(__dirname, 'helpers', 'test-runner.js')));
    check('property-test-helpers.js exists', existsSync(join(__dirname, 'helpers', 'property-test-helpers.js')));
    
    // Check test runners
    console.log('\n🏃 Test Runners:');
    check('run-property-tests.js exists', existsSync(join(__dirname, 'run-property-tests.js')));
    check('run-integration-tests.js exists', existsSync(join(__dirname, 'run-integration-tests.js')));
    
    // Check documentation
    console.log('\n📚 Documentation:');
    check('TEST-INFRASTRUCTURE.md exists', existsSync(join(__dirname, 'TEST-INFRASTRUCTURE.md')));
    check('test/unit/README.md exists', existsSync(join(__dirname, 'unit', 'README.md')));
    check('test/integration/README.md exists', existsSync(join(__dirname, 'integration', 'README.md')));
    check('test/property/README.md exists', existsSync(join(__dirname, 'property', 'README.md')));
    
    // Check fast-check installation
    console.log('\n📦 Dependencies:');
    try {
        await import('fast-check');
        check('fast-check is installed', true);
    } catch (error) {
        check('fast-check is installed', false, 'Run: npm install');
    }
    
    // Summary
    const passed = checks.filter(c => c.passed).length;
    const total = checks.length;
    const failed = total - passed;
    
    console.log('\n' + '='.repeat(60));
    console.log('Infrastructure Verification Summary');
    console.log('='.repeat(60));
    console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\n⚠️  Some checks failed. Please review the output above.');
        process.exit(1);
    } else {
        console.log('\n✅ All infrastructure checks passed!');
        console.log('\nYou can now:');
        console.log('  - Run property tests: npm run test:property');
        console.log('  - Run integration tests: npm run test:integration');
        console.log('  - View documentation: test/TEST-INFRASTRUCTURE.md');
    }
    
    console.log('='.repeat(60) + '\n');
}

verifyInfrastructure().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
});
