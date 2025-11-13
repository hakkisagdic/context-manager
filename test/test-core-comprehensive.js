#!/usr/bin/env node

/**
 * Core v3.0.0 Comprehensive Tests
 * Tests Scanner, Analyzer, ContextBuilder, and Reporter
 */

import { Scanner } from '../lib/core/Scanner.js';
import { Analyzer } from '../lib/core/Analyzer.js';
import { ContextBuilder } from '../lib/core/ContextBuilder.js';
import { Reporter } from '../lib/core/Reporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const TEST_ROOT = process.cwd();
const TEST_FIXTURE_DIR = path.join(__dirname, 'fixtures', 'core-test');

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
        return false;
    }
}

console.log('🧪 Testing Core v3.0.0 Modules...\\n');

// ============================================================================
// SCANNER TESTS
// ============================================================================
console.log('📦 Scanner Tests');
console.log('-'.repeat(70));

test('Scanner - Constructor with defaults', () => {
    const scanner = new Scanner(TEST_ROOT);
    if (!scanner) throw new Error('Failed to create Scanner');
    if (scanner.rootPath !== TEST_ROOT) throw new Error('Root path not set');
    if (scanner.options.respectGitignore !== true) throw new Error('respectGitignore should be true by default');
    if (scanner.options.followSymlinks !== false) throw new Error('followSymlinks should be false by default');
    if (scanner.options.maxDepth !== Infinity) throw new Error('maxDepth should be Infinity by default');
});

test('Scanner - Constructor with custom options', () => {
    const scanner = new Scanner(TEST_ROOT, {
        respectGitignore: false,
        followSymlinks: true,
        maxDepth: 5
    });

    if (scanner.options.respectGitignore !== false) throw new Error('respectGitignore not set');
    if (scanner.options.followSymlinks !== true) throw new Error('followSymlinks not set');
    if (scanner.options.maxDepth !== 5) throw new Error('maxDepth not set');
});

test('Scanner - Stats initialization', () => {
    const scanner = new Scanner(TEST_ROOT);
    const stats = scanner.getStats();

    if (typeof stats.filesScanned !== 'number') throw new Error('filesScanned should be number');
    if (typeof stats.directoriesTraversed !== 'number') throw new Error('directoriesTraversed should be number');
    if (typeof stats.filesIgnored !== 'number') throw new Error('filesIgnored should be number');
    if (typeof stats.errors !== 'number') throw new Error('errors should be number');

    if (stats.filesScanned !== 0) throw new Error('filesScanned should start at 0');
    if (stats.directoriesTraversed !== 0) throw new Error('directoriesTraversed should start at 0');
});

test('Scanner - GitIgnore parser initialized', () => {
    const scanner = new Scanner(TEST_ROOT);
    if (!scanner.gitIgnore) throw new Error('GitIgnore parser not initialized');
});

test('Scanner - Scan returns array', () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 1 });
    const files = scanner.scan();
    if (!Array.isArray(files)) throw new Error('scan() should return array');
});

test('Scanner - Scanned files have correct structure', () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 1 });
    const files = scanner.scan();

    if (files.length > 0) {
        const file = files[0];
        if (!file.path) throw new Error('File should have path');
        if (!file.relativePath) throw new Error('File should have relativePath');
        if (!file.name) throw new Error('File should have name');
        if (!file.extension) throw new Error('File should have extension');
        if (typeof file.size !== 'number') throw new Error('File size should be number');
        if (!file.modified) throw new Error('File should have modified date');
    }
});

test('Scanner - Stats updated after scan', () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 1 });
    scanner.scan();
    const stats = scanner.getStats();

    if (stats.directoriesTraversed === 0) throw new Error('Should have traversed directories');
});

test('Scanner - Reset clears stats', () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 1 });
    scanner.scan();

    const statsBefore = scanner.getStats();
    if (statsBefore.filesScanned === 0 && statsBefore.directoriesTraversed === 0) {
        // No files were scanned, skip test
        return;
    }

    scanner.reset();
    const statsAfter = scanner.getStats();

    if (statsAfter.filesScanned !== 0) throw new Error('filesScanned not reset');
    if (statsAfter.directoriesTraversed !== 0) throw new Error('directoriesTraversed not reset');
    if (statsAfter.filesIgnored !== 0) throw new Error('filesIgnored not reset');
    if (statsAfter.errors !== 0) throw new Error('errors not reset');
});

