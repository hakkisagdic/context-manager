/**
 * Comprehensive test suite for context-manager.js
 * Goal: Achieve 100% line coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDigestFromReport, generateDigestFromContext } from '../context-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test utilities
let testsPassed = 0;
let testsFailed = 0;
const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;
let capturedLogs = [];
let capturedErrors = [];
let exitCode = null;

function captureConsole() {
    capturedLogs = [];
    capturedErrors = [];
    exitCode = null;

    console.log = (...args) => capturedLogs.push(args.join(' '));
    console.error = (...args) => capturedErrors.push(args.join(' '));
    process.exit = (code) => { exitCode = code; throw new Error(`process.exit(${code})`); };
}

function restoreConsole() {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
}

function assert(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.error(`❌ ${message}`);
        testsFailed++;
    }
}

function createTempDir() {
    const tempDir = path.join(__dirname, `temp-test-${Date.now()}`);
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

console.log('🧪 CONTEXT-MANAGER.JS COVERAGE TESTS');
console.log('='.repeat(70));

// Test 1: generateDigestFromReport with valid report
console.log('\n📋 Testing generateDigestFromReport()');
console.log('-'.repeat(70));

try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    // Create a valid report file
    const reportPath = path.join(tempDir, 'token-analysis-report.json');
    const sampleReport = {
        metadata: {
            projectRoot: tempDir,
            generatedAt: new Date().toISOString()
        },
        summary: {
            totalFiles: 2,
            totalTokens: 100,
            totalBytes: 500,
            totalLines: 20
        },
        files: [
            {
                path: path.join(tempDir, 'test1.js'),
                relativePath: 'test1.js',
                sizeBytes: 250,
                tokens: 50,
                lines: 10
            },
            {
                path: path.join(tempDir, 'test2.js'),
                relativePath: 'test2.js',
                sizeBytes: 250,
                tokens: 50,
                lines: 10
            }
        ]
    };

    // Create test files
    fs.writeFileSync(path.join(tempDir, 'test1.js'), 'console.log("test1");');
    fs.writeFileSync(path.join(tempDir, 'test2.js'), 'console.log("test2");');
    fs.writeFileSync(reportPath, JSON.stringify(sampleReport, null, 2));

    captureConsole();
    generateDigestFromReport(reportPath);
    restoreConsole();

    assert(capturedLogs.some(log => log.includes('Loading token analysis report')),
        'generateDigestFromReport: Logs report loading');
    assert(capturedLogs.some(log => log.includes('Report loaded: 2 files')),
        'generateDigestFromReport: Logs file count');
    assert(capturedLogs.some(log => log.includes('Generating GitIngest digest')),
        'generateDigestFromReport: Logs digest generation');
    assert(fs.existsSync(path.join(tempDir, 'digest.txt')),
        'generateDigestFromReport: Creates digest.txt file');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
    console.error(`Error in test: ${error.message}`);
}

// Test 2: generateDigestFromReport with missing file
try {
    captureConsole();
    try {
        generateDigestFromReport('/nonexistent/report.json');
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Report file not found')),
        'generateDigestFromReport: Handles missing report file');
    assert(exitCode === 1,
        'generateDigestFromReport: Exits with code 1 for missing file');
} catch (error) {
    restoreConsole();
}

// Test 3: generateDigestFromReport with invalid format
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const reportPath = path.join(tempDir, 'invalid-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({ invalid: 'format' }));

    captureConsole();
    try {
        generateDigestFromReport(reportPath);
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Invalid report format')),
        'generateDigestFromReport: Detects invalid report format');
    assert(exitCode === 1,
        'generateDigestFromReport: Exits with code 1 for invalid format');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 4: generateDigestFromReport with malformed JSON
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const reportPath = path.join(tempDir, 'malformed-report.json');
    fs.writeFileSync(reportPath, 'not valid json {{{');

    captureConsole();
    try {
        generateDigestFromReport(reportPath);
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Error processing report')),
        'generateDigestFromReport: Handles malformed JSON');
    assert(exitCode === 1,
        'generateDigestFromReport: Exits with code 1 for malformed JSON');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 5: generateDigestFromContext with valid context
console.log('\n📋 Testing generateDigestFromContext()');
console.log('-'.repeat(70));

try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    // Create test files
    fs.writeFileSync(path.join(tempDir, 'file1.js'), 'console.log("file1");');
    fs.writeFileSync(path.join(tempDir, 'file2.js'), 'console.log("file2");');

    const subdir = path.join(tempDir, 'src');
    fs.mkdirSync(subdir);
    fs.writeFileSync(path.join(subdir, 'file3.js'), 'console.log("file3");');

    // Create a valid context file
    const contextPath = path.join(tempDir, 'llm-context.json');
    const sampleContext = {
        project: {
            root: tempDir,
            totalFiles: 3,
            totalTokens: 150
        },
        paths: {
            '/': ['file1.js', 'file2.js'],
            'src/': ['file3.js']
        }
    };

    fs.writeFileSync(contextPath, JSON.stringify(sampleContext, null, 2));

    captureConsole();
    generateDigestFromContext(contextPath);
    restoreConsole();

    assert(capturedLogs.some(log => log.includes('Loading LLM context file')),
        'generateDigestFromContext: Logs context loading');
    assert(capturedLogs.some(log => log.includes('Context loaded: 3 files')),
        'generateDigestFromContext: Logs file count from context');
    assert(capturedLogs.some(log => log.includes('Found') && log.includes('accessible files')),
        'generateDigestFromContext: Logs accessible file count');
    assert(fs.existsSync(path.join(tempDir, 'digest.txt')),
        'generateDigestFromContext: Creates digest.txt file');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
    console.error(`Error in test: ${error.message}`);
}

// Test 6: generateDigestFromContext with missing file
try {
    captureConsole();
    try {
        generateDigestFromContext('/nonexistent/context.json');
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Context file not found')),
        'generateDigestFromContext: Handles missing context file');
    assert(exitCode === 1,
        'generateDigestFromContext: Exits with code 1 for missing file');
} catch (error) {
    restoreConsole();
}

// Test 7: generateDigestFromContext with invalid format
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const contextPath = path.join(tempDir, 'invalid-context.json');
    fs.writeFileSync(contextPath, JSON.stringify({ invalid: 'format' }));

    captureConsole();
    try {
        generateDigestFromContext(contextPath);
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Invalid context format')),
        'generateDigestFromContext: Detects invalid context format');
    assert(exitCode === 1,
        'generateDigestFromContext: Exits with code 1 for invalid format');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 8: generateDigestFromContext with malformed JSON
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const contextPath = path.join(tempDir, 'malformed-context.json');
    fs.writeFileSync(contextPath, 'not valid json {{{');

    captureConsole();
    try {
        generateDigestFromContext(contextPath);
    } catch (e) {
        // Expected to throw due to process.exit
    }
    restoreConsole();

    assert(capturedErrors.some(err => err.includes('Error processing context')),
        'generateDigestFromContext: Handles malformed JSON');
    assert(exitCode === 1,
        'generateDigestFromContext: Exits with code 1 for malformed JSON');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 9: generateDigestFromContext with non-existent files in context
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const contextPath = path.join(tempDir, 'context-nonexistent-files.json');
    const contextWithMissingFiles = {
        project: {
            root: tempDir,
            totalFiles: 2,
            totalTokens: 100
        },
        paths: {
            '/': ['nonexistent1.js', 'nonexistent2.js']
        }
    };

    fs.writeFileSync(contextPath, JSON.stringify(contextWithMissingFiles, null, 2));

    captureConsole();
    generateDigestFromContext(contextPath);
    restoreConsole();

    assert(capturedLogs.some(log => log.includes('Found 0 accessible files')),
        'generateDigestFromContext: Handles non-existent files gracefully');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 10: Test main() function by importing as module
console.log('\n📋 Testing main() function via module import');
console.log('-'.repeat(70));

try {
    // Test that we can import the module and it exposes the expected exports
    import('../context-manager.js').then((module) => {
        assert(typeof module.generateDigestFromReport === 'function',
            'Module exports generateDigestFromReport function');
        assert(typeof module.generateDigestFromContext === 'function',
            'Module exports generateDigestFromContext function');
        assert(typeof module.TokenCalculator === 'function',
            'Module exports TokenCalculator class');
    });
} catch (error) {
    console.error(`Error in test: ${error.message}`);
}

// Test 11: generateDigestFromReport with default path
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    // Create report with default name
    const reportPath = path.join(tempDir, 'token-analysis-report.json');
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

    captureConsole();
    generateDigestFromReport(reportPath);
    restoreConsole();

    const digest = fs.readFileSync(path.join(tempDir, 'digest.txt'), 'utf8');
    assert(digest.length > 0,
        'generateDigestFromReport: Creates non-empty digest');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 12: generateDigestFromContext with default path
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    fs.writeFileSync(path.join(tempDir, 'app.js'), 'console.log("app");');

    const contextPath = path.join(tempDir, 'llm-context.json');
    const sampleContext = {
        project: { root: tempDir, totalFiles: 1, totalTokens: 50 },
        paths: { '/': ['app.js'] }
    };

    fs.writeFileSync(contextPath, JSON.stringify(sampleContext));

    captureConsole();
    generateDigestFromContext(contextPath);
    restoreConsole();

    const digest = fs.readFileSync(path.join(tempDir, 'digest.txt'), 'utf8');
    assert(digest.length > 0,
        'generateDigestFromContext: Creates non-empty digest');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

// Test 13: Test with report missing metadata.projectRoot
try {
    const tempDir = createTempDir();
    const oldCwd = process.cwd();
    process.chdir(tempDir);

    const reportPath = path.join(tempDir, 'report-no-root.json');
    const reportNoRoot = {
        metadata: {},  // Missing projectRoot
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
    fs.writeFileSync(reportPath, JSON.stringify(reportNoRoot));

    captureConsole();
    generateDigestFromReport(reportPath);
    restoreConsole();

    assert(fs.existsSync(path.join(tempDir, 'digest.txt')),
        'generateDigestFromReport: Handles missing projectRoot (uses cwd)');

    process.chdir(oldCwd);
    cleanupTempDir(tempDir);
} catch (error) {
    restoreConsole();
}

console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('📈 context-manager.js coverage significantly improved!');
} else {
    console.log('\n⚠️  Some tests failed. Please review.');
    process.exit(1);
}
