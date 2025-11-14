/**
 * Go Method Analyzer
 * Extracts functions and methods from Go source files
 */

import path from 'path';

class GoMethodAnalyzer {
    extractMethods(content, filePath) {
        // First extract interface methods separately to avoid false positives
        const interfaceMethods = this.extractInterfaceMethods(content);

        const patterns = [
            // Regular function: func functionName(params) returnType { ... } (includes both exported and unexported)
            { regex: /func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, type: 'function' },

            // Method (receiver function): func (r *Receiver) MethodName(params) returnType { ... }
            { regex: /func\s+\([^)]+\)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, type: 'method' },
        ];

        const methodsMap = new Map();
        const processedLines = new Map();

        // Add interface methods first
        interfaceMethods.forEach(method => {
            const key = `${method.name}:${method.line}`;
            methodsMap.set(key, method);
            processedLines.set(key, true);
        });

        patterns.forEach(({ regex, type }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const line = this.getLineNumber(content, match.index);
                const methodName = match[1];

                if (methodName && !this.isKeyword(methodName)) {
                    const key = `${methodName}:${line}`;

                    // Skip if this line was already processed
                    if (processedLines.has(key)) {
                        continue;
                    }

                    // Validate it's not inside a comment
                    if (this.isInComment(content, match.index)) {
                        continue;
                    }

                    methodsMap.set(key, {
                        name: methodName,
                        line: line,
                        file: path.relative(process.cwd(), filePath),
                        type: type
                    });
                    processedLines.set(key, true);
                }
            }
        });

        return Array.from(methodsMap.values());
    }

    extractInterfaceMethods(content) {
        // Extract interface blocks and their methods
        const methods = [];
        const interfaceRegex = /type\s+\w+\s+interface\s*\{([^}]+)\}/g;

        let match;
        while ((match = interfaceRegex.exec(content)) !== null) {
            const interfaceBody = match[1];
            const interfaceStartIndex = match.index;

            // Extract method declarations from interface body
            // Pattern: MethodName(params) returnType or MethodName(params) (returnType1, returnType2)
            const methodRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
            let methodMatch;

            while ((methodMatch = methodRegex.exec(interfaceBody)) !== null) {
                const methodName = methodMatch[1];
                if (!this.isKeyword(methodName)) {
                    const absoluteIndex = interfaceStartIndex + match[0].indexOf(interfaceBody) + methodMatch.index;
                    methods.push({
                        name: methodName,
                        line: this.getLineNumber(content, absoluteIndex),
                        file: path.relative(process.cwd(), process.cwd() + '/temp.go'),
                        type: 'interface'
                    });
                }
            }
        }

        return methods;
    }

    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    isInComment(content, index) {
        // Check if position is inside a comment
        const beforeContent = content.substring(0, index);
        const lines = beforeContent.split('\n');
        const currentLine = lines[lines.length - 1];

        // Single-line comment check
        if (currentLine.includes('//')) {
            const commentPos = currentLine.indexOf('//');
            const matchPos = currentLine.length;
            if (commentPos < matchPos) {
                return true;
            }
        }

        // Multi-line comment check (simple heuristic)
        const beforeText = content.substring(0, index);
        const openComments = (beforeText.match(/\/\*/g) || []).length;
        const closeComments = (beforeText.match(/\*\//g) || []).length;

        return openComments > closeComments;
    }

    isKeyword(name) {
        // Go keywords and common types
        const keywords = new Set([
            'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
            'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if',
            'import', 'interface', 'map', 'package', 'range', 'return',
            'select', 'struct', 'switch', 'type', 'var',
            // Common types
            'bool', 'byte', 'complex64', 'complex128', 'error', 'float32',
            'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune',
            'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr'
        ]);
        return keywords.has(name);
    }

    extractMethodContent(content, methodName) {
        // Extract function/method body
        const patterns = [
            new RegExp(`(func\\s+${methodName}\\s*\\([^)]*\\)[^{]*\\{)`, 'g'),
            new RegExp(`(func\\s+\\([^)]+\\)\\s+${methodName}\\s*\\([^)]*\\)[^{]*\\{)`, 'g')
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(content);
            if (match) {
                // Find the matching closing brace
                let braceCount = 1;
                let pos = match.index + match[0].length;

                while (braceCount > 0 && pos < content.length) {
                    if (content[pos] === '{') braceCount++;
                    if (content[pos] === '}') braceCount--;
                    pos++;
                }

                return content.substring(match.index, pos);
            }
        }
        return null;
    }
}

export default GoMethodAnalyzer;