test('Scanner - maxDepth limits scan depth', () => {
    const scanner1 = new Scanner(TEST_ROOT, { maxDepth: 0 });
    const files1 = scanner1.scan();

    const scanner2 = new Scanner(TEST_ROOT, { maxDepth: 1 });
    const files2 = scanner2.scan();

    // maxDepth 1 should find more or equal files
    if (files2.length < files1.length) {
        throw new Error('maxDepth not limiting correctly');
    }
});

test('Scanner - getFileInfo returns complete info', () => {
    const scanner = new Scanner(TEST_ROOT);
    const files = scanner.scan();

    if (files.length > 0) {
        const file = files[0];
        if (!file.created) throw new Error('File should have created date');
    }
});

test('Scanner - shouldIgnore method exists', () => {
    const scanner = new Scanner(TEST_ROOT);
    const result = scanner.shouldIgnore('test.js');
    if (typeof result !== 'boolean') throw new Error('shouldIgnore should return boolean');
});

// ============================================================================
// ANALYZER TESTS
// ============================================================================
console.log('\\n📊 Analyzer Tests');
console.log('-'.repeat(70));

test('Analyzer - Constructor with defaults', () => {
    const analyzer = new Analyzer();
    if (!analyzer) throw new Error('Failed to create Analyzer');
    if (analyzer.options.methodLevel !== false) throw new Error('methodLevel should be false by default');
    if (analyzer.options.parallel !== false) throw new Error('parallel should be false by default');
    if (analyzer.options.maxWorkers !== 4) throw new Error('maxWorkers should be 4 by default');
});

test('Analyzer - Constructor with custom options', () => {
    const analyzer = new Analyzer({
        methodLevel: true,
        parallel: true,
        maxWorkers: 8
    });

    if (analyzer.options.methodLevel !== true) throw new Error('methodLevel not set');
    if (analyzer.options.parallel !== true) throw new Error('parallel not set');
    if (analyzer.options.maxWorkers !== 8) throw new Error('maxWorkers not set');
});

test('Analyzer - Stats initialization', () => {
    const analyzer = new Analyzer();
    const stats = analyzer.getStats();

    if (typeof stats.totalFiles !== 'number') throw new Error('totalFiles should be number');
    if (typeof stats.totalTokens !== 'number') throw new Error('totalTokens should be number');
    if (typeof stats.totalSize !== 'number') throw new Error('totalSize should be number');
    if (typeof stats.totalMethods !== 'number') throw new Error('totalMethods should be number');
    if (!stats.byLanguage) throw new Error('byLanguage should be object');
    if (!Array.isArray(stats.largestFiles)) throw new Error('largestFiles should be array');
});

test('Analyzer - MethodAnalyzer initialized', () => {
    const analyzer = new Analyzer();
    if (!analyzer.methodAnalyzer) throw new Error('MethodAnalyzer not initialized');
});

await asyncTest('Analyzer - analyze returns correct structure', async () => {
    const analyzer = new Analyzer();
    const mockFiles = [
        {
            path: path.join(TEST_ROOT, 'index.js'),
            relativePath: 'index.js',
            name: 'index.js',
            extension: '.js',
            size: 1000,
            modified: new Date()
        }
    ];

    const result = await analyzer.analyze(mockFiles);

    if (!result) throw new Error('analyze should return result');
    if (!result.files) throw new Error('Result should have files');
    if (!result.stats) throw new Error('Result should have stats');
    if (!Array.isArray(result.files)) throw new Error('files should be array');
});

await asyncTest('Analyzer - analyzeFile handles valid file', async () => {
    const analyzer = new Analyzer();
    const fileInfo = {
        path: path.join(TEST_ROOT, 'index.js'),
        relativePath: 'index.js',
        name: 'index.js',
        extension: '.js',
        size: 1000
    };

    const analysis = await analyzer.analyzeFile(fileInfo);

    if (analysis) {
        if (!analysis.tokens) throw new Error('Analysis should have tokens');
        if (!analysis.language) throw new Error('Analysis should have language');
        if (typeof analysis.lines !== 'number') throw new Error('Analysis should have lines');
    }
});

test('Analyzer - detectLanguage handles JavaScript', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.js') !== 'JavaScript') throw new Error('Should detect .js as JavaScript');
    if (analyzer.detectLanguage('.jsx') !== 'JavaScript') throw new Error('Should detect .jsx as JavaScript');
});

