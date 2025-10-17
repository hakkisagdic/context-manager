/**
 * Cross-platform Clipboard Utilities
 * Handles clipboard operations for macOS, Linux, and Windows
 */

const { execSync } = require('child_process');

class ClipboardUtils {
    /**
     * Copy text to system clipboard
     * @param {string} text - Text to copy
     * @returns {boolean} Success status
     */
    static copy(text) {
        try {
            if (process.platform === 'darwin') {
                // macOS
                execSync('pbcopy', { input: text, encoding: 'utf8' });
            } else if (process.platform === 'linux') {
                // Linux - try xclip first, then xsel
                try {
                    execSync('xclip -selection clipboard', { input: text, encoding: 'utf8' });
                } catch {
                    execSync('xsel --clipboard --input', { input: text, encoding: 'utf8' });
                }
            } else if (process.platform === 'win32') {
                // Windows
                execSync('clip', { input: text, encoding: 'utf8' });
            } else {
                throw new Error('Unsupported platform for clipboard');
            }

            console.log('✅ Context copied to clipboard!');
            console.log(`📋 ${text.length} characters copied`);
            return true;

        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error.message);
            return false;
        }
    }

    /**
     * Check if clipboard is available on current platform
     * @returns {boolean}
     */
    static isAvailable() {
        const platform = process.platform;
        return ['darwin', 'linux', 'win32'].includes(platform);
    }

    /**
     * Get clipboard command for current platform
     * @returns {string} Command name
     */
    static getCommand() {
        const commands = {
            darwin: 'pbcopy',
            linux: 'xclip',
            win32: 'clip'
        };
        return commands[process.platform] || 'unknown';
    }
}

module.exports = ClipboardUtils;
