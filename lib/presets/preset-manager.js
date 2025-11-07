/**
 * PresetManager - Preset Configuration Management
 * v3.1.0 - Preset System
 *
 * Responsibilities:
 * - Load and manage preset configurations
 * - Apply presets to create temporary filter files
 * - Validate preset structure
 * - Provide preset information and listing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLogger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = getLogger('PresetManager');

/**
 * @typedef {Object} PresetFilters
 * @property {string[]} [include] - Include patterns
 * @property {string[]} [exclude] - Exclude patterns
 * @property {string[]} [methodInclude] - Method include patterns
 * @property {string[]} [methodExclude] - Method exclude patterns
 */

/**
 * @typedef {Object} PresetOptions
 * @property {boolean} [methodLevel] - Enable method-level analysis
 * @property {boolean} [gitingest] - Generate GitIngest format
 * @property {string} [sortBy] - Sort order
 * @property {number} [targetTokens] - Target token budget
 * @property {string} [fitStrategy] - Fitting strategy
 */

/**
 * @typedef {Object} PresetMetadata
 * @property {string} [header] - Custom header for output
 * @property {string[]} [tags] - Tags for categorization
 * @property {string[]} [bestFor] - Use case descriptions
 */

/**
 * @typedef {Object} Preset
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Short description
 * @property {string} [icon] - Optional emoji icon
 * @property {PresetFilters} filters - Filter patterns
 * @property {PresetOptions} options - Analysis options
 * @property {PresetMetadata} [metadata] - Additional metadata
 */

/**
 * @typedef {Object} AppliedPreset
 * @property {string} presetId - ID of applied preset
 * @property {string[]} tempFiles - Temporary files created
 * @property {PresetOptions} options - Applied options
 */

/**
 * @typedef {Object} PresetInfo
 * @property {string} id - Preset ID
 * @property {string} name - Preset name
 * @property {string} description - Preset description
 * @property {string} [icon] - Preset icon
 */

export class PresetManager {
  /**
   * Create a PresetManager instance
   * @param {string} [presetsPath] - Path to presets.json file
   */
  constructor(presetsPath = null) {
    this.presetsPath = presetsPath || path.join(__dirname, 'presets.json');
    this.presets = new Map();
    this.loaded = false;
  }

  /**
   * Load all available presets
   * @returns {Preset[]} Array of loaded presets
   */
  loadPresets() {
    if (this.loaded) {
      return Array.from(this.presets.values());
    }

    try {
      if (!fs.existsSync(this.presetsPath)) {
        logger.warn(`Presets file not found: ${this.presetsPath}`);
        return [];
      }

      const content = fs.readFileSync(this.presetsPath, 'utf-8');
      const data = JSON.parse(content);

      // Validate and load presets
      if (!data.presets || !Array.isArray(data.presets)) {
        throw new Error('Invalid presets file: missing "presets" array');
      }

      for (const preset of data.presets) {
        this.validatePreset(preset);
        this.presets.set(preset.id, preset);
      }

      this.loaded = true;
      logger.info(`Loaded ${this.presets.size} presets`);

      return Array.from(this.presets.values());
    } catch (error) {
      logger.error(`Failed to load presets: ${error.message}`);
      throw new PresetLoadError(`Failed to load presets: ${error.message}`);
    }
  }

  /**
   * Validate preset structure
   * @param {Preset} preset - Preset to validate
   * @throws {InvalidPresetError} If preset is invalid
   */
  validatePreset(preset) {
    if (!preset.id || typeof preset.id !== 'string') {
      throw new InvalidPresetError('unknown', 'Missing or invalid "id" field');
    }

    if (!preset.name || typeof preset.name !== 'string') {
      throw new InvalidPresetError(preset.id, 'Missing or invalid "name" field');
    }

    if (!preset.description || typeof preset.description !== 'string') {
      throw new InvalidPresetError(preset.id, 'Missing or invalid "description" field');
    }

    if (!preset.filters || typeof preset.filters !== 'object') {
      throw new InvalidPresetError(preset.id, 'Missing or invalid "filters" field');
    }

    if (!preset.options || typeof preset.options !== 'object') {
      throw new InvalidPresetError(preset.id, 'Missing or invalid "options" field');
    }
  }

  /**
   * Get a specific preset by name
   * @param {string} name - Preset ID or name
   * @returns {Preset|null} Preset object or null if not found
   */
  getPreset(name) {
    if (!this.loaded) {
      this.loadPresets();
    }

    // Try exact ID match first
    if (this.presets.has(name)) {
      return this.presets.get(name);
    }

    // Try case-insensitive name match
    const lowerName = name.toLowerCase();
    for (const preset of this.presets.values()) {
      if (preset.id.toLowerCase() === lowerName || 
          preset.name.toLowerCase() === lowerName) {
        return preset;
      }
    }

    return null;
  }

