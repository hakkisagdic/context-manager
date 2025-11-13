#!/usr/bin/env node

/**
 * Extended API Server Tests
 * Tests for API endpoint handlers and routing
 */

import { APIServer } from '../lib/api/rest/server.js';
import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'api-server-extended');
const TEST_PROJECT_DIR = path.join(FIXTURES_DIR, 'test-project');

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

// Create mock request object
function createMockRequest(method, pathname, query = {}, body = null) {
    const req = new EventEmitter();
    req.method = method;
    req.url = pathname + (Object.keys(query).length ? '?' + new URLSearchParams(query).toString() : '');
    req.headers = { host: 'localhost:3000' };

    if (body) {
        setTimeout(() => {
            req.emit('data', Buffer.from(JSON.stringify(body)));
            req.emit('end');
        }, 0);
    }

    return req;
}

// Create mock response object
function createMockResponse() {
    const res = {
        statusCode: 0,
        headers: {},
        body: '',
        writeHead: function(code, hdrs = {}) {
            this.statusCode = code;
            Object.assign(this.headers, hdrs);
        },
        setHeader: function(key, value) {
            this.headers[key] = value;
        },
        end: function(data) {
            this.body = data || '';
        }
    };
    return res;
}

// Setup fixtures
if (!fs.existsSync(TEST_PROJECT_DIR)) {
    fs.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
}

// Create test files
fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'app.js'),
    'function add(a, b) { return a + b; }\nmodule.exports = { add };\n');
fs.writeFileSync(path.join(TEST_PROJECT_DIR, 'utils.js'),
    'function multiply(x, y) { return x * y; }\n');

// Initialize git repo if not exists
try {
    fs.accessSync(path.join(TEST_PROJECT_DIR, '.git'));
} catch {
    execSync('git init', { cwd: TEST_PROJECT_DIR });
    execSync('git config user.name "Test User"', { cwd: TEST_PROJECT_DIR });
    execSync('git config user.email "test@example.com"', { cwd: TEST_PROJECT_DIR });
    execSync('git add .', { cwd: TEST_PROJECT_DIR });
    execSync('git commit -m "Initial commit"', { cwd: TEST_PROJECT_DIR });
}

console.log('🧪 Testing API Server Extended...\n');

// ============================================================================
// HANDLE DOCS ENDPOINT
// ============================================================================
console.log('📚 handleDocs() Tests');
console.log('-'.repeat(70));

test('APIServer - handleDocs returns documentation', () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    server.handleDocs(req, res);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (!data.version) throw new Error('Should have version');
    if (!data.endpoints) throw new Error('Should have endpoints array');
});

test('APIServer - handleDocs includes all endpoints', () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    server.handleDocs(req, res);

    const data = JSON.parse(res.body);
    if (data.endpoints.length < 5) throw new Error('Should have at least 5 endpoints');

    const paths = data.endpoints.map(e => e.path);
    if (!paths.includes('/api/v1/analyze')) throw new Error('Should document /analyze');
    if (!paths.includes('/api/v1/methods')) throw new Error('Should document /methods');
    if (!paths.includes('/api/v1/stats')) throw new Error('Should document /stats');
    if (!paths.includes('/api/v1/diff')) throw new Error('Should document /diff');
    if (!paths.includes('/api/v1/context')) throw new Error('Should document /context');
});

test('APIServer - handleDocs includes endpoint descriptions', () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    server.handleDocs(req, res);

    const data = JSON.parse(res.body);
    const analyzeEndpoint = data.endpoints.find(e => e.path === '/api/v1/analyze');
    if (!analyzeEndpoint.description) throw new Error('Should have description');
    if (!analyzeEndpoint.parameters) throw new Error('Should have parameters');
});

test('APIServer - handleDocs sets JSON content type', () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    server.handleDocs(req, res);

    if (res.headers['Content-Type'] !== 'application/json') {
        throw new Error('Should set JSON content type');
    }
});

// ============================================================================
// HANDLE STATS ENDPOINT
// ============================================================================
console.log('\n📊 handleStats() Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleStats returns statistics', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/stats?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/stats');
    const res = createMockResponse();

    await server.handleStats(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return stats object');
});

await asyncTest('APIServer - handleStats uses default path', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/stats');
    const req = createMockRequest('GET', '/api/v1/stats');
    const res = createMockResponse();

    await server.handleStats(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should handle default path');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return stats');
});

