#!/usr/bin/env node

/**
 * Comprehensive Tests for Config Utils
 * Tests configuration file discovery and initialization
 */

import ConfigUtils from '../lib/utils/config-utils.js';
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

console.log('🧪 COMPREHENSIVE CONFIG UTILS TESTS');
console.log('='.repeat(70));

// Create test directory
const testDir = path.join(__dirname, 'temp-test-config');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// findConfigFile TESTS
// ============================================================================
console.log('\n🔍 findConfigFile Tests\n' + '-'.repeat(70));

// Test 1: File doesn't exist
{
    const result = ConfigUtils.findConfigFile(testDir, '.contextignore');
    assert(
        result === undefined,
        'findConfigFile: Returns undefined when file not found'
    );
}

// Test 2: File exists in project root
{
    const testFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(testFile, '*.log\nnode_modules/');

    const result = ConfigUtils.findConfigFile(testDir, '.contextignore');
    assert(
        result !== undefined && fs.existsSync(result),
        'findConfigFile: Finds file in project root'
    );

    fs.unlinkSync(testFile);
}

// Test 3: .gitignore file
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'node_modules/\n*.log');

    const result = ConfigUtils.findConfigFile(testDir, '.gitignore');
    assert(
        result !== undefined,
        'findConfigFile: Finds .gitignore file'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 4: .contextinclude file
{
    const includeFile = path.join(testDir, '.contextinclude');
    fs.writeFileSync(includeFile, '**/*.js\n**/*.ts');

    const result = ConfigUtils.findConfigFile(testDir, '.contextinclude');
    assert(
        result !== undefined,
        'findConfigFile: Finds .contextinclude file'
    );

    fs.unlinkSync(includeFile);
}

// Test 5: .methodinclude file
{
    const methodFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(methodFile, 'MyClass.*\nTestClass.*');

    const result = ConfigUtils.findConfigFile(testDir, '.methodinclude');
    assert(
        result !== undefined,
        'findConfigFile: Finds .methodinclude file'
    );

    fs.unlinkSync(methodFile);
}

// ============================================================================
// initMethodFilter TESTS
// ============================================================================
console.log('\n📋 initMethodFilter Tests\n' + '-'.repeat(70));

// Test 6: No method filter files
{
    const result = ConfigUtils.initMethodFilter(testDir);
    assert(
        result === null,
        'initMethodFilter: Returns null when no filter files exist'
    );
}

// Test 7: With .methodinclude file
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'MyClass.*');

    const result = ConfigUtils.initMethodFilter(testDir);
    assert(
        result !== null,
        'initMethodFilter: Returns parser when .methodinclude exists'
    );

    fs.unlinkSync(includeFile);
}

// Test 8: With .methodignore file
{
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignoreFile, 'test*');

    const result = ConfigUtils.initMethodFilter(testDir);
    assert(
        result !== null,
        'initMethodFilter: Returns parser when .methodignore exists'
    );

    fs.unlinkSync(ignoreFile);
}

// Test 9: With both filter files
{
    const includeFile = path.join(testDir, '.methodinclude');
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(includeFile, 'MyClass.*');
    fs.writeFileSync(ignoreFile, 'test*');

    const result = ConfigUtils.initMethodFilter(testDir);
    assert(
        result !== null,
        'initMethodFilter: Returns parser when both files exist'
    );

    fs.unlinkSync(includeFile);
    fs.unlinkSync(ignoreFile);
}

// ============================================================================
// detectMethodFilters TESTS
// ============================================================================
console.log('\n🔎 detectMethodFilters Tests\n' + '-'.repeat(70));

// Test 10: No filter files
{
    const result = ConfigUtils.detectMethodFilters(testDir);
    assert(
        result === false,
        'detectMethodFilters: Returns false when no filter files exist'
    );
}

// Test 11: .methodinclude exists
{
    const includeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includeFile, 'MyClass.*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    assert(
        result === true,
        'detectMethodFilters: Returns true when .methodinclude exists'
    );

    fs.unlinkSync(includeFile);
}

// Test 12: .methodignore exists
{
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignoreFile, 'test*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    assert(
        result === true,
        'detectMethodFilters: Returns true when .methodignore exists'
    );

    fs.unlinkSync(ignoreFile);
}

