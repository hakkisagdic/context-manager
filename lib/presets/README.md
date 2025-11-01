# Preset System

The preset system provides pre-configured analysis recipes for common use cases. Each preset defines filters, options, and token limits optimized for specific workflows.

## Available Presets

### `default`
**Standard codebase analysis**
- All features enabled
- No special filtering
- Good for general-purpose analysis

**Usage:**
```bash
context-manager --preset default
```

---

### `review`
**Code review focus**
- Excludes tests, docs, build files
- Includes only `src/` and `lib/` source files
- Method-level analysis enabled
- Generates GitIngest digest
- Target: 100k tokens max

**Usage:**
```bash
context-manager --preset review
context-manager --preset review --save-report
```

**Best for:**
- Code reviews
- Pull request analysis
- Core logic inspection

---

### `llm-explain`
**Ultra-compact LLM context**
- Maximum compression for AI assistants
- Core files only, no tests/docs
- Method-level with method filtering
- Excludes debug/test/logger methods
- Auto-copies to clipboard
- Target: 50k tokens max

**Usage:**
```bash
context-manager --preset llm-explain
```

**Best for:**
- ChatGPT/Claude context
- Quick AI explanations
- Minimal token usage
- Frequent LLM interactions

---

### `pair-program`
**Interactive development**
- Includes recent changes and core logic
- Method-level analysis
- Verbose output for transparency
- Target: 80k tokens max

**Usage:**
```bash
context-manager --preset pair-program
```

**Best for:**
- Pair programming sessions
- Interactive development
- Real-time code exploration

---

### `security-audit`
**Security-focused analysis**
- Focuses on auth, validation, API handlers
- Includes security-relevant methods
- Method filters: `*auth*`, `*validate*`, `*handler*`
- Generates comprehensive report
- Target: 120k tokens max

**Usage:**
```bash
context-manager --preset security-audit
```

**Best for:**
- Security audits
- Authentication review
- Input validation checks
- API endpoint analysis

---

### `documentation`
**API documentation generation**
- Public API surfaces and interfaces
- Includes markdown documentation
- Excludes internal/private methods
- Target: 150k tokens max

**Usage:**
```bash
context-manager --preset documentation
```

**Best for:**
- API documentation
- Public interface analysis
- External consumption

---

### `minimal`
**Absolute minimum context**
- Entry points and core classes only
- Includes: `index.js`, `src/main.js`, `src/app.js`
- Ultra-compact for quick reference
- Target: 20k tokens max

**Usage:**
```bash
context-manager --preset minimal
```

**Best for:**
- Quick project overview
- Entry point analysis
- Architecture at a glance

---

### `full`
**Complete codebase**
- Everything except node_modules and .git
- Includes tests, docs, configs
- No token limit
- File-level analysis

**Usage:**
```bash
context-manager --preset full
```

**Best for:**
- Comprehensive analysis
- Archival purposes
- Complete project snapshot

---

## Using Presets

### Basic Usage
```bash
# Use a preset
context-manager --preset review

# List all available presets
context-manager --list-presets

# Get preset information
context-manager --preset-info review
```

### Combining with Options
```bash
# Override preset options
context-manager --preset review --verbose
context-manager --preset llm-explain --save-report

# Combine with other flags
context-manager --preset security-audit --context-export
```

### Programmatic Usage
```javascript
const PresetManager = require('./lib/presets/preset-manager');

const manager = new PresetManager();

// List all presets
const presets = manager.listPresets();
console.log(presets);

// Get a preset
const reviewPreset = manager.getPreset('review');

// Apply preset to options
const options = manager.applyPreset('review', {
  verbose: true,  // Override preset option
  projectRoot: './src'
});

// Use with TokenCalculator
const { TokenCalculator } = require('./index');
const calculator = new TokenCalculator('./src', options);
calculator.run();
```

## Preset Configuration Format

Presets are defined in `presets.json`:

