/**
 * Context Manager - Public API
 * Exports all modules for programmatic usage
 */

// Core analyzers
const TokenCalculator = require('./lib/analyzers/token-calculator');
const MethodAnalyzer = require('./lib/analyzers/method-analyzer');

// Parsers
const GitIgnoreParser = require('./lib/parsers/gitignore-parser');
const MethodFilterParser = require('./lib/parsers/method-filter-parser');

// Formatters
const GitIngestFormatter = require('./lib/formatters/gitingest-formatter');

// Utils
const TokenUtils = require('./lib/utils/token-utils');
const FileUtils = require('./lib/utils/file-utils');
const ClipboardUtils = require('./lib/utils/clipboard-utils');
const ConfigUtils = require('./lib/utils/config-utils');

// Orchestrator functions
const { generateDigestFromReport, generateDigestFromContext } = require('./context-manager');

module.exports = {
    // Analyzers
    TokenCalculator,
    TokenAnalyzer: TokenCalculator,  // Alias for backward compatibility
    MethodAnalyzer,

    // Parsers
    GitIgnoreParser,
    MethodFilterParser,

    // Formatters
    GitIngestFormatter,

    // Utils
    TokenUtils,
    FileUtils,
    ClipboardUtils,
    ConfigUtils,

    // Functions
    generateDigestFromReport,
    generateDigestFromContext
};
