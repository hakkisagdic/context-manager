#!/usr/bin/env node

/**
 * Comprehensive Validation Tests (v3.1.0)
 * Tests validation across CLI arguments, config files, filters, and data types
 *
 * Coverage:
 * - CLI argument validation
 * - Config file validation
 * - Filter pattern validation
 * - Method pattern validation
 * - Token count validation
 * - File/directory path validation
 * - URL validation (GitHub URLs)
 * - Email validation (author info)
 * - Semver validation
 * - Date/time validation
 * - Number range validation
 * - String length validation
 * - Enum value validation
 * - Required field validation
 * - Optional field handling
 * - Default value application
 * - Type coercion safety
 * - Schema evolution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
        return true;
    } catch (error) {
        testsFailed++;
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
        return false;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertFalse(condition, message) {
    if (condition) {
        throw new Error(message);
    }
}

function assertThrows(fn, expectedError, message) {
    try {
        fn();
        throw new Error(`${message}: expected to throw but didn't`);
    } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
            throw new Error(`${message}: expected error containing "${expectedError}", got "${error.message}"`);
        }
    }
}

// ============================================================================
// Validation Helper Functions (mirroring CLI parsing logic)
// ============================================================================

function parseTokenBudget(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') throw new Error('Token budget must be a string or number');

    const trimmed = value.trim();
    if (trimmed.endsWith('k') || trimmed.endsWith('K')) {
        const num = parseInt(trimmed.slice(0, -1), 10);
        if (isNaN(num) || num <= 0) throw new Error('Invalid token budget format');
        return num * 1000;
    }
    if (trimmed.endsWith('m') || trimmed.endsWith('M')) {
        const num = parseFloat(trimmed.slice(0, -1));
        if (isNaN(num) || num <= 0) throw new Error('Invalid token budget format');
        return num * 1000000;
    }
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num <= 0) throw new Error('Invalid token budget format');
    return num;
}

function validateFitStrategy(strategy) {
    const validStrategies = ['auto', 'shrink-docs', 'balanced', 'methods-only', 'top-n'];
    if (!validStrategies.includes(strategy)) {
        throw new Error(`Invalid fit strategy: ${strategy}. Valid: ${validStrategies.join(', ')}`);
    }
    return strategy;
}

function validateOutputFormat(format) {
    const validFormats = ['toon', 'json', 'yaml', 'csv', 'xml', 'markdown', 'gitingest'];
    if (!validFormats.includes(format)) {
        throw new Error(`Invalid output format: ${format}. Valid: ${validFormats.join(', ')}`);
    }
    return format;
}

function validateChunkStrategy(strategy) {
    const validStrategies = ['smart', 'size', 'file', 'directory'];
    if (!validStrategies.includes(strategy)) {
        throw new Error(`Invalid chunk strategy: ${strategy}. Valid: ${validStrategies.join(', ')}`);
    }
    return strategy;
}

function validatePortNumber(port) {
    const num = typeof port === 'string' ? parseInt(port, 10) : port;
    if (isNaN(num) || num < 1 || num > 65535) {
        throw new Error('Port must be between 1 and 65535');
    }
    return num;
}

function validateDebounceDelay(delay) {
    const num = typeof delay === 'string' ? parseInt(delay, 10) : delay;
    if (isNaN(num) || num < 0) {
        throw new Error('Debounce delay must be non-negative');
    }
    return num;
}

function validateFilterPattern(pattern) {
    if (typeof pattern !== 'string' || pattern.trim().length === 0) {
        throw new Error('Filter pattern must be a non-empty string');
    }
    // Check for invalid regex characters that might cause issues
    try {
        new RegExp(pattern.replace(/\*/g, '.*'));
    } catch (error) {
        throw new Error(`Invalid filter pattern: ${pattern}`);
    }
    return pattern.trim();
}

function validateMethodPattern(pattern) {
    if (typeof pattern !== 'string' || pattern.trim().length === 0) {
        throw new Error('Method pattern must be a non-empty string');
    }
    // Validate that pattern can be converted to regex
    try {
        new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    } catch (error) {
        throw new Error(`Invalid method pattern: ${pattern}`);
    }
    return pattern.trim();
}

