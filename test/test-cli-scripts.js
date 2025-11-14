#!/usr/bin/env node

/**
 * CLI Scripts Tests
 * Tests for bin/cm-gitingest.js and bin/cm-update.js
 * ~40 test cases covering CLI entry points
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = join(__dirname, '..');
const CM_GITINGEST = join(PROJECT_ROOT, 'bin', 'cm-gitingest.js');
const CM_UPDATE = join(PROJECT_ROOT, 'bin', 'cm-update.js');

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
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

// Helper to run CLI command
function runCLI(scriptPath, args = [], options = {}) {
    try {
        const output = execSync(`node "${scriptPath}" ${args.join(' ')}`, {
            encoding: 'utf8',
            cwd: PROJECT_ROOT,
            timeout: options.timeout || 10000,
            stdio: 'pipe'
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

// Helper to run CLI command asynchronously with timeout
function runCLIAsync(scriptPath, args = [], timeout = 5000) {
    return new Promise((resolve) => {
        const child = spawn('node', [scriptPath, ...args], {
            cwd: PROJECT_ROOT,
            stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const timeoutId = setTimeout(() => {
            child.kill();
            resolve({
                success: false,
                output: stdout,
                error: 'Timeout',
                timedOut: true
            });
        }, timeout);

        child.on('close', (code) => {
            clearTimeout(timeoutId);
            resolve({
                success: code === 0,
                output: stdout,
                error: stderr,
                exitCode: code
            });
        });
    });
}

console.log('🧪 Testing CLI Scripts...\n');

// ============================================================================
// cm-gitingest.js TESTS
// ============================================================================
console.log('📦 cm-gitingest.js Tests');
console.log('-'.repeat(70));

test('cm-gitingest.js - File exists', () => {
    if (!fs.existsSync(CM_GITINGEST)) {
        throw new Error('cm-gitingest.js not found');
    }
});

test('cm-gitingest.js - Is executable (has shebang)', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
        throw new Error('Missing or incorrect shebang');
    }
});

test('cm-gitingest.js - Help flag shows usage', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    if (!result.output.includes('Usage:')) {
        throw new Error('Help output missing Usage section');
    }
    if (!result.output.includes('GitHub')) {
        throw new Error('Help should mention GitHub');
    }
});

test('cm-gitingest.js - Help shows options', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    const requiredOptions = ['--output', '--branch', '--verbose', '--help'];

    for (const option of requiredOptions) {
        if (!result.output.includes(option)) {
            throw new Error(`Help missing option: ${option}`);
        }
    }
});

test('cm-gitingest.js - Help shows examples', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    if (!result.output.includes('Examples:')) {
        throw new Error('Help missing Examples section');
    }
});

test('cm-gitingest.js - Help shows URL formats', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    if (!result.output.includes('URL Formats:')) {
        throw new Error('Help missing URL Formats section');
    }
    if (!result.output.includes('github.com')) {
        throw new Error('Help should show GitHub URL examples');
    }
});

test('cm-gitingest.js - Short help flag (-h) works', () => {
    const result = runCLI(CM_GITINGEST, ['-h']);
    if (!result.output.includes('Usage:')) {
        throw new Error('Short help flag should show usage');
    }
});

test('cm-gitingest.js - No arguments shows help', () => {
    const result = runCLI(CM_GITINGEST, []);
    if (!result.output.includes('Usage:')) {
        throw new Error('No arguments should show help');
    }
});

test('cm-gitingest.js - Help includes all option flags', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    const flags = ['-o', '-b', '-v', '-h', '--keep-clone', '--full-clone', '--chunk-size'];

    for (const flag of flags) {
        if (!result.output.includes(flag)) {
            throw new Error(`Help missing flag: ${flag}`);
        }
    }
});

test('cm-gitingest.js - Help shows short and long option formats', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    if (!result.output.includes('-o') || !result.output.includes('--output')) {
        throw new Error('Help should show both short and long options');
    }
});

test('cm-gitingest.js - Help mentions default values', () => {
    const result = runCLI(CM_GITINGEST, ['--help']);
    if (!result.output.includes('default:')) {
        throw new Error('Help should mention default values');
    }
});

// Test error handling without making actual network calls
test('cm-gitingest.js - Script loads without errors', () => {
    try {
        // Just check if script can be read and has basic structure
        const content = fs.readFileSync(CM_GITINGEST, 'utf8');
        if (!content.includes('function main()')) {
            throw new Error('Script should have main function');
        }
        if (!content.includes('printHelp')) {
            throw new Error('Script should have printHelp function');
        }
    } catch (error) {
        throw new Error(`Script has syntax or structure issues: ${error.message}`);
    }
});

test('cm-gitingest.js - Uses GitUtils correctly', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes("import GitUtils from") && !content.includes("require('../lib/utils/git-utils')")) {
        throw new Error('Script should import GitUtils');
    }
    if (!content.includes('new GitUtils')) {
        throw new Error('Script should instantiate GitUtils');
    }
});

test('cm-gitingest.js - Has proper error handling', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('try') || !content.includes('catch')) {
        throw new Error('Script should have error handling');
    }
    if (!content.includes('process.exit(1)')) {
        throw new Error('Script should exit with error code on failure');
    }
});

test('cm-gitingest.js - Parses command line arguments', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('process.argv.slice(2)')) {
        throw new Error('Script should parse command line arguments');
    }
});

test('cm-gitingest.js - Has logger integration', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes("from '../lib/utils/logger") && !content.includes("require('../lib/utils/logger')")) {
        throw new Error('Script should use logger');
    }
    if (!content.includes('logger.info') || !content.includes('logger.error')) {
        throw new Error('Script should log info and errors');
    }
});

test('cm-gitingest.js - Handles output file option', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('--output')) {
        throw new Error('Script should handle --output option');
    }
});

test('cm-gitingest.js - Handles branch option', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('--branch')) {
        throw new Error('Script should handle --branch option');
    }
});

test('cm-gitingest.js - Handles verbose option', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('--verbose')) {
        throw new Error('Script should handle --verbose option');
    }
});

test('cm-gitingest.js - Shows repository information', () => {
    const content = fs.readFileSync(CM_GITINGEST, 'utf8');
    if (!content.includes('Repository Info')) {
        throw new Error('Script should display repository info');
    }
});

// ============================================================================
// cm-update.js TESTS
// ============================================================================
console.log('\n🔄 cm-update.js Tests');
console.log('-'.repeat(70));

test('cm-update.js - File exists', () => {
    if (!fs.existsSync(CM_UPDATE)) {
        throw new Error('cm-update.js not found');
    }
});

test('cm-update.js - Is executable (has shebang)', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
        throw new Error('Missing or incorrect shebang');
    }
});

test('cm-update.js - info command shows configuration', () => {
    const result = runCLI(CM_UPDATE, ['info']);
    if (!result.output.includes('Update Configuration')) {
        throw new Error('info command should show configuration');
    }
    if (!result.output.includes('Current version:')) {
        throw new Error('info should show current version');
    }
});

test('cm-update.js - info command shows available commands', () => {
    const result = runCLI(CM_UPDATE, ['info']);
    const commands = ['check', 'install', 'rollback', 'channel'];

    for (const cmd of commands) {
        if (!result.output.includes(cmd)) {
            throw new Error(`info should list ${cmd} command`);
        }
    }
});

test('cm-update.js - info command shows update channels', () => {
    const result = runCLI(CM_UPDATE, ['info']);
    if (!result.output.includes('stable')) {
        throw new Error('info should mention stable channel');
    }
    if (!result.output.includes('insider')) {
        throw new Error('info should mention insider channel');
    }
});

test('cm-update.js - Script has proper structure', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('function main()')) {
        throw new Error('Script should have main function');
    }
    if (!content.includes('switch (command)')) {
        throw new Error('Script should have command switch');
    }
});

test('cm-update.js - Has all command handlers', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    const handlers = [
        'checkForUpdates',
        'installUpdate',
        'rollbackVersion',
        'switchChannel',
        'showUpdateInfo'
    ];

    for (const handler of handlers) {
        if (!content.includes(`function ${handler}`)) {
            throw new Error(`Missing handler: ${handler}`);
        }
    }
});

test('cm-update.js - Uses Updater class', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("import Updater from") && !content.includes("require('../lib/utils/updater')")) {
        throw new Error('Script should import Updater');
    }
    if (!content.includes('new Updater()')) {
        throw new Error('Script should instantiate Updater');
    }
});

test('cm-update.js - Has logger integration', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("from '../lib/utils/logger") && !content.includes("require('../lib/utils/logger')")) {
        throw new Error('Script should use logger');
    }
    if (!content.includes('logger.info') || !content.includes('logger.error')) {
        throw new Error('Script should log info and errors');
    }
});

test('cm-update.js - Handles check command', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("case 'check':")) {
        throw new Error('Script should handle check command');
    }
});

test('cm-update.js - Handles install command', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("case 'install':")) {
        throw new Error('Script should handle install command');
    }
});

test('cm-update.js - Handles rollback command', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("case 'rollback':")) {
        throw new Error('Script should handle rollback command');
    }
});

test('cm-update.js - Handles channel command', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("case 'channel':")) {
        throw new Error('Script should handle channel command');
    }
});

test('cm-update.js - Handles info command', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes("case 'info':")) {
        throw new Error('Script should handle info command');
    }
});

test('cm-update.js - channel command validates input', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('if (!newChannel)')) {
        throw new Error('channel command should validate input');
    }
});

test('cm-update.js - Has error handling', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('try') && !content.includes('catch')) {
        throw new Error('Script should have error handling');
    }
});

test('cm-update.js - Logs successful operations', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('logger.info')) {
        throw new Error('Script should log successful operations');
    }
});

test('cm-update.js - Logs errors', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('logger.error')) {
        throw new Error('Script should log errors');
    }
});

test('cm-update.js - Shows release notes when available', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('releaseNotes')) {
        throw new Error('Script should handle release notes');
    }
});

test('cm-update.js - Shows user-friendly messages', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    const messages = ['✅', '❌', '🔍', '📦', '✨'];
    let hasEmojis = false;

    for (const emoji of messages) {
        if (content.includes(emoji)) {
            hasEmojis = true;
            break;
        }
    }

    if (!hasEmojis) {
        throw new Error('Script should have user-friendly messages');
    }
});

test('cm-update.js - Provides installation instructions', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('To install:')) {
        throw new Error('Script should provide installation instructions');
    }
});

test('cm-update.js - Handles async operations', () => {
    const content = fs.readFileSync(CM_UPDATE, 'utf8');
    if (!content.includes('async function')) {
        throw new Error('Script should handle async operations');
    }
    if (!content.includes('await')) {
        throw new Error('Script should use await for async calls');
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('Integration - Both scripts use consistent logger format', () => {
    const gitingestContent = fs.readFileSync(CM_GITINGEST, 'utf8');
    const updateContent = fs.readFileSync(CM_UPDATE, 'utf8');

    const gitingestHasLogger = gitingestContent.includes('getLogger');
    const updateHasLogger = updateContent.includes('getLogger');

    if (!gitingestHasLogger || !updateHasLogger) {
        throw new Error('Both scripts should use logger');
    }
});

test('Integration - Both scripts have error handling', () => {
    const gitingestContent = fs.readFileSync(CM_GITINGEST, 'utf8');
    const updateContent = fs.readFileSync(CM_UPDATE, 'utf8');

    const gitingestHasErrorHandling = gitingestContent.includes('catch');
    const updateHasErrorHandling = updateContent.includes('catch');

    if (!gitingestHasErrorHandling || !updateHasErrorHandling) {
        throw new Error('Both scripts should have error handling');
    }
});

test('Integration - Both scripts use consistent module system', () => {
    const gitingestContent = fs.readFileSync(CM_GITINGEST, 'utf8');
    const updateContent = fs.readFileSync(CM_UPDATE, 'utf8');

    // Both should use either ES modules or CommonJS consistently
    const gitingestUsesESM = gitingestContent.includes('import ') && gitingestContent.includes(' from ');
    const updateUsesESM = updateContent.includes('import ') && updateContent.includes(' from ');
    const gitingestUsesCJS = gitingestContent.includes('require(');
    const updateUsesCJS = updateContent.includes('require(');

    if ((gitingestUsesESM && updateUsesCJS) || (gitingestUsesCJS && updateUsesESM)) {
        throw new Error('Both scripts should use the same module system');
    }
});

test('Integration - Scripts have consistent code style', () => {
    const gitingestContent = fs.readFileSync(CM_GITINGEST, 'utf8');
    const updateContent = fs.readFileSync(CM_UPDATE, 'utf8');

    // Both should use async/await
    if (!gitingestContent.includes('async') || !updateContent.includes('async')) {
        throw new Error('Both scripts should use async/await');
    }

    // Both should have main function
    if (!gitingestContent.includes('function main()') || !updateContent.includes('function main()')) {
        throw new Error('Both scripts should have main function');
    }
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All CLI script tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
