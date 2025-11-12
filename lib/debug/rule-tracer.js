/**
 * RuleTracer - Rule Debugging and Tracing System
 * v3.1.0 - Rule Debugger/Tracer
 *
 * Responsibilities:
 * - Track file and method inclusion/exclusion decisions
 * - Analyze pattern usage and effectiveness
 * - Generate detailed trace reports
 * - Help debug filter configurations
 */

import { getLogger } from '../utils/logger.js';

const logger = getLogger('RuleTracer');

/**
 * @typedef {Object} Decision
 * @property {boolean} included - Was it included?
 * @property {string} reason - Why was this decision made?
 * @property {string} [rule] - Which rule matched?
 * @property {string} [ruleSource] - Source file (.gitignore, .contextignore, etc.)
 * @property {number} [priority] - Rule priority
 * @property {'INCLUDE'|'EXCLUDE'} [mode] - Current mode
 */

/**
 * @typedef {Object} PatternAnalysis
 * @property {string} pattern - The pattern
 * @property {string} source - Source file
 * @property {number} matchCount - Number of matches
 * @property {string[]} examples - Example matches (up to 5)
 * @property {boolean} unused - Was this pattern used?
 */

/**
 * @typedef {Object} TraceResult
 * @property {Map<string, Decision>} files - File decisions
 * @property {Map<string, Map<string, Decision>>} methods - Method decisions
 * @property {PatternAnalysis[]} patterns - Pattern analysis
 * @property {Object} summary - Summary statistics
 */

export class RuleTracer {
  /**
   * Create a RuleTracer instance
   * @param {Object} [options={}] - Tracer options
   */
  constructor(options = {}) {
    this.options = {
      enabled: false,
      maxExamples: 5,
      ...options
    };

    this.fileDecisions = new Map();
    this.methodDecisions = new Map();
    this.patternMatches = new Map();
    this.patternSources = new Map();
  }

  /**
   * Enable tracing
   */
  enable() {
    this.options.enabled = true;
    logger.info('Rule tracing enabled');
  }

  /**
   * Disable tracing
   */
  disable() {
    this.options.enabled = false;
    logger.info('Rule tracing disabled');
  }

  /**
   * Check if tracing is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.options.enabled;
  }

  /**
   * Record a file decision
   * @param {string} file - File path
   * @param {Decision} decision - Decision details
   */
  recordFileDecision(file, decision) {
    if (!this.options.enabled) return;

    this.fileDecisions.set(file, decision);

    // Track pattern usage
    if (decision.rule) {
      this.recordPatternMatch(decision.rule, decision.ruleSource || 'unknown', file);
    }

    logger.debug(`File decision: ${file} -> ${decision.included ? 'INCLUDED' : 'EXCLUDED'}`);
  }

  /**
   * Record a method decision
   * @param {string} file - File path
   * @param {string} method - Method name
   * @param {Decision} decision - Decision details
   */
  recordMethodDecision(file, method, decision) {
    if (!this.options.enabled) return;

    if (!this.methodDecisions.has(file)) {
      this.methodDecisions.set(file, new Map());
    }

    this.methodDecisions.get(file).set(method, decision);

    // Track pattern usage
    if (decision.rule) {
      this.recordPatternMatch(decision.rule, decision.ruleSource || 'unknown', `${file}:${method}`);
    }

    logger.debug(`Method decision: ${file}:${method} -> ${decision.included ? 'INCLUDED' : 'EXCLUDED'}`);
  }

  /**
   * Record a pattern match
   * @param {string} pattern - Pattern that matched
   * @param {string} source - Source file
   * @param {string} example - Example match
   * @private
   */
  recordPatternMatch(pattern, source, example) {
    if (!this.patternMatches.has(pattern)) {
      this.patternMatches.set(pattern, []);
      this.patternSources.set(pattern, source);
    }

    const examples = this.patternMatches.get(pattern);
    if (examples.length < this.options.maxExamples) {
      examples.push(example);
    }
  }

  /**
   * Get trace results
   * @returns {TraceResult} Trace results
   */
  getTrace() {
    const includedFiles = Array.from(this.fileDecisions.values()).filter(d => d.included).length;
    const excludedFiles = this.fileDecisions.size - includedFiles;

    let totalMethods = 0;
    let includedMethods = 0;

    for (const methods of this.methodDecisions.values()) {
      totalMethods += methods.size;
      includedMethods += Array.from(methods.values()).filter(d => d.included).length;
    }

    return {
      files: this.fileDecisions,
      methods: this.methodDecisions,
      patterns: this.analyzePatterns(),
      summary: {
        totalFiles: this.fileDecisions.size,
        includedFiles,
        excludedFiles,
        totalMethods,
        includedMethods,
        excludedMethods: totalMethods - includedMethods
      }
    };
  }

  /**
   * Analyze pattern usage
   * @returns {PatternAnalysis[]} Pattern analysis
   */
  analyzePatterns() {
    const analysis = [];

    for (const [pattern, examples] of this.patternMatches.entries()) {
      analysis.push({
        pattern,
        source: this.patternSources.get(pattern) || 'unknown',
        matchCount: examples.length,
        examples: examples.slice(0, this.options.maxExamples),
        unused: examples.length === 0
      });
    }

    // Sort by match count (descending)
    analysis.sort((a, b) => b.matchCount - a.matchCount);

    return analysis;
  }

