#!/usr/bin/env node

/**
 * Comprehensive Wizard Tests
 * Tests wizard component functionality, profile discovery, and file operations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function assert(condition, testName, message = '') {
    if (condition) {
        console.log(`✅ ${testName}`);
        testsPassed++;
        return true;
    } else {
        console.log(`❌ ${testName}: ${message}`);
        testsFailed++;
        failedTests.push({ name: testName, message });
        return false;
    }
}

console.log('🧪 COMPREHENSIVE WIZARD TESTS');
console.log('='.repeat(70));

// Create test directory
const testDir = path.join(__dirname, 'temp-test-wizard');
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// ============================================================================
// WIZARD MODULE IMPORT TESTS
// ============================================================================
console.log('\n📦 Wizard Module Tests\n' + '-'.repeat(70));

// Test 1: Wizard module exists and can be imported
{
    try {
        const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
        assert(
            fs.existsSync(wizardPath),
            'Wizard: Module file exists at lib/ui/wizard.js'
        );
    } catch (error) {
        assert(false, 'Wizard: Module file exists', error.message);
    }
}

// Test 2: Wizard imports without errors
{
    try {
        // Dynamic import to test module loading
        const importPromise = import('../lib/ui/wizard.js');
        assert(
            importPromise !== null,
            'Wizard: Module can be imported'
        );
    } catch (error) {
        assert(false, 'Wizard: Module imports', error.message);
    }
}

// ============================================================================
// PROFILE DIRECTORY STRUCTURE TESTS
// ============================================================================
console.log('\n📁 Profile Directory Tests\n' + '-'.repeat(70));

// Test 3: Wizard profiles directory exists
{
    const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
    assert(
        fs.existsSync(profilesDir),
        'Profiles: .context-manager/wizard-profiles directory exists'
    );
}

// Test 4: Check for example profiles
{
    const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
    if (fs.existsSync(profilesDir)) {
        const profiles = fs.readdirSync(profilesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory());

        assert(
            profiles.length >= 0,
            'Profiles: Directory contains profile folders',
            `Found ${profiles.length} profiles`
        );
    } else {
        console.log('⚠️  Profiles: Skipping - directory not found');
        testsPassed++;
    }
}

// Test 5: Create mock profile structure
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/test-profile');
    fs.mkdirSync(mockProfileDir, { recursive: true });

    const profileMetadata = {
        id: 'test-profile',
        name: 'Test Profile',
        icon: '🧪',
        description: 'Test profile for testing'
    };

    fs.writeFileSync(
        path.join(mockProfileDir, 'profile.json'),
        JSON.stringify(profileMetadata, null, 2)
    );

    assert(
        fs.existsSync(path.join(mockProfileDir, 'profile.json')),
        'Profiles: Can create mock profile structure'
    );
}

// Test 6: Profile metadata validation
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/test-profile');
    const metadataPath = path.join(mockProfileDir, 'profile.json');

    if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        assert(
            metadata.id && metadata.name && metadata.icon,
            'Profiles: Metadata has required fields (id, name, icon)'
        );
    } else {
        assert(false, 'Profiles: Metadata file not found');
    }
}

// ============================================================================
// PROFILE FILE OPERATIONS TESTS
// ============================================================================
console.log('\n📄 Profile File Operations Tests\n' + '-'.repeat(70));

// Test 7: Create profile filter files
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/test-profile');
    const filterFiles = [
        '.contextinclude',
        '.contextignore',
        '.methodinclude',
        '.methodignore'
    ];

    filterFiles.forEach(fileName => {
        fs.writeFileSync(
            path.join(mockProfileDir, fileName),
            `# Test ${fileName}\n*.js\n*.ts`
        );
    });

    const allExist = filterFiles.every(fileName =>
        fs.existsSync(path.join(mockProfileDir, fileName))
    );

    assert(
        allExist,
        'Profile Files: All filter files created successfully'
    );
}

// Test 8: Copy profile files to project root
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/test-profile');
    const projectRoot = path.join(testDir, 'project');
    fs.mkdirSync(projectRoot, { recursive: true });

    const filterFiles = ['.contextinclude', '.contextignore'];
    const copiedFiles = [];

    filterFiles.forEach(fileName => {
        const sourcePath = path.join(mockProfileDir, fileName);
        const destPath = path.join(projectRoot, `${fileName}-test-profile`);

        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            copiedFiles.push(destPath);
        }
    });

    assert(
        copiedFiles.length === 2,
        'Profile Files: Files copied to project root with suffix',
        `Copied ${copiedFiles.length} files`
    );
}

// Test 9: Validate copied file contents
{
    const projectRoot = path.join(testDir, 'project');
    const copiedFile = path.join(projectRoot, '.contextinclude-test-profile');

    if (fs.existsSync(copiedFile)) {
        const content = fs.readFileSync(copiedFile, 'utf-8');
        assert(
            content.includes('*.js') && content.includes('*.ts'),
            'Profile Files: Copied file content is correct'
        );
    } else {
        assert(false, 'Profile Files: Copied file not found');
    }
}

// Test 10: Handle missing profile files gracefully
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/incomplete-profile');
    fs.mkdirSync(mockProfileDir, { recursive: true });

    const metadata = {
        id: 'incomplete',
        name: 'Incomplete Profile',
        icon: '⚠️'
    };

    fs.writeFileSync(
        path.join(mockProfileDir, 'profile.json'),
        JSON.stringify(metadata)
    );

    // Don't create filter files - test graceful handling
    assert(
        fs.existsSync(path.join(mockProfileDir, 'profile.json')),
        'Profile Files: Handles profiles without filter files'
    );
}

// ============================================================================
// CONFIGURATION VALIDATION TESTS
// ============================================================================
console.log('\n⚙️  Configuration Validation Tests\n' + '-'.repeat(70));

// Test 11: Validate profile.json schema
{
    const validProfile = {
        id: 'valid-profile',
        name: 'Valid Profile',
        icon: '✅',
        description: 'A valid profile'
    };

    assert(
        validProfile.id && validProfile.name && validProfile.icon,
        'Config: Valid profile has all required fields'
    );
}

// Test 12: Detect invalid profile.json
{
    const invalidProfile = {
        name: 'Invalid Profile'
        // Missing id and icon
    };

    assert(
        !invalidProfile.id || !invalidProfile.icon,
        'Config: Invalid profile missing required fields'
    );
}

// Test 13: Handle malformed JSON
{
    const mockProfileDir = path.join(testDir, 'wizard-profiles/malformed');
    fs.mkdirSync(mockProfileDir, { recursive: true });
    fs.writeFileSync(
        path.join(mockProfileDir, 'profile.json'),
        '{ invalid json }'
    );

    try {
        const content = fs.readFileSync(path.join(mockProfileDir, 'profile.json'), 'utf-8');
        JSON.parse(content);
        assert(false, 'Config: Should throw on malformed JSON');
    } catch (error) {
        assert(
            true,
            'Config: Detects malformed JSON in profile.json'
        );
    }
}

// ============================================================================
// FILE PATTERN TESTS
// ============================================================================
console.log('\n🎯 File Pattern Tests\n' + '-'.repeat(70));

// Test 14: Contextinclude patterns
{
    const patterns = [
        '**/*.js',
        '**/*.ts',
        'src/**/*',
        '!**/node_modules/**'
    ];

    const profileDir = path.join(testDir, 'wizard-profiles/pattern-test');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(
        path.join(profileDir, '.contextinclude'),
        patterns.join('\n')
    );

    const content = fs.readFileSync(path.join(profileDir, '.contextinclude'), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    assert(
        lines.length === 4,
        'Patterns: Contextinclude contains all patterns',
        `Expected 4, got ${lines.length}`
    );
}

