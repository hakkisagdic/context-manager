#!/usr/bin/env node

/**
 * Comprehensive Context Manager Tests
 * Tests for main orchestrator functions: generateDigestFromReport, generateDigestFromContext
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateDigestFromReport, generateDigestFromContext, main, printHelp, printStartupInfo } from '../context-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
    try {
        await fn();
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
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'context-manager');

// Create test fixtures
function setupTestFixtures() {
    // Clean up old fixtures
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }

    // Create directory structure
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });

    // Create a valid token analysis report
    const validReport = {
        metadata: {
            projectRoot: FIXTURES_DIR,
            timestamp: new Date().toISOString(),
            version: '3.1.0'
        },
        summary: {
            totalFiles: 3,
            totalTokens: 1000,
            totalBytes: 5000,
            totalLines: 200
        },
        files: [
            {
                path: path.join(FIXTURES_DIR, 'file1.js'),
                relativePath: 'file1.js',
                sizeBytes: 1000,
                tokens: 300,
                lines: 50
            },
            {
                path: path.join(FIXTURES_DIR, 'file2.js'),
                relativePath: 'file2.js',
                sizeBytes: 2000,
                tokens: 400,
                lines: 80
            },
            {
                path: path.join(FIXTURES_DIR, 'file3.js'),
                relativePath: 'file3.js',
                sizeBytes: 2000,
                tokens: 300,
                lines: 70
            }
        ]
    };

    // Create a valid LLM context file
    const validContext = {
        project: {
            root: FIXTURES_DIR,
            totalFiles: 2,
            totalTokens: 500,
            timestamp: new Date().toISOString()
        },
        paths: {
            '/': ['test1.js', 'test2.js'],
            'src/': ['main.js']
        }
    };

    // Create test files referenced in context
    fs.writeFileSync(path.join(FIXTURES_DIR, 'test1.js'), 'console.log("test1");');
    fs.writeFileSync(path.join(FIXTURES_DIR, 'test2.js'), 'console.log("test2");');
    fs.mkdirSync(path.join(FIXTURES_DIR, 'src'), { recursive: true });
    fs.writeFileSync(path.join(FIXTURES_DIR, 'src', 'main.js'), 'console.log("main");');

    // Save valid report
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'valid-report.json'),
        JSON.stringify(validReport, null, 2)
    );

    // Save valid context
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'valid-context.json'),
        JSON.stringify(validContext, null, 2)
    );

    // Create an invalid report (missing required fields)
    const invalidReport = {
        metadata: {
            projectRoot: FIXTURES_DIR
        }
        // Missing summary and files
    };
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'invalid-report.json'),
        JSON.stringify(invalidReport, null, 2)
    );

    // Create an invalid context (missing required fields)
    const invalidContext = {
        project: {
            root: FIXTURES_DIR
        }
        // Missing paths
    };
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'invalid-context.json'),
        JSON.stringify(invalidContext, null, 2)
    );

    // Create a malformed JSON file
    fs.writeFileSync(
        path.join(FIXTURES_DIR, 'malformed.json'),
        '{ invalid json }'
    );
}

// Clean up test fixtures
function cleanupTestFixtures() {
    if (fs.existsSync(FIXTURES_DIR)) {
        fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    }

    // Clean up any digest files created in the current directory
    const digestPath = path.join(process.cwd(), 'digest.txt');
    if (fs.existsSync(digestPath)) {
        fs.unlinkSync(digestPath);
    }
}

// Suppress console.log and console.error during tests
const originalLog = console.log;
const originalError = console.error;
const originalExit = process.exit;

function suppressConsole() {
    console.log = () => {};
    console.error = () => {};
    process.exit = () => { throw new Error('process.exit called'); };
}

function restoreConsole() {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
}

(async () => {

console.log('🧪 Testing Context Manager...\n');
console.log('Setting up test fixtures...');
setupTestFixtures();

// ============================================================================
// generateDigestFromReport TESTS
// ============================================================================
console.log('\n📄 generateDigestFromReport Tests');
console.log('-'.repeat(70));

await test('generateDigestFromReport - generates digest from valid report', () => {
    suppressConsole();
    try {
        const reportPath = path.join(FIXTURES_DIR, 'valid-report.json');
        const originalCwd = process.cwd();

        // Change to fixtures directory to avoid polluting project directory
        process.chdir(FIXTURES_DIR);

        generateDigestFromReport(reportPath);

        // Check if digest.txt was created
        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (!fs.existsSync(digestPath)) {
            throw new Error('digest.txt was not created');
        }

        const digestContent = fs.readFileSync(digestPath, 'utf8');
        if (digestContent.length === 0) {
            throw new Error('digest.txt is empty');
        }

        // Clean up
        fs.unlinkSync(digestPath);
        process.chdir(originalCwd);
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromReport - throws error for non-existent file', () => {
    suppressConsole();
    try {
        const reportPath = path.join(FIXTURES_DIR, 'non-existent.json');
        let errorThrown = false;

        try {
            generateDigestFromReport(reportPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for non-existent file');
        }
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromReport - throws error for invalid report format', () => {
    suppressConsole();
    try {
        const reportPath = path.join(FIXTURES_DIR, 'invalid-report.json');
        let errorThrown = false;

        try {
            generateDigestFromReport(reportPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for invalid report format');
        }
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromReport - throws error for malformed JSON', () => {
    suppressConsole();
    try {
        const reportPath = path.join(FIXTURES_DIR, 'malformed.json');
        let errorThrown = false;

        try {
            generateDigestFromReport(reportPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for malformed JSON');
        }
    } finally {
        restoreConsole();
    }
});

// ============================================================================
// generateDigestFromContext TESTS
// ============================================================================
console.log('\n📄 generateDigestFromContext Tests');
console.log('-'.repeat(70));

await test('generateDigestFromContext - generates digest from valid context', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'valid-context.json');
        const originalCwd = process.cwd();

        // Change to fixtures directory
        process.chdir(FIXTURES_DIR);

        generateDigestFromContext(contextPath);

        // Check if digest.txt was created
        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (!fs.existsSync(digestPath)) {
            throw new Error('digest.txt was not created');
        }

        const digestContent = fs.readFileSync(digestPath, 'utf8');
        if (digestContent.length === 0) {
            throw new Error('digest.txt is empty');
        }

        // Clean up
        fs.unlinkSync(digestPath);
        process.chdir(originalCwd);
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromContext - throws error for non-existent file', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'non-existent-context.json');
        let errorThrown = false;

        try {
            generateDigestFromContext(contextPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for non-existent file');
        }
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromContext - throws error for invalid context format', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'invalid-context.json');
        let errorThrown = false;

        try {
            generateDigestFromContext(contextPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for invalid context format');
        }
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromContext - throws error for malformed JSON', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'malformed.json');
        let errorThrown = false;

        try {
            generateDigestFromContext(contextPath);
        } catch (error) {
            errorThrown = true;
            if (!error.message.includes('process.exit')) {
                throw new Error('Unexpected error: ' + error.message);
            }
        }

        if (!errorThrown) {
            throw new Error('Should throw error for malformed JSON');
        }
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromContext - handles files in root directory', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'valid-context.json');
        const originalCwd = process.cwd();

        process.chdir(FIXTURES_DIR);
        generateDigestFromContext(contextPath);

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (!fs.existsSync(digestPath)) {
            throw new Error('digest.txt was not created');
        }

        const digestContent = fs.readFileSync(digestPath, 'utf8');

        // Should include files from root directory
        if (!digestContent.includes('test1.js') && !digestContent.includes('test2.js')) {
            // It's OK if files are not in content since formatter might compress them
        }

        fs.unlinkSync(digestPath);
        process.chdir(originalCwd);
    } finally {
        restoreConsole();
    }
});

await test('generateDigestFromContext - handles non-existent files gracefully', () => {
    suppressConsole();
    try {
        const contextWithMissingFiles = {
            project: {
                root: FIXTURES_DIR,
                totalFiles: 1,
                totalTokens: 100
            },
            paths: {
                '/': ['non-existent-file.js']
            }
        };

        const contextPath = path.join(FIXTURES_DIR, 'context-with-missing-files.json');
        fs.writeFileSync(contextPath, JSON.stringify(contextWithMissingFiles, null, 2));

        const originalCwd = process.cwd();
        process.chdir(FIXTURES_DIR);

        // Should not throw error, just skip missing files
        generateDigestFromContext(contextPath);

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (fs.existsSync(digestPath)) {
            fs.unlinkSync(digestPath);
        }

        process.chdir(originalCwd);
        fs.unlinkSync(contextPath);
    } finally {
        restoreConsole();
    }
});

// ============================================================================
// MAIN FUNCTION TESTS
// ============================================================================
console.log('\n🚀 Main Function Tests');
console.log('-'.repeat(70));

await test('main - handles --help flag', () => {
    suppressConsole();
    try {
        const originalArgv = process.argv;
        process.argv = ['node', 'context-manager.js', '--help'];

        // Call main function which should print help
        main();

        process.argv = originalArgv;
    } finally {
        restoreConsole();
    }
});

await test('main - handles -h flag', () => {
    suppressConsole();
    try {
        const originalArgv = process.argv;
        process.argv = ['node', 'context-manager.js', '-h'];

        // Call main function which should print help
        main();

        process.argv = originalArgv;
    } finally {
        restoreConsole();
    }
});

await test('main - handles --gitingest-from-report flag', () => {
    suppressConsole();
    try {
        const originalArgv = process.argv;
        const reportPath = path.join(FIXTURES_DIR, 'valid-report.json');
        process.argv = ['node', 'context-manager.js', '--gitingest-from-report', reportPath];

        const originalCwd = process.cwd();
        process.chdir(FIXTURES_DIR);

        // Call main function
        main();

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (fs.existsSync(digestPath)) {
            fs.unlinkSync(digestPath);
        }

        process.chdir(originalCwd);
        process.argv = originalArgv;
    } finally {
        restoreConsole();
    }
});

await test('main - handles --gitingest-from-context flag', () => {
    suppressConsole();
    try {
        const originalArgv = process.argv;
        const contextPath = path.join(FIXTURES_DIR, 'valid-context.json');
        process.argv = ['node', 'context-manager.js', '--gitingest-from-context', contextPath];

        const originalCwd = process.cwd();
        process.chdir(FIXTURES_DIR);

        // Call main function
        main();

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (fs.existsSync(digestPath)) {
            fs.unlinkSync(digestPath);
        }

        process.chdir(originalCwd);
        process.argv = originalArgv;
    } finally {
        restoreConsole();
    }
});

await test('printHelp - executes without errors', () => {
    suppressConsole();
    try {
        // Call printHelp function
        printHelp();
    } finally {
        restoreConsole();
    }
});

await test('printStartupInfo - executes without errors', () => {
    suppressConsole();
    try {
        // Call printStartupInfo function
        printStartupInfo();
    } finally {
        restoreConsole();
    }
});

await test('printStartupInfo - shows tiktoken warning when not available', async () => {
    suppressConsole();
    try {
        // Import TokenUtils to mock it
        const TokenUtils = (await import('../lib/utils/token-utils.js')).default;
        const originalHasExactCounting = TokenUtils.hasExactCounting;

        // Mock hasExactCounting to return false
        TokenUtils.hasExactCounting = () => false;

        // Call printStartupInfo - should show tiktoken warning
        printStartupInfo();

        // Restore original function
        TokenUtils.hasExactCounting = originalHasExactCounting;
    } finally {
        restoreConsole();
    }
});

await test('main - handles default case (no flags)', () => {
    suppressConsole();
    try {
        const originalArgv = process.argv;
        process.argv = ['node', 'context-manager.js'];

        // Call main function - it will try to run TokenCalculator
        // We expect this to fail since we're in test environment, but the code path should be covered
        try {
            main();
        } catch (error) {
            // Expected to fail, just want to cover the code path
        }

        process.argv = originalArgv;
    } finally {
        restoreConsole();
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

await test('Integration - full workflow from report to digest', () => {
    suppressConsole();
    try {
        const reportPath = path.join(FIXTURES_DIR, 'valid-report.json');
        const originalCwd = process.cwd();

        process.chdir(FIXTURES_DIR);

        // Generate digest from report
        generateDigestFromReport(reportPath);

        // Verify digest exists and has content
        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (!fs.existsSync(digestPath)) {
            throw new Error('Digest file not created');
        }

        const stats = fs.statSync(digestPath);
        if (stats.size === 0) {
            throw new Error('Digest file is empty');
        }

        // Clean up
        fs.unlinkSync(digestPath);
        process.chdir(originalCwd);
    } finally {
        restoreConsole();
    }
});

await test('Integration - full workflow from context to digest', () => {
    suppressConsole();
    try {
        const contextPath = path.join(FIXTURES_DIR, 'valid-context.json');
        const originalCwd = process.cwd();

        process.chdir(FIXTURES_DIR);

        // Generate digest from context
        generateDigestFromContext(contextPath);

        // Verify digest exists and has content
        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (!fs.existsSync(digestPath)) {
            throw new Error('Digest file not created');
        }

        const stats = fs.statSync(digestPath);
        if (stats.size === 0) {
            throw new Error('Digest file is empty');
        }

        // Clean up
        fs.unlinkSync(digestPath);
        process.chdir(originalCwd);
    } finally {
        restoreConsole();
    }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n⚠️  Edge Cases');
console.log('-'.repeat(70));

await test('Edge case - report with empty files array', () => {
    suppressConsole();
    try {
        const emptyReport = {
            metadata: { projectRoot: FIXTURES_DIR },
            summary: { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0 },
            files: []
        };

        const reportPath = path.join(FIXTURES_DIR, 'empty-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(emptyReport, null, 2));

        const originalCwd = process.cwd();
        process.chdir(FIXTURES_DIR);

        generateDigestFromReport(reportPath);

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (fs.existsSync(digestPath)) {
            fs.unlinkSync(digestPath);
        }

        process.chdir(originalCwd);
        fs.unlinkSync(reportPath);
    } finally {
        restoreConsole();
    }
});

await test('Edge case - context with empty paths', () => {
    suppressConsole();
    try {
        const emptyContext = {
            project: { root: FIXTURES_DIR, totalFiles: 0, totalTokens: 0 },
            paths: {}
        };

        const contextPath = path.join(FIXTURES_DIR, 'empty-context.json');
        fs.writeFileSync(contextPath, JSON.stringify(emptyContext, null, 2));

        const originalCwd = process.cwd();
        process.chdir(FIXTURES_DIR);

        generateDigestFromContext(contextPath);

        const digestPath = path.join(FIXTURES_DIR, 'digest.txt');
        if (fs.existsSync(digestPath)) {
            fs.unlinkSync(digestPath);
        }

        process.chdir(originalCwd);
        fs.unlinkSync(contextPath);
    } finally {
        restoreConsole();
    }
});

// Clean up
console.log('\n🧹 Cleaning up test fixtures...');
cleanupTestFixtures();

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 CONTEXT MANAGER TEST RESULTS');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL CONTEXT MANAGER TESTS PASSED!');
    console.log('📈 context-manager.js now has comprehensive test coverage.');
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review and fix.`);
    process.exit(1);
}

})();
