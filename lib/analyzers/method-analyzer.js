/**
 * Method-Level Code Analyzer
 * Extracts methods from JavaScript/TypeScript/Rust/C#/Go/Java/Python/PHP/Ruby/Kotlin/Swift/C/C++/Scala files
 */

import path from 'path';
import GoMethodAnalyzer from './go-method-analyzer.js';

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
        } else if (ext === '.py') {
            return this.extractPythonMethods(content, filePath);
        } else if (ext === '.php') {
            return this.extractPHPMethods(content, filePath);
        } else if (ext === '.rb') {
            return this.extractRubyMethods(content, filePath);
        } else if (ext === '.kt' || ext === '.kts') {
            return this.extractKotlinMethods(content, filePath);
        } else if (ext === '.swift') {
            return this.extractSwiftMethods(content, filePath);
        } else if (ext === '.c' || ext === '.cpp' || ext === '.cc' || ext === '.h' || ext === '.hpp') {
            return this.extractCPlusPlusMethods(content, filePath);
        } else if (ext === '.scala') {
            return this.extractScalaMethods(content, filePath);
        } else if (ext === '.sql') {
            // Auto-detect SQL dialect
            const dialect = this.detectSQLDialect(content);

            switch (dialect) {
                case 'tsql':
                    return this.extractSQLServerMethods(content, filePath);
                case 'pgsql':
                    return this.extractPostgreSQLMethods(content, filePath);
                case 'mysql':
                    return this.extractMySQLMethods(content, filePath);
                case 'oracle':
                    return this.extractOracleMethods(content, filePath);
                case 'sqlite':
                    return this.extractSQLiteMethods(content, filePath);
                case 'snowflake':
                    return this.extractSnowflakeMethods(content, filePath);
                case 'db2':
                    return this.extractDB2Methods(content, filePath);
                case 'redshift':
                    return this.extractRedshiftMethods(content, filePath);
                case 'bigquery':
                    return this.extractBigQueryMethods(content, filePath);
                default:
                    // Generic SQL - try T-SQL as default
                    return this.extractSQLServerMethods(content, filePath);
            }
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

    processPatterns(content, filePath, patterns, isJava = false, isCSharp = false, isPython = false, isRuby = false, isKotlin = false, isSwift = false, isScala = false) {
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

                // Use appropriate keyword check based on language
                let keywordCheck = false;
                if (isCSharp) {
                    keywordCheck = !this.isCSharpKeyword(methodName);
                } else if (isPython) {
                    keywordCheck = !this.isPythonKeyword(methodName);
                } else if (isRuby) {
                    keywordCheck = !this.isRubyKeyword(methodName);
                } else if (isKotlin) {
                    keywordCheck = !this.isKotlinKeyword(methodName);
                } else if (isSwift) {
                    keywordCheck = !this.isSwiftKeyword(methodName);
                } else if (isScala) {
                    keywordCheck = !this.isScalaKeyword(methodName);
                } else {
                    keywordCheck = !this.isKeyword(methodName, isJava);
                }

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

    extractPythonMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // def function_name or async def function_name
            { regex: new RegExp(`^\\s*(?:async\\s+)?def\\s+(${namePattern})\\s*\\(`, 'gm'), type: 'function' },
            // @staticmethod, @classmethod decorators
            { regex: new RegExp(`@(?:staticmethod|classmethod)\\s+def\\s+(${namePattern})\\s*\\(`, 'gm'), type: 'method' },
        ];

        return this.processPatterns(content, filePath, patterns, false, false, true);
    }

    extractPHPMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // function function_name
            { regex: new RegExp(`function\\s+(${namePattern})\\s*\\(`, 'g'), type: 'function' },
            // public/private/protected function method_name
            { regex: new RegExp(`(?:public|private|protected)?\\s*(?:static)?\\s*function\\s+(${namePattern})\\s*\\(`, 'g'), type: 'method' },
        ];

        return this.processPatterns(content, filePath, patterns);
    }

    extractRubyMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*[?!]?';

        const patterns = [
            // def method_name or def self.method_name
            { regex: new RegExp(`^\\s*def\\s+(?:self\\.)?(${namePattern})\\s*(?:\\(|$)`, 'gm'), type: 'method' },
        ];

        return this.processPatterns(content, filePath, patterns, false, false, false, true);
    }

    extractKotlinMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // fun functionName or fun ClassName.functionName
            { regex: new RegExp(`(?:public|private|protected|internal)?\\s*(?:suspend\\s+)?(?:inline\\s+)?fun\\s+(?:<[^>]+>\\s+)?(?:[\\w.]+\\.)?\\s*(${namePattern})\\s*(?:<[^>]+>)?\\s*\\(`, 'g'), type: 'function' },
        ];

        return this.processPatterns(content, filePath, patterns, false, false, false, false, true);
    }

    extractSwiftMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // func functionName
            { regex: new RegExp(`(?:public|private|internal|fileprivate)?\\s*(?:static|class)?\\s*func\\s+(${namePattern})\\s*(?:<[^>]+>)?\\s*\\(`, 'g'), type: 'function' },
            // init (constructors)
            { regex: new RegExp(`(?:public|private|internal|fileprivate)?\\s*(?:convenience\\s+)?init\\s*\\(`, 'g'), type: 'init' },
        ];

        return this.processPatterns(content, filePath, patterns, false, false, false, false, false, true);
    }

    extractCPlusPlusMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // Return type function_name( or ClassName::function_name(
            { regex: new RegExp(`(?:virtual\\s+)?(?:static\\s+)?(?:inline\\s+)?(?:[\\w:]+\\s+)?(?:[\\w:]+::)?(${namePattern})\\s*\\([^)]*\\)\\s*(?:const)?\\s*(?:override)?\\s*(?:final)?\\s*\\{`, 'g'), type: 'function' },
            // Constructor: ClassName::ClassName(
            { regex: new RegExp(`(${namePattern})\\s*\\([^)]*\\)\\s*:\\s*`, 'g'), type: 'constructor' },
        ];

        return this.processPatterns(content, filePath, patterns);
    }

    extractScalaMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';

        const patterns = [
            // def methodName
            { regex: new RegExp(`(?:override\\s+)?def\\s+(${namePattern})\\s*(?:\\[|\\(|:)`, 'g'), type: 'method' },
            // val/var with function assignment
            { regex: new RegExp(`(?:val|var)\\s+(${namePattern})\\s*=\\s*\\([^)]*\\)\\s*=>`, 'g'), type: 'function' },
        ];

        return this.processPatterns(content, filePath, patterns, false, false, false, false, false, false, true);
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

    isPythonKeyword(name) {
        const keywords = new Set([
            'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
            'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
            'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
            'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
            'try', 'while', 'with', 'yield', '__init__', '__main__'
        ]);
        return keywords.has(name);
    }

    isRubyKeyword(name) {
        const keywords = new Set([
            'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?',
            'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in',
            'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry',
            'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until',
            'when', 'while', 'yield', 'initialize'
        ]);
        return keywords.has(name);
    }

    isKotlinKeyword(name) {
        const keywords = new Set([
            'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for',
            'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package',
            'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof',
            'val', 'var', 'when', 'while', 'by', 'catch', 'constructor', 'delegate',
            'dynamic', 'field', 'file', 'finally', 'get', 'import', 'init', 'param',
            'property', 'receiver', 'set', 'setparam', 'where', 'actual', 'abstract',
            'annotation', 'companion', 'const', 'crossinline', 'data', 'enum',
            'expect', 'external', 'final', 'infix', 'inline', 'inner', 'internal',
            'lateinit', 'noinline', 'open', 'operator', 'out', 'override', 'private',
            'protected', 'public', 'reified', 'sealed', 'suspend', 'tailrec', 'vararg'
        ]);
        return keywords.has(name);
    }

    isSwiftKeyword(name) {
        const keywords = new Set([
            'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate',
            'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator',
            'private', 'precedencegroup', 'protocol', 'public', 'rethrows', 'static',
            'struct', 'subscript', 'typealias', 'var', 'break', 'case', 'catch',
            'continue', 'default', 'defer', 'do', 'else', 'fallthrough', 'for',
            'guard', 'if', 'in', 'repeat', 'return', 'throw', 'switch', 'where',
            'while', 'as', 'false', 'is', 'nil', 'self', 'Self', 'super', 'throws',
            'true', 'try', 'await', 'async'
        ]);
        return keywords.has(name);
    }

    isScalaKeyword(name) {
        const keywords = new Set([
            'abstract', 'case', 'catch', 'class', 'def', 'do', 'else', 'extends',
            'false', 'final', 'finally', 'for', 'forSome', 'if', 'implicit',
            'import', 'lazy', 'macro', 'match', 'new', 'null', 'object', 'override',
            'package', 'private', 'protected', 'return', 'sealed', 'super', 'this',
            'throw', 'trait', 'try', 'true', 'type', 'val', 'var', 'while', 'with',
            'yield', 'apply', 'unapply'
        ]);
        return keywords.has(name);
    }

    /**
     * Detect SQL dialect from content
     * @param {string} content - SQL file content
     * @returns {string} - Detected dialect: 'tsql', 'pgsql', 'mysql', 'oracle', 'sqlite', 'snowflake', 'db2', 'redshift', 'bigquery', or 'generic'
     */
    detectSQLDialect(content) {
        // Snowflake indicators (check first due to unique syntax)
        if (/LANGUAGE\s+(JAVASCRIPT|PYTHON|JAVA|SCALA)/gi.test(content)) {
            return 'snowflake';
        }
        if (/CREATE\s+(STAGE|PIPE|STREAM|TASK)/gi.test(content)) {
            return 'snowflake';
        }
        if (/RUNTIME_VERSION|PACKAGES\s*=/gi.test(content)) {
            return 'snowflake';
        }

        // MySQL indicators (check early to avoid conflicts)
        if (/DELIMITER\s+\$\$/gi.test(content)) {
            return 'mysql';
        }
        if (/CREATE\s+DEFINER\s*=/gi.test(content)) {
            return 'mysql';
        }
        if (/CREATE\s+EVENT/gi.test(content)) {
            return 'mysql';
        }

        // Oracle indicators (before PostgreSQL due to similar syntax)
        if (/CREATE\s+OR\s+REPLACE\s+PACKAGE/gi.test(content)) {
            return 'oracle';
        }
        if (/CREATE\s+OR\s+REPLACE\s+(PROCEDURE|FUNCTION).*\bIS\b/gi.test(content)) {
            return 'oracle';
        }
        if (/CREATE\s+OR\s+REPLACE\s+TYPE\s+BODY/gi.test(content)) {
            return 'oracle';
        }

        // DB2 indicators (check for DB2-specific syntax)
        if (/MODE\s+DB2SQL/gi.test(content)) {
            return 'db2';
        }
        if (/DYNAMIC\s+RESULT\s+SETS/gi.test(content)) {
            return 'db2';
        }
        if (/REFERENCING\s+NEW\s+AS\s+\w+\s+OLD\s+AS/gi.test(content)) {
            return 'db2';
        }

        // Redshift indicators (PostgreSQL-based but check before generic PostgreSQL)
        if (/LANGUAGE\s+plpythonu/gi.test(content)) {
            return 'redshift';
        }
        if (/DISTKEY|SORTKEY|DISTSTYLE/gi.test(content)) {
            return 'redshift';
        }
        if (/WITH\s+NO\s+SCHEMA\s+BINDING/gi.test(content)) {
            return 'redshift';
        }

        // T-SQL indicators
        if (/CREATE\s+OR\s+ALTER\s+(PROC|PROCEDURE|FUNCTION|TRIGGER|VIEW)/gi.test(content)) {
            return 'tsql';
        }
        if ((/\bGO\b/gm.test(content) && /CREATE\s+(PROC|PROCEDURE)/gi.test(content))) {
            return 'tsql';
        }

        // PostgreSQL indicators
        if (/LANGUAGE\s+plpgsql/gi.test(content)) {
            return 'pgsql';
        }
        if (/CREATE\s+OR\s+REPLACE\s+FUNCTION.*\$\$/gi.test(content)) {
            return 'pgsql';
        }
        if (/CREATE\s+(?:MATERIALIZED\s+)?VIEW.*EXECUTE\s+(?:PROCEDURE|FUNCTION)/gi.test(content)) {
            return 'pgsql';
        }

        // SQLite indicators (simple SQL, no procedures)
        if (/PRAGMA/gi.test(content)) {
            return 'sqlite';
        }
        if (/AUTOINCREMENT/gi.test(content)) {
            return 'sqlite';
        }
        if (/CREATE\s+TEMP\s+TRIGGER/gi.test(content)) {
            return 'sqlite';
        }
        if (/RAISE\s*\(\s*ABORT/gi.test(content)) {
            return 'sqlite';
        }

        // BigQuery indicators (check last, very specific patterns)
        if (/`[^`]+\.[^`]+\.[^`]+`/g.test(content)) {
            // project.dataset.table pattern
            return 'bigquery';
        }
        if (/CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP\s+)?TABLE\s+FUNCTION/gi.test(content)) {
            // TABLE FUNCTION is BigQuery-specific
            return 'bigquery';
        }
        if (/LANGUAGE\s+js/gi.test(content) && /"""/g.test(content)) {
            // JavaScript UDFs with triple quotes
            return 'bigquery';
        }
        if (/\bINT64\b|\bSTRUCT<|\bARRAY<.*>/gi.test(content)) {
            // BigQuery-specific types
            return 'bigquery';
        }

        return 'generic';
    }

    extractSQLServerMethods(content, filePath) {
        // T-SQL object name pattern (supports schema.name format)
        const namePattern = '[a-zA-Z_#][a-zA-Z0-9_#]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;

        const patterns = [
            // CREATE/ALTER PROCEDURE (including temp procedures #, ##)
            {
                regex: new RegExp(
                    `(?:CREATE|ALTER)\\s+(?:OR\\s+ALTER\\s+)?PROC(?:EDURE)?\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'procedure'
            },
            // CREATE/ALTER FUNCTION (Scalar, Table-Valued, Inline)
            {
                regex: new RegExp(
                    `(?:CREATE|ALTER)\\s+(?:OR\\s+ALTER\\s+)?FUNCTION\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'function'
            },
            // CREATE/ALTER TRIGGER
            {
                regex: new RegExp(
                    `(?:CREATE|ALTER)\\s+(?:OR\\s+ALTER\\s+)?TRIGGER\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'trigger'
            },
            // CREATE/ALTER VIEW
            {
                regex: new RegExp(
                    `(?:CREATE|ALTER)\\s+(?:OR\\s+ALTER\\s+)?VIEW\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'view'
            },
            // CREATE TYPE ... AS TABLE (Table Types)
            {
                regex: new RegExp(
                    `CREATE\\s+TYPE\\s+${schemaPattern}(${namePattern})\\s+AS\\s+TABLE`,
                    'gi'
                ),
                type: 'table_type'
            },
            // CREATE TYPE (User-Defined Types)
            {
                regex: new RegExp(
                    `CREATE\\s+TYPE\\s+${schemaPattern}(${namePattern})\\s+(?:FROM|AS)`,
                    'gi'
                ),
                type: 'type'
            },
            // CREATE SYNONYM
            {
                regex: new RegExp(
                    `CREATE\\s+SYNONYM\\s+${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'synonym'
            },
            // CREATE SEQUENCE
            {
                regex: new RegExp(
                    `CREATE\\s+SEQUENCE\\s+${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'sequence'
            },
            // CREATE INDEX (CLUSTERED/NONCLUSTERED)
            {
                regex: new RegExp(
                    `CREATE\\s+(?:UNIQUE\\s+)?(?:CLUSTERED|NONCLUSTERED)?\\s*INDEX\\s+` +
                    `(${namePattern})`,
                    'gi'
                ),
                type: 'index'
            }
        ];

        return this.extractSQLObjects(content, filePath, patterns, this.isSQLServerKeyword.bind(this));
    }

    extractPostgreSQLMethods(content, filePath) {
        // PostgreSQL object name pattern (supports schema.name format)
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;

        const patterns = [
            // CREATE OR REPLACE FUNCTION ... LANGUAGE plpgsql
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'function'
            },
            // CREATE OR REPLACE PROCEDURE
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'procedure'
            },
            // CREATE TRIGGER
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'trigger'
            },
            // CREATE VIEW
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:MATERIALIZED\\s+)?VIEW\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'view'
            },
            // CREATE TYPE (composite, enum)
            {
                regex: new RegExp(
                    `CREATE\\s+TYPE\\s+${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'type'
            },
            // CREATE DOMAIN
            {
                regex: new RegExp(
                    `CREATE\\s+DOMAIN\\s+${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'domain'
            },
            // CREATE RULE
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?RULE\\s+` +
                    `(${namePattern})`,
                    'gi'
                ),
                type: 'rule'
            },
            // CREATE OPERATOR
            {
                regex: new RegExp(
                    `CREATE\\s+OPERATOR\\s+${schemaPattern}([!@#$%^&*+=<>~]+)`,
                    'g'
                ),
                type: 'operator'
            }
        ];

        return this.extractSQLObjects(content, filePath, patterns, this.isPostgreSQLKeyword.bind(this));
    }

    extractMySQLMethods(content, filePath) {
        // MySQL object name pattern (supports database.name format)
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:\`?${namePattern}\`?\\.)?`;

        const patterns = [
            // CREATE PROCEDURE (with optional DEFINER)
            {
                regex: new RegExp(
                    `CREATE\\s+(?:DEFINER\\s*=\\s*[^\\s]+\\s+)?PROCEDURE\\s+` +
                    `${schemaPattern}\`?(${namePattern})\`?`,
                    'gi'
                ),
                type: 'procedure'
            },
            // CREATE FUNCTION
            {
                regex: new RegExp(
                    `CREATE\\s+(?:DEFINER\\s*=\\s*[^\\s]+\\s+)?FUNCTION\\s+` +
                    `${schemaPattern}\`?(${namePattern})\`?`,
                    'gi'
                ),
                type: 'function'
            },
            // CREATE TRIGGER
            {
                regex: new RegExp(
                    `CREATE\\s+(?:DEFINER\\s*=\\s*[^\\s]+\\s+)?TRIGGER\\s+` +
                    `${schemaPattern}\`?(${namePattern})\`?`,
                    'gi'
                ),
                type: 'trigger'
            },
            // CREATE VIEW
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:ALGORITHM\\s*=\\s*\\w+\\s+)?` +
                    `(?:DEFINER\\s*=\\s*[^\\s]+\\s+)?VIEW\\s+` +
                    `${schemaPattern}\`?(${namePattern})\`?`,
                    'gi'
                ),
                type: 'view'
            },
            // CREATE EVENT (MySQL Event Scheduler)
            {
                regex: new RegExp(
                    `CREATE\\s+(?:DEFINER\\s*=\\s*[^\\s]+\\s+)?EVENT\\s+` +
                    `${schemaPattern}\`?(${namePattern})\`?`,
                    'gi'
                ),
                type: 'event'
            }
        ];

        return this.extractSQLObjects(content, filePath, patterns, this.isMySQLKeyword.bind(this));
    }

    extractOracleMethods(content, filePath) {
        // Oracle object name pattern (supports schema.name format)
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;

        const patterns = [
            // CREATE OR REPLACE PROCEDURE ... IS
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'procedure'
            },
            // CREATE OR REPLACE FUNCTION
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'function'
            },
            // CREATE OR REPLACE TRIGGER
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'trigger'
            },
            // CREATE OR REPLACE VIEW
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:FORCE\\s+)?VIEW\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'view'
            },
            // CREATE OR REPLACE PACKAGE
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?PACKAGE\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'package'
            },
            // CREATE OR REPLACE PACKAGE BODY
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?PACKAGE\\s+BODY\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'package_body'
            },
            // CREATE OR REPLACE TYPE
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?TYPE\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'type'
            },
            // CREATE OR REPLACE TYPE BODY
            {
                regex: new RegExp(
                    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?TYPE\\s+BODY\\s+` +
                    `${schemaPattern}(${namePattern})`,
                    'gi'
                ),
                type: 'type_body'
            }
        ];

        return this.extractSQLObjects(content, filePath, patterns, this.isOracleKeyword.bind(this));
    }

    /**
     * Generic SQL object extractor (used by all SQL dialects)
     */
    extractSQLObjects(content, filePath, patterns, keywordChecker) {
        const methodsMap = new Map();
        const processedLines = new Map();

        patterns.forEach(({ regex, type }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                const line = this.getLineNumber(content, match.index);
                const objectName = match[1];

                if (objectName && !keywordChecker(objectName)) {
                    const key = `${type}_${objectName}:${line}`;
                    const lineKey = `${objectName}:${line}`;

                    if (processedLines.has(lineKey)) {
                        continue;
                    }

                    if (!methodsMap.has(key)) {
                        methodsMap.set(key, {
                            name: objectName,
                            line: line,
                            file: path.relative(process.cwd(), filePath),
                            type: type
                        });
                        processedLines.set(lineKey, true);
                    }
                }
            }
        });

        return Array.from(methodsMap.values());
    }

    isSQLServerKeyword(name) {
        const keywords = new Set([
            // T-SQL reserved keywords
            'ADD', 'ALL', 'ALTER', 'AND', 'ANY', 'AS', 'ASC', 'AUTHORIZATION',
            'BACKUP', 'BEGIN', 'BETWEEN', 'BREAK', 'BROWSE', 'BULK', 'BY',
            'CASCADE', 'CASE', 'CHECK', 'CHECKPOINT', 'CLOSE', 'CLUSTERED', 'COALESCE',
            'COLLATE', 'COLUMN', 'COMMIT', 'COMPUTE', 'CONSTRAINT', 'CONTAINS',
            'CONTAINSTABLE', 'CONTINUE', 'CONVERT', 'CREATE', 'CROSS', 'CURRENT',
            'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR',
            'DATABASE', 'DBCC', 'DEALLOCATE', 'DECLARE', 'DEFAULT', 'DELETE', 'DENY',
            'DESC', 'DISK', 'DISTINCT', 'DISTRIBUTED', 'DOUBLE', 'DROP', 'DUMP',
            'ELSE', 'END', 'ERRLVL', 'ESCAPE', 'EXCEPT', 'EXEC', 'EXECUTE', 'EXISTS',
            'EXIT', 'EXTERNAL', 'FETCH', 'FILE', 'FILLFACTOR', 'FOR', 'FOREIGN',
            'FREETEXT', 'FREETEXTTABLE', 'FROM', 'FULL', 'FUNCTION', 'GOTO', 'GRANT',
            'GROUP', 'HAVING', 'HOLDLOCK', 'IDENTITY', 'IDENTITY_INSERT', 'IDENTITYCOL',
            'IF', 'IN', 'INDEX', 'INNER', 'INSERT', 'INTERSECT', 'INTO', 'IS', 'JOIN',
            'KEY', 'KILL', 'LEFT', 'LIKE', 'LINENO', 'LOAD', 'MERGE', 'NATIONAL',
            'NOCHECK', 'NONCLUSTERED', 'NOT', 'NULL', 'NULLIF', 'OF', 'OFF', 'OFFSETS',
            'ON', 'OPEN', 'OPENDATASOURCE', 'OPENQUERY', 'OPENROWSET', 'OPENXML',
            'OPTION', 'OR', 'ORDER', 'OUTER', 'OVER', 'PERCENT', 'PIVOT', 'PLAN',
            'PRECISION', 'PRIMARY', 'PRINT', 'PROC', 'PROCEDURE', 'PUBLIC', 'RAISERROR',
            'READ', 'READTEXT', 'RECONFIGURE', 'REFERENCES', 'REPLICATION', 'RESTORE',
            'RESTRICT', 'RETURN', 'REVERT', 'REVOKE', 'RIGHT', 'ROLLBACK', 'ROWCOUNT',
            'ROWGUIDCOL', 'RULE', 'SAVE', 'SCHEMA', 'SECURITYAUDIT', 'SELECT', 'SEMANTICKEYPHRASETABLE',
            'SEMANTICSIMILARITYDETAILSTABLE', 'SEMANTICSIMILARITYTABLE', 'SESSION_USER',
            'SET', 'SETUSER', 'SHUTDOWN', 'SOME', 'STATISTICS', 'SYSTEM_USER', 'TABLE',
            'TABLESAMPLE', 'TEXTSIZE', 'THEN', 'TO', 'TOP', 'TRAN', 'TRANSACTION',
            'TRIGGER', 'TRUNCATE', 'TRY_CONVERT', 'TSEQUAL', 'UNION', 'UNIQUE', 'UNPIVOT',
            'UPDATE', 'UPDATETEXT', 'USE', 'USER', 'VALUES', 'VARYING', 'VIEW',
            'WAITFOR', 'WHEN', 'WHERE', 'WHILE', 'WITH', 'WITHIN', 'WRITETEXT'
        ]);
        return keywords.has(name.toUpperCase());
    }

    isPostgreSQLKeyword(name) {
        const keywords = new Set([
            // PostgreSQL reserved keywords
            'ALL', 'ANALYSE', 'ANALYZE', 'AND', 'ANY', 'ARRAY', 'AS', 'ASC', 'ASYMMETRIC',
            'AUTHORIZATION', 'BINARY', 'BOTH', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLLATION',
            'COLUMN', 'CONCURRENTLY', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT_CATALOG',
            'CURRENT_DATE', 'CURRENT_ROLE', 'CURRENT_SCHEMA', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
            'CURRENT_USER', 'DEFAULT', 'DEFERRABLE', 'DESC', 'DISTINCT', 'DO', 'ELSE', 'END',
            'EXCEPT', 'FALSE', 'FETCH', 'FOR', 'FOREIGN', 'FREEZE', 'FROM', 'FULL', 'GRANT',
            'GROUP', 'HAVING', 'ILIKE', 'IN', 'INITIALLY', 'INNER', 'INTERSECT', 'INTO', 'IS',
            'ISNULL', 'JOIN', 'LATERAL', 'LEADING', 'LEFT', 'LIKE', 'LIMIT', 'LOCALTIME',
            'LOCALTIMESTAMP', 'NATURAL', 'NOT', 'NOTNULL', 'NULL', 'OFFSET', 'ON', 'ONLY', 'OR',
            'ORDER', 'OUTER', 'OVERLAPS', 'PLACING', 'PRIMARY', 'REFERENCES', 'RETURNING', 'RIGHT',
            'SELECT', 'SESSION_USER', 'SIMILAR', 'SOME', 'SYMMETRIC', 'TABLE', 'TABLESAMPLE',
            'THEN', 'TO', 'TRAILING', 'TRUE', 'UNION', 'UNIQUE', 'USER', 'USING', 'VARIADIC',
            'VERBOSE', 'WHEN', 'WHERE', 'WINDOW', 'WITH'
        ]);
        return keywords.has(name.toUpperCase());
    }

    isMySQLKeyword(name) {
        const keywords = new Set([
            // MySQL reserved keywords
            'ACCESSIBLE', 'ADD', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC', 'ASENSITIVE',
            'BEFORE', 'BETWEEN', 'BIGINT', 'BINARY', 'BLOB', 'BOTH', 'BY', 'CALL', 'CASCADE',
            'CASE', 'CHANGE', 'CHAR', 'CHARACTER', 'CHECK', 'COLLATE', 'COLUMN', 'CONDITION',
            'CONSTRAINT', 'CONTINUE', 'CONVERT', 'CREATE', 'CROSS', 'CURRENT_DATE', 'CURRENT_TIME',
            'CURRENT_TIMESTAMP', 'CURRENT_USER', 'CURSOR', 'DATABASE', 'DATABASES', 'DAY_HOUR',
            'DAY_MICROSECOND', 'DAY_MINUTE', 'DAY_SECOND', 'DEC', 'DECIMAL', 'DECLARE', 'DEFAULT',
            'DELAYED', 'DELETE', 'DESC', 'DESCRIBE', 'DETERMINISTIC', 'DISTINCT', 'DISTINCTROW',
            'DIV', 'DOUBLE', 'DROP', 'DUAL', 'EACH', 'ELSE', 'ELSEIF', 'ENCLOSED', 'ESCAPED',
            'EXISTS', 'EXIT', 'EXPLAIN', 'FALSE', 'FETCH', 'FLOAT', 'FLOAT4', 'FLOAT8', 'FOR',
            'FORCE', 'FOREIGN', 'FROM', 'FULLTEXT', 'GENERATED', 'GET', 'GRANT', 'GROUP', 'HAVING',
            'HIGH_PRIORITY', 'HOUR_MICROSECOND', 'HOUR_MINUTE', 'HOUR_SECOND', 'IF', 'IGNORE',
            'IN', 'INDEX', 'INFILE', 'INNER', 'INOUT', 'INSENSITIVE', 'INSERT', 'INT', 'INT1',
            'INT2', 'INT3', 'INT4', 'INT8', 'INTEGER', 'INTERVAL', 'INTO', 'IO_AFTER_GTIDS',
            'IO_BEFORE_GTIDS', 'IS', 'ITERATE', 'JOIN', 'KEY', 'KEYS', 'KILL', 'LEADING', 'LEAVE',
            'LEFT', 'LIKE', 'LIMIT', 'LINEAR', 'LINES', 'LOAD', 'LOCALTIME', 'LOCALTIMESTAMP',
            'LOCK', 'LONG', 'LONGBLOB', 'LONGTEXT', 'LOOP', 'LOW_PRIORITY', 'MASTER_BIND',
            'MASTER_SSL_VERIFY_SERVER_CERT', 'MATCH', 'MAXVALUE', 'MEDIUMBLOB', 'MEDIUMINT',
            'MEDIUMTEXT', 'MIDDLEINT', 'MINUTE_MICROSECOND', 'MINUTE_SECOND', 'MOD', 'MODIFIES',
            'NATURAL', 'NOT', 'NO_WRITE_TO_BINLOG', 'NULL', 'NUMERIC', 'ON', 'OPTIMIZE', 'OPTIMIZER_COSTS',
            'OPTION', 'OPTIONALLY', 'OR', 'ORDER', 'OUT', 'OUTER', 'OUTFILE', 'PARTITION', 'PRECISION',
            'PRIMARY', 'PROCEDURE', 'PURGE', 'RANGE', 'READ', 'READS', 'READ_WRITE', 'REAL',
            'REFERENCES', 'REGEXP', 'RELEASE', 'RENAME', 'REPEAT', 'REPLACE', 'REQUIRE', 'RESIGNAL',
            'RESTRICT', 'RETURN', 'REVOKE', 'RIGHT', 'RLIKE', 'SCHEMA', 'SCHEMAS', 'SECOND_MICROSECOND',
            'SELECT', 'SENSITIVE', 'SEPARATOR', 'SET', 'SHOW', 'SIGNAL', 'SMALLINT', 'SPATIAL',
            'SPECIFIC', 'SQL', 'SQLEXCEPTION', 'SQLSTATE', 'SQLWARNING', 'SQL_BIG_RESULT',
            'SQL_CALC_FOUND_ROWS', 'SQL_SMALL_RESULT', 'SSL', 'STARTING', 'STORED', 'STRAIGHT_JOIN',
            'TABLE', 'TERMINATED', 'THEN', 'TINYBLOB', 'TINYINT', 'TINYTEXT', 'TO', 'TRAILING',
            'TRIGGER', 'TRUE', 'UNDO', 'UNION', 'UNIQUE', 'UNLOCK', 'UNSIGNED', 'UPDATE', 'USAGE',
            'USE', 'USING', 'UTC_DATE', 'UTC_TIME', 'UTC_TIMESTAMP', 'VALUES', 'VARBINARY', 'VARCHAR',
            'VARCHARACTER', 'VARYING', 'VIRTUAL', 'WHEN', 'WHERE', 'WHILE', 'WITH', 'WRITE', 'XOR',
            'YEAR_MONTH', 'ZEROFILL'
        ]);
        return keywords.has(name.toUpperCase());
    }

    isOracleKeyword(name) {
        const keywords = new Set([
            // Oracle reserved keywords
            'ACCESS', 'ADD', 'ALL', 'ALTER', 'AND', 'ANY', 'AS', 'ASC', 'AUDIT', 'BETWEEN', 'BY',
            'CHAR', 'CHECK', 'CLUSTER', 'COLUMN', 'COLUMN_VALUE', 'COMMENT', 'COMPRESS', 'CONNECT',
            'CREATE', 'CURRENT', 'DATE', 'DECIMAL', 'DEFAULT', 'DELETE', 'DESC', 'DISTINCT', 'DROP',
            'ELSE', 'EXCLUSIVE', 'EXISTS', 'FILE', 'FLOAT', 'FOR', 'FROM', 'GRANT', 'GROUP', 'HAVING',
            'IDENTIFIED', 'IMMEDIATE', 'IN', 'INCREMENT', 'INDEX', 'INITIAL', 'INSERT', 'INTEGER',
            'INTERSECT', 'INTO', 'IS', 'LEVEL', 'LIKE', 'LOCK', 'LONG', 'MAXEXTENTS', 'MINUS', 'MLSLABEL',
            'MODE', 'MODIFY', 'NESTED_TABLE_ID', 'NOAUDIT', 'NOCOMPRESS', 'NOT', 'NOWAIT', 'NULL',
            'NUMBER', 'OF', 'OFFLINE', 'ON', 'ONLINE', 'OPTION', 'OR', 'ORDER', 'PCTFREE', 'PRIOR',
            'PUBLIC', 'RAW', 'RENAME', 'RESOURCE', 'REVOKE', 'ROW', 'ROWID', 'ROWNUM', 'ROWS', 'SELECT',
            'SESSION', 'SET', 'SHARE', 'SIZE', 'SMALLINT', 'START', 'SUCCESSFUL', 'SYNONYM', 'SYSDATE',
            'TABLE', 'THEN', 'TO', 'TRIGGER', 'UID', 'UNION', 'UNIQUE', 'UPDATE', 'USER', 'VALIDATE',
            'VALUES', 'VARCHAR', 'VARCHAR2', 'VIEW', 'WHENEVER', 'WHERE', 'WITH'
        ]);
        return keywords.has(name.toUpperCase());
    }

    extractSQLiteMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const patterns = [
            { regex: new RegExp(`CREATE\\s+(?:TEMP\\s+)?TRIGGER\\s+(${namePattern})`, 'gi'), type: 'trigger' },
            { regex: new RegExp(`CREATE\\s+(?:TEMP\\s+)?VIEW\\s+(${namePattern})`, 'gi'), type: 'view' },
            { regex: new RegExp(`CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+(${namePattern})`, 'gi'), type: 'index' }
        ];
        return this.extractSQLObjects(content, filePath, patterns, () => false);
    }

    extractSnowflakeMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;
        const patterns = [
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'procedure' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'function' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:SECURE\\s+)?VIEW\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'view' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?STAGE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'stage' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?PIPE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'pipe' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?STREAM\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'stream' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?TASK\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'task' }
        ];
        return this.extractSQLObjects(content, filePath, patterns, this.isSnowflakeKeyword.bind(this));
    }

    extractDB2Methods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;
        const patterns = [
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'procedure' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'function' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'trigger' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?VIEW\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'view' },
            { regex: new RegExp(`CREATE\\s+TYPE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'type' }
        ];
        return this.extractSQLObjects(content, filePath, patterns, this.isDB2Keyword.bind(this));
    }

    extractRedshiftMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:${namePattern}\\.)?`;
        const patterns = [
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'procedure' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'function' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:MATERIALIZED\\s+)?VIEW\\s+${schemaPattern}(${namePattern})`, 'gi'), type: 'view' }
        ];
        return this.extractSQLObjects(content, filePath, patterns, this.isPostgreSQLKeyword.bind(this));
    }

    extractBigQueryMethods(content, filePath) {
        const namePattern = '[a-zA-Z_][a-zA-Z0-9_]*';
        const schemaPattern = `(?:\`?${namePattern}\`?\\.)?`;
        const patterns = [
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?PROCEDURE\\s+${schemaPattern}\`?(${namePattern})\`?`, 'gi'), type: 'procedure' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:TEMP\\s+)?(?:TABLE\\s+)?FUNCTION\\s+${schemaPattern}\`?(${namePattern})\`?`, 'gi'), type: 'function' },
            { regex: new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:TEMP\\s+)?VIEW\\s+${schemaPattern}\`?(${namePattern})\`?`, 'gi'), type: 'view' }
        ];
        return this.extractSQLObjects(content, filePath, patterns, this.isBigQueryKeyword.bind(this));
    }

    isSnowflakeKeyword(name) {
        return this.isSQLServerKeyword(name) || /^(STAGE|PIPE|STREAM|TASK|WAREHOUSE)$/i.test(name);
    }

    isDB2Keyword(name) {
        const keywords = new Set(['LANGUAGE', 'SQL', 'SPECIFIC', 'DYNAMIC', 'RESULT', 'SETS', 'DETERMINISTIC', 'MODIFIES']);
        return keywords.has(name.toUpperCase()) || this.isSQLServerKeyword(name);
    }

    isBigQueryKeyword(name) {
        const keywords = new Set(['OPTIONS', 'PARTITION', 'CLUSTER', 'TEMP', 'TEMPORARY']);
        return keywords.has(name.toUpperCase()) || this.isSQLServerKeyword(name);
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

export default MethodAnalyzer;
