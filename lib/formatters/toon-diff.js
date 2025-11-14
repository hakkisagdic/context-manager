/**
 * TOON Diff Utility
 * Compares two TOON documents or JavaScript objects and generates a diff
 *
 * Usage:
 *   const diff = ToonDiff.compare(obj1, obj2);
 *   const patch = ToonDiff.generatePatch(obj1, obj2);
 *   const merged = ToonDiff.merge(obj1, obj2);
 */

class ToonDiff {
    /**
     * Compare two objects and generate diff
     */
    static compare(obj1, obj2, path = '$') {
        const changes = [];

        this._compareValues(obj1, obj2, path, changes);

        return {
            hasChanges: changes.length > 0,
            changes,
            summary: this._summarizeChanges(changes)
        };
    }

    /**
     * Internal comparison logic
     */
    static _compareValues(val1, val2, path, changes) {
        const type1 = this._getType(val1);
        const type2 = this._getType(val2);

        // Type changed
        if (type1 !== type2) {
            changes.push({
                type: 'type_changed',
                path,
                from: { type: type1, value: val1 },
                to: { type: type2, value: val2 }
            });
            return;
        }

        // Null
        if (val1 === null && val2 === null) {
            return;
        }

        // Primitives
        if (type1 !== 'object' && type1 !== 'array') {
            if (val1 !== val2) {
                changes.push({
                    type: 'value_changed',
                    path,
                    from: val1,
                    to: val2
                });
            }
            return;
        }

        // Arrays
        if (type1 === 'array') {
            this._compareArrays(val1, val2, path, changes);
            return;
        }

        // Objects
        if (type1 === 'object') {
            this._compareObjects(val1, val2, path, changes);
            return;
        }
    }

    /**
     * Compare arrays
     */
    static _compareArrays(arr1, arr2, path, changes) {
        const maxLen = Math.max(arr1.length, arr2.length);

        for (let i = 0; i < maxLen; i++) {
            if (i >= arr1.length) {
                changes.push({
                    type: 'item_added',
                    path: `${path}[${i}]`,
                    value: arr2[i]
                });
            } else if (i >= arr2.length) {
                changes.push({
                    type: 'item_removed',
                    path: `${path}[${i}]`,
                    value: arr1[i]
                });
            } else {
                this._compareValues(arr1[i], arr2[i], `${path}[${i}]`, changes);
            }
        }
    }

    /**
     * Compare objects
     */
    static _compareObjects(obj1, obj2, path, changes) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        const allKeys = new Set([...keys1, ...keys2]);

