# Logging & Auto-Update System

**Version:** 2.3.6+
**Status:** Implemented (Placeholder for Update Endpoints)
**Last Updated:** November 3, 2025

---

## 📋 Overview

Context Manager v2.3.6+ includes enterprise-grade logging and automatic update capabilities:

1. **🔍 Logging System** - Multi-level logging with file output
2. **🚀 Auto-Update** - Check and install updates automatically
3. **📦 Install/Uninstall** - System-wide installation scripts
4. **🔄 Update Channels** - Stable and Insider release channels

---

## 🔍 Logging System

### Features

- **Multiple Log Levels**: error, warn, info, debug, trace
- **File Logging**: Automatic log file management
- **Console Output**: Colored terminal output
- **Log Rotation**: Automatic cleanup of old logs
- **Customizable**: Configure level, output, and format

### Usage

#### Programmatic API

```javascript
const { getLogger, createLogger } = require('@hakkisagdic/context-manager');

// Get default logger
const logger = getLogger();

// Log at different levels
logger.error('Critical error occurred', { error: 'details' });
logger.warn('Warning message');
logger.info('Informational message');
logger.debug('Debug information');
logger.trace('Detailed trace');

// Create custom logger
const customLogger = createLogger({
    level: 'debug',
    logToFile: true,
    logDir: './custom-logs',
    silent: false
});
```

#### Log Levels

| Level | Priority | Use Case | Example |
|-------|----------|----------|---------|
| **error** | 0 (highest) | Critical failures | Database connection failed |
| **warn** | 1 | Warnings | Deprecated API usage |
| **info** | 2 (default) | General info | Analysis complete |
| **debug** | 3 | Debugging | File processed: x.js |
| **trace** | 4 (lowest) | Detailed traces | Token count: 1234 |

#### Configuration

```javascript
const logger = createLogger({
    level: 'info',              // Minimum level to log
    logToFile: true,            // Write to file
    logDir: '.context-manager/logs',  // Log directory
    logFile: 'context-manager-2025-11-03.log', // Log file name
    silent: false               // Suppress console output
});
```

#### Environment Variables

```bash
# Set log level via environment
export LOG_LEVEL=debug
context-manager --verbose

# Disable file logging
export LOG_TO_FILE=false
context-manager
```

### Log File Management

#### Location

Logs are stored in: `~/.context-manager/logs/`

#### File Format

```
[2025-11-03T02:00:00.000Z] [INFO] Analysis started
[2025-11-03T02:00:01.234Z] [DEBUG] Processing file: index.js
[2025-11-03T02:00:02.456Z] [INFO] Analysis complete | {"files": 64, "tokens": 181480}
```

#### Auto-Cleanup

```javascript
// Clean logs older than 7 days
logger.clearOldLogs(7);

// Clean logs older than 30 days
logger.clearOldLogs(30);
```

#### View Recent Logs

```javascript
// Get last 100 log entries
const recentLogs = logger.getRecentLogs(100);
recentLogs.forEach(log => console.log(log));
```

### Advanced Features

#### Timers

```javascript
logger.time('Analysis');
// ... do work ...
logger.timeEnd('Analysis'); // Logs: Analysis: 1234ms
```

#### Groups

```javascript
logger.group('File Processing');
logger.info('Processing index.js');
logger.info('Processing utils.js');
logger.groupEnd();
```

#### Custom Icons

```javascript
logger.custom('🚀', 'info', 'Deployment started');
logger.custom('✨', 'info', 'Feature enabled');
```

---

## 🚀 Auto-Update System

### Features

- **Version Checking**: Check for new releases
- **Update Channels**: Stable and Insider
- **Manual/Auto Update**: Choose update mode
- **Release Notes**: View what's new
- **Rollback Support**: Revert to previous version (future)

### Usage

#### Check for Updates

```bash
# Check for updates
context-manager update check

# Or use npm script
npm run update:check
```

Output:
```
🔍 Checking for updates...

✨ Update available!

   Current: 2.3.5
   Latest:  2.3.6
   Channel: stable

📝 Release Notes:
   - Added logging system
   - Added auto-update functionality
   - Bug fixes and improvements

To install: context-manager update install
```

#### Install Update

```bash
# Install latest update
context-manager update install

# Or use npm script
npm run update:install
```

