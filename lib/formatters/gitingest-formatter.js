const fs = require('fs');
const path = require('path');
const MethodAnalyzer = require('../analyzers/method-analyzer');
const MethodFilterParser = require('../parsers/method-filter-parser');
const ConfigUtils = require('../utils/config-utils');
const TokenUtils = require('../utils/token-utils');
const FileUtils = require('../utils/file-utils');

/**
 * GitIngest-style Digest Formatter
 * Formats analyzed code into a single prompt-friendly text file
 * Automatically applies method-level filtering if .methodinclude or .methodignore exists
 */
class GitIngestFormatter {
    constructor(projectRoot, stats, analysisResults) {
        this.projectRoot = projectRoot;
        this.stats = stats;
        this.analysisResults = analysisResults;

        // Auto-detect method filtering configuration
        this.methodFilterEnabled = this.detectMethodFilters();
        if (this.methodFilterEnabled) {
            this.methodAnalyzer = new MethodAnalyzer();
            this.methodFilter = this.initMethodFilter();
        }
    }

    detectMethodFilters() {
        return ConfigUtils.detectMethodFilters(this.projectRoot);
    }

    initMethodFilter() {
        return ConfigUtils.initMethodFilter(this.projectRoot);
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

        if (this.methodFilterEnabled) {
            const mode = this.methodFilter.hasIncludeFile ? 'INCLUDE' : 'EXCLUDE';
            summary += `Method filtering: ${mode} mode active\n`;
        }

        if (this.stats.totalTokens > 0) {
            const tokenStr = this.formatTokenCount(this.stats.totalTokens);
            summary += `\nEstimated tokens: ${tokenStr}`;
        }

        return summary;
    }

    formatTokenCount(tokens) {
        return TokenUtils.format(tokens);
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

                // Apply method-level filtering if enabled and file is a code file
                if (this.methodFilterEnabled && this.isCodeFile(fileInfo.path)) {
                    const filteredContent = this.generateFilteredFileContent(fileContent, fileInfo.path);
                    content += filteredContent;
                } else {
                    // Include full file content
                    content += fileContent;
                }

                if (!content.endsWith('\n')) {
                    content += '\n';
                }
            } catch (error) {
                content += `Error reading file: ${error.message}\n`;
            }
        }

        return content;
    }

    isCodeFile(filePath) {
        return FileUtils.isCode(filePath);
    }

    generateFilteredFileContent(content, filePath) {
        // Extract all methods from the file
        const methods = this.methodAnalyzer.extractMethods(content, filePath);
        const fileName = path.basename(filePath, path.extname(filePath));

        // Filter methods
        const filteredMethods = methods.filter(method =>
            this.methodFilter.shouldIncludeMethod(method.name, fileName)
        );

        if (filteredMethods.length === 0) {
            // No methods pass the filter, return a note
            return `// No methods matched the filter criteria for this file\n`;
        }

        // Build filtered content with only included methods
        let filteredContent = `// File contains ${methods.length} methods, showing ${filteredMethods.length} filtered methods\n\n`;

        const lines = content.split('\n');

        for (const method of filteredMethods) {
            // Extract method content using a simple approach
            // Find the method start and try to get its content
            const methodContent = this.extractMethodBlock(lines, method.line - 1);

            filteredContent += `// Method: ${method.name} (line ${method.line})\n`;
            filteredContent += methodContent + '\n\n';
        }

        return filteredContent;
    }

    extractMethodBlock(lines, startLine) {
        // Simple method extraction: get the method and its body
        let braceCount = 0;
        let inMethod = false;
        let methodLines = [];

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            methodLines.push(line);

            // Count braces to find method end
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    inMethod = true;
                } else if (char === '}') {
                    braceCount--;
                    if (inMethod && braceCount === 0) {
                        return methodLines.join('\n');
                    }
                }
            }

            // Safety: limit to 100 lines per method
            if (methodLines.length > 100) {
                methodLines.push('// ... (method too long, truncated)');
                break;
            }
        }

        return methodLines.join('\n');
    }

    saveToFile(outputPath) {
        const digest = this.generateDigest();
        fs.writeFileSync(outputPath, digest, 'utf8');
        return digest.length;
    }
}


module.exports = GitIngestFormatter;