test('Analyzer - detectLanguage handles TypeScript', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.ts') !== 'TypeScript') throw new Error('Should detect .ts as TypeScript');
    if (analyzer.detectLanguage('.tsx') !== 'TypeScript') throw new Error('Should detect .tsx as TypeScript');
});

test('Analyzer - detectLanguage handles Python', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.py') !== 'Python') throw new Error('Should detect .py as Python');
});

test('Analyzer - detectLanguage handles Go', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.go') !== 'Go') throw new Error('Should detect .go as Go');
});

test('Analyzer - detectLanguage handles Rust', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.rs') !== 'Rust') throw new Error('Should detect .rs as Rust');
});

test('Analyzer - detectLanguage handles Java', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.java') !== 'Java') throw new Error('Should detect .java as Java');
});

test('Analyzer - detectLanguage handles C#', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.cs') !== 'C#') throw new Error('Should detect .cs as C#');
});

test('Analyzer - detectLanguage handles unknown extension', () => {
    const analyzer = new Analyzer();
    if (analyzer.detectLanguage('.xyz') !== 'Other') throw new Error('Should detect unknown as Other');
});

test('Analyzer - reset clears stats', () => {
    const analyzer = new Analyzer();
    analyzer.stats.totalFiles = 10;
    analyzer.stats.totalTokens = 1000;

    analyzer.reset();

    const stats = analyzer.getStats();
    if (stats.totalFiles !== 0) throw new Error('totalFiles not reset');
    if (stats.totalTokens !== 0) throw new Error('totalTokens not reset');
});

test('Analyzer - getLanguageDistribution returns array', () => {
    const analyzer = new Analyzer();
    analyzer.stats.byLanguage = {
        'JavaScript': { files: 10, tokens: 5000, size: 10000 },
        'TypeScript': { files: 5, tokens: 3000, size: 6000 }
    };
    analyzer.stats.totalTokens = 8000;

    const distribution = analyzer.getLanguageDistribution();
    if (!Array.isArray(distribution)) throw new Error('Should return array');
    if (distribution.length !== 2) throw new Error('Should have 2 languages');
    if (!distribution[0].percentage) throw new Error('Should include percentage');
});

test('Analyzer - getLanguageDistribution sorted by tokens', () => {
    const analyzer = new Analyzer();
    analyzer.stats.byLanguage = {
        'JavaScript': { files: 10, tokens: 3000, size: 10000 },
        'TypeScript': { files: 5, tokens: 5000, size: 6000 }
    };
    analyzer.stats.totalTokens = 8000;

    const distribution = analyzer.getLanguageDistribution();
    if (distribution[0].language !== 'TypeScript') throw new Error('Should be sorted by tokens descending');
});

await asyncTest('Analyzer - methodLevel option extracts methods', async () => {
    const analyzer = new Analyzer({ methodLevel: true });
    const fileInfo = {
        path: path.join(TEST_ROOT, 'index.js'),
        relativePath: 'index.js',
        name: 'index.js',
        extension: '.js',
        size: 1000
    };

    const analysis = await analyzer.analyzeFile(fileInfo);

    if (analysis && analysis.methods) {
        if (!Array.isArray(analysis.methods)) throw new Error('methods should be array');
        if (typeof analysis.methodCount !== 'number') throw new Error('methodCount should be number');
    }
});

// ============================================================================
// CONTEXTBUILDER TESTS
// ============================================================================
console.log('\\n🏗️  ContextBuilder Tests');
console.log('-'.repeat(70));

test('ContextBuilder - Constructor with defaults', () => {
    const builder = new ContextBuilder();
    if (!builder) throw new Error('Failed to create ContextBuilder');
    if (builder.options.targetModel !== null) throw new Error('targetModel should be null by default');
    if (builder.options.targetTokens !== null) throw new Error('targetTokens should be null by default');
    if (builder.options.useCase !== 'custom') throw new Error('useCase should be custom by default');
    if (builder.options.includeTests !== true) throw new Error('includeTests should be true by default');
    if (builder.options.includeDocumentation !== true) throw new Error('includeDocumentation should be true by default');
    if (builder.options.priorityStrategy !== 'balanced') throw new Error('priorityStrategy should be balanced by default');
});