**Note:** Currently shows manual installation instructions (placeholder).

#### Update Channels

##### Stable Channel (Default)

```bash
# Switch to stable
context-manager update channel stable
```

- **Release Frequency**: Monthly
- **Stability**: High
- **Testing**: Thoroughly tested
- **Recommended For**: Production use

##### Insider Channel

```bash
# Switch to insider
context-manager update channel insider
```

- **Release Frequency**: Weekly
- **Stability**: May have bugs
- **Testing**: Limited testing
- **Recommended For**: Early adopters, testing

#### Update Info

```bash
# Show update configuration
context-manager update info
```

Output:
```
ℹ️  Update Configuration

   Current version: 2.3.5
   Update channel:  stable
   Auto-update:     Disabled

Available commands:

   context-manager update check    - Check for updates
   context-manager update install  - Install latest update
   context-manager update channel  - Switch update channel
   context-manager update info     - Show this information

Channels:

   stable  - Stable releases (recommended)
   insider - Pre-release builds (bleeding edge)
```

### Programmatic API

```javascript
const Updater = require('@hakkisagdic/context-manager').Updater;

const updater = new Updater({
    channel: 'stable',
    autoUpdate: false
});

// Check for updates
const updateInfo = await updater.checkForUpdates();
if (updateInfo.available) {
    console.log(`Update available: ${updateInfo.latestVersion}`);
}

// Install update
const result = await updater.installUpdate(updateInfo);

// Switch channel
await updater.switchChannel('insider');
```

### Configuration

Updates are configured in: `~/.context-manager/config.json`

```json
{
  "version": "2.3.6",
  "updateChannel": "stable",
  "autoUpdate": false,
  "lastUpdateCheck": "2025-11-03T02:00:00.000Z"
}
```

### Update Endpoints (Placeholder)

Currently configured endpoints:

```javascript
{
    stable: 'https://api.github.com/repos/hakkisagdic/context-manager/releases/latest',
    insider: 'https://api.github.com/repos/hakkisagdic/context-manager/releases',
    version: 'https://raw.githubusercontent.com/hakkisagdic/context-manager/main/package.json'
}
```

**Note:** These are placeholder URLs. Actual implementation will use custom update server or GitHub API.

---

## 📦 Installation Scripts

### Install Script

Install Context Manager system-wide:

```bash
# Download and run install script
bash <(curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/install.sh)

# Or run locally
npm run install:local
```

#### Installation Options

The script offers two installation methods:

**1. Global Installation (Recommended)**
```bash
# Installs via npm globally
npm install -g @hakkisagdic/context-manager

# Available system-wide
context-manager --help
```

**2. Local Installation**
```bash
# Installs to ~/.context-manager
# Creates symlink to /usr/local/bin
# Custom configuration
```

#### What Gets Installed

- ✅ Context Manager binary
- ✅ All dependencies
- ✅ Configuration directory (`~/.context-manager`)
- ✅ Log directory (`~/.context-manager/logs`)
- ✅ Default configuration file
- ✅ Command symlink (local mode)

### Uninstall Script

Remove Context Manager from your system:

```bash
# Download and run uninstall script
bash <(curl -fsSL https://raw.githubusercontent.com/hakkisagdic/context-manager/main/scripts/uninstall.sh)

# Or run locally
npm run uninstall:local
```

#### Uninstall Options

**Keep Configuration** (default):
- Removes binaries
- Keeps `~/.context-manager` with settings and logs
- Easy to reinstall with same settings

**Full Removal**:
- Removes everything
- Deletes all configuration
- Deletes all logs
- Clean system

#### What Gets Removed

- ✅ Global npm package (if installed)
- ✅ Local installation directory
- ✅ Symlinks
- ⚙️ Configuration (optional)
- ⚙️ Logs (optional)

---

## 🔧 Configuration Files

### Config Directory Structure

```
~/.context-manager/
├── config.json          # Main configuration
├── update-cache.json    # Update check cache
└── logs/                # Log files
    ├── context-manager-2025-11-03.log
    ├── context-manager-2025-11-02.log
    └── ...
```

### Main Configuration (config.json)

```json
{
  "version": "2.3.6",
  "updateChannel": "stable",
  "autoUpdate": false,
  "logLevel": "info",
  "telemetry": false,
  "outputFormat": "toon",
  "installedAt": "2025-11-03T02:00:00.000Z",
  "lastUpdateCheck": "2025-11-03T02:00:00.000Z"
}
```

