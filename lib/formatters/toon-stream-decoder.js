/**
 * TOON Stream Decoder
 * Node.js Transform stream for decoding TOON format to JavaScript objects
 *
 * Usage:
 *   const decoder = new ToonStreamDecoder({ delimiter: ',' });
 *   inputStream.pipe(decoder).pipe(objectStream);
 */

import { Transform } from 'stream';
import ToonFormatterV13 from './toon-formatter-v1.3.js';

class ToonStreamDecoder extends Transform {
    constructor(options = {}) {
        super({
            readableObjectMode: true,
            ...options
        });

        this.formatter = new ToonFormatterV13({
            indent: options.indent || 2,
            delimiter: options.delimiter || ',',
            lengthMarker: options.lengthMarker || false
        });

        this.buffer = '';
        this.separator = options.separator || '---'; // Separator between TOON objects
    }

    _transform(chunk, encoding, callback) {
        try {
            // Add chunk to buffer
            this.buffer += chunk.toString();

            // Try to extract complete TOON objects
            this._processBuffer(callback);
        } catch (error) {
            callback(error);
        }
    }

    _processBuffer(callback) {
        // Split by separator
        const parts = this.buffer.split(`\n${this.separator}\n`);

        // Process all complete parts except the last (which might be incomplete)
        for (let i = 0; i < parts.length - 1; i++) {
            const toonString = parts[i].trim();
            if (toonString) {
                try {
                    const decoded = this.formatter.decode(toonString);
                    this.push(decoded);
                } catch (error) {
                    // Skip malformed TOON, continue processing
                    this.emit('error', new Error(`Failed to decode TOON: ${error.message}`));
                }
            }
        }

        // Keep the last part in buffer (might be incomplete)
        this.buffer = parts[parts.length - 1];
        callback();
    }

    _flush(callback) {
        try {
            // Process remaining buffer
            const toonString = this.buffer.trim();
            if (toonString) {
                try {
                    const decoded = this.formatter.decode(toonString);
                    this.push(decoded);
                } catch (error) {
                    callback(new Error(`Failed to decode final TOON: ${error.message}`));
                    return;
                }
            }
            callback();
        } catch (error) {
            callback(error);
        }
    }
}

export default ToonStreamDecoder;