test('ContextBuilder - Constructor with custom options', () => {
    const builder = new ContextBuilder({
        targetModel: 'claude-sonnet-4',
        targetTokens: 100000,
        useCase: 'code-review',
        includeTests: false,
        includeDocumentation: false,
        priorityStrategy: 'core-first'
    });

    if (builder.options.targetModel !== 'claude-sonnet-4') throw new Error('targetModel not set');
    if (builder.options.targetTokens !== 100000) throw new Error('targetTokens not set');
    if (builder.options.useCase !== 'code-review') throw new Error('useCase not set');
    if (builder.options.includeTests !== false) throw new Error('includeTests not set');
    if (builder.options.includeDocumentation !== false) throw new Error('includeDocumentation not set');
    if (builder.options.priorityStrategy !== 'core-first') throw new Error('priorityStrategy not set');
});

test('ContextBuilder - build returns context structure', () => {
    const builder = new ContextBuilder();
    const analysisResult = {
        files: [],
        stats: {
            totalFiles: 0,
            totalTokens: 0,
            totalSize: 0,
            byLanguage: {}
        }
    };

    const context = builder.build(analysisResult);

    if (!context) throw new Error('build should return context');
    if (!context.metadata) throw new Error('Context should have metadata');
    if (!context.files) throw new Error('Context should have files');
    if (!context.statistics) throw new Error('Context should have statistics');
});

test('ContextBuilder - buildMetadata creates metadata', () => {
    const builder = new ContextBuilder({ targetModel: 'gpt-4', useCase: 'code-review' });
    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 10000
    };

    const metadata = builder.buildMetadata(stats);

    if (!metadata.generatedAt) throw new Error('Metadata should have generatedAt');
    if (metadata.totalFiles !== 10) throw new Error('Metadata should have totalFiles');
    if (metadata.totalTokens !== 5000) throw new Error('Metadata should have totalTokens');
    if (metadata.totalSize !== 10000) throw new Error('Metadata should have totalSize');
    if (metadata.targetModel !== 'gpt-4') throw new Error('Metadata should have targetModel');
    if (metadata.useCase !== 'code-review') throw new Error('Metadata should have useCase');
    if (!metadata.configuration) throw new Error('Metadata should have configuration');
});

test('ContextBuilder - buildFileList organizes by directory', () => {
    const builder = new ContextBuilder();
    const files = [
        {
            relativePath: 'src/app.js',
            name: 'app.js',
            tokens: 100,
            size: 500,
            language: 'JavaScript'
        },
        {
            relativePath: 'src/utils.js',
            name: 'utils.js',
            tokens: 50,
            size: 250,
            language: 'JavaScript'
        },
        {
            relativePath: 'index.js',
            name: 'index.js',
            tokens: 75,
            size: 300,
            language: 'JavaScript'
        }
    ];

    const fileList = builder.buildFileList(files);

    if (!fileList['src']) throw new Error('Should have src directory');
    if (!fileList['/']) throw new Error('Should have root directory');
    if (fileList['src'].length !== 2) throw new Error('src should have 2 files');
    if (fileList['/'].length !== 1) throw new Error('root should have 1 file');
});

test('ContextBuilder - buildMethodList creates method structure', () => {
    const builder = new ContextBuilder();
    const files = [
        {
            relativePath: 'src/app.js',
            methods: [
                { name: 'main', line: 10, tokens: 50, type: 'function' },
                { name: 'helper', line: 20, tokens: 25, type: 'function' }
            ]
        },
        {
            relativePath: 'src/utils.js',
            methods: []
        }
    ];

    const methodList = builder.buildMethodList(files);

    if (!methodList['src/app.js']) throw new Error('Should have methods for src/app.js');
    if (methodList['src/app.js'].length !== 2) throw new Error('Should have 2 methods');
    if (!methodList['src/app.js'][0].name) throw new Error('Method should have name');
    if (typeof methodList['src/app.js'][0].line !== 'number') throw new Error('Method should have line number');
});

test('ContextBuilder - applySmartFiltering returns all when under budget', () => {
    const builder = new ContextBuilder();
    const files = [
        { relativePath: 'file1.js', tokens: 100 },
        { relativePath: 'file2.js', tokens: 200 }
    ];

    const filtered = builder.applySmartFiltering(files, 500);
    if (filtered.length !== 2) throw new Error('Should return all files when under budget');
});

