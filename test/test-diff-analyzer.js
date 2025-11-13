#!/usr/bin/env node

/**
 * Comprehensive DiffAnalyzer Tests
 * Tests for Git diff analysis and change impact detection
 */

import { DiffAnalyzer } from '../lib/integrations/git/DiffAnalyzer.js';
import GitClient from '../lib/integrations/git/GitClient.js';

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

// Mock GitClient
class MockGitClient {
    constructor() {
        this.mockChangedFiles = [];
        this.mockModifiedFiles = [];
        this.mockCommitCounts = new Map();
        this.mockExecResults = new Map();
    }

    setMockChangedFiles(files) {
        this.mockChangedFiles = files;
    }

    setMockModifiedFiles(files) {
        this.mockModifiedFiles = files;
    }

    setMockCommitCount(filePath, count) {
        this.mockCommitCounts.set(filePath, count);
    }

    setMockExecResult(command, result) {
        this.mockExecResults.set(command, result);
    }

    getChangedFiles(since) {
        return this.mockChangedFiles;
    }

    getAllModifiedFiles() {
        return this.mockModifiedFiles;
    }

    getCommitCount(filePath) {
        return this.mockCommitCounts.get(filePath) || 0;
    }

    exec(command) {
        const result = this.mockExecResults.get(command);
        if (result === undefined) {
            // Return empty string for unregistered commands
            return '';
        }
        if (result instanceof Error) {
            throw result;
        }
        return result;
    }
}

console.log('🧪 Testing DiffAnalyzer...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - Constructor with repository path', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    if (!analyzer) throw new Error('Should create instance');
    if (!analyzer.git) throw new Error('Should have git client');
    if (analyzer.repoPath !== '/test/repo') throw new Error('Should set repoPath');
});

test('DiffAnalyzer - Constructor initializes GitClient', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    if (!(analyzer.git instanceof GitClient)) throw new Error('Should create GitClient instance');
});

// ============================================================================
// ANALYZE CHANGES TESTS
// ============================================================================
console.log('\n📊 Analyze Changes Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - analyzeChanges returns analysis object', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles(['/test/file1.js']);
    analyzer.git = mockClient;

    const analysis = analyzer.analyzeChanges();
    if (typeof analysis !== 'object') throw new Error('Should return object');
    if (!Array.isArray(analysis.changedFiles)) throw new Error('Should have changedFiles array');
    if (typeof analysis.totalChangedFiles !== 'number') throw new Error('Should have totalChangedFiles');
    if (!analysis.impact) throw new Error('Should have impact');
});

test('DiffAnalyzer - analyzeChanges with no since uses modified files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles(['/test/file1.js', '/test/file2.js']);
    analyzer.git = mockClient;

    const analysis = analyzer.analyzeChanges();
    if (analysis.changedFiles.length !== 2) throw new Error('Should have 2 changed files');
    if (analysis.totalChangedFiles !== 2) throw new Error('Should count files');
    if (analysis.since !== null) throw new Error('since should be null');
});

test('DiffAnalyzer - analyzeChanges with since reference', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockChangedFiles(['/test/file1.js']);
    analyzer.git = mockClient;

    const analysis = analyzer.analyzeChanges('main');
    if (analysis.since !== 'main') throw new Error('Should set since reference');
    if (analysis.changedFiles.length !== 1) throw new Error('Should use changed files');
});

test('DiffAnalyzer - analyzeChanges calculates impact', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles(['/src/core/index.js']);
    analyzer.git = mockClient;

    const analysis = analyzer.analyzeChanges();
    if (!analysis.impact.level) throw new Error('Should have impact level');
    if (typeof analysis.impact.score !== 'number') throw new Error('Should have impact score');
});

test('DiffAnalyzer - analyzeChanges with empty changes', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles([]);
    analyzer.git = mockClient;

    const analysis = analyzer.analyzeChanges();
    if (analysis.totalChangedFiles !== 0) throw new Error('Should have 0 files');
});

// ============================================================================
// DETAILED CHANGES TESTS
// ============================================================================
console.log('\n📋 Detailed Changes Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - getDetailedChanges returns array', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles([]);
    analyzer.git = mockClient;

    const changes = analyzer.getDetailedChanges();
    if (!Array.isArray(changes)) throw new Error('Should return array');
});

test('DiffAnalyzer - getDetailedChanges includes file paths', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles(['/test/file1.js']);
    mockClient.setMockExecResult('diff -- "/test/file1.js"', '+added line\n-deleted line');
    analyzer.git = mockClient;

    const changes = analyzer.getDetailedChanges();
    if (changes.length !== 1) throw new Error('Should have 1 change');
    if (changes[0].path !== '/test/file1.js') throw new Error('Should have file path');
});

