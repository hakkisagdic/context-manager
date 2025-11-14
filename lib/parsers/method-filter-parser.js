/**
 * Method Filter Parser
 * Parses .methodinclude and .methodignore files for method-level filtering
 */

import fs from 'fs';

class MethodFilterParser {
    constructor(methodIncludePath, methodIgnorePath, tracer = null) {
        this.includePatterns = [];
        this.ignorePatterns = [];
        this.hasIncludeFile = false;
        this.tracer = tracer;

        if (methodIncludePath && fs.existsSync(methodIncludePath)) {
            this.includePatterns = this.parseMethodFile(methodIncludePath);
            this.hasIncludeFile = true;
            console.log(`🔧 Method include rules loaded: ${this.includePatterns.length} patterns`);
        }

        if (methodIgnorePath && fs.existsSync(methodIgnorePath)) {
            this.ignorePatterns = this.parseMethodFile(methodIgnorePath);
            console.log(`🚫 Method ignore rules loaded: ${this.ignorePatterns.length} patterns`);
        }
    }

    parseMethodFile(filePath) {
        return fs.readFileSync(filePath, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(pattern => {
                const isNegation = pattern.startsWith('!');
                const cleanPattern = isNegation ? pattern.substring(1) : pattern;
                // Escape special regex chars except * which we want to convert to .*
                const escapedPattern = cleanPattern
                    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
                    .replace(/\*/g, '.*');
                const regexPattern = '^' + escapedPattern + '$';
                return {
                    pattern: pattern,
                    regex: new RegExp(regexPattern, 'i'),
                    isNegation: isNegation
                };
            });
    }

    shouldIncludeMethod(methodName, fileName) {
        let included = false;
        let matchedRule = null;
        let ruleSource = null;

        if (this.hasIncludeFile) {
            // Process all patterns - last match wins (like gitignore)
            for (const pattern of this.includePatterns) {
                // Test method name first
                let matches = pattern.regex.test(methodName);
                // Only test fileName.methodName if pattern contains a dot (Class.method pattern)
                if (!matches && pattern.pattern.replace(/^!/, '').includes('.')) {
                    matches = pattern.regex.test(`${fileName}.${methodName}`);
                }
                if (matches) {
                    // Negation reverses the match
                    included = !pattern.isNegation;
                    matchedRule = pattern.pattern;
                    ruleSource = '.methodinclude';
                    // Don't break - continue to check remaining patterns
                }
            }
        } else {
            included = true; // Default to included
            // Process all patterns - last match wins (like gitignore)
            for (const pattern of this.ignorePatterns) {
                // Test method name first
                let matches = pattern.regex.test(methodName);
                // Only test fileName.methodName if pattern contains a dot (Class.method pattern)
                if (!matches && pattern.pattern.replace(/^!/, '').includes('.')) {
                    matches = pattern.regex.test(`${fileName}.${methodName}`);
                }
                if (matches) {
                    // Negation reverses the exclusion
                    included = pattern.isNegation;
                    matchedRule = pattern.pattern;
                    ruleSource = '.methodignore';
                    // Don't break - continue to check remaining patterns
                }
            }
        }

        // Record decision with tracer
        if (this.tracer && this.tracer.isEnabled()) {
            this.tracer.recordMethodDecision(fileName, methodName, {
                included: included,
                reason: included
                    ? (this.hasIncludeFile 
                        ? 'Matched .methodinclude pattern' 
                        : 'No .methodignore pattern matched')
                    : 'Matched .methodignore pattern',
                rule: matchedRule,
                ruleSource: ruleSource,
                mode: this.hasIncludeFile ? 'INCLUDE' : 'EXCLUDE'
            });
        }

        return included;
    }
}

export default MethodFilterParser;
