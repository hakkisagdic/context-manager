#!/usr/bin/env node

/**
 * Comprehensive BlameTracker Tests
 * Tests for Git author attribution and code ownership analysis
 */

import { BlameTracker } from '../lib/integrations/git/BlameTracker.js';
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
        this.mockAuthors = new Map();
        this.mockCommitCounts = new Map();
    }

    setMockAuthors(filePath, authors) {
        this.mockAuthors.set(filePath, authors);
    }

    setMockCommitCount(filePath, count) {
        this.mockCommitCounts.set(filePath, count);
    }

    getFileAuthors(filePath) {
        return this.mockAuthors.get(filePath) || [];
    }

    getCommitCount(filePath) {
        return this.mockCommitCounts.get(filePath) || 0;
    }
}

console.log('🧪 Testing BlameTracker...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('BlameTracker - Constructor with repository path', () => {
    const tracker = new BlameTracker('/test/repo');
    if (!tracker) throw new Error('Should create instance');
    if (!tracker.git) throw new Error('Should have git client');
});

test('BlameTracker - Constructor initializes GitClient', () => {
    const tracker = new BlameTracker('/test/repo');
    if (!(tracker.git instanceof GitClient)) throw new Error('Should create GitClient instance');
});

// ============================================================================
// PRIMARY AUTHOR TESTS
// ============================================================================
console.log('\n👤 Primary Author Tests');
console.log('-'.repeat(70));

test('BlameTracker - getPrimaryAuthor returns first author', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 },
        { name: 'Bob', email: 'bob@example.com', commits: 5 }
    ]);
    tracker.git = mockClient;

    const author = tracker.getPrimaryAuthor('/test/file.js');
    if (!author) throw new Error('Should return author');
    if (author.name !== 'Alice') throw new Error('Should return first author');
});

test('BlameTracker - getPrimaryAuthor returns null for no authors', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file.js', []);
    tracker.git = mockClient;

    const author = tracker.getPrimaryAuthor('/test/file.js');
    if (author !== null) throw new Error('Should return null for no authors');
});

test('BlameTracker - getPrimaryAuthor handles non-existent file', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const author = tracker.getPrimaryAuthor('/test/nonexistent.js');
    if (author !== null) throw new Error('Should return null for non-existent file');
});

// ============================================================================
// AUTHOR CONTRIBUTIONS TESTS
// ============================================================================
console.log('\n📊 Author Contributions Tests');
console.log('-'.repeat(70));

test('BlameTracker - getAuthorContributions returns Map', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions([]);
    if (!(contributions instanceof Map)) throw new Error('Should return Map');
});

test('BlameTracker - getAuthorContributions tracks single file', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 }
    ]);
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions(['/test/file1.js']);
    if (contributions.size !== 1) throw new Error('Should have 1 contributor');

    const alice = contributions.get('alice@example.com');
    if (!alice) throw new Error('Should have Alice');
    if (alice.filesOwned !== 1) throw new Error('Should own 1 file');
    if (alice.totalCommits !== 10) throw new Error('Should have 10 commits');
});

test('BlameTracker - getAuthorContributions aggregates multiple files', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 }
    ]);
    mockClient.setMockAuthors('/test/file2.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 5 }
    ]);
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions(['/test/file1.js', '/test/file2.js']);
    const alice = contributions.get('alice@example.com');
    if (alice.filesOwned !== 2) throw new Error('Should own 2 files');
    if (alice.totalCommits !== 15) throw new Error('Should have 15 total commits');
});

test('BlameTracker - getAuthorContributions tracks multiple authors', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 },
        { name: 'Bob', email: 'bob@example.com', commits: 5 }
    ]);
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions(['/test/file1.js']);
    if (contributions.size !== 2) throw new Error('Should have 2 contributors');

    const bob = contributions.get('bob@example.com');
    if (!bob) throw new Error('Should have Bob');
    if (bob.totalCommits !== 5) throw new Error('Bob should have 5 commits');
});

test('BlameTracker - getAuthorContributions handles empty file list', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions([]);
    if (contributions.size !== 0) throw new Error('Should be empty');
});

// ============================================================================
// OWNERSHIP MAP TESTS
// ============================================================================
console.log('\n🗺️  Ownership Map Tests');
console.log('-'.repeat(70));

test('BlameTracker - getOwnershipMap returns Map', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const ownership = tracker.getOwnershipMap([]);
    if (!(ownership instanceof Map)) throw new Error('Should return Map');
});

