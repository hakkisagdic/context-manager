/**
 * Context Manager - Public API
 * Exports all modules for programmatic usage
 */

// Core analyzers
import TokenCalculator from './lib/analyzers/token-calculator.js';
import MethodAnalyzer from './lib/analyzers/method-analyzer.js';

// Parsers
import GitIgnoreParser from './lib/parsers/gitignore-parser.js';
import MethodFilterParser from './lib/parsers/method-filter-parser.js';

// Formatters
import GitIngestFormatter from './lib/formatters/gitingest-formatter.js';
import ToonFormatter from './lib/formatters/toon-formatter.js';
import ToonFormatterV13 from './lib/formatters/toon-formatter-v1.3.js';
import FormatRegistry from './lib/formatters/format-registry.js';

// TOON Advanced Features
import ToonStreamEncoder from './lib/formatters/toon-stream-encoder.js';
import ToonStreamDecoder from './lib/formatters/toon-stream-decoder.js';
import ToonIncrementalParser from './lib/formatters/toon-incremental-parser.js';
import ToonValidator from './lib/formatters/toon-validator.js';
import ToonDiff from './lib/formatters/toon-diff.js';
import ToonBenchmark from './lib/formatters/toon-benchmark.js';
import ToonMessagePackComparison from './lib/formatters/toon-messagepack-comparison.js';

// Utils
import TokenUtils from './lib/utils/token-utils.js';
import FileUtils from './lib/utils/file-utils.js';
import ClipboardUtils from './lib/utils/clipboard-utils.js';
import ConfigUtils from './lib/utils/config-utils.js';
import FormatConverter from './lib/utils/format-converter.js';
import ErrorHandler from './lib/utils/error-handler.js';
import { Logger, getLogger, createLogger } from './lib/utils/logger.js'; // v2.3.6+
import Updater from './lib/utils/updater.js'; // v2.3.6+
import GitUtils from './lib/utils/git-utils.js'; // v2.3.6+

// Phase 1 Core Enhancements (v3.1.0)
import PresetManager from './lib/presets/preset-manager.js';
import { PresetNotFoundError, InvalidPresetError, PresetLoadError } from './lib/presets/preset-manager.js';
import TokenBudgetFitter from './lib/optimizers/token-budget-fitter.js';
import { TokenBudgetError, ImpossibleFitError } from './lib/optimizers/token-budget-fitter.js';
import FitStrategies from './lib/optimizers/fit-strategies.js';
import RuleTracer from './lib/debug/rule-tracer.js';

// Orchestrator functions
import { generateDigestFromReport, generateDigestFromContext } from './context-manager.js';

export {
    // Analyzers
    TokenCalculator,
    MethodAnalyzer,

    // Parsers
    GitIgnoreParser,
    MethodFilterParser,

    // Formatters
    GitIngestFormatter,
    ToonFormatter,
    ToonFormatterV13,
    FormatRegistry,

    // TOON Advanced Features
    ToonStreamEncoder,
    ToonStreamDecoder,
    ToonIncrementalParser,
    ToonValidator,
    ToonDiff,
    ToonBenchmark,
    ToonMessagePackComparison,

    // Utils
    TokenUtils,
    FileUtils,
    ClipboardUtils,
    ConfigUtils,
    FormatConverter,
    ErrorHandler,

    // v2.3.6+ Utils
    Logger,
    getLogger,
    createLogger,
    Updater,
    GitUtils,

    // v3.1.0 Phase 1 Core Enhancements
    PresetManager,
    PresetNotFoundError,
    InvalidPresetError,
    PresetLoadError,
    TokenBudgetFitter,
    TokenBudgetError,
    ImpossibleFitError,
    FitStrategies,
    RuleTracer,

    // Functions
    generateDigestFromReport,
    generateDigestFromContext
};

// Alias for backward compatibility
export { TokenCalculator as TokenAnalyzer };