test('DiffAnalyzer - getDetailedChanges includes diff stats', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockModifiedFiles(['/test/file1.js']);
    mockClient.setMockExecResult('diff -- "/test/file1.js"', '+added\n-deleted');
    analyzer.git = mockClient;

    const changes = analyzer.getDetailedChanges();
    if (typeof changes[0].added !== 'number') throw new Error('Should have added count');
    if (typeof changes[0].deleted !== 'number') throw new Error('Should have deleted count');
    if (typeof changes[0].modified !== 'number') throw new Error('Should have modified count');
});

// ============================================================================
// FILE DIFF TESTS
// ============================================================================
console.log('\n📄 File Diff Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - getFileDiff returns diff object', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff -- "/test/file1.js"', '');
    analyzer.git = mockClient;

    const diff = analyzer.getFileDiff('/test/file1.js');
    if (typeof diff !== 'object') throw new Error('Should return object');
    if (typeof diff.added !== 'number') throw new Error('Should have added');
    if (typeof diff.deleted !== 'number') throw new Error('Should have deleted');
    if (typeof diff.modified !== 'number') throw new Error('Should have modified');
    if (typeof diff.diff !== 'string') throw new Error('Should have diff string');
});

test('DiffAnalyzer - getFileDiff with since reference', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff main -- "/test/file1.js"', '+line');
    analyzer.git = mockClient;

    const diff = analyzer.getFileDiff('/test/file1.js', 'main');
    if (diff.added !== 1) throw new Error('Should parse added lines');
});

test('DiffAnalyzer - getFileDiff handles errors gracefully', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff -- "/test/file1.js"', new Error('File not found'));
    analyzer.git = mockClient;

    const diff = analyzer.getFileDiff('/test/file1.js');
    if (diff.added !== 0) throw new Error('Should return 0 on error');
    if (diff.deleted !== 0) throw new Error('Should return 0 on error');
    if (diff.diff !== '') throw new Error('Should return empty diff on error');
});

test('DiffAnalyzer - getFileDiff calculates modified correctly', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff -- "/test/file1.js"', '+a\n+b\n-c');
    analyzer.git = mockClient;

    const diff = analyzer.getFileDiff('/test/file1.js');
    if (diff.added !== 2) throw new Error('Should count 2 added lines');
    if (diff.deleted !== 1) throw new Error('Should count 1 deleted line');
    if (diff.modified !== 3) throw new Error('modified should be added + deleted');
});

// ============================================================================
// PARSE DIFF STATS TESTS
// ============================================================================
console.log('\n🔍 Parse Diff Stats Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - parseDiffStats returns object', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const stats = analyzer.parseDiffStats('');
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (typeof stats.added !== 'number') throw new Error('Should have added');
    if (typeof stats.deleted !== 'number') throw new Error('Should have deleted');
});

test('DiffAnalyzer - parseDiffStats counts added lines', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const diff = '+added line 1\n+added line 2\n unchanged';
    const stats = analyzer.parseDiffStats(diff);
    if (stats.added !== 2) throw new Error('Should count 2 added lines');
});

test('DiffAnalyzer - parseDiffStats counts deleted lines', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const diff = '-deleted line 1\n-deleted line 2\n unchanged';
    const stats = analyzer.parseDiffStats(diff);
    if (stats.deleted !== 2) throw new Error('Should count 2 deleted lines');
});

test('DiffAnalyzer - parseDiffStats ignores +++ and --- headers', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const diff = '--- a/file.js\n+++ b/file.js\n+added\n-deleted';
    const stats = analyzer.parseDiffStats(diff);
    if (stats.added !== 1) throw new Error('Should ignore +++ header');
    if (stats.deleted !== 1) throw new Error('Should ignore --- header');
});

test('DiffAnalyzer - parseDiffStats handles empty diff', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const stats = analyzer.parseDiffStats('');
    if (stats.added !== 0) throw new Error('Should be 0');
    if (stats.deleted !== 0) throw new Error('Should be 0');
});

test('DiffAnalyzer - parseDiffStats handles mixed changes', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const diff = '+line1\n-line2\n unchanged\n+line3\n-line4';
    const stats = analyzer.parseDiffStats(diff);
    if (stats.added !== 2) throw new Error('Should count 2 added');
    if (stats.deleted !== 2) throw new Error('Should count 2 deleted');
});

// ============================================================================
// IMPACT CALCULATION TESTS
// ============================================================================
console.log('\n💥 Impact Calculation Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - calculateImpact returns object', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact([]);
    if (typeof impact !== 'object') throw new Error('Should return object');
    if (!impact.level) throw new Error('Should have level');
    if (typeof impact.score !== 'number') throw new Error('Should have score');
    if (!impact.details) throw new Error('Should have details');
});

