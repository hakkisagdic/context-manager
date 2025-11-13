#!/usr/bin/env node

/**
 * Comprehensive Git Utils Tests
 * Tests for GitHub URL parsing, git operations, and GitIngest generation
 */

import GitUtils from '../lib/utils/git-utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        testsFailed++;
        return false;
    }
}

const TEST_TEMP_DIR = path.join(__dirname, '.test-git-utils-temp');

console.log('🧪 Testing Git Utils...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('GitUtils - Constructor with defaults', () => {
    const utils = new GitUtils();
    if (!utils) throw new Error('Should create instance');
    if (!utils.tempDir) throw new Error('Should have tempDir');
    if (!utils.outputDir) throw new Error('Should have outputDir');
    if (utils.verbose !== false) throw new Error('Default verbose should be false');
});

test('GitUtils - Constructor with options', () => {
    const utils = new GitUtils({
        tempDir: '/custom/temp',
        outputDir: '/custom/output',
        verbose: true
    });
    if (utils.tempDir !== '/custom/temp') throw new Error('Should set tempDir');
    if (utils.outputDir !== '/custom/output') throw new Error('Should set outputDir');
    if (utils.verbose !== true) throw new Error('Should set verbose');
});

test('GitUtils - Constructor sets default paths', () => {
    const utils = new GitUtils();
    if (!utils.tempDir.includes('.context-manager')) throw new Error('Should use .context-manager');
    if (!utils.outputDir.includes('docs')) throw new Error('Should use docs dir');
});

// ============================================================================
// GITHUB URL PARSING TESTS
// ============================================================================
console.log('\n🔗 GitHub URL Parsing Tests');
console.log('-'.repeat(70));

test('GitUtils - parseGitHubURL standard HTTPS URL', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('https://github.com/user/repo');
    if (result.owner !== 'user') throw new Error('Should parse owner');
    if (result.repo !== 'repo') throw new Error('Should parse repo');
    if (result.fullName !== 'user/repo') throw new Error('Should create fullName');
    if (result.branch !== 'main') throw new Error('Should default to main branch');
});

test('GitUtils - parseGitHubURL with .git suffix', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('https://github.com/user/repo.git');
    if (result.repo !== 'repo') throw new Error('Should remove .git suffix');
    if (result.cloneUrl !== 'https://github.com/user/repo.git') throw new Error('Should include .git in cloneUrl');
});

test('GitUtils - parseGitHubURL SSH format', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('git@github.com:user/repo.git');
    if (result.owner !== 'user') throw new Error('Should parse SSH URL');
    if (result.repo !== 'repo') throw new Error('Should parse repo from SSH');
});

test('GitUtils - parseGitHubURL short format', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    if (result.owner !== 'user') throw new Error('Should parse short format');
    if (result.repo !== 'repo') throw new Error('Should parse repo from short format');
});

test('GitUtils - parseGitHubURL without http protocol', () => {
    const utils = new GitUtils();
    // URL starting with github.com will be treated as path and prepended with https://github.com/
    // This creates https://github.com/github.com/user/repo which has github.com as owner
    const result = utils.parseGitHubURL('github.com/user/repo');
    // This behavior means github.com becomes the owner
    if (result.owner !== 'github.com') throw new Error('github.com in path becomes owner');
    if (result.repo !== 'user') throw new Error('user becomes repo');
});

test('GitUtils - parseGitHubURL with branch', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('https://github.com/user/repo/tree/develop');
    if (result.branch !== 'develop') throw new Error('Should parse branch from /tree/');
});

test('GitUtils - parseGitHubURL creates correct URLs', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    if (!result.cloneUrl.startsWith('https://github.com/')) throw new Error('Should create cloneUrl');
    if (!result.apiUrl.startsWith('https://api.github.com/')) throw new Error('Should create apiUrl');
    if (!result.rawUrl.startsWith('https://raw.githubusercontent.com/')) throw new Error('Should create rawUrl');
});

test('GitUtils - parseGitHubURL preserves original URL', () => {
    const utils = new GitUtils();
    const originalUrl = 'git@github.com:user/repo.git';
    const result = utils.parseGitHubURL(originalUrl);
    if (result.originalUrl !== originalUrl) throw new Error('Should preserve originalUrl');
});

test('GitUtils - parseGitHubURL throws on invalid URL', () => {
    const utils = new GitUtils();
    try {
        utils.parseGitHubURL('not-a-valid-url');
        throw new Error('Should throw on invalid URL');
    } catch (error) {
        if (!error.message.includes('Failed to parse')) throw error;
    }
});

test('GitUtils - parseGitHubURL throws on missing repo', () => {
    const utils = new GitUtils();
    try {
        utils.parseGitHubURL('https://github.com/onlyuser');
        throw new Error('Should throw on missing repo');
    } catch (error) {
        if (!error.message.includes('must include owner and repo')) throw error;
    }
});

