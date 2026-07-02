# Ctxman - Windows Uninstallation Script
# Version: 2.3.6+
# Description: Removes ctxman from Windows

param(
    [Parameter(Mandatory=$false)]
    [switch]$KeepConfig = $true
)

# Configuration
$PackageName = "ctxman"
$InstallDir = "$env:USERPROFILE\.ctxman"
$ConfigDir = "$env:USERPROFILE\.ctxman"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║    Ctxman - Uninstallation Script v2.3.6     ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Confirm uninstallation
Write-Host "⚠  This will remove Ctxman from your system" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Are you sure you want to uninstall? [y/N]"

if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Uninstallation cancelled" -ForegroundColor Blue
    exit 0
}

# Ask about keeping configuration
if (-not $KeepConfig) {
    Write-Host ""
    Write-Host "➜ Do you want to keep your configuration and logs?" -ForegroundColor Yellow
    $keepConfigResponse = Read-Host "Keep configuration? [Y/n]"
    $KeepConfig = ($keepConfigResponse -ne 'n' -and $keepConfigResponse -ne 'N')
}

# Check for global installation
Write-Host ""
Write-Host "➜ Checking for global installation..." -ForegroundColor Yellow

$globalInstalled = npm list -g $PackageName 2>&1
if ($globalInstalled -match $PackageName) {
    Write-Host "➜ Uninstalling global package..." -ForegroundColor Yellow
    npm uninstall -g $PackageName
    Write-Host "✓ Global package removed" -ForegroundColor Green
} else {
    Write-Host "ℹ  No global installation found" -ForegroundColor Blue
}

# Remove local installation
if (Test-Path $InstallDir) {
    Write-Host "➜ Removing local installation..." -ForegroundColor Yellow
    Remove-Item -Path $InstallDir -Recurse -Force
    Write-Host "✓ Local installation removed" -ForegroundColor Green
}

# Remove from PATH
Write-Host "➜ Cleaning PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$binPath = "$InstallDir\node_modules\.bin"

if ($currentPath -like "*$binPath*") {
    $newPath = $currentPath.Replace(";$binPath", "").Replace("$binPath;", "").Replace("$binPath", "")
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ Removed from PATH" -ForegroundColor Green
}

# Remove configuration (if requested)
if (-not $KeepConfig) {
    if (Test-Path $ConfigDir) {
        Write-Host "➜ Removing configuration..." -ForegroundColor Yellow
        Remove-Item -Path $ConfigDir -Recurse -Force
        Write-Host "✓ Configuration removed" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ  Configuration kept at: $ConfigDir" -ForegroundColor Blue
    Write-Host "   To remove manually: Remove-Item -Path $ConfigDir -Recurse" -ForegroundColor Yellow
}

# Verify uninstallation
Write-Host ""
Write-Host "➜ Verifying uninstallation..." -ForegroundColor Yellow

try {
    $null = Get-Command ctxman -ErrorAction Stop
    Write-Host "⚠  Warning: ctxman command still found" -ForegroundColor Yellow
    Write-Host "  You may need to restart your terminal" -ForegroundColor Yellow
} catch {
    Write-Host "✓ ctxman command not found (expected)" -ForegroundColor Green
}

# Success message
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        Uninstallation Complete! 👋                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Thank you for using Ctxman!" -ForegroundColor Blue
Write-Host ""

if ($KeepConfig) {
    Write-Host "Your configuration and logs are preserved at:" -ForegroundColor Yellow
    Write-Host "  $ConfigDir"
    Write-Host ""
    Write-Host "To reinstall with your settings:" -ForegroundColor Blue
    Write-Host "  irm https://raw.githubusercontent.com/hakkisagdic/ctxman/main/scripts/install.ps1 | iex" -ForegroundColor Yellow
    Write-Host ""
}