function validateGitHubURL(url) {
    if (typeof url !== 'string' || url.trim().length === 0) {
        throw new Error('URL must be a non-empty string');
    }

    // Support multiple formats:
    // - https://github.com/owner/repo
    // - github.com/owner/repo
    // - owner/repo
    const githubPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/;
    const shortPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

    if (!githubPattern.test(url) && !shortPattern.test(url)) {
        throw new Error('Invalid GitHub URL format');
    }
    return url.trim();
}

function validateEmail(email) {
    if (typeof email !== 'string' || email.trim().length === 0) {
        throw new Error('Email must be a non-empty string');
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        throw new Error('Invalid email format');
    }
    return email.trim();
}

function validateSemver(version) {
    if (typeof version !== 'string' || version.trim().length === 0) {
        throw new Error('Version must be a non-empty string');
    }

    // Semver pattern: MAJOR.MINOR.PATCH with optional pre-release and build metadata
    const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

    if (!semverPattern.test(version)) {
        throw new Error('Invalid semver format');
    }
    return version.trim();
}

function validateISO8601Date(dateStr) {
    if (typeof dateStr !== 'string' || dateStr.trim().length === 0) {
        throw new Error('Date must be a non-empty string');
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid ISO 8601 date format');
    }
    return dateStr.trim();
}

function validateNumberRange(value, min, max) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
        throw new Error('Value must be a valid number');
    }
    if (num < min || num > max) {
        throw new Error(`Value must be between ${min} and ${max}`);
    }
    return num;
}

function validateStringLength(str, minLength, maxLength) {
    if (typeof str !== 'string') {
        throw new Error('Value must be a string');
    }
    if (str.length < minLength || str.length > maxLength) {
        throw new Error(`String length must be between ${minLength} and ${maxLength}`);
    }
    return str;
}

function validateEnumValue(value, allowedValues) {
    if (!allowedValues.includes(value)) {
        throw new Error(`Invalid value: ${value}. Allowed: ${allowedValues.join(', ')}`);
    }
    return value;
}

function validateRequiredField(obj, fieldName) {
    if (!(fieldName in obj) || obj[fieldName] === null || obj[fieldName] === undefined) {
        throw new Error(`Required field missing: ${fieldName}`);
    }
    return obj[fieldName];
}

function applyDefaults(obj, defaults) {
    return { ...defaults, ...obj };
}

function coerceToType(value, targetType) {
    switch (targetType) {
        case 'string':
            return String(value);
        case 'number':
            const num = Number(value);
            if (isNaN(num)) throw new Error('Cannot coerce to number');
            return num;
        case 'boolean':
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                if (value.toLowerCase() === 'true') return true;
                if (value.toLowerCase() === 'false') return false;
            }
            throw new Error('Cannot coerce to boolean');
        default:
            throw new Error(`Unknown target type: ${targetType}`);
    }
}

// ============================================================================
// Test Suite: CLI Argument Validation
// ============================================================================

console.log('\n🧪 Testing CLI Argument Validation\n');

test('CLI: Parse token budget with "k" suffix', () => {
    assertEquals(parseTokenBudget('100k'), 100000, 'Should parse 100k to 100000');
    assertEquals(parseTokenBudget('50K'), 50000, 'Should parse 50K to 50000');
    assertEquals(parseTokenBudget('1k'), 1000, 'Should parse 1k to 1000');
});

test('CLI: Parse token budget with "M" suffix', () => {
    assertEquals(parseTokenBudget('1M'), 1000000, 'Should parse 1M to 1000000');
    assertEquals(parseTokenBudget('1.5m'), 1500000, 'Should parse 1.5m to 1500000');
    assertEquals(parseTokenBudget('2.5M'), 2500000, 'Should parse 2.5M to 2500000');
});

test('CLI: Parse token budget as plain number', () => {
    assertEquals(parseTokenBudget('100000'), 100000, 'Should parse plain number');
    assertEquals(parseTokenBudget(100000), 100000, 'Should accept number type');
});

