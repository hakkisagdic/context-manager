# Design Document

## Overview

Bu doküman, Context Manager projesinin kapsamlı test validasyon sisteminin tasarımını tanımlar. Sistem, mevcut test suite'ini analiz edecek, eksik test coverage'ı belirleyecek ve yeni testler için öneriler sunacaktır. Tasarım, hem unit testing hem de property-based testing yaklaşımlarını içerir.

### Goals

1. **Mevcut Test Coverage Analizi**: Tüm modüllerin test coverage'ını değerlendirmek
2. **Eksik Test Tespiti**: Test edilmeyen veya yetersiz test edilen özellikleri belirlemek
3. **Test Kalitesi Değerlendirmesi**: Mevcut testlerin kalitesini ve etkinliğini analiz etmek
4. **Property-Based Test Stratejisi**: Evrensel özellikleri test etmek için PBT yaklaşımı
5. **Tek Doküman Çözümü**: Tüm test bilgilerini tek bir markdown dosyasında toplamak

### Scope

- 18+ programlama dili desteği
- Method-level analysis özellikleri
- TOON ve GitIngest format işlemleri
- Git integration özellikleri
- REST API endpoints
- Plugin system
- UI components (Wizard, Dashboard, SelectInput)
- Watch mode ve incremental analysis
- Token budget fitting ve preset system
- Cross-platform compatibility

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Test Validation System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Coverage   │  │    Test      │  │  Property    │      │
│  │   Analyzer   │  │  Quality     │  │   Based      │      │
│  │              │  │  Evaluator   │  │   Testing    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                      │
│                  │   Test Report     │                      │
│                  │   Generator       │                      │
│                  └───────────────────┘                      │
│                            │                                 │
│                  ┌─────────▼─────────┐                      │
│                  │  Markdown Output  │                      │
│                  │  (Single File)    │                      │
│                  └───────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

1. **Coverage Analyzer**: Mevcut testleri tarar ve coverage metriklerini hesaplar
2. **Test Quality Evaluator**: Test kalitesini değerlendirir (assertions, edge cases, etc.)
3. **Property-Based Testing Module**: PBT stratejileri ve property tanımları oluşturur
4. **Test Report Generator**: Tüm bilgileri birleştirip tek bir rapor oluşturur
5. **Markdown Output**: Kullanıcı dostu, okunabilir format

## Components and Interfaces

### 1. Coverage Analyzer

**Responsibility**: Kod coverage'ını analiz etmek ve eksik alanları tespit etmek

**Interface**:
```javascript
class CoverageAnalyzer {
    constructor(projectRoot, testDirectory)
    
    // Tüm modülleri tarar ve coverage hesaplar
    analyzeCoverage(): CoverageReport
    
    // Belirli bir modül için coverage hesaplar
    analyzeModule(modulePath): ModuleCoverage
    
    // Test edilmeyen fonksiyonları bulur
    findUntestedFunctions(): Array<FunctionInfo>
    
    // Coverage yüzdesini hesaplar
    calculateCoveragePercentage(): number
}
```

**Data Structures**:
```javascript
CoverageReport {
    totalModules: number,
    testedModules: number,
    coveragePercentage: number,
    moduleDetails: Array<ModuleCoverage>,
    untestedFunctions: Array<FunctionInfo>
}

ModuleCoverage {
    modulePath: string,
    totalFunctions: number,
    testedFunctions: number,
    coveragePercentage: number,
    untestedFunctions: Array<string>
}
```

### 2. Test Quality Evaluator

**Responsibility**: Mevcut testlerin kalitesini değerlendirmek

**Interface**:
```javascript
class TestQualityEvaluator {
    constructor(testDirectory)
    
    // Test dosyasını analiz eder
    evaluateTestFile(testFilePath): TestQualityReport
    
    // Assertion sayısını kontrol eder
    checkAssertionCoverage(testContent): number
    
    // Edge case testlerini kontrol eder
    checkEdgeCaseCoverage(testContent): Array<string>
    
    // Test organizasyonunu değerlendirir
    evaluateTestOrganization(testContent): OrganizationScore
}
```

**Data Structures**:
```javascript
TestQualityReport {
    testFile: string,
    totalTests: number,
    assertionCount: number,
    edgeCasesCovered: Array<string>,
    organizationScore: number,
    recommendations: Array<string>
}
```

### 3. Property-Based Testing Module

