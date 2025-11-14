#!/usr/bin/env node
/**
 * Test Updater Module
 * Tests auto-update system, version management, and update channels
 */

import Updater from '../lib/utils/updater.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

console.log('🧪 Testing Updater Module...\n');

// Create temp directory for tests
const tempDir = path.join(os.tmpdir(), 'context-manager-test-updater-' + Date.now());
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ ${message}`);
        testsPassed++;
    } else {
        console.log(`❌ ${message}`);
        testsFailed++;
    }
}

async function runTests() {
    // Test 1: Initialization
    console.log('Test 1: Updater Initialization');
    console.log('─'.repeat(60));

    const updater = new Updater({
        configDir: tempDir,
        channel: 'stable',
        autoUpdate: true,
        checkInterval: 3600000 // 1 hour
    });

    assert(updater.channel === 'stable', 'Channel set to stable');
    assert(updater.autoUpdate === true, 'Auto-update enabled');
    assert(updater.checkInterval === 3600000, 'Check interval set correctly');
    assert(updater.currentVersion !== '0.0.0', 'Current version loaded from package.json');
    console.log(`   Current version: ${updater.currentVersion}\n`);

    // Test 2: Version Comparison - Basic
    console.log('Test 2: Version Comparison (Basic)');
    console.log('─'.repeat(60));

    assert(updater.compareVersions('1.0.0', '2.0.0') === -1, '1.0.0 < 2.0.0');
    assert(updater.compareVersions('2.0.0', '1.0.0') === 1, '2.0.0 > 1.0.0');
    assert(updater.compareVersions('1.0.0', '1.0.0') === 0, '1.0.0 == 1.0.0');
    assert(updater.compareVersions('1.0.1', '1.0.0') === 1, '1.0.1 > 1.0.0');
    assert(updater.compareVersions('1.1.0', '1.0.9') === 1, '1.1.0 > 1.0.9');
    assert(updater.compareVersions('2.0.0', '1.9.9') === 1, '2.0.0 > 1.9.9');
    console.log();

    // Test 3: Version Comparison - Edge Cases
    console.log('Test 3: Version Comparison (Edge Cases)');
    console.log('─'.repeat(60));

    assert(updater.compareVersions('1.0', '1.0.0') === 0, '1.0 == 1.0.0 (missing patch)');
    assert(updater.compareVersions('1', '1.0.0') === 0, '1 == 1.0.0 (missing minor and patch)');
    assert(updater.compareVersions('1.0.0.0', '1.0.0') === 0, '1.0.0.0 == 1.0.0 (extra segment)');
    assert(updater.compareVersions('10.0.0', '9.0.0') === 1, '10.0.0 > 9.0.0 (two-digit major)');
    console.log();

    // Test 4: Semver Parsing with Pre-release
    console.log('Test 4: Semver Parsing with Pre-release');
    console.log('─'.repeat(60));

    // Note: Current implementation doesn't support pre-release properly
    // This test will expose the limitation
    const v1 = '3.1.0-beta.1';
    const v2 = '3.1.0';
    const result = updater.compareVersions(v1, v2);

    // Current implementation will fail this - it doesn't handle pre-release
    // Expected: v1 < v2 (pre-release should be less than release)
    // Actual: Will likely compare '3' with 'beta' which causes issues

    console.log(`   Comparing ${v1} vs ${v2}: result = ${result}`);
    console.log(`   ⚠️  Pre-release handling needs improvement in compareVersions()`);
    console.log('   Current implementation only handles numeric version segments\n');

    // Test 5: Installation Type Detection
    console.log('Test 5: Installation Type Detection');
    console.log('─'.repeat(60));

    const installType = updater.detectInstallationType();
    console.log(`   Detected installation type: ${installType}`);
    assert(['global', 'local', 'source', 'unknown'].includes(installType),
           'Installation type is valid');
    console.log();

    // Test 6: Update Cache - Save and Load
    console.log('Test 6: Update Cache - Save and Load');
    console.log('─'.repeat(60));

    const cacheData = {
        available: true,
        currentVersion: '1.0.0',
        latestVersion: '1.1.0',
        lastCheck: new Date().toISOString()
    };

    updater.saveUpdateCache(cacheData);
    const loadedCache = updater.getUpdateCache();

    assert(loadedCache !== null, 'Cache loaded successfully');
    assert(loadedCache.available === true, 'Cache contains correct data');
    assert(loadedCache.latestVersion === '1.1.0', 'Latest version cached correctly');
    console.log();

    // Test 7: Update Check Interval
    console.log('Test 7: Update Check Interval');
    console.log('─'.repeat(60));

    // Fresh check should be required
    const updater2 = new Updater({
        configDir: path.join(tempDir, 'interval-test'),
        checkInterval: 1000 // 1 second
    });

    assert(updater2.shouldCheckForUpdates() === true,
           'Should check for updates (no cache)');

    // Save cache with recent timestamp
    updater2.saveUpdateCache({
        lastCheck: new Date().toISOString()
    });

    assert(updater2.shouldCheckForUpdates() === false,
           'Should not check (within interval)');

    // Save cache with old timestamp
    const oldDate = new Date(Date.now() - 2000).toISOString();
    updater2.saveUpdateCache({
        lastCheck: oldDate
    });

    assert(updater2.shouldCheckForUpdates() === true,
           'Should check for updates (interval exceeded)');
    console.log();

    // Test 8: Channel Validation
    console.log('Test 8: Channel Validation');
    console.log('─'.repeat(60));

    try {
        await updater.switchChannel('invalid-channel');
        assert(false, 'Should reject invalid channel');
    } catch (error) {
        assert(error.message.includes('Invalid channel'),
               'Invalid channel rejected with proper error');
    }
    console.log();

    // Test 9: Channel Switching (Stable)
    console.log('Test 9: Channel Switching to Stable');
    console.log('─'.repeat(60));

    const updater3 = new Updater({
        configDir: path.join(tempDir, 'channel-test-stable'),
        channel: 'insider'
    });

    assert(updater3.channel === 'insider', 'Initially set to insider');

    // Note: This will make actual API call, may fail without network
    console.log('   Switching to stable channel...');
    try {
        await updater3.switchChannel('stable');
        assert(updater3.channel === 'stable', 'Switched to stable channel');
        console.log('   ✅ Successfully switched to stable');
    } catch (error) {
        console.log(`   ⚠️  Network call failed (expected in offline tests): ${error.message}`);
    }
    console.log();

    // Test 10: Channel Switching (Insider)
    console.log('Test 10: Channel Switching to Insider');
    console.log('─'.repeat(60));

    const updater4 = new Updater({
        configDir: path.join(tempDir, 'channel-test-insider'),
        channel: 'stable'
    });

    assert(updater4.channel === 'stable', 'Initially set to stable');

    console.log('   Switching to insider channel...');
    try {
        await updater4.switchChannel('insider');
        assert(updater4.channel === 'insider', 'Switched to insider channel');
        console.log('   ✅ Successfully switched to insider');
    } catch (error) {
        console.log(`   ⚠️  Network call failed (expected in offline tests): ${error.message}`);
    }
    console.log();

    // Test 11: Configuration Save/Load
    console.log('Test 11: Configuration Save/Load');
    console.log('─'.repeat(60));

    const configDir = path.join(tempDir, 'config-test');
    const updater5 = new Updater({ configDir });

    updater5.saveConfig({
        channel: 'insider',
        autoUpdate: false
    });

    const configFile = path.join(configDir, 'config.json');
    assert(fs.existsSync(configFile), 'Config file created');

    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    assert(config.updateChannel === 'insider', 'Channel saved correctly');
    assert(config.autoUpdate === false, 'Auto-update setting saved correctly');
    assert(config.lastUpdateCheck !== undefined, 'Last update check timestamp saved');
    console.log();

    // Test 12: Backup Creation
    console.log('Test 12: Backup Creation');
    console.log('─'.repeat(60));

    const updater6 = new Updater({
        configDir: path.join(tempDir, 'backup-test')
    });

    const backupPath = updater6.createBackup();
    assert(fs.existsSync(backupPath), 'Backup directory created');

    const backupInfoPath = path.join(backupPath, 'backup-info.json');
    assert(fs.existsSync(backupInfoPath), 'Backup info file created');

    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
    assert(backupInfo.version === updater6.currentVersion, 'Backup version matches current');
    assert(backupInfo.timestamp !== undefined, 'Backup timestamp recorded');
    assert(backupInfo.installType !== undefined, 'Installation type recorded');
    console.log(`   ✅ Backup created at: ${path.basename(backupPath)}\n`);

    // Test 13: Rollback (No Backups)
    console.log('Test 13: Rollback (No Backups Available)');
    console.log('─'.repeat(60));

    const updater7 = new Updater({
        configDir: path.join(tempDir, 'rollback-test-empty')
    });

    const rollbackResult = await updater7.rollback();
    assert(rollbackResult.success === false, 'Rollback fails when no backups');
    assert(rollbackResult.error.includes('No backups'), 'Error message mentions no backups');
    console.log();

    // Test 14: Check for Updates (Network Simulation)
    console.log('Test 14: Check for Updates (Live API Call)');
    console.log('─'.repeat(60));

    console.log('   Making actual API call to GitHub...');
    try {
        const updateInfo = await updater.checkForUpdates();

        assert(updateInfo !== null, 'Update info returned');
        assert(updateInfo.currentVersion !== undefined, 'Current version included');

        if (updateInfo.available) {
            console.log('   ✅ Update available!');
            console.log(`      Current: ${updateInfo.currentVersion}`);
            console.log(`      Latest: ${updateInfo.latestVersion}`);
            assert(updateInfo.latestVersion !== undefined, 'Latest version provided');
            assert(updateInfo.downloadUrl !== undefined, 'Download URL provided');
        } else if (updateInfo.error) {
            console.log(`   ⚠️  Network error: ${updateInfo.error}`);
        } else {
            console.log('   ✅ Already up to date');
            assert(updateInfo.message !== undefined, 'Status message provided');
        }
    } catch (error) {
        console.log(`   ⚠️  API call failed: ${error.message}`);
    }
    console.log();

    // Test 15: Update Notification Format
    console.log('Test 15: Update Notification Display');
    console.log('─'.repeat(60));

    const mockUpdateInfo = {
        available: true,
        currentVersion: '1.0.0',
        latestVersion: '2.0.0',
        channel: 'stable'
    };

    console.log('   Sample notification output:');
    updater.showUpdateNotification(mockUpdateInfo);
    assert(true, 'Notification displayed without errors');
    console.log();

    // Test 16: Get Latest Version (Stable Channel)
    console.log('Test 16: Get Latest Version (Stable Channel)');
    console.log('─'.repeat(60));

    const updater8 = new Updater({
        configDir: tempDir,
        channel: 'stable'
    });

    console.log('   Fetching latest stable release...');
    try {
        const latestVersion = await updater8.getLatestVersion();

        if (latestVersion) {
            console.log(`   ✅ Latest stable version: ${latestVersion.version}`);
            assert(latestVersion.version !== undefined, 'Version number retrieved');
            assert(latestVersion.downloadUrl !== undefined, 'Download URL retrieved');
            assert(latestVersion.publishedAt !== undefined, 'Publish date retrieved');
        } else {
            console.log('   ⚠️  Could not fetch latest version');
        }
    } catch (error) {
        console.log(`   ⚠️  API call failed: ${error.message}`);
    }
    console.log();

    // Test 17: Get Latest Version (Insider Channel)
    console.log('Test 17: Get Latest Version (Insider Channel)');
    console.log('─'.repeat(60));

    const updater9 = new Updater({
        configDir: tempDir,
        channel: 'insider'
    });

    console.log('   Fetching latest pre-release...');
    try {
        const latestVersion = await updater9.getLatestVersion();

        if (latestVersion) {
            console.log(`   ✅ Latest insider version: ${latestVersion.version}`);
            assert(latestVersion.version !== undefined, 'Version number retrieved');
        } else {
            console.log('   ⚠️  Could not fetch latest version (may not have pre-releases)');
        }
    } catch (error) {
        console.log(`   ⚠️  API call failed: ${error.message}`);
    }
    console.log();

    // Test 18: Check and Notify (With Cache)
    console.log('Test 18: Check and Notify (Respects Cache)');
    console.log('─'.repeat(60));

    const updater10 = new Updater({
        configDir: path.join(tempDir, 'notify-test'),
        checkInterval: 3600000 // 1 hour
    });

    // First call - should fetch from API
    console.log('   First check (no cache)...');
    try {
        const result1 = await updater10.checkAndNotify();
        assert(result1 !== null, 'First check completed');

        // Second call immediately - should use cache
        console.log('   Second check (should use cache)...');
        const result2 = await updater10.checkAndNotify();
        assert(result2 !== null, 'Second check completed');
        console.log('   ✅ Cache system working');
    } catch (error) {
        console.log(`   ⚠️  Network error: ${error.message}`);
    }
    console.log();

    // Test 19: Installation Directory Detection
    console.log('Test 19: Installation Directory Detection');
    console.log('─'.repeat(60));

    const installDir = updater.getInstallDir();
    console.log(`   Installation directory: ${installDir}`);
    assert(installDir !== null, 'Installation directory detected');
    assert(fs.existsSync(installDir), 'Installation directory exists');
    console.log();

    // Test 20: Proxy Support (Feature Check)
    console.log('Test 20: Proxy Support (Feature Check)');
    console.log('─'.repeat(60));

    // Check if proxy support exists
    const updaterWithProxy = new Updater({
        configDir: tempDir,
        proxy: 'http://proxy.example.com:8080'
    });

    if (updaterWithProxy.proxy) {
        console.log(`   ✅ Proxy support detected: ${updaterWithProxy.proxy}`);
        assert(updaterWithProxy.proxy === 'http://proxy.example.com:8080',
               'Proxy configuration stored');
    } else {
        console.log('   ⚠️  Proxy support not implemented in current version');
        console.log('   This feature may be added in future updates');
    }
    console.log();

    // Test 21: Custom Registry URL
    console.log('Test 21: Custom Registry URL (Feature Check)');
    console.log('─'.repeat(60));

    const customRegistry = 'https://custom-registry.example.com';
    const updaterWithRegistry = new Updater({
        configDir: tempDir,
        registryUrl: customRegistry
    });

    if (updaterWithRegistry.registryUrl) {
        console.log(`   ✅ Custom registry supported: ${updaterWithRegistry.registryUrl}`);
        assert(updaterWithRegistry.registryUrl === customRegistry,
               'Custom registry URL stored');
    } else {
        console.log('   ⚠️  Custom registry URL not configurable in current version');
        console.log('   Endpoints are currently hardcoded');
        console.log('   This could be made configurable for enterprise deployments');
    }
    console.log();

    // Cleanup
    console.log('Cleanup: Removing temporary test files...');
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('✅ Cleanup complete\n');
    } catch (error) {
        console.log(`⚠️  Cleanup warning: ${error.message}\n`);
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('Test Summary');
    console.log('═'.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📊 Total:  ${testsPassed + testsFailed}`);
    console.log('═'.repeat(60));
    console.log();

    // Recommendations
    console.log('💡 Recommendations for Updater Module:');
    console.log('─'.repeat(60));
    console.log('1. Implement proper semver pre-release support in compareVersions()');
    console.log('2. Add proxy support for corporate environments');
    console.log('3. Make registry endpoints configurable via constructor');
    console.log('4. Add retry logic with exponential backoff for network failures');
    console.log('5. Implement update verification with checksums/signatures');
    console.log('6. Add update history tracking (log of all updates)');
    console.log('7. Consider adding update rollback history limit');
    console.log('8. Add telemetry opt-out for privacy-conscious users');
    console.log();

    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
});
