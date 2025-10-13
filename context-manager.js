#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Load tiktoken for exact token counting
let tiktoken = null;
try { tiktoken = require('tiktoken'); } catch {}

/**
 * GitIngest-style Digest Formatter
 * Formats analyzed code into a single prompt-friendly text file
 */
class GitIngestFormatter {
    constructor(projectRoot, stats, analysisResults) {
        this.projectRoot = projectRoot;
        this.stats = stats;
        this.analysisResults = analysisResults;
    }

    generateDigest() {
        let digest = '';

        // Header with project info
        digest += this.generateSummary();
        digest += '\n';

        // Directory tree structure
        digest += this.generateTree();
        digest += '\n';

        // File contents
        digest += this.generateFileContents();

        return digest;
    }

    generateSummary() {
        const projectName = path.basename(this.projectRoot);
        let summary = `Directory: ${projectName}\n`;
        summary += `Files analyzed: ${this.stats.totalFiles}\n`;

        if (this.stats.totalTokens > 0) {
            const tokenStr = this.formatTokenCount(this.stats.totalTokens);
            summary += `\nEstimated tokens: ${tokenStr}`;
        }

        return summary;
    }

    formatTokenCount(tokens) {
        if (tokens >= 1_000_000) {
            return `${(tokens / 1_000_000).toFixed(1)}M`;
        } else if (tokens >= 1_000) {
            return `${(tokens / 1_000).toFixed(1)}k`;
        }
        return tokens.toString();
    }

    generateTree() {
        let tree = 'Directory structure:\n';

        // Build tree structure from analysis results
        const fileTree = this.buildFileTree();
        tree += this.formatTreeNode(fileTree, '', true);

        return tree;
    }

    buildFileTree() {
        const root = {
            name: path.basename(this.projectRoot),
            type: 'directory',
            children: {}
        };

        // Sort files by path for consistent tree structure
        const sortedFiles = [...this.analysisResults].sort((a, b) =>
            a.relativePath.localeCompare(b.relativePath)
        );

        for (const fileInfo of sortedFiles) {
            const parts = fileInfo.relativePath.split('/');
            let current = root.children;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLastPart = i === parts.length - 1;

                if (isLastPart) {
                    // It's a file
                    current[part] = {
                        name: part,
                        type: 'file',
                        fileInfo: fileInfo
                    };
                } else {
                    // It's a directory
                    if (!current[part]) {
                        current[part] = {
                            name: part,
                            type: 'directory',
                            children: {}
                        };
                    }
                    current = current[part].children;
                }
            }
        }

        return root;
    }

    formatTreeNode(node, prefix = '', isLast = true) {
        let result = '';

        if (node.name) {
            const connector = isLast ? '└── ' : '├── ';
            const displayName = node.type === 'directory' ? `${node.name}/` : node.name;
            result += `${prefix}${connector}${displayName}\n`;
        }

        if (node.type === 'directory' && node.children) {
            const newPrefix = node.name ? (prefix + (isLast ? '    ' : '│   ')) : '';
            const childKeys = Object.keys(node.children).sort();

            childKeys.forEach((key, index) => {
                const child = node.children[key];
                const childIsLast = index === childKeys.length - 1;
                result += this.formatTreeNode(child, newPrefix, childIsLast);
            });
        }

        return result;
    }

    generateFileContents() {
        let content = '';

        // Sort files by token count (largest first)
        const sortedFiles = [...this.analysisResults].sort((a, b) =>
            b.tokens - a.tokens
        );

        for (const fileInfo of sortedFiles) {
            if (fileInfo.error) continue;

            content += '\n';
            content += '='.repeat(48) + '\n';
            content += `FILE: ${fileInfo.relativePath}\n`;
            content += '='.repeat(48) + '\n';

            try {
                const fileContent = fs.readFileSync(fileInfo.path, 'utf8');
                content += fileContent;
                if (!fileContent.endsWith('\n')) {
                    content += '\n';
                }
            } catch (error) {
                content += `Error reading file: ${error.message}\n`;
            }
        }

        return content;
    }

    saveToFile(outputPath) {
        const digest = this.generateDigest();
        fs.writeFileSync(outputPath, digest, 'utf8');
        return digest.length;
    }
}

