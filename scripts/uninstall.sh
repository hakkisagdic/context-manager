#!/usr/bin/env bash
# Ctxman - Uninstallation Script
# Version: 2.3.6+
# Description: Removes ctxman from your system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PACKAGE_NAME="ctxman"
INSTALL_DIR="$HOME/.ctxman"
BIN_LINK="/usr/local/bin/ctxman"
CONFIG_DIR="$HOME/.ctxman"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Ctxman - Uninstallation Script v2.3.6     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Confirm uninstallation
echo -e "${YELLOW}⚠${NC}  This will remove Ctxman from your system"
echo ""
read -p "Are you sure you want to uninstall? [y/N]: " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Uninstallation cancelled${NC}"
    exit 0
fi

# Ask about keeping configuration
echo ""
echo -e "${YELLOW}➜${NC} Do you want to keep your configuration and logs?"
read -p "Keep configuration? [Y/n]: " keep_config

# Check for global installation
echo ""
echo -e "${YELLOW}➜${NC} Checking for global installation..."

if npm list -g $PACKAGE_NAME &> /dev/null; then
    echo -e "${YELLOW}➜${NC} Uninstalling global package..."
    npm uninstall -g $PACKAGE_NAME
    echo -e "${GREEN}✓${NC} Global package removed"
else
    echo -e "${BLUE}ℹ${NC}  No global installation found"
fi

# Remove local installation
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}➜${NC} Removing local installation..."
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}✓${NC} Local installation removed"
fi

# Remove symlink
if [ -L "$BIN_LINK" ] || [ -f "$BIN_LINK" ]; then
    echo -e "${YELLOW}➜${NC} Removing symlink..."
    if [ -w "/usr/local/bin" ]; then
        rm "$BIN_LINK"
    else
        sudo rm "$BIN_LINK"
    fi
    echo -e "${GREEN}✓${NC} Symlink removed"
fi

# Remove configuration (if requested)
# Default is to keep (Y), so only remove if user explicitly says n/N
if [[ $keep_config =~ ^[Nn]$ ]]; then
    if [ -d "$CONFIG_DIR" ]; then
        echo -e "${YELLOW}➜${NC} Removing configuration..."
        rm -rf "$CONFIG_DIR"
        echo -e "${GREEN}✓${NC} Configuration removed"
    fi
else
    echo -e "${BLUE}ℹ${NC}  Configuration kept at: $CONFIG_DIR"
    echo -e "${YELLOW}   To remove manually: ${NC}rm -rf $CONFIG_DIR"
fi

# Verify uninstallation
echo ""
echo -e "${YELLOW}➜${NC} Verifying uninstallation..."

if command -v ctxman &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Warning: ctxman command still found"
    echo -e "${YELLOW}  You may need to restart your terminal${NC}"
else
    echo -e "${GREEN}✓${NC} ctxman command not found (expected)"
fi

# Success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Uninstallation Complete! 👋                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Thank you for using Ctxman!${NC}"
echo ""

if [[ $keep_config =~ ^[Yy]$ ]] || [ "$keep_config" == "" ]; then
    echo -e "${YELLOW}Your configuration and logs are preserved at:${NC}"
    echo -e "  $CONFIG_DIR"
    echo ""
    echo -e "${BLUE}To reinstall with your settings:${NC}"
    echo -e "  ${YELLOW}bash <(curl -fsSL https://raw.githubusercontent.com/hakkisagdic/ctxman/main/scripts/install.sh)${NC}"
    echo ""
fi
