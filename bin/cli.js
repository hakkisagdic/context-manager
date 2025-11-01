#!/usr/bin/env node

const { TokenAnalyzer } = require('../index.js');

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
        gitingest: args.includes('--gitingest') || args.includes('-g'),
        projectRoot: process.cwd()
    };
    
    printStartupInfo();
    
    const analyzer = new TokenAnalyzer(options.projectRoot, options);
    analyzer.run();
}

function printStartupInfo() {
    console.log('🚀 Context Manager by Hakkı Sağdıç');
    console.log('='.repeat(50));
    console.log('📋 Available options:');
    console.log('  --save-report, -s     Save detailed JSON report');
    console.log('  --verbose, -v         Show included files and directories');
    console.log('  --context-export      Generate LLM context file list');
    console.log('  --context-clipboard   Copy context to clipboard');
    console.log('  --method-level, -m    Enable method-level analysis');
    console.log('  --gitingest, -g       Generate GitIngest-style digest');
    console.log('  --help, -h           Show this help message');
    console.log();
}

function printHelp() {
    console.log('Context Manager - LLM context optimization with method-level filtering');
    console.log();
    console.log('Usage: context-manager [options]');
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
    console.log('  context-manager                          # Interactive analysis');
    console.log('  context-manager --save-report            # Save detailed report');
    console.log('  context-manager --gitingest              # Generate digest.txt');
    console.log('  context-manager --method-level --context-export  # Method-level LLM context');
    console.log('  context-manager -g -s -v                 # GitIngest + report + verbose');
}

if (require.main === module) {
    main();
}