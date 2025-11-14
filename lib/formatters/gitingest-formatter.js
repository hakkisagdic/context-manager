import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';
import MethodAnalyzer from '../analyzers/method-analyzer.js';
import MethodFilterParser from '../parsers/method-filter-parser.js';
import ConfigUtils from '../utils/config-utils.js';
import TokenUtils from '../utils/token-utils.js';
import FileUtils from '../utils/file-utils.js';

/**
 * GitIngest-style Digest Formatter
 * Formats analyzed code into a single prompt-friendly text file
 * Automatically applies method-level filtering if .methodinclude or .methodignore exists
 *
 * v2.3.0 Features:
 * - Smart chunking for large repositories
 * - Multiple chunking strategies (smart, size, file, directory, dependency)
 * - Cross-chunk reference preservation
 * - Chunk metadata and navigation
 */
class GitIngestFormatter {
    constructor(projectRoot, stats, analysisResults, options = {}) {
        this.projectRoot = projectRoot;
        this.stats = stats;
        this.analysisResults = analysisResults;
        this.options = options;

        // Chunking configuration (v2.3.3: Enhanced)
        this.chunking = {
            enabled: options.chunking?.enabled || false,
            strategy: options.chunking?.strategy || 'smart',
            maxTokensPerChunk: options.chunking?.maxTokensPerChunk || 100000,
            overlap: options.chunking?.overlap || 500,
            preserveContext: options.chunking?.preserveContext !== false,
            includeMetadata: options.chunking?.includeMetadata !== false, // v2.3.3
            crossReferences: options.chunking?.crossReferences !== false // v2.3.3
        };

        // New features configuration
        this.includeTimestamps = options.includeTimestamps || false;
        this.includeAuthorInfo = options.includeAuthorInfo || false;
        this.includeDiffInfo = options.includeDiffInfo || false;
        this.outputFormat = options.outputFormat || 'text'; // 'text' or 'json'
        this.compression = options.compression || false; // gzip compression

        // Auto-detect method filtering configuration
        this.methodFilterEnabled = this.detectMethodFilters();
        if (this.methodFilterEnabled) {
            this.methodAnalyzer = new MethodAnalyzer();
            this.methodFilter = this.initMethodFilter();
        }

        // Cache for git information
        this.gitInfoCache = {
            authors: new Map(),
            timestamps: new Map(),
            diffs: new Map()
        };
    }

    detectMethodFilters() {
        return ConfigUtils.detectMethodFilters(this.projectRoot);
    }

    initMethodFilter() {
        return ConfigUtils.initMethodFilter(this.projectRoot);
    }

