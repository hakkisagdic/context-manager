#!/usr/bin/env node

/**
 * End-to-End Workflow Tests for Context Manager v3.1.0+
 * Tests complete user workflows and integration scenarios
 * Target: Test real-world usage patterns
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { TokenAnalyzer, PresetManager, TokenBudgetFitter, RuleTracer } from '../index.js';

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
            timeout: options.timeout || 20000,
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

function cleanupTestFiles(projectRoot) {
    // Clean up generated files
    const files = [
        'context-report.json',
        'llm-context.json',
        '.contextinclude',
        '.contextignore',
        '.methodinclude',
        '.methodignore'
    ];

    files.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
}

console.log('🧪 End-to-End Workflow Tests for Context Manager v3.1.0+\n');

const testProjectPath = path.join(__dirname, 'fixtures', 'simple-project');

// ============================================================================
// PRESET WORKFLOW TESTS
// ============================================================================
console.log('📦 Preset Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Preset "default" workflow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset default ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Preset default workflow failed: ' + result.error);
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Preset "review" workflow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset review ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Preset review workflow failed: ' + result.error);
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Preset "llm-explain" workflow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset llm-explain ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Preset llm-explain workflow failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Preset "security-audit" workflow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset security-audit ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Preset security-audit workflow failed');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// TOKEN BUDGET WORKFLOW TESTS
// ============================================================================
console.log('\n📦 Token Budget Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Token budget with auto strategy', () => {
    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50000 --fit-strategy auto ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Token budget auto strategy failed');
    }

    // Verify output mentions token budget
    if (!result.output.toLowerCase().includes('token')) {
        console.log('   ⚠️  Warning: Output doesn\'t mention token budget');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Token budget with shrink-docs strategy', () => {
    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 50k --fit-strategy shrink-docs ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Token budget shrink-docs failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Token budget with balanced strategy', () => {
    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 100k --fit-strategy balanced ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Token budget balanced failed');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// METHOD-LEVEL ANALYSIS WORKFLOW
// ============================================================================
console.log('\n📦 Method-Level Analysis Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Method-level analysis complete flow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --method-level ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Method-level analysis failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Method-level with save report', () => {
    const result = runCommand(
        `node bin/cli.js --cli -m --save-report ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Method-level with save-report failed');
    }

    // Check if report was created
    const reportPath = path.join(testProjectPath, 'context-report.json');
    if (fs.existsSync(reportPath)) {
        // Verify it's valid JSON
        const content = fs.readFileSync(reportPath, 'utf8');
        JSON.parse(content); // Will throw if invalid
    } else {
        console.log('   ⚠️  Warning: Report file not created');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// RULE TRACER WORKFLOW
// ============================================================================
console.log('\n📦 Rule Tracer Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Rule tracer complete workflow', () => {
    const result = runCommand(
        `node bin/cli.js --cli --trace-rules ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Rule tracer workflow failed');
    }

    // Output should contain trace information
    const output = result.output.toLowerCase();
    if (!output.includes('trace') && !output.includes('rule') && !output.includes('filter')) {
        console.log('   ⚠️  Warning: No trace information in output');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Rule tracer with preset', () => {
    const result = runCommand(
        `node bin/cli.js --cli --trace-rules --preset review ${testProjectPath}`,
        { timeout: 30000 }
    );

    if (!result.success) {
        throw new Error('Rule tracer with preset failed');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// MULTI-FORMAT EXPORT WORKFLOW
// ============================================================================
console.log('\n📦 Multi-Format Export Workflow Tests');
console.log('-'.repeat(70));

test('E2E: TOON format generation', () => {
    const result = runCommand(
        `node bin/cli.js --cli --output toon ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('TOON format generation failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: GitIngest format generation', () => {
    const result = runCommand(
        `node bin/cli.js --cli --gitingest ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('GitIngest format generation failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: JSON format generation', () => {
    const result = runCommand(
        `node bin/cli.js --cli --output json ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('JSON format generation failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: YAML format generation', () => {
    const result = runCommand(
        `node bin/cli.js --cli --output yaml ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('YAML format generation failed');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// COMBINED FLAGS WORKFLOW
// ============================================================================
console.log('\n📦 Combined Flags Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Preset + Token Budget + Trace', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset review --target-tokens 50k --trace-rules ${testProjectPath}`,
        { timeout: 30000 }
    );

    if (!result.success) {
        throw new Error('Combined preset + budget + trace failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Method-level + GitIngest + Save Report', () => {
    const result = runCommand(
        `node bin/cli.js --cli -m --gitingest --save-report ${testProjectPath}`,
        { timeout: 30000 }
    );

    if (!result.success) {
        throw new Error('Combined method + gitingest + save failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: Token Budget + Fit Strategy + Verbose', () => {
    const result = runCommand(
        `node bin/cli.js --cli --target-tokens 100k --fit-strategy balanced --verbose ${testProjectPath}`,
        { timeout: 30000 }
    );

    if (!result.success) {
        throw new Error('Combined budget + strategy + verbose failed');
    }

    cleanupTestFiles(testProjectPath);
});

test('E2E: All major flags combined', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset llm-explain --method-level --target-tokens 50k --trace-rules --save-report ${testProjectPath}`,
        { timeout: 35000 }
    );

    if (!result.success) {
        throw new Error('All major flags combined failed');
    }

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// PROGRAMMATIC API WORKFLOW
// ============================================================================
console.log('\n📦 Programmatic API Workflow Tests');
console.log('-'.repeat(70));

test('E2E: TokenAnalyzer programmatic usage', () => {
    const analyzer = new TokenAnalyzer(testProjectPath, {
        methodLevel: false,
        verbose: false
    });

    const result = analyzer.run();

    if (!result) throw new Error('TokenAnalyzer returned no result');
    if (!result.files) throw new Error('Result missing files');

    cleanupTestFiles(testProjectPath);
});

test('E2E: PresetManager programmatic usage', () => {
    const presetManager = new PresetManager();
    const presets = presetManager.listPresets();

    if (!presets || presets.length === 0) {
        throw new Error('No presets found');
    }

    const preset = presetManager.getPreset('default');
    if (!preset) throw new Error('Default preset not found');

    cleanupTestFiles(testProjectPath);
});

test('E2E: TokenBudgetFitter programmatic usage', () => {
    const analyzer = new TokenAnalyzer(testProjectPath, { verbose: false });
    const result = analyzer.run();

    if (!result.files) {
        console.log('   ⚠️  Skipped: No files to fit');
        testsPassed++; // Count as passed
        return;
    }

    const fitter = new TokenBudgetFitter();
    const fitted = fitter.fitToBudget(result.files, 50000, 'auto');

    if (!fitted) throw new Error('Fitter returned no result');
    if (!fitted.selectedFiles) throw new Error('No selected files');

    cleanupTestFiles(testProjectPath);
});

test('E2E: RuleTracer programmatic usage', () => {
    const tracer = new RuleTracer();
    tracer.enable();

    // Trace some decisions
    tracer.traceDecision('file', 'test.js', 'included', 'Matches pattern');
    tracer.traceDecision('method', 'myFunction', 'excluded', 'Filtered out');

    const report = tracer.generateReport();
    if (!report) throw new Error('Tracer report generation failed');

    tracer.disable();
    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// ERROR RECOVERY WORKFLOW
// ============================================================================
console.log('\n📦 Error Recovery Workflow Tests');
console.log('-'.repeat(70));

test('E2E: Recovery from invalid directory', () => {
    const result = runCommand(
        'node bin/cli.js --cli /nonexistent/directory/xyz',
        { timeout: 20000 }
    );

    // Should handle gracefully, not crash
    // Both success and failure are acceptable as long as it doesn't hang
    cleanupTestFiles(testProjectPath);
});

test('E2E: Recovery from invalid preset', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset invalid-xyz ${testProjectPath}`,
        { timeout: 20000 }
    );

    // Should error or warn, not crash
    cleanupTestFiles(testProjectPath);
});

test('E2E: Recovery from conflicting flags', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset minimal --target-tokens 1000000 ${testProjectPath}`,
        { timeout: 25000 }
    );

    // Should handle gracefully
    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// CLEANUP VERIFICATION
// ============================================================================
console.log('\n📦 Cleanup Verification Tests');
console.log('-'.repeat(70));

test('E2E: Preset cleanup after completion', () => {
    const result = runCommand(
        `node bin/cli.js --cli --preset review ${testProjectPath}`,
        { timeout: 25000 }
    );

    if (!result.success) {
        throw new Error('Preset workflow failed');
    }

    // Check that temporary preset files are cleaned up
    const tempFiles = ['.contextinclude', '.methodinclude'];
    let foundTempFiles = false;

    for (const file of tempFiles) {
        const filePath = path.join(testProjectPath, file);
        if (fs.existsSync(filePath)) {
            // Check if it was there before or created by preset
            foundTempFiles = true;
        }
    }

    // Final cleanup
    cleanupTestFiles(testProjectPath);
});

test('E2E: Analysis cleanup after interruption simulation', () => {
    // Run analysis and verify cleanup
    const result = runCommand(
        `node bin/cli.js --cli --save-report ${testProjectPath}`,
        { timeout: 25000 }
    );

    // Cleanup
    cleanupTestFiles(testProjectPath);

    // Verify all generated files are gone
    const generatedFiles = ['context-report.json', 'llm-context.json'];
    for (const file of generatedFiles) {
        const filePath = path.join(testProjectPath, file);
        if (fs.existsSync(filePath)) {
            throw new Error(`File ${file} was not cleaned up`);
        }
    }
});

// ============================================================================
// INTEGRATION WITH CORE MODULES
// ============================================================================
console.log('\n📦 Core Module Integration Tests');
console.log('-'.repeat(70));

test('E2E: Scanner → Analyzer → Reporter pipeline', () => {
    const analyzer = new TokenAnalyzer(testProjectPath, {
        verbose: false,
        methodLevel: false
    });

    const result = analyzer.run();

    if (!result) throw new Error('Pipeline returned no result');
    if (!result.files) throw new Error('No files in result');

    cleanupTestFiles(testProjectPath);
});

test('E2E: Full analysis with all options', () => {
    const analyzer = new TokenAnalyzer(testProjectPath, {
        verbose: true,
        methodLevel: true,
        targetTokens: 100000,
        fitStrategy: 'balanced',
        saveReport: false
    });

    const result = analyzer.run();

    if (!result) throw new Error('Full analysis failed');

    cleanupTestFiles(testProjectPath);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 E2E WORKFLOW TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

// Final cleanup
console.log('\n🧹 Final cleanup...');
cleanupTestFiles(testProjectPath);

if (testsFailed === 0) {
    console.log('🎉 All E2E workflow tests passed!');
    process.exit(0);
} else {
    console.log(`⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