**Responsibility**: PBT stratejileri oluşturmak ve property tanımları yapmak

**Interface**:
```javascript
class PropertyBasedTestingModule {
    constructor(requirements)
    
    // Requirement'tan property'leri çıkarır
    extractProperties(requirement): Array<Property>
    
    // Property için test stratejisi oluşturur
    generateTestStrategy(property): TestStrategy
    
    // Generator önerileri oluşturur
    suggestGenerators(property): Array<GeneratorSuggestion>
}
```

**Data Structures**:
```javascript
Property {
    id: string,
    description: string,
    requirementId: string,
    universalQuantifier: string,
    invariant: string,
    testable: boolean
}

TestStrategy {
    propertyId: string,
    approach: string, // 'round-trip', 'invariant', 'metamorphic', etc.
    generators: Array<GeneratorSuggestion>,
    iterations: number
}
```

### 4. Test Report Generator

**Responsibility**: Tüm analiz sonuçlarını birleştirip markdown raporu oluşturmak

**Interface**:
```javascript
class TestReportGenerator {
    constructor(coverageReport, qualityReports, properties)
    
    // Markdown raporu oluşturur
    generateMarkdownReport(): string
    
    // Coverage bölümünü oluşturur
    generateCoverageSection(): string
    
    // Test kalitesi bölümünü oluşturur
    generateQualitySection(): string
    
    // Property-based test bölümünü oluşturur
    generatePropertySection(): string
    
    // Öneriler bölümünü oluşturur
    generateRecommendationsSection(): string
}
```

## Data Models

### Module Structure

```javascript
Module {
    path: string,
    name: string,
    type: 'analyzer' | 'formatter' | 'parser' | 'util' | 'core' | 'plugin' | 'ui',
    exports: Array<string>,
    functions: Array<FunctionDefinition>,
    dependencies: Array<string>
}

FunctionDefinition {
    name: string,
    line: number,
    parameters: Array<Parameter>,
    returnType: string,
    isAsync: boolean,
    isExported: boolean
}
```

### Test Structure

```javascript
TestFile {
    path: string,
    moduleTested: string,
    testCases: Array<TestCase>,
    coverage: TestCoverage
}

TestCase {
    name: string,
    line: number,
    type: 'unit' | 'integration' | 'property',
    assertions: number,
    edgeCases: Array<string>,
    functionsTested: Array<string>
}

TestCoverage {
    lines: number,
    functions: number,
    branches: number,
    statements: number
}
```

### Property Definition

```javascript
PropertyDefinition {
    id: string,
    name: string,
    description: string,
    category: 'round-trip' | 'invariant' | 'idempotence' | 'metamorphic' | 'error-condition',
    requirementIds: Array<string>,
    universalQuantifier: string,
    preconditions: Array<string>,
    postconditions: Array<string>,
    testStrategy: TestStrategy,
    implemented: boolean,
    testFile: string | null
}
```

## Testing Strategy

### Dual Testing Approach

Bu proje için hem **unit testing** hem de **property-based testing** kullanılacaktır:

#### Unit Testing
- Belirli örnekleri test eder
- Edge case'leri kapsar
- Integration point'leri doğrular
- Hızlı feedback sağlar
- Regression'ları yakalar

#### Property-Based Testing
- Evrensel özellikleri test eder
- Rastgele girdilerle çalışır
- Beklenmeyen edge case'leri bulur
- Daha geniş input space'i kapsar
- Specification'ı formalize eder

**Property-Based Testing Library**: `fast-check` (JavaScript için en popüler PBT kütüphanesi)

**Minimum Iterations**: Her property-based test en az 100 iterasyon çalıştırılacak

**Test Tagging Format**: 
```javascript
// Feature: comprehensive-test-validation, Property 1: Token calculation consistency
test('Token calculation should be consistent for same input', () => {
    fc.assert(
        fc.property(fc.string(), (content) => {
            const tokens1 = calculateTokens(content);
            const tokens2 = calculateTokens(content);
            return tokens1 === tokens2;
        }),
        { numRuns: 100 }
    );
});
```

### Test Organization

```
test/
├── unit/                          # Unit tests
│   ├── analyzers/
│   ├── formatters/
│   ├── parsers/
│   └── utils/
├── integration/                   # Integration tests
│   ├── api/
│   ├── git/
│   └── watch/
├── property/                      # Property-based tests
│   ├── token-calculation.property.js
│   ├── method-extraction.property.js
│   ├── file-filtering.property.js
│   └── format-conversion.property.js
└── fixtures/                      # Test fixtures
    ├── sample-files/
    └── expected-outputs/
```

