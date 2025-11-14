# Branch Consolidation Strategy

## Merge Order (Priority-based)

### Phase 1: Base Cleanup
```bash
1. enhance-test-coverage       # Largest cleanup (-26,574 lines)
2. laravel-backup-setup         # Secondary cleanup (-10,778 lines)
```
These two branches have massive cleanup operations and should go first.

### Phase 2: Core Component Tests
```bash
3. test-select-input            # SelectInput component (11 files)
4. test-progress-bar            # Progress bar (4 files)
5. test-cm-update              # PR #11 - Updater module (2 files)
6. test-cm-gitingest           # GitIngest tests (3 files)
```

### Phase 3: Utility & Parser Tests
```bash
7. test-config-utils            # Config/FileUtils/Token (7 files)
8. test-error-scenarios         # Error scenarios (5 files)
```

### Phase 4: Workflow Tests
```bash
9. e2e-workflow-tests           # E2E workflows (3 files)
10. dashboard-comprehensive-tests  # Dashboard (3 files)
11. wizard-comprehensive-tests     # Wizard (2 files)
```

### Phase 5: Comprehensive Coverage
```bash
12. testing-mhy1yj0ciltmejya    # 95% coverage (29 files)
13. testing-mhy1z7zos5ayhxu5    # Wizard/Dashboard comprehensive (11 files)
14. testing-mhy24bqf623j0n2p    # Security + API (18 files)
15. testing-mhy25c9tq9d5xvnz    # TokenCalculator + formatters (11 files)
16. testing-mhy29uvdrxiui2ba    # Plugin + git integration (6 files)
```

## Expected Conflicts

### High Risk Areas:
1. **package.json / package-lock.json** - Almost all branches modify these
2. **test/test-*.js files** - Many branches create/modify test files with similar names
3. **CLAUDE.md, CHANGELOG.md, README.md** - Documentation updates across branches
4. **lib/utils/*.js** - Several branches fix bugs in utilities

### Deduplication Strategy:
1. **Test Files**: Merge test cases, remove duplicate test names
2. **Bug Fixes**: Keep the most recent/comprehensive fix
3. **Documentation**: Merge all documentation updates chronologically
4. **Dependencies**: Use the highest version if compatible

## Automation Plan

1. **Automated Merge**: Use git merge for each branch sequentially
2. **Conflict Resolution**:
   - For package.json: Keep all dependencies, dedupe
   - For test files: Merge content, rename duplicates
   - For documentation: Combine all updates
3. **Validation**: Run test suite after each merge phase
4. **Cleanup**: Remove duplicate test cases and obsolete documentation

## Success Criteria

- ✅ All 16 branches merged
- ✅ No duplicate test names
- ✅ All tests passing
- ✅ All bug fixes preserved
- ✅ Documentation consolidated
- ✅ Single clean commit history on consolidation branch