test('BlameTracker - getOwnershipMap maps files to owners', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 }
    ]);
    tracker.git = mockClient;

    const ownership = tracker.getOwnershipMap(['/test/file1.js']);
    if (ownership.size !== 1) throw new Error('Should have 1 entry');

    const owner = ownership.get('/test/file1.js');
    if (!owner) throw new Error('Should have owner for file1');
    if (owner.name !== 'Alice') throw new Error('Owner should be Alice');
});

test('BlameTracker - getOwnershipMap skips files without authors', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', []);
    tracker.git = mockClient;

    const ownership = tracker.getOwnershipMap(['/test/file1.js']);
    if (ownership.size !== 0) throw new Error('Should skip files without authors');
});

test('BlameTracker - getOwnershipMap handles multiple files', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 }
    ]);
    mockClient.setMockAuthors('/test/file2.js', [
        { name: 'Bob', email: 'bob@example.com', commits: 8 }
    ]);
    tracker.git = mockClient;

    const ownership = tracker.getOwnershipMap(['/test/file1.js', '/test/file2.js']);
    if (ownership.size !== 2) throw new Error('Should have 2 entries');
});

// ============================================================================
// HOT SPOTS TESTS
// ============================================================================
console.log('\n🔥 Hot Spots Detection Tests');
console.log('-'.repeat(70));

test('BlameTracker - detectHotSpots returns array', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots([]);
    if (!Array.isArray(hotSpots)) throw new Error('Should return array');
});

test('BlameTracker - detectHotSpots finds files above threshold', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 15);
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 15 }
    ]);
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js'], 10);
    if (hotSpots.length !== 1) throw new Error('Should find 1 hot spot');
    if (hotSpots[0].path !== '/test/file1.js') throw new Error('Should be file1.js');
});

test('BlameTracker - detectHotSpots ignores files below threshold', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 5);
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js'], 10);
    if (hotSpots.length !== 0) throw new Error('Should ignore files below threshold');
});

test('BlameTracker - detectHotSpots includes commit and author count', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 20);
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 12 },
        { name: 'Bob', email: 'bob@example.com', commits: 8 }
    ]);
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js'], 10);
    if (hotSpots[0].commitCount !== 20) throw new Error('Should have commit count');
    if (hotSpots[0].authorCount !== 2) throw new Error('Should have author count');
    if (!hotSpots[0].primaryAuthor) throw new Error('Should have primary author');
});

test('BlameTracker - detectHotSpots calculates risk score', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 20);
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 20 }
    ]);
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js'], 10);
    if (typeof hotSpots[0].risk !== 'number') throw new Error('Should have risk score');
    if (hotSpots[0].risk <= 0) throw new Error('Risk should be positive');
});

test('BlameTracker - detectHotSpots sorts by risk descending', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();

    // file1: low risk
    mockClient.setMockCommitCount('/test/file1.js', 11);
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 11 }
    ]);

    // file2: high risk
    mockClient.setMockCommitCount('/test/file2.js', 50);
    mockClient.setMockAuthors('/test/file2.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 30 },
        { name: 'Bob', email: 'bob@example.com', commits: 20 }
    ]);

    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js', '/test/file2.js'], 10);
    if (hotSpots.length !== 2) throw new Error('Should have 2 hot spots');
    if (hotSpots[0].path !== '/test/file2.js') throw new Error('Should sort by risk descending');
    if (hotSpots[0].risk <= hotSpots[1].risk) throw new Error('First should have higher risk');
});

test('BlameTracker - detectHotSpots uses default threshold of 10', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockCommitCount('/test/file1.js', 9);
    tracker.git = mockClient;

    const hotSpots = tracker.detectHotSpots(['/test/file1.js']); // No threshold
    if (hotSpots.length !== 0) throw new Error('Should use default threshold of 10');
});

// ============================================================================
// RISK SCORE TESTS
// ============================================================================
console.log('\n⚠️  Risk Score Tests');
console.log('-'.repeat(70));

test('BlameTracker - calculateRiskScore returns number', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk = tracker.calculateRiskScore(10, 2);
    if (typeof risk !== 'number') throw new Error('Should return number');
});

test('BlameTracker - calculateRiskScore increases with commits', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk1 = tracker.calculateRiskScore(10, 2);
    const risk2 = tracker.calculateRiskScore(50, 2);
    if (risk2 <= risk1) throw new Error('Higher commits should increase risk');
});

test('BlameTracker - calculateRiskScore increases with authors', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk1 = tracker.calculateRiskScore(20, 1);
    const risk2 = tracker.calculateRiskScore(20, 5);
    if (risk2 <= risk1) throw new Error('More authors should increase risk');
});

test('BlameTracker - calculateRiskScore handles zero values', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk = tracker.calculateRiskScore(0, 0);
    if (typeof risk !== 'number') throw new Error('Should handle zero values');
    if (isNaN(risk)) throw new Error('Should not return NaN');
});