test('ContextBuilder - applySmartFiltering limits when over budget', () => {
    const builder = new ContextBuilder();
    const files = [
        { relativePath: 'file1.js', tokens: 100, modified: Date.now() },
        { relativePath: 'file2.js', tokens: 200, modified: Date.now() },
        { relativePath: 'file3.js', tokens: 300, modified: Date.now() }
    ];

    const filtered = builder.applySmartFiltering(files, 250);
    if (filtered.length === files.length) throw new Error('Should filter files when over budget');
});

test('ContextBuilder - priorityStrategy balanced', () => {
    const builder = new ContextBuilder({ priorityStrategy: 'balanced' });
    const files = [
        { relativePath: 'src/core/app.js', tokens: 100, modified: Date.now() },
        { relativePath: 'test/app.test.js', tokens: 50, modified: Date.now() }
    ];

    const prioritized = builder.prioritizeFiles(files);
    if (!Array.isArray(prioritized)) throw new Error('Should return array');
    if (prioritized.length !== 2) throw new Error('Should return all files');
});

test('ContextBuilder - priorityStrategy changed-first', () => {
    const builder = new ContextBuilder({ priorityStrategy: 'changed-first' });
    const now = Date.now();
    const files = [
        { relativePath: 'old.js', tokens: 100, modified: now - 10000 },
        { relativePath: 'new.js', tokens: 50, modified: now }
    ];

    const prioritized = builder.prioritizeFiles(files);
    if (prioritized[0].relativePath !== 'new.js') throw new Error('Should prioritize newer files');
});

test('ContextBuilder - priorityStrategy core-first', () => {
    const builder = new ContextBuilder({ priorityStrategy: 'core-first' });
    const files = [
        { relativePath: 'test/app.test.js', tokens: 100, modified: Date.now() },
        { relativePath: 'src/core/app.js', tokens: 50, modified: Date.now() }
    ];

    const prioritized = builder.prioritizeFiles(files);
    // Core files should be prioritized over test files
    const coreIndex = prioritized.findIndex(f => f.relativePath === 'src/core/app.js');
    const testIndex = prioritized.findIndex(f => f.relativePath === 'test/app.test.js');
    if (coreIndex > testIndex) throw new Error('Should prioritize core files');
});

test('ContextBuilder - calculateCoreScore gives high score to core paths', () => {
    const builder = new ContextBuilder();
    const coreFile = { relativePath: 'src/core/main.js' };
    const testFile = { relativePath: 'test/main.test.js' };

    const coreScore = builder.calculateCoreScore(coreFile);
    const testScore = builder.calculateCoreScore(testFile);

    if (coreScore <= testScore) throw new Error('Core files should score higher than test files');
});

test('ContextBuilder - calculateCoreScore recognizes index files', () => {
    const builder = new ContextBuilder();
    const indexFile = { relativePath: 'src/index.js' };
    const normalFile = { relativePath: 'src/utils.js' };

    const indexScore = builder.calculateCoreScore(indexFile);
    const normalScore = builder.calculateCoreScore(normalFile);

    if (indexScore <= normalScore) throw new Error('Index files should score higher');
});

test('ContextBuilder - calculateBalancedScore combines core and size', () => {
    const builder = new ContextBuilder();
    const file = { relativePath: 'src/core/app.js', tokens: 1000 };

    const score = builder.calculateBalancedScore(file);
    if (typeof score !== 'number') throw new Error('Score should be number');
    if (score <= 0) throw new Error('Score should be positive');
});

test('ContextBuilder - optimizeForLLM adds LLM metadata', () => {
    const builder = new ContextBuilder({ targetModel: 'claude-sonnet-4' });
    const context = {
        metadata: { totalFiles: 10, totalTokens: 5000 },
        files: {},
        statistics: { totalTokens: 5000 }
    };

    const optimized = builder.optimizeForLLM(context);

    if (!optimized.metadata.targetLLM) throw new Error('Should add targetLLM metadata');
    if (!optimized.metadata.recommendedFormat) throw new Error('Should recommend format');
    if (typeof optimized.metadata.fitsInContext !== 'boolean') throw new Error('Should check if fits in context');
});

