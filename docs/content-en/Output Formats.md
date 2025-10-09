# Output Formats

<cite>
**Referenced Files in This Document**   
- [README.md](file://README.md)
- [context-manager.js](file://context-manager.js)
- [bin/cli.js](file://bin/cli.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Detailed JSON Report](#detailed-json-report)
3. [LLM Context Formats](#llm-context-formats)
4. [Clipboard Format](#clipboard-format)
5. [Use Cases and Performance](#use-cases-and-performance)
6. [Parsing Strategies](#parsing-strategies)

## Introduction

The context-manager tool provides three primary output formats for different use cases in AI-assisted development workflows. These formats serve distinct purposes in code analysis, LLM context optimization, and project documentation. The tool generates a detailed JSON report for comprehensive analysis, creates LLM context files in both compact and detailed formats, and supports clipboard integration for quick sharing. All export formats maintain consistent structure between file and clipboard outputs, ensuring reliability across different usage scenarios.

**Section sources**
- [README.md](file://README.md#L1-L891)

## Detailed JSON Report

The detailed JSON report provides comprehensive analysis of the codebase with complete metadata, summary statistics, file-level details, and method-level data when applicable. This format is generated when using the `--save-report` flag or selecting the appropriate option in interactive mode.

The report structure consists of three main sections:
- **metadata**: Contains generation timestamp, project root path, and configuration rules from .gitignore and calculator configuration files
- **summary**: Includes comprehensive statistics such as total files analyzed, token counts, file type distribution, and largest files/directories
- **files**: Contains detailed information for each analyzed file including path, token count, size, lines, and extension

When method-level analysis is enabled with the `--method-level` flag, additional method-specific data is included in the file objects, providing granular insights into individual functions and their token usage.

```mermaid
classDiagram
class DetailedJSONReport {
+metadata : object
+summary : object
+files : array
}
class Metadata {
+generatedAt : string
+projectRoot : string
+gitignoreRules : array
+calculatorRules : array
}
class Summary {
+totalFiles : number
+totalTokens : number
+byExtension : object
+largestFiles : array
+byDirectory : object
}
class File {
+path : string
+relativePath : string
+sizeBytes : number
+tokens : number
+lines : number
+extension : string
+methods? : array
}
DetailedJSONReport --> Metadata
DetailedJSONReport --> Summary
DetailedJSONReport --> File
```

**Diagram sources**
- [context-manager.js](file://context-manager.js#L784-L799)

**Section sources**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L784-L799)

## LLM Context Formats

The context-manager tool offers two distinct LLM context formats optimized for different use cases: an ultra-compact format used by default and a detailed format activated with the `--detailed-context` flag. Both formats are designed to provide essential project context for AI assistants while minimizing token usage.

### Compact Format (~2.3k characters)

The default compact format provides a minimal yet structured representation of the codebase, containing approximately 2.3k characters in JSON format. This format includes:
- Project metadata (root directory, total files, total tokens)
- Organized file paths grouped by directory with common prefix compression
- Removal of file extensions to save space
- Directory grouping to minimize redundancy

The compact format prioritizes efficiency and is ideal for frequent AI interactions where token economy is crucial. It maintains the complete JSON structure identical to the llm-context.json file.

### Detailed Format (~8.6k characters)

The detailed format, activated with `--detailed-context`, provides a more comprehensive context at approximately 8.6k characters. This format includes:
- Full file paths with extensions
- Importance scores based on token count and project structure
- Directory statistics and file categorization
- Method-level data when method analysis is enabled
- Additional metadata for project understanding

The detailed format is suitable for initial project analysis, comprehensive documentation, and situations requiring deeper context understanding.

```mermaid
classDiagram
class LLMContext {
+project : object
+paths? : object
+methods? : object
+methodStats? : object
}
class ProjectMetadata {
+root : string
+totalFiles : number
+totalTokens : number
}
class Paths {
+directoryPath : array
}
class Methods {
+filePath : array
}
class MethodStats {
+totalMethods : number
+includedMethods : number
+totalMethodTokens : number
}
LLMContext --> ProjectMetadata
LLMContext --> Paths
LLMContext --> Methods
LLMContext --> MethodStats
```

**Diagram sources**
- [context-manager.js](file://context-manager.js#L482-L503)
- [context-manager.js](file://context-manager.js#L521-L545)
- [context-manager.js](file://context-manager.js#L505-L519)

**Section sources**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L482-L545)

## Clipboard Format

The clipboard format in context-manager maintains identical structure to the file-based exports, ensuring consistency across different output methods. When using the `--context-clipboard` flag, the tool copies the same JSON structure that would be saved to llm-context.json directly to the system clipboard.

The implementation handles cross-platform clipboard operations:
- **macOS**: Uses `pbcopy` command
- **Linux**: Attempts `xclip` first, falls back to `xsel` if unavailable
- **Windows**: Uses `clip` command
- **Other platforms**: Provides fallback to file saving if clipboard operation fails

If the clipboard operation fails for any reason, the tool automatically saves the context to llm-context.json as a fallback, ensuring the user always receives the output regardless of platform limitations.

```mermaid
sequenceDiagram
participant User
participant Tool as context-manager
participant Clipboard
participant File as llm-context.json
User->>Tool : --context-clipboard
Tool->>Tool : generateLLMContext()
Tool->>Clipboard : Copy JSON (platform-specific)
alt Success
Clipboard-->>Tool : Success
Tool-->>User : "Context copied to clipboard!"
else Failure
Tool->>File : saveContextToFile()
File-->>Tool : Saved
Tool-->>User : "Failed to copy... saved to file"
end
```

**Diagram sources**
- [context-manager.js](file://context-manager.js#L547-L579)

**Section sources**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L547-L579)

## Use Cases and Performance

The different output formats serve specific use cases in development workflows:

**Compact Format Use Cases:**
- **LLM Integration**: Structured data for AI assistants with complete project context
- **Programmatic Processing**: JSON format for automated tools and scripts
- **Context Sharing**: Identical format in clipboard and file exports
- **Development Workflows**: Consistent structure for CI/CD and automation

**Detailed Format Use Cases:**
- **Architecture Planning**: Comprehensive project overview for major decisions
- **New Team Member Onboarding**: Complete codebase understanding
- **Documentation Generation**: Full project structure analysis
- **Code Review Preparation**: Detailed file relationships and importance

**Performance Considerations:**
- The compact format reduces context size by approximately 89% compared to the full codebase
- Token counting uses tiktoken for GPT-4 compatibility when available, with estimation fallback
- Directory grouping and common prefix compression optimize space usage
- Method-level analysis adds overhead but provides granular context for focused debugging

**Section sources**
- [README.md](file://README.md#L1-L891)

## Parsing Strategies

Downstream processing of context-manager outputs can leverage the consistent JSON structure across formats:

**For Detailed JSON Reports:**
- Extract metadata for audit trails and version tracking
- Analyze file-level statistics for codebase health monitoring
- Process method-level data for focused analysis of critical functions
- Generate visualizations from extension and directory statistics

**For LLM Context Formats:**
- Parse project metadata to understand scope and scale
- Traverse path groups to reconstruct directory structure
- Utilize method information for targeted code analysis
- Integrate with AI tools that accept structured project context

**General Parsing Recommendations:**
- Validate JSON structure before processing
- Handle optional fields (methods, methodStats) gracefully
- Use streaming parsers for large reports
- Cache parsed results to avoid repeated processing
- Implement error handling for malformed or incomplete data

**Section sources**
- [README.md](file://README.md#L1-L891)
- [context-manager.js](file://context-manager.js#L482-L545)