/**
 * File Type Detection and Utilities
 * Identifies text files, code files, and binary files
 */

const path = require('path');

class FileUtils {
    /**
     * Check if file is a text file
     * @param {string} filePath - File path
     * @returns {boolean}
     */
    static isText(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();

        const textExtensions = new Set([
            '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
            '.html', '.css', '.scss', '.sass', '.less', '.xml', '.svg',
            '.sh', '.bash', '.zsh', '.py', '.rb', '.php', '.java', '.c', '.cpp',
            '.go', '.rs', '.swift', '.kt', '.cs', '.sql', '.toml', '.ini', '.conf'
        ]);

        const textFiles = ['dockerfile', 'makefile', 'license', 'readme', 'changelog'];

        return textExtensions.has(ext) ||
               textFiles.some(name => basename.includes(name));
    }

    /**
     * Check if file is a code file (supports method extraction)
     * @param {string} filePath - File path
     * @returns {boolean}
     */
    static isCode(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.js', '.ts', '.jsx', '.tsx', '.rs', '.cs', '.go', '.java'].includes(ext);
    }

    /**
     * Get file type category
     * @param {string} filePath - File path
     * @returns {string} Type: 'code', 'config', 'doc', 'style', 'other'
     */
    static getType(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        const categories = {
            code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.go', '.rs', '.cs'],
            config: ['.json', '.yml', '.yaml', '.toml', '.ini', '.conf', '.xml'],
            doc: ['.md', '.txt', '.pdf', '.doc', '.docx'],
            style: ['.css', '.scss', '.sass', '.less'],
        };

        for (const [type, extensions] of Object.entries(categories)) {
            if (extensions.includes(ext)) {
                return type;
            }
        }

        return 'other';
    }

    /**
     * Get file extension without dot
     * @param {string} filePath - File path
     * @returns {string} Extension or 'no-extension'
     */
    static getExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ext ? ext.slice(1) : 'no-extension';
    }
}

module.exports = FileUtils;