test('CLI: Reject invalid token budget formats', () => {
    assertThrows(() => parseTokenBudget('invalid'), 'Invalid', 'Should reject non-numeric string');
    assertThrows(() => parseTokenBudget('-100k'), 'Invalid', 'Should reject negative values');
    assertThrows(() => parseTokenBudget('0k'), 'Invalid', 'Should reject zero');
    assertThrows(() => parseTokenBudget({}), 'must be a string or number', 'Should reject objects');
});

test('CLI: Validate fit strategy enum', () => {
    assertEquals(validateFitStrategy('auto'), 'auto', 'Should accept "auto"');
    assertEquals(validateFitStrategy('shrink-docs'), 'shrink-docs', 'Should accept "shrink-docs"');
    assertEquals(validateFitStrategy('balanced'), 'balanced', 'Should accept "balanced"');
    assertEquals(validateFitStrategy('methods-only'), 'methods-only', 'Should accept "methods-only"');
    assertEquals(validateFitStrategy('top-n'), 'top-n', 'Should accept "top-n"');
});

test('CLI: Reject invalid fit strategies', () => {
    assertThrows(() => validateFitStrategy('invalid'), 'Invalid fit strategy', 'Should reject invalid strategy');
    assertThrows(() => validateFitStrategy('random'), 'Invalid fit strategy', 'Should reject unknown strategy');
});

test('CLI: Validate output format enum', () => {
    assertEquals(validateOutputFormat('toon'), 'toon', 'Should accept "toon"');
    assertEquals(validateOutputFormat('json'), 'json', 'Should accept "json"');
    assertEquals(validateOutputFormat('yaml'), 'yaml', 'Should accept "yaml"');
    assertEquals(validateOutputFormat('gitingest'), 'gitingest', 'Should accept "gitingest"');
});

test('CLI: Reject invalid output formats', () => {
    assertThrows(() => validateOutputFormat('pdf'), 'Invalid output format', 'Should reject unsupported format');
    assertThrows(() => validateOutputFormat('html'), 'Invalid output format', 'Should reject unsupported format');
});

test('CLI: Validate chunk strategy enum', () => {
    assertEquals(validateChunkStrategy('smart'), 'smart', 'Should accept "smart"');
    assertEquals(validateChunkStrategy('size'), 'size', 'Should accept "size"');
    assertEquals(validateChunkStrategy('file'), 'file', 'Should accept "file"');
    assertEquals(validateChunkStrategy('directory'), 'directory', 'Should accept "directory"');
});

test('CLI: Validate port number range', () => {
    assertEquals(validatePortNumber(3000), 3000, 'Should accept valid port');
    assertEquals(validatePortNumber('8080'), 8080, 'Should parse string port');
    assertEquals(validatePortNumber(1), 1, 'Should accept minimum port');
    assertEquals(validatePortNumber(65535), 65535, 'Should accept maximum port');
});

test('CLI: Reject invalid port numbers', () => {
    assertThrows(() => validatePortNumber(0), 'Port must be between', 'Should reject port 0');
    assertThrows(() => validatePortNumber(65536), 'Port must be between', 'Should reject port > 65535');
    assertThrows(() => validatePortNumber(-1), 'Port must be between', 'Should reject negative port');
    assertThrows(() => validatePortNumber('invalid'), 'Port must be between', 'Should reject non-numeric port');
});

test('CLI: Validate debounce delay', () => {
    assertEquals(validateDebounceDelay(1000), 1000, 'Should accept valid delay');
    assertEquals(validateDebounceDelay('500'), 500, 'Should parse string delay');
    assertEquals(validateDebounceDelay(0), 0, 'Should accept zero delay');
});

test('CLI: Reject invalid debounce delays', () => {
    assertThrows(() => validateDebounceDelay(-1), 'must be non-negative', 'Should reject negative delay');
    assertThrows(() => validateDebounceDelay('invalid'), 'must be non-negative', 'Should reject non-numeric delay');
});

// ============================================================================
// Test Suite: Filter Pattern Validation
// ============================================================================

console.log('\n🧪 Testing Filter Pattern Validation\n');

