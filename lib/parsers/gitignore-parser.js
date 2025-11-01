/**
 * GitIgnore Parser
 * Parses .gitignore, .calculatorignore, and .calculatorinclude files
 */

const fs = require('fs');

class GitIgnoreParser {
    constructor(gitignorePath, calculatorIgnorePath, calculatorIncludePath) {
        this.patterns = [];
        this.calculatorPatterns = [];
        this.hasIncludeFile = false;
        this._lastIgnoreReason = null;

        this.loadPatterns(gitignorePath, calculatorIgnorePath, calculatorIncludePath);
    }

    loadPatterns(gitignorePath, calculatorIgnorePath, calculatorIncludePath) {
        // Load .gitignore
        if (fs.existsSync(gitignorePath)) {
            this.patterns = this.parsePatternFile(gitignorePath);
        }

        // Load calculator patterns (include takes priority)
        if (calculatorIncludePath && fs.existsSync(calculatorIncludePath)) {
            this.calculatorPatterns = this.parsePatternFile(calculatorIncludePath);
            this.hasIncludeFile = true;
            console.log(`📅 Calculator include rules loaded: ${this.calculatorPatterns.length} patterns`);
        } else if (calculatorIgnorePath && fs.existsSync(calculatorIgnorePath)) {
            this.calculatorPatterns = this.parsePatternFile(calculatorIgnorePath);
            console.log(`📋 Calculator ignore rules loaded: ${this.calculatorPatterns.length} patterns`);
        }
    }

    parsePatternFile(filePath) {
        return fs.readFileSync(filePath, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(pattern => this.convertToRegex(pattern));
    }

    convertToRegex(pattern) {
        const isDirectory = pattern.endsWith('/');
        const isNegation = pattern.startsWith('!');
        const original = pattern;

        pattern = pattern.replace(/^[!/]/, '').replace(/\/$/, '');

        let regexPattern = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '[^/]');

        regexPattern = original.startsWith('/')
            ? `^${regexPattern}`
            : `(^|/)${regexPattern}`;

        regexPattern += isDirectory ? '(/.*)?$' : '$';

        return { regex: new RegExp(regexPattern), isNegation, original, isDirectory };
    }

    isIgnored(filePath, relativePath) {
        let ignored = this.testPatterns(this.patterns, relativePath, 'gitignore');

        if (this.hasIncludeFile) {
            if (ignored) return true; // Keep gitignore exclusions

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const shouldTraverse = this.calculatorPatterns.some(p =>
                    p.original.startsWith(relativePath) ||
                    p.original.includes('**') ||
                    relativePath === ''
                );
                ignored = !shouldTraverse;
            } else {
                const included = this.testPatternsWithNegation(this.calculatorPatterns, relativePath);
                ignored = !included;
            }

            if (ignored) this._lastIgnoreReason = 'calculator-include';
        } else if (!ignored) {
            ignored = this.testPatterns(this.calculatorPatterns, relativePath, 'calculator');
        }

        return ignored;
    }

    testPatterns(patterns, relativePath, reason) {
        let ignored = false;
        for (const pattern of patterns) {
            if (pattern.regex.test(relativePath)) {
                ignored = !pattern.isNegation;
                if (ignored) this._lastIgnoreReason = reason;
            }
        }
        return ignored;
    }

    testPatternsWithNegation(patterns, relativePath) {
        let included = false;
        for (const pattern of patterns) {
            if (pattern.regex.test(relativePath)) {
                included = pattern.isNegation ? false : true;
                if (pattern.isNegation) break;
            }
        }
        return included;
    }
}

module.exports = GitIgnoreParser;
