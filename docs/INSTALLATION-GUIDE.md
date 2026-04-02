# Context Manager - Installation Guide

**Version:** 3.0.0
**Last Updated:** April 2, 2026

---

## 📋 Table of Contents

1. [Quick Install](#quick-install)
2. [Platform-Specific Installation](#platform-specific-installation)
3. [Package Managers](#package-managers)
4. [Verification](#verification)
5. [Optional Dependencies](#optional-dependencies)
6. [Uninstallation](#uninstallation)
7. [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Install

### NPM (Recommended - All Platforms)

```bash
# Global installation
npm install -g @hakkisagdic/context-manager

# Verify
context-manager --help
```

### One-Line Installers

#### macOS / Linux

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.sh)
```

#### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.ps1 | iex
```

---

## 🖥️ Platform-Specific Installation

### macOS

#### Option 1: Homebrew (Recommended)

```bash
# Add tap (once)
brew tap hakkisagdic/context-manager

# Install
brew install context-manager

# Update
brew upgrade context-manager
```

#### Option 2: NPM

```bash
npm install -g @hakkisagdic/context-manager
```

#### Option 3: Installation Script

```bash
curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.sh | bash
```

### Linux

#### Option 1: Debian/Ubuntu (APT)

```bash
# Download DEB package
wget https://github.com/hakkisagdic/context-manager/releases/download/v3.0.0/context-manager_3.0.0_all.deb

# Install
sudo dpkg -i context-manager_3.0.0_all.deb

# Install dependencies if needed
sudo apt-get install -f
```

#### Option 2: Red Hat/Fedora (YUM/DNF)

```bash
# Coming soon - RPM package
# For now, use NPM:
npm install -g @hakkisagdic/context-manager
```

#### Option 3: NPM (Universal)

```bash
npm install -g @hakkisagdic/context-manager
```

#### Option 4: Installation Script

```bash
curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.sh | bash
```

### Windows

#### Option 1: NPM (Recommended)

```powershell
npm install -g @hakkisagdic/context-manager
```

#### Option 2: PowerShell Script

```powershell
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force
irm https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.ps1 | iex
```

#### Option 3: Manual Download

1. Download from: https://github.com/hakkisagdic/context-manager/releases
2. Extract to: `C:\Program Files\context-manager`
3. Add to PATH: `C:\Program Files\context-manager\bin`

---

## 📦 Package Managers

### NPM

```bash
# Global (recommended)
npm install -g @hakkisagdic/context-manager

# Local (project-specific)
npm install @hakkisagdic/context-manager

# Specific version
npm install -g @hakkisagdic/context-manager@3.0.0

# Insider/pre-release
npm install -g @hakkisagdic/context-manager@next
```

### Yarn

```bash
# Global
yarn global add @hakkisagdic/context-manager

# Local
yarn add @hakkisagdic/context-manager
```

### PNPM

```bash
# Global
pnpm add -g @hakkisagdic/context-manager

# Local
pnpm add @hakkisagdic/context-manager
```

### Homebrew (macOS)

```bash
brew tap hakkisagdic/context-manager
brew install context-manager
brew upgrade context-manager  # Update
brew uninstall context-manager  # Remove
```

---

## ✅ Verification

### Check Installation

```bash
# Check if installed
which context-manager

# Check version
context-manager --version

# Run help
context-manager --help

# Quick test
context-manager --simple
```

### Verify Dependencies

```bash
# Check Node.js version (14+ required)
node --version

# Check npm
npm --version

# List installed packages
npm list -g @hakkisagdic/context-manager
```

### Test Core Features

```bash
# Test TOON format
context-manager --output toon --simple

# Test format listing
context-manager --list-formats

# Test method-level analysis
context-manager --method-level --simple

# Test format conversion
echo '{"test": "value"}' > test.json
context-manager convert test.json --from json --to toon
```

---

## 🎨 Optional Dependencies

### Exact Token Counting

For exact GPT-4 token counting (optional):

```bash
npm install -g tiktoken
```

**With tiktoken:**

- ✅ Exact token counts (100% accuracy)

**Without tiktoken:**

- ✅ Smart estimation (~95% accuracy)

---

## 🗑️ Uninstallation

### macOS / Linux

```bash
# Option 1: Uninstall script
bash <(curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/uninstall.sh)

# Option 2: NPM
npm uninstall -g @hakkisagdic/context-manager

# Option 3: Homebrew
brew uninstall context-manager
```

### Windows

```powershell
# Option 1: PowerShell script
irm https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/uninstall.ps1 | iex

# Option 2: NPM
npm uninstall -g @hakkisagdic/context-manager
```

### Remove Configuration

```bash
# macOS / Linux
rm -rf ~/.context-manager

# Windows
Remove-Item -Path $env:USERPROFILE\.context-manager -Recurse
```

---

## 🐛 Troubleshooting

### "command not found: context-manager"

**Solution:**

```bash
# Check PATH
echo $PATH

# Restart terminal
# Or source profile
source ~/.bashrc  # or ~/.zshrc
```

### Permission Denied

**Linux/macOS:**

```bash
# Use sudo for global install
sudo npm install -g @hakkisagdic/context-manager

# Or install locally without sudo
npm install @hakkisagdic/context-manager
```

**Windows:**

```powershell
# Run PowerShell as Administrator
```

### Node.js Version Too Old

```bash
# Check version
node --version

# Update Node.js
# macOS: brew upgrade node
# Linux: nvm install --lts
# Windows: Download from nodejs.org
```

### Installation Hangs

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install -g @hakkisagdic/context-manager
```

### Wizard/Dashboard Not Working

```bash
# Ink is bundled since v3.0.0, no manual install needed
# If wizard still doesn't work, try simple mode
context-manager --simple

# Or reinstall to ensure all bundled dependencies are present
npm install -g @hakkisagdic/context-manager
```

---

## 🔄 Updating

### Built-in Updater

```bash
# Check for updates
context-manager update check

# Install update
context-manager update install

# Rollback if needed
context-manager update rollback
```

### NPM

```bash
# Update to latest
npm update -g @hakkisagdic/context-manager

# Update to specific version
npm install -g @hakkisagdic/context-manager@3.0.0
```

### Homebrew

```bash
brew upgrade context-manager
```

---

## 🎯 Installation Types

### Global Installation

```bash
npm install -g @hakkisagdic/context-manager
```

✅ Available system-wide
✅ Use from any directory
✅ Simple `context-manager` command
❌ Requires admin/sudo (sometimes)

### Local Installation

```bash
npm install @hakkisagdic/context-manager
```

✅ No admin rights needed
✅ Project-specific version
❌ Use via `npx` or npm scripts
❌ Not in system PATH

### Source Installation (Developers)

```bash
git clone https://github.com/hakkisagdic/context-manager.git
cd context-manager
npm install
npm link  # Make globally available
```

✅ Latest development version
✅ Easy to contribute
❌ Manual updates required

---

## 📚 Next Steps

After installation:

1. **Read Quick Start**: `context-manager --help`
2. **Try Wizard**: `context-manager --wizard`
3. **Read Docs**: See [FEATURE-EXAMPLES.md](./FEATURE-EXAMPLES.md)
4. **Configure**: Edit `~/.context-manager/config.json`
5. **Update**: `context-manager update check`

---

## 🆘 Getting Help

- **GitHub Issues**: https://github.com/hakkisagdic/context-manager/issues
- **Documentation**: https://github.com/hakkisagdic/context-manager#readme
- **Quick Help**: `context-manager --help`

---

**Version:** 3.0.0
**Maintainer:** Hakkı Sağdıç
**License:** MIT
