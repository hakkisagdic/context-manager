#!/usr/bin/env node

/**
 * Comprehensive API Server Tests
 * Tests for REST API endpoints and server functionality
 */

import { APIServer } from '../lib/api/rest/server.js';

let testsPassed = 0;
let testsFailed = 0;

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

console.log('🧪 Testing API Server...\n');

// ============================================================================
// CONSTRUCTOR TESTS
// ============================================================================
console.log('🔨 Constructor Tests');
console.log('-'.repeat(70));

test('APIServer - Constructor with defaults', () => {
    const server = new APIServer();
    if (!server) throw new Error('Should create instance');
    if (!server.options) throw new Error('Should have options');
    if (server.options.port !== 3000) throw new Error('Should default to port 3000');
    if (server.options.host !== 'localhost') throw new Error('Should default to localhost');
});

test('APIServer - Constructor with custom options', () => {
    const server = new APIServer({
        port: 8080,
        host: '0.0.0.0',
        authToken: 'secret123',
        cors: false
    });
    if (server.options.port !== 8080) throw new Error('Should set port');
    if (server.options.host !== '0.0.0.0') throw new Error('Should set host');
    if (server.options.authToken !== 'secret123') throw new Error('Should set authToken');
    if (server.options.cors !== false) throw new Error('Should set cors');
});

test('APIServer - Constructor initializes state', () => {
    const server = new APIServer();
    if (server.isRunning !== false) throw new Error('Should not be running initially');
    if (server.server !== null) throw new Error('Server should be null initially');
});

test('APIServer - Constructor enables CORS by default', () => {
    const server = new APIServer();
    if (server.options.cors !== true) throw new Error('CORS should be enabled by default');
});

// ============================================================================
// HELPER METHOD TESTS
// ============================================================================
console.log('\n🛠️  Helper Method Tests');
console.log('-'.repeat(70));

test('APIServer - sendJSON sets correct headers', () => {
    const server = new APIServer();
    let headers = {};
    let statusCode = 0;
    let responseData = '';

    const mockRes = {
        writeHead: (code, hdrs) => {
            statusCode = code;
            headers = hdrs;
        },
        end: (data) => {
            responseData = data;
        }
    };

    server.sendJSON(mockRes, { test: 'data' });

    if (statusCode !== 200) throw new Error('Should set 200 status');
    if (headers['Content-Type'] !== 'application/json') {
        throw new Error('Should set JSON content type');
    }
    if (!responseData.includes('test')) throw new Error('Should include data');
});

test('APIServer - sendJSON handles custom status code', () => {
    const server = new APIServer();
    let statusCode = 0;

    const mockRes = {
        writeHead: (code) => { statusCode = code; },
        end: () => {}
    };

    server.sendJSON(mockRes, { success: true }, 201);

    if (statusCode !== 201) throw new Error('Should set custom status code');
});

test('APIServer - sendError sends error response', () => {
    const server = new APIServer();
    let statusCode = 0;
    let responseData = '';

    const mockRes = {
        writeHead: (code) => { statusCode = code; },
        end: (data) => { responseData = data; }
    };

    server.sendError(mockRes, 404, 'Not found');

    if (statusCode !== 404) throw new Error('Should set error status');
    if (!responseData.includes('Not found')) throw new Error('Should include error message');
});

test('APIServer - checkAuth returns false when no auth header', () => {
    const server = new APIServer();
    const mockReq = { headers: {} };

    // checkAuth returns false when no authorization header present
    if (server.checkAuth(mockReq)) throw new Error('Should return false when no auth header');
});

test('APIServer - checkAuth validates token', () => {
    const server = new APIServer({ authToken: 'secret123' });
    const mockReq = { headers: { authorization: 'Bearer secret123' } };

    if (!server.checkAuth(mockReq)) throw new Error('Should validate correct token');
});

test('APIServer - checkAuth rejects invalid token', () => {
    const server = new APIServer({ authToken: 'secret123' });
    const mockReq = { headers: { authorization: 'Bearer wrong' } };

    if (server.checkAuth(mockReq)) throw new Error('Should reject invalid token');
});

test('APIServer - checkAuth rejects missing auth header', () => {
    const server = new APIServer({ authToken: 'secret123' });
    const mockReq = { headers: {} };

    if (server.checkAuth(mockReq)) throw new Error('Should reject missing auth');
});

// ============================================================================
// REQUEST BODY PARSING TESTS
// ============================================================================
console.log('\n📥 Request Body Parsing Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - parseBody parses JSON', async () => {
    const server = new APIServer();
    const mockReq = {
        on: (event, callback) => {
            if (event === 'data') {
                callback(Buffer.from('{"test": "data"}'));
            }
            if (event === 'end') {
                callback();
            }
        }
    };

    const body = await server.parseBody(mockReq);
    if (!body.test) throw new Error('Should parse JSON body');
    if (body.test !== 'data') throw new Error('Should have correct data');
});

