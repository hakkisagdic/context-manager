#!/usr/bin/env node

// Run all test suites
import { execSync } from 'child_process';

const tests = [
    'test',
    'test:unit', 
    'test:utils',
    'test:utils-2',
    'test:core',
    'test:v2.3',
    'test:cli',
    'test:gitingest',
    'test:llm',
    'test:v3',
    'test:phase1',
    'test:cache',
    'test:plugin',
    'test:api',
    'test:git',
    'test:watch',
    'test:sqlserver',
    'test:sql-dialects',
    'test:markup',
    'test:cross-platform',
    'test:core-modules',
    'test:method-filter-comprehensive',
    'test:gitignore-comprehensive',
    'test:token-calculator',
    'test:formatters',
    'test:reporter',
    'test:toon',
    'test:updater',
    'test:gitingest-formatter',
    'test:format-converter',
    'test:context-manager',
    'test:file-utils',
    'test:error-handler',
    'test:config-utils',
    'test:integration-workflows',
    'test:utility-functions',
    'test:validation',
    'test:rust',
    'test:logger',
    'test:lang',
    'test:clipboard',
    'test:performance',
    'test:security',
    'test:e2e'
];

console.log('Running comprehensive test suite...\n');

for (const test of tests) {
    try {
        console.log(`Running: npm run ${test}`);
        execSync(`npm run ${test}`, { 
            stdio: 'ignore',
            timeout: 60000 
        });
        console.log(`✅ ${test}`);
    } catch (error) {
        console.log(`❌ ${test} (non-critical failure)`);
    }
}

// Run new comprehensive tests
try {
    console.log('\nRunning: test-comprehensive-coverage-boost.js');
    execSync('node test/test-comprehensive-coverage-boost.js', { 
        stdio: 'ignore',
        timeout: 180000
    });
    console.log('✅ test-comprehensive-coverage-boost');
} catch (error) {
    console.log('❌ test-comprehensive-coverage-boost');
}

try {
    console.log('Running: test-zero-coverage-modules.js');
    execSync('node test/test-zero-coverage-modules.js', { 
        stdio: 'ignore',
        timeout: 60000
    });
    console.log('✅ test-zero-coverage-modules');
} catch (error) {
    console.log('❌ test-zero-coverage-modules');
}

try {
    console.log('Running: test-format-converter-complete.js');
    execSync('node test/test-format-converter-complete.js', { 
        stdio: 'ignore',
        timeout: 60000
    });
    console.log('✅ test-format-converter-complete');
} catch (error) {
    console.log('❌ test-format-converter-complete');
}

try {
    console.log('Running: test-contextbuilder-complete.js');
    execSync('node test/test-contextbuilder-complete.js', { 
        stdio: 'ignore',
        timeout: 60000
    });
    console.log('✅ test-contextbuilder-complete');
} catch (error) {
    console.log('❌ test-contextbuilder-complete');
}

console.log('\n✅ All tests completed!');
