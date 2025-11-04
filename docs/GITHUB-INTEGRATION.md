# GitHub Integration - GitIngest from URLs

**Version:** 2.3.6+
**Status:** Production Ready
**Last Updated:** November 3, 2025

---

## 🎯 Overview

Context Manager can automatically generate GitIngest digests from any GitHub repository URL. No need to manually clone, analyze, and generate - just provide the URL!

### What It Does

1. **Parse GitHub URL** - Supports multiple URL formats
2. **Clone Repository** - Shallow clone for speed
3. **Analyze Code** - Full token analysis
4. **Generate Digest** - GitIngest format
5. **Save to docs/** - Auto-named output file
6. **Cleanup** - Remove temporary files

### Replace gitingest.com Workflow

**Before (Manual):**
```bash
# 1. Go to gitingest.com
# 2. Paste GitHub URL
# 3. Wait for processing
# 4. Download .txt file
# 5. Save to docs/
```

**Now (Automated):**
```bash
context-manager github facebook/react
# ✅ Done! Digest saved to docs/
```

---

## 🚀 Quick Start

### Basic Usage

```bash
# Simple format (owner/repo)
context-manager github facebook/react

# Full URL
context-manager github https://github.com/vercel/next.js

# Git URL
context-manager git git@github.com:angular/angular.git
```

### With Options

```bash
# Specific branch
context-manager github vercel/next.js --branch canary

# Custom output
context-manager github nodejs/node -o docs/nodejs-analysis.txt

# Verbose mode
context-manager github microsoft/vscode --verbose

# With chunking (large repos)
context-manager github tensorflow/tensorflow --chunk-size 100000

# Keep clone for inspection
context-manager github rust-lang/rust --keep-clone
```

---

## 📋 Supported URL Formats

| Format | Example | Supported |
|--------|---------|-----------|
| HTTPS | `https://github.com/owner/repo` | ✅ |
| HTTPS with .git | `https://github.com/owner/repo.git` | ✅ |
| SSH | `git@github.com:owner/repo.git` | ✅ |
| Short | `github.com/owner/repo` | ✅ |
| Owner/Repo | `owner/repo` | ✅ |
| With branch | `https://github.com/owner/repo/tree/branch` | ✅ |

### URL Examples

```bash
# All of these work:
context-manager github facebook/react
context-manager github https://github.com/facebook/react
context-manager github https://github.com/facebook/react.git
context-manager github git@github.com:facebook/react.git
context-manager github github.com/facebook/react
```

---

## ⚙️ Command Options

### Required

| Option | Description |
|--------|-------------|
| `url` | GitHub repository URL (any supported format) |

### Optional

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output FILE` | Auto-generated | Custom output file path |
| `-b, --branch BRANCH` | `main` | Branch to analyze |
| `-v, --verbose` | `false` | Show detailed progress |
| `--keep-clone` | `false` | Keep cloned repo in temp |
| `--full-clone` | `false` | Full clone (vs shallow) |
| `--chunk-size TOKENS` | None | Enable chunking |
| `-h, --help` | - | Show help message |

---

## 📖 Usage Examples

### Example 1: Analyze React.js

```bash
context-manager github facebook/react
```

**Output:**
```
╔════════════════════════════════════════════════════════╗
║        GitHub GitIngest Generator v2.3.6              ║
╚════════════════════════════════════════════════════════╝

📋 Fetching repository information...

📊 Repository Info:
   Name: facebook/react
   Description: The library for web and native user interfaces.
   Stars: ⭐ 240,257
   Language: JavaScript
   Default Branch: main

📥 Cloning repository...
✅ Repository cloned

🔍 Analyzing repository...
📊 Analysis complete

💾 Generating GitIngest digest...
✅ GitIngest digest generated!
   Output: docs/facebook-react-gitingest-abc123.txt
   Size: 1,234.56 KB
   Files: 487
   Tokens: 234,567

🧹 Cleaning up temporary files...

✅ Complete!

📝 Next steps:
   1. View digest: cat "docs/facebook-react-gitingest-abc123.txt"
   2. Use in LLM: Copy to clipboard
   3. Cleanup: npm run clean
```

### Example 2: Specific Branch

```bash
# Next.js uses 'canary' as default branch
context-manager github vercel/next.js --branch canary
```

### Example 3: Large Repository with Chunking

```bash
# VSCode is huge - use chunking
context-manager github microsoft/vscode --chunk-size 100000 --verbose
```

**Output:**
- Multiple chunk files: `vscode-chunk-1.txt`, `vscode-chunk-2.txt`, etc.
- Chunk metadata with cross-references
- Navigation between chunks

### Example 4: Keep Clone for Exploration

```bash
# Clone and keep for manual exploration
context-manager github tensorflow/tensorflow --keep-clone

# Clone location: .context-manager/temp/tensorflow-tensorflow/
```

### Example 5: Custom Output Location

```bash
# Save to specific location
context-manager github angular/angular -o ~/projects/angular-context.txt
```

---

## 🔧 Advanced Usage

### Programmatic API

```javascript
const { GitUtils } = require('@hakkisagdic/context-manager');

const gitUtils = new GitUtils({
    verbose: true,
    outputDir: './digests'
});

// Generate from GitHub URL
const stats = await gitUtils.generateFromGitHub('facebook/react', {
    outputFile: 'react-digest.txt',
    cleanup: true,
    shallow: true,
    formatterOptions: {
        chunking: {
            enabled: true,
            maxTokensPerChunk: 50000
        }
    }
});

console.log(`Generated: ${stats.outputFile}`);
console.log(`Files: ${stats.files}, Tokens: ${stats.tokens}`);
```

### Parse URL Only

```javascript
const gitUtils = new GitUtils();

const repoInfo = gitUtils.parseGitHubURL('facebook/react');
console.log(repoInfo.owner);      // 'facebook'
console.log(repoInfo.repo);       // 'react'
console.log(repoInfo.cloneUrl);   // 'https://github.com/facebook/react.git'
console.log(repoInfo.apiUrl);     // 'https://api.github.com/repos/facebook/react'
```

### Get Repository Info

```javascript
const repoInfo = gitUtils.parseGitHubURL('vercel/next.js');
const info = await gitUtils.getRepositoryInfo(repoInfo);

console.log(`Stars: ${info.stars}`);
console.log(`Forks: ${info.forks}`);
console.log(`Language: ${info.language}`);
console.log(`Default Branch: ${info.defaultBranch}`);
```

---

## 💡 Common Workflows

### 1. Quick Analysis

```bash
# Just give me the digest
context-manager github owner/repo
```

### 2. Multiple Repositories

```bash
# Batch process multiple repos
repos=(
    "facebook/react"
    "vercel/next.js"
    "angular/angular"
)

for repo in "${repos[@]}"; do
    context-manager github $repo
done
```

### 3. Compare Implementations

```bash
# Compare different frameworks
context-manager github facebook/react -o docs/react.txt
context-manager github vuejs/core -o docs/vue.txt
context-manager github angular/angular -o docs/angular.txt
context-manager github sveltejs/svelte -o docs/svelte.txt
```

### 4. Large Monorepo

```bash
# Chromium-sized repos need chunking
context-manager github chromium/chromium \
    --chunk-size 100000 \
    --branch main \
    --verbose
```

---

## 🗂️ Output Files

### File Naming

**Auto-generated:**
```
docs/{owner}-{repo}-gitingest-{timestamp}.txt
```

**Examples:**
- `docs/facebook-react-gitingest-abc123.txt`
- `docs/vercel-next.js-gitingest-def456.txt`

### File Structure

```
# GitIngest Digest
Repository: facebook/react
Branch: main
Generated: 2025-11-03T02:00:00Z

## Summary
- Files: 487
- Tokens: 234,567
- Size: 1.2 MB

## Directory Structure
[Tree view of repository]

## File Contents
[Full source code of all files]
```

---

## 🧹 Cleanup

### Temporary Files

Cloned repos are stored in:
```
.context-manager/temp/{owner}-{repo}/
```

**Auto-cleanup:** Default (unless `--keep-clone`)

**Manual cleanup:**
```bash
# Remove all temp repos
rm -rf .context-manager/temp/

# Remove specific repo
rm -rf .context-manager/temp/facebook-react/
```

### List Cached Repos

```javascript
const gitUtils = new GitUtils();
const cached = gitUtils.listCachedRepos();

cached.forEach(repo => {
    console.log(`${repo.name}: ${(repo.size / 1024 / 1024).toFixed(2)} MB`);
});
```

---

## 🐛 Troubleshooting

### Git Not Installed

```
❌ Error: Git is not installed
```

**Solution:**
```bash
# macOS
brew install git

# Linux (Debian/Ubuntu)
sudo apt-get install git

# Linux (Red Hat/Fedora)
sudo yum install git

# Windows
# Download from: https://git-scm.com/download/win
```

### Clone Failed

```
❌ Failed to clone repository: Permission denied
```

**Solutions:**
1. Check repository is public
2. For private repos: set up SSH keys or GitHub token
3. Check network/firewall settings

### GitHub API Rate Limit

```
❌ API call failed: rate limit exceeded
```

**Solution:**
```bash
# Set GitHub token (increases rate limit)
export GITHUB_TOKEN=your_token_here
context-manager github owner/repo
```

### Branch Not Found

```
❌ Failed to clone repository: Remote branch 'xyz' not found
```

**Solution:**
```bash
# Check default branch first
context-manager github owner/repo --verbose

# Or specify correct branch
context-manager github owner/repo --branch develop
```

---

## 📊 Performance

### Shallow Clone (Default)

```
Repository Size: ~500 MB
Clone Time: ~30 seconds
Disk Usage: ~50 MB (shallow)
```

**Recommended for:** Most use cases

### Full Clone

```
Repository Size: ~500 MB
Clone Time: ~5 minutes
Disk Usage: ~500 MB (full history)
```

**Use when:** Need full git history

### Chunking

For repos > 100k tokens:
```bash
context-manager github large/repo --chunk-size 50000
```

**Benefits:**
- Multiple digestable chunks
- Each chunk < LLM context limit
- Cross-chunk references preserved

---

## 🎯 Use Cases

### 1. Code Review Preparation

```bash
# Get full context before reviewing PR
context-manager github owner/repo --branch feature-branch
```

### 2. Learning New Framework

```bash
# Study a framework's structure
context-manager github sveltejs/kit
# Read digest to understand architecture
```

### 3. Migration Planning

```bash
# Analyze source before migration
context-manager github old/framework
context-manager github new/framework
# Compare structures
```

### 4. Security Audit

```bash
# Full clone for security review
context-manager github company/app --full-clone --keep-clone
# Inspect code in .context-manager/temp/
```

---

## 📚 API Reference

### GitUtils Class

```javascript
const gitUtils = new GitUtils(options)

// Options:
{
    tempDir: '.context-manager/temp',  // Clone location
    outputDir: 'docs',                 // Digest output location
    verbose: false                     // Show detailed logs
}
```

### Methods

#### `parseGitHubURL(url)`
Parse GitHub URL to extract owner, repo, branch

#### `isGitInstalled()`
Check if git command is available

#### `cloneRepository(repoInfo, options)`
Clone repository to temp directory

#### `generateFromGitHub(url, options)`
Generate GitIngest digest from GitHub URL (main method)

#### `getRepositoryInfo(repoInfo)`
Fetch repository metadata from GitHub API

#### `cleanupTemp()`
Remove all temporary clones

#### `listCachedRepos()`
List all cached repository clones

---

## 🔗 Integration with gitingest.com

Context Manager provides an **offline, scriptable alternative** to gitingest.com:

| Feature | gitingest.com | Context Manager |
|---------|---------------|-----------------|
| **Web UI** | ✅ | ❌ |
| **Automation** | ❌ | ✅ |
| **Offline** | ❌ | ✅ |
| **Customization** | ❌ | ✅ (chunking, filters) |
| **Batch Processing** | ❌ | ✅ |
| **API Access** | ❌ | ✅ |

**Best of both worlds:**
- Use gitingest.com for quick one-off digests
- Use Context Manager for automation and workflows

---

## ✅ Advantages

1. **Automated** - One command, full digest
2. **Scriptable** - Batch process multiple repos
3. **Offline** - No internet needed after clone
4. **Customizable** - Filters, chunking, formats
5. **Fast** - Shallow clone by default
6. **Clean** - Auto-cleanup temp files
7. **Integrated** - Works with all Context Manager features

---

**Version:** 2.3.6+
**Dependencies:** Git (required)
**Output:** GitIngest digest in docs/ directory
