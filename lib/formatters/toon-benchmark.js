/**
 * TOON Performance Benchmark Suite
 * Measures encode/decode performance, memory usage, and compression ratios
 */

import ToonFormatterV13 from './toon-formatter-v1.3.js';

class ToonBenchmark {
    constructor(options = {}) {
        this.formatter = new ToonFormatterV13(options);
        this.results = [];
    }

    /**
     * Run a benchmark
     */
    benchmark(name, fn, iterations = 100) {
        // Warmup
        for (let i = 0; i < 10; i++) {
            fn();
        }

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const memBefore = process.memoryUsage();
        const startTime = process.hrtime.bigint();

        // Run benchmark
        for (let i = 0; i < iterations; i++) {
            fn();
        }

        const endTime = process.hrtime.bigint();
        const memAfter = process.memoryUsage();

        const durationMs = Number(endTime - startTime) / 1_000_000;
        const avgMs = durationMs / iterations;
        const opsPerSec = Math.floor(1000 / avgMs);

        const memDelta = {
            heapUsed: memAfter.heapUsed - memBefore.heapUsed,
            external: memAfter.external - memBefore.external
        };

        const result = {
            name,
            iterations,
            totalMs: durationMs.toFixed(2),
            avgMs: avgMs.toFixed(4),
            opsPerSec,
            memoryDelta: {
                heapUsed: this._formatBytes(memDelta.heapUsed),
                external: this._formatBytes(memDelta.external)
            }
        };

        this.results.push(result);
        return result;
    }

    /**
     * Benchmark encoding
     */
    benchmarkEncode(data, iterations = 100) {
        return this.benchmark(
            `Encode (${this._describeData(data)})`,
            () => this.formatter.encode(data),
            iterations
        );
    }

    /**
     * Benchmark decoding
     */
    benchmarkDecode(toonString, iterations = 100) {
        return this.benchmark(
            `Decode (${toonString.length} chars)`,
            () => this.formatter.decode(toonString),
            iterations
        );
    }

    /**
     * Benchmark roundtrip (encode + decode)
     */
    benchmarkRoundtrip(data, iterations = 100) {
        return this.benchmark(
            `Roundtrip (${this._describeData(data)})`,
            () => {
                const encoded = this.formatter.encode(data);
                this.formatter.decode(encoded);
            },
            iterations
        );
    }

    /**
     * Compare TOON with JSON
     */
    compareWithJSON(data) {
        const toonEncoded = this.formatter.encode(data);
        const jsonEncoded = JSON.stringify(data, null, 2);

        const toonSize = Buffer.byteLength(toonEncoded, 'utf8');
        const jsonSize = Buffer.byteLength(jsonEncoded, 'utf8');

        const toonResult = this.benchmarkEncode(data, 100);
        const jsonResult = this.benchmark('JSON.stringify', () => JSON.stringify(data, null, 2), 100);

        return {
            sizes: {
                toon: this._formatBytes(toonSize),
                json: this._formatBytes(jsonSize),
                savings: this._formatBytes(jsonSize - toonSize),
                savingsPercent: (((jsonSize - toonSize) / jsonSize) * 100).toFixed(1) + '%'
            },
            performance: {
                toon: `${toonResult.avgMs}ms (${toonResult.opsPerSec} ops/sec)`,
                json: `${jsonResult.avgMs}ms (${jsonResult.opsPerSec} ops/sec)`,
                speedup: (parseFloat(jsonResult.avgMs) / parseFloat(toonResult.avgMs)).toFixed(2) + 'x'
            }
        };
    }

    /**
     * Benchmark tabular vs list format
     */
    benchmarkArrayFormats(uniformArray, mixedArray) {
        const tabularResult = this.benchmarkEncode(uniformArray, 100);
        const listResult = this.benchmarkEncode(mixedArray, 100);

        return {
            tabular: tabularResult,
            list: listResult,
            comparison: {
                speedDiff: (parseFloat(listResult.avgMs) - parseFloat(tabularResult.avgMs)).toFixed(4) + 'ms',
                faster: parseFloat(tabularResult.avgMs) < parseFloat(listResult.avgMs) ? 'tabular' : 'list'
            }
        };
    }

    /**
     * Stress test with large data
     */
    stressTest(size = 10000) {
        const largeArray = Array.from({ length: size }, (_, i) => ({
            id: i,
            name: `Item${i}`,
            value: i * 100,
            active: i % 2 === 0
        }));

        console.log(`\n🔥 Stress Test: ${size} items`);
        console.log('-'.repeat(70));

        const encodeResult = this.benchmarkEncode(largeArray, 10);
        const encoded = this.formatter.encode(largeArray);
        const decodeResult = this.benchmarkDecode(encoded, 10);

        const encodedSize = Buffer.byteLength(encoded, 'utf8');
        const jsonSize = Buffer.byteLength(JSON.stringify(largeArray, null, 2), 'utf8');

        return {
            dataSize: size,
            encode: encodeResult,
            decode: decodeResult,
            sizes: {
                toon: this._formatBytes(encodedSize),
                json: this._formatBytes(jsonSize),
                compression: (((jsonSize - encodedSize) / jsonSize) * 100).toFixed(1) + '%'
            }
        };
    }

    /**
     * Print all results
     */
    printResults() {
        console.log('\n📊 Benchmark Results');
        console.log('='.repeat(70));

        for (const result of this.results) {
            console.log(`\n${result.name}`);
            console.log(`  Iterations: ${result.iterations}`);
            console.log(`  Total Time: ${result.totalMs}ms`);
            console.log(`  Average: ${result.avgMs}ms`);
            console.log(`  Ops/Sec: ${result.opsPerSec.toLocaleString()}`);
            console.log(`  Memory Δ: heap=${result.memoryDelta.heapUsed}, ext=${result.memoryDelta.external}`);
        }
    }

    /**
     * Get summary statistics
     */
    getSummary() {
        if (this.results.length === 0) {
            return { message: 'No benchmarks run yet' };
        }

        const avgTimes = this.results.map(r => parseFloat(r.avgMs));
        const totalOps = this.results.reduce((sum, r) => sum + r.opsPerSec, 0);

        return {
            totalBenchmarks: this.results.length,
            avgTime: {
                min: Math.min(...avgTimes).toFixed(4) + 'ms',
                max: Math.max(...avgTimes).toFixed(4) + 'ms',
                mean: (avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length).toFixed(4) + 'ms'
            },
            totalOpsPerSec: totalOps.toLocaleString()
        };
    }

    /**
     * Clear results
     */
    clear() {
        this.results = [];
    }

    /**
     * Format bytes to human readable
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        if (bytes < 0) return '-' + this._formatBytes(-bytes);

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Describe data for benchmark name
     */
    _describeData(data) {
        if (Array.isArray(data)) {
            return `${data.length} items`;
        }
        if (typeof data === 'object' && data !== null) {
            return `${Object.keys(data).length} props`;
        }
        return typeof data;
    }
}

export default ToonBenchmark;