## Error Handling

### Error Categories

1. **File System Errors**: Dosya okuma/yazma hataları
2. **Parse Errors**: Kod parsing hataları
3. **Validation Errors**: Test validasyon hataları
4. **Coverage Calculation Errors**: Coverage hesaplama hataları

### Error Handling Strategy

```javascript
class TestValidationError extends Error {
    constructor(message, category, details) {
        super(message);
        this.name = 'TestValidationError';
        this.category = category;
        this.details = details;
    }
}

// Usage
try {
    const coverage = analyzer.analyzeCoverage();
} catch (error) {
    if (error instanceof TestValidationError) {
        logger.error(`Test validation failed: ${error.message}`);
        logger.debug(`Category: ${error.category}`);
        logger.debug(`Details: ${JSON.stringify(error.details)}`);
    }
    throw error;
}
```

### Graceful Degradation

- Bir modülün analizi başarısız olursa, diğer modüller analiz edilmeye devam edilir
- Coverage hesaplanamayan modüller "unknown" olarak işaretlenir
- Eksik test dosyaları için uyarı verilir ama process durdurul maz
- Rapor her durumda oluşturulur, eksik bilgiler belirtilir


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Token Calculation Properties

**Property 1: Token calculation consistency**
*For any* file content, calculating tokens multiple times should always return the same result
**Validates: Requirements 1.1**

**Property 2: Token estimation accuracy**
*For any* file content, when tiktoken is unavailable, the estimation should be within 5% of the actual value
**Validates: Requirements 1.2**

**Property 3: Token summation correctness**
*For any* set of files, the total token count should equal the sum of individual file token counts
**Validates: Requirements 1.3**

**Property 4: File type grouping correctness**
*For any* set of files, grouping by extension should preserve all files and their token counts
**Validates: Requirements 1.4**

**Property 5: Largest files sorting correctness**
*For any* set of files, the largest files list should be sorted in descending order by token count
**Validates: Requirements 1.5**

### Method Extraction Properties

**Property 6: JavaScript method extraction completeness**
*For any* valid JavaScript/TypeScript file, all function declarations, arrow functions, and class methods should be extracted
**Validates: Requirements 2.1**

**Property 7: Rust function extraction completeness**
*For any* valid Rust file, all fn definitions (including pub, async, and impl methods) should be extracted
**Validates: Requirements 2.2**

**Property 8: C# method extraction completeness**
*For any* valid C# file, all method definitions (including properties and async methods) should be extracted
**Validates: Requirements 2.3**

**Property 9: Go function extraction completeness**
*For any* valid Go file, all func definitions (including receiver methods) should be extracted
**Validates: Requirements 2.4**

**Property 10: Java method extraction completeness**
*For any* valid Java file, all method definitions (including constructors and static methods) should be extracted
**Validates: Requirements 2.5**

**Property 11: SQL procedure extraction completeness**
*For any* valid SQL file, all stored procedures and functions should be extracted
**Validates: Requirements 2.6**

**Property 12: Method filtering correctness**
*For any* method list and filter rules, the filtered result should include only methods matching .methodinclude and exclude those matching .methodignore
**Validates: Requirements 2.7**

### File Filtering Properties

**Property 13: Gitignore compliance**
*For any* file list and .gitignore rules, filtered files should respect gitignore patterns in both INCLUDE and EXCLUDE modes
**Validates: Requirements 3.3**

**Property 14: Wildcard pattern matching**
*For any* wildcard pattern and file list, matching should correctly identify files according to glob rules
**Validates: Requirements 3.4**

**Property 15: Negation pattern correctness**
*For any* negation pattern (!pattern), files matching the pattern should be included even if a broader exclusion exists
**Validates: Requirements 3.5**

**Property 16: Recursive directory matching**
*For any* nested directory pattern (**), matching should recursively include all subdirectories
**Validates: Requirements 3.6**

### TOON Format Properties

**Property 17: TOON format validity**
*For any* context object, encoding to TOON format should produce a valid TOON structure
**Validates: Requirements 4.1**

**Property 18: TOON round-trip preservation**
*For any* context object, encoding then decoding should preserve the original structure
**Validates: Requirements 4.2**

