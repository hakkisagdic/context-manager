/**
 * CliBridge - Executes CLI commands from Desktop App
 * Uses child_process to spawn context-manager CLI
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getLogger } from '../../lib/utils/logger.js';

const logger = getLogger('CliBridge');

export class CliBridge {
    constructor() {
        this.cliPath = this.resolveCliPath();
    }

    resolveCliPath() {
        // Check for bundled CLI in resources (Production)
        const bundledPath = path.join(process.resourcesPath, 'bin', 'cli.js');
        if (fs.existsSync(bundledPath)) {
            logger.info(`Using bundled CLI at: ${bundledPath}`);
            return { command: process.execPath, args: [bundledPath] }; // Use Electron's node or system node? Electron's node works for simple scripts
            // Actually, better to use 'node' if available, or process.execPath (Electron binary) might have issues with some node modules if they are native.
            // But our CLI is pure JS mostly.
            // Safest is to assume 'node' is in path or bundle node.
            // For now, let's try 'node' with the script.
            return { command: 'node', args: [bundledPath] };
        }

        // Development / Fallback
        const devPath = path.join(process.cwd(), 'bin', 'cli.js');
        if (fs.existsSync(devPath)) {
            logger.info(`Using dev CLI at: ${devPath}`);
            return { command: 'node', args: [devPath] };
        }

        logger.info('Using global context-manager command');
        return { command: 'context-manager', args: [] };
    }

    /**
     * Execute CLI command and return JSON output
     * @param {string} command - Command name (e.g., 'analyze')
     * @param {Array} args - Command arguments
     * @returns {Promise<Object>} Command result
     */
    async execute(command, args = []) {
        return new Promise((resolve, reject) => {
            const { command: cmd, args: baseArgs } = this.cliPath;
            const finalArgs = [...baseArgs, command, '--json', ...args];

            logger.info(`Executing: ${cmd} ${finalArgs.join(' ')}`);

            const child = spawn(cmd, finalArgs, {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, FORCE_COLOR: '0' } // Ensure no color codes in JSON
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve({
                            success: true,
                            data: result,
                            exitCode: code
                        });
                    } catch (error) {
                        // Not JSON, return raw output
                        resolve({
                            success: true,
                            data: { output: stdout },
                            exitCode: code
                        });
                    }
                } else {
                    reject({
                        success: false,
                        error: stderr || stdout,
                        exitCode: code
                    });
                }
            });

            child.on('error', (error) => {
                reject({
                    success: false,
                    error: error.message,
                    exitCode: -1
                });
            });
        });
    }

    /**
     * Analyze project
     */
    async analyze(projectPath, options = {}) {
        const args = [projectPath];
        if (options.methodLevel) args.push('--method-level');
        if (options.verbose) args.push('--verbose');

        return await this.execute('analyze', args);
    }

    /**
     * Generate context
     */
    async generateContext(projectPath, options = {}) {
        const args = [projectPath];
        if (options.template) args.push('--template', options.template);
        if (options.maxTokens) args.push('--max-tokens', options.maxTokens.toString());

        return await this.execute('generate', args);
    }

    /**
     * List available formats
     */
    async listFormats() {
        return await this.execute('--list-formats', []);
    }

    /**
     * Get version
     */
    async getVersion() {
        return await this.execute('--version', []);
    }
}

export default CliBridge;
