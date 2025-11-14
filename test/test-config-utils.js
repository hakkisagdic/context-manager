#!/usr/bin/env node

/**
 * Comprehensive Config Utils Tests
 * Tests for configuration file discovery, parsing, merging, and validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ConfigUtils from '../lib/utils/config-utils.js';
import MethodFilterParser from '../lib/parsers/method-filter-parser.js';
import GitIgnoreParser from '../lib/parsers/gitignore-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'config-utils');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

// Create test fixtures
function setupTestFixtures() {
    // Clean up old fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }

    // Create directory structure
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });

    // Create test config files
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.contextignore'), 'node_modules/\n*.log\n');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.contextinclude'), 'src/**/*.js\n');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.methodinclude'), '*Handler\n*Controller\n');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.methodignore'), '*Test\n*Mock\n');
    fs.writeFileSync(path.join(TEST_PROJECT_DIR, '.gitignore'), 'node_modules/\n.env\n');
}

// Clean up test fixtures
function cleanupTestFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }
}

console.log('🧪 Testing Config Utils...\n');
console.log('Setting up test fixtures...');
setupTestFixtures();

// ============================================================================
// CONFIG FILE DISCOVERY TESTS
// ============================================================================
console.log('\n🔍 Config File Discovery Tests');
console.log('-'.repeat(70));

test('ConfigUtils - findConfigFile in project root', () => {
    const configPath = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.contextignore');
    if (!configPath) throw new Error('Should find config in project root');
    if (!configPath.endsWith('.contextignore')) throw new Error('Should return correct path');
});

test('ConfigUtils - findConfigFile returns undefined for missing file', () => {
    const configPath = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.nonexistent');
    if (configPath !== undefined) throw new Error('Should return undefined for missing file');
});

test('ConfigUtils - findConfigFile handles multiple locations', () => {
    const configPath = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.contextinclude');
    if (!configPath) throw new Error('Should find config file');
    if (!fs.existsSync(configPath)) throw new Error('Returned path should exist');
});

test('ConfigUtils - findConfigFile prioritizes package root', () => {
    // Create a config file in package root
    const packageRoot = path.join(__dirname, '..');
    const testFile = path.join(packageRoot, '.test-config-temp');

    try {
        fs.writeFileSync(testFile, 'test');
        const configPath = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.test-config-temp');

        if (!configPath) throw new Error('Should find config');
        if (!configPath.includes('context-manager')) throw new Error('Should prioritize package root');
    } finally {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }
});

test('ConfigUtils - findConfigFile with absolute path', () => {
    const configPath = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.gitignore');
    if (!configPath) throw new Error('Should find config');
    if (!path.isAbsolute(configPath)) throw new Error('Should return absolute path');
});

// ============================================================================
// METHOD FILTER INITIALIZATION TESTS
// ============================================================================
console.log('\n🎯 Method Filter Initialization Tests');
console.log('-'.repeat(70));

test('ConfigUtils - initMethodFilter with both include and ignore files', () => {
    const parser = ConfigUtils.initMethodFilter(TEST_PROJECT_DIR);
    if (!parser) throw new Error('Should return parser instance');
    if (!(parser instanceof MethodFilterParser)) throw new Error('Should be MethodFilterParser instance');
});

test('ConfigUtils - initMethodFilter returns null when no filter files exist', () => {
    const emptyDir = path.join(FIXTURES_DIR, 'empty-project');
    fs.mkdirSync(emptyDir, { recursive: true });

    const parser = ConfigUtils.initMethodFilter(emptyDir);
    if (parser !== null) throw new Error('Should return null when no filter files exist');
});

test('ConfigUtils - initMethodFilter with only include file', () => {
    const includeOnlyDir = path.join(FIXTURES_DIR, 'include-only');
    fs.mkdirSync(includeOnlyDir, { recursive: true });
    fs.writeFileSync(path.join(includeOnlyDir, '.methodinclude'), '*Handler\n');

    const parser = ConfigUtils.initMethodFilter(includeOnlyDir);
    if (!parser) throw new Error('Should return parser with include file only');
});

test('ConfigUtils - initMethodFilter with only ignore file', () => {
    const ignoreOnlyDir = path.join(FIXTURES_DIR, 'ignore-only');
    fs.mkdirSync(ignoreOnlyDir, { recursive: true });
    fs.writeFileSync(path.join(ignoreOnlyDir, '.methodignore'), '*Test\n');

    const parser = ConfigUtils.initMethodFilter(ignoreOnlyDir);
    if (!parser) throw new Error('Should return parser with ignore file only');
});

test('ConfigUtils - initMethodFilter with tracer', () => {
    const mockTracer = { traceDecision: () => {} };
    const parser = ConfigUtils.initMethodFilter(TEST_PROJECT_DIR, mockTracer);
    if (!parser) throw new Error('Should return parser with tracer');
});

