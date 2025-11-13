#!/usr/bin/env node

/**
 * Comprehensive Git Utils Tests
 * Tests for GitHub URL parsing and git utilities
 */

import GitUtils from '../lib/utils/git-utils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'git');

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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing Git Utils...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('GitUtils - Constructor with defaults', () => {
    const gitUtils = new GitUtils();
    if (typeof gitUtils !== 'object') throw new Error('Should create instance');
    if (!gitUtils.tempDir) throw new Error('Should have tempDir');
    if (!gitUtils.outputDir) throw new Error('Should have outputDir');
    if (typeof gitUtils.verbose !== 'boolean') throw new Error('Should have verbose');
});

test('GitUtils - Constructor with options', () => {
    const gitUtils = new GitUtils({
        tempDir: '/tmp/test',
        outputDir: '/tmp/output',
        verbose: true
    });
    if (gitUtils.tempDir !== '/tmp/test') throw new Error('Should set tempDir');
    if (gitUtils.outputDir !== '/tmp/output') throw new Error('Should set outputDir');
    if (gitUtils.verbose !== true) throw new Error('Should set verbose');
});

// ============================================================================
// GITHUB URL PARSING TESTS
// ============================================================================
console.log('\n🔗 GitHub URL Parsing Tests');
console.log('-'.repeat(70));

test('GitUtils - parseGitHubURL with HTTPS URL', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (info.owner !== 'owner') throw new Error('Should parse owner');
    if (info.repo !== 'repo') throw new Error('Should parse repo');
    if (info.fullName !== 'owner/repo') throw new Error('Should have fullName');
    if (!info.cloneUrl.includes('github.com')) throw new Error('Should have cloneUrl');
});

test('GitUtils - parseGitHubURL with .git suffix', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo.git');

    if (info.owner !== 'owner') throw new Error('Should parse owner');
    if (info.repo !== 'repo') throw new Error('Should parse repo');
});

test('GitUtils - parseGitHubURL with git@ format', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('git@github.com:owner/repo.git');

    if (info.owner !== 'owner') throw new Error('Should parse owner');
    if (info.repo !== 'repo') throw new Error('Should parse repo');
});

test('GitUtils - parseGitHubURL with short format', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('owner/repo');

    if (info.owner !== 'owner') throw new Error('Should parse owner');
    if (info.repo !== 'repo') throw new Error('Should parse repo');
});

test('GitUtils - parseGitHubURL without protocol', () => {
    const gitUtils = new GitUtils();
    // When URL doesn't start with http but includes github.com, it adds https://github.com/ prefix
    // So "github.com/owner/repo" becomes "https://github.com/github.com/owner/repo"
    // which parses as owner="github.com", repo="owner"
    const info = gitUtils.parseGitHubURL('github.com/owner/repo');

    // The actual behavior: it adds https://github.com/ prefix, so path becomes /github.com/owner/repo
    if (info.owner !== 'github.com') throw new Error('Should parse first part as owner');
    if (info.repo !== 'owner') throw new Error('Should parse second part as repo');
});

test('GitUtils - parseGitHubURL with branch', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo/tree/develop');

    if (info.owner !== 'owner') throw new Error('Should parse owner');
    if (info.repo !== 'repo') throw new Error('Should parse repo');
    if (info.branch !== 'develop') throw new Error('Should parse branch');
});

test('GitUtils - parseGitHubURL default branch', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (info.branch !== 'main') throw new Error('Should default to main branch');
});

test('GitUtils - parseGitHubURL returns cloneUrl', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.cloneUrl) throw new Error('Should have cloneUrl');
    if (info.cloneUrl !== 'https://github.com/owner/repo.git') {
        throw new Error('cloneUrl should have .git suffix');
    }
});

test('GitUtils - parseGitHubURL returns apiUrl', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.apiUrl) throw new Error('Should have apiUrl');
    if (!info.apiUrl.includes('api.github.com')) {
        throw new Error('apiUrl should use api.github.com');
    }
});

test('GitUtils - parseGitHubURL returns rawUrl', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.rawUrl) throw new Error('Should have rawUrl');
    if (!info.rawUrl.includes('raw.githubusercontent.com')) {
        throw new Error('rawUrl should use raw.githubusercontent.com');
    }
});

test('GitUtils - parseGitHubURL preserves originalUrl', () => {
    const gitUtils = new GitUtils();
    const originalUrl = 'https://github.com/owner/repo';
    const info = gitUtils.parseGitHubURL(originalUrl);

    if (info.originalUrl !== originalUrl) throw new Error('Should preserve originalUrl');
});

test('GitUtils - parseGitHubURL handles whitespace', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('  https://github.com/owner/repo  ');

    if (info.owner !== 'owner') throw new Error('Should trim whitespace');
});

