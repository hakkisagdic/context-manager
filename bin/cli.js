#!/usr/bin/env node

import { TokenAnalyzer, PresetManager, TokenBudgetFitter, RuleTracer } from '../index.js';
import FormatRegistry from '../lib/formatters/format-registry.js';
import FormatConverter from '../lib/utils/format-converter.js';
import { LLMDetector } from '../lib/utils/llm-detector.js';
import APIServer from '../lib/api/rest/server.js';
import FileWatcher from '../lib/watch/FileWatcher.js';
import IncrementalAnalyzer from '../lib/watch/IncrementalAnalyzer.js';
import DiffAnalyzer from '../lib/integrations/git/DiffAnalyzer.js';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

// ESM equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        return;
    }

    // Check for version flag
    if (args.includes('--version')) {
        console.log(`Context Manager v${pkg.version}`);
        return;
    }

    // Check for format listing
    if (args.includes('--list-formats')) {
        listFormats();
        return;
    }

    // Check for LLM model listing (v2.3.7)
    if (args.includes('--list-llms')) {
        listLLMs();
        return;
    }

    // Check for preset listing (v3.1.0)
    if (args.includes('--list-presets')) {
        listPresets();
        return;
    }

    // Check for preset info (v3.1.0)
    if (args.includes('--preset-info')) {
        showPresetInfo(args);
        return;
    }

    // Check for format conversion mode (v2.3.2)
    if (args.includes('convert')) {
        runFormatConversion(args);
        return;
    }

    // Check for GitHub GitIngest mode (v2.3.6+)
    if (args.includes('github') || args.includes('git')) {
        const commandPath = resolve(__dirname, './cm-gitingest.js');
        const gitArgs = args.filter(arg => arg !== 'github' && arg !== 'git');
        execSync(`node "${commandPath}" ${gitArgs.join(' ')}`, { stdio: 'inherit' });
        return;
    }

    // Check for API server mode (v3.0.0)
    if (args.includes('serve')) {
        await runAPIServer(args);
        return;
    }

    // Check for watch mode (v3.0.0)
    if (args.includes('watch')) {
        await runWatchMode(args);
        return;
    }

    // Check for explicit dashboard mode
    if (args.includes('--dashboard')) {
        try {
            await runDashboard();
            return;
        } catch (error) {
            console.error('⚠️  Live dashboard failed.');
            console.error('   Error:', error.message);
            console.error('   Falling back to standard mode...\n');
        }
    }

    // Check if CLI mode is explicitly requested OR any analysis flags are present
    const hasAnalysisFlags = args.some(arg =>
        arg.startsWith('-') &&
        arg !== '--cli' &&
        arg !== '--wizard' &&
        arg !== '--dashboard'
    );

    const cliMode = args.includes('--cli') || hasAnalysisFlags;

    // DEFAULT: Run wizard mode unless --cli flag or other flags are present
    if (!cliMode) {
        try {
            await runWizard();
            return;
        } catch (error) {
            // If wizard fails, fall through to normal mode
            console.error('⚠️  Interactive wizard mode failed.');
            console.error('   Error:', error.message);
            console.error('   Falling back to CLI mode...\n');
            console.error('   Tip: Use --cli flag to skip wizard mode\n');
        }
    }

    // CLI Mode: Run traditional command-line analysis
    const options = parseArguments(args);

    // Apply preset if specified (v3.1.0)
    let appliedPreset = null;
    if (options.preset) {
        appliedPreset = await applyPreset(options);
    }

    // Git integration: Filter to changed files only (v3.0.0)
    if (options.changedOnly || options.changedSince) {
        await runChangedFilesAnalysis(options);
        
        // Cleanup preset if applied
        if (appliedPreset) {
            cleanupPreset(appliedPreset);
        }
        return;
    }

    printStartupInfo(options);

    // Initialize rule tracer if enabled (v3.1.0)
    let tracer = null;
    if (options.traceRules) {
        tracer = new RuleTracer();
        tracer.enable();
        options.ruleTracer = tracer;
    }

    const analyzer = new TokenAnalyzer(options.projectRoot, options);
    const result = analyzer.run();

    // Apply token budget fitting if specified (v3.1.0)
    if (options.targetTokens && result && result.files) {
        await applyTokenBudgetFitting(result, options);
    }

    // Display rule trace if enabled (v3.1.0)
    if (tracer) {
        console.log(tracer.generateReport());
    }

    // Cleanup preset if applied
    if (appliedPreset) {
        cleanupPreset(appliedPreset);
    }
}

