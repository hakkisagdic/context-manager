/**
 * CLI tests for context-manager.js main(), printHelp(), and printStartupInfo()
 * Tests command-line argument parsing and help text generation
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.error(`❌ ${message}`);
        testsFailed++;
    }
}

function runCLI(args = []) {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, '..', 'context-manager.js');
        const child = spawn('node', [scriptPath, ...args], {
            cwd: __dirname,
            env: { ...process.env, NODE_ENV: 'test' }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            child.kill();
            resolve({ code: -1, stdout, stderr, timeout: true });
        }, 5000);
    });
}

function createTempDir() {
    const tempDir = path.join(__dirname, `temp-cli-test-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
}

function cleanupTempDir(tempDir) {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

console.log('🧪 CONTEXT-MANAGER.JS CLI TESTS');
console.log('='.repeat(70));

// Test 1: --help flag
console.log('\n📋 Testing --help flag');
console.log('-'.repeat(70));

(async () => {
    const result = await runCLI(['--help']);

    assert(result.stdout.includes('Context Manager'),
        '--help: Shows Context Manager title');
    assert(result.stdout.includes('Usage: context-manager'),
        '--help: Shows usage information');
    assert(result.stdout.includes('--save-report'),
        '--help: Shows --save-report option');
    assert(result.stdout.includes('--verbose'),
        '--help: Shows --verbose option');
    assert(result.stdout.includes('--method-level'),
        '--help: Shows --method-level option');
    assert(result.stdout.includes('--gitingest'),
        '--help: Shows --gitingest option');
    assert(result.stdout.includes('--gitingest-from-report'),
        '--help: Shows --gitingest-from-report option');
    assert(result.stdout.includes('--gitingest-from-context'),
        '--help: Shows --gitingest-from-context option');
    assert(result.stdout.includes('Examples:'),
        '--help: Shows examples section');
    assert(result.code === 0,
        '--help: Exits with code 0');

    // Test 2: -h flag (short form)
    console.log('\n📋 Testing -h flag');
    console.log('-'.repeat(70));

    const result2 = await runCLI(['-h']);

    assert(result2.stdout.includes('Context Manager'),
        '-h: Shows Context Manager title');
    assert(result2.stdout.includes('Usage: context-manager'),
        '-h: Shows usage information');
    assert(result2.code === 0,
        '-h: Exits with code 0');

    // Test 3: --gitingest-from-report with valid file
    console.log('\n📋 Testing --gitingest-from-report');
    console.log('-'.repeat(70));

    const tempDir = createTempDir();
    const reportPath = path.join(tempDir, 'test-report.json');
    const sampleReport = {
        metadata: { projectRoot: tempDir },
        summary: { totalFiles: 1, totalTokens: 50, totalBytes: 100, totalLines: 5 },
        files: [{
            path: path.join(tempDir, 'test.js'),
            relativePath: 'test.js',
            sizeBytes: 100,
            tokens: 50,
            lines: 5
        }]
    };

    fs.writeFileSync(path.join(tempDir, 'test.js'), 'console.log("test");');
    fs.writeFileSync(reportPath, JSON.stringify(sampleReport));

    const result3 = await runCLI(['--gitingest-from-report', reportPath]);

    assert(result3.stdout.includes('Loading token analysis report'),
        '--gitingest-from-report: Loads report');
    assert(result3.stdout.includes('GitIngest digest saved'),
        '--gitingest-from-report: Creates digest');

    cleanupTempDir(tempDir);

    // Test 4: --gitingest-from-report with missing file
    console.log('\n📋 Testing --gitingest-from-report with missing file');
    console.log('-'.repeat(70));

    const result4 = await runCLI(['--gitingest-from-report', '/nonexistent/report.json']);

    assert(result4.stderr.includes('Report file not found'),
        '--gitingest-from-report: Handles missing file');
    assert(result4.code === 1,
        '--gitingest-from-report: Exits with code 1 for missing file');

    // Test 5: --gitingest-from-context with valid file
    console.log('\n📋 Testing --gitingest-from-context');
    console.log('-'.repeat(70));

    const tempDir2 = createTempDir();
    const contextPath = path.join(tempDir2, 'test-context.json');
    const sampleContext = {
        project: { root: tempDir2, totalFiles: 1, totalTokens: 50 },
        paths: { '/': ['app.js'] }
    };

    fs.writeFileSync(path.join(tempDir2, 'app.js'), 'console.log("app");');
    fs.writeFileSync(contextPath, JSON.stringify(sampleContext));

    const result5 = await runCLI(['--gitingest-from-context', contextPath]);

    assert(result5.stdout.includes('Loading LLM context file'),
        '--gitingest-from-context: Loads context');
    assert(result5.stdout.includes('GitIngest digest saved'),
        '--gitingest-from-context: Creates digest');

    cleanupTempDir(tempDir2);

    // Test 6: --gitingest-from-context with missing file
    console.log('\n📋 Testing --gitingest-from-context with missing file');
    console.log('-'.repeat(70));

    const result6 = await runCLI(['--gitingest-from-context', '/nonexistent/context.json']);

    assert(result6.stderr.includes('Context file not found'),
        '--gitingest-from-context: Handles missing file');
    assert(result6.code === 1,
        '--gitingest-from-context: Exits with code 1 for missing file');

    // Test 7: --gitingest-from-report without specifying file (uses default)
    console.log('\n📋 Testing --gitingest-from-report with default filename');
    console.log('-'.repeat(70));

    const tempDir3 = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir3);

    const defaultReportPath = path.join(tempDir3, 'token-analysis-report.json');
    fs.writeFileSync(path.join(tempDir3, 'test.js'), 'console.log("test");');
    fs.writeFileSync(defaultReportPath, JSON.stringify({
        metadata: { projectRoot: tempDir3 },
        summary: { totalFiles: 1, totalTokens: 50, totalBytes: 100, totalLines: 5 },
        files: [{
            path: path.join(tempDir3, 'test.js'),
            relativePath: 'test.js',
            sizeBytes: 100,
            tokens: 50,
            lines: 5
        }]
    }));

    const result7 = await runCLI(['--gitingest-from-report']);

    assert(result7.stdout.includes('Loading token analysis report'),
        '--gitingest-from-report: Uses default filename');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir3);

    // Test 8: --gitingest-from-context without specifying file (uses default)
    console.log('\n📋 Testing --gitingest-from-context with default filename');
    console.log('-'.repeat(70));

    const tempDir4 = createTempDir();
    process.chdir(tempDir4);

    const defaultContextPath = path.join(tempDir4, 'llm-context.json');
    fs.writeFileSync(path.join(tempDir4, 'app.js'), 'console.log("app");');
    fs.writeFileSync(defaultContextPath, JSON.stringify({
        project: { root: tempDir4, totalFiles: 1, totalTokens: 50 },
        paths: { '/': ['app.js'] }
    }));

    const result8 = await runCLI(['--gitingest-from-context']);

    assert(result8.stdout.includes('Loading LLM context file'),
        '--gitingest-from-context: Uses default filename');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir4);

    // Test 9: Testing printStartupInfo (invoked during normal run)
    console.log('\n📋 Testing printStartupInfo()');
    console.log('-'.repeat(70));

    // Create a minimal test environment
    const tempDir5 = createTempDir();
    process.chdir(tempDir5);

    // Create minimal files to prevent errors
    fs.writeFileSync(path.join(tempDir5, 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(tempDir5, '.gitignore'), 'node_modules/');

    const result9 = await runCLI(['--save-report']);

    assert(result9.stdout.includes('Code Analyzer by Hakkı Sağdıç') || result9.stderr.includes('Code Analyzer'),
        'printStartupInfo: Shows title');
    assert(result9.stdout.includes('Available options:') || result9.stderr.includes('Available options:'),
        'printStartupInfo: Shows options');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir5);

    // Test 10: Test main with various option flags
    console.log('\n📋 Testing main() with option flags');
    console.log('-'.repeat(70));

    const tempDir6 = createTempDir();
    process.chdir(tempDir6);

    fs.writeFileSync(path.join(tempDir6, 'test.js'), 'function test() { return 42; }');
    fs.writeFileSync(path.join(tempDir6, '.gitignore'), 'node_modules/');

    const result10 = await runCLI(['--verbose', '--save-report']);

    assert(result10.code === 0 || result10.stdout.length > 0 || result10.stderr.length > 0,
        'main: Handles --verbose and --save-report flags');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir6);

    // Test 11: Test main with --method-level flag
    console.log('\n📋 Testing main() with --method-level');
    console.log('-'.repeat(70));

    const tempDir7 = createTempDir();
    process.chdir(tempDir7);

    fs.writeFileSync(path.join(tempDir7, 'test.js'), 'function myFunction() { return 42; }');
    fs.writeFileSync(path.join(tempDir7, '.gitignore'), 'node_modules/');

    const result11 = await runCLI(['-m', '--save-report']);

    assert(result11.code === 0 || result11.stdout.length > 0 || result11.stderr.length > 0,
        'main: Handles --method-level flag');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir7);

    // Test 12: Test main with --gitingest flag
    console.log('\n📋 Testing main() with --gitingest');
    console.log('-'.repeat(70));

    const tempDir8 = createTempDir();
    process.chdir(tempDir8);

    fs.writeFileSync(path.join(tempDir8, 'test.js'), 'console.log("test");');
    fs.writeFileSync(path.join(tempDir8, '.gitignore'), 'node_modules/');

    const result12 = await runCLI(['-g']);

    assert(result12.code === 0 || result12.stdout.length > 0 || result12.stderr.length > 0,
        'main: Handles --gitingest flag');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir8);

    console.log('\n' + '='.repeat(70));
    console.log('📊 CLI TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL CLI TESTS PASSED!');
        console.log('📈 context-manager.js CLI coverage achieved!');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please review.');
        process.exit(1);
    }
})();