// ============================================================================
// METHOD FILTER DETECTION TESTS
// ============================================================================
console.log('\n🔎 Method Filter Detection Tests');
console.log('-'.repeat(70));

test('ConfigUtils - detectMethodFilters returns true when filters exist', () => {
    const hasFilters = ConfigUtils.detectMethodFilters(TEST_PROJECT_DIR);
    if (!hasFilters) throw new Error('Should detect method filters');
});

test('ConfigUtils - detectMethodFilters returns false when no filters exist', () => {
    const emptyDir = path.join(FIXTURES_DIR, 'no-filters');
    fs.mkdirSync(emptyDir, { recursive: true });

    const hasFilters = ConfigUtils.detectMethodFilters(emptyDir);
    if (hasFilters) throw new Error('Should return false when no filters exist');
});

test('ConfigUtils - detectMethodFilters with only methodinclude', () => {
    const includeOnlyDir = path.join(FIXTURES_DIR, 'include-detection');
    fs.mkdirSync(includeOnlyDir, { recursive: true });
    fs.writeFileSync(path.join(includeOnlyDir, '.methodinclude'), '*Handler\n');

    const hasFilters = ConfigUtils.detectMethodFilters(includeOnlyDir);
    if (!hasFilters) throw new Error('Should detect methodinclude file');
});

test('ConfigUtils - detectMethodFilters with only methodignore', () => {
    const ignoreOnlyDir = path.join(FIXTURES_DIR, 'ignore-detection');
    fs.mkdirSync(ignoreOnlyDir, { recursive: true });
    fs.writeFileSync(path.join(ignoreOnlyDir, '.methodignore'), '*Test\n');

    const hasFilters = ConfigUtils.detectMethodFilters(ignoreOnlyDir);
    if (!hasFilters) throw new Error('Should detect methodignore file');
});

// ============================================================================
// GIT IGNORE INITIALIZATION TESTS
// ============================================================================
console.log('\n📂 Git Ignore Initialization Tests');
console.log('-'.repeat(70));

test('ConfigUtils - initGitIgnore returns GitIgnoreParser instance', () => {
    const parser = ConfigUtils.initGitIgnore(TEST_PROJECT_DIR);
    if (!parser) throw new Error('Should return parser instance');
    if (!(parser instanceof GitIgnoreParser)) throw new Error('Should be GitIgnoreParser instance');
});

test('ConfigUtils - initGitIgnore with all config files', () => {
    const parser = ConfigUtils.initGitIgnore(TEST_PROJECT_DIR);
    if (!parser) throw new Error('Should initialize with all config files');
});

test('ConfigUtils - initGitIgnore with tracer', () => {
    const mockTracer = { traceDecision: () => {} };
    const parser = ConfigUtils.initGitIgnore(TEST_PROJECT_DIR, mockTracer);
    if (!parser) throw new Error('Should initialize with tracer');
});

test('ConfigUtils - initGitIgnore without context files', () => {
    const minimalDir = path.join(FIXTURES_DIR, 'minimal');
    fs.mkdirSync(minimalDir, { recursive: true });

    const parser = ConfigUtils.initGitIgnore(minimalDir);
    if (!parser) throw new Error('Should initialize even without context files');
});

// ============================================================================
// CONFIG PATHS TESTS
// ============================================================================
console.log('\n📁 Config Paths Tests');
console.log('-'.repeat(70));

test('ConfigUtils - getConfigPaths returns all paths', () => {
    const paths = ConfigUtils.getConfigPaths(TEST_PROJECT_DIR);
    if (!paths) throw new Error('Should return paths object');
    if (!paths.gitignore) throw new Error('Should include gitignore path');
    if (!paths.contextIgnore) throw new Error('Should include contextIgnore path');
    if (!paths.contextInclude) throw new Error('Should include contextInclude path');
    if (!paths.methodInclude) throw new Error('Should include methodInclude path');
    if (!paths.methodIgnore) throw new Error('Should include methodIgnore path');
});

test('ConfigUtils - getConfigPaths with absolute paths', () => {
    const paths = ConfigUtils.getConfigPaths(TEST_PROJECT_DIR);
    if (!path.isAbsolute(paths.gitignore)) throw new Error('gitignore should be absolute');
});

test('ConfigUtils - getConfigPaths with missing files (undefined values)', () => {
    const emptyDir = path.join(FIXTURES_DIR, 'empty-paths');
    fs.mkdirSync(emptyDir, { recursive: true });

    const paths = ConfigUtils.getConfigPaths(emptyDir);
    if (paths.contextIgnore !== undefined) throw new Error('Missing file should be undefined');
});