function parseArguments(args) {
    return {
        // Output options
        saveReport: args.includes('--save-report') || args.includes('-s'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        contextExport: args.includes('--context-export'),
        contextToClipboard: args.includes('--context-clipboard'),

        // Analysis options
        methodLevel: args.includes('--method-level') || args.includes('-m'),
        gitingest: args.includes('--gitingest') || args.includes('-g'),

        // Format options (v2.3.0)
        outputFormat: getOutputFormat(args),

        // LLM options (v2.3.7)
        targetModel: getTargetModel(args),
        autoDetectLLM: args.includes('--auto-detect-llm'),

        // Git options (v3.0.0)
        changedOnly: args.includes('--changed-only'),
        changedSince: getChangedSince(args),
        withAuthors: args.includes('--with-authors'),
        withHistory: args.includes('--with-history'),

        // UI options (v2.3.0)
        simple: args.includes('--simple'),
        dashboard: args.includes('--dashboard'),

        // Chunking options (v2.3.0)
        chunking: {
            enabled: args.includes('--chunk'),
            strategy: getChunkStrategy(args),
            maxTokensPerChunk: getChunkSize(args)
        },

        // Phase 1 Core Enhancements (v3.1.0)
        preset: getPreset(args),
        targetTokens: getTargetTokens(args),
        fitStrategy: getFitStrategy(args),
        traceRules: args.includes('--trace-rules'),

        projectRoot: process.cwd()
    };
}

function getOutputFormat(args) {
    const formatIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
    if (formatIndex !== -1 && args[formatIndex + 1]) {
        return args[formatIndex + 1];
    }
    return 'toon'; // Default to TOON format in v2.3.0
}

function getChunkStrategy(args) {
    const strategyIndex = args.findIndex(arg => arg === '--chunk-strategy');
    if (strategyIndex !== -1 && args[strategyIndex + 1]) {
        return args[strategyIndex + 1];
    }
    return 'smart'; // Default strategy
}

function getChunkSize(args) {
    const sizeIndex = args.findIndex(arg => arg === '--chunk-size');
    if (sizeIndex !== -1 && args[sizeIndex + 1]) {
        return parseInt(args[sizeIndex + 1], 10);
    }
    return 100000; // Default 100k tokens
}

function getTargetModel(args) {
    // Check for explicit model flag
    const modelIndex = args.findIndex(arg => arg === '--target-model');
    if (modelIndex !== -1 && args[modelIndex + 1]) {
        return args[modelIndex + 1];
    }

    // Check for auto-detect flag
    if (args.includes('--auto-detect-llm')) {
        const detected = LLMDetector.detect();
        if (detected !== 'unknown') {
            console.log(`✅ Auto-detected LLM: ${LLMDetector.getProfile(detected).name}`);
            return detected;
        }
    }

    return null; // No model specified
}

function listLLMs() {
    console.log('\n📋 Supported LLM Models (v2.3.7):\n');
    console.log('═'.repeat(70));

    const models = LLMDetector.getModelList();

    // Group by vendor
    const byVendor = {};
    models.forEach(model => {
        if (!byVendor[model.vendor]) {
            byVendor[model.vendor] = [];
        }
        byVendor[model.vendor].push(model);
    });

    // Display by vendor
    Object.entries(byVendor).forEach(([vendor, models]) => {
        console.log(`\n${vendor}:`);
        models.forEach(model => {
            const contextDisplay = model.contextWindow >= 1000000
                ? `${(model.contextWindow / 1000000).toFixed(1)}M`
                : `${Math.floor(model.contextWindow / 1000)}k`;
            console.log(`  ${model.id.padEnd(25)} ${model.name.padEnd(25)} (${contextDisplay} context)`);
        });
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\nUsage:');
    console.log('  context-manager --target-model <MODEL_ID>');
    console.log('  context-manager --auto-detect-llm');
    console.log('\nExample:');
    console.log('  context-manager --target-model claude-sonnet-4.5');
    console.log('  context-manager --auto-detect-llm --cli\n');
}

function listPresets() {
    console.log('\n📋 Available Presets (v3.1.0):\n');
    console.log('═'.repeat(80));

    try {
        const manager = new PresetManager();
        const presets = manager.listPresets();

        if (presets.length === 0) {
            console.log('No presets found.');
            return;
        }

        presets.forEach(preset => {
            const icon = preset.icon || '⚙️';
            console.log(`\n${icon}  ${preset.name} (${preset.id})`);
            console.log(`   ${preset.description}`);
        });

        console.log('\n' + '═'.repeat(80));
        console.log('\nUsage:');
        console.log('  context-manager --preset <PRESET_ID>');
        console.log('  context-manager --preset-info <PRESET_ID>');
        console.log('\nExamples:');
        console.log('  context-manager --preset review');
        console.log('  context-manager --preset llm-explain --target-tokens 50k');
        console.log('  context-manager --preset-info security-audit\n');
    } catch (error) {
        console.error('❌ Failed to load presets:', error.message);
    }
}

function showPresetInfo(args) {
    const presetIndex = args.findIndex(arg => arg === '--preset-info');
    if (presetIndex === -1 || !args[presetIndex + 1]) {
        console.error('❌ Please specify a preset name');
        console.error('   Usage: context-manager --preset-info <PRESET_ID>');
        return;
    }

    const presetName = args[presetIndex + 1];

    try {
        const manager = new PresetManager();
        const preset = manager.getPresetInfo(presetName);

        if (!preset) {
            console.error(`❌ Preset "${presetName}" not found`);
            console.error('   Use --list-presets to see available presets');
            return;
        }

        console.log(`\n${preset.icon || '⚙️'}  ${preset.name} (${preset.id})`);
        console.log('═'.repeat(80));
        console.log(`\n${preset.description}\n`);

        // Filters
        console.log('📋 Filters:');
        if (preset.filters.include && preset.filters.include.length > 0) {
            console.log('  Include patterns:');
            preset.filters.include.slice(0, 5).forEach(pattern => {
                console.log(`    - ${pattern}`);
            });
            if (preset.filters.include.length > 5) {
                console.log(`    ... and ${preset.filters.include.length - 5} more`);
            }
        }
        if (preset.filters.exclude && preset.filters.exclude.length > 0) {
            console.log('  Exclude patterns:');
            preset.filters.exclude.slice(0, 5).forEach(pattern => {
                console.log(`    - ${pattern}`);
            });
            if (preset.filters.exclude.length > 5) {
                console.log(`    ... and ${preset.filters.exclude.length - 5} more`);
            }
        }

        // Options
        console.log('\n⚙️  Options:');
        Object.entries(preset.options).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        // Best for
        if (preset.metadata && preset.metadata.bestFor) {
            console.log('\n✨ Best for:');
            preset.metadata.bestFor.forEach(use => {
                console.log(`  • ${use}`);
            });
        }

        console.log('\n' + '═'.repeat(80));
        console.log(`\nUsage: context-manager --preset ${preset.id}\n`);
    } catch (error) {
        console.error('❌ Failed to get preset info:', error.message);
    }
}

function printStartupInfo(options) {
    console.log('🚀 Context Manager v3.1.0');
    console.log('='.repeat(50));

    // Only show active options if any are set
    const hasOptions = options.outputFormat || options.methodLevel || options.chunking?.enabled ||
                       options.saveReport || options.verbose || options.contextExport ||
                       options.contextToClipboard || options.gitingest || options.preset ||
                       options.targetTokens || options.traceRules;

    if (hasOptions) {
        console.log('📋 Active options:');
        if (options.preset) {
            console.log(`  Preset: ${options.preset}`);
        }
        if (options.outputFormat) {
            console.log(`  Output format: ${options.outputFormat}`);
        }
        if (options.methodLevel) {
            console.log('  Method-level analysis: enabled');
        }
        if (options.targetTokens) {
            console.log(`  Token budget: ${options.targetTokens.toLocaleString()} tokens`);
            console.log(`  Fit strategy: ${options.fitStrategy}`);
        }
        if (options.traceRules) {
            console.log('  Rule tracing: enabled');
        }
        if (options.saveReport) {
            console.log('  Save report: enabled');
        }
        if (options.gitingest) {
            console.log('  GitIngest format: enabled');
        }
        if (options.contextExport) {
            console.log('  Context export: enabled');
        }
        if (options.contextToClipboard) {
            console.log('  Copy to clipboard: enabled');
        }
        if (options.chunking?.enabled) {
            console.log(`  Chunking: ${options.chunking.strategy} (${options.chunking.maxTokensPerChunk.toLocaleString()} tokens/chunk)`);
        }
        console.log();
    }
}

function printHelp() {
    console.log('Context Manager v3.0.0 - AI Development Platform with Plugin Architecture and Git Integration');
    console.log();
    console.log('Usage: context-manager [options]');
    console.log();
    console.log('Default Mode:');
    console.log('  context-manager          Launch interactive wizard (DEFAULT)');
    console.log('  --cli                    Use CLI mode instead of wizard');
    console.log();
    console.log('Analysis Options:');
    console.log('  -s, --save-report        Save detailed JSON report');
    console.log('  -v, --verbose            Show all included files');
    console.log('  -m, --method-level       Enable method-level analysis');
    console.log('  -g, --gitingest          Generate GitIngest-style digest');
    console.log();
    console.log('Output Options (v2.3.0):');
    console.log('  -o, --output FORMAT      Output format (default: toon)');
    console.log('                           Formats: toon, json, yaml, csv, xml, markdown, gitingest');
    console.log('  --context-export         Generate LLM context file');
    console.log('  --context-clipboard      Copy context to clipboard');
    console.log('  --list-formats           List all available output formats');
    console.log();
    console.log('UI Options (v2.3.0):');
    console.log('  --simple                 Simple text-based output (no fancy UI)');
    console.log('  --dashboard              Live dashboard mode');
    console.log('  --wizard                 Force interactive wizard mode');
    console.log();
    console.log('Chunking Options (v2.3.0):');
    console.log('  --chunk                  Enable smart chunking for large repos');
    console.log('  --chunk-strategy TYPE    Chunking strategy (smart, size, file, directory)');
    console.log('  --chunk-size TOKENS      Max tokens per chunk (default: 100000)');
    console.log();
    console.log('LLM Optimization (v2.3.7):');
    console.log('  --target-model MODEL     Optimize for specific LLM (e.g., claude-sonnet-4.5)');
    console.log('  --auto-detect-llm        Auto-detect LLM from environment variables');
    console.log('  --list-llms              List all supported LLM models');
    console.log();
    console.log('Preset System (v3.1.0):');
    console.log('  --preset NAME            Use a predefined preset configuration');
    console.log('  --list-presets           List all available presets');
    console.log('  --preset-info NAME       Show detailed information about a preset');
    console.log();
    console.log('Token Budget Optimization (v3.1.0):');
    console.log('  --target-tokens N        Fit output within token budget (e.g., 100k, 1.5M)');
    console.log('  --fit-strategy TYPE      Strategy: auto, shrink-docs, methods-only, top-n, balanced');
    console.log();
    console.log('Rule Debugging (v3.1.0):');
    console.log('  --trace-rules            Enable detailed rule tracing and show decisions');
    console.log();
    console.log('Git Integration (v3.0.0):');
    console.log('  --changed-only           Analyze only files with uncommitted changes');
    console.log('  --changed-since REF      Analyze files changed since commit/branch');
    console.log('  --with-authors           Include author information');
    console.log('  --with-history           Include commit history');
    console.log();
    console.log('Platform Features (v3.0.0):');
    console.log('  serve [options]          Start REST API server');
    console.log('    --port PORT            Server port (default: 3000)');
    console.log('    --auth-token TOKEN     API authentication token');
    console.log('  watch [options]          Watch mode with auto-analysis');
    console.log('    --debounce MS          Debounce delay (default: 1000ms)');
    console.log();
    console.log('General Options:');
    console.log('  -h, --help               Show this help');
    console.log('  --version                Show version number');
    console.log();
    console.log('Configuration Files:');
    console.log('  .contextinclude          Include only specified files');
    console.log('  .contextignore           Exclude specified files');
    console.log('  .methodinclude           Include only specified methods');
    console.log('  .methodignore            Exclude specified methods');
    console.log();
    console.log('Format Conversion (v2.3.2):');
    console.log('  convert INPUT --from FORMAT --to FORMAT');
    console.log('                           Convert between formats');
    console.log('  Examples:');
    console.log('    context-manager convert report.json --from json --to toon');
    console.log('    context-manager convert data.toon --from toon --to yaml');
    console.log('    context-manager convert context.yaml --from yaml --to json');
    console.log();
    console.log('GitHub Integration (v2.3.6+):');
    console.log('  github URL [options]     Generate GitIngest from GitHub repository');
    console.log('  git URL [options]        Alias for github command');
    console.log('  Examples:');
    console.log('    context-manager github facebook/react');
    console.log('    context-manager github https://github.com/vercel/next.js --branch canary');
    console.log('    context-manager git angular/angular -o docs/angular.txt');
    console.log();
    console.log('Examples:');
    console.log('  context-manager                                  # Launch interactive wizard (DEFAULT)');
    console.log('  context-manager --cli                            # Use CLI mode');
    console.log('  context-manager --cli -o json --save-report      # CLI: JSON format + save report');
    console.log('  context-manager --cli -o toon --context-clipboard   # CLI: TOON to clipboard');
    console.log('  context-manager --cli --gitingest --chunk        # CLI: GitIngest with chunking');
    console.log('  context-manager --cli -m -o yaml                 # CLI: Method-level + YAML format');
    console.log('  context-manager --cli --chunk --chunk-strategy smart   # CLI: Smart chunking');
    console.log('  context-manager convert data.json --from json --to toon  # Convert formats');
    console.log();
    console.log('Phase 1 Features (v3.1.0):');
    console.log('  context-manager --preset review                  # Use code review preset');
    console.log('  context-manager --preset llm-explain --target-tokens 50k  # Compact LLM context');
    console.log('  context-manager --target-tokens 100k --fit-strategy auto  # Auto-fit to budget');
    console.log('  context-manager --trace-rules                    # Debug filter rules');
    console.log('  context-manager --preset security-audit --trace-rules     # Security audit with tracing');
    console.log();
    console.log('Format Comparison (token efficiency):');
    console.log('  TOON:     40-50% reduction (most efficient)');
    console.log('  JSON:     Standard format (baseline)');
    console.log('  YAML:     Human-readable (5-10% larger than JSON)');
    console.log('  Markdown: Documentation-friendly (20-30% larger)');
    console.log();
    console.log('For more information: https://github.com/hakkisagdic/context-manager');
}

function listFormats() {
    const registry = new FormatRegistry();
    const formats = registry.getAllInfo();

    console.log('📋 Available Output Formats:\n');
    console.log('Format'.padEnd(15) + 'Description'.padEnd(50) + 'Extension');
    console.log('='.repeat(80));

    for (const [name, info] of Object.entries(formats)) {
        console.log(
            name.padEnd(15) +
            info.description.substring(0, 48).padEnd(50) +
            info.extension
        );
    }

    console.log();
    console.log('Usage: context-manager --output <format>');
    console.log('Example: context-manager --output toon --context-clipboard');
}

function getChangedSince(args) {
    const sinceIndex = args.findIndex(arg => arg === '--changed-since');
    if (sinceIndex !== -1 && args[sinceIndex + 1]) {
        return args[sinceIndex + 1];
    }
    return null;
}

function getPreset(args) {
    const presetIndex = args.findIndex(arg => arg === '--preset');
    if (presetIndex !== -1 && args[presetIndex + 1]) {
        return args[presetIndex + 1];
    }
    return null;
}

function getTargetTokens(args) {
    const tokensIndex = args.findIndex(arg => arg === '--target-tokens');
    if (tokensIndex !== -1 && args[tokensIndex + 1]) {
        const value = args[tokensIndex + 1];
        // Support formats like "100k", "1.5M", or plain numbers
        if (value.endsWith('k') || value.endsWith('K')) {
            return parseInt(value.slice(0, -1), 10) * 1000;
        }
        if (value.endsWith('m') || value.endsWith('M')) {
            return parseFloat(value.slice(0, -1)) * 1000000;
        }
        return parseInt(value, 10);
    }
    return null;
}

function getFitStrategy(args) {
    const strategyIndex = args.findIndex(arg => arg === '--fit-strategy');
    if (strategyIndex !== -1 && args[strategyIndex + 1]) {
        return args[strategyIndex + 1];
    }
    return 'auto'; // Default strategy
}

async function runAPIServer(args) {
    const portIndex = args.findIndex(arg => arg === '--port');
    const port = portIndex !== -1 && args[portIndex + 1]
        ? parseInt(args[portIndex + 1], 10)
        : 3000;

    const authTokenIndex = args.findIndex(arg => arg === '--auth-token');
    const authToken = authTokenIndex !== -1 && args[authTokenIndex + 1]
        ? args[authTokenIndex + 1]
        : null;

    const server = new APIServer({ port, authToken });

    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });

    server.start();
}

async function runChangedFilesAnalysis(options) {
    console.log('🔀 Git Integration - Analyzing Changed Files');
    console.log('═'.repeat(60));
    console.log();

    const diffAnalyzer = new DiffAnalyzer(options.projectRoot);
    const changes = diffAnalyzer.analyzeChanges(options.changedSince);

    console.log(`📝 Found ${changes.totalChangedFiles} changed files`);
    if (options.changedSince) {
        console.log(`   Since: ${options.changedSince}`);
    }
    console.log(`   Impact: ${changes.impact.level.toUpperCase()} (score: ${changes.impact.score})`);
    console.log();

    if (changes.totalChangedFiles === 0) {
        console.log('✅ No changed files to analyze');
        return;
    }

    // Analyze only changed files
    const analyzer = new TokenAnalyzer(options.projectRoot, {
        ...options,
        fileFilter: (filePath) => changes.changedFiles.includes(filePath)
    });

    analyzer.run();
}

async function runWatchMode(args) {
    console.log('👁️  Starting watch mode...\n');

    const projectRoot = process.cwd();
    const debounce = args.includes('--debounce')
        ? parseInt(args[args.indexOf('--debounce') + 1], 10) || 1000
        : 1000;

    const watcher = new FileWatcher(projectRoot, { debounce });
    const analyzer = new IncrementalAnalyzer({ methodLevel: args.includes('-m') });

    // Handle file changes
    watcher.on('file:changed', async (event) => {
        console.log(`\n📝 File ${event.type}: ${event.relativePath}`);
        await analyzer.analyzeChange(event);
    });

    // Handle analysis complete
    analyzer.on('analysis:complete', (event) => {
        console.log(`   ✅ Analysis complete: ${event.analysis.tokens} tokens (${event.elapsed}ms)`);

        const stats = analyzer.getStats();
        console.log(`   📊 Total: ${stats.totalFiles} files, ${stats.totalTokens.toLocaleString()} tokens`);
    });

    // Handle file deletion
    analyzer.on('file:deleted', (event) => {
        console.log(`   🗑️  File deleted: ${event.file} (-${event.oldTokens} tokens)`);
    });

    // Start watching
    watcher.start();

    console.log('✅ Watch mode active');
    console.log('   Press Ctrl+C to stop\n');

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Stopping watch mode...');
        watcher.stop();
        process.exit(0);
    });
}

