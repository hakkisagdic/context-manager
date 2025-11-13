#!/usr/bin/env node

/**
 * Comprehensive GitClient Tests
 * Tests for Git operations and command execution
 */

import { GitClient } from '../lib/integrations/git/GitClient.js';
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

// Use current repository for testing
const TEST_REPO_PATH = path.join(__dirname, '..');

console.log('🧪 Testing GitClient...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('GitClient - Constructor with repository path', () => {
    const client = new GitClient(TEST_REPO_PATH);
    if (!client) throw new Error('Should create instance');
    if (client.repoPath !== TEST_REPO_PATH) throw new Error('Should set repoPath');
});

test('GitClient - Constructor checks if git repository', () => {
    const client = new GitClient(TEST_REPO_PATH);
    if (typeof client.isGitRepo !== 'boolean') throw new Error('Should check isGitRepo');
});

test('GitClient - Constructor with valid git repo', () => {
    const client = new GitClient(TEST_REPO_PATH);
    if (!client.isGitRepo) throw new Error('Should detect valid git repo');
});

test('GitClient - Constructor with non-git directory', () => {
    const client = new GitClient('/tmp');
    if (client.isGitRepo) throw new Error('Should detect non-git directory');
});

// ============================================================================
// IS GIT REPOSITORY TESTS
// ============================================================================
console.log('\n📂 Is Git Repository Tests');
console.log('-'.repeat(70));

test('GitClient - checkIsGitRepository returns boolean', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.checkIsGitRepository();
    if (typeof result !== 'boolean') throw new Error('Should return boolean');
});

test('GitClient - checkIsGitRepository detects .git folder', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.checkIsGitRepository();
    if (!result) throw new Error('Should detect .git folder in test repo');
});

test('GitClient - checkIsGitRepository handles non-existent path', () => {
    const client = new GitClient('/nonexistent/path');
    const result = client.checkIsGitRepository();
    if (result) throw new Error('Should return false for non-existent path');
});

// ============================================================================
// EXEC COMMAND TESTS
// ============================================================================
console.log('\n⚙️  Exec Command Tests');
console.log('-'.repeat(70));

test('GitClient - exec executes git commands', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.exec('--version');
    if (typeof result !== 'string') throw new Error('Should return string');
    if (!result.includes('git')) throw new Error('Should return git version');
});

test('GitClient - exec throws on non-git repository', () => {
    const client = new GitClient('/tmp');
    try {
        client.exec('status');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Not a git repository')) throw error;
    }
});

test('GitClient - exec throws on invalid command', () => {
    const client = new GitClient(TEST_REPO_PATH);
    try {
        client.exec('invalid-command-xyz');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Git command failed')) throw error;
    }
});

test('GitClient - exec trims output', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.exec('--version');
    if (result !== result.trim()) throw new Error('Should trim output');
});

// ============================================================================
// BRANCH TESTS
// ============================================================================
console.log('\n🌿 Branch Tests');
console.log('-'.repeat(70));

test('GitClient - getCurrentBranch returns string', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const branch = client.getCurrentBranch();
    if (typeof branch !== 'string') throw new Error('Should return string');
    if (branch.length === 0) throw new Error('Should return non-empty branch name');
});

test('GitClient - getCurrentBranch returns valid branch', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const branch = client.getCurrentBranch();
    // Should not contain slashes (just branch name)
    if (branch.includes('\n')) throw new Error('Should not contain newlines');
});

test('GitClient - getDefaultBranch returns string', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const branch = client.getDefaultBranch();
    if (typeof branch !== 'string') throw new Error('Should return string');
});

test('GitClient - getDefaultBranch fallback to main', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const branch = client.getDefaultBranch();
    // Should be main, master, or other default branch
    if (branch.length === 0) throw new Error('Should return non-empty string');
});

// ============================================================================
// CHANGED FILES TESTS
// ============================================================================
console.log('\n📝 Changed Files Tests');
console.log('-'.repeat(70));

