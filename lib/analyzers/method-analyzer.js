/**
 * Method-Level Code Analyzer
 * Extracts methods from JavaScript/TypeScript files
 */

const path = require('path');

class MethodAnalyzer {
    extractMethods(content, filePath) {
        // Support \w, $, _ for method names
        const namePattern = '[\\w$_]+';

        const patterns = [
            // Order matters: More specific patterns first to avoid overlaps
            { regex: new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+(${namePattern})\\s*\\(`, 'g'), type: 'function' },
            { regex: new RegExp(`(${namePattern})\\s*:\\s*(?:async\\s+)?function\\s*\\(`, 'g'), type: 'method' },
            { regex: new RegExp(`(?:const|let|var)\\s+(${namePattern})\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>`, 'g'), type: 'arrow' },
            { regex: new RegExp(`(get|set)\\s+(${namePattern})\\s*\\(`, 'g'), type: 'accessor' },
            // Shorthand pattern (class methods) - must be last to avoid conflicts
            { regex: new RegExp(`(?:async\\s+)?(${namePattern})\\s*\\([^)]*\\)\\s*\\{`, 'g'), type: 'shorthand' },
        ];

        const methodsMap = new Map();
        const processedLines = new Map(); // Track processed lines to avoid duplicates

        patterns.forEach(({ regex, type }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const line = this.getLineNumber(content, match.index);

                let methodName;
                let accessorType = '';

                if (type === 'accessor') {
                    accessorType = match[1];
                    methodName = match[2];
                } else {
                    methodName = match[1];
                }

                if (methodName && !this.isKeyword(methodName)) {
                    const key = type === 'accessor'
                        ? `${accessorType}_${methodName}:${line}`
                        : `${methodName}:${line}`;

                    // Skip if this line was already processed for this method name
                    const lineKey = `${methodName}:${line}`;
                    if (processedLines.has(lineKey)) {
                        continue;
                    }

                    if (!methodsMap.has(key)) {
                        methodsMap.set(key, {
                            name: type === 'accessor' ? `${accessorType} ${methodName}` : methodName,
                            line: line,
                            file: path.relative(process.cwd(), filePath)
                        });
                        processedLines.set(lineKey, true);
                    }
                }
            }
        });

        return Array.from(methodsMap.values());
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    isKeyword(name) {
        const keywords = new Set([
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'class', 'extends', 'super', 'this', 'new', 'typeof', 'instanceof',
            'var', 'let', 'const', 'function', 'async', 'await', 'export', 'import'
        ]);
        return keywords.has(name);
    }

    extractMethodContent(content, methodName) {
        const patterns = [
            new RegExp(`(function\\s+${methodName}\\s*\\([^)]*\\)\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\})`, 'g'),
            new RegExp(`(${methodName}\\s*:\\s*function\\s*\\([^)]*\\)\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\})`, 'g')
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(content);
            if (match) return match[1];
        }
        return null;
    }
}

module.exports = MethodAnalyzer;