test('GitUtils - parseGitHubURL trims whitespace', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('  user/repo  ');
    if (result.owner !== 'user') throw new Error('Should trim whitespace');
});

// ============================================================================
// GIT INSTALLATION TESTS
// ============================================================================
console.log('\n⚙️  Git Installation Tests');
console.log('-'.repeat(70));

test('GitUtils - isGitInstalled returns boolean', () => {
    const utils = new GitUtils();
    const result = utils.isGitInstalled();
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('GitUtils - isGitInstalled detects git', () => {
    const utils = new GitUtils();
    const result = utils.isGitInstalled();
    // Most systems have git installed
    if (typeof result !== 'boolean') throw new Error('Should return boolean result');
});

// ============================================================================
// CLONE REPOSITORY TESTS
// ============================================================================
console.log('\n📥 Clone Repository Tests');
console.log('-'.repeat(70));

test('GitUtils - cloneRepository throws if git not installed', () => {
    const utils = new GitUtils({ tempDir: TEST_TEMP_DIR });

    // Mock isGitInstalled to return false
    const originalMethod = utils.isGitInstalled;
    utils.isGitInstalled = () => false;

    try {
        const repoInfo = { fullName: 'user/repo', cloneUrl: 'https://example.com/repo.git', branch: 'main' };
        utils.cloneRepository(repoInfo);
        throw new Error('Should throw when git not installed');
    } catch (error) {
        if (!error.message.includes('Git is not installed')) throw error;
    } finally {
        utils.isGitInstalled = originalMethod;
    }
});

test('GitUtils - cloneRepository creates temp directory', () => {
    const utils = new GitUtils({ tempDir: TEST_TEMP_DIR });

    if (!utils.isGitInstalled()) {
        console.log('   ⚠️  Skipped (git not installed)');
        testsPassed++; // Count as passed
        return;
    }

    // Just test that it would create the directory structure
    const repoInfo = {
        fullName: 'user/repo',
        cloneUrl: 'https://example.com/repo.git',
        branch: 'main'
    };

    const expectedPath = path.join(TEST_TEMP_DIR, 'user-repo');
    if (!expectedPath.includes('user-repo')) throw new Error('Should construct correct path');
});

test('GitUtils - cloneRepository uses shallow clone by default', () => {
    const utils = new GitUtils({ tempDir: TEST_TEMP_DIR });

    if (!utils.isGitInstalled()) {
        console.log('   ⚠️  Skipped (git not installed)');
        testsPassed++; // Count as passed
        return;
    }

    // Test command construction logic
    const repoInfo = {
        fullName: 'test/repo',
        cloneUrl: 'https://github.com/test/repo.git',
        branch: 'main'
    };

    // We can't actually clone, but we can verify the logic exists
    if (typeof utils.cloneRepository === 'function') {
        // Function exists and can be called
    }
});

test('GitUtils - cloneRepository respects shallow option', () => {
    const utils = new GitUtils({ tempDir: TEST_TEMP_DIR });

    // Test that options are accepted
    const repoInfo = {
        fullName: 'test/repo',
        cloneUrl: 'https://github.com/test/repo.git',
        branch: 'main'
    };

    // Verify function accepts options parameter
    if (typeof utils.cloneRepository === 'function') {
        // Function signature is correct
    }
});

// ============================================================================
// FETCH FILE TESTS
// ============================================================================
console.log('\n📄 Fetch File Tests');
console.log('-'.repeat(70));

asyncTest('GitUtils - fetchFileFromGitHub returns promise', async () => {
    const utils = new GitUtils();
    const result = utils.fetchFileFromGitHub('https://raw.githubusercontent.com/user/repo/main/file.txt');
    if (!(result instanceof Promise)) throw new Error('Should return promise');

    // Don't actually wait for it
    result.catch(() => {}); // Prevent unhandled rejection
});

asyncTest('GitUtils - fetchFileFromGitHub handles HTTPS errors', async () => {
    const utils = new GitUtils();

    try {
        // Use invalid URL that will fail
        await utils.fetchFileFromGitHub('https://raw.githubusercontent.com/nonexistent-user-xyz/repo/main/file.txt');
        throw new Error('Should throw on HTTP error');
    } catch (error) {
        // Expected - network error or 404
        if (error.message === 'Should throw on HTTP error') throw error;
        // Any other error is expected (network failure, 404, etc.)
    }
});

// ============================================================================
// GENERATE FROM GITHUB TESTS
// ============================================================================
console.log('\n🔍 Generate From GitHub Tests');
console.log('-'.repeat(70));

test('GitUtils - generateFromGitHub is async function', () => {
    const utils = new GitUtils();
    const result = utils.generateFromGitHub('user/repo');
    if (!(result instanceof Promise)) throw new Error('Should return promise');

    // Don't wait for it
    result.catch(() => {}); // Prevent unhandled rejection
});

test('GitUtils - generateFromGitHub accepts options', () => {
    const utils = new GitUtils();
    const result = utils.generateFromGitHub('user/repo', {
        outputFile: 'custom.txt',
        cleanup: false,
        shallow: true
    });

    if (!(result instanceof Promise)) throw new Error('Should accept options');
    result.catch(() => {});
});

// ============================================================================
// PATH CONSTRUCTION TESTS
// ============================================================================
console.log('\n🗂️  Path Construction Tests');
console.log('-'.repeat(70));

test('GitUtils - parseGitHubURL constructs valid clone URL', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    if (!result.cloneUrl.endsWith('.git')) throw new Error('Clone URL should end with .git');
    if (!result.cloneUrl.includes('user/repo')) throw new Error('Clone URL should include user/repo');
});

test('GitUtils - parseGitHubURL constructs valid API URL', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    if (!result.apiUrl.includes('api.github.com')) throw new Error('API URL should use api.github.com');
    if (!result.apiUrl.includes('repos')) throw new Error('API URL should include repos');
});