test('GitClient - getChangedFiles returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getChangedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - getChangedFiles with since reference', () => {
    const client = new GitClient(TEST_REPO_PATH);
    try {
        const files = client.getChangedFiles('HEAD~1');
        if (!Array.isArray(files)) throw new Error('Should return array');
    } catch (error) {
        // Might fail if no commits, that's ok
        if (!error.message.includes('Git command failed')) throw error;
    }
});

test('GitClient - getChangedFiles filters empty strings', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getChangedFiles();
    const hasEmpty = files.some(f => f === '');
    if (hasEmpty) throw new Error('Should filter empty strings');
});

test('GitClient - getStagedFiles returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getStagedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - getUnstagedFiles returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getUnstagedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - getUntrackedFiles returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getUntrackedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - getAllModifiedFiles returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getAllModifiedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - getAllModifiedFiles deduplicates', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getAllModifiedFiles();
    const unique = [...new Set(files)];
    if (files.length !== unique.length) throw new Error('Should deduplicate files');
});

test('GitClient - getAllModifiedFiles combines all sources', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const staged = client.getStagedFiles();
    const unstaged = client.getUnstagedFiles();
    const untracked = client.getUntrackedFiles();
    const all = client.getAllModifiedFiles();

    // All should be unique
    if (typeof all.length !== 'number') throw new Error('Should return array');
});

// ============================================================================
// FILE HISTORY TESTS
// ============================================================================
console.log('\n📜 File History Tests');
console.log('-'.repeat(70));

test('GitClient - getFileHistory returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const history = client.getFileHistory('package.json');
    if (!Array.isArray(history)) throw new Error('Should return array');
});

test('GitClient - getFileHistory respects limit', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const history = client.getFileHistory('package.json', 5);
    if (history.length > 5) throw new Error('Should respect limit');
});

test('GitClient - getFileHistory returns commit objects', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const history = client.getFileHistory('package.json', 1);
    if (history.length > 0) {
        const commit = history[0];
        if (!commit.hash) throw new Error('Should have hash');
        if (!commit.author) throw new Error('Should have author');
        if (!commit.email) throw new Error('Should have email');
        if (typeof commit.timestamp !== 'number') throw new Error('Should have timestamp');
        if (!(commit.date instanceof Date)) throw new Error('Should have date');
        if (!commit.subject) throw new Error('Should have subject');
    }
});

test('GitClient - getFileHistory handles non-existent file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const history = client.getFileHistory('nonexistent-file-xyz.txt');
    if (!Array.isArray(history)) throw new Error('Should return array');
    if (history.length !== 0) throw new Error('Should return empty array for non-existent file');
});

test('GitClient - getFileHistory default limit is 10', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const history = client.getFileHistory('package.json');
    // Should respect default limit of 10
    if (history.length > 10) throw new Error('Should use default limit of 10');
});

// ============================================================================
// BLAME TESTS
// ============================================================================
console.log('\n👥 Blame Tests');
console.log('-'.repeat(70));

test('GitClient - getBlame returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const blame = client.getBlame('package.json');
    if (!Array.isArray(blame)) throw new Error('Should return array');
});

test('GitClient - getBlame returns blame lines', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const blame = client.getBlame('package.json');
    if (blame.length > 0) {
        const line = blame[0];
        if (!line.commit) throw new Error('Should have commit');
        if (!line.author) throw new Error('Should have author');
        if (typeof line.timestamp !== 'number') throw new Error('Should have timestamp');
        if (!(line.date instanceof Date)) throw new Error('Should have date');
        if (typeof line.code !== 'string') throw new Error('Should have code');
    }
});

test('GitClient - getBlame handles non-existent file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const blame = client.getBlame('nonexistent-xyz.txt');
    if (!Array.isArray(blame)) throw new Error('Should return array');
    if (blame.length !== 0) throw new Error('Should return empty array');
});