**Property 19: TOON compression ratio**
*For any* context object, TOON encoding should reduce token count by at least 40%
**Validates: Requirements 4.3**

**Property 20: TOON validation error detection**
*For any* invalid TOON file, the validator should detect and report format errors
**Validates: Requirements 4.4**

**Property 21: TOON streaming correctness**
*For any* large file, streaming encoding should produce the same result as non-streaming encoding
**Validates: Requirements 4.5**

**Property 22: TOON diff correctness**
*For any* two TOON versions, the diff should correctly identify all changes between them
**Validates: Requirements 4.6**

### GitIngest Format Properties

**Property 23: GitIngest content completeness**
*For any* project, the digest file should contain project summary, directory tree, and all file contents
**Validates: Requirements 5.2, 5.3, 5.4**

**Property 24: GitIngest from-report efficiency**
*For any* existing JSON report, generating digest from report should be faster than re-scanning
**Validates: Requirements 5.5**

### Preset System Properties

**Property 25: Preset configuration application**
*For any* valid preset, loading it should apply all defined configuration settings
**Validates: Requirements 6.2, 6.5**

### Token Budget Fitting Properties

**Property 26: Budget limit enforcement**
*For any* token budget and file set, the selected files should not exceed the specified token limit
**Validates: Requirements 7.1**

**Property 27: Auto strategy selection**
*For any* file set and budget, auto strategy should select the strategy that maximizes file coverage within budget
**Validates: Requirements 7.2**

**Property 28: Shrink-docs strategy correctness**
*For any* file set, shrink-docs strategy should remove documentation files before code files
**Validates: Requirements 7.3**

**Property 29: Balanced strategy optimization**
*For any* file set, balanced strategy should optimize the token-to-file efficiency ratio
**Validates: Requirements 7.4**

**Property 30: Methods-only strategy correctness**
*For any* file set, methods-only strategy should extract only method definitions
**Validates: Requirements 7.5**

**Property 31: Top-n strategy prioritization**
*For any* file set, top-n strategy should select files by importance score
**Validates: Requirements 7.6**

**Property 32: Entry point preservation**
*For any* file set with entry points, budget fitting should prioritize keeping entry points
**Validates: Requirements 7.7**

### Git Integration Properties

**Property 33: Changed files detection**
*For any* git repository, changed-only should detect all uncommitted changes
**Validates: Requirements 8.1**

**Property 34: Changed-since correctness**
*For any* commit/branch reference, changed-since should find all files modified after that point
**Validates: Requirements 8.2**

**Property 35: Author information inclusion**
*For any* file with git history, with-authors should include correct author information
**Validates: Requirements 8.3**

**Property 36: Diff calculation correctness**
*For any* two file versions, diff analyzer should correctly calculate additions and deletions
**Validates: Requirements 8.4**

**Property 37: Blame tracking correctness**
*For any* file line, blame tracker should identify the correct author
**Validates: Requirements 8.5**

### Watch Mode Properties

**Property 38: File change detection**
*For any* file modification, watch mode should trigger automatic analysis
**Validates: Requirements 9.2**

**Property 39: Debounce timing correctness**
*For any* debounce setting, the system should wait the specified duration before analyzing
**Validates: Requirements 9.3**

**Property 40: Incremental analysis efficiency**
*For any* file change, incremental analyzer should only re-analyze changed files
**Validates: Requirements 9.4**

### Plugin System Properties

**Property 41: Plugin registration correctness**
*For any* valid plugin, registration should make it available for use
**Validates: Requirements 11.1, 11.2**

**Property 42: Plugin execution correctness**
*For any* registered plugin, execution should call the plugin's execute method
**Validates: Requirements 11.4**

### UI Component Properties

**Property 43: Select input handling**
*For any* user selection, select input should correctly capture and return the choice
**Validates: Requirements 12.3**

**Property 44: Progress tracking accuracy**
*For any* progress value, progress bar should accurately reflect the completion percentage
**Validates: Requirements 12.4**

### LLM Detection Properties

**Property 45: LLM model detection**
*For any* valid LLM environment variable, the system should correctly identify the model
**Validates: Requirements 13.1**

**Property 46: Model-specific optimization**
*For any* target model, the system should apply appropriate token limits and optimizations
**Validates: Requirements 13.2**

