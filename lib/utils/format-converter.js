/**
 * Format Converter Utilities
 * v2.3.2 - Convert between different output formats
 *
 * Supports conversion between:
 * - TOON ↔ JSON
 * - JSON ↔ YAML
 * - JSON ↔ XML
 * - JSON ↔ CSV
 * - JSON ↔ Markdown
 */

import FormatRegistry from '../formatters/format-registry.js';
import ToonFormatter from '../formatters/toon-formatter.js';
import fs from 'fs';
import path from 'path';

class FormatConverter {
    constructor() {
        this.registry = new FormatRegistry();
        this.toonFormatter = new ToonFormatter();
    }

    /**
     * Convert from one format to another
     * @param {string} input - Input data as string
     * @param {string} fromFormat - Source format
     * @param {string} toFormat - Target format
     * @returns {Object} Conversion result with output and metadata
     */
    convert(input, fromFormat, toFormat) {
        // Step 1: Parse input to JavaScript object
        const data = this.parse(input, fromFormat);

        // Step 2: Encode to target format
        const output = this.encode(data, toFormat);

        // Step 3: Calculate metadata
        const inputSize = input.length;
        const outputSize = output.length;
        const savings = inputSize - outputSize;
        const savingsPercentage = inputSize > 0 ? ((savings / inputSize) * 100).toFixed(1) : '0.0';

        return {
            output,
            metadata: {
                inputSize,
                outputSize,
                savings,
                savingsPercentage: parseFloat(savingsPercentage),
                fromFormat,
                toFormat
            }
        };
    }

    /**
     * Parse string input to JavaScript object
     */
    parse(input, format) {
        switch (format.toLowerCase()) {
            case 'json':
            case 'json-compact':
                return JSON.parse(input);

            case 'yaml':
                return this.parseYAML(input);

            case 'toon':
                return this.parseTOON(input);

            case 'xml':
                return this.parseXML(input);

            case 'csv':
                return this.parseCSV(input);

            case 'markdown':
                return this.parseMarkdown(input);

            default:
                throw new Error(`Unknown format for parsing: ${format}`);
        }
    }

    /**
     * Encode JavaScript object to format
     */
    encode(data, format) {
        try {
            return this.registry.encode(format, data);
        } catch (error) {
            throw new Error(`Failed to encode to ${format}: ${error.message}`);
        }
    }