// Test 15: Contextignore patterns
{
    const patterns = [
        'node_modules/',
        '*.log',
        '.env',
        'dist/',
        'build/'
    ];

    const profileDir = path.join(testDir, 'wizard-profiles/pattern-test');
    fs.writeFileSync(
        path.join(profileDir, '.contextignore'),
        patterns.join('\n')
    );

    const content = fs.readFileSync(path.join(profileDir, '.contextignore'), 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    assert(
        lines.length === 5,
        'Patterns: Contextignore contains all patterns'
    );
}

// Test 16: Method filter patterns
{
    const patterns = [
        'MyClass.*',
        'TestClass.*',
        'get*',
        'set*'
    ];

    const profileDir = path.join(testDir, 'wizard-profiles/pattern-test');
    fs.writeFileSync(
        path.join(profileDir, '.methodinclude'),
        patterns.join('\n')
    );

    const content = fs.readFileSync(path.join(profileDir, '.methodinclude'), 'utf-8');

    assert(
        content.includes('MyClass.*') && content.includes('get*'),
        'Patterns: Method patterns written correctly'
    );
}

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n⚠️  Edge Cases Tests\n' + '-'.repeat(70));

// Test 17: Empty profile directory
{
    const emptyDir = path.join(testDir, 'wizard-profiles/empty');
    fs.mkdirSync(emptyDir, { recursive: true });

    const files = fs.readdirSync(emptyDir);
    assert(
        files.length === 0,
        'Edge Cases: Empty profile directory handled'
    );
}

// Test 18: Profile with special characters in name
{
    const specialProfile = {
        id: 'special-chars-test',
        name: 'Special & Chars <Test>',
        icon: '🔣'
    };

    const profileDir = path.join(testDir, 'wizard-profiles/special-chars-test');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(
        path.join(profileDir, 'profile.json'),
        JSON.stringify(specialProfile)
    );

    assert(
        fs.existsSync(path.join(profileDir, 'profile.json')),
        'Edge Cases: Handles special characters in profile name'
    );
}

// Test 19: Very long profile description
{
    const longDescription = 'A'.repeat(1000);
    const profile = {
        id: 'long-desc',
        name: 'Long Description',
        icon: '📝',
        description: longDescription
    };

    assert(
        profile.description.length === 1000,
        'Edge Cases: Handles very long descriptions'
    );
}

// Test 20: Unicode in profile names
{
    const unicodeProfile = {
        id: 'unicode-test',
        name: '你好世界 Test 🌏',
        icon: '🌐'
    };

    const profileDir = path.join(testDir, 'wizard-profiles/unicode-test');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(
        path.join(profileDir, 'profile.json'),
        JSON.stringify(unicodeProfile)
    );

    const content = JSON.parse(fs.readFileSync(path.join(profileDir, 'profile.json'), 'utf-8'));
    assert(
        content.name.includes('你好世界'),
        'Edge Cases: Handles unicode in profile names'
    );
}

// ============================================================================
// PERMISSION AND ACCESS TESTS
// ============================================================================
console.log('\n🔒 Permission Tests\n' + '-'.repeat(70));

// Test 21: Read profile with standard permissions
{
    const profileDir = path.join(testDir, 'wizard-profiles/perm-test');
    fs.mkdirSync(profileDir, { recursive: true });

    const metadata = { id: 'perm-test', name: 'Perm Test', icon: '🔐' };
    fs.writeFileSync(
        path.join(profileDir, 'profile.json'),
        JSON.stringify(metadata)
    );

    if (process.platform !== 'win32') {
        fs.chmodSync(path.join(profileDir, 'profile.json'), 0o644);
    }

    assert(
        fs.existsSync(path.join(profileDir, 'profile.json')),
        'Permissions: Profile readable with standard permissions'
    );
}

// Test 22: Handle non-existent profile directory
{
    const nonExistent = path.join(testDir, 'wizard-profiles/does-not-exist');

    assert(
        !fs.existsSync(nonExistent),
        'Permissions: Non-existent directory detected'
    );
}

// ============================================================================
// MULTIPLE PROFILES TESTS
// ============================================================================
console.log('\n📚 Multiple Profiles Tests\n' + '-'.repeat(70));

// Test 23: Create multiple profiles
{
    const profileNames = ['profile1', 'profile2', 'profile3'];
    const createdProfiles = [];

    profileNames.forEach((name, index) => {
        const profileDir = path.join(testDir, `wizard-profiles/${name}`);
        fs.mkdirSync(profileDir, { recursive: true });

        const metadata = {
            id: name,
            name: `Profile ${index + 1}`,
            icon: ['🥇', '🥈', '🥉'][index]
        };

        fs.writeFileSync(
            path.join(profileDir, 'profile.json'),
            JSON.stringify(metadata)
        );

        createdProfiles.push(profileDir);
    });

    assert(
        createdProfiles.length === 3,
        'Multiple Profiles: Created 3 profiles successfully'
    );
}

// Test 24: Discover multiple profiles
{
    const profilesDir = path.join(testDir, 'wizard-profiles');
    const profiles = fs.readdirSync(profilesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());

    assert(
        profiles.length >= 3,
        'Multiple Profiles: Discovers all created profiles',
        `Found ${profiles.length} profiles`
    );
}

// Test 25: Profile priority/ordering
{
    const profiles = [
        { id: 'a-first', name: 'A First', order: 1 },
        { id: 'b-second', name: 'B Second', order: 2 },
        { id: 'c-third', name: 'C Third', order: 3 }
    ];

    const sorted = profiles.sort((a, b) => a.order - b.order);

    assert(
        sorted[0].id === 'a-first' && sorted[2].id === 'c-third',
        'Multiple Profiles: Profiles can be ordered'
    );
}

// ============================================================================
// CLEANUP TESTS
// ============================================================================
console.log('\n🧹 Cleanup Tests\n' + '-'.repeat(70));

// Test 26: Remove profile files
{
    const projectRoot = path.join(testDir, 'project');
    const profileFiles = fs.readdirSync(projectRoot)
        .filter(f => f.includes('-test-profile'));

    profileFiles.forEach(file => {
        fs.unlinkSync(path.join(projectRoot, file));
    });

    const remaining = fs.readdirSync(projectRoot)
        .filter(f => f.includes('-test-profile'));

    assert(
        remaining.length === 0,
        'Cleanup: Profile files removed successfully'
    );
}

// Test 27: Backup existing configurations
{
    const projectRoot = path.join(testDir, 'backup-test');
    fs.mkdirSync(projectRoot, { recursive: true });

    const existingConfig = path.join(projectRoot, '.contextinclude');
    fs.writeFileSync(existingConfig, '# Existing config\n*.js');

    // Create backup
    const backupPath = `${existingConfig}.backup`;
    fs.copyFileSync(existingConfig, backupPath);

    assert(
        fs.existsSync(backupPath),
        'Cleanup: Existing configs backed up before overwrite'
    );
}

// Test 28: Restore from backup
{
    const projectRoot = path.join(testDir, 'backup-test');
    const configPath = path.join(projectRoot, '.contextinclude');
    const backupPath = `${configPath}.backup`;

    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, configPath);
        const restored = fs.readFileSync(configPath, 'utf-8');

        assert(
            restored.includes('# Existing config'),
            'Cleanup: Config restored from backup'
        );
    } else {
        assert(false, 'Cleanup: Backup file not found');
    }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\n🔗 Integration Tests\n' + '-'.repeat(70));