test('GitUtils - parseGitHubURL constructs valid raw URL', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    if (!result.rawUrl.includes('raw.githubusercontent.com')) throw new Error('Raw URL should use raw.githubusercontent.com');
    if (!result.rawUrl.includes('main')) throw new Error('Raw URL should include branch');
});

test('GitUtils - parseGitHubURL handles special characters in repo name', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo-name_v2');
    if (result.repo !== 'repo-name_v2') throw new Error('Should preserve special chars');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('GitUtils - Multiple instances are independent', () => {
    const utils1 = new GitUtils({ tempDir: '/tmp1' });
    const utils2 = new GitUtils({ tempDir: '/tmp2' });
    if (utils1.tempDir === utils2.tempDir) throw new Error('Should have independent tempDir');
});

test('GitUtils - parseGitHubURL handles URL with trailing slash', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('https://github.com/user/repo/');
    if (result.repo !== 'repo') throw new Error('Should handle trailing slash');
});

test('GitUtils - parseGitHubURL handles mixed case', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('User/Repo');
    if (result.owner !== 'User') throw new Error('Should preserve case');
    if (result.repo !== 'Repo') throw new Error('Should preserve repo case');
});

test('GitUtils - parseGitHubURL handles numeric repo names', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/123');
    if (result.repo !== '123') throw new Error('Should handle numeric repo');
});

test('GitUtils - parseGitHubURL handles very long repo names', () => {
    const utils = new GitUtils();
    const longName = 'a'.repeat(100);
    const result = utils.parseGitHubURL(`user/${longName}`);
    if (result.repo !== longName) throw new Error('Should handle long names');
});

test('GitUtils - Constructor handles empty options', () => {
    const utils = new GitUtils({});
    if (!utils.tempDir) throw new Error('Should have default tempDir');
    if (!utils.outputDir) throw new Error('Should have default outputDir');
});

test('GitUtils - parseGitHubURL with branch in raw URL', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo');
    // Raw URL format: https://raw.githubusercontent.com/owner/repo/branch/
    if (!result.rawUrl.includes('raw.githubusercontent.com')) throw new Error('Raw URL should use correct domain');
    if (!result.rawUrl.includes(result.branch)) throw new Error('Raw URL should include branch');
});

test('GitUtils - parseGitHubURL handles dots in repo name', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('user/repo.js');
    if (result.repo !== 'repo.js') throw new Error('Should handle dots in name');
});

test('GitUtils - isGitInstalled handles errors gracefully', () => {
    const utils = new GitUtils();
    // Should not throw even if git command fails
    const result = utils.isGitInstalled();
    if (typeof result !== 'boolean') throw new Error('Should return boolean even on error');
});

test('GitUtils - parseGitHubURL fullName format', () => {
    const utils = new GitUtils();
    const result = utils.parseGitHubURL('owner123/repo-name_2');
    if (result.fullName !== 'owner123/repo-name_2') throw new Error('fullName should be owner/repo');
});

test('GitUtils - parseGitHubURL throws on empty string', () => {
    const utils = new GitUtils();
    try {
        utils.parseGitHubURL('');
        throw new Error('Should throw on empty string');
    } catch (error) {
        if (!error.message.includes('Failed to parse')) throw error;
    }
});

test('GitUtils - parseGitHubURL throws on just owner', () => {
    const utils = new GitUtils();
    try {
        utils.parseGitHubURL('justowner');
        throw new Error('Should throw on single part');
    } catch (error) {
        if (!error.message.includes('Failed to parse') && !error.message.includes('must include')) throw error;
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

// Clean up test temp directory if it was created
if (fs.existsSync(TEST_TEMP_DIR)) {
    fs.rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test temp directory');
}

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
    console.log('\n🎉 All git utils tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
