#!/usr/bin/env node

/**
 * Comprehensive API Endpoints Tests
 * Tests all API endpoints with real HTTP requests
 * Coverage: ~60 test cases for complete API validation
 */

import { APIServer } from '../lib/api/rest/server.js';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

// Test configuration
const TEST_PORT = 3456; // Use non-standard port to avoid conflicts
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Create test project directory
const TEST_PROJECT_DIR = join(__dirname, 'fixtures', 'api-test-project');
if (!fs.existsSync(TEST_PROJECT_DIR)) {
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
}

// Create test files
fs.writeFileSync(join(TEST_PROJECT_DIR, 'index.js'),
    `function main() {\n  console.log('Hello');\n}\n\nmodule.exports = { main };\n`);
fs.writeFileSync(join(TEST_PROJECT_DIR, 'utils.js'),
    `function add(a, b) { return a + b; }\nfunction multiply(x, y) { return x * y; }\n`);
fs.writeFileSync(join(TEST_PROJECT_DIR, '.gitignore'),
    `node_modules/\n*.log\n`);

// Initialize git repo for diff tests
try {
    const { execSync } = await import('child_process');
    execSync('git init', { cwd: TEST_PROJECT_DIR, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TEST_PROJECT_DIR, stdio: 'ignore' });
    execSync('git config user.name "Test User"', { cwd: TEST_PROJECT_DIR, stdio: 'ignore' });
    execSync('git add .', { cwd: TEST_PROJECT_DIR, stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { cwd: TEST_PROJECT_DIR, stdio: 'ignore' });
} catch (error) {
    // Git might not be available in some environments
    console.log('⚠️  Git not available for diff tests');
}

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
            const stackLine = error.stack.split('\n')[1]?.trim();
            if (stackLine) console.error(`   ${stackLine}`);
        }
        testsFailed++;
        return false;
    }
}

// HTTP request helper
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: options.timeout || 5000
        };

        const req = http.request(reqOptions, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk.toString();
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body,
                    json: () => {
                        try {
                            return JSON.parse(body);
                        } catch (e) {
                            return null;
                        }
                    }
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }

        req.end();
    });
}

console.log('🧪 Testing API Endpoints...\n');
console.log('Setting up test server...');

// Start test server
const server = new APIServer({ port: TEST_PORT, host: 'localhost' });
server.start();

// Wait for server to be ready
await new Promise(resolve => setTimeout(resolve, 500));

// ============================================================================
// HEALTH & DOCUMENTATION ENDPOINTS
// ============================================================================
console.log('\n📚 Documentation & Health Tests');
console.log('-'.repeat(70));

await asyncTest('/api/v1/docs - GET - Should return API documentation', async () => {
    const res = await makeRequest('/api/v1/docs');
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    if (!data.endpoints) throw new Error('Should have endpoints');
    if (!Array.isArray(data.endpoints)) throw new Error('Endpoints should be array');
    if (data.endpoints.length < 5) throw new Error('Should have at least 5 endpoints');
});

await asyncTest('/api/v1/docs - Response includes all endpoint paths', async () => {
    const res = await makeRequest('/api/v1/docs');
    const data = res.json();

    const paths = data.endpoints.map(e => e.path);
    const expectedPaths = ['/api/v1/analyze', '/api/v1/methods', '/api/v1/stats', '/api/v1/diff', '/api/v1/context'];

    for (const path of expectedPaths) {
        if (!paths.includes(path)) {
            throw new Error(`Missing endpoint: ${path}`);
        }
    }
});

await asyncTest('/api/v1/docs - Each endpoint has required fields', async () => {
    const res = await makeRequest('/api/v1/docs');
    const data = res.json();

    for (const endpoint of data.endpoints) {
        if (!endpoint.path) throw new Error('Endpoint missing path');
        if (!endpoint.method) throw new Error('Endpoint missing method');
        if (!endpoint.description) throw new Error('Endpoint missing description');
    }
});

// ============================================================================
// CORS HEADERS TESTS
// ============================================================================
console.log('\n🌐 CORS Headers Tests');
console.log('-'.repeat(70));