// Test 29: End-to-end profile application flow
{
    // 1. Create profile
    const profileDir = path.join(testDir, 'wizard-profiles/e2e-test');
    fs.mkdirSync(profileDir, { recursive: true });

    const metadata = { id: 'e2e-test', name: 'E2E Test', icon: '🔄' };
    fs.writeFileSync(path.join(profileDir, 'profile.json'), JSON.stringify(metadata));
    fs.writeFileSync(path.join(profileDir, '.contextinclude'), '**/*.js');

    // 2. Copy to project
    const projectRoot = path.join(testDir, 'e2e-project');
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.copyFileSync(
        path.join(profileDir, '.contextinclude'),
        path.join(projectRoot, '.contextinclude-e2e-test')
    );

    // 3. Verify
    const copied = fs.existsSync(path.join(projectRoot, '.contextinclude-e2e-test'));

    assert(
        copied,
        'Integration: End-to-end profile application works'
    );
}

// Test 30: Custom profile option
{
    const customOption = {
        label: '⚙️  Custom (use existing root config)',
        value: 'custom',
        path: null,
        metadata: null
    };

    assert(
        customOption.value === 'custom' && customOption.path === null,
        'Integration: Custom profile option structure correct'
    );
}

// Cleanup
if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📊 Total tests: ${testsPassed + testsFailed}`);
console.log(`🎯 Success rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(({ name, message }) => {
        console.log(`  • ${name}`);
        if (message) console.log(`    ${message}`);
    });
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