```json
{
  "preset-name": {
    "name": "Display Name",
    "description": "Brief description of preset purpose",
    "header": "Header text for digest output",
    "filters": {
      "exclude": ["**/*.test.js", "**/node_modules/**"],
      "include": ["src/**/*.js", "lib/**/*.js"]
    },
    "methodFilters": {
      "exclude": ["*test*", "*debug*"],
      "include": ["*Handler", "*Validator"]
    },
    "options": {
      "methodLevel": true,
      "gitingest": true,
      "verbose": false,
      "saveReport": true,
      "contextExport": true
    },
    "maxTokens": 100000
  }
}
```

### Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Human-readable preset name |
| `description` | string | Brief description of purpose |
| `header` | string | Header text for digest output |
| `filters.exclude` | array | File patterns to exclude |
| `filters.include` | array | File patterns to include |
| `methodFilters.exclude` | array | Method patterns to exclude |
| `methodFilters.include` | array | Method patterns to include |
| `options` | object | Analysis options |
| `maxTokens` | number\|null | Maximum token limit (null = no limit) |

### Available Options

| Option | Type | Description |
|--------|------|-------------|
| `methodLevel` | boolean | Enable method-level analysis |
| `gitingest` | boolean | Generate GitIngest digest |
| `verbose` | boolean | Show detailed output |
| `saveReport` | boolean | Save JSON report |
| `contextExport` | boolean | Generate LLM context file |
| `contextToClipboard` | boolean | Copy to clipboard |

## Creating Custom Presets

To create a custom preset:

1. Edit `lib/presets/presets.json`
2. Add your preset configuration
3. Test with `context-manager --preset your-preset`

Example custom preset:

```json
{
  "my-custom": {
    "name": "My Custom Preset",
    "description": "Custom preset for my workflow",
    "filters": {
      "exclude": ["**/legacy/**"],
      "include": ["src/**/*.js"]
    },
    "options": {
      "methodLevel": true,
      "verbose": true
    },
    "maxTokens": 75000
  }
}
```

## Preset Priority

When using presets with existing filter files:

1. **Preset filters** are applied temporarily
2. **User filter files** (`.calculatorinclude`, `.calculatorignore`) are preserved
3. **Command-line options** override preset options
4. **Temp files** are cleaned up after analysis

## Examples

### Workflow: Code Review
```bash
# Step 1: Analyze with review preset
context-manager --preset review

# Step 2: Save report for records
context-manager --preset review --save-report

# Step 3: Generate digest for sharing
# (already done by preset, digest.txt is created)
```

### Workflow: LLM Assistance
```bash
# Quick context for AI assistant
context-manager --preset llm-explain

# Context is automatically copied to clipboard
# Paste into ChatGPT/Claude
```

### Workflow: Security Audit
```bash
# Run security-focused analysis
context-manager --preset security-audit

# Review generated report
cat token-analysis-report.json

# Review digest
cat digest.txt
```

### Workflow: Documentation
```bash
# Generate API documentation context
context-manager --preset documentation

# Export to file
context-manager --preset documentation --context-export
```

## Tips

1. **Start with `llm-explain`** for most LLM use cases
2. **Use `review`** for pull requests and code reviews
3. **Use `security-audit`** before releases
4. **Use `minimal`** for quick project overview
5. **Combine presets with flags** to customize behavior

## Troubleshooting

### Preset not found
```bash
# List available presets
context-manager --list-presets

# Check preset name spelling
context-manager --preset review  # ✅ correct
context-manager --preset Review  # ❌ case-sensitive
```

### Token limit exceeded
```bash
# Use a more restrictive preset
context-manager --preset minimal

# Or override the token limit
context-manager --preset review --target-tokens 50000
```

### Too few files included
```bash
# Check what's being filtered
context-manager --preset review --verbose

# Use a less restrictive preset
context-manager --preset default
```

---

*For more information, see [docs/future_planned_steps.md](../../docs/future_planned_steps.md)*