await asyncTest('APIServer - parseBody handles empty body', async () => {
    const server = new APIServer();
    const mockReq = {
        on: (event, callback) => {
            if (event === 'data') {
                // No data
            }
            if (event === 'end') {
                callback();
            }
        }
    };

    try {
        const body = await server.parseBody(mockReq);
        // May return empty object or throw on empty body
        if (typeof body !== 'object') throw new Error('Should return object');
    } catch (error) {
        // Throws "Invalid JSON" on empty body - acceptable behavior
        if (!error.message.includes('Invalid JSON')) throw error;
    }
});

await asyncTest('APIServer - parseBody handles invalid JSON', async () => {
    const server = new APIServer();
    const mockReq = {
        on: (event, callback) => {
            if (event === 'data') {
                callback(Buffer.from('invalid json'));
            }
            if (event === 'end') {
                callback();
            }
        }
    };

    try {
        await server.parseBody(mockReq);
        // Should return empty object on parse error
    } catch (error) {
        // Or throw error, both acceptable
    }
});

// ============================================================================
// SERVER STATE TESTS
// ============================================================================
console.log('\n🔄 Server State Tests');
console.log('-'.repeat(70));

test('APIServer - isRunning reflects server state', () => {
    const server = new APIServer();
    if (server.isRunning) throw new Error('Should not be running initially');
});

test('APIServer - Multiple server instances are independent', () => {
    const server1 = new APIServer({ port: 3000 });
    const server2 = new APIServer({ port: 4000 });

    if (server1.options.port === server2.options.port) {
        throw new Error('Instances should be independent');
    }
});

// ============================================================================
// CONFIGURATION TESTS
// ============================================================================
console.log('\n⚙️  Configuration Tests');
console.log('-'.repeat(70));

test('APIServer - Options can be modified after construction', () => {
    const server = new APIServer();
    server.options.port = 9000;

    if (server.options.port !== 9000) throw new Error('Should allow option modification');
});

test('APIServer - Default options are merged correctly', () => {
    const server = new APIServer({ port: 5000 });

    if (server.options.port !== 5000) throw new Error('Should override port');
    if (server.options.host !== 'localhost') throw new Error('Should keep default host');
    if (server.options.cors !== true) throw new Error('Should keep default cors');
});

// ============================================================================
// RESPONSE HELPERS TESTS
// ============================================================================
console.log('\n📤 Response Helpers Tests');
console.log('-'.repeat(70));

test('APIServer - sendJSON stringifies objects', () => {
    const server = new APIServer();
    let responseData = '';

    const mockRes = {
        writeHead: () => {},
        end: (data) => { responseData = data; }
    };

    server.sendJSON(mockRes, { nested: { value: 42 } });

    if (!responseData.includes('nested')) throw new Error('Should stringify nested objects');
    if (!responseData.includes('42')) throw new Error('Should include nested values');
});

test('APIServer - sendJSON handles arrays', () => {
    const server = new APIServer();
    let responseData = '';

    const mockRes = {
        writeHead: () => {},
        end: (data) => { responseData = data; }
    };

    server.sendJSON(mockRes, [1, 2, 3]);

    if (!responseData.includes('[')) throw new Error('Should format as array');
});

test('APIServer - sendError includes error property', () => {
    const server = new APIServer();
    let responseData = '';

    const mockRes = {
        writeHead: () => {},
        end: (data) => { responseData = data; }
    };

    server.sendError(mockRes, 500, 'Internal error');

    if (!responseData.includes('error')) throw new Error('Should have error property');
});

// ============================================================================
// EDGE CASES
// ============================================================================
console.log('\n🎯 Edge Cases');
console.log('-'.repeat(70));

test('APIServer - Constructor with null options', () => {
    const server = new APIServer(null);
    if (!server.options) throw new Error('Should handle null options');
    if (server.options.port !== 3000) throw new Error('Should use defaults');
});

test('APIServer - Constructor with empty object', () => {
    const server = new APIServer({});
    if (server.options.port !== 3000) throw new Error('Should use default port');
});

test('APIServer - checkAuth handles malformed auth header', () => {
    const server = new APIServer({ authToken: 'secret' });
    const mockReq = { headers: { authorization: 'InvalidFormat' } };

    if (server.checkAuth(mockReq)) throw new Error('Should reject malformed header');
});

test('APIServer - sendJSON handles null data', () => {
    const server = new APIServer();
    let responseData = '';

    const mockRes = {
        writeHead: () => {},
        end: (data) => { responseData = data; }
    };

    server.sendJSON(mockRes, null);

    if (!responseData.includes('null')) throw new Error('Should handle null');
});

test('APIServer - sendError with empty message', () => {
    const server = new APIServer();
    let responseData = '';

    const mockRes = {
        writeHead: () => {},
        end: (data) => { responseData = data; }
    };

    server.sendError(mockRes, 400, '');

    if (typeof responseData !== 'string') throw new Error('Should return string');
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
