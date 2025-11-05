#!/usr/bin/env node

/**
 * Simple v3.0.0 Test - Debug version
 */

import Scanner from '../lib/core/Scanner.js';

console.log('🧪 Simple v3.0.0 Test...\n');

try {
  console.log('1. Creating Scanner...');
  const scanner = new Scanner(process.cwd());
  console.log('   ✅ Scanner created');

  console.log('\n2. Scanning directory...');
  const files = scanner.scan();
  console.log(`   ✅ Scan complete: ${files.length} files found`);

  console.log('\n3. First 5 files:');
  files.slice(0, 5).forEach((file, i) => {
    console.log(`   ${i + 1}. ${file.relativePath} (${file.size} bytes)`);
  });

  console.log('\n4. Scanner stats:');
  const stats = scanner.getStats();
  console.log(`   Scanned: ${stats.filesScanned}`);
  console.log(`   Ignored: ${stats.filesIgnored}`);
  console.log(`   Dirs: ${stats.directoriesTraversed}`);

  console.log('\n✅ All tests passed!');
  process.exit(0);

} catch (error) {
  console.log(`\n❌ Error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
  process.exit(1);
}
