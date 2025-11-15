#!/usr/bin/env node

import { execSync } from 'child_process';

const tests = [
    'test',
    'test:unit',
    'test:utils',
    'test:v3',
    'test:phase1',
];

console.log('Running quick coverage check...\n');

for (const test of tests) {
    try {
        execSync(`npm run ${test}`, { stdio: 'ignore', timeout: 30000 });
        console.log(`✅ ${test}`);
    } catch (error) {
        console.log(`❌ ${test}`);
    }
}

// Run new tests
try {
    execSync('node test/test-comprehensive-coverage-boost.js', { stdio: 'ignore', timeout: 60000 });
    console.log('✅ test-comprehensive-coverage-boost');
} catch (error) {
    console.log('❌ test-comprehensive-coverage-boost');
}

try {
    execSync('node test/test-phase2-coverage-boost.js', { stdio: 'ignore', timeout: 30000 });
    console.log('✅ test-phase2-coverage-boost');
} catch (error) {
    console.log('❌ test-phase2-coverage-boost');
}

console.log('\n✅ Quick coverage check completed!');