**Property 47: Context window calculation**
*For any* LLM model, context window analysis should use the correct token limit
**Validates: Requirements 13.3**

**Property 48: Custom profile application**
*For any* custom LLM profile, loading should apply all custom settings
**Validates: Requirements 13.5**

### Export and Clipboard Properties

**Property 49: Clipboard copy correctness**
*For any* context data, clipboard copy should preserve all content
**Validates: Requirements 14.2**

**Property 50: Compact format size**
*For any* context data, compact format should produce approximately 2.3k characters
**Validates: Requirements 14.4**

**Property 51: Detailed format size**
*For any* context data, detailed format should produce approximately 8.6k characters
**Validates: Requirements 14.5**

### Caching Properties

**Property 52: Cache storage correctness**
*For any* analysis result, caching should store and retrieve the same data
**Validates: Requirements 16.1**

**Property 53: Cache hit efficiency**
*For any* cached result, retrieval should not trigger re-computation
**Validates: Requirements 16.2**

**Property 54: Cache invalidation correctness**
*For any* cache invalidation, old results should be removed
**Validates: Requirements 16.3**

**Property 55: Parallel processing correctness**
*For any* set of files, parallel processing should produce the same results as sequential processing
**Validates: Requirements 16.4**

### Cross-Platform Properties

**Property 56: Platform-specific path handling**
*For any* platform (Windows/macOS/Linux), path operations should use correct separators
**Validates: Requirements 17.1, 17.2, 17.3, 17.4**

**Property 57: Line ending handling**
*For any* file with CRLF or LF endings, the system should correctly process both formats
**Validates: Requirements 17.5**

### Configuration Properties

**Property 58: Config round-trip preservation**
*For any* configuration object, writing then reading should preserve all settings
**Validates: Requirements 18.1, 18.2**

### SQL Dialect Properties

**Property 59: SQL dialect recognition**
*For any* SQL file with dialect-specific syntax, the system should correctly identify and parse the dialect
**Validates: Requirements 19.1-19.9**

### Markup Language Properties

**Property 60: Markup language recognition**
*For any* markup file (HTML/Markdown/XML), the system should correctly identify and parse the structure
**Validates: Requirements 20.1-20.3**

**Property 61: Markup token calculation**
*For any* markup file, token calculation should accurately count tokens including tags and content
**Validates: Requirements 20.4**

**Property 62: Markup filtering compliance**
*For any* markup file and filter rules, filtering should correctly apply include/exclude patterns
**Validates: Requirements 20.5**

## Implementation Plan

### Phase 1: Test Infrastructure Setup
1. Install and configure fast-check for property-based testing
2. Create test directory structure (unit/, integration/, property/)
3. Set up test fixtures and sample data generators
4. Configure test runner and coverage tools

### Phase 2: Coverage Analysis Implementation
1. Implement CoverageAnalyzer class
2. Create module scanning functionality
3. Implement function detection and coverage calculation
4. Build coverage report generation

### Phase 3: Test Quality Evaluation
1. Implement TestQualityEvaluator class
2. Create assertion counting logic
3. Implement edge case detection
4. Build test organization scoring

### Phase 4: Property-Based Testing Module
1. Implement PropertyBasedTestingModule class
2. Create property extraction from requirements
3. Implement test strategy generation
4. Build generator suggestion system

### Phase 5: Property-Based Test Implementation
1. Implement all 62 correctness properties as fast-check tests
2. Create appropriate generators for each property
3. Configure 100+ iterations per property
4. Tag each test with feature and property reference

### Phase 6: Test Report Generation
1. Implement TestReportGenerator class
2. Create markdown formatting utilities
3. Implement section generators (coverage, quality, properties, recommendations)
4. Build final report assembly

### Phase 7: Integration and Validation
1. Run complete test suite
2. Validate coverage metrics
3. Review and refine property tests
4. Generate final comprehensive test validation report

## Deliverables

1. **Comprehensive Test Validation Report** (Markdown)
   - Current test coverage analysis
   - Test quality evaluation
   - Property-based test specifications
   - Recommendations for improvements
   - Gap analysis

2. **Property-Based Test Suite**
   - 62 property tests using fast-check
   - Custom generators for Context Manager data types
   - 100+ iterations per property
   - Full requirement traceability

3. **Test Infrastructure**
   - Organized test directory structure
   - Reusable test utilities and fixtures
   - Coverage reporting tools
   - CI/CD integration ready
