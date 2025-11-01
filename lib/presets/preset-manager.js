/**
 * Preset Manager
 * Manages analysis presets for different use cases
 */

const fs = require('fs');
const path = require('path');

class PresetManager {
    constructor() {
        this.presets = this.loadPresets();
    }

    /**
     * Load presets from JSON file
     */
    loadPresets() {
        try {
            const presetsPath = path.join(__dirname, 'presets.json');
            const presetsContent = fs.readFileSync(presetsPath, 'utf8');
            return JSON.parse(presetsContent);
        } catch (error) {
            console.error(`❌ Error loading presets: ${error.message}`);
            return this.getDefaultPresets();
        }
    }

    /**
     * Get fallback default presets if file loading fails
     */
    getDefaultPresets() {
        return {
            default: {
                name: "Default Analysis",
                description: "Standard codebase analysis",
                filters: { exclude: [], include: [] },
                options: { methodLevel: false, gitingest: false },
                maxTokens: null
            }
        };
    }

    /**
     * Get a preset by name
     * @param {string} name - Preset name
     * @returns {Object|null} Preset configuration or null if not found
     */
    getPreset(name) {
        const preset = this.presets[name];
        if (!preset) {
            return null;
        }
        return { ...preset };
    }

    /**
     * Check if a preset exists
     * @param {string} name - Preset name
     * @returns {boolean}
     */
    hasPreset(name) {
        return name in this.presets;
    }

    /**
     * List all available presets
     * @returns {Array} Array of preset names with descriptions
     */
    listPresets() {
        return Object.entries(this.presets).map(([key, preset]) => ({
            name: key,
            title: preset.name,
            description: preset.description
        }));
    }

    /**
     * Apply preset to options
     * Merges preset configuration with user-provided options
     * @param {string} presetName - Name of the preset to apply
     * @param {Object} userOptions - User-provided options to merge
     * @returns {Object} Merged configuration
     */
    applyPreset(presetName, userOptions = {}) {
        const preset = this.getPreset(presetName);

        if (!preset) {
            throw new Error(`Preset '${presetName}' not found. Available presets: ${Object.keys(this.presets).join(', ')}`);
        }

        // Merge options: user options override preset options
        const mergedOptions = {
            ...preset.options,
            ...userOptions,
            preset: presetName,
            presetConfig: preset
        };

        // Add filter configurations
        if (preset.filters) {
            mergedOptions.presetFilters = preset.filters;
        }

        // Add method filter configurations
        if (preset.methodFilters) {
            mergedOptions.presetMethodFilters = preset.methodFilters;
        }

        // Add token limit
        if (preset.maxTokens) {
            mergedOptions.maxTokens = preset.maxTokens;
        }

        // Add header for digest
        if (preset.header) {
            mergedOptions.digestHeader = preset.header;
        }

        return mergedOptions;
    }

    /**
     * Create temporary filter files for preset
     * This allows presets to work with existing filter system
     * @param {string} presetName - Name of the preset
     * @param {string} projectRoot - Project root directory
     * @returns {Object} Paths to created temp files
     */
    createTempFilters(presetName, projectRoot) {
        const preset = this.getPreset(presetName);
        if (!preset || !preset.filters) {
            return { include: null, exclude: null };
        }

        const tempDir = path.join(projectRoot, '.context-temp');

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const paths = {
            include: null,
            exclude: null,
            methodInclude: null,
            methodExclude: null
        };

        // Create .calculatorinclude if preset has include filters
        if (preset.filters.include && preset.filters.include.length > 0) {
            const includePath = path.join(tempDir, '.calculatorinclude');
            fs.writeFileSync(includePath, preset.filters.include.join('\n'));
            paths.include = includePath;
        }

        // Create .calculatorignore if preset has exclude filters
        if (preset.filters.exclude && preset.filters.exclude.length > 0) {
            const excludePath = path.join(tempDir, '.calculatorignore');
            fs.writeFileSync(excludePath, preset.filters.exclude.join('\n'));
            paths.exclude = excludePath;
        }

        // Create method filters if preset has them
        if (preset.methodFilters) {
            if (preset.methodFilters.include && preset.methodFilters.include.length > 0) {
                const methodIncludePath = path.join(tempDir, '.methodinclude');
                fs.writeFileSync(methodIncludePath, preset.methodFilters.include.join('\n'));
                paths.methodInclude = methodIncludePath;
            }

            if (preset.methodFilters.exclude && preset.methodFilters.exclude.length > 0) {
                const methodExcludePath = path.join(tempDir, '.methodignore');
                fs.writeFileSync(methodExcludePath, preset.methodFilters.exclude.join('\n'));
                paths.methodExclude = methodExcludePath;
            }
        }

        return paths;
    }