  /**
   * Apply a preset configuration
   * @param {string} name - Preset name
   * @param {string} projectRoot - Project root directory
   * @returns {AppliedPreset} Applied preset information
   */
  applyPreset(name, projectRoot) {
    const preset = this.getPreset(name);

    if (!preset) {
      throw new PresetNotFoundError(name);
    }

    logger.info(`Applying preset: ${preset.name}`);

    const tempFiles = [];

    try {
      // Create temporary filter files
      if (preset.filters.include && preset.filters.include.length > 0) {
        const includePath = path.join(projectRoot, `.contextinclude-${preset.id}`);
        fs.writeFileSync(includePath, preset.filters.include.join('\n'), 'utf-8');
        tempFiles.push(includePath);

        // Create active symlink/copy
        const activeIncludePath = path.join(projectRoot, '.contextinclude');
        if (fs.existsSync(activeIncludePath)) {
          fs.unlinkSync(activeIncludePath);
        }
        fs.copyFileSync(includePath, activeIncludePath);
        logger.debug(`Created .contextinclude from preset`);
      }

      if (preset.filters.exclude && preset.filters.exclude.length > 0) {
        const excludePath = path.join(projectRoot, `.contextignore-${preset.id}`);
        fs.writeFileSync(excludePath, preset.filters.exclude.join('\n'), 'utf-8');
        tempFiles.push(excludePath);

        // Create active symlink/copy
        const activeExcludePath = path.join(projectRoot, '.contextignore');
        if (fs.existsSync(activeExcludePath)) {
          fs.unlinkSync(activeExcludePath);
        }
        fs.copyFileSync(excludePath, activeExcludePath);
        logger.debug(`Created .contextignore from preset`);
      }

      if (preset.filters.methodInclude && preset.filters.methodInclude.length > 0) {
        const methodIncludePath = path.join(projectRoot, `.methodinclude-${preset.id}`);
        fs.writeFileSync(methodIncludePath, preset.filters.methodInclude.join('\n'), 'utf-8');
        tempFiles.push(methodIncludePath);

        // Create active symlink/copy
        const activeMethodIncludePath = path.join(projectRoot, '.methodinclude');
        if (fs.existsSync(activeMethodIncludePath)) {
          fs.unlinkSync(activeMethodIncludePath);
        }
        fs.copyFileSync(methodIncludePath, activeMethodIncludePath);
        logger.debug(`Created .methodinclude from preset`);
      }

      if (preset.filters.methodExclude && preset.filters.methodExclude.length > 0) {
        const methodExcludePath = path.join(projectRoot, `.methodignore-${preset.id}`);
        fs.writeFileSync(methodExcludePath, preset.filters.methodExclude.join('\n'), 'utf-8');
        tempFiles.push(methodExcludePath);

        // Create active symlink/copy
        const activeMethodExcludePath = path.join(projectRoot, '.methodignore');
        if (fs.existsSync(activeMethodExcludePath)) {
          fs.unlinkSync(activeMethodExcludePath);
        }
        fs.copyFileSync(methodExcludePath, activeMethodExcludePath);
        logger.debug(`Created .methodignore from preset`);
      }

      return {
        presetId: preset.id,
        tempFiles: tempFiles,
        options: preset.options
      };
    } catch (error) {
      // Cleanup on error
      for (const file of tempFiles) {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch (cleanupError) {
          logger.warn(`Failed to cleanup ${file}: ${cleanupError.message}`);
        }
      }

      throw new Error(`Failed to apply preset: ${error.message}`);
    }
  }

  /**
   * List all preset names and descriptions
   * @returns {PresetInfo[]} Array of preset information
   */
  listPresets() {
    if (!this.loaded) {
      this.loadPresets();
    }

    return Array.from(this.presets.values()).map(preset => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      icon: preset.icon
    }));
  }

  /**
   * Get detailed information about a preset
   * @param {string} name - Preset name
   * @returns {Preset|null} Detailed preset information or null
   */
  getPresetInfo(name) {
    return this.getPreset(name);
  }

  /**
   * Cleanup temporary files created by preset
   * @param {AppliedPreset} appliedPreset - Applied preset information
   */
  cleanup(appliedPreset) {
    if (!appliedPreset || !appliedPreset.tempFiles) {
      return;
    }

    logger.info(`Cleaning up preset files for: ${appliedPreset.presetId}`);

    for (const file of appliedPreset.tempFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          logger.debug(`Removed: ${file}`);
        }
      } catch (error) {
        logger.warn(`Failed to remove ${file}: ${error.message}`);
      }
    }
  }
}

/**
 * Custom error for preset not found
 */
export class PresetNotFoundError extends Error {
  constructor(presetName) {
    super(`Preset "${presetName}" not found`);
    this.name = 'PresetNotFoundError';
    this.presetName = presetName;
  }
}

/**
 * Custom error for invalid preset
 */
export class InvalidPresetError extends Error {
  constructor(presetName, reason) {
    super(`Invalid preset "${presetName}": ${reason}`);
    this.name = 'InvalidPresetError';
    this.presetName = presetName;
    this.reason = reason;
  }
}

/**
 * Custom error for preset loading failure
 */
export class PresetLoadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PresetLoadError';
  }
}

export default PresetManager;
