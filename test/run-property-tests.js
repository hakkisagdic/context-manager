#!/usr/bin/env node

/**
 * Property-Based Test Runner
 * Runs all property-based tests using fast-check
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROPERTY_TEST_DIR = join(__dirname, 'property');

async function runPropertyTests() {
    console.log('🔍 Running Property-Based Tests...\n');
    
    let totalPassed = 0;
    let totalFailed = 0;
    const startTime = Date.now();
    
    try {
        const files = await readdir(PROPERTY_TEST_DIR);
        const testFiles = files.filter(f => f.endsWith('.property.js'));
        
        if (testFiles.length === 0) {
            console.log('⚠️  No property test files found in test/property/');
            console.log('   Property tests should be named *.property.js');
            return;
        }
        
        for (const file of testFiles) {
            console.log(`\n📋 Running ${file}...`);
            console.log('─'.repeat(60));
            
            try {
                const testModule = await import(join(PROPERTY_TEST_DIR, file));
                
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
                if (error.stack) {
                    console.error(error.stack);
                }
            }
        }
    } catch (error) {
        console.error('Error reading property test directory:', error);
        process.exit(1);
    }
    
    const duration = Date.now() - startTime;
    const total = totalPassed + totalFailed;
    
    console.log('\n' + '='.repeat(60));
    console.log('Property-Based Test Summary');
    console.log('='.repeat(60));
    console.log(`Total: ${total} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
    console.log(`Duration: ${duration}ms`);
    console.log('='.repeat(60) + '\n');
    
    if (totalFailed > 0) {
        process.exit(1);
    }
}

runPropertyTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