test('DiffAnalyzer - calculateImpact detects core files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact(['/src/index.js', '/lib/main.js']);
    if (impact.details.coreFiles !== 2) throw new Error('Should detect 2 core files');
    if (impact.score < 20) throw new Error('Core files should increase score');
});

test('DiffAnalyzer - calculateImpact detects config files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact(['package.json', 'config.yml']);
    if (impact.details.configFiles !== 2) throw new Error('Should detect 2 config files');
});

test('DiffAnalyzer - calculateImpact detects test files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact(['/test/unit.test.js', '/spec/integration.spec.js']);
    if (impact.details.testFiles !== 2) throw new Error('Should detect 2 test files');
});

test('DiffAnalyzer - calculateImpact detects documentation files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact(['README.md', '/docs/guide.md']);
    if (impact.details.documentationFiles !== 2) throw new Error('Should detect 2 doc files');
});

test('DiffAnalyzer - calculateImpact level critical for high score', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // 5 core files = 50 points
    const impact = analyzer.calculateImpact([
        '/src/file1.js', '/src/file2.js', '/src/file3.js',
        '/src/file4.js', '/src/file5.js'
    ]);
    if (impact.level !== 'critical') throw new Error('Score >= 50 should be critical');
});

test('DiffAnalyzer - calculateImpact level high for medium score', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // 3 core files = 30 points
    const impact = analyzer.calculateImpact([
        '/src/file1.js', '/src/file2.js', '/src/file3.js'
    ]);
    if (impact.level !== 'high') throw new Error('Score >= 25 should be high');
});

test('DiffAnalyzer - calculateImpact level medium for low-medium score', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // 1 core file = 10 points
    const impact = analyzer.calculateImpact(['/src/file1.js']);
    if (impact.level !== 'medium') throw new Error('Score >= 10 should be medium');
});

test('DiffAnalyzer - calculateImpact level low for minimal score', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // 1 doc file = 1 point
    const impact = analyzer.calculateImpact(['README.md']);
    if (impact.level !== 'low') throw new Error('Score < 10 should be low');
});

test('DiffAnalyzer - calculateImpact handles empty array', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const impact = analyzer.calculateImpact([]);
    if (impact.score !== 0) throw new Error('Empty should have 0 score');
    if (impact.level !== 'low') throw new Error('Empty should be low');
});

// ============================================================================
// RELATED FILES TESTS
// ============================================================================
console.log('\n🔗 Related Files Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - findRelatedFiles returns array', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const related = analyzer.findRelatedFiles([]);
    if (!Array.isArray(related)) throw new Error('Should return array');
});

test('DiffAnalyzer - findRelatedFiles returns empty (TODO)', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const related = analyzer.findRelatedFiles(['/test/file1.js']);
    if (related.length !== 0) throw new Error('Should return empty (not implemented)');
});

// ============================================================================
// FILE CHANGE FREQUENCY TESTS
// ============================================================================
console.log('\n📈 File Change Frequency Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - getFileChangeFrequency returns number', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 10);
    analyzer.git = mockClient;

    const frequency = analyzer.getFileChangeFrequency('/test/file1.js');
    if (typeof frequency !== 'number') throw new Error('Should return number');
    if (frequency !== 10) throw new Error('Should return commit count');
});

test('DiffAnalyzer - getFileChangeFrequency handles zero commits', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    analyzer.git = mockClient;

    const frequency = analyzer.getFileChangeFrequency('/test/new-file.js');
    if (frequency !== 0) throw new Error('Should return 0 for new files');
});

// ============================================================================
// BRANCH COMPARISON TESTS
// ============================================================================
console.log('\n🌲 Branch Comparison Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - compareBranches returns object', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', '');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (typeof comparison !== 'object') throw new Error('Should return object');
    if (!Array.isArray(comparison.added)) throw new Error('Should have added array');
    if (!Array.isArray(comparison.modified)) throw new Error('Should have modified array');
    if (!Array.isArray(comparison.deleted)) throw new Error('Should have deleted array');
    if (!Array.isArray(comparison.renamed)) throw new Error('Should have renamed array');
});

test('DiffAnalyzer - compareBranches parses added files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', 'A\tnew-file.js');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.added.length !== 1) throw new Error('Should have 1 added file');
    if (comparison.added[0] !== 'new-file.js') throw new Error('Should be new-file.js');
});

test('DiffAnalyzer - compareBranches parses modified files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', 'M\tmodified.js');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.modified.length !== 1) throw new Error('Should have 1 modified file');
});