await asyncTest('CORS - OPTIONS request returns 200', async () => {
    const res = await makeRequest('/api/v1/docs', { method: 'OPTIONS' });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

await asyncTest('CORS - Access-Control-Allow-Origin header present', async () => {
    const res = await makeRequest('/api/v1/docs');
    if (!res.headers['access-control-allow-origin']) {
        throw new Error('Missing CORS origin header');
    }
    if (res.headers['access-control-allow-origin'] !== '*') {
        throw new Error('Should allow all origins');
    }
});

await asyncTest('CORS - Access-Control-Allow-Methods header present', async () => {
    const res = await makeRequest('/api/v1/docs', { method: 'OPTIONS' });
    if (!res.headers['access-control-allow-methods']) {
        throw new Error('Missing CORS methods header');
    }
});

await asyncTest('CORS - Access-Control-Allow-Headers header present', async () => {
    const res = await makeRequest('/api/v1/docs', { method: 'OPTIONS' });
    if (!res.headers['access-control-allow-headers']) {
        throw new Error('Missing CORS headers header');
    }
});

await asyncTest('CORS - Headers present on all endpoints', async () => {
    const endpoints = ['/api/v1/docs', '/api/v1/stats'];

    for (const endpoint of endpoints) {
        const res = await makeRequest(endpoint);
        if (!res.headers['access-control-allow-origin']) {
            throw new Error(`${endpoint} missing CORS header`);
        }
    }
});

// ============================================================================
// /api/v1/analyze ENDPOINT TESTS
// ============================================================================
console.log('\n🔍 /api/v1/analyze Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('/api/v1/analyze - GET - Basic analysis', async () => {
    const res = await makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    if (!data.files) throw new Error('Should have files');
    if (!data.stats) throw new Error('Should have stats');
});

await asyncTest('/api/v1/analyze - Returns file analysis', async () => {
    const res = await makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}`);
    const data = res.json();

    if (!Array.isArray(data.files)) throw new Error('Files should be array');
    if (data.files.length === 0) throw new Error('Should find files');
});

await asyncTest('/api/v1/analyze - Returns statistics', async () => {
    const res = await makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}`);
    const data = res.json();

    if (typeof data.stats.totalFiles !== 'number') throw new Error('Should have totalFiles');
    if (typeof data.stats.totalTokens !== 'number') throw new Error('Should have totalTokens');
});

await asyncTest('/api/v1/analyze - With methods=true parameter', async () => {
    const res = await makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}&methods=true`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return data');
});

await asyncTest('/api/v1/analyze - Defaults to current directory when no path', async () => {
    const res = await makeRequest('/api/v1/analyze');
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data.files) throw new Error('Should analyze current directory');
});

await asyncTest('/api/v1/analyze - Content-Type is application/json', async () => {
    const res = await makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}`);
    if (!res.headers['content-type']?.includes('application/json')) {
        throw new Error('Should return JSON content type');
    }
});

// ============================================================================
// /api/v1/stats ENDPOINT TESTS
// ============================================================================
console.log('\n📊 /api/v1/stats Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('/api/v1/stats - GET - Returns statistics', async () => {
    const res = await makeRequest(`/api/v1/stats?path=${TEST_PROJECT_DIR}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    if (typeof data.totalFiles !== 'number') throw new Error('Should have totalFiles');
    if (typeof data.totalTokens !== 'number') throw new Error('Should have totalTokens');
});

await asyncTest('/api/v1/stats - Returns only stats object', async () => {
    const res = await makeRequest(`/api/v1/stats?path=${TEST_PROJECT_DIR}`);
    const data = res.json();

    // Should be stats object directly, not wrapped in another object
    if (data.files) throw new Error('Should not include files array');
    if (typeof data.totalFiles !== 'number') throw new Error('Should be stats object');
});

await asyncTest('/api/v1/stats - Works without path parameter', async () => {
    const res = await makeRequest('/api/v1/stats');
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return data');
});

// ============================================================================
// /api/v1/methods ENDPOINT TESTS
// ============================================================================
console.log('\n⚙️  /api/v1/methods Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('/api/v1/methods - GET - Extracts methods from file', async () => {
    const testFile = join(TEST_PROJECT_DIR, 'utils.js');
    const res = await makeRequest(`/api/v1/methods?file=${testFile}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    if (!data.file) throw new Error('Should have file path');
    if (!Array.isArray(data.methods)) throw new Error('Should have methods array');
});

