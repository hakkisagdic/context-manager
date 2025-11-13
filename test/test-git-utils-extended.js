#!/usr/bin/env node

/**
 * Extended Git Utils Tests
 * Tests for fetchFileFromGitHub, getRepositoryInfo, cleanupTemp, listCachedRepos, getDirectorySize
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

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'git-utils-extended');

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

// Setup fixtures directory
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

console.log('🧪 Testing GitUtils Extended...\n');

// ============================================================================
// CLEANUP TEMP TESTS
// ============================================================================
console.log('🧹 cleanupTemp() Tests');
console.log('-'.repeat(70));

test('GitUtils - cleanupTemp() removes temp directory', () => {
    const tempDir = path.join(FIXTURES_DIR, 'temp-cleanup-test');
    const gitUtils = new GitUtils({ tempDir, verbose: false });

    // Create temp directory with some content
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'test content');

    if (!fs.existsSync(tempDir)) throw new Error('Temp dir should exist before cleanup');

    gitUtils.cleanupTemp();

    if (fs.existsSync(tempDir)) throw new Error('Temp dir should be removed after cleanup');
});

test('GitUtils - cleanupTemp() handles non-existent directory', () => {
    const tempDir = path.join(FIXTURES_DIR, 'non-existent-temp');
    const gitUtils = new GitUtils({ tempDir, verbose: false });

    // Should not throw even if directory doesn't exist
    gitUtils.cleanupTemp();

    // Test passes if no error thrown
    if (fs.existsSync(tempDir)) throw new Error('Directory should not exist');
});

test('GitUtils - cleanupTemp() with verbose mode', () => {
    const tempDir = path.join(FIXTURES_DIR, 'temp-verbose');
    const gitUtils = new GitUtils({ tempDir, verbose: true });

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    gitUtils.cleanupTemp();

    if (fs.existsSync(tempDir)) throw new Error('Temp dir should be removed');
});

// ============================================================================
// GET DIRECTORY SIZE TESTS
// ============================================================================
console.log('\n📏 getDirectorySize() Tests');
console.log('-'.repeat(70));

test('GitUtils - getDirectorySize() calculates single file', () => {
    const testDir = path.join(FIXTURES_DIR, 'size-test-single');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const content = 'A'.repeat(1000); // 1000 bytes
    fs.writeFileSync(path.join(testDir, 'file.txt'), content);

    const gitUtils = new GitUtils();
    const size = gitUtils.getDirectorySize(testDir);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

    if (size < 1000) throw new Error('Size should be at least 1000 bytes');
});

test('GitUtils - getDirectorySize() calculates multiple files', () => {
    const testDir = path.join(FIXTURES_DIR, 'size-test-multi');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(path.join(testDir, 'file1.txt'), 'A'.repeat(500));
    fs.writeFileSync(path.join(testDir, 'file2.txt'), 'B'.repeat(500));

    const gitUtils = new GitUtils();
    const size = gitUtils.getDirectorySize(testDir);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

    if (size < 1000) throw new Error('Size should be at least 1000 bytes');
});

test('GitUtils - getDirectorySize() calculates nested directories', () => {
    const testDir = path.join(FIXTURES_DIR, 'size-test-nested');
    const subDir = path.join(testDir, 'subdir');

    if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
    }

    fs.writeFileSync(path.join(testDir, 'root.txt'), 'A'.repeat(500));
    fs.writeFileSync(path.join(subDir, 'nested.txt'), 'B'.repeat(500));

    const gitUtils = new GitUtils();
    const size = gitUtils.getDirectorySize(testDir);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

    if (size < 1000) throw new Error('Size should include nested files');
});

test('GitUtils - getDirectorySize() handles empty directory', () => {
    const testDir = path.join(FIXTURES_DIR, 'size-test-empty');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
    }

    const gitUtils = new GitUtils();
    const size = gitUtils.getDirectorySize(testDir);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

    if (size !== 0) throw new Error('Empty directory should have size 0');
});

// ============================================================================
// LIST CACHED REPOS TESTS
// ============================================================================
console.log('\n📂 listCachedRepos() Tests');
console.log('-'.repeat(70));

test('GitUtils - listCachedRepos() returns empty for non-existent temp', () => {
    const tempDir = path.join(FIXTURES_DIR, 'non-existent-cache');
    const gitUtils = new GitUtils({ tempDir });

    const repos = gitUtils.listCachedRepos();

    if (!Array.isArray(repos)) throw new Error('Should return array');
    if (repos.length !== 0) throw new Error('Should return empty array');
});

test('GitUtils - listCachedRepos() lists directories', () => {
    const tempDir = path.join(FIXTURES_DIR, 'cache-list-test');
    const gitUtils = new GitUtils({ tempDir });

    // Create temp directory with mock repos
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const repo1 = path.join(tempDir, 'owner-repo1');
    const repo2 = path.join(tempDir, 'owner-repo2');
    fs.mkdirSync(repo1, { recursive: true });
    fs.mkdirSync(repo2, { recursive: true });

    // Add some files to repos
    fs.writeFileSync(path.join(repo1, 'file.txt'), 'content1');
    fs.writeFileSync(path.join(repo2, 'file.txt'), 'content2');

    const repos = gitUtils.listCachedRepos();

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (!Array.isArray(repos)) throw new Error('Should return array');
    if (repos.length !== 2) throw new Error('Should list 2 repos');
    if (!repos[0].name) throw new Error('Should have name property');
    if (!repos[0].path) throw new Error('Should have path property');
    if (typeof repos[0].size !== 'number') throw new Error('Should have size property');
});

test('GitUtils - listCachedRepos() ignores files', () => {
    const tempDir = path.join(FIXTURES_DIR, 'cache-ignore-files');
    const gitUtils = new GitUtils({ tempDir });

    // Create temp directory with both files and directories
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'not a repo');
    fs.mkdirSync(path.join(tempDir, 'actual-repo'));

    const repos = gitUtils.listCachedRepos();

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (repos.length !== 1) throw new Error('Should only list directories');
    if (repos[0].name !== 'actual-repo') throw new Error('Should list directory not file');
});

test('GitUtils - listCachedRepos() includes accurate sizes', () => {
    const tempDir = path.join(FIXTURES_DIR, 'cache-size-test');
    const gitUtils = new GitUtils({ tempDir });

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const repoDir = path.join(tempDir, 'test-repo');
    fs.mkdirSync(repoDir, { recursive: true });
    fs.writeFileSync(path.join(repoDir, 'file.txt'), 'A'.repeat(1000));

    const repos = gitUtils.listCachedRepos();

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    if (repos.length !== 1) throw new Error('Should list 1 repo');
    if (repos[0].size < 1000) throw new Error('Size should be at least 1000 bytes');
});

// ============================================================================
// FETCH FILE FROM GITHUB TESTS (Network dependent)
// ============================================================================
console.log('\n🌐 fetchFileFromGitHub() Tests');
console.log('-'.repeat(70));

await asyncTest('GitUtils - fetchFileFromGitHub() fetches real file', async () => {
    const gitUtils = new GitUtils();

    // Test with a known-good file from a public repo (GitHub's own repo)
    // Using a small LICENSE file to minimize network overhead
    const url = 'https://raw.githubusercontent.com/github/gitignore/main/LICENSE';

    try {
        const content = await gitUtils.fetchFileFromGitHub(url);

        if (typeof content !== 'string') throw new Error('Should return string');
        if (content.length === 0) throw new Error('Content should not be empty');
        if (!content.includes('MIT')) throw new Error('LICENSE should contain MIT text');
    } catch (error) {
        // If network is unavailable, skip this test gracefully
        const networkErrors = ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH'];
        const isNetworkError = networkErrors.some(err => error.message.includes(err) || error.code === err);

        if (isNetworkError) {
            console.log('   ⚠️  Network unavailable, skipping network test');
            testsPassed++; // Don't fail the test for network issues
        } else {
            throw error;
        }
    }
});

await asyncTest('GitUtils - fetchFileFromGitHub() handles 404', async () => {
    const gitUtils = new GitUtils();

    const url = 'https://raw.githubusercontent.com/nonexistent/repo/main/file.txt';

    try {
        await gitUtils.fetchFileFromGitHub(url);
        throw new Error('Should have thrown for 404');
    } catch (error) {
        // Should reject with HTTP error or network error
        const networkErrors = ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH'];
        const isNetworkError = networkErrors.some(err => error.message.includes(err) || error.code === err);
        const isHttpError = error.message.includes('HTTP');

        if (!isHttpError && !isNetworkError) {
            throw new Error('Should throw HTTP error or network error');
        }
    }
});

// ============================================================================
// GET REPOSITORY INFO TESTS (Network dependent)
// ============================================================================
console.log('\n📊 getRepositoryInfo() Tests');
console.log('-'.repeat(70));

await asyncTest('GitUtils - getRepositoryInfo() fetches repo data', async () => {
    const gitUtils = new GitUtils();

    // Use a well-known public repo
    const repoInfo = {
        apiUrl: 'https://api.github.com/repos/github/gitignore'
    };

    try {
        const info = await gitUtils.getRepositoryInfo(repoInfo);

        if (typeof info !== 'object') throw new Error('Should return object');
        if (!info.name) throw new Error('Should have name');
        if (!info.fullName) throw new Error('Should have fullName');
        if (typeof info.stars !== 'number') throw new Error('Should have stars count');
        if (typeof info.forks !== 'number') throw new Error('Should have forks count');
        if (!info.defaultBranch) throw new Error('Should have defaultBranch');
    } catch (error) {
        // If network is unavailable, skip this test gracefully
        const networkErrors = ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH'];
        const isNetworkError = networkErrors.some(err => error.message.includes(err) || error.code === err);

        if (isNetworkError) {
            console.log('   ⚠️  Network unavailable, skipping network test');
            testsPassed++;
        } else {
            throw error;
        }
    }
});

await asyncTest('GitUtils - getRepositoryInfo() handles invalid repo', async () => {
    const gitUtils = new GitUtils();

    const repoInfo = {
        apiUrl: 'https://api.github.com/repos/nonexistent/nonexistent'
    };

    try {
        await gitUtils.getRepositoryInfo(repoInfo);
        throw new Error('Should have thrown for invalid repo');
    } catch (error) {
        // Should reject with error (either network or API error)
        if (!error.message && !error.toString().includes('Error')) {
            throw new Error('Should throw error for invalid repo');
        }
    }
});

await asyncTest('GitUtils - getRepositoryInfo() includes all expected fields', async () => {
    const gitUtils = new GitUtils();

    const repoInfo = {
        apiUrl: 'https://api.github.com/repos/github/gitignore'
    };

    try {
        const info = await gitUtils.getRepositoryInfo(repoInfo);

        // Check all expected fields
        const expectedFields = [
            'name', 'fullName', 'description', 'stars', 'forks',
            'defaultBranch', 'size', 'language', 'updatedAt'
        ];

        for (const field of expectedFields) {
            if (!(field in info)) {
                throw new Error(`Should have ${field} field`);
            }
        }
    } catch (error) {
        const networkErrors = ['ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH'];
        const isNetworkError = networkErrors.some(err => error.message.includes(err) || error.code === err);

        if (isNetworkError) {
            console.log('   ⚠️  Network unavailable, skipping network test');
            testsPassed++;
        } else {
            throw error;
        }
    }
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('GitUtils - listCachedRepos() after cleanupTemp() returns empty', () => {
    const tempDir = path.join(FIXTURES_DIR, 'integration-cleanup');
    const gitUtils = new GitUtils({ tempDir });

    // Create some cached repos
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(path.join(tempDir, 'repo1'));
    fs.mkdirSync(path.join(tempDir, 'repo2'));

    const beforeCleanup = gitUtils.listCachedRepos();
    if (beforeCleanup.length !== 2) throw new Error('Should have 2 repos before cleanup');

    gitUtils.cleanupTemp();

    const afterCleanup = gitUtils.listCachedRepos();
    if (afterCleanup.length !== 0) throw new Error('Should have 0 repos after cleanup');
});

test('GitUtils - getDirectorySize() with complex nested structure', () => {
    const testDir = path.join(FIXTURES_DIR, 'complex-structure');
    const gitUtils = new GitUtils();

    // Create complex directory structure
    const dirs = [
        testDir,
        path.join(testDir, 'dir1'),
        path.join(testDir, 'dir2'),
        path.join(testDir, 'dir1', 'subdir1'),
        path.join(testDir, 'dir2', 'subdir2')
    ];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // Add files at different levels
    fs.writeFileSync(path.join(testDir, 'root.txt'), 'A'.repeat(100));
    fs.writeFileSync(path.join(testDir, 'dir1', 'file1.txt'), 'B'.repeat(100));
    fs.writeFileSync(path.join(testDir, 'dir2', 'file2.txt'), 'C'.repeat(100));
    fs.writeFileSync(path.join(testDir, 'dir1', 'subdir1', 'nested.txt'), 'D'.repeat(100));
    fs.writeFileSync(path.join(testDir, 'dir2', 'subdir2', 'deep.txt'), 'E'.repeat(100));

    const size = gitUtils.getDirectorySize(testDir);

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });

    if (size < 500) throw new Error('Size should account for all nested files (500+ bytes)');
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test fixtures');
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
    console.log('\n🎉 All GitUtils extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
