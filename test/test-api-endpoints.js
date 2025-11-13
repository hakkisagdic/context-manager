#!/usr/bin/env node

/**
 * Comprehensive API Endpoints Tests for Context Manager v3.0.0+
 * Tests all REST API endpoints with various scenarios
 * Target: 95% coverage of lib/api/rest/server.js
 */

import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { APIServer } from '../lib/api/rest/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    return new Promise((resolve) => {
        Promise.resolve(fn())
            .then(() => {
                testsPassed++;
                console.log(`✅ ${name}`);
                resolve(true);
            })
            .catch((error) => {
                testsFailed++;
                console.error(`❌ ${name}`);
                console.error(`   Error: ${error.message}`);
                resolve(false);
            });
    });
}

/**
 * Make HTTP request to API server
 */
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : null;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsed,
                        rawBody: data
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: null,
                        rawBody: data,
                        parseError: error.message
                    });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

console.log('🧪 Comprehensive API Endpoints Tests for Context Manager v3.0.0+\n');

// Test configuration
const TEST_PORT = 3456;
const TEST_HOST = 'localhost';
const BASE_URL = `http://${TEST_HOST}:${TEST_PORT}`;
const API_BASE = '/api/v1';

let server = null;

// ============================================================================
// SERVER LIFECYCLE TESTS
// ============================================================================
console.log('📦 Server Lifecycle Tests');
console.log('-'.repeat(70));

await test('API Server: Start server', async () => {
    server = new APIServer({ port: TEST_PORT, host: TEST_HOST, cors: true });

    await new Promise((resolve, reject) => {
        server.start();

        // Wait for server to be ready
        setTimeout(() => {
            if (server.isRunning) {
                resolve();
            } else {
                reject(new Error('Server did not start'));
            }
        }, 500);
    });

    if (!server.isRunning) throw new Error('Server not running after start');
});

await test('API Server: Server is accessible', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }
});

// ============================================================================
// GET /api/v1/docs ENDPOINT TESTS
// ============================================================================
console.log('\n📦 GET /api/v1/docs Endpoint Tests');
console.log('-'.repeat(70));

await test('API: GET /api/v1/docs returns documentation', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body.version) throw new Error('Missing version in docs');
    if (!result.body.endpoints) throw new Error('Missing endpoints in docs');
    if (!Array.isArray(result.body.endpoints)) throw new Error('Endpoints should be array');
    if (result.body.endpoints.length < 5) throw new Error('Expected at least 5 endpoints');
});

await test('API: GET /api/v1/docs has correct content-type', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET'
    });

    if (!result.headers['content-type']?.includes('application/json')) {
        throw new Error('Expected application/json content-type');
    }
});

// ============================================================================
// GET /api/v1/stats ENDPOINT TESTS
// ============================================================================
console.log('\n📦 GET /api/v1/stats Endpoint Tests');
console.log('-'.repeat(70));

await test('API: GET /api/v1/stats returns project statistics', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/stats?path=${encodeURIComponent(testDir)}`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
    // Stats should have basic properties
    if (typeof result.body.totalFiles === 'undefined') {
        console.log('   ⚠️  Warning: totalFiles not in stats');
    }
});

await test('API: GET /api/v1/stats without path parameter (uses cwd)', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/stats`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
});

await test('API: GET /api/v1/stats with invalid path (should handle gracefully)', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/stats?path=/nonexistent/path/xyz`,
        method: 'GET'
    });

    // Should either error or return empty stats
    if (result.statusCode !== 200 && result.statusCode !== 500) {
        throw new Error(`Unexpected status code: ${result.statusCode}`);
    }
});

// ============================================================================
// GET /api/v1/analyze ENDPOINT TESTS
// ============================================================================
console.log('\n📦 GET /api/v1/analyze Endpoint Tests');
console.log('-'.repeat(70));

await test('API: GET /api/v1/analyze returns analysis results', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/analyze?path=${encodeURIComponent(testDir)}`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
});

await test('API: GET /api/v1/analyze with methods=true', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/analyze?path=${encodeURIComponent(testDir)}&methods=true`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
});

await test('API: GET /api/v1/analyze with methods=false', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/analyze?path=${encodeURIComponent(testDir)}&methods=false`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }
});

// ============================================================================
// GET /api/v1/methods ENDPOINT TESTS
// ============================================================================
console.log('\n📦 GET /api/v1/methods Endpoint Tests');
console.log('-'.repeat(70));

await test('API: GET /api/v1/methods extracts methods from file', async () => {
    const testFile = path.join(__dirname, 'fixtures', 'simple-project', 'index.js');
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/methods?file=${encodeURIComponent(testFile)}`,
        method: 'GET'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
    if (!result.body.file) throw new Error('Missing file property');
    if (!Array.isArray(result.body.methods)) throw new Error('Methods should be array');
});

await test('API: GET /api/v1/methods without file parameter (should error)', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/methods`,
        method: 'GET'
    });

    if (result.statusCode !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${result.statusCode}`);
    }

    if (!result.body?.error) throw new Error('Expected error message');
});

await test('API: GET /api/v1/methods with invalid file path', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/methods?file=/nonexistent/file.js`,
        method: 'GET'
    });

    // Should handle gracefully (may error or return empty)
    if (result.statusCode !== 200 && result.statusCode !== 500) {
        throw new Error(`Unexpected status code: ${result.statusCode}`);
    }
});

// ============================================================================
// POST /api/v1/context ENDPOINT TESTS
// ============================================================================
console.log('\n📦 POST /api/v1/context Endpoint Tests');
console.log('-'.repeat(70));