    /**
     * Get file timestamp (modification time or git commit time)
     */
    getFileTimestamp(filePath) {
        if (this.gitInfoCache.timestamps.has(filePath)) {
            return this.gitInfoCache.timestamps.get(filePath);
        }

        let timestamp;
        try {
            // Try git log first
            const relPath = path.relative(this.projectRoot, filePath);
            const gitTime = execSync(
                `git log -1 --format=%ai -- "${relPath}"`,
                { cwd: this.projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();

            if (gitTime) {
                timestamp = new Date(gitTime);
            } else {
                // Fall back to file modification time
                const stats = fs.statSync(filePath);
                timestamp = stats.mtime;
            }
        } catch (error) {
            // If git fails, use file mtime
            try {
                const stats = fs.statSync(filePath);
                timestamp = stats.mtime;
            } catch {
                timestamp = new Date();
            }
        }

        this.gitInfoCache.timestamps.set(filePath, timestamp);
        return timestamp;
    }

    /**
     * Get file author information from git blame
     */
    getFileAuthorInfo(filePath) {
        if (this.gitInfoCache.authors.has(filePath)) {
            return this.gitInfoCache.authors.get(filePath);
        }

        let authorInfo = { primary: 'Unknown', contributors: [] };
        try {
            const relPath = path.relative(this.projectRoot, filePath);
            const blameOutput = execSync(
                `git log --format='%an' -- "${relPath}"`,
                { cwd: this.projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();

            if (blameOutput) {
                const authors = blameOutput.split('\n').filter(a => a.trim());
                const authorCounts = {};
                authors.forEach(author => {
                    authorCounts[author] = (authorCounts[author] || 0) + 1;
                });

                // Get primary author (most commits)
                const sortedAuthors = Object.entries(authorCounts)
                    .sort((a, b) => b[1] - a[1]);

                authorInfo.primary = sortedAuthors[0][0];
                authorInfo.contributors = sortedAuthors.slice(0, 5).map(([name, count]) => ({
                    name,
                    commits: count
                }));
            }
        } catch (error) {
            // Git not available or file not tracked
        }

        this.gitInfoCache.authors.set(filePath, authorInfo);
        return authorInfo;
    }

    /**
     * Get diff information for a file
     */
    getFileDiffInfo(filePath) {
        if (this.gitInfoCache.diffs.has(filePath)) {
            return this.gitInfoCache.diffs.get(filePath);
        }

        let diffInfo = { hasChanges: false, additions: 0, deletions: 0 };
        try {
            const relPath = path.relative(this.projectRoot, filePath);
            const diffOutput = execSync(
                `git diff --numstat HEAD -- "${relPath}"`,
                { cwd: this.projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
            ).trim();

            if (diffOutput) {
                const [additions, deletions] = diffOutput.split('\t').map(n => parseInt(n, 10));
                diffInfo = {
                    hasChanges: true,
                    additions: additions || 0,
                    deletions: deletions || 0
                };
            }
        } catch (error) {
            // Git not available or no changes
        }

        this.gitInfoCache.diffs.set(filePath, diffInfo);
        return diffInfo;
    }

    generateDigest() {
        // Check output format
        if (this.outputFormat === 'json') {
            return this.generateJSONDigest();
        }

        // Check if chunking is enabled
        if (this.chunking.enabled) {
            return this.generateChunkedDigest();
        }

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

    /**
     * Generate digest in JSON format
     */
    generateJSONDigest() {
        const jsonData = {
            project: {
                root: path.basename(this.projectRoot),
                totalFiles: this.stats.totalFiles,
                totalTokens: this.stats.totalTokens,
                totalLines: this.stats.totalLines || 0,
                generatedAt: new Date().toISOString()
            },
            files: this.analysisResults.map(fileInfo => {
                const fileData = {
                    path: fileInfo.relativePath,
                    tokens: fileInfo.tokens,
                    lines: fileInfo.lines || 0,
                    extension: fileInfo.extension || path.extname(fileInfo.relativePath)
                };

                // Add timestamp if enabled
                if (this.includeTimestamps) {
                    const timestamp = this.getFileTimestamp(fileInfo.path);
                    fileData.lastModified = timestamp.toISOString();
                }

                // Add author info if enabled
                if (this.includeAuthorInfo) {
                    const authorInfo = this.getFileAuthorInfo(fileInfo.path);
                    fileData.author = authorInfo;
                }

                // Add diff info if enabled
                if (this.includeDiffInfo) {
                    const diffInfo = this.getFileDiffInfo(fileInfo.path);
                    fileData.diff = diffInfo;
                }

                // Add file content
                try {
                    const content = fs.readFileSync(fileInfo.path, 'utf8');
                    fileData.content = content;
                } catch (error) {
                    fileData.content = null;
                    fileData.error = error.message;
                }

                return fileData;
            })
        };

        return JSON.stringify(jsonData, null, 2);
    }

    /**
     * Generate chunked digest for large repositories
     * Returns array of chunk objects with metadata
     * v2.3.3: Enhanced with overlap and cross-references
     */
    generateChunkedDigest() {
        const chunks = this.createChunks();
        const chunkData = [];

        // Add overlap between chunks (v2.3.3)
        if (this.chunking.overlap > 0) {
            this.addChunkOverlap(chunks);
        }

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkId = `chunk-${i + 1}`;

            let digest = '';

            // Chunk header
            digest += this.generateChunkHeader(i + 1, chunks.length, chunk);
            digest += '\n';

            // Summary for this chunk
            digest += this.generateChunkSummary(chunk);
            digest += '\n';

            // Directory tree for files in this chunk
            digest += this.generateChunkTree(chunk);
            digest += '\n';

            // Chunk metadata (v2.3.3)
            if (this.chunking.includeMetadata) {
                digest += this.generateChunkMetadata(chunk, i, chunks);
                digest += '\n';
            }

            // File contents
            digest += this.generateChunkFileContents(chunk);

            // Navigation info
            digest += '\n';
            digest += this.generateNavigationInfo(i, chunks.length);

            chunkData.push({
                id: chunkId,
                index: i + 1,
                total: chunks.length,
                content: digest,
                files: chunk.files.map(f => f.relativePath),
                tokens: chunk.tokens,
                metadata: chunk.metadata || {},
                hasOverlap: chunk.hasOverlap || false, // v2.3.3
                overlapFiles: chunk.overlapFiles || [] // v2.3.3
            });
        }

        return chunkData;
    }

    /**
     * Add overlap between chunks
     * v2.3.3: Ensures context continuity
     */
    addChunkOverlap(chunks) {
        for (let i = 0; i < chunks.length - 1; i++) {
            const currentChunk = chunks[i];
            const nextChunk = chunks[i + 1];

            // Get last N tokens worth of files from current chunk
            const overlapFiles = this.getOverlapFiles(currentChunk, this.chunking.overlap);

            if (overlapFiles.length > 0) {
                // Prepend to next chunk
                nextChunk.files = [...overlapFiles, ...nextChunk.files];
                nextChunk.hasOverlap = true;
                nextChunk.overlapFiles = overlapFiles.map(f => f.relativePath);

                // Update token count
                const overlapTokens = overlapFiles.reduce((sum, f) => sum + f.tokens, 0);
                nextChunk.tokens += overlapTokens;
            }
        }
    }

    /**
     * Get files for overlap based on token count
     * v2.3.3
     */
    getOverlapFiles(chunk, targetOverlapTokens) {
        const files = [...chunk.files].reverse(); // Start from end
        const overlapFiles = [];
        let tokenCount = 0;

        for (const file of files) {
            if (tokenCount >= targetOverlapTokens) {
                break;
            }
            overlapFiles.unshift(file);
            tokenCount += file.tokens;
        }

        return overlapFiles;
    }

    /**
     * Generate chunk metadata
     * v2.3.3: Language distribution, file types, etc.
     */
    generateChunkMetadata(chunk, index, allChunks) {
        let metadata = '\n';
        metadata += 'CHUNK METADATA\n';
        metadata += '='.repeat(60) + '\n';

        // Language distribution
        const languages = {};
        for (const file of chunk.files) {
            const ext = path.extname(file.relativePath) || 'no-ext';
            languages[ext] = (languages[ext] || 0) + 1;
        }

        metadata += 'Languages:\n';
        for (const [ext, count] of Object.entries(languages).sort((a, b) => b[1] - a[1])) {
            metadata += `  ${ext}: ${count} files\n`;
        }

        // Directories covered
        const dirs = new Set(chunk.files.map(f => path.dirname(f.relativePath)));
        metadata += `\nDirectories: ${dirs.size}\n`;

        // Cross-references (v2.3.3)
        if (this.chunking.crossReferences && index > 0) {
            const prevChunk = allChunks[index - 1];
            const sharedDirs = this.getSharedDirectories(chunk, prevChunk);
            if (sharedDirs.length > 0) {
                metadata += `\nShared with previous chunk: ${sharedDirs.join(', ')}\n`;
            }
        }

        return metadata;
    }

    /**
     * Get shared directories between chunks
     * v2.3.3
     */
    getSharedDirectories(chunk1, chunk2) {
        const dirs1 = new Set(chunk1.files.map(f => path.dirname(f.relativePath)));
        const dirs2 = new Set(chunk2.files.map(f => path.dirname(f.relativePath)));

        return [...dirs1].filter(dir => dirs2.has(dir));
    }

    /**
     * Create chunks based on selected strategy
     */
    createChunks() {
        const strategy = this.chunking.strategy;

        switch (strategy) {
            case 'smart':
                return this.createSmartChunks();
            case 'size':
                return this.createSizeBasedChunks();
            case 'file':
                return this.createFileBasedChunks();
            case 'directory':
                return this.createDirectoryBasedChunks();
            case 'dependency':
                return this.createDependencyBasedChunks();
            default:
                return this.createSizeBasedChunks();
        }
    }

    /**
     * Smart chunking - AI-based semantic grouping
     * Groups related files together based on directory and imports
     */
    createSmartChunks() {
        const chunks = [];
        const maxTokens = this.chunking.maxTokensPerChunk;

        // Sort files by directory and then by token count
        const sortedFiles = [...this.analysisResults].sort((a, b) => {
            const dirA = path.dirname(a.relativePath);
            const dirB = path.dirname(b.relativePath);
            if (dirA !== dirB) {
                return dirA.localeCompare(dirB);
            }
            return b.tokens - a.tokens;
        });

        let currentChunk = { files: [], tokens: 0, directories: new Set() };

        for (const file of sortedFiles) {
            const fileDir = path.dirname(file.relativePath);
            const wouldExceedLimit = currentChunk.tokens + file.tokens > maxTokens;

            // Start new chunk if:
            // 1. Would exceed token limit
            // 2. Different directory and chunk already has content
            if (wouldExceedLimit ||
                (currentChunk.files.length > 0 &&
                 !currentChunk.directories.has(fileDir) &&
                 currentChunk.tokens > maxTokens * 0.7)) {

                if (currentChunk.files.length > 0) {
                    chunks.push(currentChunk);
                }
                currentChunk = { files: [], tokens: 0, directories: new Set() };
            }

            currentChunk.files.push(file);
            currentChunk.tokens += file.tokens;
            currentChunk.directories.add(fileDir);
        }

        // Add last chunk
        if (currentChunk.files.length > 0) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * Size-based chunking - Fixed token size chunks
     */
    createSizeBasedChunks() {
        const chunks = [];
        const maxTokens = this.chunking.maxTokensPerChunk;

        // Sort files by token count (largest first)
        const sortedFiles = [...this.analysisResults].sort((a, b) => b.tokens - a.tokens);

        let currentChunk = { files: [], tokens: 0 };

        for (const file of sortedFiles) {
            if (currentChunk.tokens + file.tokens > maxTokens && currentChunk.files.length > 0) {
                chunks.push(currentChunk);
                currentChunk = { files: [], tokens: 0 };
            }

            currentChunk.files.push(file);
            currentChunk.tokens += file.tokens;
        }

        if (currentChunk.files.length > 0) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    /**
     * File-based chunking - One file per chunk (with directory context)
     */
    createFileBasedChunks() {
        const chunks = [];

        for (const file of this.analysisResults) {
            chunks.push({
                files: [file],
                tokens: file.tokens,
                metadata: {
                    directory: path.dirname(file.relativePath)
                }
            });
        }

        return chunks;
    }

    /**
     * Directory-based chunking - One directory per chunk
     */
    createDirectoryBasedChunks() {
        const chunks = [];
        const filesByDirectory = new Map();

        // Group files by directory
        for (const file of this.analysisResults) {
            const dir = path.dirname(file.relativePath);
            if (!filesByDirectory.has(dir)) {
                filesByDirectory.set(dir, []);
            }
            filesByDirectory.get(dir).push(file);
        }

        // Create chunks from directories
        for (const [dir, files] of filesByDirectory) {
            const tokens = files.reduce((sum, f) => sum + f.tokens, 0);
            chunks.push({
                files,
                tokens,
                metadata: { directory: dir }
            });
        }

        return chunks;
    }

    /**
     * Dependency-based chunking - Group by import/dependency graph
     * Placeholder for future implementation with AST analysis
     */
    createDependencyBasedChunks() {
        // For now, fall back to smart chunking
        // In Phase 2, we'll implement proper dependency analysis
        return this.createSmartChunks();
    }

    /**
     * Generate chunk header
     */
    generateChunkHeader(index, total, chunk) {
        let header = '='.repeat(60) + '\n';
        header += `CHUNK ${index} of ${total}\n`;
        header += '='.repeat(60);
        return header;
    }

    /**
     * Generate summary for a chunk
     */
    generateChunkSummary(chunk) {
        let summary = `Files in this chunk: ${chunk.files.length}\n`;
        summary += `Estimated tokens: ${this.formatTokenCount(chunk.tokens)}`;

        if (chunk.metadata?.directory) {
            summary += `\nDirectory: ${chunk.metadata.directory}`;
        }

        return summary;
    }

    /**
     * Generate directory tree for chunk
     */
    generateChunkTree(chunk) {
        let tree = 'Directory structure:\n';

        // Build tree structure from chunk files
        const fileTree = this.buildFileTreeFromFiles(chunk.files);
        tree += this.formatTreeNode(fileTree, '', true);

        return tree;
    }

    /**
     * Build file tree from specific files
     */
    buildFileTreeFromFiles(files) {
        const root = {
            name: path.basename(this.projectRoot),
            type: 'directory',
            children: {}
        };

        const sortedFiles = [...files].sort((a, b) =>
            a.relativePath.localeCompare(b.relativePath)
        );

        for (const fileInfo of sortedFiles) {
            const parts = fileInfo.relativePath.split('/');
            let current = root.children;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLastPart = i === parts.length - 1;

                if (isLastPart) {
                    current[part] = {
                        name: part,
                        type: 'file',
                        fileInfo: fileInfo
                    };
                } else {
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

    /**
     * Generate file contents for chunk
     */
    generateChunkFileContents(chunk) {
        let content = '';

        // Sort files by token count (largest first)
        const sortedFiles = [...chunk.files].sort((a, b) => b.tokens - a.tokens);

        for (const fileInfo of sortedFiles) {
            if (fileInfo.error) continue;

            content += '\n';
            content += '='.repeat(48) + '\n';
            content += `FILE: ${fileInfo.relativePath}\n`;
            content += '='.repeat(48) + '\n';

            try {
                const fileContent = fs.readFileSync(fileInfo.path, 'utf8');

                if (this.methodFilterEnabled && this.isCodeFile(fileInfo.path)) {
                    const filteredContent = this.generateFilteredFileContent(fileContent, fileInfo.path);
                    content += filteredContent;
                } else {
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

    /**
     * Generate navigation info between chunks
     */
    generateNavigationInfo(currentIndex, totalChunks) {
        let nav = '\n';
        nav += '='.repeat(60) + '\n';
        nav += 'NAVIGATION\n';
        nav += '='.repeat(60) + '\n';

        if (currentIndex > 0) {
            nav += `Previous: chunk-${currentIndex}.txt\n`;
        }
        if (currentIndex < totalChunks - 1) {
            nav += `Next: chunk-${currentIndex + 2}.txt\n`;
        }

        nav += `\nTotal Chunks: ${totalChunks}\n`;
        nav += `Current Position: ${currentIndex + 1} / ${totalChunks}`;

        return nav;
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

            // Add metadata if enabled
            if (this.includeTimestamps) {
                const timestamp = this.getFileTimestamp(fileInfo.path);
                content += `Last Modified: ${timestamp.toISOString()}\n`;
            }

            if (this.includeAuthorInfo) {
                const authorInfo = this.getFileAuthorInfo(fileInfo.path);
                content += `Primary Author: ${authorInfo.primary}\n`;
                if (authorInfo.contributors.length > 0) {
                    content += `Contributors: ${authorInfo.contributors.map(c => `${c.name} (${c.commits})`).join(', ')}\n`;
                }
            }

            if (this.includeDiffInfo) {
                const diffInfo = this.getFileDiffInfo(fileInfo.path);
                if (diffInfo.hasChanges) {
                    content += `Changes: +${diffInfo.additions} -${diffInfo.deletions}\n`;
                }
            }

            if (this.includeTimestamps || this.includeAuthorInfo || this.includeDiffInfo) {
                content += '='.repeat(48) + '\n';
            }

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

        // Handle chunked digest (array of chunk objects)
        if (Array.isArray(digest)) {
            // If chunking is enabled, save each chunk to a separate file
            let totalBytes = 0;

            for (let i = 0; i < digest.length; i++) {
                const chunk = digest[i];
                const chunkPath = outputPath.replace(/(\.[^.]+)?$/, `-chunk-${i + 1}$1`);

                if (this.compression) {
                    const compressed = zlib.gzipSync(chunk.content);
                    fs.writeFileSync(chunkPath + '.gz', compressed);
                    totalBytes += compressed.length;
                } else {
                    fs.writeFileSync(chunkPath, chunk.content, 'utf8');
                    totalBytes += chunk.content.length;
                }
            }

            // Also create an index file
            const indexPath = outputPath.replace(/(\.[^.]+)?$/, '-index$1');
            const indexContent = digest.map((chunk, i) => {
                return `Chunk ${i + 1}/${digest.length}: ${chunk.files.length} files, ${chunk.tokens} tokens\n` +
                       `  Files: ${chunk.files.join(', ')}\n`;
            }).join('\n');

            fs.writeFileSync(indexPath, indexContent, 'utf8');
            totalBytes += indexContent.length;

            return totalBytes;
        }

        // Handle regular digest (string)
        if (this.compression) {
            const compressed = zlib.gzipSync(digest);
            fs.writeFileSync(outputPath + '.gz', compressed);
            return compressed.length;
        }

        fs.writeFileSync(outputPath, digest, 'utf8');
        return digest.length;
    }
}


export default GitIngestFormatter;
