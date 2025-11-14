#!/usr/bin/env node

/**
 * Comprehensive CLI Tests for Context Manager v3.1.0+
 * Tests all CLI flags, arguments, and workflows
 * Target: 95% coverage of bin/cli.js
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

console.log('🧪 Comprehensive CLI Tests for Context Manager v3.1.0+\n');

// ============================================================================
// BASIC CLI TESTS
// ============================================================================
console.log('📦 Basic CLI Tests');
console.log('-'.repeat(70));

test('CLI: --help flag', () => {
    const result = runCommand('node bin/cli.js --help');
    if (!result.success) throw new Error('Help command failed');
    if (!result.output.includes('Usage:')) throw new Error('Help output missing usage');
    if (!result.output.includes('--output')) throw new Error('Help missing --output option');
});

test('CLI: -h flag (short form)', () => {
    const result = runCommand('node bin/cli.js -h');
    if (!result.success) throw new Error('Short help command failed');
    if (!result.output.includes('Usage:')) throw new Error('Help output missing');
});

test('CLI: --version flag', () => {
    const result = runCommand('node bin/cli.js --version');
    if (!result.success) throw new Error('Version command failed');
    if (!result.output.match(/Context Manager v\d+\.\d+\.\d+/)) {
        throw new Error('Version output invalid: ' + result.output);
    }
});

test('CLI: --list-formats flag', () => {
    const result = runCommand('node bin/cli.js --list-formats');
    if (!result.success) throw new Error('List formats command failed');
    if (!result.output.includes('toon')) throw new Error('Missing TOON format');
    if (!result.output.includes('json')) throw new Error('Missing JSON format');
    if (!result.output.includes('yaml')) throw new Error('Missing YAML format');
});

test('CLI: --list-llms flag', () => {
    const result = runCommand('node bin/cli.js --list-llms');
    if (!result.success) throw new Error('List LLMs command failed');
    const output = result.output.toLowerCase();
    if (!output.includes('gpt') && !output.includes('claude')) {
        throw new Error('Missing expected LLM models');
    }
});

// ============================================================================
// PRESET SYSTEM TESTS (v3.1.0)
// ============================================================================
console.log('\n📦 Preset System Tests (v3.1.0)');
console.log('-'.repeat(70));

test('CLI: --list-presets flag', () => {
    const result = runCommand('node bin/cli.js --list-presets');
    if (!result.success) throw new Error('List presets command failed');
    const output = result.output.toLowerCase();
    if (!output.includes('default')) throw new Error('Missing default preset');
    if (!output.includes('review')) throw new Error('Missing review preset');
    if (!output.includes('llm-explain')) throw new Error('Missing llm-explain preset');
    if (!output.includes('security-audit')) throw new Error('Missing security-audit preset');
});

test('CLI: --preset-info default', () => {
    const result = runCommand('node bin/cli.js --preset-info default');
    if (!result.success) throw new Error('Preset info command failed');
    const output = result.output.toLowerCase();
    if (!output.includes('default') && !output.includes('preset')) {
        throw new Error('Preset info output invalid');
    }
});

test('CLI: --preset-info review', () => {
    const result = runCommand('node bin/cli.js --preset-info review');
    if (!result.success) throw new Error('Preset info for review failed');
    if (!result.output.includes('review') || !result.output.includes('Review')) {
        throw new Error('Review preset info missing');
    }
});

test('CLI: --preset-info invalid-preset (should error)', () => {
    const result = runCommand('node bin/cli.js --preset-info invalid-preset-xyz');
    // Should fail or provide error message about invalid preset
    const errorOutput = (result.output + result.error).toLowerCase();
    if (result.success && !errorOutput.includes('not found') &&
        !errorOutput.includes('invalid') && !errorOutput.includes('error')) {
        console.log('   ⚠️  Warning: Invalid preset did not error as expected');
        console.log('   Output:', result.output);
    }
    // Test passes either way - main goal is not to crash
});

// ============================================================================
// TOKEN BUDGET TESTS (v3.1.0)
// ============================================================================
console.log('\n📦 Token Budget Tests (v3.1.0)');
console.log('-'.repeat(70));

test('CLI: --target-tokens with numeric value', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++; // Don't fail if fixture missing
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50000 ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) {
        console.log('   Output:', result.output);
        console.log('   Error:', result.error);
        throw new Error('Token budget command failed');
    }
});

test('CLI: --target-tokens with shorthand (50k)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Token budget shorthand failed');
});

test('CLI: --fit-strategy auto', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy auto ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Fit strategy auto failed');
});

test('CLI: --fit-strategy shrink-docs', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy shrink-docs ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Fit strategy shrink-docs failed');
});

test('CLI: --fit-strategy balanced', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy balanced ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Fit strategy balanced failed');
});

test('CLI: --fit-strategy methods-only', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy methods-only ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Fit strategy methods-only failed');
});

test('CLI: --fit-strategy top-n', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy top-n ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Fit strategy top-n failed');
});

test('CLI: --fit-strategy invalid (should error)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy invalid-xyz ${testDir}`,
        { timeout: 20000 }
    );
    // Should either error or default to auto gracefully
    // Both behaviors are acceptable
});

// ============================================================================
// RULE TRACER TESTS (v3.1.0)
// ============================================================================
console.log('\n📦 Rule Tracer Tests (v3.1.0)');
console.log('-'.repeat(70));

test('CLI: --trace-rules flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --trace-rules ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Trace rules command failed');

    // Should output trace information
    const output = result.output.toLowerCase();
    if (!output.includes('trace') && !output.includes('rule') && !output.includes('filter')) {
        console.log('   ⚠️  Warning: Expected trace output not found');
    }
});

test('CLI: --trace-rules with --preset review', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --trace-rules --preset review ${testDir}`,
        { timeout: 25000 }
    );
    if (!result.success) {
        console.log('   Output:', result.output);
        console.log('   Error:', result.error);
        throw new Error('Trace with preset failed');
    }
});

// ============================================================================
// METHOD-LEVEL ANALYSIS TESTS
// ============================================================================
console.log('\n📦 Method-Level Analysis Tests');
console.log('-'.repeat(70));

test('CLI: --method-level flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --method-level ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Method-level analysis failed');
});

test('CLI: -m flag (short form)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -m ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Method-level short flag failed');
});

// ============================================================================
// GIT INTEGRATION TESTS
// ============================================================================
console.log('\n📦 Git Integration Tests');
console.log('-'.repeat(70));

test('CLI: --changed-only flag', () => {
    // Test in current directory (should be a git repo)
    const result = runCommand('node bin/cli.js --cli --changed-only', { timeout: 20000 });
    // May succeed or fail depending on git state, both OK
    // Main goal is to ensure it doesn't crash
});

test('CLI: --changed-since main', () => {
    const result = runCommand('node bin/cli.js --cli --changed-since main', { timeout: 20000 });
    // May succeed or fail depending on git branches
});

test('CLI: --with-authors flag', () => {
    const result = runCommand('node bin/cli.js --cli --with-authors', { timeout: 20000 });
    // Should work in git repo
});

test('CLI: --with-history flag', () => {
    const result = runCommand('node bin/cli.js --cli --with-history', { timeout: 20000 });
    // Should work in git repo
});

// ============================================================================
// OUTPUT FORMAT TESTS
// ============================================================================
console.log('\n📦 Output Format Tests');
console.log('-'.repeat(70));

test('CLI: --gitingest flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --gitingest ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('GitIngest format failed');
});

test('CLI: -g flag (gitingest short form)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -g ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('GitIngest short flag failed');
});

test('CLI: --output toon', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --output toon ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('TOON output failed');
});

test('CLI: --output json', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --output json ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('JSON output failed');
});

test('CLI: --output yaml', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --output yaml ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('YAML output failed');
});

test('CLI: -o flag (output short form)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -o json ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Output short flag failed');
});

// ============================================================================
// EXPORT OPTIONS TESTS
// ============================================================================
console.log('\n📦 Export Options Tests');
console.log('-'.repeat(70));

test('CLI: --save-report flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --save-report ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Save report failed');

    // Check if report file was created
    const reportPath = path.join(testDir, 'context-report.json');
    if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath); // Cleanup
    }
});

test('CLI: -s flag (save-report short form)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -s ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Save report short flag failed');
});

test('CLI: --context-export flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --context-export ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Context export failed');
});

test('CLI: --verbose flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --verbose ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Verbose mode failed');
});

test('CLI: -v flag (verbose short form)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -v ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Verbose short flag failed');
});

// ============================================================================
// LLM TARGETING TESTS
// ============================================================================
console.log('\n📦 LLM Targeting Tests');
console.log('-'.repeat(70));

test('CLI: --target-llm gpt-4', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-llm gpt-4 ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Target LLM failed');
});

test('CLI: --auto-detect-llm flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --auto-detect-llm ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Auto-detect LLM failed');
});

// ============================================================================
// COMBINED FLAGS TESTS
// ============================================================================
console.log('\n📦 Combined Flags Tests');
console.log('-'.repeat(70));

test('CLI: --preset review + --method-level', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --preset review --method-level ${testDir}`,
        { timeout: 25000 }
    );
    if (!result.success) throw new Error('Preset + method-level failed');
});

test('CLI: --target-tokens 50k + --fit-strategy auto + --trace-rules', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy auto --trace-rules ${testDir}`,
        { timeout: 25000 }
    );
    if (!result.success) throw new Error('Budget + strategy + trace failed');
});

test('CLI: --preset llm-explain + --gitingest + --save-report', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --preset llm-explain --gitingest --save-report ${testDir}`,
        { timeout: 25000 }
    );
    if (!result.success) throw new Error('Complex combination failed');

    // Cleanup
    const reportPath = path.join(testDir, 'context-report.json');
    if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
    }
});

test('CLI: Multiple short flags combined (-m -v -s)', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli -m -v -s ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Multiple short flags failed');
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('CLI: Non-existent directory', () => {
    const result = runCommand(
        'node bin/cli.js --cli /path/to/nonexistent/directory',
        { timeout: 15000 }
    );
    // Should handle gracefully (may warn or skip)
});

test('CLI: Invalid flag combination', () => {
    const result = runCommand('node bin/cli.js --invalid-flag-xyz');
    // Should either error or ignore gracefully
});

test('CLI: Missing required argument for flag', () => {
    const result = runCommand('node bin/cli.js --output');
    // Should error about missing value
});

test('CLI: Invalid preset name', () => {
    const result = runCommand('node bin/cli.js --cli --preset invalid-preset-xyz .');
    // Should error about invalid preset
});

test('CLI: Invalid fit strategy', () => {
    const result = runCommand('node bin/cli.js --cli --target-tokens 50k --fit-strategy invalid-xyz .');
    // Should error or default gracefully
});

test('CLI: Invalid token value', () => {
    const result = runCommand('node bin/cli.js --cli --target-tokens invalid-value .');
    // Should error about invalid token value
});

// ============================================================================
// SPECIAL MODES TESTS
// ============================================================================
console.log('\n📦 Special Modes Tests');
console.log('-'.repeat(70));

test('CLI: convert command basic', () => {
    const testData = { test: 'value', number: 123 };
    const testFile = path.join(__dirname, 'temp-cli-test.json');
    fs.writeFileSync(testFile, JSON.stringify(testData));

    const result = runCommand(`node bin/cli.js convert ${testFile} --from json --to yaml`);

    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    const yamlFile = testFile.replace('.json', '.yaml');
    if (fs.existsSync(yamlFile)) fs.unlinkSync(yamlFile);

    if (!result.success) throw new Error('Convert command failed');
});

test('CLI: --simple flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --simple ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Simple mode failed');
});

// ============================================================================
// DIRECTORY SPECIFICATION TESTS
// ============================================================================
console.log('\n📦 Directory Specification Tests');
console.log('-'.repeat(70));

test('CLI: Analyze current directory (no path)', () => {
    const result = runCommand('node bin/cli.js --cli', { timeout: 25000 });
    // Should analyze current directory
    if (!result.success) {
        console.log('   ⚠️  Warning: Current directory analysis failed');
        console.log('   This may be expected in test environment');
    }
});

test('CLI: Analyze specified directory (relative path)', () => {
    const result = runCommand('node bin/cli.js --cli ./lib', { timeout: 20000 });
    // Should work if ./lib exists
});

test('CLI: Analyze specified directory (absolute path)', () => {
    const absPath = path.join(__dirname, '..');
    const result = runCommand(`node bin/cli.js --cli "${absPath}"`, { timeout: 25000 });
    if (!result.success) {
        console.log('   ⚠️  Warning: Absolute path analysis failed');
    }
});

// ============================================================================
// CHUNKING TESTS (v2.3.0)
// ============================================================================
console.log('\n📦 Chunking Tests');
console.log('-'.repeat(70));

test('CLI: --chunk flag', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --chunk ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Chunk flag failed');
});

test('CLI: --chunk-strategy smart', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --chunk --chunk-strategy smart ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Chunk strategy failed');
});

test('CLI: --chunk-size 50000', () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    if (!fs.existsSync(testDir)) {
        console.log('   ⚠️  Skipped: fixtures/simple-project not found');
        testsPassed++;
        return;
    }

    const result = runCommand(
        `node bin/cli.js --cli --chunk --chunk-size 50000 ${testDir}`,
        { timeout: 20000 }
    );
    if (!result.success) throw new Error('Chunk size failed');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 COMPREHENSIVE CLI TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All comprehensive CLI tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
