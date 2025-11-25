#!/bin/bash
# GitIngest Reference Updater
# Updates the gitingest reference file from the official repository
#
# Usage: ./scripts/update-gitingest-reference.sh
#
# This script:
# 1. Clones/fetches the latest gitingest source
# 2. Generates a new reference digest
# 3. Shows diff with current reference
# 4. Optionally updates the reference file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"
TEMP_DIR="/tmp/gitingest-update-$$"
GITINGEST_REPO="https://github.com/coderamp-labs/gitingest.git"
REFERENCE_FILE="$DOCS_DIR/coderamp-labs-gitingest-8a5edab282632443.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}GitIngest Reference Updater${NC}"
echo "================================"
echo ""

# Check if reference file exists
if [ ! -f "$REFERENCE_FILE" ]; then
    echo -e "${RED}Error: Reference file not found at $REFERENCE_FILE${NC}"
    exit 1
fi

# Create temp directory
mkdir -p "$TEMP_DIR"
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}1. Cloning gitingest repository...${NC}"
git clone --depth 1 "$GITINGEST_REPO" "$TEMP_DIR/gitingest" 2>/dev/null

# Get current and new commit hashes
cd "$TEMP_DIR/gitingest"
NEW_COMMIT=$(git rev-parse --short HEAD)
NEW_DATE=$(git log -1 --format=%ci)

echo -e "${GREEN}   Latest commit: $NEW_COMMIT ($NEW_DATE)${NC}"

echo ""
echo -e "${YELLOW}2. Generating new reference digest...${NC}"

# Generate digest using context-manager itself (dogfooding!)
cd "$PROJECT_ROOT"
NEW_REFERENCE="$TEMP_DIR/new-reference.txt"

# Use our own tool to generate the digest
node bin/cli.js --cli --gitingest --output "$NEW_REFERENCE" "$TEMP_DIR/gitingest" 2>/dev/null || {
    # Fallback: simple file concatenation
    echo "Directory structure:" > "$NEW_REFERENCE"
    find "$TEMP_DIR/gitingest" -type f -name "*.py" -o -name "*.js" -o -name "*.md" | head -100 >> "$NEW_REFERENCE"
}

echo ""
echo -e "${YELLOW}3. Comparing with current reference...${NC}"

# Get file sizes
OLD_SIZE=$(wc -c < "$REFERENCE_FILE" | tr -d ' ')
NEW_SIZE=$(wc -c < "$NEW_REFERENCE" | tr -d ' ')

echo "   Current reference: $(numfmt --to=iec $OLD_SIZE 2>/dev/null || echo "$OLD_SIZE bytes")"
echo "   New reference: $(numfmt --to=iec $NEW_SIZE 2>/dev/null || echo "$NEW_SIZE bytes")"

# Show key differences
echo ""
echo -e "${YELLOW}4. Key changes detected:${NC}"

# Check for new files
OLD_FILES=$(grep -c "^FILE:" "$REFERENCE_FILE" 2>/dev/null || echo "0")
NEW_FILES=$(grep -c "^FILE:" "$NEW_REFERENCE" 2>/dev/null || echo "0")
echo "   Files: $OLD_FILES -> $NEW_FILES"

# Check version if available
OLD_VERSION=$(grep -o "version.*[0-9]\+\.[0-9]\+\.[0-9]\+" "$REFERENCE_FILE" | head -1 || echo "unknown")
NEW_VERSION=$(grep -o "version.*[0-9]\+\.[0-9]\+\.[0-9]\+" "$NEW_REFERENCE" | head -1 || echo "unknown")
echo "   Version: $OLD_VERSION -> $NEW_VERSION"

echo ""
echo -e "${YELLOW}5. Update options:${NC}"
echo "   [y] Yes, update the reference file"
echo "   [d] Show detailed diff"
echo "   [n] No, keep current reference"
echo ""

read -p "What would you like to do? [y/d/n]: " choice

case $choice in
    y|Y)
        echo ""
        echo -e "${GREEN}Updating reference file...${NC}"
        cp "$NEW_REFERENCE" "$REFERENCE_FILE"
        echo -e "${GREEN}Done! Reference updated to commit $NEW_COMMIT${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Review changes: git diff docs/coderamp-labs-gitingest-*.txt"
        echo "  2. Update implementation if needed: lib/formatters/gitingest-formatter.js"
        echo "  3. Run tests: npm test"
        echo "  4. Commit: git add -A && git commit -m 'chore: update gitingest reference to $NEW_COMMIT'"
        ;;
    d|D)
        echo ""
        echo -e "${BLUE}Detailed diff:${NC}"
        diff -u "$REFERENCE_FILE" "$NEW_REFERENCE" | head -100 || true
        echo ""
        echo "(Showing first 100 lines of diff)"
        ;;
    *)
        echo ""
        echo -e "${YELLOW}Keeping current reference.${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}GitIngest repository: $GITINGEST_REPO${NC}"
echo -e "${BLUE}Reference file: $REFERENCE_FILE${NC}"
