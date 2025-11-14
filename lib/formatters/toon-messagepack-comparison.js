/**
 * TOON vs MessagePack Comparison
 * Compares TOON format with MessagePack encoding (if available)
 *
 * Note: MessagePack is an optional dependency
 * If not installed, comparison uses size estimates
 *
 * Install MessagePack: npm install msgpack-lite
 */

import ToonFormatterV13 from './toon-formatter-v1.3.js';

class ToonMessagePackComparison {
    constructor() {
        this.formatter = new ToonFormatterV13();
        this.msgpack = null;
        this.msgpackLoaded = false;
    }

    /**
     * Try to load MessagePack (optional dependency)
     */
    async _loadMessagePack() {
        if (this.msgpackLoaded) return;

        try {
            this.msgpack = await import('msgpack-lite');
            this.msgpackLoaded = true;
        } catch (error) {
            // MessagePack not available, will use estimates
            this.msgpackLoaded = true;
        }
    }

    /**
     * Compare TOON with MessagePack
     */
    async compare(data) {
        await this._loadMessagePack();
        const toonEncoded = this.formatter.encode(data);
        const jsonEncoded = JSON.stringify(data, null, 2);

        const toonSize = Buffer.byteLength(toonEncoded, 'utf8');
        const jsonSize = Buffer.byteLength(jsonEncoded, 'utf8');

        let msgpackSize;
        let msgpackEncoded;
        let msgpackAvailable = false;

        if (this.msgpack) {
            try {
                msgpackEncoded = this.msgpack.encode(data);
                msgpackSize = msgpackEncoded.length;
                msgpackAvailable = true;
            } catch (error) {
                msgpackSize = this._estimateMessagePackSize(data);
            }
        } else {
            msgpackSize = this._estimateMessagePackSize(data);
        }

        return {
            formats: {
                toon: {
                    size: toonSize,
                    sizeFormatted: this._formatBytes(toonSize),
                    compression: this._compressionRatio(jsonSize, toonSize),
                    humanReadable: true,
                    textBased: true
                },
                json: {
                    size: jsonSize,
                    sizeFormatted: this._formatBytes(jsonSize),
                    compression: '0%',
                    humanReadable: true,
                    textBased: true
                },
                messagepack: {
                    size: msgpackSize,
                    sizeFormatted: this._formatBytes(msgpackSize),
                    compression: this._compressionRatio(jsonSize, msgpackSize),
                    humanReadable: false,
                    textBased: false,
                    estimated: !msgpackAvailable
                }
            },
            comparison: {
                toonVsJson: this._compareFormats('TOON', toonSize, 'JSON', jsonSize),
                toonVsMsgpack: this._compareFormats('TOON', toonSize, 'MessagePack', msgpackSize),
                msgpackVsJson: this._compareFormats('MessagePack', msgpackSize, 'JSON', jsonSize)
            },
            winner: this._determineWinner(toonSize, jsonSize, msgpackSize),
            notes: msgpackAvailable ? [] : ['MessagePack size is estimated (package not installed)']
        };
    }

    /**
     * Estimate MessagePack size (when package not available)
     */
    _estimateMessagePackSize(data) {
        // MessagePack is typically 20-50% smaller than JSON
        // More accurate for structured data
        const jsonSize = Buffer.byteLength(JSON.stringify(data), 'utf8');

        // Estimation rules based on data type
        if (Array.isArray(data)) {
            const isUniform = this._isUniformArray(data);
            if (isUniform && data.length > 10) {
                // Uniform arrays compress well in MessagePack
                return Math.floor(jsonSize * 0.3); // ~70% compression
            }
            return Math.floor(jsonSize * 0.5); // ~50% compression
        }

        if (typeof data === 'object' && data !== null) {
            const keyCount = Object.keys(data).length;
            if (keyCount > 20) {
                // Many keys = more savings
                return Math.floor(jsonSize * 0.4); // ~60% compression
            }
            return Math.floor(jsonSize * 0.6); // ~40% compression
        }

        // Primitives
        return Math.floor(jsonSize * 0.7); // ~30% compression
    }

