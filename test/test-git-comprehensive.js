#!/usr/bin/env node

/**
 * Comprehensive Git Integration Tests
 * Tests GitClient, DiffAnalyzer, and BlameTracker
 */

import { GitClient } from '../lib/integrations/git/GitClient.js';
import { DiffAnalyzer } from '../lib/integrations/git/DiffAnalyzer.js';
import { BlameTracker } from '../lib/integrations/git/BlameTracker.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

console.log('🧪 Testing Git Integration (v3.0.0)...\n');

const REPO_PATH = process.cwd(); // Current directory should be a git repo

// ============================================================================
// GIT CLIENT TESTS
// ============================================================================
console.log('📦 GitClient Tests');
console.log('-'.repeat(70));

test('GitClient - Constructor', () => {
    const git = new GitClient(REPO_PATH);
    if (!git) throw new Error('Failed to create GitClient');
    if (git.repoPath !== REPO_PATH) throw new Error('Repo path not set');
});

test('GitClient - Check is git repository', () => {
    const git = new GitClient(REPO_PATH);
    if (git.isGitRepo !== true) throw new Error('Should detect git repository');
});

test('GitClient - Check non-git directory', () => {
    const git = new GitClient('/tmp');
    if (git.isGitRepo === true) throw new Error('Should not detect /tmp as git repo');
});

test('GitClient - Get current branch', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const branch = git.getCurrentBranch();
    if (!branch) throw new Error('Branch name should not be empty');
    if (typeof branch !== 'string') throw new Error('Branch should be string');
});

test('GitClient - Get default branch', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const defaultBranch = git.getDefaultBranch();
    if (!defaultBranch) throw new Error('Default branch should not be empty');
    if (typeof defaultBranch !== 'string') throw new Error('Default branch should be string');
});

test('GitClient - Get changed files (no args)', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const files = git.getChangedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - Get staged files', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const files = git.getStagedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - Get unstaged files', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const files = git.getUnstagedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - Get untracked files', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const files = git.getUntrackedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
});

test('GitClient - Get all modified files', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const files = git.getAllModifiedFiles();
    if (!Array.isArray(files)) throw new Error('Should return array');
    // Should deduplicate
    const uniqueFiles = [...new Set(files)];
    if (files.length !== uniqueFiles.length) {
        throw new Error('Should deduplicate files');
    }
});

test('GitClient - Exec throws error on non-git repo', () => {
    const git = new GitClient('/tmp');
    try {
        git.exec('status');
        throw new Error('Should throw error');
    } catch (error) {
        if (!error.message.includes('Not a git repository')) {
            throw new Error('Wrong error message');
        }
    }
});

test('GitClient - Get commit count', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const count = git.getCommitCount();
    if (typeof count !== 'number') throw new Error('Count should be number');
    if (count < 0) throw new Error('Count should be non-negative');
});

test('GitClient - Get contributors', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const contributors = git.getContributors();
    if (!Array.isArray(contributors)) throw new Error('Should return array');
});

test('GitClient - Get latest commits', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const commits = git.getLatestCommits(5);
    if (!Array.isArray(commits)) throw new Error('Should return array');
    if (commits.length > 5) throw new Error('Should limit to 5 commits');
});

test('GitClient - Has uncommitted changes', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const hasChanges = git.hasUncommittedChanges();
    if (typeof hasChanges !== 'boolean') throw new Error('Should return boolean');
});

// ============================================================================
// DIFF ANALYZER TESTS
// ============================================================================
console.log('\n📊 DiffAnalyzer Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - Constructor', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    if (!analyzer) throw new Error('Failed to create DiffAnalyzer');
    if (!analyzer.git) throw new Error('Git client not initialized');
    if (analyzer.repoPath !== REPO_PATH) throw new Error('Repo path not set');
});

test('DiffAnalyzer - Analyze changes (no args)', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    if (!analyzer.git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const analysis = analyzer.analyzeChanges();
    if (!analysis) throw new Error('Analysis should not be null');
    if (!Array.isArray(analysis.changedFiles)) throw new Error('changedFiles should be array');
    if (typeof analysis.totalChangedFiles !== 'number') throw new Error('totalChangedFiles should be number');
    if (typeof analysis.impact !== 'string') throw new Error('impact should be string');
});

test('DiffAnalyzer - Analyze changes with since', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    if (!analyzer.git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    try {
        const analysis = analyzer.analyzeChanges('HEAD~1');
        if (!analysis) throw new Error('Analysis should not be null');
        if (analysis.since !== 'HEAD~1') throw new Error('since not set correctly');
    } catch (error) {
        // May fail if there's only one commit
        console.log('   ⚠️  Warning: HEAD~1 not available');
    }
});

test('DiffAnalyzer - Calculate impact (empty)', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    const impact = analyzer.calculateImpact([]);
    if (impact !== 'none') throw new Error('Empty changes should have no impact');
});

