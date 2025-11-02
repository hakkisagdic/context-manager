.PHONY: help install uninstall test clean build-deb build-rpm

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)Context Manager - Build & Installation$(NC)"
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@echo "  make install        - Install context-manager locally (macOS/Linux)"
	@echo "  make uninstall      - Uninstall context-manager"
	@echo "  make test           - Run all tests"
	@echo "  make test-quick     - Run quick tests"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make build-deb      - Build Debian package"
	@echo "  make build-rpm      - Build RPM package (Red Hat/Fedora)"
	@echo "  make homebrew       - Install via Homebrew (macOS)"
	@echo ""
	@echo "$(YELLOW)Windows users:$(NC)"
	@echo "  powershell -ExecutionPolicy Bypass -File scripts/install.ps1"
	@echo ""

install:
	@echo "$(BLUE)Installing Context Manager...$(NC)"
	@bash scripts/install.sh

uninstall:
	@echo "$(BLUE)Uninstalling Context Manager...$(NC)"
	@bash scripts/uninstall.sh

test:
	@echo "$(BLUE)Running comprehensive test suite...$(NC)"
	@npm run test:all

test-quick:
	@echo "$(BLUE)Running quick tests...$(NC)"
	@npm test

clean:
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf node_modules/
	@rm -rf .context-manager/logs/*
	@rm -f token-analysis-report.json
	@rm -f llm-context.json
	@rm -f digest.txt
	@echo "$(GREEN)✓ Clean complete$(NC)"

build-deb:
	@echo "$(BLUE)Building Debian package...$(NC)"
	@mkdir -p debian/usr/local/bin
	@mkdir -p debian/usr/local/lib/context-manager
	@cp -r lib bin index.js context-manager.js package.json debian/usr/local/lib/context-manager/
	@chmod 755 debian/DEBIAN/postinst
	@dpkg-deb --build debian context-manager_2.3.5_all.deb
	@echo "$(GREEN)✓ Debian package created: context-manager_2.3.5_all.deb$(NC)"

build-rpm:
	@echo "$(BLUE)Building RPM package...$(NC)"
	@echo "$(YELLOW)RPM build requires rpmbuild to be installed$(NC)"
	@echo "Install: sudo yum install rpm-build (Red Hat/CentOS)"
	@echo "         sudo dnf install rpm-build (Fedora)"

homebrew:
	@echo "$(BLUE)Installing via Homebrew...$(NC)"
	@echo "$(YELLOW)Note: Formula must be published to Homebrew tap first$(NC)"
	@echo ""
	@echo "For now, use:"
	@echo "  brew tap hakkisagdic/context-manager"
	@echo "  brew install context-manager"
	@echo ""
	@echo "Or install via npm:"
	@echo "  npm install -g @hakkisagdic/context-manager"

.DEFAULT_GOAL := help
