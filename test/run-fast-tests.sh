#!/bin/bash
# Run fast test suites for coverage analysis

node test/test-core-comprehensive.js > /dev/null 2>&1
node test/test-language-edge-cases.js > /dev/null 2>&1
node test/test-formatters-comprehensive.js > /dev/null 2>&1
node test/test-utils-error-handler.js > /dev/null 2>&1
node test/test-utils-comprehensive-2.js > /dev/null 2>&1
node test/test-parsers-comprehensive.js > /dev/null 2>&1
node test/test-plugins-comprehensive.js > /dev/null 2>&1
node test/test-llm-detector.js > /dev/null 2>&1
node test/test-format-converter.js > /dev/null 2>&1
node test/test-logger-comprehensive.js > /dev/null 2>&1
node test/test-git-utils.js > /dev/null 2>&1
node test/test-git-utils-comprehensive.js > /dev/null 2>&1
node test/test-cache-manager.js > /dev/null 2>&1
node test/test-updater.js > /dev/null 2>&1
node test/test-token-calculator.js > /dev/null 2>&1
node test/test-token-calculator-extended.js > /dev/null 2>&1
node test/test-gitingest-formatter.js > /dev/null 2>&1
node test/test-clipboard-utils.js > /dev/null 2>&1
node test/test-api-server.js > /dev/null 2>&1
node test/test-api-server-extended.js > /dev/null 2>&1
node test/test-file-watcher.js > /dev/null 2>&1
node test/test-incremental-analyzer.js > /dev/null 2>&1
node test/test-blame-tracker.js > /dev/null 2>&1
node test/test-diff-analyzer.js > /dev/null 2>&1
node test/test-git-client.js > /dev/null 2>&1
node test/test-toon-formatter-v13.js > /dev/null 2>&1
echo "All fast tests completed"