await asyncTest('/api/v1/methods - Returns method details', async () => {
    const testFile = join(TEST_PROJECT_DIR, 'utils.js');
    const res = await makeRequest(`/api/v1/methods?file=${testFile}`);
    const data = res.json();

    if (typeof data.totalMethods !== 'number') throw new Error('Should have totalMethods count');
    if (data.file !== testFile) throw new Error('Should return correct file path');
});

await asyncTest('/api/v1/methods - Missing file parameter returns 400', async () => {
    const res = await makeRequest('/api/v1/methods');
    if (res.statusCode !== 400) throw new Error(`Expected 400, got ${res.statusCode}`);

    const data = res.json();
    if (!data.error) throw new Error('Should have error message');
    if (!data.error.includes('file')) throw new Error('Error should mention missing file parameter');
});

// ============================================================================
// /api/v1/diff ENDPOINT TESTS
// ============================================================================
console.log('\n🔄 /api/v1/diff Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('/api/v1/diff - GET - Returns diff analysis', async () => {
    const res = await makeRequest(`/api/v1/diff?path=${TEST_PROJECT_DIR}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    // DiffAnalyzer should return some structure
});

await asyncTest('/api/v1/diff - Works with since parameter', async () => {
    const res = await makeRequest(`/api/v1/diff?path=${TEST_PROJECT_DIR}&since=HEAD~1`);
    // Should work even if there's no history
    if (res.statusCode !== 200 && res.statusCode !== 500) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('/api/v1/diff - Works without since parameter', async () => {
    const res = await makeRequest(`/api/v1/diff?path=${TEST_PROJECT_DIR}`);
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

// ============================================================================
// /api/v1/context ENDPOINT TESTS (POST)
// ============================================================================
console.log('\n📝 /api/v1/context Endpoint Tests (POST)');
console.log('-'.repeat(70));

await asyncTest('/api/v1/context - POST - Generates context', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { path: TEST_PROJECT_DIR }
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data) throw new Error('Should return JSON');
    if (!data.metadata) throw new Error('Should have metadata');
});

await asyncTest('/api/v1/context - POST - With methodLevel option', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { path: TEST_PROJECT_DIR, methodLevel: true }
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

await asyncTest('/api/v1/context - POST - With targetTokens option', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { path: TEST_PROJECT_DIR, targetTokens: 50000 }
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

await asyncTest('/api/v1/context - POST - Empty body defaults to current directory', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {}
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================
console.log('\n🔐 Authentication Tests');
console.log('-'.repeat(70));

// Stop current server and start one with auth
server.stop();
await new Promise(resolve => setTimeout(resolve, 500));

const authServer = new APIServer({
    port: TEST_PORT,
    host: 'localhost',
    authToken: 'test-secret-token-123'
});
authServer.start();
await new Promise(resolve => setTimeout(resolve, 500));

await asyncTest('Auth - Request without token returns 401', async () => {
    const res = await makeRequest('/api/v1/docs');
    if (res.statusCode !== 401) throw new Error(`Expected 401, got ${res.statusCode}`);

    const data = res.json();
    if (!data.error) throw new Error('Should have error message');
});

await asyncTest('Auth - Request with valid token succeeds', async () => {
    const res = await makeRequest('/api/v1/docs', {
        headers: { 'Authorization': 'Bearer test-secret-token-123' }
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
});

await asyncTest('Auth - Request with invalid token returns 401', async () => {
    const res = await makeRequest('/api/v1/docs', {
        headers: { 'Authorization': 'Bearer wrong-token' }
    });
    if (res.statusCode !== 401) throw new Error(`Expected 401, got ${res.statusCode}`);
});

await asyncTest('Auth - Malformed Authorization header returns 401', async () => {
    const res = await makeRequest('/api/v1/docs', {
        headers: { 'Authorization': 'InvalidFormat' }
    });
    if (res.statusCode !== 401) throw new Error(`Expected 401, got ${res.statusCode}`);
});

// Stop auth server, restart without auth
authServer.stop();
await new Promise(resolve => setTimeout(resolve, 500));
server.start();
await new Promise(resolve => setTimeout(resolve, 500));

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n❌ Error Handling Tests');
console.log('-'.repeat(70));

await asyncTest('Error - 404 for non-existent endpoint', async () => {
    const res = await makeRequest('/api/v1/nonexistent');
    if (res.statusCode !== 404) throw new Error(`Expected 404, got ${res.statusCode}`);

    const data = res.json();
    if (!data.error) throw new Error('Should have error message');
});

await asyncTest('Error - 404 for wrong API version', async () => {
    const res = await makeRequest('/api/v2/docs');
    if (res.statusCode !== 404) throw new Error(`Expected 404, got ${res.statusCode}`);
});

await asyncTest('Error - 404 for root path', async () => {
    const res = await makeRequest('/');
    if (res.statusCode !== 404) throw new Error(`Expected 404, got ${res.statusCode}`);
});

await asyncTest('Error - Invalid JSON in POST body', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {'
    });
    // Should return 500 or 400 for invalid JSON
    if (res.statusCode !== 500 && res.statusCode !== 400) {
        throw new Error(`Expected 500 or 400, got ${res.statusCode}`);
    }
});

await asyncTest('Error - Response includes error property', async () => {
    const res = await makeRequest('/api/v1/nonexistent');
    const data = res.json();

    if (!data.error) throw new Error('Error response should have error property');
    if (typeof data.error !== 'string') throw new Error('Error should be string');
});

await asyncTest('Error - Response includes statusCode property', async () => {
    const res = await makeRequest('/api/v1/nonexistent');
    const data = res.json();

    if (!data.statusCode) throw new Error('Error response should have statusCode');
    if (data.statusCode !== 404) throw new Error('StatusCode should match HTTP status');
});

// ============================================================================
// REQUEST VALIDATION TESTS
// ============================================================================
console.log('\n✅ Request Validation Tests');
console.log('-'.repeat(70));

await asyncTest('Validation - /api/v1/methods requires file parameter', async () => {
    const res = await makeRequest('/api/v1/methods');
    if (res.statusCode !== 400) throw new Error('Should reject missing file parameter');
});

await asyncTest('Validation - Invalid path parameter handled gracefully', async () => {
    const res = await makeRequest('/api/v1/analyze?path=/nonexistent/path/12345');
    // Should either return 200 with empty results or 500
    if (res.statusCode !== 200 && res.statusCode !== 500) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('Validation - Query parameters are properly parsed', async () => {
    const res = await makeRequest('/api/v1/analyze?methods=true&path=' + TEST_PROJECT_DIR);
    if (res.statusCode !== 200) throw new Error('Should parse multiple query params');
});

// ============================================================================
// LARGE PAYLOAD TESTS
// ============================================================================
console.log('\n📦 Large Payload Tests');
console.log('-'.repeat(70));

await asyncTest('Large Payload - POST with large JSON body (1MB)', async () => {
    // Create 1MB of data
    const largeData = {
        path: TEST_PROJECT_DIR,
        metadata: 'x'.repeat(1024 * 1024) // 1MB of data
    };

    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: largeData,
        timeout: 10000 // Increase timeout for large payload
    });

    // Should handle large payload (might succeed or fail depending on implementation)
    if (res.statusCode !== 200 && res.statusCode !== 500 && res.statusCode !== 413) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('Large Payload - Analysis of large project', async () => {
    // Use current project which is larger
    const res = await makeRequest(`/api/v1/analyze?path=${process.cwd()}`, {
        timeout: 15000 // Increase timeout
    });
    if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);

    const data = res.json();
    if (!data.files) throw new Error('Should return files');
    // Current project should have many files
    if (data.files.length < 10) throw new Error('Should find multiple files in project');
});

// ============================================================================
// CONCURRENT REQUESTS TESTS
// ============================================================================
console.log('\n🔀 Concurrent Requests Tests');
console.log('-'.repeat(70));

await asyncTest('Concurrent - 5 simultaneous GET requests', async () => {
    const requests = Array(5).fill(null).map(() =>
        makeRequest('/api/v1/docs')
    );

    const results = await Promise.all(requests);

    for (const res of results) {
        if (res.statusCode !== 200) {
            throw new Error(`Request failed with status ${res.statusCode}`);
        }
    }
});

await asyncTest('Concurrent - 10 simultaneous analysis requests', async () => {
    const requests = Array(10).fill(null).map(() =>
        makeRequest(`/api/v1/stats?path=${TEST_PROJECT_DIR}`)
    );

    const results = await Promise.all(requests);

    for (const res of results) {
        if (res.statusCode !== 200) {
            throw new Error(`Analysis request failed with status ${res.statusCode}`);
        }
    }
});

await asyncTest('Concurrent - Mixed GET and POST requests', async () => {
    const requests = [
        makeRequest('/api/v1/docs'),
        makeRequest(`/api/v1/stats?path=${TEST_PROJECT_DIR}`),
        makeRequest('/api/v1/context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { path: TEST_PROJECT_DIR }
        }),
        makeRequest('/api/v1/docs'),
        makeRequest(`/api/v1/analyze?path=${TEST_PROJECT_DIR}`)
    ];

    const results = await Promise.all(requests);

    for (const res of results) {
        if (res.statusCode !== 200) {
            throw new Error(`Request failed with status ${res.statusCode}`);
        }
    }
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================
console.log('\n📄 Response Format Tests');
console.log('-'.repeat(70));

await asyncTest('Response - JSON is properly formatted', async () => {
    const res = await makeRequest('/api/v1/docs');

    // Should be able to parse JSON
    const data = res.json();
    if (!data) throw new Error('Should return valid JSON');

    // Check if response body is formatted (has whitespace)
    if (!res.body.includes('\n')) throw new Error('JSON should be formatted with newlines');
});

await asyncTest('Response - Error responses are consistent', async () => {
    const res = await makeRequest('/api/v1/nonexistent');
    const data = res.json();

    if (!data.error) throw new Error('Should have error property');
    if (!data.statusCode) throw new Error('Should have statusCode property');
    if (typeof data.error !== 'string') throw new Error('Error should be string');
    if (typeof data.statusCode !== 'number') throw new Error('StatusCode should be number');
});

await asyncTest('Response - All endpoints return JSON', async () => {
    const endpoints = [
        '/api/v1/docs',
        `/api/v1/stats?path=${TEST_PROJECT_DIR}`,
        `/api/v1/analyze?path=${TEST_PROJECT_DIR}`
    ];

    for (const endpoint of endpoints) {
        const res = await makeRequest(endpoint);
        if (!res.headers['content-type']?.includes('application/json')) {
            throw new Error(`${endpoint} should return JSON`);
        }
    }
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

await asyncTest('Edge - Empty query parameters', async () => {
    const res = await makeRequest('/api/v1/analyze?path=&methods=');
    // Should handle empty params
    if (res.statusCode !== 200 && res.statusCode !== 400 && res.statusCode !== 500) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('Edge - Special characters in query parameters', async () => {
    const res = await makeRequest('/api/v1/analyze?path=/test%20path');
    // Should handle URL-encoded paths
    if (res.statusCode !== 200 && res.statusCode !== 500) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('Edge - Very long query string', async () => {
    const longPath = '/test/' + 'a'.repeat(1000);
    const res = await makeRequest(`/api/v1/analyze?path=${longPath}`);
    // Should handle long query strings
    if (res.statusCode !== 200 && res.statusCode !== 500 && res.statusCode !== 414) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

await asyncTest('Edge - POST with empty body', async () => {
    const res = await makeRequest('/api/v1/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ''
    });
    // Should handle empty body
    if (res.statusCode !== 200 && res.statusCode !== 400 && res.statusCode !== 500) {
        throw new Error(`Unexpected status: ${res.statusCode}`);
    }
});

// ============================================================================
// CLEANUP & RESULTS
// ============================================================================
console.log('\n🧹 Cleaning up...');
server.stop();
await new Promise(resolve => setTimeout(resolve, 500));

console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All API endpoint tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
