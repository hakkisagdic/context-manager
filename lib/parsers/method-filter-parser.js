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
            .map(pattern => ({
                pattern: pattern,
                regex: new RegExp(pattern.replace(/\*/g, '.*'), 'i')
            }));
    }

    shouldIncludeMethod(methodName, fileName) {
        let included = false;
        let matchedRule = null;
        let ruleSource = null;

        // Extract class/module name from fileName (remove extension)
        const className = fileName.replace(/\.[^/.]+$/, '');

        if (this.hasIncludeFile) {
            for (const pattern of this.includePatterns) {
                if (pattern.regex.test(methodName) || pattern.regex.test(`${className}.${methodName}`)) {
                    included = true;
                    matchedRule = pattern.pattern;
                    ruleSource = '.methodinclude';
                    break;
                }
            }
        } else {
            included = true; // Default to included
            for (const pattern of this.ignorePatterns) {
                if (pattern.regex.test(methodName) || pattern.regex.test(`${className}.${methodName}`)) {
                    included = false;
                    matchedRule = pattern.pattern;
                    ruleSource = '.methodignore';
                    break;
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
