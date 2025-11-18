/**
 * File Generators for Property-Based Testing
 * Provides utilities to generate random file structures and content
 */

import fc from 'fast-check';
import path from 'path';

/**
 * Generate a random file extension
 */
export const fileExtensionArb = () => fc.oneof(
    fc.constant('.js'),
    fc.constant('.ts'),
    fc.constant('.py'),
    fc.constant('.java'),
    fc.constant('.go'),
    fc.constant('.rs'),
    fc.constant('.cs'),
    fc.constant('.rb'),
    fc.constant('.php'),
    fc.constant('.kt'),
    fc.constant('.swift'),
    fc.constant('.cpp'),
    fc.constant('.scala'),
    fc.constant('.sql'),
    fc.constant('.html'),
    fc.constant('.md'),
    fc.constant('.xml')
);

/**
 * Generate a random file name
 */
export const fileNameArb = () => fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 20 }),
    fileExtensionArb()
).map(([name, ext]) => name + ext);

/**
 * Generate a random file path
 */
export const filePathArb = () => fc.array(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 15 }),
    { minLength: 0, maxLength: 5 }
).chain(dirs => fileNameArb().map(name => {
    if (dirs.length === 0) return name;
    return path.join(...dirs, name);
}));

/**
 * Generate random file content
 */
export const fileContentArb = (options = {}) => {
    const { minLines = 1, maxLines = 100 } = options;
    return fc.array(
        fc.string({ minLength: 0, maxLength: 120 }),
        { minLength, maxLength }
    ).map(lines => lines.join('\n'));
};

/**
 * Generate a random file object
 */
export const fileObjectArb = (options = {}) => {
    return fc.record({
        path: filePathArb(),
        content: fileContentArb(options),
        tokens: fc.integer({ min: 0, max: 10000 })
    });
};

/**
 * Generate a set of random files
 */
export const fileSetArb = (options = {}) => {
    const { minFiles = 1, maxFiles = 50 } = options;
    return fc.array(fileObjectArb(options), { minLength: minFiles, maxLength: maxFiles });
};

/**
 * Generate a random directory tree structure
 */
export const directoryTreeArb = (depth = 3) => {
    if (depth === 0) {
        return fc.array(fileNameArb(), { minLength: 0, maxLength: 10 });
    }
    
    return fc.record({
        files: fc.array(fileNameArb(), { minLength: 0, maxLength: 5 }),
        subdirs: fc.dictionary(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 15 }),
            fc.oneof(
                fc.constant(null),
                fc.constant(null),
                fc.constant(null),
                fc.lazy(() => directoryTreeArb(depth - 1))
            ),
            { minKeys: 0, maxKeys: 3 }
        )
    });
};

/**
 * Generate random gitignore patterns
 */
export const gitignorePatternArb = () => fc.oneof(
    // Simple patterns
    fc.tuple(fc.constant('*.'), fileExtensionArb()).map(([prefix, ext]) => prefix + ext.slice(1)),
    // Directory patterns
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 15 }).map(s => s + '/'),
    // Negation patterns
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 15 }).map(s => '!' + s),
    // Wildcard patterns
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_*?'.split('')), { minLength: 3, maxLength: 20 })
);

/**
 * Generate a set of gitignore patterns
 */
export const gitignorePatternsArb = () => fc.array(
    gitignorePatternArb(),
    { minLength: 0, maxLength: 20 }
);

/**
 * Helper: Generate a random file with specific extension
 */
export function generateRandomFile(options = {}) {
    const { extension = '.js', minLines = 10, maxLines = 100 } = options;
    
    return fc.sample(fc.record({
        path: fc.tuple(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 20 }),
            fc.constant(extension)
        ).map(([name, ext]) => name + ext),
        content: fileContentArb({ minLines, maxLines }),
        tokens: fc.integer({ min: minLines * 2, max: maxLines * 10 })
    }), 1)[0];
}

/**
 * Helper: Generate a set of random files
 */
export function generateFileSet(options = {}) {
    const { count = 10, types = ['.js', '.ts', '.py'] } = options;
    
    return fc.sample(
        fc.array(
            fc.record({
                path: fc.tuple(
                    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz-_'.split('')), { minLength: 3, maxLength: 20 }),
                    fc.constantFrom(...types)
                ).map(([name, ext]) => name + ext),
                content: fileContentArb(),
                tokens: fc.integer({ min: 10, max: 5000 })
            }),
            { minLength: count, maxLength: count }
        ),
        1
    )[0];
}