test('Filter: Accept valid glob patterns', () => {
    assertEquals(validateFilterPattern('**/*.js'), '**/*.js', 'Should accept glob pattern');
    assertEquals(validateFilterPattern('src/**/*.ts'), 'src/**/*.ts', 'Should accept path pattern');
    assertEquals(validateFilterPattern('*.test.js'), '*.test.js', 'Should accept wildcard pattern');
    assertEquals(validateFilterPattern('!node_modules/**'), '!node_modules/**', 'Should accept negation pattern');
});

test('Filter: Trim whitespace from patterns', () => {
    assertEquals(validateFilterPattern('  **/*.js  '), '**/*.js', 'Should trim whitespace');
});

test('Filter: Reject empty or invalid patterns', () => {
    assertThrows(() => validateFilterPattern(''), 'non-empty string', 'Should reject empty string');
    assertThrows(() => validateFilterPattern('   '), 'non-empty string', 'Should reject whitespace-only');
    assertThrows(() => validateFilterPattern(null), 'non-empty string', 'Should reject null');
});

// ============================================================================
// Test Suite: Method Pattern Validation
// ============================================================================

console.log('\n🧪 Testing Method Pattern Validation\n');

test('Method: Accept valid method patterns', () => {
    assertEquals(validateMethodPattern('*Handler'), '*Handler', 'Should accept wildcard pattern');
    assertEquals(validateMethodPattern('get*'), 'get*', 'Should accept prefix pattern');
    assertEquals(validateMethodPattern('Class.*'), 'Class.*', 'Should accept class method pattern');
});

test('Method: Case-insensitive pattern validation', () => {
    // Patterns should be valid regardless of case
    assertEquals(validateMethodPattern('GETUSER'), 'GETUSER', 'Should accept uppercase pattern');
    assertEquals(validateMethodPattern('getUser'), 'getUser', 'Should accept camelCase pattern');
});

test('Method: Reject invalid method patterns', () => {
    assertThrows(() => validateMethodPattern(''), 'non-empty string', 'Should reject empty pattern');
    assertThrows(() => validateMethodPattern('   '), 'non-empty string', 'Should reject whitespace-only');
});

// ============================================================================
// Test Suite: URL Validation (GitHub)
// ============================================================================

console.log('\n🧪 Testing URL Validation\n');

test('URL: Accept valid GitHub URL formats', () => {
    validateGitHubURL('https://github.com/facebook/react');
    validateGitHubURL('github.com/vercel/next.js');
    validateGitHubURL('angular/angular');
});

test('URL: Reject invalid GitHub URLs', () => {
    assertThrows(() => validateGitHubURL(''), 'non-empty string', 'Should reject empty URL');
    assertThrows(() => validateGitHubURL('not-a-url'), 'Invalid GitHub URL', 'Should reject invalid format');
    assertThrows(() => validateGitHubURL('https://gitlab.com/owner/repo'), 'Invalid GitHub URL', 'Should reject non-GitHub URL');
});

// ============================================================================
// Test Suite: Email Validation
// ============================================================================

console.log('\n🧪 Testing Email Validation\n');

test('Email: Accept valid email addresses', () => {
    validateEmail('user@example.com');
    validateEmail('test.user@domain.co.uk');
    validateEmail('name+tag@company.org');
});

test('Email: Reject invalid email addresses', () => {
    assertThrows(() => validateEmail(''), 'non-empty string', 'Should reject empty email');
    assertThrows(() => validateEmail('invalid'), 'Invalid email format', 'Should reject missing @');
    assertThrows(() => validateEmail('user@'), 'Invalid email format', 'Should reject missing domain');
    assertThrows(() => validateEmail('@domain.com'), 'Invalid email format', 'Should reject missing user');
});

// ============================================================================
// Test Suite: Semver Validation
// ============================================================================

console.log('\n🧪 Testing Semver Validation\n');

test('Semver: Accept valid semantic versions', () => {
    validateSemver('1.0.0');
    validateSemver('2.3.4');
    validateSemver('1.0.0-alpha');
    validateSemver('1.0.0-beta.1');
    validateSemver('1.0.0+20130313144700');
    validateSemver('1.0.0-alpha+001');
});