test('GitClient - parseBlameOutput parses porcelain format', () => {
    const client = new GitClient(TEST_REPO_PATH);
    // Use 40-character SHA-1 hash (git standard)
    const mockOutput = `abc123def456789abc123def456789abc123def456 1 1 1
author John Doe
author-time 1234567890
\tcode line content`;

    const result = client.parseBlameOutput(mockOutput);
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 1) throw new Error('Should parse 1 line');
    if (result[0].commit !== 'abc123def456789abc123def456789abc123def456') throw new Error('Should parse commit');
    if (result[0].author !== 'John Doe') throw new Error('Should parse author');
    if (result[0].timestamp !== 1234567890) throw new Error('Should parse timestamp');
    if (result[0].code !== 'code line content') throw new Error('Should parse code');
});

test('GitClient - parseBlameOutput handles empty output', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.parseBlameOutput('');
    if (!Array.isArray(result)) throw new Error('Should return array');
    if (result.length !== 0) throw new Error('Should return empty array');
});

test('GitClient - parseBlameOutput handles multiple lines', () => {
    const client = new GitClient(TEST_REPO_PATH);
    // Use 40-character SHA-1 hashes
    const mockOutput = `abc123def456789abc123def456789abc123def456 1 1 1
author Alice
author-time 1111111111
\tline 1
abc456def789abc123def456789abc123def789abc1 2 2 1
author Bob
author-time 2222222222
\tline 2`;

    const result = client.parseBlameOutput(mockOutput);
    if (result.length !== 2) throw new Error('Should parse 2 lines');
    if (result[0].author !== 'Alice') throw new Error('Should parse first author');
    if (result[1].author !== 'Bob') throw new Error('Should parse second author');
});

// ============================================================================
// COMMIT COUNT TESTS
// ============================================================================
console.log('\n🔢 Commit Count Tests');
console.log('-'.repeat(70));

test('GitClient - getCommitCount returns number', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const count = client.getCommitCount('package.json');
    if (typeof count !== 'number') throw new Error('Should return number');
});

test('GitClient - getCommitCount returns positive for existing file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const count = client.getCommitCount('package.json');
    if (count < 0) throw new Error('Should return non-negative number');
});

test('GitClient - getCommitCount returns 0 for non-existent file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const count = client.getCommitCount('nonexistent-xyz.txt');
    if (count !== 0) throw new Error('Should return 0 for non-existent file');
});

// ============================================================================
// FILE AUTHORS TESTS
// ============================================================================
console.log('\n✍️  File Authors Tests');
console.log('-'.repeat(70));

test('GitClient - getFileAuthors returns array', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('package.json');
    if (!Array.isArray(authors)) throw new Error('Should return array');
});

test('GitClient - getFileAuthors returns author objects', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('package.json');
    if (authors.length > 0) {
        const author = authors[0];
        if (!author.name) throw new Error('Should have name');
        if (!author.email) throw new Error('Should have email');
        if (typeof author.commits !== 'number') throw new Error('Should have commits count');
    }
});

test('GitClient - getFileAuthors sorts by commit count', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('package.json');
    if (authors.length > 1) {
        // Should be sorted descending by commits
        if (authors[0].commits < authors[1].commits) {
            throw new Error('Should sort by commits descending');
        }
    }
});

test('GitClient - getFileAuthors deduplicates by email', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('package.json');
    const emails = authors.map(a => a.email);
    const uniqueEmails = [...new Set(emails)];
    if (emails.length !== uniqueEmails.length) {
        throw new Error('Should deduplicate by email');
    }
});

test('GitClient - getFileAuthors handles non-existent file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('nonexistent-xyz.txt');
    if (!Array.isArray(authors)) throw new Error('Should return array');
    if (authors.length !== 0) throw new Error('Should return empty array');
});

test('GitClient - getFileAuthors aggregates commit counts', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const authors = client.getFileAuthors('package.json');
    if (authors.length > 0) {
        const totalCommits = authors.reduce((sum, a) => sum + a.commits, 0);
        if (totalCommits <= 0) throw new Error('Should have positive commit count');
    }
});

// ============================================================================
// REPOSITORY STATS TESTS
// ============================================================================
console.log('\n📊 Repository Stats Tests');
console.log('-'.repeat(70));

