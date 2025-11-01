#!/usr/bin/env node

/**
 * Context Manager - Main Orchestrator
 * LLM context optimization with method-level filtering and GitIngest support
 */

const fs = require('fs');
const path = require('path');
const TokenCalculator = require('./lib/analyzers/token-calculator');
const GitIngestFormatter = require('./lib/formatters/gitingest-formatter');
const TokenUtils = require('./lib/utils/token-utils');
const PresetManager = require('./lib/presets/preset-manager');

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

        const { summary = report.summary|| {}, files =report.files || [] } = report || {};
        const formatter = new GitIngestFormatter(
            projectRoot,
            summary,
            files
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
                        tokens: 0,
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

/**
 * Main execution
 */
function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        printHelp();
        return;
    }

    // Handle --list-presets
    if (args.includes('--list-presets')) {
        const presetManager = new PresetManager();
        presetManager.printAvailablePresets();
        return;
    }

    // Handle --preset-info
    const presetInfoIndex = args.indexOf('--preset-info');
    if (presetInfoIndex !== -1) {
        const presetName = args[presetInfoIndex + 1];
        if (!presetName) {
            console.error('❌ Error: Please specify a preset name');
            console.log('Usage: context-manager --preset-info <name>');
            process.exit(1);
        }
        const presetManager = new PresetManager();
        presetManager.printPresetInfo(presetName);
        return;
    }

    // Handle --gitingest-from-report
    const reportFlagIndex = args.indexOf('--gitingest-from-report');
    if (reportFlagIndex !== -1) {
        const reportPath = args[reportFlagIndex + 1] || 'token-analysis-report.json';
        generateDigestFromReport(reportPath);
        return;
    }

    // Handle --gitingest-from-context
    const contextFlagIndex = args.indexOf('--gitingest-from-context');
    if (contextFlagIndex !== -1) {
        const contextPath = args[contextFlagIndex + 1] || 'llm-context.json';
        generateDigestFromContext(contextPath);
        return;
    }

    // Parse preset option
    let options = {
        saveReport: args.includes('--save-report') || args.includes('-s'),
        verbose: args.includes('--verbose') || args.includes('-v'),
        contextExport: args.includes('--context-export'),
        contextToClipboard: args.includes('--context-clipboard'),
        methodLevel: args.includes('--method-level') || args.includes('-m'),
        gitingest: args.includes('--gitingest') || args.includes('-g')
    };

    // Apply preset if specified
    const presetIndex = args.indexOf('--preset');
    if (presetIndex !== -1) {
        const presetName = args[presetIndex + 1];
        if (!presetName) {
            console.error('❌ Error: Please specify a preset name');
            console.log('Usage: context-manager --preset <name>');
            console.log('Run "context-manager --list-presets" to see available presets');
            process.exit(1);
        }

        try {
            const presetManager = new PresetManager();

            // Validate preset exists
            if (!presetManager.hasPreset(presetName)) {
                console.error(`❌ Error: Preset '${presetName}' not found`);
                console.log('\nAvailable presets:');
                presetManager.printAvailablePresets();
                process.exit(1);
            }

            // Apply preset configuration
            options = presetManager.applyPreset(presetName, options);

            // Create temporary filter files for preset
            const tempFilters = presetManager.createTempFilters(presetName, process.cwd());
            options.tempFilters = tempFilters;

            // Print preset info
            presetManager.printPresetInfo(presetName);
        } catch (error) {
            console.error(`❌ Error applying preset: ${error.message}`);
            process.exit(1);
        }
    } else {
        printStartupInfo();
    }

    const calculator = new TokenCalculator(process.cwd(), options);
    calculator.run();

    // Cleanup temporary filter files if preset was used
    if (options.tempFilters) {
        const presetManager = new PresetManager();
        presetManager.cleanupTempFilters(process.cwd());
    }
}

function printStartupInfo() {
    console.log('🚀 Context Manager by Hakkı Sağdıç');
    console.log('='.repeat(50));
    console.log('📋 Available options:');
    console.log('  --preset <name>       Use a preset configuration');
    console.log('  --list-presets        List all available presets');
    console.log('  --save-report, -s     Save detailed JSON report');
    console.log('  --verbose, -v         Show included files and directories');
    console.log('  --context-export      Generate LLM context file list');
    console.log('  --context-clipboard   Copy context to clipboard');
    console.log('  --method-level, -m    Enable method-level analysis');
    console.log('  --gitingest, -g       Generate GitIngest-style digest');
    console.log('  --help, -h            Show this help message');

    if (!TokenUtils.hasExactCounting()) {
        console.log('\n💡 For exact token counts, install tiktoken: npm install tiktoken');
    }
    console.log('💡 Try: context-manager --preset llm-explain');
    console.log();
}

function printHelp() {
    console.log('Context Manager - LLM context optimization with method-level filtering');
    console.log();
    console.log('Usage: context-manager [options]');
    console.log('       node context-manager.js [options]  # Direct usage');
    console.log();
    console.log('Preset Options:');
    console.log('  --preset <name>                      Use a preset configuration');
    console.log('  --list-presets                       List all available presets');
    console.log('  --preset-info <name>                 Show detailed preset information');
    console.log();
    console.log('Analysis Options:');
    console.log('  -s, --save-report                    Save detailed JSON report');
    console.log('  -v, --verbose                        Show all included files');
    console.log('  --context-export                     Generate LLM context file');
    console.log('  --context-clipboard                  Copy context to clipboard');
    console.log('  -m, --method-level                   Enable method-level analysis');
    console.log('  -g, --gitingest                      Generate GitIngest-style digest');
    console.log();
    console.log('Digest Generation:');
    console.log('  --gitingest-from-report <file>       Generate digest from report JSON');
    console.log('  --gitingest-from-context <file>      Generate digest from context JSON');
    console.log();
    console.log('Other:');
    console.log('  -h, --help                           Show this help');
    console.log();
    console.log('Configuration Files:');
    console.log('  .calculatorinclude                   Files to include (INCLUDE mode)');
    console.log('  .calculatorignore                    Files to exclude (EXCLUDE mode)');
    console.log('  .methodinclude                       Methods to include');
    console.log('  .methodignore                        Methods to exclude');
    console.log();
    console.log('Examples:');
    console.log('  # Using presets (recommended)');
    console.log('  context-manager --preset llm-explain      # Ultra-compact LLM context');
    console.log('  context-manager --preset review           # Code review digest');
    console.log('  context-manager --preset security-audit   # Security-focused analysis');
    console.log('  context-manager --list-presets            # See all presets');
    console.log();
    console.log('  # Standard workflow');
    console.log('  context-manager                           # Interactive export selection');
    console.log('  context-manager --save-report             # Save JSON report');
    console.log('  context-manager --gitingest               # Generate digest.txt');
    console.log('  context-manager -g -s                     # Both digest + report');
    console.log();
    console.log('  # Generate digest from existing JSON files (fast, no re-scan)');
    console.log('  context-manager --gitingest-from-report token-analysis-report.json');
    console.log('  context-manager --gitingest-from-context llm-context.json');
    console.log();
    console.log('  # Custom analysis');
    console.log('  context-manager --method-level --verbose  # Method-level with details');
    console.log('  context-manager --preset review -v        # Override preset verbosity');
    console.log();
    console.log('For more information: https://github.com/hakkisagdic/context-manager');
}

if (require.main === module) {
    main();
}

module.exports = {
    TokenCalculator,
    PresetManager,
    generateDigestFromReport,
    generateDigestFromContext
};