test('ContextBuilder - optimizeForLLM calculates chunks needed', () => {
    const builder = new ContextBuilder({ targetModel: 'gpt-4' });
    const context = {
        metadata: { totalFiles: 100, totalTokens: 500000 },
        files: {},
        statistics: { totalTokens: 500000 }
    };

    const optimized = builder.optimizeForLLM(context);

    if (typeof optimized.metadata.chunksNeeded !== 'number') throw new Error('Should calculate chunks needed');
    if (optimized.metadata.fitsInContext && optimized.metadata.chunksNeeded > 1) {
        throw new Error('If fits in context, should need 1 chunk');
    }
});

test('ContextBuilder - generateCompactPaths creates compact structure', () => {
    const builder = new ContextBuilder();
    const context = {
        files: {
            'src': [
                { name: 'app.js', path: 'src/app.js' },
                { name: 'utils.js', path: 'src/utils.js' }
            ]
        }
    };

    const compact = builder.generateCompactPaths(context);

    if (!compact['src']) throw new Error('Should have src directory');
    if (!Array.isArray(compact['src'])) throw new Error('Should be array of names');
    if (compact['src'].length !== 2) throw new Error('Should have 2 file names');
    if (compact['src'][0] !== 'app.js') throw new Error('Should contain file names');
});

test('ContextBuilder - getSummary returns string', () => {
    const builder = new ContextBuilder();
    const context = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalFiles: 10,
            totalTokens: 5000,
            totalSize: 10000,
            useCase: 'custom',
            configuration: { methodLevel: false }
        },
        statistics: {}
    };

    const summary = builder.getSummary(context);

    if (typeof summary !== 'string') throw new Error('Summary should be string');
    if (!summary.includes('Files')) throw new Error('Summary should include files');
    if (!summary.includes('Tokens')) throw new Error('Summary should include tokens');
});

// ============================================================================
// REPORTER TESTS
// ============================================================================
console.log('\\n📄 Reporter Tests');
console.log('-'.repeat(70));

test('Reporter - Constructor with defaults', () => {
    const reporter = new Reporter();
    if (!reporter) throw new Error('Failed to create Reporter');
    if (reporter.options.format !== 'toon') throw new Error('format should be toon by default');
    if (reporter.options.outputPath !== null) throw new Error('outputPath should be null by default');
    if (reporter.options.clipboard !== false) throw new Error('clipboard should be false by default');
    if (reporter.options.verbose !== true) throw new Error('verbose should be true by default');
});

test('Reporter - Constructor with custom options', () => {
    const reporter = new Reporter({
        format: 'json',
        outputPath: '/tmp/output.json',
        clipboard: true,
        verbose: false
    });

    if (reporter.options.format !== 'json') throw new Error('format not set');
    if (reporter.options.outputPath !== '/tmp/output.json') throw new Error('outputPath not set');
    if (reporter.options.clipboard !== true) throw new Error('clipboard not set');
    if (reporter.options.verbose !== false) throw new Error('verbose not set');
});

test('Reporter - FormatRegistry initialized', () => {
    const reporter = new Reporter();
    if (!reporter.formatRegistry) throw new Error('FormatRegistry not initialized');
});

test('Reporter - detectFormatFromPath handles .json', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.json');
    if (format !== 'json') throw new Error('Should detect json format');
});

test('Reporter - detectFormatFromPath handles .yaml', () => {
    const reporter = new Reporter();
    if (reporter.detectFormatFromPath('output.yaml') !== 'yaml') throw new Error('Should detect yaml');
    if (reporter.detectFormatFromPath('output.yml') !== 'yaml') throw new Error('Should detect yml as yaml');
});

test('Reporter - detectFormatFromPath handles .md', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.md');
    if (format !== 'markdown') throw new Error('Should detect markdown format');
});

test('Reporter - detectFormatFromPath handles .toon', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.toon');
    if (format !== 'toon') throw new Error('Should detect toon format');
});

test('Reporter - detectFormatFromPath handles .csv', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.csv');
    if (format !== 'csv') throw new Error('Should detect csv format');
});

test('Reporter - detectFormatFromPath handles .xml', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.xml');
    if (format !== 'xml') throw new Error('Should detect xml format');
});

test('Reporter - detectFormatFromPath handles .txt', () => {
    const reporter = new Reporter();
    const format = reporter.detectFormatFromPath('output.txt');
    if (format !== 'gitingest') throw new Error('Should detect txt as gitingest');
});

test('Reporter - detectFormatFromPath falls back to default', () => {
    const reporter = new Reporter({ format: 'json' });
    const format = reporter.detectFormatFromPath('output.xyz');
    if (format !== 'json') throw new Error('Should fall back to default format');
});