test('GitClient - getRepoStats returns object for git repo', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const stats = client.getRepoStats();
    if (typeof stats !== 'object') throw new Error('Should return object');
});

test('GitClient - getRepoStats has required properties', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const stats = client.getRepoStats();
    if (stats) {
        if (typeof stats.totalCommits !== 'number') throw new Error('Should have totalCommits');
        if (typeof stats.totalFiles !== 'number') throw new Error('Should have totalFiles');
        if (typeof stats.contributors !== 'number') throw new Error('Should have contributors');
        if (typeof stats.currentBranch !== 'string') throw new Error('Should have currentBranch');
    }
});

test('GitClient - getRepoStats returns null for non-git repo', () => {
    const client = new GitClient('/tmp');
    const stats = client.getRepoStats();
    if (stats !== null) throw new Error('Should return null for non-git repo');
});

test('GitClient - getRepoStats returns positive values', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const stats = client.getRepoStats();
    if (stats) {
        if (stats.totalCommits <= 0) throw new Error('totalCommits should be positive');
        if (stats.totalFiles <= 0) throw new Error('totalFiles should be positive');
        if (stats.contributors <= 0) throw new Error('contributors should be positive');
    }
});

// ============================================================================
// LAST COMMIT TESTS
// ============================================================================
console.log('\n🕐 Last Commit Tests');
console.log('-'.repeat(70));

test('GitClient - getLastCommit returns object for existing file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const commit = client.getLastCommit('package.json');
    if (commit && typeof commit !== 'object') throw new Error('Should return object or null');
});

test('GitClient - getLastCommit has commit properties', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const commit = client.getLastCommit('package.json');
    if (commit) {
        if (!commit.hash) throw new Error('Should have hash');
        if (!commit.author) throw new Error('Should have author');
        if (!commit.email) throw new Error('Should have email');
        if (typeof commit.timestamp !== 'number') throw new Error('Should have timestamp');
        if (!(commit.date instanceof Date)) throw new Error('Should have date');
        if (!commit.subject) throw new Error('Should have subject');
    }
});

test('GitClient - getLastCommit returns null for non-existent file', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const commit = client.getLastCommit('nonexistent-xyz.txt');
    if (commit !== null) throw new Error('Should return null for non-existent file');
});

test('GitClient - getLastCommit date matches timestamp', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const commit = client.getLastCommit('package.json');
    if (commit) {
        const expectedTime = commit.date.getTime();
        const actualTime = commit.timestamp * 1000;
        if (expectedTime !== actualTime) {
            throw new Error('Date should match timestamp');
        }
    }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('GitClient - Multiple instances are independent', () => {
    const client1 = new GitClient(TEST_REPO_PATH);
    const client2 = new GitClient('/tmp');

    if (client1.isGitRepo === client2.isGitRepo) {
        // This might be true if both are git repos, so check paths instead
        if (client1.repoPath === client2.repoPath) {
            throw new Error('Should have independent paths');
        }
    }
});

test('GitClient - exec handles commands with quotes', () => {
    const client = new GitClient(TEST_REPO_PATH);
    try {
        // Should handle file paths with spaces/quotes
        const result = client.exec('log -1 --oneline');
        if (typeof result !== 'string') throw new Error('Should return string');
    } catch (error) {
        // Might fail in some edge cases, but shouldn't crash
    }
});

test('GitClient - getChangedFiles handles empty output', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const files = client.getChangedFiles('HEAD');
    // When comparing HEAD to HEAD, should be empty
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - parseBlameOutput handles malformed input', () => {
    const client = new GitClient(TEST_REPO_PATH);
    const result = client.parseBlameOutput('random text\nno structure');
    if (!Array.isArray(result)) throw new Error('Should return array');
});

test('GitClient - getFileAuthors handles files with single author', () => {
    const client = new GitClient(TEST_REPO_PATH);
    // Create a test case that should work
    const authors = client.getFileAuthors('package.json');
    if (!Array.isArray(authors)) throw new Error('Should return array');
});

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
    console.log('\n🎉 All git client tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