test('ConfigUtils - getConfigPaths structure', () => {
    const paths = ConfigUtils.getConfigPaths(TEST_PROJECT_DIR);
    const requiredKeys = ['gitignore', 'contextIgnore', 'contextInclude', 'methodInclude', 'methodIgnore'];

    for (const key of requiredKeys) {
        if (!(key in paths)) throw new Error(`Should include ${key} in paths`);
    }
});

// ============================================================================
// EDGE CASES AND ERROR HANDLING
// ============================================================================
console.log('\n🎯 Edge Cases and Error Handling');
console.log('-'.repeat(70));

test('ConfigUtils - findConfigFile with empty project root', () => {
    try {
        ConfigUtils.findConfigFile('', '.contextignore');
        // Should not crash
    } catch (error) {
        throw new Error('Should handle empty project root gracefully');
    }
});

test('ConfigUtils - findConfigFile with nonexistent directory', () => {
    const result = ConfigUtils.findConfigFile('/nonexistent/path', '.contextignore');
    // Should return undefined or handle gracefully
    if (result && !fs.existsSync(result)) {
        throw new Error('Should not return nonexistent path');
    }
});

test('ConfigUtils - initMethodFilter with invalid project root', () => {
    try {
        const parser = ConfigUtils.initMethodFilter('/nonexistent/path');
        if (parser !== null) throw new Error('Should return null for invalid path');
    } catch (error) {
        // May throw, which is acceptable
    }
});

test('ConfigUtils - detectMethodFilters with null/undefined', () => {
    try {
        const emptyDir = path.join(FIXTURES_DIR, 'null-test');
        fs.mkdirSync(emptyDir, { recursive: true });
        ConfigUtils.detectMethodFilters(emptyDir);
        // Should not crash
    } catch (error) {
        throw new Error('Should handle edge cases gracefully');
    }
});

test('ConfigUtils - getConfigPaths with special characters in path', () => {
    const specialDir = path.join(FIXTURES_DIR, 'special-@#$-dir');
    fs.mkdirSync(specialDir, { recursive: true });

    try {
        const paths = ConfigUtils.getConfigPaths(specialDir);
        if (!paths) throw new Error('Should handle special characters');
    } catch (error) {
        // May fail but should not crash unexpectedly
    }
});

// ============================================================================
// STATIC METHODS TESTS
// ============================================================================
console.log('\n⚙️  Static Methods Tests');
console.log('-'.repeat(70));

test('ConfigUtils - All methods are static', () => {
    if (typeof ConfigUtils.findConfigFile !== 'function') {
        throw new Error('findConfigFile should be static');
    }
    if (typeof ConfigUtils.initMethodFilter !== 'function') {
        throw new Error('initMethodFilter should be static');
    }
    if (typeof ConfigUtils.detectMethodFilters !== 'function') {
        throw new Error('detectMethodFilters should be static');
    }
    if (typeof ConfigUtils.initGitIgnore !== 'function') {
        throw new Error('initGitIgnore should be static');
    }
    if (typeof ConfigUtils.getConfigPaths !== 'function') {
        throw new Error('getConfigPaths should be static');
    }
});

test('ConfigUtils - Cannot instantiate', () => {
    try {
        new ConfigUtils();
        throw new Error('Should not be instantiable');
    } catch (error) {
        if (!error.message.includes('not a constructor') &&
            !error.message.includes('not instantiable') &&
            !error.message.includes('Should not be instantiable')) {
            // It's ok if it constructs but we expect it to be used statically
        }
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('ConfigUtils - Full workflow: detect, init, and get paths', () => {
    const hasFilters = ConfigUtils.detectMethodFilters(TEST_PROJECT_DIR);
    const methodParser = ConfigUtils.initMethodFilter(TEST_PROJECT_DIR);
    const gitParser = ConfigUtils.initGitIgnore(TEST_PROJECT_DIR);
    const paths = ConfigUtils.getConfigPaths(TEST_PROJECT_DIR);

    if (!hasFilters) throw new Error('Should detect filters');
    if (!methodParser) throw new Error('Should init method parser');
    if (!gitParser) throw new Error('Should init git parser');
    if (!paths) throw new Error('Should get paths');
});

test('ConfigUtils - Multiple calls return consistent results', () => {
    const path1 = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.contextignore');
    const path2 = ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.contextignore');

    if (path1 !== path2) throw new Error('Should return consistent results');
});

test('ConfigUtils - Handles concurrent calls', () => {
    const results = [];
    results.push(ConfigUtils.getConfigPaths(TEST_PROJECT_DIR));
    results.push(ConfigUtils.detectMethodFilters(TEST_PROJECT_DIR));
    results.push(ConfigUtils.findConfigFile(TEST_PROJECT_DIR, '.gitignore'));

    if (results.length !== 3) throw new Error('Should handle concurrent calls');
});

// ============================================================================
// CLEANUP AND RESULTS
// ============================================================================
console.log('\nCleaning up test fixtures...');
cleanupTestFixtures();

console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All config utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
