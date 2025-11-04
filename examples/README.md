# Context Manager - Examples & Reference Configurations

This directory contains reference configurations and examples for Context Manager. Use these as templates or restore them if you modify the active wizard profiles.

## 📁 Directory Structure

```
examples/
  ├── wizard-profiles/          # Reference wizard profile templates
  │   ├── code-review/          # Code review profile
  │   ├── security-audit/       # Security audit profile
  │   ├── llm-explain/          # LLM explain profile
  │   ├── documentation/        # Documentation profile
  │   ├── minimal/              # Minimal profile
  │   └── full/                 # Full profile
  ├── custom-llm-profiles.example.json  # Example custom LLM profiles
  └── README.md                 # This file
```

## 🔧 Wizard Profiles

Wizard profiles are pre-configured analysis templates that optimize context generation for specific use cases. Each profile contains:

- `profile.json` - Metadata (name, description, icon, token budgets, best practices)
- `.contextinclude` - File-level include filters
- `.contextignore` - File-level exclude filters
- `.methodinclude` - Method-level include filters
- `.methodignore` - Method-level exclude filters

### Active vs Reference Profiles

**Active Profiles:**
- Location: `.context-manager/wizard-profiles/`
- Used by the wizard during interactive setup
- Can be modified or deleted by users

**Reference Profiles (this directory):**
- Location: `examples/wizard-profiles/`
- Backup copies of default profiles
- Use these to restore or create custom profiles

## 📋 Available Profiles

### 👀 Code Review
**Purpose:** Reviewing code changes and PRs
**Token Budget:** 20K-80K tokens
**Includes:** Source code, tests, configurations
**Best For:** Pull requests, architecture understanding

### 🔒 Security Audit
**Purpose:** Security assessments and vulnerability analysis
**Token Budget:** 15K-60K tokens
**Includes:** Auth modules, API endpoints, database code
**Best For:** Pre-deployment security reviews, compliance audits

### 💡 LLM Explain
**Purpose:** Explaining code architecture to AI
**Token Budget:** 25K-100K tokens
**Includes:** Core source, entry points, documentation
**Best For:** Understanding unfamiliar codebases, onboarding

### 📚 Documentation
**Purpose:** Generating API docs and guides
**Token Budget:** 18K-70K tokens
**Includes:** Public APIs, type definitions, exports
**Best For:** API documentation, user guides, README updates

### 🎯 Minimal
**Purpose:** Quick queries with minimal token usage
**Token Budget:** 5K-25K tokens
**Includes:** Core source only
**Best For:** Bug fixes, focused debugging, token-limited scenarios

### 📦 Full
**Purpose:** Comprehensive codebase analysis
**Token Budget:** 50K-500K+ tokens
**Includes:** Everything (all source, tests, docs)
**Best For:** Large refactoring, migration projects, complete analysis

## 🔄 Restoring Default Profiles

If you've modified or deleted a wizard profile and want to restore the default:

```bash
# Restore a single profile
cp -r examples/wizard-profiles/code-review .context-manager/wizard-profiles/

# Restore all profiles
cp -r examples/wizard-profiles/* .context-manager/wizard-profiles/
```

## ➕ Creating Custom Profiles

### Method 1: Copy and Modify

```bash
# Copy an existing profile as template
cp -r examples/wizard-profiles/code-review .context-manager/wizard-profiles/my-custom-profile

# Edit the files
cd .context-manager/wizard-profiles/my-custom-profile
nano profile.json          # Update metadata
nano .contextinclude       # Customize file filters
nano .methodinclude        # Customize method filters
```

### Method 2: Create from Scratch

```bash
# Create profile directory
mkdir -p .context-manager/wizard-profiles/my-profile

# Create required files
touch .context-manager/wizard-profiles/my-profile/profile.json
touch .context-manager/wizard-profiles/my-profile/.contextinclude
touch .context-manager/wizard-profiles/my-profile/.contextignore
touch .context-manager/wizard-profiles/my-profile/.methodinclude
touch .context-manager/wizard-profiles/my-profile/.methodignore
```

**profile.json structure:**
```json
{
  "id": "my-profile",
  "name": "My Custom Profile",
  "icon": "🎨",
  "description": "Description of what this profile does",
  "tokenBudget": {
    "small": "10K-20K",
    "medium": "20K-40K",
    "large": "40K-80K"
  },
  "includes": {
    "files": ["What files are included"],
    "methods": ["What methods are included"]
  },
  "excludes": {
    "files": ["What files are excluded"],
    "methods": ["What methods are excluded"]
  },
  "bestFor": [
    "Use case 1",
    "Use case 2"
  ]
}
```

