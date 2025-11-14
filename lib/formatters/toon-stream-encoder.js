/**
 * TOON Stream Encoder
 * Node.js Transform stream for encoding JavaScript objects to TOON format
 *
 * Usage:
 *   const encoder = new ToonStreamEncoder({ delimiter: ',' });
 *   objectStream.pipe(encoder).pipe(outputStream);
 */

import { Transform } from 'stream';
import ToonFormatterV13 from './toon-formatter-v1.3.js';

class ToonStreamEncoder extends Transform {
    constructor(options = {}) {
        super({
            objectMode: true,
            ...options
        });

        this.formatter = new ToonFormatterV13({
            indent: options.indent || 2,
            delimiter: options.delimiter || ',',
            lengthMarker: options.lengthMarker || false
        });

        this.firstChunk = true;
        this.arrayMode = options.arrayMode || false; // If true, wraps output in array format
        this.itemCount = 0;
    }

    _transform(chunk, encoding, callback) {
        try {
            // Encode the chunk
            const encoded = this.formatter.encode(chunk);

            if (this.arrayMode) {
                // Array mode: emit array items in list format
                if (this.firstChunk) {
                    this.push('[\n');
                    this.firstChunk = false;
                }

                if (this.itemCount > 0) {
                    this.push(',\n');
                }

                this.push(`  ${encoded}`);
                this.itemCount++;
            } else {
                // Object mode: emit each object separately with newline
                if (!this.firstChunk) {
                    this.push('\n---\n'); // Separator between objects
                }
                this.push(encoded);
                this.firstChunk = false;
            }

            callback();
        } catch (error) {
            callback(error);
        }
    }

    _flush(callback) {
        try {
            if (this.arrayMode && !this.firstChunk) {
                this.push('\n]');
            }
            callback();
        } catch (error) {
            callback(error);
        }
    }
}

export default ToonStreamEncoder;
