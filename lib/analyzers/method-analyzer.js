/**
 * Method-Level Code Analyzer
 * Extracts methods from JavaScript/TypeScript/C#/Go/Java files
 */

const path = require('path');
const GoMethodAnalyzer = require('./go-method-analyzer');

class MethodAnalyzer {
    constructor() {
        this.goAnalyzer = new GoMethodAnalyzer();
    }

    extractMethods(content, filePath) {
        const ext = path.extname(filePath).toLowerCase();

        // Determine which analyzer to use based on file type
        if (ext === '.rs') {
            return this.extractRustMethods(content, filePath);
        } else if (ext === '.go') {
            return this.goAnalyzer.extractMethods(content, filePath);
        } else if (ext === '.java') {
            return this.extractJavaMethods(content, filePath);
        } else if (ext === '.cs') {
            return this.extractCSharpMethods(content, filePath);
        } else {
            return this.extractJavaScriptMethods(content, filePath);
        }
    }

    extractJavaScriptMethods(content, filePath) {
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

        return this.processPatterns(content, filePath, patterns);
    }

    extractJavaMethods(content, filePath) {
        const namePattern = '[\\w]+';

        const patterns = [
            // Public/private/protected methods with return type
            {
                regex: new RegExp(`(?:public|private|protected|static|final|synchronized|native|abstract|\\s)+(?:<[^>]+>\\s+)?(?:[\\w<>\\[\\],\\s]+)\\s+(${namePattern})\\s*\\(`, 'g'),
                type: 'method'
            },
            // Constructor (same name as class)
            {
                regex: new RegExp(`(?:public|private|protected)?\\s+(${namePattern})\\s*\\([^)]*\\)\\s*(?:throws\\s+[\\w,\\s]+)?\\s*\\{`, 'g'),
                type: 'constructor'
            },
        ];

        return this.processPatterns(content, filePath, patterns, true);
    }

    extractCSharpMethods(content, filePath) {
        const namePattern = '[\\w]+';

        const patterns = [
            // C# method patterns with modifiers and return types
            // Matches: public/private/protected/internal static/async returnType MethodName(params) {
            {
                regex: new RegExp(
                    `(?:public|private|protected|internal)?\\s*` +
                    `(?:static|virtual|override|abstract|async)?\\s*` +
                    `(?:partial)?\\s*` +
                    `(?:void|bool|int|string|double|float|long|decimal|object|var|Task|${namePattern}(?:<[^>]+>)?(?:\\[\\])?)?\\s+` +
                    `(${namePattern})\\s*` +
                    `(?:<[^>]+>)?\\s*` + // Generic type parameters
                    `\\([^)]*\\)\\s*` +
                    `(?:where\\s+[^{]+)?\\s*` + // Generic constraints
                    `\\{`,
                    'g'
                ),
                type: 'method'
            },
            // Property getters/setters
            {
                regex: new RegExp(
                    `(?:public|private|protected|internal)?\\s*` +
                    `(?:static|virtual|override|abstract)?\\s*` +
                    `(?:${namePattern}(?:<[^>]+>)?(?:\\[\\])?)?\\s+` +
                    `(${namePattern})\\s*` +
                    `\\{\\s*(?:get|set)`,
                    'g'
                ),
                type: 'property'
            },
            // Expression-bodied members (C# 6.0+)
            // Matches: public Type MethodName() => expression;
            {
                regex: new RegExp(
                    `(?:public|private|protected|internal)?\\s*` +
                    `(?:static|virtual|override|abstract)?\\s*` +
                    `(?:${namePattern}(?:<[^>]+>)?(?:\\[\\])?)?\\s+` +
                    `(${namePattern})\\s*` +
                    `(?:<[^>]+>)?\\s*` +
                    `\\([^)]*\\)\\s*=>`,
                    'g'
                ),
                type: 'expression-bodied'
            }
        ];

        return this.processPatterns(content, filePath, patterns, false, true);
    }

    processPatterns(content, filePath, patterns, isJava = false, isCSharp = false) {
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

                // Use appropriate keyword check
                const keywordCheck = isCSharp
                    ? !this.isCSharpKeyword(methodName)
                    : !this.isKeyword(methodName, isJava);

                if (methodName && keywordCheck) {
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

    extractRustMethods(content, filePath) {
        // Rust method name pattern (snake_case and alphanumeric)
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // pub fn function_name or fn function_name
            { regex: new RegExp(`(?:pub\\s+)?(?:async\\s+)?(?:const\\s+)?(?:unsafe\\s+)?fn\\s+(${namePattern})\\s*[<(]`, 'g'), type: 'function' },
            // impl methods: fn method_name (inside impl blocks)
            { regex: new RegExp(`^\\s*(?:pub\\s+)?(?:async\\s+)?(?:const\\s+)?(?:unsafe\\s+)?fn\\s+(${namePattern})\\s*[<(]`, 'gm'), type: 'method' },
        ];

        const methodsMap = new Map();
        const processedLines = new Map();

        patterns.forEach(({ regex, type }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const line = this.getLineNumber(content, match.index);
                const methodName = match[1];

                if (methodName && !this.isRustKeyword(methodName)) {
                    const key = `${methodName}:${line}`;
                    const lineKey = `${methodName}:${line}`;

                    if (processedLines.has(lineKey)) {
                        continue;
                    }

                    if (!methodsMap.has(key)) {
                        methodsMap.set(key, {
                            name: methodName,
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

    isKeyword(name, isJava = false) {
        const jsKeywords = new Set([
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'class', 'extends', 'super', 'this', 'new', 'typeof', 'instanceof',
            'var', 'let', 'const', 'function', 'async', 'await', 'export', 'import'
        ]);

        const javaKeywords = new Set([
            'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'class', 'extends', 'super', 'this', 'new', 'instanceof',
            'abstract', 'assert', 'boolean', 'byte', 'char', 'double', 'enum',
            'final', 'float', 'implements', 'import', 'int', 'interface', 'long',
            'native', 'package', 'private', 'protected', 'public', 'short', 'static',
            'strictfp', 'synchronized', 'throws', 'transient', 'void', 'volatile',
            // Common type names to skip
            'String', 'Integer', 'Boolean', 'Double', 'Float', 'Long', 'Short',
            'Byte', 'Character', 'List', 'Map', 'Set', 'ArrayList', 'HashMap',
            'HashSet', 'Object', 'Exception'
        ]);

        return isJava ? javaKeywords.has(name) : jsKeywords.has(name);
    }

    isCSharpKeyword(name) {
        const keywords = new Set([
            'if', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'return', 'break', 'continue',
            'class', 'interface', 'struct', 'enum', 'this', 'base', 'new', 'typeof',
            'var', 'using', 'namespace', 'async', 'await', 'lock', 'yield',
            'public', 'private', 'protected', 'internal', 'static', 'virtual',
            'override', 'abstract', 'sealed', 'partial', 'readonly', 'const'
        ]);
        return keywords.has(name);
    }

    isRustKeyword(name) {
        const keywords = new Set([
            'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
            'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
            'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
            'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where',
            'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do',
            'final', 'macro', 'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield'
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
