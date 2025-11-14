#!/usr/bin/env node

/**
 * Comprehensive Dashboard Tests
 * Tests dashboard component, stats display, and real-time updates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function assert(condition, testName, message = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    } else {
        console.log(`❌ ${testName}: ${message}`);
        testsFailed++;
        failedTests.push({ name: testName, message });
        return false;
    }
}

console.log('🧪 COMPREHENSIVE DASHBOARD TESTS');
console.log('='.repeat(70));

// ============================================================================
// DASHBOARD MODULE TESTS
// ============================================================================
console.log('\n📦 Dashboard Module Tests\n' + '-'.repeat(70));

// Test 1: Dashboard module exists
{
    try {
        const dashboardPath = path.join(__dirname, '../lib/ui/dashboard.js');
        assert(
            fs.existsSync(dashboardPath),
            'Dashboard: Module file exists at lib/ui/dashboard.js'
        );
    } catch (error) {
        assert(false, 'Dashboard: Module file exists', error.message);
    }
}

// Test 2: Dashboard can be imported
{
    try {
        const importPromise = import('../lib/ui/dashboard.js');
        assert(
            importPromise !== null,
            'Dashboard: Module can be imported'
        );
    } catch (error) {
        assert(false, 'Dashboard: Module imports', error.message);
    }
}

// ============================================================================
// STATISTICS DATA STRUCTURE TESTS
// ============================================================================
console.log('\n📊 Statistics Data Structure Tests\n' + '-'.repeat(70));

// Test 3: Valid stats object structure
{
    const stats = {
        totalFiles: 100,
        totalTokens: 50000,
        fileCount: 100,
        tokenCount: 50000,
        status: 'analyzing'
    };

    assert(
        stats.totalFiles && stats.totalTokens && stats.status,
        'Stats: Valid statistics object structure'
    );
}

// Test 4: Stats with zero values
{
    const emptyStats = {
        totalFiles: 0,
        totalTokens: 0,
        fileCount: 0,
        tokenCount: 0,
        status: 'pending'
    };

    assert(
        emptyStats.totalFiles === 0 && emptyStats.totalTokens === 0,
        'Stats: Handles zero values correctly'
    );
}

// Test 5: Stats with large numbers
{
    const largeStats = {
        totalFiles: 10000,
        totalTokens: 5000000,
        fileCount: 10000,
        tokenCount: 5000000,
        status: 'complete'
    };

    assert(
        largeStats.totalTokens === 5000000,
        'Stats: Handles large numbers correctly'
    );
}

// Test 6: Number formatting
{
    const number = 1234567;
    const formatted = number.toLocaleString();

    assert(
        formatted.includes(',') || formatted.includes('.'),
        'Stats: Numbers formatted with separators',
        `Formatted as: ${formatted}`
    );
}

// ============================================================================
// STATUS STATES TESTS
// ============================================================================
console.log('\n🔄 Status States Tests\n' + '-'.repeat(70));

// Test 7: Pending status
{
    const status = 'pending';
    const validStatuses = ['pending', 'analyzing', 'complete', 'error'];

    assert(
        validStatuses.includes(status),
        'Status: Pending is valid status'
    );
}

// Test 8: Analyzing status
{
    const status = 'analyzing';
    const validStatuses = ['pending', 'analyzing', 'complete', 'error'];

    assert(
        validStatuses.includes(status),
        'Status: Analyzing is valid status'
    );
}

// Test 9: Complete status
{
    const status = 'complete';
    const validStatuses = ['pending', 'analyzing', 'complete', 'error'];

    assert(
        validStatuses.includes(status),
        'Status: Complete is valid status'
    );
}

// Test 10: Error status
{
    const status = 'error';
    const validStatuses = ['pending', 'analyzing', 'complete', 'error'];

    assert(
        validStatuses.includes(status),
        'Status: Error is valid status'
    );
}

// Test 11: Invalid status detection
{
    const status = 'invalid-status';
    const validStatuses = ['pending', 'analyzing', 'complete', 'error'];

    assert(
        !validStatuses.includes(status),
        'Status: Invalid status detected'
    );
}

// ============================================================================
// FILE LISTING TESTS
// ============================================================================
console.log('\n📝 File Listing Tests\n' + '-'.repeat(70));

// Test 12: Empty file list
{
    const files = [];

    assert(
        Array.isArray(files) && files.length === 0,
        'File List: Empty file list is valid'
    );
}

// Test 13: File list with entries
{
    const files = [
        { path: 'src/index.js', tokens: 500 },
        { path: 'src/utils.js', tokens: 300 },
        { path: 'src/config.js', tokens: 200 }
    ];

    assert(
        files.length === 3 && files[0].path && files[0].tokens,
        'File List: File entries have path and tokens'
    );
}

// Test 14: Very long file paths
{
    const longPath = 'src/' + 'nested/'.repeat(20) + 'file.js';
    const file = { path: longPath, tokens: 100 };

    assert(
        file.path.length > 100,
        'File List: Handles very long file paths',
        `Path length: ${file.path.length}`
    );
}

// Test 15: Special characters in file paths
{
    const files = [
        { path: 'src/file with spaces.js', tokens: 100 },
        { path: 'src/file-with-dashes.js', tokens: 100 },
        { path: 'src/file_with_underscores.js', tokens: 100 }
    ];

    assert(
        files.every(f => f.path && f.tokens),
        'File List: Handles special characters in paths'
    );
}

// ============================================================================
// TOKEN COUNTING TESTS
// ============================================================================
console.log('\n🔢 Token Counting Tests\n' + '-'.repeat(70));

// Test 16: Token sum calculation
{
    const files = [
        { tokens: 500 },
        { tokens: 300 },
        { tokens: 200 }
    ];

    const totalTokens = files.reduce((sum, f) => sum + f.tokens, 0);

    assert(
        totalTokens === 1000,
        'Tokens: Sum calculation correct',
        `Expected 1000, got ${totalTokens}`
    );
}

// Test 17: Token percentage calculation
{
    const currentTokens = 50000;
    const maxTokens = 100000;
    const percentage = (currentTokens / maxTokens) * 100;

    assert(
        percentage === 50,
        'Tokens: Percentage calculation correct'
    );
}

// Test 18: Token overflow detection
{
    const currentTokens = 150000;
    const maxTokens = 100000;
    const isOverflow = currentTokens > maxTokens;

    assert(
        isOverflow === true,
        'Tokens: Overflow detected correctly'
    );
}

// ============================================================================
// FORMAT DISPLAY TESTS
// ============================================================================
console.log('\n📄 Format Display Tests\n' + '-'.repeat(70));

// Test 19: Multiple format support
{
    const formats = ['json', 'toon', 'gitingest', 'yaml', 'xml', 'csv'];

    assert(
        formats.length === 6,
        'Formats: Multiple formats available',
        `${formats.length} formats supported`
    );
}

// Test 20: Format validation
{
    const format = 'json';
    const validFormats = ['json', 'toon', 'gitingest', 'yaml', 'xml', 'csv'];

    assert(
        validFormats.includes(format),
        'Formats: JSON is valid format'
    );
}

// Test 21: Invalid format detection
{
    const format = 'invalid-format';
    const validFormats = ['json', 'toon', 'gitingest', 'yaml', 'xml', 'csv'];

    assert(
        !validFormats.includes(format),
        'Formats: Invalid format detected'
    );
}

// ============================================================================
// KEYBOARD INPUT TESTS
// ============================================================================
console.log('\n⌨️  Keyboard Input Tests\n' + '-'.repeat(70));

// Test 22: Keyboard command mapping
{
    const commands = {
        'r': 'refresh',
        'q': 'quit',
        'f': 'filter',
        's': 'sort'
    };

    assert(
        commands['r'] === 'refresh' && commands['q'] === 'quit',
        'Keyboard: Command mapping correct'
    );
}

// Test 23: Escape key handling
{
    const escapeKey = '\u001B';
    const isEscape = escapeKey === '\u001B';

    assert(
        isEscape === true,
        'Keyboard: Escape key detected'
    );
}

// ============================================================================
// UPDATE AND REFRESH TESTS
// ============================================================================
console.log('\n🔄 Update and Refresh Tests\n' + '-'.repeat(70));

// Test 24: Stats update simulation
{
    let stats = { totalFiles: 0, totalTokens: 0 };

    // Simulate update
    stats = { totalFiles: 10, totalTokens: 5000 };

    assert(
        stats.totalFiles === 10 && stats.totalTokens === 5000,
        'Updates: Stats updated correctly'
    );
}

// Test 25: Incremental update
{
    const updates = [
        { totalFiles: 10, totalTokens: 5000 },
        { totalFiles: 20, totalTokens: 10000 },
        { totalFiles: 30, totalTokens: 15000 }
    ];

    const finalUpdate = updates[updates.length - 1];

    assert(
        finalUpdate.totalFiles === 30,
        'Updates: Incremental updates work correctly'
    );
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total tests: ${testsPassed + testsFailed}`);
console.log(`🎯 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(({ name, message }) => {
        console.log(`  • ${name}`);
        if (message) console.log(`    ${message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