async function runWizard() {
    try {
        // Dynamic imports for ESM modules
        const ReactModule = await import('react');
        const React = ReactModule.default || ReactModule;
        const { render } = await import('ink');
        const Wizard = (await import('../lib/ui/wizard.js')).default;

        // Clear screen for clean wizard display
        console.clear();
        console.log('🧙 Starting interactive wizard...\n');

        const instance = render(
            React.createElement(Wizard, {
                onComplete: (answers) => {
                    instance.unmount();

                    console.log('\n✨ Wizard complete! Running analysis with your configuration...\n');

                    // Run analyzer with wizard configuration
                    const options = {
                        outputFormat: answers.outputFormat,
                        useCase: answers.useCase,
                        targetModel: answers.targetModel,
                        projectRoot: process.cwd(),
                        simple: true,      // No export menu
                        contextExport: true // Auto-export to file
                    };

                    const analyzer = new TokenAnalyzer(options.projectRoot, options);
                    analyzer.run();

                    console.log('\n✅ Analysis complete! Context exported to llm-context.json\n');
                }
            })
        );
    } catch (error) {
        throw error; // Re-throw to be caught by main()
    }
}

async function runDashboard() {
    try {
        // Dynamic imports for ESM modules
        const ReactModule = await import('react');
        const React = ReactModule.default || ReactModule;
        const { render } = await import('ink');
        const Dashboard = (await import('../lib/ui/dashboard.js')).default;

        // Clear console and show loading message
        console.clear();
        console.log('📊 Analyzing project for dashboard...\n');

        // Run analyzer silently (no console output)
        const originalLog = console.log;
        const logs = [];
        console.log = (...args) => logs.push(args); // Capture logs

        const analyzer = new TokenAnalyzer(process.cwd(), {
            simple: true,
            verbose: false,
            dashboard: true // Skip export handling
        });
        const stats = analyzer.run();

        console.log = originalLog; // Restore console.log

        // Clear and render dashboard
        console.clear();

        const instance = render(
            React.createElement(Dashboard, {
                stats,
                topFiles: stats.largestFiles || [],
                status: 'complete',
                onExit: () => {
                    instance.unmount();
                    process.exit(0);
                }
            })
        );
    } catch (error) {
        throw error; // Re-throw to be caught by main()
    }
}

