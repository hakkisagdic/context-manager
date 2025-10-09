# CLI Reference

<cite>
**Referenced Files in This Document**   
- [bin/cli.js](file://bin/cli.js)
- [context-manager.js](file://context-manager.js)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Command Syntax](#command-syntax)
3. [Available Options](#available-options)
4. [Interactive Export Selection](#interactive-export-selection)
5. [Usage Examples](#usage-examples)
6. [Exit Codes and Error Handling](#exit-codes-and-error-handling)
7. [Performance Considerations](#performance-considerations)
8. [Shell Script Integration](#shell-script-integration)
9. [Troubleshooting Guide](#troubleshooting-guide)

## Introduction
The context-manager CLI provides a comprehensive tool for analyzing codebases and optimizing context for LLM consumption. It offers method-level filtering, exact token counting, and multiple export formats to support AI-assisted development workflows. The tool respects both .gitignore and custom ignore/include rules, providing flexible configuration options for different analysis scenarios.

**Section sources**
- [README.md](file://README.md#L0-L891)

## Command Syntax
The basic syntax for the context-manager CLI is:
```
context-manager [options]
```

The command accepts various options that control the analysis behavior, output format, and export destinations. When no options are specified, the tool runs in interactive mode, prompting the user to select export options after completing the analysis.

**Section sources**
- [bin/cli.js](file://bin/cli.js#L4-L25)
- [context-manager.js](file://context-manager.js#L815-L830)

## Available Options
The context-manager CLI supports the following options:

### --save-report (-s)
Saves a detailed JSON report of the analysis to token-analysis-report.json in the project root.

**Behavior**: Generates a comprehensive report containing metadata, summary statistics, and detailed information about each analyzed file.

**Return value**: Creates token-analysis-report.json file with structured analysis data.

### --no-verbose
Disables verbose output mode, suppressing the display of included files and directories during analysis.

**Behavior**: Runs the analysis without showing the list of files being processed, providing a cleaner output.

**Return value**: Standard analysis report without file listing details.

### --context-export
Generates an LLM context file list and saves it as llm-context.json in the project root.

**Behavior**: Creates a JSON file containing optimized project context suitable for LLM consumption.

**Return value**: Creates llm-context.json file with project metadata and organized file paths.

### --context-clipboard
Copies the LLM context directly to the system clipboard.

**Behavior**: Generates the context in JSON format and copies it to the clipboard using platform-specific commands (pbcopy on macOS, xclip/xsel on Linux, clip on Windows).

**Return value**: Context data copied to clipboard; displays character count upon success.

### --detailed-context
Uses the detailed context format instead of the default compact format.

**Behavior**: Generates a more comprehensive context output with additional metadata, categories, and importance scores.

**Return value**: Larger context output (~8.6k characters) with enhanced information.

### --method-level (-m)
Enables method-level analysis mode.

**Behavior**: Extracts and analyzes individual methods from JavaScript/TypeScript files, applying method-level filtering rules from .methodinclude and .methodignore files.

**Return value**: Includes method-specific information in the output, including method names, line numbers, and token counts.

### --help (-h)
Displays the help message with available options and usage examples.

**Behavior**: Prints the help text to stdout and exits.

**Return value**: None; terminates the program after displaying help.

**Section sources**
- [README.md](file://README.md#L0-L891)
- [bin/cli.js](file://bin/cli.js#L4-L25)

## Interactive Export Selection
When the context-manager is run without specifying any export options (--save-report, --context-export, or --context-clipboard), it automatically activates the interactive export selection feature. After completing the analysis, the tool presents a menu with four export options:

1. Save detailed JSON report (token-analysis-report.json)
2. Generate LLM context file (llm-context.json)
3. Copy LLM context to clipboard
4. No export (skip)

The user is prompted to enter a number (1-4) to select their preferred export option. This interactive mode ensures that users can choose the most appropriate export format after reviewing the analysis results, preventing missed opportunities to export valuable context data.

**Section sources**
- [README.md](file://README.md#L0-L891)
- [context-manager.js](file://context-manager.js#L618-L637)

## Usage Examples
The following examples demonstrate common command combinations:

### Method-level analysis with clipboard export
```bash
context-manager --method-level --context-clipboard
```
This command performs method-level analysis and copies the resulting context to the clipboard, ideal for quickly sharing focused code context with AI assistants.

### Save report with verbose output
```bash
context-manager --save-report --verbose
```
This combination saves a detailed JSON report while showing all included files during analysis, useful for comprehensive codebase reviews.

### Combined analysis with multiple outputs
```bash
context-manager --method-level --save-report --context-export --verbose
```
This command performs method-level analysis with verbose output while generating both a detailed report and an LLM context file, suitable for CI/CD pipelines and thorough codebase documentation.

**Section sources**
- [README.md](file://README.md#L0-L891)

## Exit Codes and Error Handling
The context-manager CLI implements robust error handling mechanisms:

- **Success (exit code 0)**: Analysis completed successfully with all requested operations performed.
- **Invalid option (exit code 1)**: The command was called with unrecognized or malformed options.
- **File system error (exit code 1)**: Issues accessing files or directories during analysis.
- **Clipboard error**: When clipboard operations fail, the tool falls back to saving the context to llm-context.json with a warning message.

The tool gracefully handles missing configuration files and provides informative error messages. When tiktoken is not available for exact token counting, it falls back to smart estimation with a warning.

**Section sources**
- [context-manager.js](file://context-manager.js#L750-L772)
- [test/test-suite.js](file://test/test-suite.js#L0-L280)

## Performance Considerations
When analyzing large codebases, consider the following performance optimizations:

- Use .calculatorinclude to restrict analysis to essential files only
- Enable method-level analysis to focus on specific functionality
- Avoid verbose mode for large repositories to reduce output processing
- Use the compact context format for faster processing and smaller output

The tool is optimized for performance with efficient directory scanning and token counting algorithms. For very large codebases, the initial scan may take several seconds, but subsequent analyses benefit from the filtering rules that reduce the number of files processed.

**Section sources**
- [README.md](file://README.md#L0-L891)
- [context-manager.js](file://context-manager.js#L225-L790)

## Shell Script Integration
The context-manager CLI can be integrated into shell scripts for automated workflows:

```bash
# Check if codebase exceeds token budget
TOKENS=$(context-manager --context-export --no-verbose | jq '.project.totalTokens')
if [ $TOKENS -gt 100000 ]; then
  echo "Codebase too large for LLM context!"
  exit 1
fi
```

```bash
# Daily analysis with timestamped reports
context-manager --save-report > reports/analysis-$(date +%Y%m%d).json
```

The tool's predictable output format and exit codes make it suitable for use in CI/CD pipelines, pre-commit hooks, and automated documentation generation workflows.

**Section sources**
- [README.md](file://README.md#L0-L891)

## Troubleshooting Guide
### Command not found
Ensure the package is installed globally:
```bash
npm install -g @hakkisagdic/context-manager
```

### Invalid options
Verify the option names and syntax. Use --help to see valid options.

### Permission errors
On some systems, clipboard operations may require additional permissions. The tool automatically falls back to file output when clipboard access is denied.

### Missing expected files
Check if files are excluded by .gitignore or calculator rules. Use verbose mode to see which files are being processed.

### Token count discrepancies
Ensure tiktoken is installed for exact token counting. Without tiktoken, the tool uses estimation based on file type.

**Section sources**
- [README.md](file://README.md#L0-L891)
- [test/test.js](file://test/test.js#L0-L61)