    /**
     * Clean up temporary filter files
     * @param {string} projectRoot - Project root directory
     */
    cleanupTempFilters(projectRoot) {
        const tempDir = path.join(projectRoot, '.context-temp');

        if (fs.existsSync(tempDir)) {
            try {
                // Remove all files in temp directory
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(tempDir, file));
                }
                // Remove directory
                if (fs.rmSync) {
                    fs.rmSync(tempDir, { recursive: true });
                } else {
                    fs.rmdirSync(tempDir);
}
            } catch (error) {
                // Silently fail - temp files will be cleaned up next run
            }
        }
    }

    /**
     * Print preset information
     * @param {string} presetName - Name of the preset
     */
    printPresetInfo(presetName) {
        const preset = this.getPreset(presetName);

        if (!preset) {
            console.error(`❌ Preset '${presetName}' not found`);
            return;
        }

        console.log(`\n📋 Using Preset: ${preset.name}`);
        console.log(`📝 ${preset.description}`);

        if (preset.maxTokens) {
            console.log(`🎯 Target: ${(preset.maxTokens / 1000).toFixed(0)}k tokens max`);
        }

        if (preset.filters) {
            if (preset.filters.include && preset.filters.include.length > 0) {
                console.log(`✅ Include patterns: ${preset.filters.include.length}`);
            }
            if (preset.filters.exclude && preset.filters.exclude.length > 0) {
                console.log(`🚫 Exclude patterns: ${preset.filters.exclude.length}`);
            }
        }

        console.log('');
    }

    /**
     * Print all available presets
     */
    printAvailablePresets() {
        console.log('\n📋 Available Presets:\n');

        const presets = this.listPresets();
        const maxNameLength = Math.max(...presets.map(p => p.name.length));

        for (const preset of presets) {
            const padding = ' '.repeat(maxNameLength - preset.name.length + 2);
            console.log(`  ${preset.name}${padding}${preset.description}`);
        }

        console.log('\nUsage: context-manager --preset <name>');
        console.log('Example: context-manager --preset review\n');
    }

    /**
     * Validate preset configuration
     * @param {string} presetName - Name of the preset
     * @returns {Object} Validation result with { valid, errors }
     */
    validatePreset(presetName) {
        const preset = this.getPreset(presetName);
        const errors = [];

        if (!preset) {
            return { valid: false, errors: [`Preset '${presetName}' not found`] };
        }

        // Check required fields
        if (!preset.name) errors.push('Missing preset name');
        if (!preset.description) errors.push('Missing preset description');
        if (!preset.options) errors.push('Missing preset options');

        // Validate filters structure
        if (preset.filters) {
            if (!Array.isArray(preset.filters.include)) {
                errors.push('filters.include must be an array');
            }
            if (!Array.isArray(preset.filters.exclude)) {
                errors.push('filters.exclude must be an array');
            }
        }

        // Validate method filters structure
        if (preset.methodFilters) {
            if (preset.methodFilters.include && !Array.isArray(preset.methodFilters.include)) {
                errors.push('methodFilters.include must be an array');
            }
            if (preset.methodFilters.exclude && !Array.isArray(preset.methodFilters.exclude)) {
                errors.push('methodFilters.exclude must be an array');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = PresetManager;
