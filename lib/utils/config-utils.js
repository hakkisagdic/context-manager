/**
 * Configuration File Utilities
 * Handles discovery and initialization of configuration files
 */

const fs = require('fs');
const path = require('path');

class ConfigUtils {
    /**
     * Find configuration file in standard locations
     * @param {string} projectRoot - Project root directory
     * @param {string} filename - Config filename
     * @returns {string|undefined} Config file path or undefined
     */
    static findConfigFile(projectRoot, filename) {
        const locations = [
            path.join(__dirname, '..', '..', filename),  // Package root
            path.join(projectRoot, filename)              // Project root
        ];
        return locations.find(loc => fs.existsSync(loc));
    }

    /**
     * Initialize method filter parser
     * @param {string} projectRoot - Project root directory
     * @param {object} overridePaths - Optional override paths for filter files
     * @returns {object|null} MethodFilterParser instance or null
     */
    static initMethodFilter(projectRoot, overridePaths = {}) {
        const MethodFilterParser = require('../parsers/method-filter-parser');

        const paths = {
            methodInclude: overridePaths.methodInclude || this.findConfigFile(projectRoot, '.methodinclude'),
            methodIgnore: overridePaths.methodIgnore || this.findConfigFile(projectRoot, '.methodignore')
        };

        if (!paths.methodInclude && !paths.methodIgnore) {
            return null;
        }

        return new MethodFilterParser(paths.methodInclude, paths.methodIgnore);
    }

    /**
     * Detect if method filtering is enabled
     * @param {string} projectRoot - Project root directory
     * @returns {boolean}
     */
    static detectMethodFilters(projectRoot) {
        const methodIncludePath = this.findConfigFile(projectRoot, '.methodinclude');
        const methodIgnorePath = this.findConfigFile(projectRoot, '.methodignore');
        return !!(methodIncludePath || methodIgnorePath);
    }

    /**
     * Initialize git ignore parser
     * @param {string} projectRoot - Project root directory
     * @param {object} overridePaths - Optional override paths for filter files
     * @returns {object} GitIgnoreParser instance
     */
    static initGitIgnore(projectRoot, overridePaths = {}) {
        const GitIgnoreParser = require('../parsers/gitignore-parser');

        const paths = {
            calculatorIgnore: overridePaths.calculatorIgnore || this.findConfigFile(projectRoot, '.calculatorignore'),
            calculatorInclude: overridePaths.calculatorInclude || this.findConfigFile(projectRoot, '.calculatorinclude')
        };

        return new GitIgnoreParser(
            path.join(projectRoot, '.gitignore'),
            paths.calculatorIgnore,
            paths.calculatorInclude
        );
    }

    /**
     * Get all config file paths
     * @param {string} projectRoot - Project root directory
     * @returns {object} Config paths
     */
    static getConfigPaths(projectRoot) {
        return {
            gitignore: path.join(projectRoot, '.gitignore'),
            calculatorIgnore: this.findConfigFile(projectRoot, '.calculatorignore'),
            calculatorInclude: this.findConfigFile(projectRoot, '.calculatorinclude'),
            methodInclude: this.findConfigFile(projectRoot, '.methodinclude'),
            methodIgnore: this.findConfigFile(projectRoot, '.methodignore')
        };
    }
}

module.exports = ConfigUtils;