async function applyPreset(options) {
    try {
        const manager = new PresetManager();
        const appliedPreset = manager.applyPreset(options.preset, options.projectRoot);

        console.log(`✅ Applied preset: ${appliedPreset.presetId}`);
        console.log(`   Temporary files created: ${appliedPreset.tempFiles.length}`);
        console.log();

        // Merge preset options with CLI options (CLI takes precedence)
        if (appliedPreset.options) {
            if (appliedPreset.options.methodLevel && !options.methodLevel) {
                options.methodLevel = appliedPreset.options.methodLevel;
            }
            if (appliedPreset.options.gitingest && !options.gitingest) {
                options.gitingest = appliedPreset.options.gitingest;
            }
            if (appliedPreset.options.targetTokens && !options.targetTokens) {
                options.targetTokens = appliedPreset.options.targetTokens;
            }
            if (appliedPreset.options.fitStrategy && options.fitStrategy === 'auto') {
                options.fitStrategy = appliedPreset.options.fitStrategy;
            }
        }

        return appliedPreset;
    } catch (error) {
        console.error(`❌ Failed to apply preset: ${error.message}`);
        console.error('   Continuing with default configuration...\n');
        return null;
    }
}

function cleanupPreset(appliedPreset) {
    if (!appliedPreset) return;

    try {
        const manager = new PresetManager();
        manager.cleanup(appliedPreset);
        console.log(`\n✅ Cleaned up preset files`);
    } catch (error) {
        console.warn(`⚠️  Failed to cleanup preset files: ${error.message}`);
    }
}

