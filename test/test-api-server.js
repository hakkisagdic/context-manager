#!/usr/bin/env node

/**
 * API Server Tests
 * Tests REST API endpoints, authentication, CORS, and error handling
 */

import { APIServer } from '../lib/api/rest/server.js';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;
let server = null;
const TEST_PORT = 3333; // Use different port to avoid conflicts

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
        return true;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
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
        testsFailed++;
        return false;
    }
}

/**
 * Make HTTP request to API server
 */
function makeRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : null;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsed
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

console.log('🧪 Testing API Server (v3.0.0)...\n');

// ============================================================================
// CONSTRUCTOR & CONFIGURATION TESTS
// ============================================================================
console.log('📦 Constructor & Configuration Tests');
console.log('-'.repeat(70));

test('APIServer - Constructor with defaults', () => {
    const api = new APIServer();
    if (!api) throw new Error('Failed to create APIServer');
    if (api.options.port !== 3000) throw new Error('Default port should be 3000');
    if (api.options.host !== 'localhost') throw new Error('Default host should be localhost');
    if (api.options.cors !== true) throw new Error('CORS should be enabled by default');
    if (api.isRunning !== false) throw new Error('Should not be running initially');
});

test('APIServer - Constructor with custom options', () => {
    const api = new APIServer({
        port: 4000,
        host: '0.0.0.0',
        authToken: 'test-token',
        cors: false
    });

    if (api.options.port !== 4000) throw new Error('Custom port not set');
    if (api.options.host !== '0.0.0.0') throw new Error('Custom host not set');
    if (api.options.authToken !== 'test-token') throw new Error('Auth token not set');
    if (api.options.cors !== false) throw new Error('CORS setting not respected');
});

test('APIServer - Initial state', () => {
    const api = new APIServer();
    if (api.server !== null) throw new Error('Server should be null initially');
    if (api.isRunning !== false) throw new Error('isRunning should be false initially');
});

// ============================================================================
// SERVER LIFECYCLE TESTS
// ============================================================================
console.log('\n🔄 Server Lifecycle Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - Start server', async () => {
    return new Promise((resolve, reject) => {
        server = new APIServer({ port: TEST_PORT, host: 'localhost' });
        server.start();

        // Give server time to start
        setTimeout(() => {
            if (!server.isRunning) reject(new Error('Server did not start'));
            if (!server.server) reject(new Error('HTTP server not created'));
            resolve();
        }, 100);
    });
});

await asyncTest('APIServer - Server is running', async () => {
    if (!server.isRunning) throw new Error('Server should be running');
});

await asyncTest('APIServer - Make request to running server', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }
});

// ============================================================================
// ENDPOINT TESTS
// ============================================================================
console.log('\n🌐 Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('GET /api/v1/docs - Returns API documentation', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    if (!response.body.version) throw new Error('Missing version in docs');
    if (!response.body.endpoints) throw new Error('Missing endpoints in docs');
    if (!Array.isArray(response.body.endpoints)) throw new Error('endpoints should be array');
    if (response.body.endpoints.length !== 5) {
        throw new Error(`Expected 5 endpoints, got ${response.body.endpoints.length}`);
    }
});

await asyncTest('GET /api/v1/stats - Returns project stats', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/stats?path=${process.cwd()}`,
        method: 'GET'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    if (typeof response.body !== 'object') throw new Error('Response should be object');
});

await asyncTest('GET /api/v1/analyze - Returns analysis', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/analyze?path=${process.cwd()}`,
        method: 'GET'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    if (typeof response.body !== 'object') throw new Error('Response should be object');
});

await asyncTest('GET /api/v1/methods - Missing file parameter', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/methods',
        method: 'GET'
    });

    if (response.statusCode !== 400) {
        throw new Error(`Expected 400, got ${response.statusCode}`);
    }

    if (!response.body.error) throw new Error('Should return error message');
});

await asyncTest('GET /api/v1/methods - With file parameter', async () => {
    const testFile = `${process.cwd()}/index.js`;
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: `/api/v1/methods?file=${encodeURIComponent(testFile)}`,
        method: 'GET'
    });

    // May return 200 or error depending on file existence
    if (response.statusCode !== 200 && response.statusCode !== 500) {
        throw new Error(`Expected 200 or 500, got ${response.statusCode}`);
    }
});

// ============================================================================
// CORS TESTS
// ============================================================================
console.log('\n🔐 CORS Tests');
console.log('-'.repeat(70));

await asyncTest('OPTIONS request - CORS preflight', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'OPTIONS'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    if (!response.headers['access-control-allow-origin']) {
        throw new Error('Missing CORS header');
    }
});

await asyncTest('GET request - CORS headers present', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET'
    });

    if (!response.headers['access-control-allow-origin']) {
        throw new Error('Missing CORS origin header');
    }
    if (!response.headers['access-control-allow-methods']) {
        throw new Error('Missing CORS methods header');
    }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================
console.log('\n❌ Error Handling Tests');
console.log('-'.repeat(70));

await asyncTest('GET /invalid-path - Returns 404', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/invalid-path',
        method: 'GET'
    });

    if (response.statusCode !== 404) {
        throw new Error(`Expected 404, got ${response.statusCode}`);
    }
    if (!response.body.error) throw new Error('Should return error object');
});

await asyncTest('GET /api/v1/invalid - Returns 404', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/invalid-endpoint',
        method: 'GET'
    });

    if (response.statusCode !== 404) {
        throw new Error(`Expected 404, got ${response.statusCode}`);
    }
});

// ============================================================================
// POST ENDPOINT TESTS
// ============================================================================
console.log('\n📮 POST Endpoint Tests');
console.log('-'.repeat(70));

await asyncTest('POST /api/v1/context - Generate context', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/context',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }, {
        path: process.cwd(),
        methodLevel: false,
        targetModel: 'claude-sonnet-4',
        useCase: 'custom'
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }

    if (typeof response.body !== 'object') throw new Error('Response should be object');
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================
console.log('\n🔒 Authentication Tests');
console.log('-'.repeat(70));

// Stop current server and start one with auth
await asyncTest('Stop server for auth tests', async () => {
    return new Promise((resolve) => {
        if (server && server.isRunning) {
            server.stop();
            setTimeout(() => {
                resolve();
            }, 200);
        } else {
            resolve();
        }
    });
});

await asyncTest('Start server with authentication', async () => {
    return new Promise((resolve, reject) => {
        server = new APIServer({
            port: TEST_PORT,
            host: 'localhost',
            authToken: 'test-secret-token'
        });
        server.start();

        setTimeout(() => {
            if (!server.isRunning) reject(new Error('Server did not start'));
            resolve();
        }, 100);
    });
});

await asyncTest('GET without auth token - Returns 401', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET'
    });

    if (response.statusCode !== 401) {
        throw new Error(`Expected 401, got ${response.statusCode}`);
    }
});

await asyncTest('GET with valid auth token - Returns 200', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer test-secret-token'
        }
    });

    if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
    }
});

await asyncTest('GET with invalid auth token - Returns 401', async () => {
    const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/docs',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer wrong-token'
        }
    });

    if (response.statusCode !== 401) {
        throw new Error(`Expected 401, got ${response.statusCode}`);
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
await asyncTest('Stop server after tests', async () => {
    return new Promise((resolve) => {
        if (server && server.isRunning) {
            server.stop();
            setTimeout(() => {
                if (server.isRunning) throw new Error('Server did not stop');
                resolve();
            }, 200);
        } else {
            resolve();
        }
    });
});

// ============================================================================
// RESULTS
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST RESULTS');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All API server tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