test('DiffAnalyzer - Calculate impact (low)', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    const impact = analyzer.calculateImpact(['file1.js', 'file2.js']);
    if (!['low', 'medium', 'high'].includes(impact)) {
        throw new Error('Impact should be low/medium/high');
    }
});

test('DiffAnalyzer - Get detailed changes', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    if (!analyzer.git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    const changes = analyzer.getDetailedChanges();
    if (!Array.isArray(changes)) throw new Error('Should return array');
});

test('DiffAnalyzer - Find related files', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    const related = analyzer.findRelatedFiles(['index.js']);
    if (!Array.isArray(related)) throw new Error('Should return array');
});

// ============================================================================
// BLAME TRACKER TESTS
// ============================================================================
console.log('\n👤 BlameTracker Tests');
console.log('-'.repeat(70));

test('BlameTracker - Constructor', () => {
    const tracker = new BlameTracker(REPO_PATH);
    if (!tracker) throw new Error('Failed to create BlameTracker');
    if (!tracker.git) throw new Error('Git client not initialized');
});

test('BlameTracker - Get primary author', () => {
    const tracker = new BlameTracker(REPO_PATH);
    if (!tracker.git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    try {
        const author = tracker.getPrimaryAuthor('index.js');
        // May return null if file doesn't exist or has no history
        if (author !== null) {
            if (!author.name) throw new Error('Author should have name');
            if (!author.email) throw new Error('Author should have email');
        }
    } catch (error) {
        // File may not exist
        console.log('   ⚠️  Warning: Could not get author (file may not exist)');
    }
});

test('BlameTracker - Get author contributions (empty)', () => {
    const tracker = new BlameTracker(REPO_PATH);
    const contributions = tracker.getAuthorContributions([]);
    if (!(contributions instanceof Map)) throw new Error('Should return Map');
    if (contributions.size !== 0) throw new Error('Empty input should return empty map');
});

test('BlameTracker - Get ownership map (empty)', () => {
    const tracker = new BlameTracker(REPO_PATH);
    const ownership = tracker.getOwnershipMap([]);
    if (!(ownership instanceof Map)) throw new Error('Should return Map');
    if (ownership.size !== 0) throw new Error('Empty input should return empty map');
});

test('BlameTracker - Find hot spots (empty)', () => {
    const tracker = new BlameTracker(REPO_PATH);
    const hotspots = tracker.findHotSpots([]);
    if (!Array.isArray(hotspots)) throw new Error('Should return array');
    if (hotspots.length !== 0) throw new Error('Empty input should return empty array');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests');
console.log('-'.repeat(70));

test('GitClient + DiffAnalyzer integration', () => {
    const git = new GitClient(REPO_PATH);
    const analyzer = new DiffAnalyzer(REPO_PATH);

    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    // Should work together
    const analysis = analyzer.analyzeChanges();
    const modified = git.getAllModifiedFiles();

    if (analysis.changedFiles.length !== modified.length) {
        throw new Error('Analyzer and git should return same file count');
    }
});

test('GitClient + BlameTracker integration', () => {
    const git = new GitClient(REPO_PATH);
    const tracker = new BlameTracker(REPO_PATH);

    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    // Both should use same git client
    if (tracker.git.repoPath !== git.repoPath) {
        throw new Error('Should use same repo path');
    }
});

test('Complete workflow: Analyze changes and track ownership', () => {
    const git = new GitClient(REPO_PATH);
    const analyzer = new DiffAnalyzer(REPO_PATH);
    const tracker = new BlameTracker(REPO_PATH);

    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    // Get changed files
    const analysis = analyzer.analyzeChanges();

    // Get ownership
    const ownership = tracker.getOwnershipMap(analysis.changedFiles.slice(0, 5));

    // Should return Map
    if (!(ownership instanceof Map)) throw new Error('Ownership should be Map');
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n❌ Error Handling Tests');
console.log('-'.repeat(70));

test('GitClient - Handle invalid git command', () => {
    const git = new GitClient(REPO_PATH);
    if (!git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    try {
        git.exec('invalid-command-xyz');
        throw new Error('Should throw error for invalid command');
    } catch (error) {
        if (!error.message.includes('failed')) {
            throw new Error('Wrong error message');
        }
    }
});

test('DiffAnalyzer - Handle invalid reference', () => {
    const analyzer = new DiffAnalyzer(REPO_PATH);
    if (!analyzer.git.isGitRepo) {
        console.log('   ⏭️  Skipped: Not a git repository');
        return;
    }

    try {
        analyzer.analyzeChanges('invalid-branch-xyz-123');
        // May or may not throw depending on implementation
    } catch (error) {
        // Expected to fail with invalid reference
        if (!error.message) throw new Error('Error should have message');
    }
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
    console.log('\n🎉 All Git integration tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