test('Reporter - getAverageTokens calculates correctly', () => {
    const reporter = new Reporter();
    const stats = {
        totalFiles: 10,
        totalTokens: 5000
    };

    const avg = reporter.getAverageTokens(stats);
    if (avg !== '500') throw new Error('Average should be 500');
});

test('Reporter - getAverageTokens handles zero files', () => {
    const reporter = new Reporter();
    const stats = {
        totalFiles: 0,
        totalTokens: 0
    };

    const avg = reporter.getAverageTokens(stats);
    if (avg !== 'N/A') throw new Error('Should return N/A for zero files');
});

test('Reporter - generateSummary creates summary text', () => {
    const reporter = new Reporter();
    const context = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalFiles: 10,
            totalTokens: 5000,
            totalSize: 10000,
            useCase: 'custom',
            configuration: { methodLevel: false }
        },
        statistics: {}
    };

    const summary = reporter.generateSummary(context);

    if (typeof summary !== 'string') throw new Error('Summary should be string');
    if (!summary.includes('Context Manager')) throw new Error('Summary should include title');
    if (!summary.includes('Files:')) throw new Error('Summary should include files');
    if (!summary.includes('Tokens:')) throw new Error('Summary should include tokens');
});

test('Reporter - generateSummary includes LLM info when present', () => {
    const reporter = new Reporter();
    const context = {
        metadata: {
            generatedAt: new Date().toISOString(),
            totalFiles: 10,
            totalTokens: 5000,
            totalSize: 10000,
            useCase: 'custom',
            configuration: { methodLevel: false },
            targetLLM: {
                name: 'Claude Sonnet 4',
                contextWindow: 200000
            },
            fitsInContext: true
        },
        statistics: {}
    };

    const summary = reporter.generateSummary(context);

    if (!summary.includes('Target LLM:')) throw new Error('Summary should include target LLM');
    if (!summary.includes('Fits in context:')) throw new Error('Summary should include fits in context');
});

test('Reporter - printConsoleReport handles stats', () => {
    const reporter = new Reporter({ verbose: false });
    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 10000,
        byLanguage: {
            'JavaScript': { files: 8, tokens: 4000, size: 8000 },
            'TypeScript': { files: 2, tokens: 1000, size: 2000 }
        },
        largestFiles: [
            { path: 'src/app.js', tokens: 1000, size: 2000 }
        ]
    };

    // Should not throw
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport handles method stats', () => {
    const reporter = new Reporter({ verbose: false });
    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 10000,
        totalMethods: 50,
        includedMethods: 30,
        byLanguage: {},
        largestFiles: []
    };

    // Should not throw
    reporter.printConsoleReport(stats);
});

test('Reporter - printConsoleReport handles performance stats', () => {
    const reporter = new Reporter({ verbose: false });
    const stats = {
        totalFiles: 10,
        totalTokens: 5000,
        totalSize: 10000,
        analysisTime: 1234,
        cacheHits: 8,
        cacheMisses: 2,
        byLanguage: {},
        largestFiles: []
    };

    // Should not throw
    reporter.printConsoleReport(stats);
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
console.log('\\n🔗 Core Module Integration Tests');
console.log('-'.repeat(70));

test('Scanner + Analyzer integration', async () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 1 });
    const analyzer = new Analyzer();

    const files = scanner.scan();
    const result = await analyzer.analyze(files.slice(0, 5)); // Analyze only first 5 files

    if (!result) throw new Error('Integration should return result');
    if (!result.files) throw new Error('Result should have files');
    if (!result.stats) throw new Error('Result should have stats');
});

test('Analyzer + ContextBuilder integration', async () => {
    const analyzer = new Analyzer();
    const builder = new ContextBuilder({ useCase: 'code-review' });

    const mockFiles = [
        {
            path: path.join(TEST_ROOT, 'index.js'),
            relativePath: 'index.js',
            name: 'index.js',
            extension: '.js',
            size: 1000,
            modified: new Date()
        }
    ];

    const analysisResult = await analyzer.analyze(mockFiles);
    const context = builder.build(analysisResult);

    if (!context) throw new Error('Integration should return context');
    if (!context.metadata) throw new Error('Context should have metadata');
});