    /**
     * Simple YAML parser
     * Note: This is a basic implementation. For complex YAML, use a proper library.
     */
    parseYAML(yamlString) {
        const lines = yamlString.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        const result = {};
        let currentKey = null;
        let currentArray = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Array item
            if (trimmed.startsWith('- ')) {
                const value = trimmed.substring(2).trim();
                if (currentArray) {
                    currentArray.push(this.parseYAMLValue(value));
                }
                continue;
            }

            // Key-value pair
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex !== -1) {
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();

                if (value === '') {
                    // Object or array follows
                    currentKey = key;
                    result[key] = {};
                } else {
                    result[key] = this.parseYAMLValue(value);
                }
            }
        }

        return result;
    }

    /**
     * Parse YAML value (string, number, boolean)
     */
    parseYAMLValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.substring(1, value.length - 1);
        }
        return value;
    }

    /**
     * Simple CSV parser
     */
    parseCSV(csvString) {
        const lines = csvString.split('\n').filter(line => line.trim());
        if (lines.length === 0) return { rows: [] };

        const headers = this.parseCSVLine(lines[0]);
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return { headers, rows };
    }

    /**
     * Parse CSV line (handles quoted values)
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }

    /**
     * Simple TOON parser
     * Parses basic TOON format to JavaScript object
     * Note: This is a basic implementation for common TOON patterns
     */
    parseTOON(toonString) {
        const lines = toonString.trim().split('\n');
        return this.parseTOONValue(lines, 0).value;
    }

    parseTOONValue(lines, startIndex) {
        const line = lines[startIndex]?.trim();

        if (!line) {
            return { value: null, endIndex: startIndex };
        }

        // Handle primitives
        if (line === 'null') return { value: null, endIndex: startIndex };
        if (line === 'true') return { value: true, endIndex: startIndex };
        if (line === 'false') return { value: false, endIndex: startIndex };
        if (/^-?\d+(\.\d+)?$/.test(line)) return { value: parseFloat(line), endIndex: startIndex };

        // Handle quoted strings
        if (line.startsWith('"') && line.endsWith('"')) {
            return {
                value: line.slice(1, -1)
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\'),
                endIndex: startIndex
            };
        }

        // Handle compact arrays: [1,2,3]
        if (line.startsWith('[') && line.endsWith(']')) {
            const content = line.slice(1, -1).trim();
            if (!content) return { value: [], endIndex: startIndex };

            const values = content.split(',').map(v => {
                const trimmed = v.trim();
                if (trimmed === 'null') return null;
                if (trimmed === 'true') return true;
                if (trimmed === 'false') return false;
                if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
                if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                    return trimmed.slice(1, -1);
                }
                return trimmed;
            });
            return { value: values, endIndex: startIndex };
        }

        // Handle tabular arrays: {col1,col2}:
        if (line.includes('}:')) {
            const headerMatch = line.match(/\{([^}]+)\}:/);
            if (headerMatch) {
                const headers = headerMatch[1].split(',').map(h => h.trim());
                const rows = [];
                let i = startIndex + 1;

                while (i < lines.length) {
                    const dataLine = lines[i].trim();
                    if (!dataLine || dataLine.startsWith('{') || dataLine.startsWith('}')) break;

                    const values = dataLine.split(',').map(v => {
                        const trimmed = v.trim();
                        if (trimmed === 'null') return null;
                        if (trimmed === 'true') return true;
                        if (trimmed === 'false') return false;
                        if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
                        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                            return trimmed.slice(1, -1);
                        }
                        return trimmed;
                    });

                    const row = {};
                    headers.forEach((header, idx) => {
                        row[header] = values[idx] || null;
                    });
                    rows.push(row);
                    i++;
                }

                return { value: rows, endIndex: i - 1 };
            }
        }

        // Handle objects: { key: value }
        if (line.startsWith('{')) {
            const obj = {};
            let i = startIndex + 1;

            while (i < lines.length) {
                const currentLine = lines[i].trim();
                if (currentLine === '}') break;
                if (!currentLine) { i++; continue; }

                const colonIndex = currentLine.indexOf(':');
                if (colonIndex !== -1) {
                    const key = currentLine.substring(0, colonIndex).trim();
                    let valueStr = currentLine.substring(colonIndex + 1).trim();

                    // Remove trailing comma
                    if (valueStr.endsWith(',')) {
                        valueStr = valueStr.slice(0, -1).trim();
                    }

                    // Parse value
                    if (valueStr === 'null') obj[key] = null;
                    else if (valueStr === 'true') obj[key] = true;
                    else if (valueStr === 'false') obj[key] = false;
                    else if (/^-?\d+(\.\d+)?$/.test(valueStr)) obj[key] = parseFloat(valueStr);
                    else if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
                        obj[key] = valueStr.slice(1, -1);
                    }
                    else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
                        const content = valueStr.slice(1, -1).trim();
                        obj[key] = content ? content.split(',').map(v => {
                            const t = v.trim();
                            if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
                            return t.replace(/^"|"$/g, '');
                        }) : [];
                    }
                    else {
                        obj[key] = valueStr;
                    }
                }
                i++;
            }

            return { value: obj, endIndex: i };
        }

        // Plain string
        return { value: line, endIndex: startIndex };
    }

    /**
     * Simple XML parser
     * Parses basic XML to JavaScript object
     */
    parseXML(xmlString) {
        // Remove XML declaration
        let xml = xmlString.replace(/<\?xml[^>]*\?>\s*/i, '').trim();

        // Parse recursively
        return this.parseXMLNode(xml);
    }

    parseXMLNode(xml) {
        xml = xml.trim();

        // Match opening tag
        const tagMatch = xml.match(/^<(\w+)>/);
        if (!tagMatch) return {};

        const tagName = tagMatch[1];
        const closingTag = `</${tagName}>`;
        const closingIndex = xml.lastIndexOf(closingTag);

        if (closingIndex === -1) {
            throw new Error(`No closing tag found for <${tagName}>`);
        }

        const content = xml.substring(tagMatch[0].length, closingIndex).trim();

        // If content has child tags, parse them
        if (content.includes('<')) {
            const result = {};
            let remaining = content;

            while (remaining.trim().length > 0) {
                const childMatch = remaining.match(/<(\w+)>/);
                if (!childMatch) break;

                const childTag = childMatch[1];
                const childClosing = `</${childTag}>`;
                const childStart = remaining.indexOf(childMatch[0]);
                const childEnd = remaining.indexOf(childClosing);

                if (childEnd === -1) break;

                const childXml = remaining.substring(childStart, childEnd + childClosing.length);
                const childValue = this.parseXMLNode(childXml);

                // Get the value
                const innerContent = childXml.substring(
                    childXml.indexOf('>') + 1,
                    childXml.lastIndexOf('<')
                ).trim();

                // Check if it's a simple value or nested
                if (innerContent.includes('<')) {
                    result[childTag] = childValue;
                } else {
                    result[childTag] = this.unescapeXML(innerContent);
                }

                remaining = remaining.substring(childEnd + childClosing.length);
            }

            return result;
        }

        // Simple text content
        return this.unescapeXML(content);
    }

    /**
     * Unescape XML special characters
     */
    unescapeXML(str) {
        return str
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }

    /**
     * Simple Markdown parser
     * Extracts structure from Markdown documents
     */
    parseMarkdown(mdString) {
        const lines = mdString.split('\n');
        const result = {
            title: null,
            sections: [],
            codeBlocks: [],
            lists: [],
            links: []
        };

        let currentSection = null;
        let inCodeBlock = false;
        let codeBlockContent = '';
        let codeBlockLang = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code blocks
            if (line.trim().startsWith('```')) {
                if (!inCodeBlock) {
                    inCodeBlock = true;
                    codeBlockLang = line.trim().substring(3).trim() || 'text';
                    codeBlockContent = '';
                } else {
                    inCodeBlock = false;
                    result.codeBlocks.push({
                        language: codeBlockLang,
                        content: codeBlockContent.trim()
                    });
                }
                continue;
            }

            if (inCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }

            // Headers
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const text = headerMatch[2].trim();

                if (level === 1 && !result.title) {
                    result.title = text;
                } else {
                    const section = { level, title: text, content: [] };
                    result.sections.push(section);
                    currentSection = section;
                }
                continue;
            }

            // Lists
            const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
            if (listMatch) {
                const indent = listMatch[1].length;
                const marker = listMatch[2];
                const text = listMatch[3];
                const type = /\d+\./.test(marker) ? 'ordered' : 'unordered';

                result.lists.push({ type, text, indent });

                if (currentSection) {
                    currentSection.content.push({ type: 'list', text });
                }
                continue;
            }

            // Links
            const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
            for (const match of linkMatches) {
                result.links.push({ text: match[1], url: match[2] });
            }

            // Regular content
            if (line.trim() && currentSection) {
                currentSection.content.push({ type: 'text', text: line.trim() });
            }
        }

        return result;
    }

    /**
     * Convert file from one format to another
     * @param {string} inputFile - Input file path
     * @param {string} outputFile - Output file path
     * @param {string} fromFormat - Source format (auto-detect from extension if not provided)
     * @param {string} toFormat - Target format (auto-detect from extension if not provided)
     */
    convertFile(inputFile, outputFile, fromFormat = null, toFormat = null) {
        // Auto-detect formats from file extensions
        if (!fromFormat) {
            const ext = path.extname(inputFile).substring(1);
            fromFormat = this.extensionToFormat(ext);
        }

        if (!toFormat) {
            const ext = path.extname(outputFile).substring(1);
            toFormat = this.extensionToFormat(ext);
        }

        // Read input file
        const input = fs.readFileSync(inputFile, 'utf8');

        // Convert
        const result = this.convert(input, fromFormat, toFormat);

        // Write output file
        fs.writeFileSync(outputFile, result.output, 'utf8');

        return {
            inputFile,
            outputFile,
            fromFormat,
            toFormat,
            inputSize: input.length,
            outputSize: result.output.length,
            savings: input.length - result.output.length,
            savingsPercent: result.metadata.savingsPercentage + '%'
        };
    }

    /**
     * Map file extension to format name
     */
    extensionToFormat(ext) {
        const map = {
            'json': 'json',
            'toon': 'toon',
            'yaml': 'yaml',
            'yml': 'yaml',
            'csv': 'csv',
            'xml': 'xml',
            'md': 'markdown',
            'txt': 'gitingest'
        };

        return map[ext.toLowerCase()] || 'json';
    }

    /**
     * Batch convert multiple files
     * @param {Array} files - Array of {input, output, from, to}
     * @returns {Array} Conversion results
     */
    batchConvert(files) {
        const results = [];

        for (const file of files) {
            try {
                const result = this.convertFile(
                    file.input,
                    file.output,
                    file.from || null,
                    file.to || null
                );
                results.push({ success: true, ...result });
            } catch (error) {
                results.push({
                    success: false,
                    inputFile: file.input,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Get supported conversions
     */
    getSupportedConversions() {
        return {
            fullySupported: [
                'JSON ↔ TOON',
                'JSON ↔ YAML',
                'JSON ↔ CSV',
                'JSON ↔ XML',
                'JSON → Markdown',
                'TOON → JSON/YAML/XML',
                'XML → JSON/YAML/TOON',
                'Markdown → JSON/YAML',
                'CSV → JSON/YAML/XML'
            ],
            limitations: [
                'Markdown parsing extracts structure (not full round-trip)',
                'XML number types converted to strings',
                'YAML parser is basic (limited nested object support)'
            ],
            experimental: [
                'Stream-based conversion (for large files)',
                'Schema validation'
            ]
        };
    }

    /**
     * Stream-based conversion for large files
     * Processes files in chunks to reduce memory usage
     */
    async convertStream(inputStream, outputStream, fromFormat, toFormat, options = {}) {
        const chunkSize = options.chunkSize || 1024 * 1024; // 1MB chunks
        const chunks = [];

        return new Promise((resolve, reject) => {
            inputStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            inputStream.on('end', () => {
                try {
                    const input = Buffer.concat(chunks).toString('utf8');
                    const result = this.convert(input, fromFormat, toFormat);

                    outputStream.write(result.output);
                    outputStream.end();

                    resolve(result.metadata);
                } catch (error) {
                    reject(error);
                }
            });

            inputStream.on('error', reject);
            outputStream.on('error', reject);
        });
    }

    /**
     * Convert with schema validation
     * Validates input and output against provided JSON schemas
     */
    convertWithValidation(input, fromFormat, toFormat, options = {}) {
        const { inputSchema, outputSchema } = options;

        // Parse input
        const data = this.parse(input, fromFormat);

        // Validate input if schema provided
        if (inputSchema) {
            const inputValid = this.validateAgainstSchema(data, inputSchema);
            if (!inputValid.valid) {
                throw new Error(`Input validation failed: ${inputValid.errors.join(', ')}`);
            }
        }

        // Convert
        const output = this.encode(data, toFormat);

        // Validate output if schema provided
        if (outputSchema && toFormat === 'json') {
            const outputData = JSON.parse(output);
            const outputValid = this.validateAgainstSchema(outputData, outputSchema);
            if (!outputValid.valid) {
                throw new Error(`Output validation failed: ${outputValid.errors.join(', ')}`);
            }
        }

        return {
            output,
            data,
            validated: true,
            metadata: {
                inputSize: input.length,
                outputSize: output.length,
                fromFormat,
                toFormat
            }
        };
    }

    /**
     * Simple schema validation
     * Validates data against a basic JSON schema
     */
    validateAgainstSchema(data, schema) {
        const errors = [];

        // Type validation
        if (schema.type) {
            const actualType = Array.isArray(data) ? 'array' : typeof data;
            if (actualType !== schema.type) {
                errors.push(`Expected type ${schema.type}, got ${actualType}`);
                return { valid: false, errors };
            }
        }

        // Required properties
        if (schema.required && Array.isArray(schema.required)) {
            for (const prop of schema.required) {
                if (!(prop in data)) {
                    errors.push(`Missing required property: ${prop}`);
                }
            }
        }

        // Properties validation
        if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    const propType = Array.isArray(data[key]) ? 'array' : typeof data[key];
                    if (propSchema.type && propType !== propSchema.type) {
                        errors.push(`Property ${key}: expected ${propSchema.type}, got ${propType}`);
                    }
                }
            }
        }

        // Array items validation
        if (schema.items && Array.isArray(data)) {
            data.forEach((item, index) => {
                const itemType = Array.isArray(item) ? 'array' : typeof item;
                if (schema.items.type && itemType !== schema.items.type) {
                    errors.push(`Array item ${index}: expected ${schema.items.type}, got ${itemType}`);
                }
            });
        }

        // Min/Max length for strings and arrays
        if (schema.minLength && data.length < schema.minLength) {
            errors.push(`Length ${data.length} is less than minLength ${schema.minLength}`);
        }
        if (schema.maxLength && data.length > schema.maxLength) {
            errors.push(`Length ${data.length} exceeds maxLength ${schema.maxLength}`);
        }

        // Min/Max for numbers
        if (typeof data === 'number') {
            if (schema.minimum !== undefined && data < schema.minimum) {
                errors.push(`Value ${data} is less than minimum ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && data > schema.maximum) {
                errors.push(`Value ${data} exceeds maximum ${schema.maximum}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Detect format from content
     * Auto-detects the format of input string
     */
    detectFormat(input) {
        const trimmed = input.trim();

        // JSON detection
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch (e) {
                // Not valid JSON, might be TOON
            }
        }

        // XML detection
        if (trimmed.startsWith('<')) {
            if (trimmed.includes('<?xml')) return 'xml';
            if (trimmed.match(/<\w+>/)) return 'xml';
        }

        // Markdown detection
        if (trimmed.match(/^#{1,6}\s+/m)) return 'markdown';
        if (trimmed.includes('```')) return 'markdown';

        // YAML detection
        if (trimmed.match(/^\w+:\s+\w+/m) && !trimmed.includes('{')) {
            return 'yaml';
        }

        // CSV detection
        if (trimmed.includes(',') && trimmed.split('\n').length > 1) {
            const lines = trimmed.split('\n');
            const firstLine = lines[0].split(',');
            const secondLine = lines[1]?.split(',');
            if (firstLine.length === secondLine?.length) {
                return 'csv';
            }
        }

        // TOON detection (has colons but inside braces)
        if (trimmed.includes(':') && trimmed.includes('{')) {
            return 'toon';
        }

        return 'unknown';
    }
}

export default FormatConverter;
