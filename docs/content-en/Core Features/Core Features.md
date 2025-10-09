# Core Features

<cite>
**Referenced Files in This Document**   
- [context-manager.js](file://context-manager.js)
- [README.md](file://README.md)
- [index.js](file://index.js)
</cite>

## Table of Contents
1. [File-Level Analysis](#file-level-analysis)
2. [Method-Level Analysis](#method-level-analysis)
3. [Token Counting](#token-counting)
4. [Feature Integration](#feature-integration)
5. [Common Issues and Performance](#common-issues-and-performance)

## File-Level Analysis

The context-manager tool implements a comprehensive file-level analysis system that combines multiple filtering mechanisms to determine which files should be included in the token calculation process. The tool begins by scanning the entire directory structure starting from the project root, recursively traversing directories while respecting exclusion rules.

The file scanning process is implemented in the `scanDirectory` method of the `TokenCalculator` class, which examines each file and directory in the project. During this process, the tool applies a hierarchical filtering system that respects both `.gitignore` patterns and custom configuration files. Files are only included in the analysis if they pass all filtering criteria and are identified as text files through the `isTextFile` method, which checks file extensions and base names against a predefined list of text-based formats.

The filtering system prioritizes configuration files in a specific order: `.gitignore` rules are always respected, followed by `.calculatorinclude` (which takes precedence in INCLUDE mode), and then `.calculatorignore` (used in EXCLUDE mode when no include file exists). This multi-layered approach ensures that developers can precisely control which files are analyzed, allowing for focused examination of core application logic while excluding documentation, configuration, and test files.

**Section sources**
- [context-manager.js](file://context-manager.js#L376-L406)
- [context-manager.js](file://context-manager.js#L288-L315)
- [README.md](file://README.md#L294-L356)

## Method-Level Analysis

The context-manager tool provides sophisticated method-level analysis capabilities for JavaScript and TypeScript files, enabling granular examination of individual functions within code files. This feature is implemented through the `MethodAnalyzer` and `MethodFilterParser` classes, which work together to extract and filter methods based on configurable rules.

The `MethodAnalyzer` class uses a series of regular expressions to identify various JavaScript function patterns, including traditional function declarations, object method syntax, arrow functions, and async functions. When method-level analysis is enabled via the `--method-level` flag, the tool extracts all methods from eligible code files and captures metadata such as method name and line number. The `extractMethodContent` method then isolates the complete method body for individual token counting.

Method filtering is controlled by `.methodinclude` and `.methodignore` configuration files, which allow developers to include or exclude specific methods using pattern matching. The `MethodFilterParser` class processes these files, converting glob patterns to regular expressions for efficient matching. When an include file is present, only methods matching the specified patterns are included; otherwise, the tool excludes methods matching patterns in the ignore file. This system supports various pattern types including exact matches, wildcards, class-specific methods (using `Class.*` syntax), and file-specific methods (using `file.method` syntax).

**Section sources**
- [context-manager.js](file://context-manager.js#L14-L67)
- [context-manager.js](file://context-manager.js#L69-L109)
- [context-manager.js](file://context-manager.js#L357-L377)
- [README.md](file://README.md#L544-L610)

## Token Counting

The context-manager tool employs a dual approach to token counting, prioritizing accuracy while providing a reliable fallback mechanism. The primary method uses the `tiktoken` library to provide exact GPT-4 compatible token counts, which is essential for accurately estimating how much code can fit within an LLM's context window. When the `tiktoken` package is installed, the tool uses the `cl100k_base` encoding (used by GPT-4, ChatGPT-4, and text-embedding-ada-002) to encode the text content and count tokens precisely.

The token counting process is implemented in the `calculateTokens` method of the `TokenCalculator` class, which attempts to use `tiktoken` first and falls back to estimation if the library is not available or if an error occurs. The estimation mechanism uses a character-based approach with different ratios for various file types, as different file formats have different average characters per token. For example, JavaScript and TypeScript files use a ratio of 3.2 characters per token, while Markdown files use 4.0, and JSON files use 2.5. This estimation provides approximately 95% accuracy compared to exact counting.

The tool also tracks token statistics at multiple levels, including per-file, per-extension, and per-directory counts, providing detailed insights into the codebase composition. When method-level analysis is enabled, the tool additionally counts tokens for individual methods, allowing developers to identify particularly large or complex functions that might need refactoring.

**Section sources**
- [context-manager.js](file://context-manager.js#L253-L286)
- [context-manager.js](file://context-manager.js#L288-L315)
- [README.md](file://README.md#L356)

## Feature Integration

The core features of the context-manager tool are orchestrated through the `TokenCalculator` class, which integrates file-level analysis, method-level analysis, and token counting into a cohesive workflow. The `run` method serves as the main entry point, coordinating the entire analysis process from directory scanning to final reporting.

The integration begins with initialization of the various components: the `GitIgnoreParser` for file filtering, the `MethodAnalyzer` and `MethodFilterParser` for method extraction (when enabled), and the token counting system. The tool then scans the directory structure, applying filtering rules to determine which files to analyze. For each included file, it reads the content and calculates tokens, optionally extracting and analyzing individual methods when the `methodLevel` option is enabled.

The results are aggregated in comprehensive statistics that track files, tokens, bytes, and lines at various levels of granularity. The tool can generate different output formats depending on the use case: a compact format for LLM context optimization, a detailed method-level context when requested, or a comprehensive JSON report for analysis and monitoring. The `generateLLMContext` method creates structured output that can be exported to a file or copied to the clipboard, making it easy to share codebase context with AI assistants.

**Section sources**
- [context-manager.js](file://context-manager.js#L213-L251)
- [context-manager.js](file://context-manager.js#L498-L539)
- [context-manager.js](file://context-manager.js#L774-L813)

## Common Issues and Performance

The context-manager tool addresses several common issues that arise in code analysis, particularly around pattern matching accuracy and token counting precision. One common issue is pattern matching failures, which can occur when configuration files contain syntax errors or when negation patterns (`!pattern`) are not properly understood. The tool provides verbose output to help diagnose these issues, showing which mode is active (INCLUDE or EXCLUDE) and how many rules were loaded from each configuration file.

For large codebases, performance is optimized through several mechanisms. The tool avoids unnecessary file reads by first checking filtering rules before processing file content. It also uses efficient regular expressions for method extraction and pattern matching, compiling patterns once during initialization rather than repeatedly. The directory scanning process skips common exclusion directories like `node_modules`, `.git`, and `dist` by default, reducing the number of filesystem operations.

Inaccurate token counts can occur when the `tiktoken` library is not installed, forcing the tool to rely on estimation. While the estimation is generally accurate (~95% compared to exact counts), it may vary depending on the specific characteristics of the code. Developers working with strict token limits should install `tiktoken` for precise counting. The tool also provides detailed reporting that breaks down token usage by file type and directory, helping identify unexpected large files or directories that might be skewing the overall count.

**Section sources**
- [context-manager.js](file://context-manager.js#L253-L286)
- [context-manager.js](file://context-manager.js#L376-L406)
- [README.md](file://README.md#L544-L610)