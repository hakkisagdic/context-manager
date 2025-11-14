#!/usr/bin/env node
/**
 * Context Manager - Update Command
 * Handles version updates and channel switching
 */

import Updater from '../lib/utils/updater.js';
import { getLogger } from '../lib/utils/logger.js';

const logger = getLogger({ level: 'info' });

async function main() {
    const args = process.argv.slice(2);

    // Parse command
    const command = args[0];

    const updater = new Updater();

    switch (command) {
        case 'check':
            await checkForUpdates(updater);
            break;

        case 'install':
            await installUpdate(updater);
            break;

        case 'rollback':
            await rollbackVersion(updater);
            break;

        case 'channel':
            await switchChannel(updater, args[1]);
            break;

        case 'info':
            showUpdateInfo(updater);
            break;

        default:
            // Default: check and optionally install
            await checkAndUpdate(updater);
            break;
    }
}

async function checkForUpdates(updater) {
    console.log('🔍 Checking for updates...\n');

    const updateInfo = await updater.checkForUpdates();

    if (updateInfo.error) {
        logger.error('Failed to check for updates', { error: updateInfo.error });
        console.log(`\n❌ ${updateInfo.message}`);
        return;
    }

    if (updateInfo.available) {
        console.log('✨ Update available!\n');
        console.log(`   Current: ${updateInfo.currentVersion}`);
        console.log(`   Latest:  ${updateInfo.latestVersion}`);
        console.log(`   Channel: ${updateInfo.channel}\n`);

        if (updateInfo.releaseNotes) {
            console.log('📝 Release Notes:');
            console.log('   ' + updateInfo.releaseNotes.split('\n').join('\n   '));
            console.log('');
        }

        console.log('To install: context-manager update install\n');
    } else {
        console.log('✓ You are using the latest version\n');
        console.log(`   Version: ${updateInfo.currentVersion}`);
        console.log(`   Channel: ${updater.channel}\n`);
    }
}

async function installUpdate(updater) {
    console.log('📦 Installing update...\n');

    const updateInfo = await updater.checkForUpdates();

    if (!updateInfo.available) {
        console.log('✓ Already using the latest version\n');
        return;
    }

    const result = await updater.installUpdate(updateInfo);

    if (result.success) {
        console.log('\n✅ Update installed successfully!\n');
        logger.info('Update installed', {
            from: updateInfo.currentVersion,
            to: updateInfo.latestVersion
        });
    } else if (result.manualUpdateRequired) {
        logger.warn('Manual update required');
    } else {
        console.log('\n❌ Update failed\n');
        logger.error('Update failed', { error: result.error });
    }
}

async function switchChannel(updater, newChannel) {
    if (!newChannel) {
        console.log('❌ Please specify a channel: stable or insider\n');
        console.log('Usage: context-manager update channel <stable|insider>\n');
        return;
    }

    try {
        console.log(`🔄 Switching to ${newChannel} channel...\n`);

        const updateInfo = await updater.switchChannel(newChannel);

        logger.info('Channel switched', { channel: newChannel });

        if (updateInfo.available) {
            console.log(`\n✨ Update available on ${newChannel} channel!\n`);
            console.log(`   Latest: ${updateInfo.latestVersion}\n`);
            console.log('To install: context-manager update install\n');
        }
    } catch (error) {
        console.log(`\n❌ ${error.message}\n`);
        logger.error('Failed to switch channel', { error: error.message });
    }
}

async function rollbackVersion(updater) {
    console.log('🔄 Rolling back to previous version...\n');

    const result = await updater.rollback();

    if (result.success) {
        console.log(`\n✅ Successfully rolled back to v${result.restoredVersion}\n`);
        logger.info('Version rolled back', {
            restoredVersion: result.restoredVersion
        });
    } else {
        console.log(`\n❌ Rollback failed: ${result.error}\n`);
        logger.error('Rollback failed', { error: result.error });
    }
}

function showUpdateInfo(updater) {
    console.log('ℹ️  Update Configuration\n');
    console.log(`   Current version: ${updater.currentVersion}`);
    console.log(`   Update channel:  ${updater.channel}`);
    console.log(`   Auto-update:     ${updater.autoUpdate ? 'Enabled' : 'Disabled'}\n`);

    console.log('Available commands:\n');
    console.log('   context-manager update check    - Check for updates');
    console.log('   context-manager update install  - Install latest update');
    console.log('   context-manager update rollback - Rollback to previous version');
    console.log('   context-manager update channel  - Switch update channel');
    console.log('   context-manager update info     - Show this information\n');

    console.log('Channels:\n');
    console.log('   stable  - Stable releases (recommended)');
    console.log('   insider - Pre-release builds (bleeding edge)\n');
}

async function checkAndUpdate(updater) {
    const updateInfo = await updater.checkAndNotify();

    if (updateInfo && updateInfo.available) {
        console.log('Run "context-manager update install" to update\n');
    }
}

main().catch(error => {
    console.error('Update command failed:', error.message);
    process.exit(1);
});