### Update Cache (update-cache.json)

```json
{
  "available": true,
  "currentVersion": "2.3.5",
  "latestVersion": "2.3.6",
  "channel": "stable",
  "releaseNotes": "Release notes...",
  "downloadUrl": "https://...",
  "lastCheck": "2025-11-03T02:00:00.000Z"
}
```

---

## 🎯 Examples

### Example 1: Custom Logger in Analysis

```javascript
const { TokenCalculator, getLogger } = require('@hakkisagdic/context-manager');

const logger = getLogger({ level: 'debug' });

logger.info('Starting analysis...');

const analyzer = new TokenCalculator(process.cwd(), {
    verbose: true
});

logger.time('Analysis');
const results = analyzer.run();
logger.timeEnd('Analysis');

logger.info('Analysis complete', {
    files: results.totalFiles,
    tokens: results.totalTokens
});
```

### Example 2: Auto-Update Check on Startup

```javascript
const { Updater, getLogger } = require('@hakkisagdic/context-manager');

const logger = getLogger();
const updater = new Updater({ channel: 'stable' });

// Check for updates (once per day)
updater.checkAndNotify().then(updateInfo => {
    if (updateInfo && updateInfo.available) {
        logger.info('Update available', {
            from: updateInfo.currentVersion,
            to: updateInfo.latestVersion
        });
    }
});

// Continue with main application...
```

### Example 3: Silent Mode with File Logging

```javascript
const { createLogger } = require('@hakkisagdic/context-manager');

const logger = createLogger({
    level: 'debug',
    silent: true,    // No console output
    logToFile: true, // File logging only
    logDir: './analysis-logs'
});

// All logs go to file only
logger.info('Analysis started');
logger.debug('Processing files...');
logger.info('Analysis complete');

// View logs later
const logs = logger.getRecentLogs(50);
console.log(logs);
```

---

## 🔍 Troubleshooting

### Logs Not Being Created

**Symptom:** No log files in `~/.context-manager/logs/`

**Solutions:**
1. Check permissions: `ls -la ~/.context-manager/logs/`
2. Verify directory exists: `mkdir -p ~/.context-manager/logs`
3. Check logToFile setting: `logger.logToFile === true`

### Update Check Failing

**Symptom:** "Could not check for updates"

**Solutions:**
1. Check internet connection
2. Verify GitHub API access
3. Check firewall/proxy settings
4. Try different update channel

### Installation Script Fails

**Symptom:** Install script errors

**Solutions:**
1. Ensure Node.js 14+ installed: `node --version`
2. Check npm is available: `npm --version`
3. Verify write permissions: `/usr/local/bin` or `~/.context-manager`
4. Run with sudo if needed: `sudo bash scripts/install.sh`

---

## 📚 API Reference

### Logger

```typescript
class Logger {
    constructor(options: LoggerOptions)
    error(message: string, meta?: object): void
    warn(message: string, meta?: object): void
    info(message: string, meta?: object): void
    debug(message: string, meta?: object): void
    trace(message: string, meta?: object): void
    time(label: string): void
    timeEnd(label: string): void
    group(title: string): void
    groupEnd(): void
    clearOldLogs(daysToKeep: number): void
    getRecentLogs(lines: number): string[]
}
```

### Updater

```typescript
class Updater {
    constructor(options: UpdaterOptions)
    checkForUpdates(): Promise<UpdateInfo>
    installUpdate(updateInfo: UpdateInfo): Promise<InstallResult>
    switchChannel(channel: 'stable' | 'insider'): Promise<UpdateInfo>
    checkAndNotify(): Promise<UpdateInfo>
}
```

---

## 🚀 Future Enhancements

- [ ] Actual GitHub API integration for updates
- [ ] Automatic background update installation
- [ ] Update rollback support
- [ ] Custom update server support
- [ ] Telemetry and analytics (opt-in)
- [ ] Log streaming to external services
- [ ] Windows install/uninstall scripts
- [ ] Homebrew formula for macOS
- [ ] APT/YUM packages for Linux

---

**Version:** 2.3.6+
**Last Updated:** November 3, 2025
**Maintainer:** Hakkı Sağdıç
