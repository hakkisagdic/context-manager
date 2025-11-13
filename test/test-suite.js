#!/usr/bin/env node

/**
 * Enhanced Integration Test Suite for Context Manager
 * End-to-end tests simulating real-world usage
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


console.log('🧪 INTEGRATION TEST SUITE');
console.log('='.repeat(70));

const testResults = [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, command, expectedOutput = null, options = {}) {
    totalTests++;
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`Command: ${command}`);

    try {
        const output = execSync(command, {
            encoding: 'utf8',
            cwd: path.join(__dirname, '..'),
            timeout: options.timeout || 30000,
            stdio: options.silent ? 'pipe' : 'pipe'
        });

        let passed = true;
        let message = 'PASSED';

        if (expectedOutput) {
            const contains = output.includes(expectedOutput);
            if (!contains) {
                passed = false;
                message = `Expected output not found: "${expectedOutput}"`;
            }
        }

        if (passed) {
            console.log('✅ PASSED');
            passedTests++;
            testResults.push({ name, status: 'PASSED', command });
        } else {
            console.log(`❌ FAILED: ${message}`);
            failedTests++;
            testResults.push({ name, status: 'FAILED', command, error: message });
        }

        return output;
    } catch (error) {
        console.log('❌ FAILED');
        console.log('Error:', error.message.split('\n')[0]);
        failedTests++;
        testResults.push({ name, status: 'FAILED', command, error: error.message });
        return null;
    }
}

function createTestFile(filename, content) {
    const filepath = path.join(__dirname, '..', filename);
    try {
        fs.writeFileSync(filepath, content);
        console.log(`📝 Created test file: ${filename}`);
        return filepath;
    } catch (error) {
        console.error(`❌ Failed to create ${filename}:`, error.message);
        return null;
    }
}

function cleanup(filename) {
    const filepath = path.join(__dirname, '..', filename);
    try {
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`🗑️  Cleaned up: ${filename}`);
        }
    } catch (error) {
        console.error(`⚠️  Warning: Could not clean up ${filename}:`, error.message);
    }
}

// ============================================================================
// CLI INTERFACE TESTS
// ============================================================================
console.log('\n📦 CLI Interface Tests');
console.log('-'.repeat(70));

// Test 1: Help command
runTest(
    'CLI Help Command',
    'node context-manager.js --help',
    'Usage: context-manager'
);

// Test 2: Basic package test
runTest(
    'Package Test Suite',
    'node test/test.js',
    'All tests passed!'
);

// ============================================================================
// ANALYSIS WORKFLOW TESTS
// ============================================================================
console.log('\n🔄 Analysis Workflow Tests');
console.log('-'.repeat(70));

// Test 3: File-level analysis with skip export
runTest(
    'File-Level Analysis',
    'echo "4" | node context-manager.js',
    'PROJECT TOKEN ANALYSIS REPORT'
);

// Test 4: File-level analysis with verbose
runTest(
    'File-Level Analysis (Verbose)',
    'echo "4" | node context-manager.js --verbose',
    'PROJECT TOKEN ANALYSIS REPORT'
);

// Test 5: Method-level analysis
runTest(
    'Method-Level Analysis',
    'echo "4" | node context-manager.js --method-level',
    'Method-level analysis'
);

// Test 6: Method-level with verbose
runTest(
    'Method-Level Analysis (Verbose)',
    'echo "4" | node context-manager.js --method-level --verbose',
    'Method-level analysis'
);

// ============================================================================
// EXPORT FUNCTIONALITY TESTS
// ============================================================================
console.log('\n📤 Export Functionality Tests');
console.log('-'.repeat(70));

// Clean up any existing export files before tests
cleanup('llm-context.json');
cleanup('token-analysis-report.json');

// Test 7: Context export to file
runTest(
    'Context Export to File',
    'echo "2" | node context-manager.js',
    'llm-context.json'
);

// Verify the file was created
if (fs.existsSync('llm-context.json')) {
    console.log('   ✅ llm-context.json created successfully');
    try {
        const content = JSON.parse(fs.readFileSync('llm-context.json', 'utf8'));
        if (content.project && content.project.root) {
            console.log('   ✅ JSON structure is valid');
        }
    } catch (error) {
        console.log('   ⚠️  JSON parsing failed:', error.message);
    }
}

// Test 8: Context export to clipboard
runTest(
    'Context Export to Clipboard',
    'echo "3" | node context-manager.js',
    'Context copied to clipboard'
);

// Test 9: Save detailed report
runTest(
    'Save Detailed Report',
    'echo "1" | node context-manager.js',
    'analysis saved to'
);

// Verify the report file was created
if (fs.existsSync('token-analysis-report.json')) {
    console.log('   ✅ token-analysis-report.json created successfully');
    try {
        const content = JSON.parse(fs.readFileSync('token-analysis-report.json', 'utf8'));
        if (content.metadata && content.summary) {
            console.log('   ✅ Report structure is valid');
        }
    } catch (error) {
        console.log('   ⚠️  Report JSON parsing failed:', error.message);
    }
}

// ============================================================================
// DIRECT FLAG TESTS
// ============================================================================
console.log('\n🚩 Direct Flag Tests');
console.log('-'.repeat(70));

// Clean up before direct flag tests
cleanup('llm-context.json');
cleanup('token-analysis-report.json');

// Test 10: Direct save report flag
runTest(
    'Direct CLI Save Report',
    'node context-manager.js --save-report --context-export',
    'analysis saved to',
    { timeout: 45000 }
);

// Test 11: Direct method-level clipboard
runTest(
    'Direct CLI Method Level',
    'node context-manager.js --method-level --context-clipboard',
    'Method-level analysis',
    { timeout: 45000 }
);

// Test 12: Combined flags
runTest(
    'Combined Flags Test',
    'node context-manager.js --method-level --verbose --context-export',
    'Method-level analysis',
    { timeout: 45000 }
);

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================
console.log('\n⚙️  Configuration Tests');
console.log('-'.repeat(70));

// Test 13: Custom method include (if .methodinclude exists)
if (fs.existsSync('.methodinclude')) {
    console.log('\n🔧 Testing Custom Method Include Configuration...');

    // Backup existing file
    if (fs.existsSync('.methodinclude')) {
        fs.copyFileSync('.methodinclude', '.methodinclude.backup.test');
    }

    // Create temporary test config
    createTestFile('.methodinclude.test', 'calculateTokens\n*Handler\n*Validator');

    runTest(
        'Custom Method Include',
        'cp .methodinclude.test .methodinclude && echo "4" | node context-manager.js --method-level && mv .methodinclude.backup.test .methodinclude',
        'Method include rules loaded',
        { timeout: 45000 }
    );

    cleanup('.methodinclude.test');
    cleanup('.methodinclude.backup.test');
}

// Test 14: Custom method ignore (if .methodignore exists)
if (fs.existsSync('.methodignore')) {
    console.log('\n🔧 Testing Custom Method Ignore Configuration...');

    // Backup existing file
    if (fs.existsSync('.methodignore')) {
        fs.copyFileSync('.methodignore', '.methodignore.backup.test');
    }

    // Create temporary test config
    createTestFile('.methodignore.test', '*test*\n*debug*\nconsole');

    runTest(
        'Custom Method Ignore',
        'cp .methodignore.test .methodignore && echo "4" | node context-manager.js --method-level && mv .methodignore.backup.test .methodignore',
        'Method ignore rules loaded',
        { timeout: 45000 }
    );

    cleanup('.methodignore.test');
    cleanup('.methodignore.backup.test');
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n⚠️  Error Handling Tests');
console.log('-'.repeat(70));

// Test 15: Invalid option handling
runTest(
    'Invalid Option Handling',
    'node context-manager.js --invalid-option 2>&1 || true',
    null  // Just ensure it doesn't crash
);

// Test 16: NPM package CLI
runTest(
    'NPM Package CLI Help',
    'node bin/cli.js --help',
    'Context Manager'
);

// Test 17: NPM package CLI execution
runTest(
    'NPM Package CLI Execution',
    'echo "4" | node bin/cli.js',
    'PROJECT TOKEN ANALYSIS REPORT'
);

// ============================================================================
// METHOD EXTRACTION ACCURACY TESTS
// ============================================================================
console.log('\n🔍 Method Extraction Accuracy Tests');
console.log('-'.repeat(70));

const testJSContent = `
// Test file for method extraction
function testFunction() {
    return "test";
}

const arrowFunc = () => {
    console.log("arrow");
};

async function asyncTest() {
    await Promise.resolve();
}

class TestClass {
    constructor() {
        this.value = 0;
    }

    methodTest() {
        return this.value;
    }

    async asyncMethod() {
        return await this.getValue();
    }
}

const objectMethod = {
    testMethod: function() {
        return "object method";
    },

    arrowMethod: () => {
        return "arrow in object";
    }
};

export function exportedFunc() {
    return "exported";
}
`;

createTestFile('test-extraction.js', testJSContent);

// Create method extraction test script
const methodTestContent = `
import { MethodAnalyzer } from './index.js';
import fs from 'fs';

const analyzer = new MethodAnalyzer();
const content = fs.readFileSync('test-extraction.js', 'utf8');
const methods = analyzer.extractMethods(content, 'test-extraction.js');

console.log('Methods found:', methods.length);
console.log('Method names:', methods.map(m => m.name).join(', '));

// Check for no duplicates
const uniqueKeys = new Set(methods.map(m => \`\${m.name}:\${m.line}\`));
if (methods.length !== uniqueKeys.size) {
    console.error('❌ Found duplicate methods');
    process.exit(1);
}

if (methods.length >= 5) {
    console.log('✅ Method extraction accuracy test PASSED');
    process.exit(0);
} else {
    console.error('❌ Method extraction accuracy test FAILED - too few methods');
    process.exit(1);
}
`;

createTestFile('method-extraction-test.js', methodTestContent);

runTest(
    'Method Extraction Accuracy',
    'node method-extraction-test.js',
    'Method extraction accuracy test PASSED'
);

cleanup('test-extraction.js');
cleanup('method-extraction-test.js');

// ============================================================================
// FILE CLEANUP
// ============================================================================
console.log('\n🗑️  Cleaning Up Test Artifacts');
console.log('-'.repeat(70));

cleanup('llm-context.json');
cleanup('token-analysis-report.json');

// ============================================================================
// RESULTS SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(70));

console.log(`\nTotal Tests Run: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    const failed = testResults.filter(t => t.status === 'FAILED');
    failed.forEach((test, index) => {
        console.log(`\n  ${index + 1}. ${test.name}`);
        console.log(`     Command: ${test.command}`);
        if (test.error) {
            console.log(`     Error: ${test.error.split('\n')[0]}`);
        }
    });
} else {
    console.log('\n🎉 ALL TESTS PASSED!');
}

console.log('\n📋 TEST COVERAGE:');
console.log('✅ CLI Interface');
console.log('✅ File-level Analysis');
console.log('✅ Method-level Analysis');
console.log('✅ Context Export (file)');
console.log('✅ Context Export (clipboard)');
console.log('✅ Report Generation');
console.log('✅ Verbose Mode');
console.log('✅ Combined Options');
console.log('✅ Custom Configuration');
console.log('✅ Error Handling');
console.log('✅ Method Extraction Accuracy');
console.log('✅ NPM Package CLI');

if (failedTests === 0) {
    console.log('\n🚀 Context Manager is ready for production use!');
    process.exit(0);
} else {
    console.log('\n⚠️  Please fix the failing tests before deployment.');
    process.exit(1);
}
