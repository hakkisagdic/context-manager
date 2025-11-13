#!/usr/bin/env node

/**
 * Script to convert test files from CommonJS to ES modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
    'run-all-tests.js',
    'test-cli-integration.js',
    'test-csharp.js',
    'test-dashboard.js',
    'test-git-integration.js',
    'test-gitingest-json.js',
    'test-gitingest.js',
    'test-go-analyzer.js',
    'test-ink-ui.js',
    'test-java-support.js',
    'test-rust.js',
    'test-suite.js',
    'test-toon-format.js',
    'test-v2.3-features.js',
    'test-wizard.js',
    'unit-tests.js'
];

function convertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already converted
    if (content.includes('import {') || content.includes('import path from')) {
        console.log(`⏭️  Skipping ${path.basename(filePath)} - already converted`);
        return;
    }

    // Add __dirname/__filename polyfill if not present
    const needsDirname = content.includes('__dirname');
    const needsFilename = content.includes('__filename');

    // Convert require statements
    const replacements = [
        // Core module imports
        {
            from: /const { ([^}]+) } = require\('\.\.\/index\.js'\);/g,
            to: (match, imports) => {
                // Replace TokenAnalyzer with TokenCalculator as TokenAnalyzer
                const fixedImports = imports.replace(/TokenAnalyzer/g, 'TokenCalculator as TokenAnalyzer');
                return `import { ${fixedImports} } from '../index.js';`;
            }
        },
        { from: /const fs = require\('fs'\);/g, to: "import fs from 'fs';" },
        { from: /const path = require\('path'\);/g, to: "import path from 'path';" },
        { from: /const { execSync } = require\('child_process'\);/g, to: "import { execSync } from 'child_process';" },
        { from: /const { spawn, exec } = require\('child_process'\);/g, to: "import { spawn, exec } from 'child_process';" },
        { from: /const { exec } = require\('child_process'\);/g, to: "import { exec } from 'child_process';" },
        { from: /const assert = require\('assert'\);/g, to: "import assert from 'assert';" },
        { from: /const os = require\('os'\);/g, to: "import os from 'os';" },
    ];

    replacements.forEach(({ from, to }) => {
        if (typeof to === 'function') {
            content = content.replace(from, to);
        } else {
            content = content.replace(from, to);
        }
    });

    // Add __dirname/__filename polyfill after imports if needed
    if ((needsDirname || needsFilename) && !content.includes('fileURLToPath')) {
        const importSection = content.match(/(import .+\n)+/);
        if (importSection) {
            const polyfill = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`;
            content = content.replace(importSection[0], importSection[0] + '\n' + polyfill);
        }
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Converted ${path.basename(filePath)}`);
}

console.log('🔄 Converting test files to ES modules...\n');

testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            convertFile(filePath);
        } catch (error) {
            console.error(`❌ Error converting ${file}: ${error.message}`);
        }
    }
});

console.log('\n✨ Conversion complete!');
