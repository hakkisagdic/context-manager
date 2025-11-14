/**
 * TOON Schema Validator
 * Validates TOON documents against a schema
 *
 * Usage:
 *   const validator = new ToonValidator(schema);
 *   const result = validator.validate(data);
 *   if (!result.valid) console.error(result.errors);
 */

class ToonValidator {
    constructor(schema = {}) {
        this.schema = schema;
        this.errors = [];
    }

    /**
     * Validate data against schema
     */
    validate(data, schema = this.schema, path = '$') {
        this.errors = [];
        this._validate(data, schema, path);

        return {
            valid: this.errors.length === 0,
            errors: this.errors
        };
    }

    /**
     * Internal validation logic
     */
    _validate(data, schema, path) {
        // Type validation
        if (schema.type) {
            if (!this._validateType(data, schema.type, path)) {
                return false;
            }
        }

        // Required fields
        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (data[field] === undefined) {
                    this.errors.push({
                        path,
                        message: `Missing required field: ${field}`
                    });
                }
            }
        }

        // Properties validation (for objects)
        if (schema.properties && typeof data === 'object' && !Array.isArray(data)) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (data[key] !== undefined) {
                    this._validate(data[key], propSchema, `${path}.${key}`);
                }
            }
        }

        // Items validation (for arrays)
        if (schema.items && Array.isArray(data)) {
            data.forEach((item, index) => {
                this._validate(item, schema.items, `${path}[${index}]`);
            });
        }

        // Enum validation
        if (schema.enum) {
            if (!schema.enum.includes(data)) {
                this.errors.push({
                    path,
                    message: `Value must be one of: ${schema.enum.join(', ')}`,
                    value: data
                });
            }
        }

        // Min/Max validation for numbers
        if (typeof data === 'number') {
            if (schema.minimum !== undefined && data < schema.minimum) {
                this.errors.push({
                    path,
                    message: `Value ${data} is less than minimum ${schema.minimum}`
                });
            }
            if (schema.maximum !== undefined && data > schema.maximum) {
                this.errors.push({
                    path,
                    message: `Value ${data} is greater than maximum ${schema.maximum}`
                });
            }
        }

        // Length validation for strings and arrays
        if (typeof data === 'string' || Array.isArray(data)) {
            const length = data.length;
            if (schema.minLength !== undefined && length < schema.minLength) {
                this.errors.push({
                    path,
                    message: `Length ${length} is less than minLength ${schema.minLength}`
                });
            }
            if (schema.maxLength !== undefined && length > schema.maxLength) {
                this.errors.push({
                    path,
                    message: `Length ${length} is greater than maxLength ${schema.maxLength}`
                });
            }
        }

        // Pattern validation for strings
        if (typeof data === 'string' && schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(data)) {
                this.errors.push({
                    path,
                    message: `Value does not match pattern: ${schema.pattern}`,
                    value: data
                });
            }
        }

        // Custom validator function
        if (schema.validator && typeof schema.validator === 'function') {
            const customResult = schema.validator(data, path);
            if (customResult !== true) {
                this.errors.push({
                    path,
                    message: customResult || 'Custom validation failed',
                    value: data
                });
            }
        }

        return this.errors.length === 0;
    }

    /**
     * Validate type
     */
    _validateType(data, type, path) {
        const actualType = this._getType(data);

        // Handle array of types
        if (Array.isArray(type)) {
            if (!type.includes(actualType)) {
                this.errors.push({
                    path,
                    message: `Expected type ${type.join(' or ')}, got ${actualType}`,
                    value: data
                });
                return false;
            }
            return true;
        }

        // Single type
        if (actualType !== type) {
            this.errors.push({
                path,
                message: `Expected type ${type}, got ${actualType}`,
                value: data
            });
            return false;
        }

        return true;
    }

    /**
     * Get type of value
     */
    _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    /**
     * Validate TOON format structure
     */
    validateToonFormat(toonString) {
        const errors = [];

        // Check balanced braces
        let braceDepth = 0;
        let bracketDepth = 0;

        for (let i = 0; i < toonString.length; i++) {
            const char = toonString[i];

            if (char === '{') braceDepth++;
            if (char === '}') braceDepth--;
            if (char === '[') bracketDepth++;
            if (char === ']') bracketDepth--;

            if (braceDepth < 0) {
                errors.push({
                    position: i,
                    message: 'Unbalanced braces: extra closing brace'
                });
            }
            if (bracketDepth < 0) {
                errors.push({
                    position: i,
                    message: 'Unbalanced brackets: extra closing bracket'
                });
            }
        }

        if (braceDepth > 0) {
            errors.push({ message: `Missing ${braceDepth} closing braces` });
        }
        if (bracketDepth > 0) {
            errors.push({ message: `Missing ${bracketDepth} closing brackets` });
        }

        // Check for array length markers
        const arrayMarkers = toonString.match(/\[([#]?\d+)([,\t|])?\]/g);
        if (arrayMarkers) {
            for (const marker of arrayMarkers) {
                const lengthMatch = marker.match(/\[#?(\d+)/);
                if (lengthMatch) {
                    const declaredLength = parseInt(lengthMatch[1]);
                    if (declaredLength < 0) {
                        errors.push({
                            marker,
                            message: 'Array length cannot be negative'
                        });
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Create schema from example data
     */
    static inferSchema(data, options = {}) {
        const strict = options.strict !== false;

        function infer(value) {
            const type = typeof value;

            if (value === null) {
                return { type: 'null' };
            }

            if (Array.isArray(value)) {
                const schema = { type: 'array' };
                if (value.length > 0) {
                    // Infer from first item
                    schema.items = infer(value[0]);
                }
                if (strict) {
                    schema.minLength = value.length;
                    schema.maxLength = value.length;
                }
                return schema;
            }

            if (type === 'object') {
                const schema = {
                    type: 'object',
                    properties: {},
                    required: []
                };

                for (const [key, val] of Object.entries(value)) {
                    schema.properties[key] = infer(val);
                    if (strict) {
                        schema.required.push(key);
                    }
                }

                return schema;
            }

            if (type === 'string') {
                const schema = { type: 'string' };
                if (strict) {
                    schema.minLength = value.length;
                    schema.maxLength = value.length;
                }
                return schema;
            }

            if (type === 'number') {
                const schema = { type: 'number' };
                if (strict) {
                    schema.minimum = value;
                    schema.maximum = value;
                }
                return schema;
            }

            return { type };
        }

        return infer(data);
    }
}

export default ToonValidator;