test('BlameTracker - calculateRiskScore uses logarithmic scale for commits', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk1 = tracker.calculateRiskScore(10, 0);
    const risk2 = tracker.calculateRiskScore(100, 0);
    // Should not be linear (risk2 should be less than 10x risk1)
    if (risk2 >= risk1 * 10) throw new Error('Should use logarithmic scaling');
});

// ============================================================================
// OWNERSHIP SUMMARY TESTS
// ============================================================================
console.log('\n📈 Ownership Summary Tests');
console.log('-'.repeat(70));

test('BlameTracker - getOwnershipSummary returns object', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const summary = tracker.getOwnershipSummary([]);
    if (typeof summary !== 'object') throw new Error('Should return object');
});

test('BlameTracker - getOwnershipSummary has required properties', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const summary = tracker.getOwnershipSummary([]);
    if (typeof summary.totalAuthors !== 'number') throw new Error('Should have totalAuthors');
    if (typeof summary.totalFiles !== 'number') throw new Error('Should have totalFiles');
    if (!Array.isArray(summary.topContributors)) throw new Error('Should have topContributors array');
    if (typeof summary.averageFilesPerAuthor !== 'number') throw new Error('Should have averageFilesPerAuthor');
});

test('BlameTracker - getOwnershipSummary calculates totals correctly', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 10 }
    ]);
    mockClient.setMockAuthors('/test/file2.js', [
        { name: 'Bob', email: 'bob@example.com', commits: 5 }
    ]);
    tracker.git = mockClient;

    const summary = tracker.getOwnershipSummary(['/test/file1.js', '/test/file2.js']);
    if (summary.totalAuthors !== 2) throw new Error('Should have 2 authors');
    if (summary.totalFiles !== 2) throw new Error('Should have 2 files');
    if (summary.averageFilesPerAuthor !== 1) throw new Error('Should be 1 file per author');
});

test('BlameTracker - getOwnershipSummary sorts top contributors by commits', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice', email: 'alice@example.com', commits: 5 }
    ]);
    mockClient.setMockAuthors('/test/file2.js', [
        { name: 'Bob', email: 'bob@example.com', commits: 20 }
    ]);
    tracker.git = mockClient;

    const summary = tracker.getOwnershipSummary(['/test/file1.js', '/test/file2.js']);
    if (summary.topContributors.length !== 2) throw new Error('Should have 2 contributors');
    if (summary.topContributors[0].email !== 'bob@example.com') throw new Error('Bob should be first');
    if (summary.topContributors[1].email !== 'alice@example.com') throw new Error('Alice should be second');
});

test('BlameTracker - getOwnershipSummary limits to top 10', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();

    // Create 15 files with different authors
    for (let i = 0; i < 15; i++) {
        mockClient.setMockAuthors(`/test/file${i}.js`, [
            { name: `Author${i}`, email: `author${i}@example.com`, commits: i + 1 }
        ]);
    }
    tracker.git = mockClient;

    const files = Array.from({ length: 15 }, (_, i) => `/test/file${i}.js`);
    const summary = tracker.getOwnershipSummary(files);
    if (summary.topContributors.length !== 10) throw new Error('Should limit to top 10');
});

test('BlameTracker - getOwnershipSummary handles empty file list', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    tracker.git = mockClient;

    const summary = tracker.getOwnershipSummary([]);
    if (summary.totalFiles !== 0) throw new Error('Should have 0 files');
    if (summary.totalAuthors !== 0) throw new Error('Should have 0 authors');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('BlameTracker - Multiple instances are independent', () => {
    const tracker1 = new BlameTracker('/test/repo1');
    const tracker2 = new BlameTracker('/test/repo2');

    if (tracker1.git === tracker2.git) throw new Error('Should have independent GitClients');
});

test('BlameTracker - getAuthorContributions preserves author name', () => {
    const tracker = new BlameTracker('/test/repo');
    const mockClient = new MockGitClient();
    mockClient.setMockAuthors('/test/file1.js', [
        { name: 'Alice Smith', email: 'alice@example.com', commits: 10 }
    ]);
    tracker.git = mockClient;

    const contributions = tracker.getAuthorContributions(['/test/file1.js']);
    const alice = contributions.get('alice@example.com');
    if (alice.name !== 'Alice Smith') throw new Error('Should preserve full author name');
});

test('BlameTracker - calculateRiskScore handles large numbers', () => {
    const tracker = new BlameTracker('/test/repo');
    const risk = tracker.calculateRiskScore(10000, 100);
    if (!isFinite(risk)) throw new Error('Should handle large numbers');
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
    console.log('\n🎉 All blame tracker tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
