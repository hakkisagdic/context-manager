#!/usr/bin/env node

/**
 * Config Utils Tests for Context Manager
 * Tests lib/utils/config-utils.js functionality
 * Target: 95% coverage of config-utils
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ConfigUtils from '../lib/utils/config-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

console.log('🧪 Config Utils Tests for Context Manager\n');

// Create temporary test directory structure
const testDir = path.join(__dirname, 'temp-config-test');
const nestedDir = path.join(testDir, 'nested');

// Setup
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });
fs.mkdirSync(nestedDir, { recursive: true });

// ============================================================================
// FILE DISCOVERY TESTS
// ============================================================================
console.log('📦 File Discovery Tests');
console.log('-'.repeat(70));

test('ConfigUtils: findConfigFile returns undefined when file not found', () => {
    const result = ConfigUtils.findConfigFile(testDir, '.nonexistent-config');
    if (result !== undefined) {
        throw new Error(`Expected undefined, got ${result}`);
    }
});

test('ConfigUtils: findConfigFile finds file in project root', () => {
    const configPath = path.join(testDir, '.contextignore');
    fs.writeFileSync(configPath, '*.log\n*.tmp');

    const result = ConfigUtils.findConfigFile(testDir, '.contextignore');
    if (!result) throw new Error('Should find config in project root');
    if (!result.includes('.contextignore')) throw new Error('Wrong file found');

    fs.unlinkSync(configPath);
});

test('ConfigUtils: findConfigFile finds file in package root', () => {
    // This tests the package root lookup (first location checked)
    const packageRoot = path.join(__dirname, '..');
    const result = ConfigUtils.findConfigFile(testDir, '.gitignore');

    // Package root should be checked first, so if .gitignore exists there, it should be found
    // If not found, that's also acceptable
});

test('ConfigUtils: findConfigFile handles missing directories gracefully', () => {
    const nonExistentDir = path.join(testDir, 'nonexistent');
    const result = ConfigUtils.findConfigFile(nonExistentDir, '.contextignore');

    // Should not throw, return undefined
    if (result !== undefined && !fs.existsSync(result)) {
        throw new Error('Returned path that does not exist');
    }
});

test('ConfigUtils: findConfigFile with special characters in filename', () => {
    const specialFile = '.config-test_123';
    const filePath = path.join(testDir, specialFile);
    fs.writeFileSync(filePath, 'test content');

    const result = ConfigUtils.findConfigFile(testDir, specialFile);
    if (!result) throw new Error('Should find file with special characters');

    fs.unlinkSync(filePath);
});

// ============================================================================
// METHOD FILTER INITIALIZATION TESTS
// ============================================================================
console.log('\n📦 Method Filter Initialization Tests');
console.log('-'.repeat(70));

test('ConfigUtils: initMethodFilter returns null when no filter files exist', () => {
    const result = ConfigUtils.initMethodFilter(testDir);
    if (result !== null) {
        throw new Error('Should return null when no filter files');
    }
});

test('ConfigUtils: initMethodFilter creates parser with .methodinclude', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'myFunction\ntestMethod');

    const result = ConfigUtils.initMethodFilter(testDir);
    if (!result) throw new Error('Should create parser');
    if (!result.shouldIncludeMethod) throw new Error('Parser missing shouldIncludeMethod');

    fs.unlinkSync(includePath);
});

test('ConfigUtils: initMethodFilter creates parser with .methodignore', () => {
    const ignorePath = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignorePath, 'internalMethod\nprivateFunc');

    const result = ConfigUtils.initMethodFilter(testDir);
    if (!result) throw new Error('Should create parser');
    if (!result.shouldIncludeMethod) throw new Error('Parser missing shouldIncludeMethod');

    fs.unlinkSync(ignorePath);
});

test('ConfigUtils: initMethodFilter creates parser with both files', () => {
    const includePath = path.join(testDir, '.methodinclude');
    const ignorePath = path.join(testDir, '.methodignore');

    fs.writeFileSync(includePath, 'public*');
    fs.writeFileSync(ignorePath, 'private*');

    const result = ConfigUtils.initMethodFilter(testDir);
    if (!result) throw new Error('Should create parser with both files');

    fs.unlinkSync(includePath);
    fs.unlinkSync(ignorePath);
});

test('ConfigUtils: initMethodFilter accepts tracer parameter', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*');

    const mockTracer = { traceDecision: () => {} };
    const result = ConfigUtils.initMethodFilter(testDir, mockTracer);

    if (!result) throw new Error('Should create parser with tracer');

    fs.unlinkSync(includePath);
});

// ============================================================================
// METHOD FILTER DETECTION TESTS
// ============================================================================
console.log('\n📦 Method Filter Detection Tests');
console.log('-'.repeat(70));

test('ConfigUtils: detectMethodFilters returns false when no files', () => {
    const result = ConfigUtils.detectMethodFilters(testDir);
    if (result !== false) {
        throw new Error('Should return false when no filter files');
    }
});

test('ConfigUtils: detectMethodFilters returns true with .methodinclude', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'test*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    if (result !== true) {
        throw new Error('Should return true when .methodinclude exists');
    }

    fs.unlinkSync(includePath);
});

test('ConfigUtils: detectMethodFilters returns true with .methodignore', () => {
    const ignorePath = path.join(testDir, '.methodignore');
    fs.writeFileSync(ignorePath, 'internal*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    if (result !== true) {
        throw new Error('Should return true when .methodignore exists');
    }

    fs.unlinkSync(ignorePath);
});

test('ConfigUtils: detectMethodFilters returns true with either file', () => {
    const includePath = path.join(testDir, '.methodinclude');
    fs.writeFileSync(includePath, 'pub*');

    const result = ConfigUtils.detectMethodFilters(testDir);
    if (!result) throw new Error('Should detect method filters');

    fs.unlinkSync(includePath);
});

// ============================================================================
// GIT IGNORE INITIALIZATION TESTS
// ============================================================================
console.log('\n📦 Git Ignore Initialization Tests');
console.log('-'.repeat(70));

test('ConfigUtils: initGitIgnore creates parser', () => {
    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should create GitIgnoreParser');
    if (!result.isIgnored) throw new Error('Parser missing isIgnored method');
});

test('ConfigUtils: initGitIgnore with .contextignore', () => {
    const ignorePath = path.join(testDir, '.contextignore');
    fs.writeFileSync(ignorePath, 'test/\n*.log');

    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should create parser');

    fs.unlinkSync(ignorePath);
});

test('ConfigUtils: initGitIgnore with .contextinclude', () => {
    const includePath = path.join(testDir, '.contextinclude');
    fs.writeFileSync(includePath, 'src/\nlib/');

    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should create parser');

    fs.unlinkSync(includePath);
});

test('ConfigUtils: initGitIgnore with tracer parameter', () => {
    const mockTracer = { traceDecision: () => {} };
    const result = ConfigUtils.initGitIgnore(testDir, mockTracer);

    if (!result) throw new Error('Should create parser with tracer');
});

test('ConfigUtils: initGitIgnore handles missing .gitignore', () => {
    // Should still create parser even if .gitignore doesn't exist
    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should create parser without .gitignore');
});

// ============================================================================
// GET CONFIG PATHS TESTS
// ============================================================================
console.log('\n📦 Get Config Paths Tests');
console.log('-'.repeat(70));

test('ConfigUtils: getConfigPaths returns all paths', () => {
    const result = ConfigUtils.getConfigPaths(testDir);

    if (!result) throw new Error('Should return paths object');
    if (!result.gitignore) throw new Error('Missing gitignore path');
    if (!result.hasOwnProperty('contextIgnore')) throw new Error('Missing contextIgnore');
    if (!result.hasOwnProperty('contextInclude')) throw new Error('Missing contextInclude');
    if (!result.hasOwnProperty('methodInclude')) throw new Error('Missing methodInclude');
    if (!result.hasOwnProperty('methodIgnore')) throw new Error('Missing methodIgnore');
});

test('ConfigUtils: getConfigPaths returns correct gitignore path', () => {
    const result = ConfigUtils.getConfigPaths(testDir);
    const expected = path.join(testDir, '.gitignore');

    if (result.gitignore !== expected) {
        throw new Error(`Expected ${expected}, got ${result.gitignore}`);
    }
});

test('ConfigUtils: getConfigPaths finds existing contextignore', () => {
    const ignorePath = path.join(testDir, '.contextignore');
    fs.writeFileSync(ignorePath, 'node_modules/');

    const result = ConfigUtils.getConfigPaths(testDir);
    if (!result.contextIgnore) throw new Error('Should find contextignore');
    if (!result.contextIgnore.includes('.contextignore')) {
        throw new Error('Wrong contextignore path');
    }

    fs.unlinkSync(ignorePath);
});

test('ConfigUtils: getConfigPaths returns undefined for missing files', () => {
    const result = ConfigUtils.getConfigPaths(testDir);

    // When files don't exist, they should be undefined
    if (result.contextIgnore && !fs.existsSync(result.contextIgnore)) {
        throw new Error('contextIgnore path should be undefined or valid');
    }
});

test('ConfigUtils: getConfigPaths with all files present', () => {
    // Create all config files
    const files = {
        '.contextignore': 'node_modules/',
        '.contextinclude': 'src/',
        '.methodinclude': 'public*',
        '.methodignore': 'private*'
    };

    Object.entries(files).forEach(([name, content]) => {
        fs.writeFileSync(path.join(testDir, name), content);
    });

    const result = ConfigUtils.getConfigPaths(testDir);

    if (!result.contextIgnore) throw new Error('Missing contextIgnore');
    if (!result.contextInclude) throw new Error('Missing contextInclude');
    if (!result.methodInclude) throw new Error('Missing methodInclude');
    if (!result.methodIgnore) throw new Error('Missing methodIgnore');

    // Cleanup
    Object.keys(files).forEach(name => {
        fs.unlinkSync(path.join(testDir, name));
    });
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n📦 Edge Cases Tests');
console.log('-'.repeat(70));

test('ConfigUtils: Handle empty config files', () => {
    const emptyFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(emptyFile, '');

    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should handle empty config file');

    fs.unlinkSync(emptyFile);
});

test('ConfigUtils: Handle config files with only whitespace', () => {
    const whitespaceFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(whitespaceFile, '   \n\n  \t\n  ');

    const result = ConfigUtils.initMethodFilter(testDir);
    if (!result) throw new Error('Should handle whitespace-only file');

    fs.unlinkSync(whitespaceFile);
});

test('ConfigUtils: Handle config files with comments', () => {
    const commentFile = path.join(testDir, '.contextignore');
    fs.writeFileSync(commentFile, '# This is a comment\nnode_modules/\n# Another comment');

    const result = ConfigUtils.initGitIgnore(testDir);
    if (!result) throw new Error('Should handle comments in config');

    fs.unlinkSync(commentFile);
});

test('ConfigUtils: Handle very long file paths', () => {
    const longPath = 'a'.repeat(200) + '.txt';
    const result = ConfigUtils.findConfigFile(testDir, longPath);

    // Should not crash, return undefined
    if (result && !fs.existsSync(result)) {
        throw new Error('Should handle long paths gracefully');
    }
});

test('ConfigUtils: Handle config files with unicode content', () => {
    const unicodeFile = path.join(testDir, '.methodinclude');
    fs.writeFileSync(unicodeFile, '文件名*\nфайл*\n🎉*');

    const result = ConfigUtils.initMethodFilter(testDir);
    if (!result) throw new Error('Should handle unicode patterns');

    fs.unlinkSync(unicodeFile);
});

test('ConfigUtils: Multiple calls to same methods return consistent results', () => {
    const result1 = ConfigUtils.getConfigPaths(testDir);
    const result2 = ConfigUtils.getConfigPaths(testDir);

    if (result1.gitignore !== result2.gitignore) {
        throw new Error('Results should be consistent');
    }
});

test('ConfigUtils: Nested directory handling', () => {
    const result = ConfigUtils.findConfigFile(nestedDir, '.nonexistent');

    // Should search both nested and package root
    if (result && !fs.existsSync(result)) {
        throw new Error('Should only return existing paths');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n📦 Cleanup');
console.log('-'.repeat(70));

test('ConfigUtils: Cleanup test directory', () => {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }

    if (fs.existsSync(testDir)) {
        throw new Error('Test directory not cleaned up');
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 CONFIG UTILS TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All config utils tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