        for (const key of allKeys) {
            const hasKey1 = key in obj1;
            const hasKey2 = key in obj2;

            if (hasKey1 && !hasKey2) {
                changes.push({
                    type: 'property_removed',
                    path: `${path}.${key}`,
                    value: obj1[key]
                });
            } else if (!hasKey1 && hasKey2) {
                changes.push({
                    type: 'property_added',
                    path: `${path}.${key}`,
                    value: obj2[key]
                });
            } else {
                this._compareValues(obj1[key], obj2[key], `${path}.${key}`, changes);
            }
        }
    }

    /**
     * Summarize changes
     */
    static _summarizeChanges(changes) {
        const summary = {
            total: changes.length,
            byType: {}
        };

        for (const change of changes) {
            summary.byType[change.type] = (summary.byType[change.type] || 0) + 1;
        }

        return summary;
    }

    /**
     * Generate a patch that can be applied to transform obj1 to obj2
     */
    static generatePatch(obj1, obj2) {
        const diff = this.compare(obj1, obj2);
        return {
            version: '1.0',
            changes: diff.changes,
            summary: diff.summary
        };
    }

    /**
     * Apply a patch to an object
     */
    static applyPatch(obj, patch) {
        const result = JSON.parse(JSON.stringify(obj)); // Deep clone

        for (const change of patch.changes) {
            const { type, path } = change;
            const pathParts = this._parsePath(path);

            switch (type) {
                case 'value_changed':
                    this._setPath(result, pathParts, change.to);
                    break;

                case 'property_added':
                    this._setPath(result, pathParts, change.value);
                    break;

                case 'property_removed':
                    this._deletePath(result, pathParts);
                    break;

                case 'item_added':
                    this._setPath(result, pathParts, change.value);
                    break;

                case 'item_removed':
                    this._deletePath(result, pathParts);
                    break;

                case 'type_changed':
                    this._setPath(result, pathParts, change.to.value);
                    break;
            }
        }

        return result;
    }

    /**
     * Merge two objects (obj2 overwrites obj1)
     */
    static merge(obj1, obj2, strategy = 'overwrite') {
        const type1 = this._getType(obj1);
        const type2 = this._getType(obj2);

        // Different types: use obj2
        if (type1 !== type2) {
            return JSON.parse(JSON.stringify(obj2));
        }

        // Primitives or null: use obj2
        if (type1 !== 'object' && type1 !== 'array') {
            return obj2;
        }

        // Arrays
        if (type1 === 'array') {
            if (strategy === 'concat') {
                return [...obj1, ...obj2];
            }
            return JSON.parse(JSON.stringify(obj2));
        }

        // Objects
        const result = JSON.parse(JSON.stringify(obj1));

        for (const [key, val] of Object.entries(obj2)) {
            if (key in result && typeof result[key] === 'object' && typeof val === 'object') {
                result[key] = this.merge(result[key], val, strategy);
            } else {
                result[key] = JSON.parse(JSON.stringify(val));
            }
        }

        return result;
    }

    /**
     * Get statistical diff
     */
    static getStats(obj1, obj2) {
        const diff = this.compare(obj1, obj2);

        return {
            totalChanges: diff.changes.length,
            changeTypes: diff.summary.byType,
            similarity: this._calculateSimilarity(obj1, obj2),
            paths: diff.changes.map(c => c.path)
        };
    }

    /**
     * Calculate similarity score (0-1)
     */
    static _calculateSimilarity(obj1, obj2) {
        const diff = this.compare(obj1, obj2);
        const totalProps = this._countProperties(obj1) + this._countProperties(obj2);

        if (totalProps === 0) return 1;

        const unchangedProps = totalProps - (diff.changes.length * 2);
        return Math.max(0, unchangedProps / totalProps);
    }

    /**
     * Count total properties recursively
     */
    static _countProperties(obj) {
        if (obj === null || typeof obj !== 'object') return 1;

        if (Array.isArray(obj)) {
            return obj.reduce((sum, item) => sum + this._countProperties(item), 0);
        }

        return Object.values(obj).reduce((sum, val) => sum + this._countProperties(val), Object.keys(obj).length);
    }

    /**
     * Helper: Get type
     */
    static _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    /**
     * Helper: Parse path string into parts
     */
    static _parsePath(path) {
        // Convert $.a.b[0].c to ['a', 'b', 0, 'c']
        return path
            .replace(/^\$\.?/, '')
            .replace(/\[(\d+)\]/g, '.$1')
            .split('.')
            .map(part => /^\d+$/.test(part) ? parseInt(part) : part);
    }

    /**
     * Helper: Set value at path
     */
    static _setPath(obj, pathParts, value) {
        let current = obj;

        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!(part in current)) {
                current[part] = typeof pathParts[i + 1] === 'number' ? [] : {};
            }
            current = current[part];
        }

        current[pathParts[pathParts.length - 1]] = value;
    }

    /**
     * Helper: Delete value at path
     */
    static _deletePath(obj, pathParts) {
        let current = obj;

        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!(part in current)) return;
            current = current[part];
        }

        const lastPart = pathParts[pathParts.length - 1];
        if (Array.isArray(current)) {
            current.splice(lastPart, 1);
        } else {
            delete current[lastPart];
        }
    }
}

export default ToonDiff;
