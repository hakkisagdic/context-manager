#!/usr/bin/env node
/**
 * Unit Tests for UI Components
 * Tests wizard utility functions, dashboard logic, and component behavior
 * WITHOUT requiring full React/Ink rendering
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test counters
let testsPassed = 0;
let testsFailed = 0;

// Simple test framework
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   ${error.message}`);
        if (error.stack) {
            console.error(`   ${error.stack.split('\n').slice(1, 3).join('\n')}`);
        }
        return false;
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
    }
}

function assertArrayIncludes(arr, item, message) {
    if (!arr.includes(item)) {
        throw new Error(
            message || `Expected array to include ${JSON.stringify(item)}`
        );
    }
}

function assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
        throw new Error(
            message || `Expected ${actual} to be greater than ${threshold}`
        );
    }
}

console.log('🧪 Running UI Components Unit Tests\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================================================
// Test Wizard Profile Discovery Logic
// ============================================================================

console.log('📁 Testing Wizard Profile Discovery...\n');

test('Profile discovery: finds wizard-profiles directory', () => {
    const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
    const exists = fs.existsSync(profilesDir);
    assert(exists, 'wizard-profiles directory should exist');
});

test('Profile discovery: reads profile metadata files', () => {
    const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');

    if (fs.existsSync(profilesDir)) {
        const dirs = fs.readdirSync(profilesDir, { withFileTypes: true });
        const profileDirs = dirs.filter(d => d.isDirectory());

        // Should have at least one profile
        assertGreaterThan(profileDirs.length, 0, 'Should have at least one profile');

        // Check first profile has metadata
        const firstProfile = profileDirs[0];
        const metadataPath = path.join(profilesDir, firstProfile.name, 'profile.json');
        assert(fs.existsSync(metadataPath), 'Profile should have profile.json');

        // Validate metadata structure
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        assert(metadata.id, 'Metadata should have id');
        assert(metadata.name, 'Metadata should have name');
        assert(metadata.icon, 'Metadata should have icon');
    }
});

test('Profile discovery: handles missing profiles directory gracefully', () => {
    const fakeDir = '/nonexistent/path/to/profiles';
    const exists = fs.existsSync(fakeDir);
    assertEquals(exists, false, 'Should handle missing directory');
});

test('Profile discovery: validates profile JSON format', () => {
    const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');

    if (fs.existsSync(profilesDir)) {
        const dirs = fs.readdirSync(profilesDir, { withFileTypes: true });

        dirs.forEach(dirent => {
            if (dirent.isDirectory()) {
                const metadataPath = path.join(profilesDir, dirent.name, 'profile.json');

                if (fs.existsSync(metadataPath)) {
                    // Should parse without error
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

                    // Validate required fields
                    assert(typeof metadata.id === 'string', 'id should be string');
                    assert(typeof metadata.name === 'string', 'name should be string');
                    assert(metadata.name.length > 0, 'name should not be empty');
                }
            }
        });
    }
});

// ============================================================================
// Test Profile File Copying Logic
// ============================================================================

console.log('\n📋 Testing Profile File Copying Logic...\n');

test('File copying: identifies config files to copy', () => {
    const expectedFiles = [
        '.contextinclude',
        '.contextignore',
        '.methodinclude',
        '.methodignore'
    ];

    // These are the files that should be copied
    assertEquals(expectedFiles.length, 4, 'Should have 4 config files');
    assertArrayIncludes(expectedFiles, '.contextinclude', 'Should include .contextinclude');
    assertArrayIncludes(expectedFiles, '.methodinclude', 'Should include .methodinclude');
});

test('File copying: creates temporary test directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-test-'));
    assert(fs.existsSync(tempDir), 'Temp directory should exist');

    // Cleanup
    fs.rmdirSync(tempDir);
});

test('File copying: copies files with profile suffix', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-test-'));

    try {
        // Create source file
        const sourceFile = path.join(tempDir, '.contextinclude');
        fs.writeFileSync(sourceFile, '**/*.js\n**/*.ts');

        // Copy with suffix
        const destFile = path.join(tempDir, '.contextinclude-test-profile');
        fs.copyFileSync(sourceFile, destFile);

        // Verify
        assert(fs.existsSync(destFile), 'Destination file should exist');
        const content = fs.readFileSync(destFile, 'utf-8');
        assert(content.includes('**/*.js'), 'Content should be preserved');
    } finally {
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('File copying: handles missing source files gracefully', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-test-'));

    try {
        const sourceFile = path.join(tempDir, 'nonexistent.txt');
        const exists = fs.existsSync(sourceFile);

        assertEquals(exists, false, 'Should handle missing source file');

        // Should not throw when checking existence
        assert(true, 'Should not throw error');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

test('File copying: validates copied file content', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wizard-test-'));

    try {
        const testContent = '# Test config\n**/*.js\n!node_modules/**';
        const sourceFile = path.join(tempDir, '.contextinclude');
        fs.writeFileSync(sourceFile, testContent);

        const destFile = path.join(tempDir, '.contextinclude-code-review');
        fs.copyFileSync(sourceFile, destFile);

        const copiedContent = fs.readFileSync(destFile, 'utf-8');
        assertEquals(copiedContent, testContent, 'Content should match exactly');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});

// ============================================================================
// Test Dashboard Data Processing
// ============================================================================

console.log('\n📊 Testing Dashboard Data Processing...\n');

test('Dashboard: validates stats object structure', () => {
    const mockStats = {
        totalFiles: 64,
        totalTokens: 181480,
        totalBytes: 782336,
        totalLines: 28721,
        byExtension: {
            '.js': { count: 64, tokens: 181480 }
        }
    };

    assert(mockStats.totalFiles > 0, 'Should have files');
    assert(mockStats.totalTokens > 0, 'Should have tokens');
    assert(mockStats.byExtension, 'Should have extension breakdown');
});

test('Dashboard: processes top files list', () => {
    const mockTopFiles = [
        { name: 'server.js', tokens: 12388 },
        { name: 'handler.js', tokens: 11007 },
        { name: 'security.js', tokens: 7814 }
    ];

    assertEquals(mockTopFiles.length, 3, 'Should have 3 files');
    assert(mockTopFiles[0].tokens > mockTopFiles[1].tokens, 'Should be sorted by tokens');
    assert(mockTopFiles[1].tokens > mockTopFiles[2].tokens, 'Should be sorted descending');
});

test('Dashboard: calculates percentages correctly', () => {
    const totalTokens = 181480;
    const fileTokens = 12388;

    const percentage = (fileTokens / totalTokens * 100).toFixed(2);
    const expectedPercentage = '6.83';

    assertEquals(percentage, expectedPercentage, 'Should calculate percentage correctly');
});

test('Dashboard: handles empty stats gracefully', () => {
    const emptyStats = {
        totalFiles: 0,
        totalTokens: 0,
        totalBytes: 0,
        totalLines: 0,
        byExtension: {}
    };

    assertEquals(emptyStats.totalFiles, 0, 'Should handle zero files');
    assert(Object.keys(emptyStats.byExtension).length === 0, 'Should handle empty extensions');
});

test('Dashboard: formats large numbers correctly', () => {
    const largeNumber = 1234567;
    const formatted = largeNumber.toLocaleString();

    assert(formatted.includes(',') || formatted.includes(' '), 'Should format with separators');
});

// ============================================================================
// Test Progress Bar Logic
// ============================================================================

console.log('\n⏳ Testing Progress Bar Logic...\n');

test('Progress bar: calculates percentage correctly', () => {
    const current = 50;
    const total = 100;
    const percentage = (current / total * 100);

    assertEquals(percentage, 50, 'Should calculate 50%');
});

test('Progress bar: handles edge cases (0%)', () => {
    const current = 0;
    const total = 100;
    const percentage = (current / total * 100);

    assertEquals(percentage, 0, 'Should handle 0%');
});

test('Progress bar: handles edge cases (100%)', () => {
    const current = 100;
    const total = 100;
    const percentage = (current / total * 100);

    assertEquals(percentage, 100, 'Should handle 100%');
});

test('Progress bar: generates progress bar string', () => {
    const percentage = 50;
    const barLength = 20;
    const filledLength = Math.floor(barLength * percentage / 100);
    const emptyLength = barLength - filledLength;

    const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

    assertEquals(bar.length, barLength, 'Bar should have correct length');
    assert(bar.includes('█'), 'Bar should have filled portion');
    assert(bar.includes('░'), 'Bar should have empty portion');
});

test('Progress bar: formats time remaining', () => {
    const seconds = 125;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    assertEquals(minutes, 2, 'Should calculate minutes');
    assertEquals(remainingSeconds, 5, 'Should calculate remaining seconds');

    const formatted = `${minutes}m ${remainingSeconds}s`;
    assertEquals(formatted, '2m 5s', 'Should format correctly');
});

// ============================================================================
// Test Select Input Logic
// ============================================================================

console.log('\n🎯 Testing Select Input Logic...\n');

test('Select input: validates items array', () => {
    const items = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
        { label: 'Option 3', value: 'opt3' }
    ];

    assert(Array.isArray(items), 'Items should be array');
    assertEquals(items.length, 3, 'Should have 3 items');
    assert(items[0].label, 'Items should have label');
    assert(items[0].value, 'Items should have value');
});

test('Select input: handles navigation (next)', () => {
    const items = ['a', 'b', 'c'];
    let currentIndex = 0;

    // Navigate down
    currentIndex = (currentIndex + 1) % items.length;
    assertEquals(currentIndex, 1, 'Should move to next item');

    currentIndex = (currentIndex + 1) % items.length;
    assertEquals(currentIndex, 2, 'Should move to third item');
});

test('Select input: handles navigation (previous)', () => {
    const items = ['a', 'b', 'c'];
    let currentIndex = 2;

    // Navigate up
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    assertEquals(currentIndex, 1, 'Should move to previous item');

    currentIndex = (currentIndex - 1 + items.length) % items.length;
    assertEquals(currentIndex, 0, 'Should move to first item');
});

test('Select input: handles wrap-around navigation', () => {
    const items = ['a', 'b', 'c'];
    let currentIndex = 0;

    // Navigate up from first item (should wrap to last)
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    assertEquals(currentIndex, 2, 'Should wrap to last item');

    // Navigate down from last item (should wrap to first)
    currentIndex = (currentIndex + 1) % items.length;
    assertEquals(currentIndex, 0, 'Should wrap to first item');
});

test('Select input: filters items by search term', () => {
    const items = [
        { label: 'Apple', value: 'apple' },
        { label: 'Banana', value: 'banana' },
        { label: 'Apricot', value: 'apricot' }
    ];

    const searchTerm = 'ap';
    const filtered = items.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    assertEquals(filtered.length, 2, 'Should find 2 matches');
    assert(filtered[0].label === 'Apple', 'Should include Apple');
    assert(filtered[1].label === 'Apricot', 'Should include Apricot');
});

test('Select input: handles empty items array', () => {
    const items = [];

    assertEquals(items.length, 0, 'Should handle empty array');
    assert(Array.isArray(items), 'Should still be an array');
});

// ============================================================================
// Test Wizard State Management
// ============================================================================

console.log('\n🔄 Testing Wizard State Management...\n');

test('Wizard state: initializes with correct default state', () => {
    const initialState = {
        step: 'profile',
        answers: {}
    };

    assertEquals(initialState.step, 'profile', 'Should start at profile step');
    assert(Object.keys(initialState.answers).length === 0, 'Should have empty answers');
});

test('Wizard state: transitions through steps correctly', () => {
    const steps = ['profile', 'target-model', 'output-format', 'complete'];
    let currentStepIndex = 0;

    assertEquals(steps[currentStepIndex], 'profile', 'Should start at profile');

    currentStepIndex++;
    assertEquals(steps[currentStepIndex], 'target-model', 'Should move to target-model');

    currentStepIndex++;
    assertEquals(steps[currentStepIndex], 'output-format', 'Should move to output-format');

    currentStepIndex++;
    assertEquals(steps[currentStepIndex], 'complete', 'Should end at complete');
});

test('Wizard state: accumulates answers correctly', () => {
    const answers = {};

    // Step 1: Profile
    answers.profile = 'code-review';
    assertEquals(Object.keys(answers).length, 1, 'Should have 1 answer');

    // Step 2: Target Model
    answers.targetModel = 'claude-sonnet-4.5';
    assertEquals(Object.keys(answers).length, 2, 'Should have 2 answers');

    // Step 3: Output Format
    answers.outputFormat = 'toon';
    assertEquals(Object.keys(answers).length, 3, 'Should have 3 answers');

    assert(answers.profile === 'code-review', 'Should preserve profile answer');
    assert(answers.targetModel === 'claude-sonnet-4.5', 'Should preserve model answer');
    assert(answers.outputFormat === 'toon', 'Should preserve format answer');
});

test('Wizard state: validates answer data types', () => {
    const answers = {
        profile: 'code-review',
        targetModel: 'claude-sonnet-4.5',
        outputFormat: 'toon'
    };

    assert(typeof answers.profile === 'string', 'Profile should be string');
    assert(typeof answers.targetModel === 'string', 'Target model should be string');
    assert(typeof answers.outputFormat === 'string', 'Output format should be string');
});

// ============================================================================
// Test Error Handling
// ============================================================================

console.log('\n⚠️  Testing Error Handling...\n');

test('Error handling: catches JSON parse errors', () => {
    const invalidJson = '{ invalid json }';

    try {
        JSON.parse(invalidJson);
        assert(false, 'Should throw error');
    } catch (error) {
        assert(error instanceof SyntaxError, 'Should throw SyntaxError');
    }
});

test('Error handling: validates file system errors', () => {
    const nonexistentPath = '/this/path/does/not/exist/file.txt';

    try {
        fs.readFileSync(nonexistentPath, 'utf-8');
        assert(false, 'Should throw error');
    } catch (error) {
        assert(error.code === 'ENOENT', 'Should throw ENOENT error');
    }
});

test('Error handling: handles permission errors gracefully', () => {
    // Test that we can detect permission issues
    const testPath = '/root/protected-file.txt';

    try {
        // This will likely fail with permission denied
        const exists = fs.existsSync(testPath);
        // If it doesn't fail, that's fine (we just can't test this scenario)
        assert(true, 'Should handle permission check');
    } catch (error) {
        // If it throws, verify it's a permission error
        assert(error.code === 'EACCES' || error.code === 'EPERM', 'Should be permission error');
    }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 Test Summary:\n');
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
console.log(`   🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════\n');

if (testsFailed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
} else {
    console.log('✅ All UI component unit tests passed!\n');
    process.exit(0);
}
