# Bug Fix: Preset Filter Path Resolution

## Issue

The preset system was creating temporary filter files in `.context-temp/` directory, but these files were never actually being used during analysis.

### Root Cause

The `ConfigUtils.findConfigFile()` method only searched in two locations:
1. Package root (`__dirname/../../filename`)
2. Project root (`projectRoot/filename`)

It did NOT search in `.context-temp/` where preset filter files were created.

### Impact

**Before Fix:**
- Presets would create filter files but they were ignored
- Analysis would fall back to default filter discovery
- Preset filters were effectively not applied
- Users would get incorrect results when using presets

**Example of broken flow:**
```javascript
// PresetManager creates temp files
createTempFilters('llm-explain', '/project')
// Creates: /project/.context-temp/.calculatorinclude
//          /project/.context-temp/.methodinclude

// But ConfigUtils looks in:
// 1. /package-root/.calculatorinclude  ❌ Not found
// 2. /project/.calculatorinclude        ❌ Not found
// 3. Never checks .context-temp/        ❌ Missing!

// Result: Preset filters ignored, default behavior used
```

---

## Solution

### Approach: Direct Path Passing

Instead of relying on file discovery, we now pass filter paths directly through the options chain.

### Changes Made

#### 1. Updated `ConfigUtils` to Accept Override Paths

**lib/utils/config-utils.js**

```javascript
// BEFORE
static initMethodFilter(projectRoot) {
    const paths = {
        methodInclude: this.findConfigFile(projectRoot, '.methodinclude'),
        methodIgnore: this.findConfigFile(projectRoot, '.methodignore')
    };
    // ...
}

// AFTER
static initMethodFilter(projectRoot, overridePaths = {}) {
    const paths = {
        methodInclude: overridePaths.methodInclude || this.findConfigFile(projectRoot, '.methodinclude'),
        methodIgnore: overridePaths.methodIgnore || this.findConfigFile(projectRoot, '.methodignore')
    };
    // ...
}
```

Same change applied to `initGitIgnore()`.

#### 2. Updated `TokenCalculator` to Use Override Paths

**lib/analyzers/token-calculator.js**

```javascript
// BEFORE
initGitIgnore() {
    return ConfigUtils.initGitIgnore(this.projectRoot);
}

initMethodFilter() {
    return ConfigUtils.initMethodFilter(this.projectRoot);
}

// AFTER
initGitIgnore() {
    // Use temp filter paths from preset if provided
    const overridePaths = this.options.tempFilters ? {
        calculatorIgnore: this.options.tempFilters.exclude,
        calculatorInclude: this.options.tempFilters.include
    } : {};

    return ConfigUtils.initGitIgnore(this.projectRoot, overridePaths);
}

initMethodFilter() {
    // Use temp filter paths from preset if provided
    const overridePaths = this.options.tempFilters ? {
        methodInclude: this.options.tempFilters.methodInclude,
        methodIgnore: this.options.tempFilters.methodExclude
    } : {};

    return ConfigUtils.initMethodFilter(this.projectRoot, overridePaths);
}
```

#### 3. PresetManager Still Creates Temp Files

**No changes needed** - `PresetManager.createTempFilters()` still creates the files and returns paths. These paths are now properly passed through `options.tempFilters`.

---

## Flow After Fix

```
1. User runs: context-manager --preset llm-explain

2. PresetManager.createTempFilters()
   ├─ Creates: .context-temp/.calculatorinclude
   ├─ Creates: .context-temp/.methodinclude
   └─ Returns: { include: "path/to/include", methodInclude: "path/to/methodinclude" }

3. Paths stored in: options.tempFilters = { include: "...", methodInclude: "..." }

4. TokenCalculator.constructor(root, options)
   ├─ this.options = { ...options }  // Contains tempFilters
   ├─ this.gitIgnore = this.initGitIgnore()
   │   └─ ConfigUtils.initGitIgnore(root, overridePaths)  ✅ Uses tempFilters.include
   └─ this.methodFilter = this.initMethodFilter()
       └─ ConfigUtils.initMethodFilter(root, overridePaths)  ✅ Uses tempFilters.methodInclude

5. Analysis runs with correct preset filters ✅
```

---

## Benefits of This Approach

### 1. **Explicit Path Passing**
- No reliance on file discovery
- Clear data flow through the system
- Easier to debug and understand

### 2. **Backward Compatible**
- Existing code without presets still works
- `overridePaths` parameter is optional (defaults to `{}`)
- Falls back to file discovery if no overrides provided

