# Preset System

The Preset System provides predefined configurations for common use cases, making it easy to analyze your codebase without manually configuring filters every time.

## Overview

Presets are pre-configured analysis profiles that include:
- File include/exclude patterns
- Method include/exclude patterns
- Analysis options (method-level, gitingest, etc.)
- Token budget settings
- Metadata and descriptions

## Available Presets

### 1. Default ⚙️
**ID:** `default`  
**Description:** Standard analysis with balanced settings

Best for:
- General codebase analysis
- Initial project exploration
- Standard development workflows

### 2. Code Review 👀
**ID:** `review`  
**Description:** Focus on core logic and changed files for code reviews

Best for:
- Pull request reviews
- Understanding code changes
- Identifying potential issues
- Architecture review

### 3. LLM Explain 💡
**ID:** `llm-explain`  
**Description:** Ultra-compact context optimized for LLM consumption

Best for:
- Explaining code to AI assistants
- Generating documentation
- Understanding architecture
- Quick code summaries

### 4. Pair Programming 👥
**ID:** `pair-program`  
**Description:** Interactive development context with full details

Best for:
- Pair programming sessions
- Live coding with AI
- Interactive development
- Real-time code assistance

### 5. Security Audit 🔒
**ID:** `security-audit`  
**Description:** Focus on security-relevant code patterns

Best for:
- Security audits
- Vulnerability assessment
- Authentication review
- Cryptography analysis

### 6. Documentation 📚
**ID:** `documentation`  
**Description:** Public API surfaces and documentation

Best for:
- Generating API documentation
- Understanding public interfaces
- Creating user guides
- API reference generation

### 7. Minimal 🎯
**ID:** `minimal`  
**Description:** Absolute minimum context for quick analysis

Best for:
- Quick project overview
- Entry point analysis
- Minimal context needs
- Fast initial assessment

### 8. Full Analysis 🔍
**ID:** `full`  
**Description:** Complete codebase analysis with all details

Best for:
- Comprehensive analysis
- Complete codebase understanding
- Detailed documentation
- Full project assessment

## CLI Usage

### List Available Presets

```bash
context-manager --list-presets
```

### Show Preset Details

```bash
context-manager --preset-info review
context-manager --preset-info llm-explain
```

### Use a Preset

```bash
# Basic usage
context-manager --preset review

# With additional options
context-manager --preset llm-explain --target-tokens 50k
context-manager --preset security-audit --trace-rules
context-manager --preset review --cli --save-report
```

## Programmatic Usage

```javascript
import { PresetManager } from '@hakkisagdic/context-manager';

// Create manager
const manager = new PresetManager();

// List all presets
const presets = manager.listPresets();
console.log('Available presets:', presets);

// Get preset details
const preset = manager.getPreset('review');
console.log('Preset:', preset);

// Apply preset
const applied = manager.applyPreset('review', process.cwd());
console.log('Applied preset:', applied.presetId);
console.log('Temporary files:', applied.tempFiles);

// Use preset options
const options = {
  ...applied.options,
  projectRoot: process.cwd()
};

// Cleanup when done
manager.cleanup(applied);
```

## Preset Structure

Presets are defined in `presets.json`:

```json
{
  "id": "review",
  "name": "Code Review",
  "icon": "👀",
  "description": "Focus on core logic and changed files",
  "filters": {
    "include": ["src/**/*.js", "lib/**/*.ts"],
    "exclude": ["**/*.test.js", "docs/**"],
    "methodInclude": ["*Handler", "*Manager"],
    "methodExclude": ["*test*", "*debug*"]
  },
  "options": {
    "methodLevel": true,
    "gitingest": true,
    "targetTokens": 100000,
    "fitStrategy": "auto"
  },
  "metadata": {
    "tags": ["review", "pr"],
    "bestFor": [
      "Pull request reviews",
      "Code change analysis"
    ]
  }
}
```

## Creating Custom Presets

To create a custom preset:

1. Edit `lib/presets/presets.json`
2. Add your preset definition following the structure above
3. Validate the preset structure
4. Use your custom preset with `--preset <your-id>`

### Preset Validation Rules