  /**
   * Generate trace report
   * @returns {string} Formatted trace report
   */
  generateReport() {
    if (!this.options.enabled) {
      return 'Rule tracing is not enabled. Use --trace-rules to enable.';
    }

    const trace = this.getTrace();
    const lines = [];

    // Header
    lines.push('');
    lines.push('🔍 RULE TRACE REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    // Summary
    lines.push('📊 Summary:');
    lines.push(`   Total Files: ${trace.summary.totalFiles}`);
    lines.push(`   ✅ Included: ${trace.summary.includedFiles}`);
    lines.push(`   ❌ Excluded: ${trace.summary.excludedFiles}`);

    if (trace.summary.totalMethods > 0) {
      lines.push(`   Total Methods: ${trace.summary.totalMethods}`);
      lines.push(`   ✅ Included: ${trace.summary.includedMethods}`);
      lines.push(`   ❌ Excluded: ${trace.summary.excludedMethods}`);
    }

    lines.push('');

    // File decisions (show first 20)
    lines.push('📁 File Decisions (showing first 20):');
    lines.push('─'.repeat(80));

    let fileCount = 0;
    for (const [file, decision] of trace.files.entries()) {
      if (fileCount >= 20) break;

      const icon = decision.included ? '✅' : '❌';
      const status = decision.included ? 'INCLUDED' : 'EXCLUDED';

      lines.push(`${icon} ${file}: ${status}`);
      lines.push(`   Reason: ${decision.reason}`);

      if (decision.rule) {
        lines.push(`   Rule: ${decision.rule} (${decision.ruleSource || 'unknown'})`);
      }

      if (decision.mode) {
        lines.push(`   Mode: ${decision.mode}`);
      }

      lines.push('');
      fileCount++;
    }

    if (trace.files.size > 20) {
      lines.push(`   ... and ${trace.files.size - 20} more files`);
      lines.push('');
    }

    // Pattern analysis
    if (trace.patterns.length > 0) {
      lines.push('🔍 Pattern Analysis:');
      lines.push('─'.repeat(80));

      for (const pattern of trace.patterns.slice(0, 15)) {
        if (pattern.unused) {
          lines.push(`⚠️  ${pattern.pattern} (${pattern.source})`);
          lines.push(`   Matches: 0 (UNUSED)`);
        } else {
          lines.push(`✓ ${pattern.pattern} (${pattern.source})`);
          lines.push(`   Matches: ${pattern.matchCount}`);

          if (pattern.examples.length > 0) {
            lines.push(`   Examples:`);
            for (const example of pattern.examples) {
              lines.push(`     - ${example}`);
            }
          }
        }

        lines.push('');
      }

      if (trace.patterns.length > 15) {
        lines.push(`   ... and ${trace.patterns.length - 15} more patterns`);
        lines.push('');
      }
    }

    // Footer
    lines.push('═'.repeat(80));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate compact trace summary
   * @returns {string} Compact summary
   */
  generateSummary() {
    const trace = this.getTrace();

    return `Rule Trace: ${trace.summary.includedFiles}/${trace.summary.totalFiles} files included, ` +
           `${trace.summary.excludedFiles} excluded`;
  }

  /**
   * Clear all trace data
   */
  clear() {
    this.fileDecisions.clear();
    this.methodDecisions.clear();
    this.patternMatches.clear();
    this.patternSources.clear();
    logger.debug('Trace data cleared');
  }

  /**
   * Export trace data as JSON
   * @returns {Object} Trace data
   */
  exportJSON() {
    const trace = this.getTrace();

    return {
      summary: trace.summary,
      files: Array.from(trace.files.entries()).map(([file, decision]) => ({
        file,
        ...decision
      })),
      methods: Array.from(trace.methods.entries()).map(([file, methods]) => ({
        file,
        methods: Array.from(methods.entries()).map(([method, decision]) => ({
          method,
          ...decision
        }))
      })),
      patterns: trace.patterns
    };
  }

  /**
   * Get decision for a specific file
   * @param {string} file - File path
   * @returns {Decision|null} Decision or null if not found
   */
  getFileDecision(file) {
    return this.fileDecisions.get(file) || null;
  }

  /**
   * Get decisions for methods in a file
   * @param {string} file - File path
   * @returns {Map<string, Decision>|null} Method decisions or null
   */
  getMethodDecisions(file) {
    return this.methodDecisions.get(file) || null;
  }

  /**
   * Get statistics for a specific pattern
   * @param {string} pattern - Pattern to analyze
   * @returns {PatternAnalysis|null} Pattern analysis or null
   */
  getPatternStats(pattern) {
    if (!this.patternMatches.has(pattern)) {
      return null;
    }

    const examples = this.patternMatches.get(pattern);

    return {
      pattern,
      source: this.patternSources.get(pattern) || 'unknown',
      matchCount: examples.length,
      examples: examples.slice(0, this.options.maxExamples),
      unused: examples.length === 0
    };
  }
}

export default RuleTracer;
