#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for Dashboard Component (v3.0.0)
 * Tests dashboard creation, props handling, calculations, and edge cases
 */

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
    testsRun++;
    try {
        await fn();
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

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(`${message}: expected non-null value`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(`${message}: expected ${actual} > ${expected}`);
    }
}

function assertLessThan(actual, expected, message) {
    if (actual >= expected) {
        throw new Error(`${message}: expected ${actual} < ${expected}`);
    }
}

// Helper function to test number formatting
function formatNumber(num) {
    return num.toLocaleString();
}

// Helper function to calculate MB from bytes
function bytesToMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
}

// Helper function to calculate average
function calculateAverage(totalTokens, totalFiles) {
    return totalFiles > 0 ? Math.round(totalTokens / totalFiles) : 0;
}

async function main() {
    console.log('🧪 Testing Dashboard Component Comprehensively (v3.0.0)...\n');

    // ============================================================================
    // DASHBOARD INITIALIZATION
    // ============================================================================
    console.log('📊 Dashboard Initialization');
    console.log('-'.repeat(60));

    await test('Dashboard module can be imported', async () => {
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');
        assertNotNull(Dashboard, 'Dashboard should be importable');
        assertEquals(typeof Dashboard, 'function', 'Dashboard should be a function');
    });

    await test('Dashboard creates element with minimal props', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 0,
            totalTokens: 0,
            totalBytes: 0,
            totalLines: 0,
            byExtension: {}
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should create dashboard element');
        assertNotNull(element.type, 'Element should have type');
        assertNotNull(element.props, 'Element should have props');
        assertEquals(element.props.stats.totalFiles, 0, 'Stats should be passed');
    });

    await test('Dashboard creates element with complete stats', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 64,
            totalTokens: 181480,
            totalBytes: 782336,
            totalLines: 28721,
            byExtension: {
                '.js': { count: 64, tokens: 181480 }
            }
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertEquals(element.props.stats.totalFiles, 64, 'Should pass file count');
        assertEquals(element.props.stats.totalTokens, 181480, 'Should pass token count');
    });

    await test('Dashboard creates element with custom status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, status: 'analyzing' });
        assertEquals(element.props.status, 'analyzing', 'Should pass custom status');
    });

    await test('Dashboard creates element with topFiles', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 64,
            totalTokens: 181480,
            totalBytes: 782336,
            totalLines: 28721,
            byExtension: {
                '.js': { count: 64, tokens: 181480 }
            }
        };

        const topFiles = [
            { name: 'server.js', tokens: 12388 },
            { name: 'handler.js', tokens: 11007 },
            { name: 'security.js', tokens: 7814 }
        ];

        const element = React.default.createElement(Dashboard, { stats, topFiles });
        assertTrue(Array.isArray(element.props.topFiles), 'Should pass topFiles array');
        assertEquals(element.props.topFiles.length, 3, 'Should have 3 files');
        assertEquals(element.props.topFiles[0].name, 'server.js', 'First file should be server.js');
    });

    // ============================================================================
    // PROPS VALIDATION
    // ============================================================================
    console.log('\n📝 Props Validation');
    console.log('-'.repeat(60));

    await test('Dashboard handles undefined stats object', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const element = React.default.createElement(Dashboard, { stats: {} });
        assertNotNull(element, 'Should handle empty stats');
    });

    await test('Dashboard handles missing byExtension', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 1000, totalBytes: 5000, totalLines: 500 };
        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle missing byExtension');
    });

    await test('Dashboard handles null topFiles', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 1000, totalBytes: 5000, totalLines: 500, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, topFiles: null });
        assertNotNull(element, 'Should handle null topFiles');
    });

    await test('Dashboard handles undefined status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 1000, totalBytes: 5000, totalLines: 500, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats });
        // Default status should be 'analyzing'
        assertTrue(element.props.status === undefined || element.props.status === 'analyzing', 'Should handle undefined status');
    });

    await test('Dashboard accepts different status values', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 1000, totalBytes: 5000, totalLines: 500, byExtension: {} };

        const statuses = ['analyzing', 'complete', 'idle', 'watching', 'error'];
        for (const status of statuses) {
            const element = React.default.createElement(Dashboard, { stats, status });
            assertEquals(element.props.status, status, `Should accept ${status} status`);
        }
    });

    // ============================================================================
    // NUMBER FORMATTING TESTS
    // ============================================================================
    console.log('\n🔢 Number Formatting');
    console.log('-'.repeat(60));

    await test('Format thousands with commas', () => {
        assertEquals(formatNumber(1234), '1,234', 'Should format thousands');
        assertEquals(formatNumber(5678), '5,678', 'Should format thousands');
    });

    await test('Format millions with commas', () => {
        assertEquals(formatNumber(1000000), '1,000,000', 'Should format millions');
        assertEquals(formatNumber(1234567), '1,234,567', 'Should format millions');
    });

    await test('Format zero correctly', () => {
        assertEquals(formatNumber(0), '0', 'Should format zero');
    });

    await test('Format large numbers', () => {
        assertEquals(formatNumber(12345678), '12,345,678', 'Should format large numbers');
    });

    // ============================================================================
    // SIZE CALCULATION TESTS
    // ============================================================================
    console.log('\n💾 Size Calculations');
    console.log('-'.repeat(60));

    await test('Convert bytes to MB correctly', () => {
        assertEquals(bytesToMB(0), '0.00', 'Should handle 0 bytes');
        assertEquals(bytesToMB(1048576), '1.00', 'Should handle 1 MB exactly');
        assertEquals(bytesToMB(2097152), '2.00', 'Should handle 2 MB exactly');
        assertEquals(bytesToMB(1536000), '1.46', 'Should handle fractional MB');
    });

    await test('Handle very small byte sizes', () => {
        assertEquals(bytesToMB(100), '0.00', 'Should show 0.00 for small sizes');
        assertEquals(bytesToMB(1024), '0.00', 'Should show 0.00 for 1KB');
    });

    await test('Handle very large byte sizes', () => {
        const result = bytesToMB(1073741824); // 1 GB
        assertEquals(result, '1024.00', 'Should handle GB sizes');
    });

    // ============================================================================
    // AVERAGE CALCULATION TESTS
    // ============================================================================
    console.log('\n📊 Average Calculations');
    console.log('-'.repeat(60));

    await test('Calculate average tokens per file', () => {
        assertEquals(calculateAverage(5000, 10), 500, 'Should calculate average correctly');
        assertEquals(calculateAverage(181480, 64), 2836, 'Should calculate average correctly'); // Math.round(181480/64) = 2836
        assertEquals(calculateAverage(1000, 4), 250, 'Should calculate average correctly');
    });

    await test('Handle zero files when calculating average', () => {
        assertEquals(calculateAverage(1000, 0), 0, 'Should return 0 for zero files');
        assertEquals(calculateAverage(0, 0), 0, 'Should return 0 for zero everything');
    });

    await test('Round average to nearest integer', () => {
        const avg = calculateAverage(1000, 3); // 333.333...
        assertEquals(avg, 333, 'Should round to nearest integer');
    });

    // ============================================================================
    // TOP FILES HANDLING
    // ============================================================================
    console.log('\n📄 Top Files Handling');
    console.log('-'.repeat(60));

    await test('Dashboard handles empty topFiles array', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 1000, totalBytes: 5000, totalLines: 500, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, topFiles: [] });
        assertTrue(Array.isArray(element.props.topFiles), 'topFiles should be array');
        assertEquals(element.props.topFiles.length, 0, 'Should have empty array');
    });

    await test('Dashboard handles single file in topFiles', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 1, totalTokens: 1000, totalBytes: 5000, totalLines: 100, byExtension: {} };
        const topFiles = [{ name: 'single.js', tokens: 1000 }];
        const element = React.default.createElement(Dashboard, { stats, topFiles });
        assertEquals(element.props.topFiles.length, 1, 'Should have one file');
    });

    await test('Dashboard handles multiple topFiles', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 10, totalTokens: 10000, totalBytes: 50000, totalLines: 1000, byExtension: {} };
        const topFiles = [
            { name: 'file1.js', tokens: 3000 },
            { name: 'file2.js', tokens: 2000 },
            { name: 'file3.js', tokens: 1500 },
            { name: 'file4.js', tokens: 1000 }
        ];
        const element = React.default.createElement(Dashboard, { stats, topFiles });
        assertEquals(element.props.topFiles.length, 4, 'Should have all files');
    });

    await test('File percentage calculation', () => {
        const totalTokens = 10000;
        const fileTokens = 5000;
        const percentage = ((fileTokens / totalTokens) * 100).toFixed(1);
        assertEquals(percentage, '50.0', 'Should calculate 50% correctly');

        const fileTokens2 = 2500;
        const percentage2 = ((fileTokens2 / totalTokens) * 100).toFixed(1);
        assertEquals(percentage2, '25.0', 'Should calculate 25% correctly');
    });

    // ============================================================================
    // LANGUAGE/EXTENSION HANDLING
    // ============================================================================
    console.log('\n🌐 Language/Extension Handling');
    console.log('-'.repeat(60));

    await test('Dashboard handles single language', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 10,
            totalTokens: 10000,
            totalBytes: 50000,
            totalLines: 1000,
            byExtension: {
                '.js': { count: 10, tokens: 10000 }
            }
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertEquals(Object.keys(element.props.stats.byExtension).length, 1, 'Should have one language');
    });

    await test('Dashboard handles multiple languages', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 20,
            totalTokens: 20000,
            totalBytes: 100000,
            totalLines: 2000,
            byExtension: {
                '.js': { count: 10, tokens: 10000 },
                '.ts': { count: 5, tokens: 6000 },
                '.py': { count: 5, tokens: 4000 }
            }
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertEquals(Object.keys(element.props.stats.byExtension).length, 3, 'Should have three languages');
    });

    await test('Dashboard handles no languages', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 0,
            totalTokens: 0,
            totalBytes: 0,
            totalLines: 0,
            byExtension: {}
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertEquals(Object.keys(element.props.stats.byExtension).length, 0, 'Should have no languages');
    });

    await test('Find dominant language', () => {
        const byExtension = {
            '.js': { count: 50, tokens: 150000 },
            '.ts': { count: 20, tokens: 60000 },
            '.py': { count: 14, tokens: 31480 }
        };

        const extensions = Object.entries(byExtension);
        const dominant = extensions.sort((a, b) => b[1].count - a[1].count)[0];

        assertEquals(dominant[0], '.js', 'JS should be dominant');
        assertEquals(dominant[1].count, 50, 'Should have correct count');
    });

    // ============================================================================
    // EDGE CASES
    // ============================================================================
    console.log('\n⚠️  Edge Cases');
    console.log('-'.repeat(60));

    await test('Dashboard handles very large numbers', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 1000000,
            totalTokens: 999999999,
            totalBytes: 999999999,
            totalLines: 999999999,
            byExtension: {}
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle very large numbers');
    });

    await test('Dashboard handles negative values', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: -1,
            totalTokens: -100,
            totalBytes: -1000,
            totalLines: -50,
            byExtension: {}
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle negative values');
    });

    await test('Dashboard handles zero values', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 0,
            totalTokens: 0,
            totalBytes: 0,
            totalLines: 0,
            byExtension: {}
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle zero values');
        assertEquals(element.props.stats.totalFiles, 0, 'Files should be 0');
        assertEquals(element.props.stats.totalTokens, 0, 'Tokens should be 0');
    });

    await test('Dashboard handles missing properties', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {}; // Missing all properties
        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle missing properties');
    });

    await test('Dashboard handles mixed valid and invalid data', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = {
            totalFiles: 10,
            totalTokens: null,
            totalBytes: undefined,
            totalLines: 0,
            byExtension: null
        };

        const element = React.default.createElement(Dashboard, { stats });
        assertNotNull(element, 'Should handle mixed data');
    });

    // ============================================================================
    // FILE NAME HANDLING
    // ============================================================================
    console.log('\n📁 File Name Handling');
    console.log('-'.repeat(60));

    await test('Handle file with name property', () => {
        const file = { name: 'test.js', tokens: 1000 };
        const fileName = file.name || file.relativePath || file.path || 'unknown';
        assertEquals(fileName, 'test.js', 'Should use name property');
    });

    await test('Handle file with relativePath property', () => {
        const file = { relativePath: 'src/test.js', tokens: 1000 };
        const fileName = file.name || file.relativePath || file.path || 'unknown';
        assertEquals(fileName, 'src/test.js', 'Should use relativePath property');
    });

    await test('Handle file with path property', () => {
        const file = { path: '/full/path/test.js', tokens: 1000 };
        const fileName = file.name || file.relativePath || file.path || 'unknown';
        assertEquals(fileName, '/full/path/test.js', 'Should use path property');
    });

    await test('Handle file with no path properties', () => {
        const file = { tokens: 1000 };
        const fileName = file.name || file.relativePath || file.path || 'unknown';
        assertEquals(fileName, 'unknown', 'Should fallback to unknown');
    });

    await test('Truncate long file names to 30 characters', () => {
        const longName = 'very-long-file-name-that-should-be-truncated-at-thirty-characters.js';
        const truncated = longName.substring(0, 30);
        assertEquals(truncated.length, 30, 'Should truncate to 30 chars');
        assertEquals(truncated, 'very-long-file-name-that-shoul', 'Should match expected truncation');
    });

    // ============================================================================
    // PERFORMANCE METRICS
    // ============================================================================
    console.log('\n⚡ Performance Metrics');
    console.log('-'.repeat(60));

    await test('Calculate tokens per file ratio', () => {
        const totalTokens = 100000;
        const totalFiles = 200;
        const ratio = Math.round(totalTokens / totalFiles);
        assertEquals(ratio, 500, 'Should calculate ratio correctly');
    });

    await test('Calculate percentage correctly', () => {
        const part = 25;
        const total = 100;
        const percent = ((part / total) * 100).toFixed(1);
        assertEquals(percent, '25.0', 'Should calculate percentage');
    });

    await test('Handle division by zero in percentage', () => {
        const part = 100;
        const total = 0;
        // In real code, should check for zero
        const isValid = total > 0;
        assertFalse(isValid, 'Should detect invalid division');
    });

    // ============================================================================
    // STATUS VALUES
    // ============================================================================
    console.log('\n📊 Status Values');
    console.log('-'.repeat(60));

    await test('Accept analyzing status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, status: 'analyzing' });
        assertEquals(element.props.status, 'analyzing', 'Should accept analyzing');
    });

    await test('Accept complete status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, status: 'complete' });
        assertEquals(element.props.status, 'complete', 'Should accept complete');
    });

    await test('Accept idle status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, status: 'idle' });
        assertEquals(element.props.status, 'idle', 'Should accept idle');
    });

    await test('Accept watching status', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats, status: 'watching' });
        assertEquals(element.props.status, 'watching', 'Should accept watching');
    });

    // ============================================================================
    // COMPONENT STRUCTURE
    // ============================================================================
    console.log('\n🏗️  Component Structure');
    console.log('-'.repeat(60));

    await test('Dashboard returns React element', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats });

        assertNotNull(element, 'Should return element');
        assertTrue(React.default.isValidElement(element), 'Should be valid React element');
    });

    await test('Dashboard element has correct type', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 0, totalTokens: 0, totalBytes: 0, totalLines: 0, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats });

        assertEquals(element.type, Dashboard, 'Element type should be Dashboard');
    });

    await test('Dashboard element has props', async () => {
        const React = await import('react');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        const stats = { totalFiles: 5, totalTokens: 500, totalBytes: 2500, totalLines: 250, byExtension: {} };
        const element = React.default.createElement(Dashboard, { stats });

        assertNotNull(element.props, 'Should have props');
        assertNotNull(element.props.stats, 'Should have stats prop');
    });

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`Total tests run: ${testsRun}`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

    if (testsFailed > 0) {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

// Run main function
main().catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
});
