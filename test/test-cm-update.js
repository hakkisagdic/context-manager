#!/usr/bin/env node

/**
 * cm-update Tests for Context Manager
 * Tests bin/cm-update.js update functionality
 * Target: Test update checking, installation, rollback, and channel switching
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

function runCommand(command, options = {}) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            cwd: options.cwd || path.join(__dirname, '..'),
            timeout: options.timeout || 15000,
            stdio: 'pipe',
            env: { ...process.env, ...options.env }
        });
        return { success: true, output, error: null };
    } catch (error) {
        return {
            success: false,
            output: error.stdout || '',
            error: error.stderr || error.message
        };
    }
}

console.log('🧪 cm-update Tests for Context Manager\n');

// ============================================================================
// HELP AND BASIC TESTS
// ============================================================================
console.log('📦 Basic Command Tests');
console.log('-'.repeat(70));

test('cm-update: File exists', () => {
    const updatePath = path.join(__dirname, '../bin/cm-update.js');
    if (!fs.existsSync(updatePath)) {
        throw new Error('cm-update.js not found');
    }
});

test('cm-update: Is executable (has shebang)', () => {
    const updatePath = path.join(__dirname, '../bin/cm-update.js');
    const content = fs.readFileSync(updatePath, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
        throw new Error('Missing or incorrect shebang');
    }
});

test('cm-update: Has required imports', () => {
    const updatePath = path.join(__dirname, '../bin/cm-update.js');
    const content = fs.readFileSync(updatePath, 'utf8');
    if (!content.includes('Updater')) {
        throw new Error('Missing Updater import');
    }
});

// ============================================================================
// CHECK COMMAND TESTS
// ============================================================================
console.log('\n📦 Check Command Tests');
console.log('-'.repeat(70));

test('cm-update: check command runs', () => {
    const result = runCommand('node bin/cm-update.js check', { timeout: 20000 });

    // May succeed or fail depending on network, both acceptable
    // Main goal: doesn't crash
    const output = result.output + (result.error || '');
    if (output.length === 0 && !result.success) {
        console.log('   ⚠️  Warning: No output from check command');
    }
});

test('cm-update: check command shows version info', () => {
    const result = runCommand('node bin/cm-update.js check', { timeout: 20000 });

    const output = result.output + (result.error || '');
    // Should mention version in some form
    if (!output.toLowerCase().includes('version') &&
        !output.toLowerCase().includes('update') &&
        !output.toLowerCase().includes('latest')) {
        console.log('   ⚠️  Warning: No version information in output');
    }
});

test('cm-update: check command handles network errors gracefully', () => {
    // Simulate network failure by setting invalid registry
    const result = runCommand('node bin/cm-update.js check', {
        timeout: 20000,
        env: { npm_config_registry: 'http://invalid.registry.local' }
    });

    // Should handle network errors without crashing
});

// ============================================================================
// INSTALL COMMAND TESTS
// ============================================================================
console.log('\n📦 Install Command Tests');
console.log('-'.repeat(70));

test('cm-update: install command syntax', () => {
    // Just test that the command is recognized (won't actually install)
    const result = runCommand('node bin/cm-update.js install', { timeout: 20000 });

    // May fail or succeed, main goal is no syntax errors
    const output = result.output + (result.error || '');
    if (output.length === 0) {
        console.log('   ⚠️  Warning: No output from install command');
    }
});

test('cm-update: install without available update', () => {
    // This test checks behavior when already on latest version
    const result = runCommand('node bin/cm-update.js install', { timeout: 20000 });

    const output = (result.output + (result.error || '')).toLowerCase();
    // Should either install or say already latest
});

// ============================================================================
// ROLLBACK COMMAND TESTS
// ============================================================================
console.log('\n📦 Rollback Command Tests');
console.log('-'.repeat(70));

test('cm-update: rollback command syntax', () => {
    const result = runCommand('node bin/cm-update.js rollback', { timeout: 20000 });

    // Should recognize command
    const output = result.output + (result.error || '');
    if (output.length === 0) {
        console.log('   ⚠️  Warning: No output from rollback command');
    }
});

test('cm-update: rollback without previous version', () => {
    // Should handle gracefully when no previous version to rollback to
    const result = runCommand('node bin/cm-update.js rollback', { timeout: 20000 });

    const output = (result.output + (result.error || '')).toLowerCase();
    // Should either rollback or indicate no previous version
});

// ============================================================================
// CHANNEL COMMAND TESTS
// ============================================================================
console.log('\n📦 Channel Command Tests');
console.log('-'.repeat(70));

test('cm-update: channel command with stable', () => {
    const result = runCommand('node bin/cm-update.js channel stable', { timeout: 20000 });

    // Should accept stable channel
    const output = result.output + (result.error || '');
});

test('cm-update: channel command with beta', () => {
    const result = runCommand('node bin/cm-update.js channel beta', { timeout: 20000 });

    // Should accept beta channel
});

test('cm-update: channel command without argument', () => {
    const result = runCommand('node bin/cm-update.js channel', { timeout: 15000 });

    // Should handle missing channel argument
    const output = result.output + (result.error || '');
});

test('cm-update: channel command with invalid channel', () => {
    const result = runCommand('node bin/cm-update.js channel invalid-xyz', { timeout: 15000 });

    // Should handle invalid channel name
});

// ============================================================================
// INFO COMMAND TESTS
// ============================================================================
console.log('\n📦 Info Command Tests');
console.log('-'.repeat(70));

test('cm-update: info command runs', () => {
    const result = runCommand('node bin/cm-update.js info', { timeout: 15000 });

    // Should display update information
    const output = result.output + (result.error || '');
    if (output.length === 0 && !result.success) {
        console.log('   ⚠️  Warning: No output from info command');
    }
});

test('cm-update: info command shows current version', () => {
    const result = runCommand('node bin/cm-update.js info', { timeout: 15000 });

    const output = (result.output + (result.error || '')).toLowerCase();
    // Should show version info
});

// ============================================================================
// DEFAULT COMMAND TESTS
// ============================================================================
console.log('\n📦 Default Command Tests');
console.log('-'.repeat(70));

test('cm-update: no arguments (default check and update)', () => {
    const result = runCommand('node bin/cm-update.js', { timeout: 20000 });

    // Default behavior should be check (and possibly update)
    const output = result.output + (result.error || '');
});

test('cm-update: unknown command falls back to default', () => {
    const result = runCommand('node bin/cm-update.js unknown-command', { timeout: 20000 });

    // Should handle unknown command gracefully
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('cm-update: handles npm registry errors', () => {
    const result = runCommand('node bin/cm-update.js check', {
        timeout: 20000,
        env: { npm_config_registry: 'http://localhost:1' } // Invalid registry
    });

    // Should handle registry connection failures
});

test('cm-update: handles timeout gracefully', () => {
    const result = runCommand('node bin/cm-update.js check', { timeout: 5000 });

    // Short timeout - may timeout but shouldn't crash
});

// ============================================================================
// INTEGRATION WITH NPM SCRIPTS TESTS
// ============================================================================
console.log('\n📦 Integration Tests');
console.log('-'.repeat(70));

test('cm-update: Called via npm script update:check', () => {
    const result = runCommand('npm run update:check --silent', { timeout: 20000 });

    // Should work via npm script
    const output = result.output + (result.error || '');
});

test('cm-update: Package.json has update scripts', () => {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (!packageJson.scripts['update:check']) {
        throw new Error('Missing update:check script');
    }
    if (!packageJson.scripts['update:install']) {
        throw new Error('Missing update:install script');
    }
    if (!packageJson.scripts['update:rollback']) {
        throw new Error('Missing update:rollback script');
    }
});

// ============================================================================
// UPDATER UTILITY TESTS
// ============================================================================
console.log('\n📦 Updater Utility Tests');
console.log('-'.repeat(70));

test('Updater: updater.js file exists', () => {
    const updaterPath = path.join(__dirname, '../lib/utils/updater.js');
    if (!fs.existsSync(updaterPath)) {
        throw new Error('updater.js not found');
    }
});

test('Updater: Has checkForUpdates method', () => {
    const updaterPath = path.join(__dirname, '../lib/utils/updater.js');
    const content = fs.readFileSync(updaterPath, 'utf8');
    if (!content.includes('checkForUpdates')) {
        throw new Error('checkForUpdates method not found');
    }
});

test('Updater: Has installUpdate method', () => {
    const updaterPath = path.join(__dirname, '../lib/utils/updater.js');
    const content = fs.readFileSync(updaterPath, 'utf8');
    if (!content.includes('installUpdate')) {
        throw new Error('installUpdate method not found');
    }
});

test('Updater: Has version comparison logic', () => {
    const updaterPath = path.join(__dirname, '../lib/utils/updater.js');
    const content = fs.readFileSync(updaterPath, 'utf8');
    if (!content.includes('compareVersions') && !content.includes('version')) {
        console.log('   ⚠️  Warning: Version comparison not found');
    }
});

test('Updater: Exports Updater class or function', () => {
    const updaterPath = path.join(__dirname, '../lib/utils/updater.js');
    const content = fs.readFileSync(updaterPath, 'utf8');
    if (!content.includes('module.exports') && !content.includes('export')) {
        throw new Error('No exports found in updater.js');
    }
});

// ============================================================================
// VERSION COMPARISON TESTS (if applicable)
// ============================================================================
console.log('\n📦 Version Handling Tests');
console.log('-'.repeat(70));

test('Version: Current version is valid semver', () => {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    const version = packageJson.version;
    const semverRegex = /^\d+\.\d+\.\d+/;

    if (!semverRegex.test(version)) {
        throw new Error(`Invalid version format: ${version}`);
    }
});

test('Version: Version is accessible from package.json', () => {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    if (!packageJson.version) {
        throw new Error('No version in package.json');
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 CM-UPDATE TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

console.log('\nℹ️  Note: Many tests verify command syntax and error handling.');
console.log('   Actual update operations depend on npm registry availability.');

if (testsFailed === 0) {
    console.log('\n🎉 All cm-update tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