test('DiffAnalyzer - compareBranches parses deleted files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', 'D\tdeleted.js');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.deleted.length !== 1) throw new Error('Should have 1 deleted file');
});

test('DiffAnalyzer - compareBranches parses renamed files', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', 'R100\told.js\tnew.js');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.renamed.length !== 1) throw new Error('Should have 1 renamed file');
});

test('DiffAnalyzer - compareBranches handles multiple changes', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature',
        'A\tfile1.js\nM\tfile2.js\nD\tfile3.js');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.added.length !== 1) throw new Error('Should have 1 added');
    if (comparison.modified.length !== 1) throw new Error('Should have 1 modified');
    if (comparison.deleted.length !== 1) throw new Error('Should have 1 deleted');
});

test('DiffAnalyzer - compareBranches handles empty output', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', '');
    analyzer.git = mockClient;

    const comparison = analyzer.compareBranches('main', 'feature');
    if (comparison.added.length !== 0) throw new Error('Should be empty');
});

test('DiffAnalyzer - compareBranches throws on error', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --name-status main...feature', new Error('Invalid branch'));
    analyzer.git = mockClient;

    try {
        analyzer.compareBranches('main', 'feature');
        throw new Error('Should throw error');
    } catch (error) {
        if (error.message === 'Should throw error') throw error;
        // Expected error
    }
});

// ============================================================================
// RANGE STATS TESTS
// ============================================================================
console.log('\n📊 Range Stats Tests');
console.log('-'.repeat(70));

test('DiffAnalyzer - getRangeStats returns object for valid range', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --shortstat v1.0.0..v2.0.0',
        '3 files changed, 45 insertions(+), 12 deletions(-)');
    analyzer.git = mockClient;

    const stats = analyzer.getRangeStats('v1.0.0..v2.0.0');
    if (typeof stats !== 'object') throw new Error('Should return object');
    if (stats.filesChanged !== 3) throw new Error('Should parse files changed');
    if (stats.insertions !== 45) throw new Error('Should parse insertions');
    if (stats.deletions !== 12) throw new Error('Should parse deletions');
});

test('DiffAnalyzer - getRangeStats handles only insertions', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --shortstat HEAD~1..HEAD',
        '1 file changed, 10 insertions(+)');
    analyzer.git = mockClient;

    const stats = analyzer.getRangeStats('HEAD~1..HEAD');
    if (stats.filesChanged !== 1) throw new Error('Should parse files');
    if (stats.insertions !== 10) throw new Error('Should parse insertions');
    if (stats.deletions !== 0) throw new Error('Should default deletions to 0');
});

test('DiffAnalyzer - getRangeStats handles only deletions', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --shortstat HEAD~1..HEAD',
        '1 file changed, 10 deletions(-)');
    analyzer.git = mockClient;

    const stats = analyzer.getRangeStats('HEAD~1..HEAD');
    if (stats.insertions !== 0) throw new Error('Should default insertions to 0');
    if (stats.deletions !== 10) throw new Error('Should parse deletions');
});

test('DiffAnalyzer - getRangeStats returns null for invalid output', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --shortstat invalid', 'invalid output');
    analyzer.git = mockClient;

    const stats = analyzer.getRangeStats('invalid');
    if (stats !== null) throw new Error('Should return null for invalid output');
});

test('DiffAnalyzer - getRangeStats returns null on error', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockExecResult('diff --shortstat error', new Error('Invalid range'));
    analyzer.git = mockClient;

    const stats = analyzer.getRangeStats('error');
    if (stats !== null) throw new Error('Should return null on error');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('DiffAnalyzer - Multiple instances are independent', () => {
    const analyzer1 = new DiffAnalyzer('/test/repo1');
    const analyzer2 = new DiffAnalyzer('/test/repo2');

    if (analyzer1.repoPath === analyzer2.repoPath) throw new Error('Should have different paths');
});

test('DiffAnalyzer - parseDiffStats handles lines starting with +/- in content', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // Lines that don't start with +/- shouldn't be counted
    const diff = 'context line\n+added\nmore context\n-deleted';
    const stats = analyzer.parseDiffStats(diff);
    if (stats.added !== 1) throw new Error('Should only count + lines');
    if (stats.deleted !== 1) throw new Error('Should only count - lines');
});

test('DiffAnalyzer - calculateImpact handles files matching multiple categories', () => {
    const analyzer = new DiffAnalyzer('/test/repo');
    // File in src/ with .json extension (both core and config)
    const impact = analyzer.calculateImpact(['/src/config.json']);
    // Should count for both categories
    if (impact.score !== 17) throw new Error('Should accumulate score from multiple matches');
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
    console.log('\n🎉 All diff analyzer tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
