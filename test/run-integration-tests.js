#!/usr/bin/env node

/**
 * Integration Test Runner
 * Runs all integration tests
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INTEGRATION_TEST_DIR = join(__dirname, 'integration');

async function runIntegrationTests() {
    console.log('🔗 Running Integration Tests...\n');
    
    let totalPassed = 0;
    let totalFailed = 0;
    const startTime = Date.now();
    
    try {
        const files = await readdir(INTEGRATION_TEST_DIR);
        const testFiles = files.filter(f => f.endsWith('.test.js') || f.endsWith('.integration.js'));
        
        if (testFiles.length === 0) {
            console.log('⚠️  No integration test files found in test/integration/');
            console.log('   Integration tests should be named *.test.js or *.integration.js');
            return;
        }
        
        for (const file of testFiles) {
            console.log(`\n📋 Running ${file}...`);
            console.log('─'.repeat(60));
            
            try {
                const testModule = await import(join(INTEGRATION_TEST_DIR, file));
                
                if (typeof testModule.default === 'function') {
                    await testModule.default();
                    totalPassed++;
                    console.log(`✓ ${file} passed`);
                } else {
                    console.log(`⚠️  ${file} has no default export function`);
                }
            } catch (error) {
                totalFailed++;
                console.error(`✗ ${file} failed:`);
                console.error(error.message);
            }
        }
    } catch (error) {
        console.error('Error reading integration test directory:', error);
        process.exit(1);
    }
    
    const duration = Date.now() - startTime;
    const total = totalPassed + totalFailed;
    
    console.log('\n' + '='.repeat(60));
    console.log('Integration Test Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${total} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    if (totalFailed > 0) {
        process.exit(1);
    }
}

runIntegrationTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
