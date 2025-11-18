# Test Data Generators

This directory contains reusable generators for creating test data.

## Available Generators

- `file-generators.js` - Generate random file structures
- `code-generators.js` - Generate random code snippets
- `config-generators.js` - Generate random configurations
- `context-generators.js` - Generate random context objects

## Usage

```javascript
import { generateRandomFile, generateFileSet } from './generators/file-generators.js';

const file = generateRandomFile({ extension: '.js', minLines: 10, maxLines: 100 });
const fileSet = generateFileSet({ count: 50, types: ['.js', '.ts', '.py'] });
```
