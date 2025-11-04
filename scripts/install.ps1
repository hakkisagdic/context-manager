# Context Manager - Windows Installation Script
# Version: 2.3.6+
# Description: Installs context-manager globally on Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('global', 'local')]
    [string]$InstallType = 'global'
)

# Configuration
$PackageName = "@hakkisagdic/context-manager"
$InstallDir = "$env:USERPROFILE\.context-manager"
$ConfigDir = "$env:USERPROFILE\.context-manager"
$LogDir = "$ConfigDir\logs"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║     Context Manager - Installation Script v2.3.6      ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if Node.js is installed
Write-Host "➜ Checking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js 14+ from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check Node.js version
$versionNumber = $nodeVersion.TrimStart('v').Split('.')[0]
if ([int]$versionNumber -lt 14) {
    Write-Host "✗ Node.js version 14+ required (current: $nodeVersion)" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Installation
if ($InstallType -eq 'global') {
    Write-Host "Installing globally..." -ForegroundColor Blue

    # Check if already installed
    $installed = npm list -g $PackageName 2>&1
    if ($installed -match $PackageName) {
        Write-Host "⚠  $PackageName is already installed globally" -ForegroundColor Yellow
        $reinstall = Read-Host "Do you want to reinstall? [y/N]"
        if ($reinstall -ne 'y' -and $reinstall -ne 'Y') {
            Write-Host "Installation cancelled" -ForegroundColor Blue
            exit 0
        }

        Write-Host "➜ Uninstalling existing version..." -ForegroundColor Yellow
        npm uninstall -g $PackageName
    }

    Write-Host "➜ Installing $PackageName globally..." -ForegroundColor Yellow
    npm install -g $PackageName

    Write-Host "✓ Global installation complete!" -ForegroundColor Green
} else {
    Write-Host "Installing locally..." -ForegroundColor Blue

    # Create installation directory
    Write-Host "➜ Creating installation directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

    # Install package
    Write-Host "➜ Installing package..." -ForegroundColor Yellow
    Set-Location $InstallDir
    npm install $PackageName

    # Add to PATH if not already there
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $binPath = "$InstallDir\node_modules\.bin"

    if ($currentPath -notlike "*$binPath*") {
        Write-Host "➜ Adding to PATH..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$binPath",
            "User"
        )
        Write-Host "✓ Added to PATH (restart terminal to apply)" -ForegroundColor Green
    }

    Write-Host "✓ Local installation complete!" -ForegroundColor Green
}

# Create configuration directory
Write-Host ""
Write-Host "➜ Setting up configuration..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# Create default config if not exists
$configFile = "$ConfigDir\config.json"
if (-not (Test-Path $configFile)) {
    $config = @{
        version = "2.3.6"
        updateChannel = "stable"
        autoUpdate = $false
        logLevel = "info"
        telemetry = $false
        outputFormat = "toon"
        installedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }

    $config | ConvertTo-Json | Set-Content -Path $configFile -Encoding UTF8
    Write-Host "✓ Created default configuration" -ForegroundColor Green
}

# Verify installation
Write-Host ""
Write-Host "➜ Verifying installation..." -ForegroundColor Yellow

try {
    $version = context-manager --version 2>&1
    Write-Host "✓ context-manager is ready!" -ForegroundColor Green
    Write-Host "  Version: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ Installation verification failed" -ForegroundColor Red
    Write-Host "  You may need to restart your terminal" -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          Installation Complete! 🎉                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "  1. Restart your terminal (if local install)" -ForegroundColor Yellow
Write-Host "  2. Run: context-manager --help" -ForegroundColor Yellow
Write-Host "  3. Try wizard: context-manager --wizard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Blue
Write-Host "  Directory: $ConfigDir" -ForegroundColor Yellow
Write-Host "  Logs: $LogDir" -ForegroundColor Yellow
Write-Host ""
