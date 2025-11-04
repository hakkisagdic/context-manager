#!/usr/bin/env node

/**
 * CLI Integration Tests for v2.3.x
 * Tests command-line interface functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
            cwd: path.join(__dirname, '..'),
            timeout: options.timeout || 10000,
            stdio: 'pipe'
        });
        return { success: true, output, error: null };
    } catch (error) {
        return { success: false, output: error.stdout || '', error: error.message };
    }
}

console.log('🧪 CLI Integration Tests for v2.3.x\n');

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

test('CLI: --list-formats flag', () => {
    const result = runCommand('node bin/cli.js --list-formats');
    if (!result.success) throw new Error('List formats command failed');
    if (!result.output.includes('toon')) throw new Error('Missing TOON format');
    if (!result.output.includes('json')) throw new Error('Missing JSON format');
    if (!result.output.includes('yaml')) throw new Error('Missing YAML format');
});

// ============================================================================
// FORMAT CONVERSION CLI TESTS
// ============================================================================
console.log('\n📦 Format Conversion CLI Tests');
console.log('-'.repeat(70));

// Create test JSON file
const testData = { test: 'value', number: 123, array: [1, 2, 3] };
const testFile = path.join(__dirname, 'temp-test.json');
fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));

test('CLI: Convert JSON to TOON', () => {
    const result = runCommand(`node bin/cli.js convert ${testFile} --from json --to toon`);
    if (!result.success) {
        console.log('   Output:', result.output);
        console.log('   Error:', result.error);
        throw new Error('Conversion failed');
    }
    if (!result.output.includes('Conversion successful')) {
        throw new Error('Missing success message');
    }

    // Check output file exists
    const outputFile = testFile.replace('.json', '.toon');
    if (!fs.existsSync(outputFile)) {
        throw new Error('Output file not created');
    }

    // Clean up
    fs.unlinkSync(outputFile);
});

test('CLI: Convert JSON to YAML', () => {
    const result = runCommand(`node bin/cli.js convert ${testFile} --from json --to yaml`);
    if (!result.success) throw new Error('YAML conversion failed');

    const outputFile = testFile.replace('.json', '.yaml');
    if (!fs.existsSync(outputFile)) {
        throw new Error('YAML output file not created');
    }

    // Verify YAML content
    const yamlContent = fs.readFileSync(outputFile, 'utf8');
    if (!yamlContent.includes('test:')) {
        throw new Error('Invalid YAML content');
    }

    // Clean up
    fs.unlinkSync(outputFile);
});

test('CLI: Convert JSON to CSV', () => {
    // Create method data for CSV
    const methodData = {
        methods: {
            'file.js': [
                { name: 'func1', line: 10, tokens: 100 },
                { name: 'func2', line: 20, tokens: 200 }
            ]
        }
    };
    const methodFile = path.join(__dirname, 'temp-methods.json');
    fs.writeFileSync(methodFile, JSON.stringify(methodData));

    const result = runCommand(`node bin/cli.js convert ${methodFile} --from json --to csv`);
    if (!result.success) throw new Error('CSV conversion failed');

    const outputFile = methodFile.replace('.json', '.csv');
    if (!fs.existsSync(outputFile)) {
        throw new Error('CSV output file not created');
    }

    // Verify CSV content
    const csvContent = fs.readFileSync(outputFile, 'utf8');
    if (!csvContent.includes('File,Method,Line,Tokens')) {
        throw new Error('CSV missing header');
    }

    // Clean up
    fs.unlinkSync(methodFile);
    fs.unlinkSync(outputFile);
});

// Clean up test file
if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

test('CLI: Convert with missing input file', () => {
    const result = runCommand('node bin/cli.js convert nonexistent.json --from json --to toon');
    // Should fail gracefully
    if (result.success) {
        throw new Error('Should fail with missing file');
    }
    // Error message should be user-friendly
    const errorOutput = result.output + result.error;
    if (!errorOutput) {
        throw new Error('Should provide error message');
    }
});

test('CLI: Convert without --from flag', () => {
    const result = runCommand('node bin/cli.js convert test.json --to toon');
    if (result.success) {
        throw new Error('Should require --from flag');
    }
    const errorOutput = result.output + result.error;
    if (!errorOutput.includes('--from')) {
        throw new Error('Should mention missing --from flag');
    }
});

test('CLI: Convert without --to flag', () => {
    const result = runCommand('node bin/cli.js convert test.json --from json');
    if (result.success) {
        throw new Error('Should require --to flag');
    }
    const errorOutput = result.output + result.error;
    if (!errorOutput.includes('--to')) {
        throw new Error('Should mention missing --to flag');
    }
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 CLI TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All CLI tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