    /**
     * Check if array is uniform
     */
    _isUniformArray(arr) {
        if (arr.length === 0) return true;
        if (!arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
            return false;
        }

        const firstKeys = Object.keys(arr[0]).sort();
        return arr.every(item => {
            const keys = Object.keys(item).sort();
            return keys.length === firstKeys.length &&
                   keys.every((key, i) => key === firstKeys[i]);
        });
    }

    /**
     * Compare two formats
     */
    _compareFormats(name1, size1, name2, size2) {
        const diff = size2 - size1;
        const percent = ((diff / size2) * 100).toFixed(1);

        if (diff > 0) {
            return `${name1} is ${this._formatBytes(diff)} (${percent}%) smaller than ${name2}`;
        } else if (diff < 0) {
            return `${name1} is ${this._formatBytes(-diff)} (${Math.abs(parseFloat(percent))}%) larger than ${name2}`;
        } else {
            return `${name1} and ${name2} have equal size`;
        }
    }

    /**
     * Calculate compression ratio
     */
    _compressionRatio(originalSize, compressedSize) {
        const ratio = ((originalSize - compressedSize) / originalSize) * 100;
        return ratio.toFixed(1) + '%';
    }

    /**
     * Determine overall winner
     */
    _determineWinner(toonSize, jsonSize, msgpackSize) {
        const sizes = {
            TOON: toonSize,
            JSON: jsonSize,
            MessagePack: msgpackSize
        };

        const sorted = Object.entries(sizes).sort((a, b) => a[1] - b[1]);

        return {
            smallest: sorted[0][0],
            largest: sorted[2][0],
            ranking: sorted.map((entry, index) => ({
                rank: index + 1,
                format: entry[0],
                size: this._formatBytes(entry[1])
            }))
        };
    }

    /**
     * Benchmark comparison (performance)
     */
    async benchmarkComparison(data, iterations = 100) {
        await this._loadMessagePack();
        const results = {
            toon: { encode: 0, decode: 0 },
            json: { encode: 0, decode: 0 },
            messagepack: { encode: 0, decode: 0 }
        };

        // TOON benchmark
        let start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            this.formatter.encode(data);
        }
        results.toon.encode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;

        const toonEncoded = this.formatter.encode(data);
        start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            this.formatter.decode(toonEncoded);
        }
        results.toon.decode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;

        // JSON benchmark
        start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            JSON.stringify(data);
        }
        results.json.encode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;

        const jsonEncoded = JSON.stringify(data);
        start = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            JSON.parse(jsonEncoded);
        }
        results.json.decode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;

        // MessagePack benchmark (if available)
        if (this.msgpack) {
            start = process.hrtime.bigint();
            for (let i = 0; i < iterations; i++) {
                this.msgpack.encode(data);
            }
            results.messagepack.encode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;

            const msgpackEncoded = this.msgpack.encode(data);
            start = process.hrtime.bigint();
            for (let i = 0; i < iterations; i++) {
                this.msgpack.decode(msgpackEncoded);
            }
            results.messagepack.decode = Number(process.hrtime.bigint() - start) / 1_000_000 / iterations;
        }

        return {
            averageMs: results,
            fastest: {
                encode: this._findFastest(results, 'encode'),
                decode: this._findFastest(results, 'decode')
            }
        };
    }

    /**
     * Find fastest format for operation
     */
    _findFastest(results, operation) {
        const times = Object.entries(results)
            .filter(([name, data]) => data[operation] > 0)
            .sort((a, b) => a[1][operation] - b[1][operation]);

        return times.length > 0 ? times[0][0] : null;
    }

    /**
     * Format bytes
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default ToonMessagePackComparison;