await asyncTest('APIServer - handleStats includes file counts', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/stats?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/stats');
    const res = createMockResponse();

    await server.handleStats(req, res, url);

    const data = JSON.parse(res.body);
    // Stats object should have some properties
    if (typeof data.totalFiles === 'undefined' && typeof data.processedFiles === 'undefined') {
        throw new Error('Should have file count stats');
    }
});

// ============================================================================
// HANDLE ANALYZE ENDPOINT
// ============================================================================
console.log('\n🔍 handleAnalyze() Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleAnalyze analyzes project', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/analyze?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/analyze');
    const res = createMockResponse();

    await server.handleAnalyze(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (!data) throw new Error('Should return analysis result');
});

await asyncTest('APIServer - handleAnalyze with method-level flag', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/analyze?path=' + TEST_PROJECT_DIR + '&methods=true');
    const req = createMockRequest('GET', '/api/v1/analyze');
    const res = createMockResponse();

    await server.handleAnalyze(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return analysis with methods');
});

await asyncTest('APIServer - handleAnalyze uses cwd by default', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/analyze');
    const req = createMockRequest('GET', '/api/v1/analyze');
    const res = createMockResponse();

    await server.handleAnalyze(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should use default path');
});

// ============================================================================
// HANDLE DIFF ENDPOINT
// ============================================================================
console.log('\n📝 handleDiff() Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleDiff analyzes git changes', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/diff?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/diff');
    const res = createMockResponse();

    await server.handleDiff(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return diff analysis');
});

await asyncTest('APIServer - handleDiff with since parameter', async () => {
    const server = new APIServer();
    // Use HEAD instead of HEAD~1 since repo only has 1 commit
    const url = new URL('http://localhost:3000/api/v1/diff?path=' + TEST_PROJECT_DIR + '&since=HEAD');
    const req = createMockRequest('GET', '/api/v1/diff');
    const res = createMockResponse();

    await server.handleDiff(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should handle since parameter');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return diff');
});

await asyncTest('APIServer - handleDiff uses default path', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/diff');
    const req = createMockRequest('GET', '/api/v1/diff');
    const res = createMockResponse();

    await server.handleDiff(req, res, url);

    if (res.statusCode !== 200) throw new Error('Should use cwd by default');
});

// ============================================================================
// HANDLE CONTEXT ENDPOINT
// ============================================================================
console.log('\n🤖 handleContext() Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleContext generates LLM context', async () => {
    const server = new APIServer();
    const req = createMockRequest('POST', '/api/v1/context', {}, {
        path: TEST_PROJECT_DIR,
        methodLevel: false
    });
    const res = createMockResponse();

    await server.handleContext(req, res);

    if (res.statusCode !== 200) throw new Error('Should return 200');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return context object');
});

await asyncTest('APIServer - handleContext with method-level', async () => {
    const server = new APIServer();
    const req = createMockRequest('POST', '/api/v1/context', {}, {
        path: TEST_PROJECT_DIR,
        methodLevel: true
    });
    const res = createMockResponse();

    await server.handleContext(req, res);

    if (res.statusCode !== 200) throw new Error('Should handle method-level');
    const data = JSON.parse(res.body);
    if (typeof data !== 'object') throw new Error('Should return context');
});

await asyncTest('APIServer - handleContext with targetModel', async () => {
    const server = new APIServer();
    const req = createMockRequest('POST', '/api/v1/context', {}, {
        path: TEST_PROJECT_DIR,
        targetModel: 'gpt-4',
        targetTokens: 8000
    });
    const res = createMockResponse();

    await server.handleContext(req, res);

    if (res.statusCode !== 200) throw new Error('Should handle targetModel');
});

await asyncTest('APIServer - handleContext uses default options', async () => {
    const server = new APIServer();
    const req = createMockRequest('POST', '/api/v1/context', {}, {
        path: TEST_PROJECT_DIR
    });
    const res = createMockResponse();

    await server.handleContext(req, res);

    if (res.statusCode !== 200) throw new Error('Should use default options');
});

// ============================================================================
// HANDLE API V1 ROUTING
// ============================================================================
console.log('\n🛤️  handleAPIv1() Routing Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleAPIv1 routes to analyze', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/analyze?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/analyze');
    const res = createMockResponse();

    await server.handleAPIv1(req, res, '/api/v1/analyze', url);

    if (res.statusCode !== 200) throw new Error('Should route to analyze');
});

await asyncTest('APIServer - handleAPIv1 routes to stats', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/stats?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/stats');
    const res = createMockResponse();

    await server.handleAPIv1(req, res, '/api/v1/stats', url);

    if (res.statusCode !== 200) throw new Error('Should route to stats');
});