- `id`: Required, unique, kebab-case string
- `name`: Required, display name
- `description`: Required, short description
- `filters`: Required object with optional arrays:
  - `include`: File include patterns
  - `exclude`: File exclude patterns
  - `methodInclude`: Method include patterns
  - `methodExclude`: Method exclude patterns
- `options`: Required object with optional fields:
  - `methodLevel`: Boolean
  - `gitingest`: Boolean
  - `sortBy`: String
  - `targetTokens`: Number
  - `fitStrategy`: String
- `metadata`: Optional object with:
  - `header`: Custom header text
  - `tags`: Array of tags
  - `bestFor`: Array of use case descriptions

## How Presets Work

1. **Preset Selection**: User specifies `--preset <name>`
2. **Preset Loading**: PresetManager loads preset from `presets.json`
3. **File Creation**: Temporary filter files are created:
   - `.contextinclude-<preset-id>`
   - `.contextignore-<preset-id>`
   - `.methodinclude-<preset-id>`
   - `.methodignore-<preset-id>`
4. **Active Files**: Active filter files are created/updated:
   - `.contextinclude` (copy of preset include)
   - `.contextignore` (copy of preset exclude)
   - `.methodinclude` (copy of preset method include)
   - `.methodignore` (copy of preset method exclude)
5. **Analysis**: Context Manager runs with preset configuration
6. **Cleanup**: Temporary files are removed after analysis

## Option Precedence

When using presets with CLI flags, the precedence is:

1. **CLI flags** (highest priority)
2. **Preset options**
3. **Default values** (lowest priority)

Example:
```bash
# Preset specifies methodLevel: true
# CLI overrides with explicit flag
context-manager --preset review --no-method-level
# Result: methodLevel = false (CLI wins)
```

## Error Handling

### Preset Not Found
```bash
$ context-manager --preset invalid
❌ Preset "invalid" not found
   Use --list-presets to see available presets
```

### Invalid Preset Structure
```bash
❌ Invalid preset "custom": Missing or invalid "filters" field
```

### Preset Load Failure
```bash
❌ Failed to load presets: presets.json not found
   Continuing with default configuration...
```

## Tips and Best Practices

1. **Start with presets**: Use presets for common tasks instead of manual configuration
2. **Combine with flags**: Enhance presets with additional CLI flags
3. **Review preset details**: Use `--preset-info` to understand what a preset does
4. **Create custom presets**: Tailor presets to your team's workflow
5. **Use with token budget**: Combine presets with `--target-tokens` for optimal results

## Examples

### Code Review Workflow
```bash
# Review changed files with compact output
context-manager --preset review --changed-since main

# Review with detailed tracing
context-manager --preset review --trace-rules

# Review with token budget
context-manager --preset review --target-tokens 80k
```

### LLM Integration Workflow
```bash
# Generate compact context for AI
context-manager --preset llm-explain --context-clipboard

# Fit to specific LLM context window
context-manager --preset llm-explain --target-tokens 50k

# Export for Claude Sonnet
context-manager --preset llm-explain --target-model claude-sonnet-4.5
```

### Security Audit Workflow
```bash
# Audit security-relevant code
context-manager --preset security-audit --save-report

# Audit with method-level detail
context-manager --preset security-audit -m --trace-rules

# Export security audit
context-manager --preset security-audit --gitingest
```

## Troubleshooting

### Preset doesn't include expected files
- Use `--trace-rules` to see why files are excluded
- Check preset filters with `--preset-info <name>`
- Verify your project structure matches preset patterns

### Preset creates too much output
- Use `--target-tokens` to limit output size
- Try a more focused preset (e.g., `minimal` instead of `full`)
- Combine with `--fit-strategy` for intelligent reduction

### Temporary files not cleaned up
- Preset cleanup happens automatically
- Check for error messages during analysis
- Manually remove `.context*-<preset-id>` files if needed

## Version History

- **v3.1.0**: Initial release with 8 default presets
- Preset system with validation
- CLI integration
- Programmatic API

## See Also

- [Token Budget Fitter](../optimizers/README.md) - Optimize token usage
- [Rule Tracer](../debug/README.md) - Debug filter rules
- [Main README](../../README.md) - Context Manager documentation