test('ContextBuilder + Reporter integration', () => {
    const builder = new ContextBuilder();
    const reporter = new Reporter({ verbose: false });

    const analysisResult = {
        files: [],
        stats: {
            totalFiles: 0,
            totalTokens: 0,
            totalSize: 0,
            byLanguage: {}
        }
    };

    const context = builder.build(analysisResult);

    // Should not throw
    reporter.printConsoleReport(context.statistics);
});

test('Full pipeline: Scanner -> Analyzer -> ContextBuilder -> Reporter', async () => {
    const scanner = new Scanner(TEST_ROOT, { maxDepth: 0 });
    const analyzer = new Analyzer();
    const builder = new ContextBuilder({ targetModel: 'claude-sonnet-4' });
    const reporter = new Reporter({ verbose: false });

    // Scan
    const files = scanner.scan();
    const scanStats = scanner.getStats();

    // Analyze (limit to first file to speed up test)
    const analysisResult = await analyzer.analyze(files.slice(0, 1));

    // Build context
    const context = builder.build(analysisResult);

    // Report
    reporter.printConsoleReport(analysisResult.stats);

    // Verify pipeline worked
    if (!context) throw new Error('Pipeline should produce context');
    if (!context.metadata.targetLLM) throw new Error('Should have LLM optimization');
});

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================
console.log('\\n⚠️  Edge Cases & Error Handling');
console.log('-'.repeat(70));

test('Scanner - handles non-existent directory gracefully', () => {
    const scanner = new Scanner('/nonexistent/path/xyz');
    // Should not throw during construction
    if (!scanner) throw new Error('Should create scanner even for non-existent path');
});

test('Scanner - handles empty directory', () => {
    // Create temp empty directory
    const emptyDir = path.join(__dirname, 'fixtures', 'empty-test-dir');
    if (!fs.existsSync(emptyDir)) {
        fs.mkdirSync(emptyDir, { recursive: true });
    }

    const scanner = new Scanner(emptyDir);
    const files = scanner.scan();

    if (!Array.isArray(files)) throw new Error('Should return array even for empty dir');

    // Cleanup
    fs.rmdirSync(emptyDir);
});

test('Analyzer - handles empty file list', async () => {
    const analyzer = new Analyzer();
    const result = await analyzer.analyze([]);

    if (!result) throw new Error('Should handle empty array');
    if (result.files.length !== 0) throw new Error('Should return empty results');
    if (result.stats.totalFiles !== 0) throw new Error('Stats should be zero');
});

test('Analyzer - analyzeFile returns null for binary file', async () => {
    const analyzer = new Analyzer();
    const binaryFile = {
        path: '/path/to/image.png',
        relativePath: 'image.png',
        name: 'image.png',
        extension: '.png',
        size: 1000
    };

    const result = await analyzer.analyzeFile(binaryFile);
    // Should return null or handle gracefully
    if (result && result.tokens < 0) throw new Error('Invalid token count');
});

test('ContextBuilder - handles empty files array', () => {
    const builder = new ContextBuilder();
    const analysisResult = {
        files: [],
        stats: {
            totalFiles: 0,
            totalTokens: 0,
            totalSize: 0,
            byLanguage: {}
        }
    };

    const context = builder.build(analysisResult);
    if (!context) throw new Error('Should handle empty files');
    if (Object.keys(context.files).length > 0) throw new Error('Files should be empty');
});

test('ContextBuilder - handles very small token budget', () => {
    const builder = new ContextBuilder();
    const files = [
        { relativePath: 'file.js', tokens: 1000000, modified: Date.now() }
    ];

    const filtered = builder.applySmartFiltering(files, 100);
    // Should handle gracefully
    if (!Array.isArray(filtered)) throw new Error('Should return array');
});

test('Reporter - getAverageTokens handles division edge cases', () => {
    const reporter = new Reporter();

    // Very large numbers
    const stats1 = { totalFiles: 1000000, totalTokens: 1000000000 };
    const avg1 = reporter.getAverageTokens(stats1);
    if (!avg1 || avg1 === 'N/A') throw new Error('Should handle large numbers');

    // Zero tokens
    const stats2 = { totalFiles: 10, totalTokens: 0 };
    const avg2 = reporter.getAverageTokens(stats2);
    if (avg2 !== '0') throw new Error('Should return 0 for zero tokens');
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\\n🎉 All Core v3.0.0 module tests passed!');
    process.exit(0);
} else {
    console.log('\\n❌ Some tests failed.');
    process.exit(1);
}