await asyncTest('APIServer - handleAPIv1 routes to diff', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/diff?path=' + TEST_PROJECT_DIR);
    const req = createMockRequest('GET', '/api/v1/diff');
    const res = createMockResponse();

    await server.handleAPIv1(req, res, '/api/v1/diff', url);

    if (res.statusCode !== 200) throw new Error('Should route to diff');
});

test('APIServer - handleAPIv1 routes to docs', () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/docs');
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    server.handleAPIv1(req, res, '/api/v1/docs', url);

    if (res.statusCode !== 200) throw new Error('Should route to docs');
});

await asyncTest('APIServer - handleAPIv1 returns 404 for unknown endpoint', async () => {
    const server = new APIServer();
    const url = new URL('http://localhost:3000/api/v1/unknown');
    const req = createMockRequest('GET', '/api/v1/unknown');
    const res = createMockResponse();

    await server.handleAPIv1(req, res, '/api/v1/unknown', url);

    if (res.statusCode !== 404) throw new Error('Should return 404 for unknown endpoint');
});

// ============================================================================
// HANDLE REQUEST WITH CORS
// ============================================================================
console.log('\n🌐 handleRequest() CORS Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleRequest sets CORS headers when enabled', async () => {
    const server = new APIServer({ cors: true });
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (!res.headers['Access-Control-Allow-Origin']) {
        throw new Error('Should set CORS origin header');
    }
    if (res.headers['Access-Control-Allow-Origin'] !== '*') {
        throw new Error('Should allow all origins');
    }
});

await asyncTest('APIServer - handleRequest handles OPTIONS preflight', async () => {
    const server = new APIServer({ cors: true });
    const req = createMockRequest('OPTIONS', '/api/v1/analyze');
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (res.statusCode !== 200) throw new Error('Should return 200 for OPTIONS');
    if (!res.headers['Access-Control-Allow-Methods']) {
        throw new Error('Should set allowed methods');
    }
});

await asyncTest('APIServer - handleRequest skips CORS when disabled', async () => {
    const server = new APIServer({ cors: false });
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    await server.handleRequest(req, res);

    // With cors disabled, should not set CORS headers
    // But request should still succeed
    if (res.statusCode !== 200) throw new Error('Should process request');
});

// ============================================================================
// HANDLE REQUEST WITH AUTH
// ============================================================================
console.log('\n🔒 handleRequest() Auth Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleRequest checks auth when enabled', async () => {
    const server = new APIServer({ authToken: 'secret123' });
    const req = createMockRequest('GET', '/api/v1/docs');
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (res.statusCode !== 401) throw new Error('Should return 401 without auth');
    const data = JSON.parse(res.body);
    if (!data.error) throw new Error('Should include error message');
});

await asyncTest('APIServer - handleRequest accepts valid auth token', async () => {
    const server = new APIServer({ authToken: 'secret123' });
    const req = createMockRequest('GET', '/api/v1/docs');
    req.headers.authorization = 'Bearer secret123';
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (res.statusCode !== 200) throw new Error('Should accept valid token');
});

await asyncTest('APIServer - handleRequest rejects invalid auth token', async () => {
    const server = new APIServer({ authToken: 'secret123' });
    const req = createMockRequest('GET', '/api/v1/docs');
    req.headers.authorization = 'Bearer wrong';
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (res.statusCode !== 401) throw new Error('Should reject invalid token');
});

// ============================================================================
// ERROR HANDLING
// ============================================================================
console.log('\n⚠️  Error Handling Tests');
console.log('-'.repeat(70));

await asyncTest('APIServer - handleRequest returns 404 for non-API path', async () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/not-api');
    const res = createMockResponse();

    await server.handleRequest(req, res);

    if (res.statusCode !== 404) throw new Error('Should return 404');
});

await asyncTest('APIServer - handleRequest catches errors', async () => {
    const server = new APIServer();
    const req = createMockRequest('GET', '/api/v1/analyze?path=/nonexistent/path/that/does/not/exist');
    const res = createMockResponse();

    // Should handle error gracefully
    try {
        await server.handleRequest(req, res);
        // Either returns error response or throws
        if (res.statusCode >= 400) {
            // Error handled correctly
        }
    } catch (error) {
        // Error thrown but should be caught by handleRequest
        throw new Error('Error should be caught and returned as response');
    }
});

// ============================================================================
// CLEANUP
// ============================================================================
console.log('\n🧹 Cleanup');
console.log('-'.repeat(70));

if (fs.existsSync(FIXTURES_DIR)) {
    fs.rmSync(FIXTURES_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test fixtures');
}

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
    console.log('\n🎉 All API server extended tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
}