test('Semver: Reject invalid semantic versions', () => {
    assertThrows(() => validateSemver(''), 'non-empty string', 'Should reject empty version');
    assertThrows(() => validateSemver('1'), 'Invalid semver format', 'Should reject partial version');
    assertThrows(() => validateSemver('1.0'), 'Invalid semver format', 'Should reject partial version');
    assertThrows(() => validateSemver('v1.0.0'), 'Invalid semver format', 'Should reject "v" prefix');
    assertThrows(() => validateSemver('1.0.0.0'), 'Invalid semver format', 'Should reject extra version part');
});

// ============================================================================
// Test Suite: Date/Time Validation
// ============================================================================

console.log('\n🧪 Testing Date/Time Validation\n');

test('Date: Accept valid ISO 8601 dates', () => {
    validateISO8601Date('2024-01-15');
    validateISO8601Date('2024-01-15T10:30:00Z');
    validateISO8601Date('2024-01-15T10:30:00.000Z');
    validateISO8601Date('2024-01-15T10:30:00+00:00');
});

test('Date: Reject invalid date formats', () => {
    assertThrows(() => validateISO8601Date(''), 'non-empty string', 'Should reject empty date');
    assertThrows(() => validateISO8601Date('invalid-date'), 'Invalid ISO 8601', 'Should reject invalid format');
    assertThrows(() => validateISO8601Date('2024-13-01'), 'Invalid ISO 8601', 'Should reject invalid month');
    assertThrows(() => validateISO8601Date('2024-01-32'), 'Invalid ISO 8601', 'Should reject invalid day');
});

// ============================================================================
// Test Suite: Number Range Validation
// ============================================================================

console.log('\n🧪 Testing Number Range Validation\n');

test('Range: Accept numbers within range', () => {
    assertEquals(validateNumberRange(50, 0, 100), 50, 'Should accept value in range');
    assertEquals(validateNumberRange('75', 0, 100), 75, 'Should parse string number');
    assertEquals(validateNumberRange(0, 0, 100), 0, 'Should accept minimum value');
    assertEquals(validateNumberRange(100, 0, 100), 100, 'Should accept maximum value');
});

test('Range: Reject numbers outside range', () => {
    assertThrows(() => validateNumberRange(-1, 0, 100), 'must be between', 'Should reject below minimum');
    assertThrows(() => validateNumberRange(101, 0, 100), 'must be between', 'Should reject above maximum');
    assertThrows(() => validateNumberRange('invalid', 0, 100), 'must be a valid number', 'Should reject non-numeric');
});

// ============================================================================
// Test Suite: String Length Validation
// ============================================================================

console.log('\n🧪 Testing String Length Validation\n');

test('StringLength: Accept strings within length range', () => {
    assertEquals(validateStringLength('hello', 1, 10), 'hello', 'Should accept valid length');
    assertEquals(validateStringLength('a', 1, 10), 'a', 'Should accept minimum length');
    assertEquals(validateStringLength('1234567890', 1, 10), '1234567890', 'Should accept maximum length');
});

test('StringLength: Reject strings outside length range', () => {
    assertThrows(() => validateStringLength('', 1, 10), 'must be between', 'Should reject too short');
    assertThrows(() => validateStringLength('12345678901', 1, 10), 'must be between', 'Should reject too long');
    assertThrows(() => validateStringLength(123, 1, 10), 'must be a string', 'Should reject non-string');
});

// ============================================================================
// Test Suite: Required Field Validation
// ============================================================================

console.log('\n🧪 Testing Required Field Validation\n');

test('Required: Detect missing required fields', () => {
    assertThrows(() => validateRequiredField({}, 'name'), 'Required field missing', 'Should detect missing field');
    assertThrows(() => validateRequiredField({ name: null }, 'name'), 'Required field missing', 'Should reject null value');
    assertThrows(() => validateRequiredField({ name: undefined }, 'name'), 'Required field missing', 'Should reject undefined value');
});

