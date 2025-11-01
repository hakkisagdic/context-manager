const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const TokenUtils = require('../utils/token-utils');
const FileUtils = require('../utils/file-utils');
const ClipboardUtils = require('../utils/clipboard-utils');
const ConfigUtils = require('../utils/config-utils');
const GitIgnoreParser = require('../parsers/gitignore-parser');
const MethodAnalyzer = require('./method-analyzer');
const MethodFilterParser = require('../parsers/method-filter-parser');
const GitIngestFormatter = require('../formatters/gitingest-formatter');
const TokenBudgetFitter = require('../optimizers/token-budget-fitter');

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
        // Use temp filter paths from preset if provided
        const overridePaths = this.options.tempFilters ? {
            methodInclude: this.options.tempFilters.methodInclude,
            methodIgnore: this.options.tempFilters.methodExclude
        } : {};

        return ConfigUtils.initMethodFilter(this.projectRoot, overridePaths);
    }

    initStats() {
        return {
            totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0,
            ignoredFiles: 0, calculatorIgnoredFiles: 0,
            byExtension: {}, byDirectory: {}, largestFiles: []
        };
    }

    initGitIgnore() {
        // Use temp filter paths from preset if provided
        const overridePaths = this.options.tempFilters ? {
            calculatorIgnore: this.options.tempFilters.exclude,
            calculatorInclude: this.options.tempFilters.include
        } : {};

        return ConfigUtils.initGitIgnore(this.projectRoot, overridePaths);
    }

    calculateTokens(content, filePath) {
        return TokenUtils.calculate(content, filePath);
    }

    isTextFile(filePath) {
        return FileUtils.isText(filePath);
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
        return FileUtils.isCode(filePath);
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
        const success = ClipboardUtils.copy(contextString);

        if (!success) {
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
        let analysisResults = [];
        for (const file of allFiles) {
            const fileInfo = this.analyzeFile(file);
            this.updateStats(fileInfo);
            analysisResults.push(fileInfo);
        }

        this.stats.largestFiles.sort((a, b) => b.tokens - a.tokens);

        // Apply token budget fitting if specified
        if (this.options.targetTokens || this.options.maxTokens) {
            const targetTokens = this.options.targetTokens || this.options.maxTokens;
            analysisResults = this.applyTokenBudget(analysisResults, targetTokens);
        }

        this.printReport();

        // Handle exports
        this.handleExports(analysisResults);
    }

    applyTokenBudget(files, targetTokens) {
        const fitter = new TokenBudgetFitter(targetTokens, {
            strategy: this.options.fitStrategy || 'auto',
            verbose: this.options.verbose,
            preserveEntryPoints: this.options.preserveEntryPoints !== false
        });

        const result = fitter.fit(files);

        if (this.options.verbose || result.excluded > 0) {
            fitter.printSummary(result);
        }

        // Update stats to reflect fitted files
        if (result.excluded > 0) {
            this.stats.totalFiles = result.files.length;
            this.stats.totalTokens = result.totalTokens;
            this.stats.calculatorIgnoredFiles += result.excluded;
        }

        return result.files;
    }

    printHeader() {
        console.log('🔍 Analyzing project: ' + this.projectRoot);
        console.log('📝 Respecting .gitignore rules...');

        const configPath = this.gitIgnore.hasIncludeFile ?
            ConfigUtils.findConfigFile(this.projectRoot, '.calculatorinclude') :
            ConfigUtils.findConfigFile(this.projectRoot, '.calculatorignore');

        if (configPath) {
            const mode = this.gitIgnore.hasIncludeFile ? 'INCLUDE' : 'EXCLUDE';
            console.log(`📅 Found calculator config - using ${mode} mode`);
            console.log('   Location: ' + path.relative(this.projectRoot, configPath));
        }

        console.log('🎯 Token calculation: ' + (TokenUtils.hasExactCounting() ? '✅ Exact (using tiktoken)' : '⚠️  Estimated'));

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

/**
 * Generate GitIngest digest from token-analysis-report.json
 */
function generateDigestFromReport(reportPath) {
    console.log('📄 Loading token analysis report...');

    if (!fs.existsSync(reportPath)) {
        console.error(`❌ Error: Report file not found: ${reportPath}`);
        process.exit(1);
    }

    try {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

        if (!report.metadata || !report.summary || !report.files) {
            console.error('❌ Error: Invalid report format. Missing required fields.');
            process.exit(1);
        }

        const projectRoot = report.metadata.projectRoot || process.cwd();

        console.log(`✅ Report loaded: ${report.files.length} files`);
        console.log('📄 Generating GitIngest digest from report...\n');

        const formatter = new GitIngestFormatter(
            projectRoot,
            report.summary,
            report.files
        );

        const digestPath = path.join(process.cwd(), 'digest.txt');
        const digestSize = formatter.saveToFile(digestPath);

        console.log(`💾 GitIngest digest saved to: digest.txt`);
        console.log(`📊 Digest size: ${(digestSize / 1024).toFixed(1)} KB`);
        console.log(`✨ Generated from: ${path.basename(reportPath)}`);

    } catch (error) {
        console.error(`❌ Error processing report: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Generate GitIngest digest from llm-context.json
 */
function generateDigestFromContext(contextPath) {
    console.log('📄 Loading LLM context file...');

    if (!fs.existsSync(contextPath)) {
        console.error(`❌ Error: Context file not found: ${contextPath}`);
        process.exit(1);
    }

    try {
        const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));

        if (!context.project || !context.paths) {
            console.error('❌ Error: Invalid context format. Missing required fields.');
            process.exit(1);
        }

        console.log(`✅ Context loaded: ${context.project.totalFiles} files`);
        console.log('📄 Generating GitIngest digest from context...\n');

        // Extract files from context.paths structure
        const files = [];
        for (const [dirPath, fileNames] of Object.entries(context.paths)) {
            for (const fileName of fileNames) {
                const relativePath = dirPath === '/'
                    ? fileName
                    : `${dirPath}${fileName}`;

                const fullPath = path.join(process.cwd(), relativePath);

                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    files.push({
                        path: fullPath,
                        relativePath: relativePath,
                        sizeBytes: stats.size,
                        tokens: 0, // Token count not available in llm-context
                        lines: 0
                    });
                }
            }
        }

        console.log(`📁 Found ${files.length} accessible files`);

        const stats = {
            totalFiles: files.length,
            totalTokens: context.project.totalTokens,
            totalBytes: files.reduce((sum, f) => sum + f.sizeBytes, 0),
            totalLines: 0
        };

        const formatter = new GitIngestFormatter(
            process.cwd(),
            stats,
            files
        );

        const digestPath = path.join(process.cwd(), 'digest.txt');
        const digestSize = formatter.saveToFile(digestPath);

        console.log(`💾 GitIngest digest saved to: digest.txt`);
        console.log(`📊 Digest size: ${(digestSize / 1024).toFixed(1)} KB`);
        console.log(`✨ Generated from: ${path.basename(contextPath)}`);

    } catch (error) {
        console.error(`❌ Error processing context: ${error.message}`);
        process.exit(1);
    }
}


module.exports = TokenCalculator;
