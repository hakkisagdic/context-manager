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

echo "All fast tests completed"
