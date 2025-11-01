/**
 * Token Counting and Formatting Utilities
 * Handles exact token counting (tiktoken) and smart estimation
 */

// Load tiktoken for exact token counting
let tiktoken = null;
try {
    tiktoken = require('tiktoken');
} catch (err) {
    // tiktoken is optional
}

class TokenUtils {
    /**
     * Calculate exact or estimated tokens for content
     * @param {string} content - File content
     * @param {string} filePath - File path for extension-based estimation
     * @returns {number} Token count
     */
    static calculate(content, filePath) {
        if (tiktoken) {
            try {
                const encoding = tiktoken.get_encoding('cl100k_base');
                const tokens = encoding.encode(content);
                encoding.free();
                return tokens.length;
            } catch (error) {
                return this.estimate(content, filePath);
            }
        }
        return this.estimate(content, filePath);
    }

    /**
     * Estimate tokens based on file type and content length
     * @param {string} content - File content
     * @param {string} filePath - File path for extension detection
     * @returns {number} Estimated token count
     */
    static estimate(content, filePath) {
        const path = require('path');
        const ext = path.extname(filePath).toLowerCase();

        const charsPerToken = {
            '.json': 2.5,
            '.js': 3.2,
            '.ts': 3.2,
            '.jsx': 3.2,
            '.tsx': 3.2,
            '.java': 3.0,
            '.md': 4.0,
            '.txt': 4.0,
            '.yml': 3.5,
            '.yaml': 3.5,
            '.html': 2.8,
            '.xml': 2.8
        }[ext] || 3.5;

        const cleanText = content.replace(/\s+/g, ' ').trim();
        return Math.ceil(cleanText.length / charsPerToken);
    }

    /**
     * Format token count as human-readable string
     * @param {number} tokens - Token count
     * @returns {string} Formatted string (e.g., "1.2k", "1.5M")
     */
    static format(tokens) {
        if (tokens >= 1_000_000) {
            return `${(tokens / 1_000_000).toFixed(1)}M`;
        } else if (tokens >= 1_000) {
            return `${(tokens / 1_000).toFixed(1)}k`;
        }
        return tokens.toString();
    }

    /**
     * Check if tiktoken is available
     * @returns {boolean}
     */
    static hasExactCounting() {
        return !!tiktoken;
    }
}

module.exports = TokenUtils;