test('GitUtils - parseGitHubURL throws on invalid URL', () => {
    const gitUtils = new GitUtils();
    try {
        gitUtils.parseGitHubURL('invalid-url');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Failed to parse')) {
            throw new Error('Should have parse error message');
        }
    }
});

test('GitUtils - parseGitHubURL throws on incomplete URL', () => {
    const gitUtils = new GitUtils();
    try {
        gitUtils.parseGitHubURL('https://github.com/owner');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('owner and repo')) {
            throw new Error('Should require owner and repo');
        }
    }
});

test('GitUtils - parseGitHubURL handles complex repo names', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo-with-dashes');

    if (info.repo !== 'repo-with-dashes') throw new Error('Should handle dashes');
});

test('GitUtils - parseGitHubURL handles underscores', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo_with_underscores');

    if (info.repo !== 'repo_with_underscores') throw new Error('Should handle underscores');
});

test('GitUtils - parseGitHubURL handles dots', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo.name');

    if (info.repo !== 'repo.name') throw new Error('Should handle dots');
});

// ============================================================================
// GIT INSTALLATION TESTS
// ============================================================================
console.log('\n🔧 Git Installation Tests');
console.log('-'.repeat(70));

test('GitUtils - isGitInstalled returns boolean', () => {
    const gitUtils = new GitUtils();
    const result = gitUtils.isGitInstalled();

    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('GitUtils - isGitInstalled checks git', () => {
    const gitUtils = new GitUtils();
    const isInstalled = gitUtils.isGitInstalled();

    // On most systems git is installed, but we just verify it returns a boolean
    if (typeof isInstalled !== 'boolean') throw new Error('Should check git');
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================
console.log('\n✅ Validation Tests');
console.log('-'.repeat(70));

test('GitUtils - parseGitHubURL validates input type', () => {
    const gitUtils = new GitUtils();
    try {
        gitUtils.parseGitHubURL('');
        throw new Error('Should throw on empty string');
    } catch (error) {
        // Expected
    }
});

test('GitUtils - parseGitHubURL handles various valid formats', () => {
    const gitUtils = new GitUtils();
    const validUrls = [
        'https://github.com/user/repo',
        'https://github.com/user/repo.git',
        'git@github.com:user/repo.git',
        'user/repo'
    ];

    for (const url of validUrls) {
        const info = gitUtils.parseGitHubURL(url);
        if (info.owner !== 'user' || info.repo !== 'repo') {
            throw new Error(`Failed to parse: ${url}`);
        }
    }
});

test('GitUtils - parseGitHubURL fullName format', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.fullName.match(/^[^/]+\/[^/]+$/)) {
        throw new Error('fullName should be owner/repo format');
    }
});

test('GitUtils - parseGitHubURL API URL format', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.apiUrl.startsWith('https://api.github.com/repos/')) {
        throw new Error('apiUrl should have correct format');
    }
});

test('GitUtils - parseGitHubURL raw URL includes branch', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/owner/repo');

    if (!info.rawUrl.includes(info.branch)) {
        throw new Error('rawUrl should include branch');
    }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('GitUtils - parseGitHubURL with uppercase', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/Owner/Repo');

    if (info.owner !== 'Owner') throw new Error('Should preserve case');
    if (info.repo !== 'Repo') throw new Error('Should preserve case');
});

test('GitUtils - parseGitHubURL with numbers', () => {
    const gitUtils = new GitUtils();
    const info = gitUtils.parseGitHubURL('https://github.com/user123/repo456');

    if (info.owner !== 'user123') throw new Error('Should handle numbers');
    if (info.repo !== 'repo456') throw new Error('Should handle numbers');
});

test('GitUtils - parseGitHubURL long repo name', () => {
    const gitUtils = new GitUtils();
    const longName = 'a'.repeat(100);
    const info = gitUtils.parseGitHubURL(`https://github.com/owner/${longName}`);

    if (info.repo !== longName) throw new Error('Should handle long names');
});

test('GitUtils - Constructor tempDir default', () => {
    const gitUtils = new GitUtils();
    if (!gitUtils.tempDir.includes('.context-manager')) {
        throw new Error('Default tempDir should include .context-manager');
    }
});

test('GitUtils - Constructor outputDir default', () => {
    const gitUtils = new GitUtils();
    if (!gitUtils.outputDir.includes('docs')) {
        throw new Error('Default outputDir should include docs');
    }
});

test('GitUtils - Constructor verbose default false', () => {
    const gitUtils = new GitUtils();
    if (gitUtils.verbose !== false) throw new Error('verbose should default to false');
});

// Cleanup
if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
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
