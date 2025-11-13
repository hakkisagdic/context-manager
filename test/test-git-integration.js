#!/usr/bin/env node
/**
 * Test Git Integration
 * Tests GitHub URL parsing and repository operations
 */

import GitUtils from '../lib/utils/git-utils.js';

console.log('🧪 Testing Git Integration...\n');

async function runTests() {
    const gitUtils = new GitUtils({ verbose: false });

    // Test 1: URL Parsing
    console.log('Test 1: GitHub URL Parsing');
    console.log('─'.repeat(50));

    const testUrls = [
        'https://github.com/facebook/react',
        'facebook/react',
        'git@github.com:vercel/next.js.git',
        'https://github.com/angular/angular.git'
    ];

    for (const url of testUrls) {
        try {
            const parsed = gitUtils.parseGitHubURL(url);
            console.log(`✅ ${url}`);
            console.log(`   → ${parsed.owner}/${parsed.repo} (${parsed.branch})`);
        } catch (error) {
            console.log(`❌ ${url}: ${error.message}`);
        }
    }

    console.log();

    // Test 2: Git Installation Check
    console.log('Test 2: Git Installation');
    console.log('─'.repeat(50));
    const hasGit = gitUtils.isGitInstalled();
    console.log(hasGit ? '✅ Git is installed' : '❌ Git is not installed');
    console.log();

    // Test 3: GitHub API
    if (hasGit) {
        console.log('Test 3: GitHub API - Repository Info');
        console.log('─'.repeat(50));

        try {
            const repoInfo = gitUtils.parseGitHubURL('facebook/react');
            const info = await gitUtils.getRepositoryInfo(repoInfo);

            console.log('✅ API call successful');
            console.log(`   Name: ${info.fullName}`);
            console.log(`   Description: ${info.description.substring(0, 50)}...`);
            console.log(`   Stars: ⭐ ${info.stars.toLocaleString()}`);
            console.log(`   Language: ${info.language}`);
            console.log(`   Default Branch: ${info.defaultBranch}`);
        } catch (error) {
            console.log(`❌ API call failed: ${error.message}`);
        }
    }

    console.log();
    console.log('═'.repeat(50));
    console.log('✅ Git Integration Tests Complete!');
    console.log('═'.repeat(50));
    console.log();
    console.log('To test full GitIngest generation:');
    console.log('  context-manager github owner/repo');
    console.log();
}

runTests().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
});