await test('API: POST /api/v1/context generates LLM context', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const body = JSON.stringify({
        path: testDir,
        methodLevel: false,
        useCase: 'custom'
    });

    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/context`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        body: body
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.body) throw new Error('No response body');
});

await test('API: POST /api/v1/context with methodLevel=true', async () => {
    const testDir = path.join(__dirname, 'fixtures', 'simple-project');
    const body = JSON.stringify({
        path: testDir,
        methodLevel: true,
        targetTokens: 50000
    });

    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/context`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        body: body
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }
});

await test('API: POST /api/v1/context with malformed JSON (should error)', async () => {
    const body = '{ invalid json }';

    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/context`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        body: body
    });

    if (result.statusCode !== 500) {
        throw new Error(`Expected 500 Internal Server Error, got ${result.statusCode}`);
    }

    if (!result.body?.error) throw new Error('Expected error message');
});

await test('API: POST /api/v1/context with empty body', async () => {
    const body = '{}';

    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/context`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        },
        body: body
    });

    // Should use defaults
    if (result.statusCode !== 200 && result.statusCode !== 500) {
        throw new Error(`Unexpected status code: ${result.statusCode}`);
    }
});

// ============================================================================
// CORS TESTS
// ============================================================================
console.log('\n📦 CORS Tests');
console.log('-'.repeat(70));

await test('API: CORS headers are set', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET'
    });

    if (!result.headers['access-control-allow-origin']) {
        throw new Error('Missing CORS origin header');
    }

    if (result.headers['access-control-allow-origin'] !== '*') {
        throw new Error('CORS origin should be *');
    }
});

await test('API: OPTIONS request returns CORS headers', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/analyze`,
        method: 'OPTIONS'
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }

    if (!result.headers['access-control-allow-methods']) {
        throw new Error('Missing CORS methods header');
    }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n📦 Error Handling Tests');
console.log('-'.repeat(70));

await test('API: 404 for unknown endpoint', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: '/api/v1/unknown-endpoint',
        method: 'GET'
    });

    if (result.statusCode !== 404) {
        throw new Error(`Expected 404, got ${result.statusCode}`);
    }

    if (!result.body?.error) throw new Error('Expected error message');
});

await test('API: 404 for non-API path', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: '/random/path',
        method: 'GET'
    });

    if (result.statusCode !== 404) {
        throw new Error(`Expected 404, got ${result.statusCode}`);
    }
});

await test('API: Wrong HTTP method returns 404', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'POST'
    });

    if (result.statusCode !== 404) {
        throw new Error(`Expected 404, got ${result.statusCode}`);
    }
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================
console.log('\n📦 Authentication Tests');
console.log('-'.repeat(70));

// Stop current server and start with auth
await test('API: Stop server for auth testing', async () => {
    await new Promise((resolve) => {
        server.stop();
        setTimeout(resolve, 500);
    });

    if (server.isRunning) throw new Error('Server still running');
});

await test('API: Start server with authentication', async () => {
    server = new APIServer({
        port: TEST_PORT,
        host: TEST_HOST,
        cors: true,
        authToken: 'test-secret-token-123'
    });

    await new Promise((resolve, reject) => {
        server.start();
        setTimeout(() => {
            if (server.isRunning) {
                resolve();
            } else {
                reject(new Error('Server did not start'));
            }
        }, 500);
    });
});

await test('API: Request without auth token returns 401', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET'
    });

    if (result.statusCode !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${result.statusCode}`);
    }

    if (!result.body?.error) throw new Error('Expected error message');
});

await test('API: Request with correct auth token succeeds', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer test-secret-token-123'
        }
    });

    if (result.statusCode !== 200) {
        throw new Error(`Expected 200, got ${result.statusCode}`);
    }
});

await test('API: Request with incorrect auth token returns 401', async () => {
    const result = await makeRequest({
        hostname: TEST_HOST,
        port: TEST_PORT,
        path: `${API_BASE}/docs`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer wrong-token'
        }
    });

    if (result.statusCode !== 401) {
        throw new Error(`Expected 401, got ${result.statusCode}`);
    }
});

// ============================================================================
// CONCURRENT REQUESTS TEST
// ============================================================================
console.log('\n📦 Concurrent Requests Tests');
console.log('-'.repeat(70));

// Stop auth server, start regular server
await test('API: Restart server without auth for concurrent tests', async () => {
    server.stop();
    await new Promise(resolve => setTimeout(resolve, 500));

    server = new APIServer({ port: TEST_PORT, host: TEST_HOST, cors: true });
    await new Promise((resolve) => {
        server.start();
        setTimeout(resolve, 500);
    });
});

await test('API: Handle concurrent requests', async () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
        requests.push(
            makeRequest({
                hostname: TEST_HOST,
                port: TEST_PORT,
                path: `${API_BASE}/docs`,
                method: 'GET'
            })
        );
    }

    const results = await Promise.all(requests);

    if (results.length !== 10) throw new Error('Not all requests completed');

    for (const result of results) {
        if (result.statusCode !== 200) {
            throw new Error(`Request failed with status ${result.statusCode}`);
        }
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n📦 Server Cleanup');
console.log('-'.repeat(70));

await test('API Server: Stop server', async () => {
    await new Promise((resolve) => {
        server.stop();
        setTimeout(resolve, 500);
    });

    if (server.isRunning) throw new Error('Server still running after stop');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 API ENDPOINTS TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total tests run: ${testsRun}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All API endpoint tests passed!');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testsFailed} test(s) failed`);
    process.exit(1);
}
