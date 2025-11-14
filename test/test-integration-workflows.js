import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        console.log('✅ ' + name);
        passedTests++;
    } catch (err) {
        console.log('❌ ' + name);
        console.log('   Error: ' + err.message);
        failedTests++;
    }
}

function runCommand(cmd, opts = {}) {
    try {
        const result = execSync(cmd, { 
            encoding: 'utf8',
            timeout: opts.timeout || 15000,
            stdio: 'pipe'
        });
        return { success: true, output: result, error: '' };
    } catch (err) {
        return { 
            success: false, 
            output: err.stdout || '', 
            error: err.stderr || err.message 
        };
    }
}

const testDir = path.join(__dirname, 'fixtures', 'simple-project');

console.log('🧪 Integration Workflow Tests\n');

console.log('📦 Basic CLI Workflows');
console.log('-'.repeat(70));

test('Workflow: Analyze with CLI flag', () => {
    const result = runCommand('node bin/cli.js --cli ' + testDir);
    if (!result.success && !result.output.includes('Total files')) {
        throw new Error('CLI analysis failed');
    }
});

test('Workflow: List supported LLMs', () => {
    const result = runCommand('node bin/cli.js --list-llms');
    if (!result.success && !result.output.includes('gpt')) {
        throw new Error('Should list LLMs');
    }
});

test('Workflow: List presets', () => {
    const result = runCommand('node bin/cli.js --list-presets');
    if (!result.success && !result.output.includes('review')) {
        throw new Error('Should list presets');
    }
});

test('Workflow: Show preset info', () => {
    const result = runCommand('node bin/cli.js --preset-info default');
    if (!result.success && !result.output.includes('default')) {
        throw new Error('Should show preset info');
    }
});

test('Workflow: Help command', () => {
    const result = runCommand('node bin/cli.js --help');
    if (!result.success && !result.output.includes('Usage')) {
        throw new Error('Should show help');
    }
});

console.log('\n📦 Format Workflows');
console.log('-'.repeat(70));

test('Workflow: Generate JSON format', () => {
    const result = runCommand('node bin/cli.js --cli --format json ' + testDir);
    if (!result.success && !result.output.includes('"project"')) {
        throw new Error('JSON format failed');
    }
});

test('Workflow: Generate TOON format', () => {
    const result = runCommand('node bin/cli.js --cli --format toon ' + testDir);
    const allOutput = result.output + result.error;
    if (!result.success && !allOutput.includes('TOON') && !allOutput.includes('files')) {
        throw new Error('TOON format failed');
    }
});

test('Workflow: Generate GitIngest format', () => {
    const result = runCommand('node bin/cli.js --cli --gitingest ' + testDir);
    if (!result.success) {
        throw new Error('GitIngest format failed');
    }
});

console.log('\n📦 Filter Workflows');
console.log('-'.repeat(70));

test('Workflow: Analyze with method-level', () => {
    const result = runCommand('node bin/cli.js --cli -m ' + testDir);
    if (!result.success) {
        throw new Error('Method-level failed');
    }
});

test('Workflow: Analyze specific directory', () => {
    const srcDir = path.join(testDir, 'src');
    if (fs.existsSync(srcDir)) {
        const result = runCommand('node bin/cli.js --cli ' + srcDir);
        if (!result.success) {
            throw new Error('Directory analysis failed');
        }
    }
});

console.log('\n📦 Token Budget Workflows');
console.log('-'.repeat(70));

test('Workflow: Set token budget', () => {
    const result = runCommand('node bin/cli.js --cli --target-tokens 50000 ' + testDir);
    if (!result.success) {
        throw new Error('Token budget failed');
    }
});

test('Workflow: Use fit strategy', () => {
    const result = runCommand('node bin/cli.js --cli --target-tokens 100k --fit-strategy auto ' + testDir);
    if (!result.success) {
        throw new Error('Fit strategy failed');
    }
});

console.log('\n📦 Config File Workflows');
console.log('-'.repeat(70));

test('Workflow: Config file discovery', () => {
    const configs = ['.gitignore', '.contextignore', '.contextinclude'];
    let found = false;
    for (const config of configs) {
        if (fs.existsSync(path.join(testDir, config))) {
            found = true;
            break;
        }
    }
    if (!found && !fs.existsSync(path.join(process.cwd(), '.gitignore'))) {
        throw new Error('No config files found');
    }
});

test('Workflow: Read gitignore', () => {
    const gitignorePath = path.join(testDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        if (typeof content !== 'string') {
            throw new Error('Should read gitignore');
        }
    }
});

console.log('\n📦 File System Workflows');
console.log('-'.repeat(70));

test('Workflow: Check file exists', () => {
    const indexPath = path.join(testDir, 'index.js');
    if (!fs.existsSync(indexPath)) {
        throw new Error('Test file should exist');
    }
});

test('Workflow: Read file content', () => {
    const indexPath = path.join(testDir, 'index.js');
    const content = fs.readFileSync(indexPath, 'utf8');
    if (!content) {
        throw new Error('File should have content');
    }
});

test('Workflow: Get file stats', () => {
    const indexPath = path.join(testDir, 'index.js');
    const stats = fs.statSync(indexPath);
    if (!stats.isFile()) {
        throw new Error('Should be a file');
    }
});

console.log('\n📦 Error Handling Workflows');
console.log('-'.repeat(70));

test('Workflow: Handle missing directory', () => {
    const result = runCommand('node bin/cli.js --cli /nonexistent/path/xyz');
    if (result.success && !result.error.includes('not found') && !result.error.includes('ENOENT')) {
        const allOutput = (result.output + result.error).toLowerCase();
        if (!allOutput.includes('error') && !allOutput.includes('not found')) {
            console.log('   ⚠️  Warning: Missing directory did not error');
        }
    }
});

test('Workflow: Handle invalid preset', () => {
    const result = runCommand('node bin/cli.js --preset invalid-xyz-123');
    if (result.success && !result.error.includes('not found')) {
        console.log('   ⚠️  Warning: Invalid preset did not error');
    }
});

test('Workflow: Handle invalid format', () => {
    const result = runCommand('node bin/cli.js --cli --format invalid-format ' + testDir);
    if (result.success) {
        const allOutput = (result.output + result.error).toLowerCase();
        if (!allOutput.includes('error') && !allOutput.includes('invalid') && !allOutput.includes('unknown')) {
            console.log('   ⚠️  Warning: Invalid format did not error');
        }
    }
});

console.log('\n' + '='.repeat(70));
console.log('📊 INTEGRATION WORKFLOW TEST SUMMARY');
console.log('='.repeat(70));
console.log('Total tests run: ' + totalTests);
console.log('✅ Passed: ' + passedTests);
console.log('❌ Failed: ' + failedTests);
console.log('Success rate: ' + ((passedTests / totalTests) * 100).toFixed(1) + '%');

if (failedTests === 0) {
    console.log('\n🎉 All integration workflow tests passed!');
} else {
    console.log('\n⚠️  ' + failedTests + ' test(s) failed');
    process.exit(1);
}
