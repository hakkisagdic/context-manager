import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyzer = new MethodAnalyzer();

const fixtures = [
  { file: 'sample.sql', expected: 'tsql', minObjects: 15 },
  { file: 'sample-postgres.sql', expected: 'pgsql', minObjects: 10 },
  { file: 'sample-mysql.sql', expected: 'mysql', minObjects: 8 },
  { file: 'sample-oracle.sql', expected: 'oracle', minObjects: 10 },
  { file: 'sample-sqlite.sql', expected: 'sqlite', minObjects: 13 },
  { file: 'sample-snowflake.sql', expected: 'snowflake', minObjects: 15 },
  { file: 'sample-db2.sql', expected: 'db2', minObjects: 10 },
  { file: 'sample-redshift.sql', expected: 'redshift', minObjects: 10 },
  { file: 'sample-bigquery.sql', expected: 'bigquery', minObjects: 10 }
];

console.log('=== Testing All SQL Dialect Detection and Extraction ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

fixtures.forEach(({ file, expected, minObjects }) => {
  const filePath = path.join(__dirname, 'fixtures', file);

  if (!fs.existsSync(filePath)) {
    console.log(`✗ ${file}: File not found`);
    totalTests += 2;
    failedTests.push(`${file}: File not found`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Test 1: Dialect Detection
  totalTests++;
  const detected = analyzer.detectSQLDialect(content);
  if (detected === expected) {
    console.log(`✓ ${file}: Detected as '${detected}'`);
    passedTests++;
  } else {
    console.log(`✗ ${file}: Expected '${expected}', got '${detected}'`);
    failedTests.push(`${file}: Detection failed (expected ${expected}, got ${detected})`);
  }

  // Test 2: Method Extraction
  totalTests++;
  const methods = analyzer.extractMethods(content, filePath);
  if (methods && methods.length >= minObjects) {
    console.log(`✓ ${file}: Extracted ${methods.length} objects (expected >= ${minObjects})`);
    passedTests++;

    // Show first 5 methods with details
    console.log(`  Top objects:`);
    methods.slice(0, 5).forEach(m => {
      console.log(`  - ${m.name} (${m.type}) at line ${m.line}`);
    });
  } else {
    const actualCount = methods ? methods.length : 0;
    console.log(`✗ ${file}: Extracted ${actualCount} objects (expected >= ${minObjects})`);
    failedTests.push(`${file}: Extraction failed (got ${actualCount}, expected >= ${minObjects})`);

    if (methods && methods.length > 0) {
      console.log(`  Extracted objects:`);
      methods.forEach(m => {
        console.log(`  - ${m.name} (${m.type}) at line ${m.line}`);
      });
    }
  }
  console.log();
});

console.log(`\n=== Summary: ${passedTests}/${totalTests} tests passed ===\n`);

if (failedTests.length > 0) {
  console.log('Failed tests:');
  failedTests.forEach(test => console.log(`  - ${test}`));
  process.exit(1);
} else {
  console.log('✅ All SQL dialect tests passed!');
  process.exit(0);
}