async function applyTokenBudgetFitting(result, options) {
    try {
        console.log('\n🎯 Token Budget Fitting');
        console.log('═'.repeat(60));

        const fitter = new TokenBudgetFitter(options.targetTokens, options.fitStrategy);
        const fitResult = fitter.fitToWindow(result.files || [], {
            preserveEntryPoints: true
        });

        const report = fitter.generateReport(fitResult);

        console.log('\n' + report.summary);

        if (report.recommendations && report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        console.log('\n' + '═'.repeat(60));

        // Update result with fitted files
        if (result.files) {
            result.files = fitResult.files;
            result.totalTokens = fitResult.totalTokens;
        }
    } catch (error) {
        console.error(`❌ Token budget fitting failed: ${error.message}`);
        console.error('   Continuing with original file list...\n');
    }
}

function runFormatConversion(args) {
    // v2.3.2: Format conversion utility
    const converter = new FormatConverter();

    // Parse arguments
    const fromIndex = args.findIndex(arg => arg === '--from');
    const toIndex = args.findIndex(arg => arg === '--to');
    const inputIndex = args.findIndex(arg => arg === 'convert') + 1;

    if (fromIndex === -1 || toIndex === -1) {
        console.error('❌ Format conversion requires --from and --to flags');
        console.error('   Usage: context-manager convert input.json --from json --to toon');
        process.exit(1);
    }

    const inputFile = args[inputIndex];
    const fromFormat = args[fromIndex + 1];
    const toFormat = args[toIndex + 1];

    if (!inputFile) {
        console.error('❌ No input file specified');
        process.exit(1);
    }

    // Generate output filename
    const outputFile = inputFile.replace(/\.[^.]+$/, `.${toFormat}`);

    console.log('🔄 Converting formats...');
    console.log(`   Input:  ${inputFile} (${fromFormat})`);
    console.log(`   Output: ${outputFile} (${toFormat})`);
    console.log();

    try {
        const result = converter.convertFile(inputFile, outputFile, fromFormat, toFormat);

        console.log('✅ Conversion successful!');
        console.log(`   Input size:  ${result.inputSize.toLocaleString()} chars`);
        console.log(`   Output size: ${result.outputSize.toLocaleString()} chars`);
        console.log(`   Savings:     ${result.savingsPercent} (${result.savings} chars)`);
        console.log(`   Output file: ${result.outputFile}`);
    } catch (error) {
        console.error('❌ Conversion failed:', error.message);
        process.exit(1);
    }
}

// ESM entry point
main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
});