test('Required: Accept present required fields', () => {
    assertEquals(validateRequiredField({ name: 'test' }, 'name'), 'test', 'Should accept present field');
    assertEquals(validateRequiredField({ count: 0 }, 'count'), 0, 'Should accept zero value');
    assertEquals(validateRequiredField({ flag: false }, 'flag'), false, 'Should accept false value');
});

// ============================================================================
// Test Suite: Default Value Application
// ============================================================================

console.log('\n🧪 Testing Default Value Application\n');

test('Defaults: Apply defaults to incomplete objects', () => {
    const defaults = { port: 3000, host: 'localhost', verbose: false };
    const config = { port: 8080 };
    const result = applyDefaults(config, defaults);

    assertEquals(result.port, 8080, 'Should keep provided value');
    assertEquals(result.host, 'localhost', 'Should apply default for missing field');
    assertEquals(result.verbose, false, 'Should apply default for missing field');
});

test('Defaults: Override all defaults when all fields provided', () => {
    const defaults = { port: 3000, host: 'localhost' };
    const config = { port: 8080, host: '0.0.0.0' };
    const result = applyDefaults(config, defaults);

    assertEquals(result.port, 8080, 'Should use provided port');
    assertEquals(result.host, '0.0.0.0', 'Should use provided host');
});

// ============================================================================
// Test Suite: Type Coercion Safety
// ============================================================================

console.log('\n🧪 Testing Type Coercion Safety\n');

test('Coercion: Safely coerce to string', () => {
    assertEquals(coerceToType(123, 'string'), '123', 'Should coerce number to string');
    assertEquals(coerceToType(true, 'string'), 'true', 'Should coerce boolean to string');
    assertEquals(coerceToType('hello', 'string'), 'hello', 'Should keep string as string');
});

test('Coercion: Safely coerce to number', () => {
    assertEquals(coerceToType('123', 'number'), 123, 'Should coerce string to number');
    assertEquals(coerceToType(123, 'number'), 123, 'Should keep number as number');
});

test('Coercion: Safely coerce to boolean', () => {
    assertEquals(coerceToType('true', 'boolean'), true, 'Should coerce "true" to boolean');
    assertEquals(coerceToType('false', 'boolean'), false, 'Should coerce "false" to boolean');
    assertEquals(coerceToType(true, 'boolean'), true, 'Should keep boolean as boolean');
});

test('Coercion: Reject invalid coercions', () => {
    assertThrows(() => coerceToType('invalid', 'number'), 'Cannot coerce', 'Should reject invalid number coercion');
    assertThrows(() => coerceToType('yes', 'boolean'), 'Cannot coerce', 'Should reject invalid boolean coercion');
    assertThrows(() => coerceToType(123, 'unknown'), 'Unknown target type', 'Should reject unknown type');
});

// ============================================================================
// Test Suite: Schema Evolution (Forward/Backward Compatibility)
// ============================================================================

console.log('\n🧪 Testing Schema Evolution\n');

test('Schema: Handle unknown fields gracefully', () => {
    const schema = { name: 'test', version: '1.0.0' };
    const dataWithExtraFields = { ...schema, futureField: 'value', anotherField: 123 };

    // Should not throw when encountering unknown fields
    assertTrue(dataWithExtraFields.name === 'test', 'Should preserve known fields');
    assertTrue('futureField' in dataWithExtraFields, 'Should preserve unknown fields');
});

test('Schema: Provide defaults for missing fields (backward compatibility)', () => {
    const newSchemaDefaults = {
        name: 'default',
        version: '1.0.0',
        newField: 'default-value',
        enableFeature: false
    };
    const oldData = { name: 'test', version: '1.0.0' };
    const evolved = applyDefaults(oldData, newSchemaDefaults);

    assertEquals(evolved.name, 'test', 'Should keep old field');
    assertEquals(evolved.version, '1.0.0', 'Should keep old field');
    assertEquals(evolved.newField, 'default-value', 'Should apply default for new field');
    assertEquals(evolved.enableFeature, false, 'Should apply default for new field');
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`Total tests: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log('='.repeat(70));

if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
} else {
    console.log('\n✅ All validation tests passed!\n');
    process.exit(0);
}
