/**
 * Test Runner Utilities
 * Provides common utilities for running tests
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Test result tracking
 */
export class TestRunner {
    constructor(suiteName) {
        this.suiteName = suiteName;
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
        this.startTime = Date.now();
    }

    /**
     * Run a test case
     */
    async test(name, fn) {
        try {
            await fn();
            this.passed++;
            console.log(`✓ ${name}`);
        } catch (error) {
            this.failed++;
            this.errors.push({ name, error });
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}`);
        }
    }

    /**
     * Print test summary
     */
    summary() {
        const duration = Date.now() - this.startTime;
        const total = this.passed + this.failed;
        
        console.log('\n' + '='.repeat(60));
        console.log(`Test Suite: ${this.suiteName}`);
        console.log('='.repeat(60));
        console.log(`Total: ${total} | Passed: ${this.passed} | Failed: ${this.failed}`);
        console.log(`Duration: ${duration}ms`);
        
        if (this.failed > 0) {
            console.log('\nFailed Tests:');
            this.errors.forEach(({ name, error }) => {
                console.log(`  - ${name}`);
                console.log(`    ${error.message}`);
            });
        }
        
        console.log('='.repeat(60) + '\n');
        
        return this.failed === 0;
    }
}

/**
 * Simple assertion utilities
 */
export const assert = {
    equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    },
    
    deepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr !== expectedStr) {
            throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
        }
    },
    
    ok(value, message = '') {
        if (!value) {
            throw new Error(message || `Expected truthy value, got ${value}`);
        }
    },
    
    throws(fn, message = '') {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (error) {
            if (error.message === message || error.message.includes('Expected function to throw')) {
                throw error;
            }
        }
    }
};
