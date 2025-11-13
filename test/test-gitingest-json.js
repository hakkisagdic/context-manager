#!/usr/bin/env node

/**
 * GitIngest JSON Integration Test
 * Tests the ability to generate digest from JSON files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


console.log('🧪 Testing GitIngest JSON Integration...\n');

const testDir = path.join(__dirname, '..');
process.chdir(testDir);

// Clean up any existing files
const cleanupFiles = ['digest.txt', 'token-analysis-report.json', 'llm-context.json'];
cleanupFiles.forEach(file => {
    const filePath = path.join(testDir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
});

console.log('✅ Test 1: Cleanup completed\n');

// Test 2: Generate token-analysis-report.json
console.log('✅ Test 2: Generating token-analysis-report.json');
try {
    execSync('node context-manager.js --save-report', {
        stdio: 'pipe',
        cwd: testDir
    });

    if (!fs.existsSync(path.join(testDir, 'token-analysis-report.json'))) {
        console.error('❌ FAIL: token-analysis-report.json not created');
        process.exit(1);
    }
    console.log('   ✓ Report created successfully\n');
} catch (error) {
    console.error('❌ FAIL: Could not generate report:', error.message);
    process.exit(1);
}

// Test 3: Generate digest from report
console.log('✅ Test 3: Generate digest from token-analysis-report.json');
try {
    const output = execSync('node context-manager.js --gitingest-from-report token-analysis-report.json', {
        encoding: 'utf8',
        cwd: testDir
    });

    if (!output.includes('GitIngest digest saved')) {
        console.error('❌ FAIL: Unexpected output');
        process.exit(1);
    }

    if (!fs.existsSync(path.join(testDir, 'digest.txt'))) {
        console.error('❌ FAIL: digest.txt not created');
        process.exit(1);
    }

    const digestContent = fs.readFileSync(path.join(testDir, 'digest.txt'), 'utf8');
    if (!digestContent.includes('Directory structure:')) {
        console.error('❌ FAIL: digest.txt missing directory structure');
        process.exit(1);
    }

    if (!digestContent.includes('FILE:')) {
        console.error('❌ FAIL: digest.txt missing file contents');
        process.exit(1);
    }

    console.log('   ✓ Digest created from report successfully\n');
} catch (error) {
    console.error('❌ FAIL: Could not generate digest from report:', error.message);
    process.exit(1);
}

// Clean up digest for next test
fs.unlinkSync(path.join(testDir, 'digest.txt'));

// Test 4: Generate llm-context.json
console.log('✅ Test 4: Generating llm-context.json');
try {
    execSync('node context-manager.js --context-export', {
        stdio: 'pipe',
        cwd: testDir
    });

    if (!fs.existsSync(path.join(testDir, 'llm-context.json'))) {
        console.error('❌ FAIL: llm-context.json not created');
        process.exit(1);
    }
    console.log('   ✓ Context created successfully\n');
} catch (error) {
    console.error('❌ FAIL: Could not generate context:', error.message);
    process.exit(1);
}

// Test 5: Generate digest from context
console.log('✅ Test 5: Generate digest from llm-context.json');
try {
    const output = execSync('node context-manager.js --gitingest-from-context llm-context.json', {
        encoding: 'utf8',
        cwd: testDir
    });

    if (!output.includes('GitIngest digest saved')) {
        console.error('❌ FAIL: Unexpected output');
        process.exit(1);
    }

    if (!fs.existsSync(path.join(testDir, 'digest.txt'))) {
        console.error('❌ FAIL: digest.txt not created');
        process.exit(1);
    }

    const digestContent = fs.readFileSync(path.join(testDir, 'digest.txt'), 'utf8');
    if (!digestContent.includes('Directory structure:')) {
        console.error('❌ FAIL: digest.txt missing directory structure');
        process.exit(1);
    }

    console.log('   ✓ Digest created from context successfully\n');
} catch (error) {
    console.error('❌ FAIL: Could not generate digest from context:', error.message);
    process.exit(1);
}

// Test 6: Default filename for report
console.log('✅ Test 6: Test default filename for report');
fs.unlinkSync(path.join(testDir, 'digest.txt'));
try {
    execSync('node context-manager.js --gitingest-from-report', {
        stdio: 'pipe',
        cwd: testDir
    });

    if (!fs.existsSync(path.join(testDir, 'digest.txt'))) {
        console.error('❌ FAIL: digest.txt not created with default filename');
        process.exit(1);
    }
    console.log('   ✓ Default filename works for report\n');
} catch (error) {
    console.error('❌ FAIL: Default filename failed:', error.message);
    process.exit(1);
}

// Test 7: Default filename for context
console.log('✅ Test 7: Test default filename for context');
fs.unlinkSync(path.join(testDir, 'digest.txt'));
try {
    execSync('node context-manager.js --gitingest-from-context', {
        stdio: 'pipe',
        cwd: testDir
    });

    if (!fs.existsSync(path.join(testDir, 'digest.txt'))) {
        console.error('❌ FAIL: digest.txt not created with default filename');
        process.exit(1);
    }
    console.log('   ✓ Default filename works for context\n');
} catch (error) {
    console.error('❌ FAIL: Default filename failed:', error.message);
    process.exit(1);
}

// Test 8: Error handling - missing file
console.log('✅ Test 8: Error handling for missing file');
try {
    execSync('node context-manager.js --gitingest-from-report nonexistent.json', {
        stdio: 'pipe',
        cwd: testDir
    });
    console.error('❌ FAIL: Should have thrown error for missing file');
    process.exit(1);
} catch (error) {
    // Expected to fail
    console.log('   ✓ Correctly handles missing file\n');
}

// Test 9: Compare digest sizes
console.log('✅ Test 9: Verify digest content quality');
const digestContent = fs.readFileSync(path.join(testDir, 'digest.txt'), 'utf8');
const lines = digestContent.split('\n').length;
const hasFiles = (digestContent.match(/FILE:/g) || []).length;

// Check if method filtering is active
const hasMethodFiltering = digestContent.includes('Method filtering:');
const minLines = hasMethodFiltering ? 10 : 100;  // Lower threshold if method filtering active

if (lines < minLines) {
    console.error(`❌ FAIL: Digest content too short (${lines} lines, expected >= ${minLines})`);
    process.exit(1);
}

if (hasFiles < 1) {
    console.error('❌ FAIL: No files in digest');
    process.exit(1);
}

console.log(`   ✓ Digest has ${lines} lines and ${hasFiles} files${hasMethodFiltering ? ' (method filtering active)' : ''}\n`);

// Cleanup
console.log('🧹 Cleaning up test files...');
cleanupFiles.forEach(file => {
    const filePath = path.join(testDir, file);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
});

console.log('\n🎉 All GitIngest JSON tests passed!\n');
console.log('Summary:');
console.log('  ✅ Report generation works');
console.log('  ✅ Digest from report works');
console.log('  ✅ Context generation works');
console.log('  ✅ Digest from context works');
console.log('  ✅ Default filenames work');
console.log('  ✅ Error handling works');
console.log('  ✅ Digest quality validated');
console.log('\n✨ JSON-based digest generation ready for use!\n');