## 🤖 Custom LLM Profiles

The `custom-llm-profiles.example.json` file shows how to add custom LLM models to the wizard's model selection.

**Usage:**

```bash
# Copy example to active location
cp examples/custom-llm-profiles.example.json .context-manager/custom-profiles.json

# Edit with your custom models
nano .context-manager/custom-profiles.json
```

**Example custom LLM profile:**
```json
{
  "models": [
    {
      "id": "my-custom-model",
      "name": "My Custom LLM",
      "vendor": "Custom",
      "contextWindow": 100000,
      "apiKeyEnv": "MY_CUSTOM_API_KEY"
    }
  ]
}
```

## 📖 Filter Syntax Reference

### File Filters (.contextinclude / .contextignore)

```bash
# Include patterns
src/**/*.js          # All JS files in src/ recursively
lib/**/*.ts          # All TS files in lib/ recursively
*.config.js          # Config files in root

# Exclude patterns
!**/test/**          # Exclude test directories
!**/*.min.js         # Exclude minified files

# Directory matching
**/auth/**           # All files in any auth directory
config/**/*.js       # JS files in config directory
```

### Method Filters (.methodinclude / .methodignore)

```bash
# Pattern matching
*Handler             # Methods ending with "Handler"
process*             # Methods starting with "process"
async *              # All async methods

# Specific methods
constructor          # Constructors
init*                # Initialization methods

# Exclusions
!_*                  # Exclude private methods (starting with _)
!mock*               # Exclude mock methods
```

## 🔀 Profile Switching Workflow

When you select a profile in the wizard:

1. **Profile files are copied** with profile name suffix:
   ```
   .contextinclude-code-review
   .contextignore-code-review
   .methodinclude-code-review
   .methodignore-code-review
   ```

2. **Active configs are created** (copies for current analysis):
   ```
   .contextinclude  → copy of .contextinclude-code-review
   .contextignore   → copy of .contextignore-code-review
   .methodinclude   → copy of .methodinclude-code-review
   .methodignore    → copy of .methodignore-code-review
   ```

3. **Multiple profiles can coexist**:
   ```
   .contextinclude-code-review
   .contextinclude-security-audit
   .contextinclude-minimal
   .contextinclude  ← currently active
   ```

## 🎯 Best Practices

### Profile Naming
- Use lowercase with hyphens: `my-custom-profile`
- Choose descriptive names: `react-component-review`, `api-security-audit`

### Token Budgets
- **Minimal:** 5K-25K tokens
- **Focused:** 20K-80K tokens (code-review, security-audit)
- **Balanced:** 50K-100K tokens (llm-explain, documentation)
- **Comprehensive:** 100K-500K+ tokens (full)

### Filter Design
- **Include mode** (`.contextinclude` / `.methodinclude`): Best for focused analysis
- **Exclude mode** (`.contextignore` / `.methodignore`): Best for broad analysis with exceptions
- **Combined mode**: Use both for fine-grained control

## 📚 Related Documentation

- [Main README](../README.md) - Project overview and installation
- [CHANGELOG](../docs/CHANGELOG.md) - Version history and features
- [CLAUDE.md](../CLAUDE.md) - AI assistant guidance

## 🆘 Troubleshooting

**Profile not appearing in wizard?**
- Ensure `profile.json` exists and is valid JSON
- Check that profile directory is in `.context-manager/wizard-profiles/`
- Profile ID must match directory name

**Filters not working?**
- Check `.gitignore` first (it always takes precedence)
- Verify pattern syntax (use `**` for recursive matching)
- Test patterns with `context-manager --analyze`

**Need to reset everything?**
```bash
# Remove all active profiles and configs
rm -rf .context-manager/wizard-profiles
rm .context*
rm .method*

# Restore defaults
cp -r examples/wizard-profiles .context-manager/
```

## 💡 Tips

1. **Start with a similar profile** - Copy the closest match and modify
2. **Test incrementally** - Run analysis after each filter change
3. **Use Custom mode** - For one-off analyses, select "Custom" in wizard
4. **Version control profiles** - Add custom profiles to git for team sharing
5. **Document your profiles** - Update `profile.json` with clear descriptions

---

**Version:** 2.3.8
**Last Updated:** 2025-11-05