// Test 13: Both files exist
{
    const includeFile = path.join(testDir, '.methodinclude');
    const ignoreFile = path.join(testDir, '.methodignore');
    fs.writeFileSync(includeFile, 'MyClass.*');
    fs.writeFileSync(ignoreFile, 'test*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    assert(
        result === true,
        'detectMethodFilters: Returns true when both files exist'
    );

    fs.unlinkSync(includeFile);
    fs.unlinkSync(ignoreFile);
}

// ============================================================================
// initGitIgnore TESTS
// ============================================================================
console.log('\n📄 initGitIgnore Tests\n' + '-'.repeat(70));

// Test 14: No .gitignore file (parser still created)
{
    const result = ConfigUtils.initGitIgnore(testDir);
    assert(
        result !== null,
        'initGitIgnore: Returns parser even when .gitignore doesn\'t exist'
    );
}

// Test 15: With .gitignore file
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, 'node_modules/\n*.log\n.env');

    const result = ConfigUtils.initGitIgnore(testDir);
    assert(
        result !== null,
        'initGitIgnore: Returns parser when .gitignore exists'
    );

    fs.unlinkSync(gitignoreFile);
}

// Test 16: Empty .gitignore file
{
    const gitignoreFile = path.join(testDir, '.gitignore');
    fs.writeFileSync(gitignoreFile, '');

    const result = ConfigUtils.initGitIgnore(testDir);
    assert(
        result !== null,
        'initGitIgnore: Returns parser for empty .gitignore'
    );

    fs.unlinkSync(gitignoreFile);
}

// ============================================================================
// getConfigPaths TESTS
// ============================================================================
console.log('\n📂 getConfigPaths Tests\n' + '-'.repeat(70));

// Test 17: getConfigPaths structure
{
    const result = ConfigUtils.getConfigPaths(testDir);
    assert(
        result.gitignore &&
        typeof result.contextIgnore !== undefined &&
        typeof result.contextInclude !== undefined &&
        typeof result.methodInclude !== undefined &&
        typeof result.methodIgnore !== undefined,
        'getConfigPaths: Returns object with all config paths'
    );
}

// Test 18: getConfigPaths with files
{
    fs.writeFileSync(path.join(testDir, '.gitignore'), 'test');
    fs.writeFileSync(path.join(testDir, '.contextignore'), 'test');
    fs.writeFileSync(path.join(testDir, '.contextinclude'), 'test');
    fs.writeFileSync(path.join(testDir, '.methodinclude'), 'test');
    fs.writeFileSync(path.join(testDir, '.methodignore'), 'test');

    const result = ConfigUtils.getConfigPaths(testDir);
    assert(
        result.gitignore.includes('.gitignore'),
        'getConfigPaths: gitignore path includes .gitignore'
    );

    // Cleanup
    fs.unlinkSync(path.join(testDir, '.gitignore'));
    fs.unlinkSync(path.join(testDir, '.contextignore'));
    fs.unlinkSync(path.join(testDir, '.contextinclude'));
    fs.unlinkSync(path.join(testDir, '.methodinclude'));
    fs.unlinkSync(path.join(testDir, '.methodignore'));
}

// Test 19: getConfigPaths finds existing files
{
    fs.writeFileSync(path.join(testDir, '.contextinclude'), '**/*.js');

    const result = ConfigUtils.getConfigPaths(testDir);
    assert(
        result.contextInclude !== undefined,
        'getConfigPaths: Finds .contextinclude when it exists'
    );

    fs.unlinkSync(path.join(testDir, '.contextinclude'));
}

// Test 20: Config file in subdirectory (should not be found)
{
    const subdir = path.join(testDir, 'subdir');
    fs.mkdirSync(subdir);
    fs.writeFileSync(path.join(subdir, '.contextignore'), 'test');

    const result = ConfigUtils.findConfigFile(testDir, '.contextignore');
    assert(
        result === undefined,
        'findConfigFile: Does not find files in subdirectories'
    );

    fs.rmSync(subdir, { recursive: true });
}

// Cleanup
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
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