### 3. **Flexible**
- Future features can easily provide custom filter paths
- Supports programmatic usage with in-memory filters
- Not tied to specific directory structures

### 4. **Testable**
- Can test with arbitrary filter paths
- No need to create actual temp files for tests
- Easier to mock and verify

---

## Testing

### Verification

1. **Preset tests still pass:**
   ```bash
   npm run test:presets
   # ✅ 14/14 tests passed
   ```

2. **CLI commands work:**
   ```bash
   context-manager --list-presets
   # ✅ Shows all presets

   context-manager --preset llm-explain
   # ✅ Uses preset filters correctly
   ```

3. **Backward compatibility:**
   ```bash
   context-manager --method-level
   # ✅ Still uses .methodinclude/.methodignore from project root
   ```

### Manual Testing Checklist

- [x] Preset filters are applied correctly
- [x] Temp files are created in `.context-temp/`
- [x] ConfigUtils uses override paths when provided
- [x] ConfigUtils falls back to discovery when no overrides
- [x] Temp files are cleaned up after analysis
- [x] Existing filter files still work without presets
- [x] All tests pass

---

## Alternative Approaches Considered

### Alternative 1: Add `.context-temp/` to Search Path
```javascript
// REJECTED: Too implicit, fragile
static findConfigFile(projectRoot, filename) {
    const locations = [
        path.join(__dirname, '..', '..', filename),
        path.join(projectRoot, '.context-temp', filename),  // Add this
        path.join(projectRoot, filename)
    ];
    return locations.find(loc => fs.existsSync(loc));
}
```

**Why rejected:**
- Search order would matter (what if both exist?)
- Less explicit about where files come from
- Harder to debug when things go wrong
- Could cause confusion with multiple filter sources

### Alternative 2: Don't Create Temp Files
```javascript
// REJECTED: Breaks existing architecture
class PresetManager {
    applyPreset(name, options) {
        // Directly embed patterns in options
        options.includePatterns = preset.filters.include;
        options.excludePatterns = preset.filters.exclude;
    }
}
```

**Why rejected:**
- Would require major changes to GitIgnoreParser
- GitIgnoreParser expects file paths, not pattern arrays
- More refactoring needed
- Current approach reuses existing infrastructure

### Alternative 3: Use Chosen Approach ✅
**Direct path passing through options**
- Minimal changes required
- Backward compatible
- Clear and explicit
- Reuses existing infrastructure

---

## Future Improvements

### 1. Remove Temp File Creation (Optional)
If we want to optimize further, we could:
- Keep patterns in memory
- Modify GitIgnoreParser to accept pattern arrays
- Skip file I/O entirely

```javascript
class GitIgnoreParser {
    constructor(gitignorePath, calculatorIgnorePath, calculatorIncludePath, patterns = null) {
        if (patterns) {
            // Use in-memory patterns
            this.patterns = patterns;
        } else {
            // Read from files (current behavior)
            this.patterns = this.loadPatterns(calculatorIgnorePath, calculatorIncludePath);
        }
    }
}
```

### 2. Validate Override Paths
Add validation to ensure override paths exist:

```javascript
static initGitIgnore(projectRoot, overridePaths = {}) {
    // Validate override paths exist
    if (overridePaths.calculatorInclude && !fs.existsSync(overridePaths.calculatorInclude)) {
        throw new Error(`Override path not found: ${overridePaths.calculatorInclude}`);
    }
    // ...
}
```

### 3. Support In-Memory Presets
For programmatic usage without temp files:

```javascript
const preset = presetManager.getPreset('llm-explain');
const calculator = new TokenCalculator('./src', {
    methodLevel: true,
    filterPatterns: {
        include: preset.filters.include,  // Array of patterns
        exclude: preset.filters.exclude
    }
});
```

---

## Summary

**Bug:** Preset filter files created but never used due to incorrect file discovery.

**Fix:** Pass filter paths directly through `options.tempFilters` to `ConfigUtils` instead of relying on file discovery.

**Impact:** Presets now work correctly. All tests pass. Fully backward compatible.

**Files Changed:**
- `lib/utils/config-utils.js` - Added `overridePaths` parameter
- `lib/analyzers/token-calculator.js` - Use override paths from options

**Lines Changed:** ~20 lines
**Breaking Changes:** None
**Test Status:** ✅ All tests passing

---

*Bug reported and fixed: 2025-10-31*