/**
 * Method-Level Code Analyzer
 */
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
                const startPos = match.index;
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

class MethodFilterParser {
    constructor(methodIncludePath, methodIgnorePath) {
        this.includePatterns = [];
        this.ignorePatterns = [];
        this.hasIncludeFile = false;
        
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
        if (this.hasIncludeFile) {
            return this.includePatterns.some(p => 
                p.regex.test(methodName) || p.regex.test(`${fileName}.${methodName}`)
            );
        }
        
        return !this.ignorePatterns.some(p => 
            p.regex.test(methodName) || p.regex.test(`${fileName}.${methodName}`)
        );
    }
}

/**
 * Enhanced Token Calculator with Method-Level Analysis
 */

/**
 * GitIgnore-aware Token Calculator
 */
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

class TokenCalculator {
    constructor(projectRoot, options = {}) {
        this.projectRoot = projectRoot;
        this.options = { verbose: false, compactContext: true, methodLevel: false, ...options };
        this.stats = this.initStats();
        this.gitIgnore = this.initGitIgnore();
        this.methodAnalyzer = new MethodAnalyzer();
        this.methodFilter = this.options.methodLevel ? this.initMethodFilter() : null;
        this.methodStats = { totalMethods: 0, includedMethods: 0, methodTokens: {} };
    }

    initMethodFilter() {
        const paths = {
            methodInclude: this.findConfigFile('.methodinclude'),
            methodIgnore: this.findConfigFile('.methodignore')
        };
        
        return new MethodFilterParser(paths.methodInclude, paths.methodIgnore);
    }

    initStats() {
        return {
            totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0,
            ignoredFiles: 0, calculatorIgnoredFiles: 0,
            byExtension: {}, byDirectory: {}, largestFiles: []
        };
    }

    initGitIgnore() {
        const paths = {
            calculatorIgnore: this.findConfigFile('.calculatorignore'),
            calculatorInclude: this.findConfigFile('.calculatorinclude')
        };
        
        return new GitIgnoreParser(
            path.join(this.projectRoot, '.gitignore'),
            paths.calculatorIgnore,
            paths.calculatorInclude
        );
    }

    findConfigFile(filename) {
        const locations = [
            path.join(__dirname, filename),
            path.join(this.projectRoot, filename)
        ];
        return locations.find(loc => fs.existsSync(loc));
    }

    calculateTokens(content, filePath) {
        if (tiktoken) {
            try {
                const encoding = tiktoken.get_encoding('cl100k_base');
                const tokens = encoding.encode(content);
                encoding.free();
                return tokens.length;
            } catch {
                return this.estimateTokens(content, filePath);
            }
        }
        return this.estimateTokens(content, filePath);
    }

    estimateTokens(content, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const charsPerToken = {
            '.json': 2.5, '.js': 3.2, '.ts': 3.2, '.jsx': 3.2, '.tsx': 3.2,
            '.md': 4.0, '.txt': 4.0, '.yml': 3.5, '.yaml': 3.5,
            '.html': 2.8, '.xml': 2.8
        }[ext] || 3.5;
        
        const cleanText = content.replace(/\s+/g, ' ').trim();
        return Math.ceil(cleanText.length / charsPerToken);
    }

    isTextFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();
        
        const textExtensions = new Set([
            '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
            '.html', '.css', '.scss', '.sass', '.less', '.xml', '.svg',
            '.sh', '.bash', '.zsh', '.py', '.rb', '.php', '.java', '.c', '.cpp',
            '.go', '.rs', '.swift', '.kt', '.sql', '.toml', '.ini', '.conf'
        ]);
        
        const textFiles = ['dockerfile', 'makefile', 'license', 'readme', 'changelog'];
        
