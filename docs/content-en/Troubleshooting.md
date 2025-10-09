# Troubleshooting

<cite>
**Referenced Files in This Document**   
- [context-manager.js](file://context-manager.js)
- [README.md](file://README.md)
- [bin/cli.js](file://bin/cli.js)
</cite>

## Table of Contents
1. [Include/Exclude Mode Confusion](#includeexclude-mode-confusion)
2. [Pattern Matching Issues](#pattern-matching-issues)
3. [Token Counting Discrepancies](#token-counting-discrepancies)
4. [Missing Files in Analysis](#missing-files-in-analysis)
5. [Unexpected File Inclusions](#unexpected-file-inclusions)
6. [Performance Issues with Large Codebases](#performance-issues-with-large-codebases)
7. [Diagnostic Steps](#diagnostic-steps)
8. [Common Environment Issues](#common-environment-issues)

## Include/Exclude Mode Confusion

The context-manager tool uses a priority-based system for file inclusion and exclusion. The presence of a `.calculatorinclude` file takes precedence over `.calculatorignore`, which can lead to confusion when users expect files to be included but they're excluded.

When `.calculatorinclude` exists, the tool operates in INCLUDE mode, meaning only files matching the patterns in this file will be included in the analysis. This overrides any `.calculatorignore` rules. Users might expect files to be included based on their `.calculatorignore` configuration, but if a `.calculatorinclude` file exists, those expectations will not be met.

The tool clearly indicates which mode is active during execution. In INCLUDE mode, it displays "📅 Found calculator config - using INCLUDE mode", while in EXCLUDE mode it shows "📅 Found calculator config - using EXCLUDE mode". This visual cue helps identify the current filtering mode.

**Section sources**
- [context-manager.js](file://context-manager.js#L134-L157)
- [context-manager.js](file://context-manager.js#L181-L217)
- [README.md](file://README.md#L121-L150)

## Pattern Matching Issues

Pattern matching in the context-manager tool follows specific syntax rules that users must understand to configure their `.calculatorignore` and `.methodinclude` files correctly. Common issues include incorrect syntax, missing negation patterns, and misunderstanding of wildcard behavior.

The tool converts patterns to regular expressions for matching, with specific transformations:
- `**` becomes `.*` (matches any number of directories)
- `*` becomes `[^/]*` (matches any characters except directory separators)
- `?` becomes `[^/]` (matches any single character except directory separators)

Negation patterns (prefixed with `!`) work differently in INCLUDE versus EXCLUDE modes. In INCLUDE mode, negation patterns exclude files from the included set, while in EXCLUDE mode, they re-include files that would otherwise be excluded. A common mistake is placing negation patterns in the wrong order, as the tool processes patterns sequentially.

**Section sources**
- [context-manager.js](file://context-manager.js#L159-L179)
- [context-manager.js](file://context-manager.js#L219-L257)
- [README.md](file://README.md#L544-L610)

## Token Counting Discrepancies

The context-manager tool provides both exact and estimated token counts, which can lead to discrepancies that users might find confusing. The tool first attempts to use the tiktoken library for exact GPT-4 compatible token counting. If tiktoken is not available, it falls back to an estimation algorithm.

The estimation algorithm uses predefined characters-per-token ratios for different file types:
- JavaScript/TypeScript: 3.2 characters per token
- JSON: 2.5 characters per token
- Markdown: 4.0 characters per token
- HTML/XML: 2.8 characters per token
- Default: 3.5 characters per token

These estimates are typically around 95% accurate compared to exact counts. Users might notice differences between the estimated counts and what they expect from other tools. The tool clearly indicates which counting method is being used in the output: "🎯 Token calculation: ✅ Exact (using tiktoken)" for exact counts or "🎯 Token calculation: ⚠️ Estimated" for estimates.

**Section sources**
- [context-manager.js](file://context-manager.js#L259-L292)
- [context-manager.js](file://context-manager.js#L385-L400)
- [README.md](file://README.md#L801-L879)

## Missing Files in Analysis

Files may be missing from analysis due to the multi-layered filtering system. The tool respects three levels of configuration files in order of priority:
1. `.gitignore` (always respected)
2. `.calculatorinclude` (highest priority for inclusion)
3. `.calculatorignore` (used when no include file exists)

A file might be missing from analysis if it's excluded by any of these mechanisms. Even if a file is not explicitly mentioned in `.calculatorignore`, it might be excluded by a pattern like `**/*.md` or `node_modules/**`. Users should check all three configuration files to understand why a file is missing.

Additionally, the tool only analyzes text files, determined by file extension and basename. Files with extensions not in the recognized text extensions list or basenames not in the text files list will be skipped entirely, even if they're not explicitly ignored.

**Section sources**
- [context-manager.js](file://context-manager.js#L181-L217)
- [context-manager.js](file://context-manager.js#L414-L453)
- [README.md](file://README.md#L294-L356)

## Unexpected File Inclusions

Unexpected file inclusions can occur when users misunderstand the interaction between different configuration files. The most common cause is the presence of a `.calculatorinclude` file when the user expects EXCLUDE mode behavior. In INCLUDE mode, only files matching the patterns in `.calculatorinclude` are included, which might include files the user expected to be excluded.

Another cause is the use of broad patterns like `**/*.js` without proper negation. For example, if a user wants to include all JavaScript files except those in test directories, they need to explicitly add a negation pattern like `!**/*.test.js` or `!test/**`.

The tool's verbose output can help identify why files are being included. When running with the `--verbose` flag, the tool shows which mode is active and can help trace the inclusion logic.

**Section sources**
- [context-manager.js](file://context-manager.js#L134-L157)
- [context-manager.js](file://context-manager.js#L181-L217)
- [README.md](file://README.md#L544-L610)

## Performance Issues with Large Codebases

Performance issues with large codebases typically stem from the tool needing to scan and analyze every file in the project directory. The scanning process recursively traverses directories, which can be slow for deeply nested structures with many files.

The tool automatically skips certain directories like `node_modules`, `.git`, `dist`, and `build` to improve performance. However, if a codebase has many files in analyzable categories (JavaScript, TypeScript, Markdown, etc.), the analysis can still be time-consuming.

Method-level analysis (`--method-level` flag) significantly increases processing time as the tool needs to parse each file to extract method definitions and calculate tokens for each method individually. For very large codebases, this can result in noticeable delays.

**Section sources**
- [context-manager.js](file://context-manager.js#L455-L485)
- [context-manager.js](file://context-manager.js#L521-L545)
- [bin/cli.js](file://bin/cli.js#L20-L35)

## Diagnostic Steps

To diagnose issues with the context-manager tool, users should follow these steps:

1. Run the tool with the `--verbose` flag to see detailed output about which files are being processed and which rules are being applied.

2. Check the initial output to determine which mode is active (INCLUDE or EXCLUDE) and which configuration file is being used.

3. Use the `--save-report` option to generate a detailed JSON report that includes information about all processed files, their token counts, and which rules were applied.

4. Examine the configuration files (`.gitignore`, `.calculatorignore`, `.calculatorinclude`) for conflicting or incorrect patterns.

5. Verify that the tiktoken dependency is installed if exact token counts are required.

The tool provides clear visual indicators in its output that help with diagnosis, such as the number of files ignored due to `.gitignore` rules versus calculator rules, and whether exact or estimated token counting is being used.

**Section sources**
- [context-manager.js](file://context-manager.js#L609-L643)
- [context-manager.js](file://context-manager.js#L715-L743)
- [bin/cli.js](file://bin/cli.js#L41-L66)

## Common Environment Issues

Common environment issues include missing dependencies and permission errors. The most frequent dependency issue is the absence of the tiktoken library, which is required for exact token counting. When tiktoken is not installed, the tool automatically falls back to estimation mode, but users should install it via `npm install tiktoken` for accurate results.

Permission errors can occur when the tool doesn't have read access to certain files or directories in the codebase. This might happen when running the tool in restricted environments or when file permissions are set too narrowly. Users should ensure the tool has appropriate read permissions for all files they want to analyze.

Another common issue is running the tool from the wrong directory. The tool analyzes the current working directory by default, so users must ensure they're in the correct project root when executing the command.

**Section sources**
- [context-manager.js](file://context-manager.js#L259-L292)
- [context-manager.js](file://context-manager.js#L825-L840)
- [README.md](file://README.md#L294-L356)