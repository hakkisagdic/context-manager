/**
 * TOON Incremental Parser
 * Parses TOON format incrementally, line by line
 * Useful for processing large TOON files without loading entire file into memory
 *
 * Usage:
 *   const parser = new ToonIncrementalParser();
 *   parser.on('object', (obj) => console.log(obj));
 *   parser.on('error', (err) => console.error(err));
 *   parser.parseLine('name: Test');
 *   parser.parseLine('count: 42');
 *   parser.end();
 */

import { EventEmitter } from 'events';
import ToonFormatterV13 from './toon-formatter-v1.3.js';

class ToonIncrementalParser extends EventEmitter {
    constructor(options = {}) {
        super();

        this.formatter = new ToonFormatterV13({
            indent: options.indent || 2,
            delimiter: options.delimiter || ',',
            lengthMarker: options.lengthMarker || false
        });

        this.buffer = [];
        this.currentObject = null;
        this.rootDepth = 0;
        this.state = 'waiting'; // waiting, collecting
    }

    /**
     * Parse a single line
     */
    parseLine(line) {
        // Add line to buffer
        this.buffer.push(line);

        // Check if we have a complete object
        const depth = this._getIndentDepth(line);
        const trimmed = line.trim();

        if (this.state === 'waiting') {
            // Start collecting if we see a key-value pair
            if (trimmed && trimmed.includes(':')) {
                this.state = 'collecting';
                this.rootDepth = depth;
            }
        } else if (this.state === 'collecting') {
            // Check if we're back at root depth or found empty line
            if ((trimmed === '' || depth <= this.rootDepth) && this.buffer.length > 1) {
                // We have a complete object, try to parse
                this._tryParse();
            }
        }
    }

    /**
     * Parse multiple lines at once
     */
    parseLines(lines) {
        for (const line of lines) {
            this.parseLine(line);
        }
    }

    /**
     * Parse a chunk of text
     */
    parseChunk(chunk) {
        const lines = chunk.split('\n');
        this.parseLines(lines);
    }

    /**
     * Signal end of input
     */
    end() {
        // Parse any remaining buffer
        if (this.buffer.length > 0) {
            this._tryParse();
        }
        this.emit('end');
    }

    /**
     * Try to parse buffered lines
     */
    _tryParse() {
        const toonString = this.buffer.join('\n').trim();

        if (!toonString) {
            this.buffer = [];
            this.state = 'waiting';
            return;
        }

        try {
            const parsed = this.formatter.decode(toonString);
            this.emit('object', parsed);
            this.buffer = [];
            this.state = 'waiting';
        } catch (error) {
            // If parsing fails, it might be incomplete
            // Keep buffer and wait for more lines
            // Only emit error if buffer is too large (likely malformed)
            if (this.buffer.length > 1000) {
                this.emit('error', new Error(`Failed to parse TOON after 1000 lines: ${error.message}`));
                this.buffer = [];
                this.state = 'waiting';
            }
        }
    }

    /**
     * Get indentation depth of a line
     */
    _getIndentDepth(line) {
        const match = line.match(/^( *)/);
        return match ? Math.floor(match[1].length / this.formatter.indent) : 0;
    }

    /**
     * Reset parser state
     */
    reset() {
        this.buffer = [];
        this.currentObject = null;
        this.state = 'waiting';
        this.removeAllListeners();
    }

    /**
     * Get current buffer size
     */
    getBufferSize() {
        return this.buffer.length;
    }

    /**
     * Get current state
     */
    getState() {
        return {
            state: this.state,
            bufferSize: this.buffer.length,
            rootDepth: this.rootDepth
        };
    }
}

export default ToonIncrementalParser;