        return textExtensions.has(ext) || 
               textFiles.some(name => basename.includes(name));
    }

    analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const stats = fs.statSync(filePath);
            
            const fileInfo = {
                path: filePath,
                relativePath: path.relative(this.projectRoot, filePath),
                sizeBytes: stats.size,
                tokens: this.calculateTokens(content, filePath),
                lines: content.split('\n').length,
                extension: path.extname(filePath).toLowerCase() || 'no-extension'
            };

            // Method-level analysis if enabled
            if (this.options.methodLevel && this.isCodeFile(filePath)) {
                fileInfo.methods = this.analyzeFileMethods(content, filePath);
            }

            return fileInfo;
        } catch (error) {
            return {
                path: filePath,
                relativePath: path.relative(this.projectRoot, filePath),
                sizeBytes: 0, tokens: 0, lines: 0,
                extension: 'error', error: error.message
            };
        }
    }

    isCodeFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ['.js', '.ts', '.jsx', '.tsx'].includes(ext);
    }

    analyzeFileMethods(content, filePath) {
        const methods = this.methodAnalyzer.extractMethods(content, filePath);
        const fileName = path.basename(filePath, path.extname(filePath));
        const filteredMethods = [];

        this.methodStats.totalMethods += methods.length;

        for (const method of methods) {
            if (!this.methodFilter || this.methodFilter.shouldIncludeMethod(method.name, fileName)) {
                const methodContent = this.methodAnalyzer.extractMethodContent(content, method.name);
                const methodTokens = methodContent ? this.calculateTokens(methodContent, filePath) : 0;
                
                const methodInfo = {
                    ...method,
                    tokens: methodTokens,
                    content: methodContent
                };
                
                filteredMethods.push(methodInfo);
                this.methodStats.includedMethods++;
                this.methodStats.methodTokens[`${fileName}.${method.name}`] = methodTokens;
            }
        }

        return filteredMethods;
    }

    scanDirectory(dir) {
        const files = [];
        
        try {
            for (const item of fs.readdirSync(dir)) {
                const fullPath = path.join(dir, item);
                const relativePath = path.relative(this.projectRoot, fullPath);
                
                if (this.gitIgnore.isIgnored(fullPath, relativePath)) {
                    this.countIgnoredFiles(fullPath);
                    continue;
                }
                
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', '.svn', '.hg', 'coverage', 'dist', 'build'].includes(item)) {
                        files.push(...this.scanDirectory(fullPath));
                    }
                } else if (this.isTextFile(fullPath)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dir}:`, error.message);
        }
        
        return files;
    }

    countIgnoredFiles(filePath) {
        const isCalculatorIgnored = ['calculator', 'calculator-include'].includes(
            this.gitIgnore._lastIgnoreReason
        );
        
        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                const count = this.countFilesInDirectory(filePath);
                if (isCalculatorIgnored) {
                    this.stats.calculatorIgnoredFiles += count;
                } else {
                    this.stats.ignoredFiles += count;
                }
            } else {
                if (isCalculatorIgnored) {
                    this.stats.calculatorIgnoredFiles++;
                } else {
                    this.stats.ignoredFiles++;
                }
            }
        } catch {}
    }

    countFilesInDirectory(dirPath) {
        let count = 0;
        try {
            for (const item of fs.readdirSync(dirPath)) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    count += this.countFilesInDirectory(fullPath);
                } else if (this.isTextFile(fullPath)) {
                    count++;
                }
            }
        } catch {}
        return count;
    }

    updateStats(fileInfo) {
        if (fileInfo.error) return;
        
        const { extension, tokens, sizeBytes, lines } = fileInfo;
        
        this.stats.totalFiles++;
        this.stats.totalTokens += tokens;
        this.stats.totalBytes += sizeBytes;
        this.stats.totalLines += lines;
        this.stats.largestFiles.push(fileInfo);
        
        // Update extension stats
        this.stats.byExtension[extension] = this.stats.byExtension[extension] || 
            { count: 0, tokens: 0, bytes: 0, lines: 0 };
        const extStats = this.stats.byExtension[extension];
        extStats.count++; extStats.tokens += tokens; 
        extStats.bytes += sizeBytes; extStats.lines += lines;
        
        // Update directory stats
        const topDir = fileInfo.relativePath.split('/')[0];
        this.stats.byDirectory[topDir] = this.stats.byDirectory[topDir] || 
            { count: 0, tokens: 0, bytes: 0, lines: 0 };
        const dirStats = this.stats.byDirectory[topDir];
        dirStats.count++; dirStats.tokens += tokens;
        dirStats.bytes += sizeBytes; dirStats.lines += lines;
    }

    generateLLMContext(analysisResults) {
        const context = {
            project: {
                root: path.basename(this.projectRoot),
                totalFiles: this.stats.totalFiles,
                totalTokens: this.stats.totalTokens
            }
        };

        if (this.options.methodLevel) {
            context.methods = this.generateMethodContext(analysisResults);
            context.methodStats = {
                totalMethods: this.methodStats.totalMethods,
                includedMethods: this.methodStats.includedMethods,
                totalMethodTokens: Object.values(this.methodStats.methodTokens).reduce((sum, tokens) => sum + tokens, 0)
            };
        } else {
            context.paths = this.generateCompactPaths(analysisResults);
        }

        return context;
    }

    generateMethodContext(analysisResults) {
        const methodContext = {};
        
        for (const fileInfo of analysisResults) {
            if (fileInfo.methods && fileInfo.methods.length > 0) {
                methodContext[fileInfo.relativePath] = fileInfo.methods.map(method => ({
                    name: method.name,
                    line: method.line,
                    tokens: method.tokens
                }));
            }
        }
        
        return methodContext;
    }

    generateCompactPaths(analysisResults) {
        const sortedFiles = analysisResults.sort((a, b) => b.tokens - a.tokens);
        const pathGroups = {};

        sortedFiles.forEach(file => {
            const filePath = file.relativePath;
            const parts = filePath.split('/');

            // Group files by their directory path
            // If file is in root, use '/' as key, otherwise use directory path with trailing slash
            const categoryPath = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '/';

            if (!pathGroups[categoryPath]) {
                pathGroups[categoryPath] = [];
            }

            const filename = parts[parts.length - 1];
            pathGroups[categoryPath].push(filename);
        });

        return pathGroups;
    }

    exportContextToClipboard(context) {
        const contextString = JSON.stringify(context, null, 2);
        
        try {
            if (process.platform === 'darwin') {
                execSync('pbcopy', { input: contextString, encoding: 'utf8' });
            } else if (process.platform === 'linux') {
                try {
                    execSync('xclip -selection clipboard', { input: contextString, encoding: 'utf8' });
                } catch {
                    execSync('xsel --clipboard --input', { input: contextString, encoding: 'utf8' });
                }
            } else if (process.platform === 'win32') {
                execSync('clip', { input: contextString, encoding: 'utf8' });
            } else {
                throw new Error('Unsupported platform for clipboard');
            }
            
            console.log('✅ Context copied to clipboard!');
            console.log(`📋 ${contextString.length} characters copied`);
            
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error.message);
            console.log('💡 Context saved to llm-context.json instead');
            this.saveContextToFile(context);
        }
    }

    saveContextToFile(context) {
        const contextPath = path.join(this.projectRoot, 'llm-context.json');
        fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
        console.log(`💾 Context saved to: ${contextPath}`);
    }

    promptForExport(analysisResults) {
        console.log('\n📤 Export Options:');
        console.log('1) Save detailed JSON report (token-analysis-report.json)');
        console.log('2) Generate LLM context file (llm-context.json)');
        console.log('3) Copy LLM context to clipboard');
        console.log('4) Generate GitIngest digest (digest.txt)');
        console.log('5) No export (skip)');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('🤔 Which export option would you like? (1-5): ', (answer) => {
            const choice = parseInt(answer.trim());

            switch (choice) {
                case 1:
                    console.log('\n💾 Saving detailed JSON report...');
                    this.saveDetailedReport(analysisResults);
                    break;
                case 2:
                    console.log('\n🤖 Generating LLM context file...');
                    const context = this.generateLLMContext(analysisResults);
                    this.saveContextToFile(context);
                    console.log('💾 LLM context saved to: llm-context.json');
                    break;
                case 3:
                    console.log('\n🤖 Generating LLM context for clipboard...');
                    const clipboardContext = this.generateLLMContext(analysisResults);
                    this.exportContextToClipboard(clipboardContext);
                    break;
                case 4:
                    console.log('\n📄 Generating GitIngest digest...');
                    this.saveGitIngestDigest(analysisResults);
                    break;
                case 5:
                    console.log('\n✅ Analysis complete. No export selected.');
                    break;
                default:
                    console.log('\n❌ Invalid option. Skipping export.');
                    break;
            }

            rl.close();
        });
    }

    saveGitIngestDigest(analysisResults) {
        const formatter = new GitIngestFormatter(this.projectRoot, this.stats, analysisResults);
        const digestPath = path.join(this.projectRoot, 'digest.txt');
        const digestSize = formatter.saveToFile(digestPath);

        console.log(`💾 GitIngest digest saved to: digest.txt`);
        console.log(`📊 Digest size: ${(digestSize / 1024).toFixed(1)} KB`);
    }

    run() {
        this.printHeader();
        
        const allFiles = this.scanDirectory(this.projectRoot);
        this.printScanResults(allFiles);
        
        // Analyze all files
        const analysisResults = [];
        for (const file of allFiles) {
            const fileInfo = this.analyzeFile(file);
            this.updateStats(fileInfo);
            analysisResults.push(fileInfo);
        }
        
        this.stats.largestFiles.sort((a, b) => b.tokens - a.tokens);
        this.printReport();
        
        // Handle exports
        this.handleExports(analysisResults);
    }

    printHeader() {
        console.log('🔍 Analyzing project: ' + this.projectRoot);
        console.log('📝 Respecting .gitignore rules...');
        
        const configPath = this.gitIgnore.hasIncludeFile ? 
            this.findConfigFile('.calculatorinclude') :
            this.findConfigFile('.calculatorignore');
            
        if (configPath) {
            const mode = this.gitIgnore.hasIncludeFile ? 'INCLUDE' : 'EXCLUDE';
            console.log(`📅 Found calculator config - using ${mode} mode`);
            console.log('   Location: ' + path.relative(this.projectRoot, configPath));
        }
        
        console.log('🎯 Token calculation: ' + (tiktoken ? '✅ Exact (using tiktoken)' : '⚠️  Estimated'));
        
        if (this.options.methodLevel) {
            console.log('🔧 Method-level analysis: ✅ Enabled');
            if (this.methodFilter) {
                const hasInclude = this.methodFilter.hasIncludeFile;
                const mode = hasInclude ? 'INCLUDE' : 'EXCLUDE';
                console.log(`   Method filtering: ${mode} mode active`);
            }
        }
        
        console.log();
    }

    printScanResults(allFiles) {
        console.log(`📁 Found ${allFiles.length} text files to analyze`);
        console.log(`🚫 Ignored ${this.stats.ignoredFiles} files due to .gitignore rules`);
        if (this.stats.calculatorIgnoredFiles > 0) {
            const mode = this.gitIgnore.hasIncludeFile ? 'include rules' : 'ignore rules';
            console.log(`📋 Filtered ${this.stats.calculatorIgnoredFiles} additional files due to calculator ${mode}`);
        }
        
        if (this.options.methodLevel) {
            console.log(`🔧 Total methods found: ${this.methodStats.totalMethods}`);
            console.log(`✅ Methods included: ${this.methodStats.includedMethods}`);
        }
        
        console.log();
    }

    printReport() {
        console.log('='.repeat(80));
        console.log('🎯 PROJECT TOKEN ANALYSIS REPORT');
        console.log('='.repeat(80));
        console.log(`📊 Total files analyzed: ${this.stats.totalFiles.toLocaleString()}`);
        console.log(`🔢 Total tokens: ${this.stats.totalTokens.toLocaleString()}`);
        console.log(`💾 Total size: ${(this.stats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📄 Total lines: ${this.stats.totalLines.toLocaleString()}`);

        const avgTokens = this.stats.totalFiles > 0
            ? Math.round(this.stats.totalTokens / this.stats.totalFiles).toLocaleString()
            : 'N/A';
        console.log(`📈 Average tokens per file: ${avgTokens}`);
        console.log(`🚫 Files ignored by .gitignore: ${this.stats.ignoredFiles.toLocaleString()}`);
        if (this.stats.calculatorIgnoredFiles > 0) {
            console.log(`📋 Files ignored by calculator rules: ${this.stats.calculatorIgnoredFiles.toLocaleString()}`);
        }
        console.log();
        
        this.printExtensionStats();
        this.printTopFiles();
        this.printTopDirectories();
        
        console.log('\n💡 Tip: Use --save-report flag to save detailed analysis to JSON file');
    }

    printExtensionStats() {
        console.log('📋 BY FILE TYPE:');
        console.log('-'.repeat(80));
        console.log('Extension'.padEnd(15) + 'Files'.padStart(8) + 'Tokens'.padStart(12) + 'Size (KB)'.padStart(12) + 'Lines'.padStart(10));
        console.log('-'.repeat(80));
        
        Object.entries(this.stats.byExtension)
            .sort((a, b) => b[1].tokens - a[1].tokens)
            .forEach(([ext, data]) => {
                console.log(
                    ext.padEnd(15) + 
                    data.count.toString().padStart(8) + 
                    data.tokens.toLocaleString().padStart(12) + 
                    (data.bytes / 1024).toFixed(1).padStart(12) + 
                    data.lines.toLocaleString().padStart(10)
                );
            });
    }

    printTopFiles() {
        console.log('\n🏆 TOP 5 LARGEST FILES BY TOKEN COUNT:');
        console.log('-'.repeat(80));
        this.stats.largestFiles.slice(0, 5).forEach((file, index) => {
            const percentage = ((file.tokens / this.stats.totalTokens) * 100).toFixed(1);
            const sizeKB = (file.sizeBytes / 1024).toFixed(1);
            console.log(`${(index + 1).toString().padStart(2)}. ${file.tokens.toLocaleString().padStart(8)} tokens (${percentage}%) - ${file.relativePath}`);
            console.log(`    💾 ${sizeKB.padStart(8)} KB, 📄 ${file.lines.toLocaleString().padStart(6)} lines`);
        });
    }

    printTopDirectories() {
        const largestDirectories = Object.entries(this.stats.byDirectory)
            .map(([dir, stats]) => ({ directory: dir, ...stats }))
            .sort((a, b) => b.tokens - a.tokens);
            
        console.log('\n📁 TOP 5 LARGEST DIRECTORIES BY TOKEN COUNT:');
        console.log('-'.repeat(80));
        largestDirectories.slice(0, 5).forEach((dir, index) => {
            const percentage = ((dir.tokens / this.stats.totalTokens) * 100).toFixed(1);
            const avgTokensPerFile = Math.round(dir.tokens / dir.count);
            console.log(`${(index + 1).toString().padStart(2)}. ${dir.tokens.toLocaleString().padStart(8)} tokens (${percentage}%) - ${dir.directory}/`);
            console.log(`    📄 ${dir.count.toString().padStart(3)} files, 📈 ${avgTokensPerFile.toLocaleString().padStart(6)} avg tokens/file`);
        });
    }

    handleExports(analysisResults) {
        const { saveReport, contextExport, contextToClipboard, gitingest } = this.options;

        if (contextExport || contextToClipboard || saveReport || gitingest) {
            if (contextExport || contextToClipboard) {
                console.log('\n🤖 Generating LLM Context...');
                const context = this.generateLLMContext(analysisResults);

                if (contextToClipboard) {
                    this.exportContextToClipboard(context);
                } else {
                    this.saveContextToFile(context);
                    console.log('💾 LLM context saved to: llm-context.json');
                }
            }

            if (saveReport) {
                this.saveDetailedReport(analysisResults);
            }

            if (gitingest) {
                console.log('\n📄 Generating GitIngest digest...');
                this.saveGitIngestDigest(analysisResults);
            }
        } else {
            this.promptForExport(analysisResults);
        }
    }

    saveDetailedReport(analysisResults) {
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                projectRoot: this.projectRoot,
                gitignoreRules: this.gitIgnore.patterns.map(p => p.original),
                calculatorRules: this.gitIgnore.calculatorPatterns.map(p => p.original)
            },
            summary: this.stats,
            files: analysisResults.sort((a, b) => b.tokens - a.tokens)
        };
        
        const reportPath = path.join(this.projectRoot, 'token-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log('💾 Detailed analysis saved to: token-analysis-report.json');
    }
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        return;
    }
    
    const options = {
        saveReport: args.includes('--save-report') || args.includes('-s'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        contextExport: args.includes('--context-export'),
        contextToClipboard: args.includes('--context-clipboard'),
        methodLevel: args.includes('--method-level') || args.includes('-m'),
        gitingest: args.includes('--gitingest') || args.includes('-g')
    };
    
    printStartupInfo();
    
    const calculator = new TokenCalculator(process.cwd(), options);
    calculator.run();
}

function printStartupInfo() {
    console.log('🚀 Code Analyzer by Hakkı Sağdıç');
    console.log('='.repeat(50));
    console.log('📋 Available options:');
    console.log('  --save-report, -s     Save detailed JSON report');
    console.log('  --verbose, -v         Show included files and directories');
    console.log('  --context-export      Generate LLM context file list');
    console.log('  --context-clipboard   Copy context to clipboard');
    console.log('  --method-level, -m    Enable method-level analysis');
    console.log('  --gitingest, -g       Generate GitIngest-style digest');
    console.log('  --help, -h           Show this help message');

    if (!tiktoken) {
        console.log('\n💡 For exact token counts, install tiktoken: npm install tiktoken');
    }
    console.log();
}

function printHelp() {
    console.log('Context Manager - LLM context optimization with method-level filtering');
    console.log();
    console.log('Usage: context-manager [options]');
    console.log('       node context-manager.js [options]  # Direct usage');
    console.log();
    console.log('Options:');
    console.log('  -s, --save-report        Save detailed JSON report');
    console.log('  -v, --verbose            Show all included files');
    console.log('  --context-export         Generate LLM context file');
    console.log('  --context-clipboard      Copy context to clipboard');
    console.log('  -m, --method-level       Enable method-level analysis');
    console.log('  -g, --gitingest          Generate GitIngest-style digest');
    console.log('  -h, --help               Show this help');
    console.log();
    console.log('Method-level Configuration:');
    console.log('  .methodinclude           Include only specified methods');
    console.log('  .methodignore            Exclude specified methods');
    console.log();
    console.log('Examples:');
    console.log('  context-manager                      # Interactive export selection');
    console.log('  context-manager --save-report        # Save JSON report');
    console.log('  context-manager --context-clipboard  # Copy to clipboard');
    console.log('  context-manager --gitingest          # Generate digest.txt');
    console.log('  context-manager --method-level       # Method-level analysis');
    console.log('  context-manager -g -s -v             # GitIngest + report + verbose');
}

if (require.main === module) {
    main();
}

module.exports = { TokenCalculator, TokenAnalyzer: TokenCalculator, GitIgnoreParser, MethodAnalyzer, MethodFilterParser, GitIngestFormatter };