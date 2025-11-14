import MethodAnalyzer from '../lib/analyzers/method-analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const analyzer = new MethodAnalyzer();

console.log('=== Testing Markup Language Support (HTML, Markdown, XML) ===\n');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`✅ ${name}`);
    } catch (error) {
        failures.push({ name, error: error.message });
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
}

// ============================================================================
// HTML TESTS
// ============================================================================

console.log('--- HTML Element Extraction Tests ---\n');

test('HTML: Extracts heading elements', () => {
    const html = '<h1>Main Title</h1><h2>Subtitle</h2><h3>Section</h3>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const headings = elements.filter(e => e.type.startsWith('h'));
    assertGreaterThan(headings.length, 0, 'Should extract headings');
    assert(headings.some(h => h.name.includes('Main Title')), 'Should extract h1');
    assert(headings.some(h => h.name.includes('Subtitle')), 'Should extract h2');
});

test('HTML: Extracts semantic sections', () => {
    const html = '<section id="main">Content</section><article class="post">Article</article>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const sections = elements.filter(e => e.type === 'section');
    assert(sections.length > 0, 'Should extract sections');
    assert(sections.some(s => s.name === 'section#main'), 'Should extract section with id');
});

test('HTML: Extracts divs with id/class', () => {
    const html = '<div id="container">Content</div><div class="wrapper">More</div>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const divs = elements.filter(e => e.type === 'div');
    assertGreaterThan(divs.length, 0, 'Should extract divs');
    assert(divs.some(d => d.name.includes('container')), 'Should extract div with id');
});

test('HTML: Extracts forms', () => {
    const html = '<form id="login-form">Form content</form><form name="signupForm">Signup</form>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const forms = elements.filter(e => e.type === 'form');
    assertGreaterThan(forms.length, 0, 'Should extract forms');
    assert(forms.some(f => f.name === 'login-form'), 'Should extract form with id');
});

test('HTML: Extracts script tags', () => {
    const html = '<script src="app.js"></script><script id="config">var x = 1;</script>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const scripts = elements.filter(e => e.type === 'script');
    assertGreaterThan(scripts.length, 0, 'Should extract scripts');
});

test('HTML: Extracts custom elements', () => {
    const html = '<user-profile></user-profile><data-grid></data-grid>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const custom = elements.filter(e => e.type === 'custom-element');
    assertGreaterThan(custom.length, 0, 'Should extract custom elements');
    assert(custom.some(c => c.name === 'user-profile'), 'Should extract user-profile');
    assert(custom.some(c => c.name === 'data-grid'), 'Should extract data-grid');
});

test('HTML: Extracts templates', () => {
    const html = '<template id="user-card">Template content</template>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const templates = elements.filter(e => e.type === 'template');
    assertGreaterThan(templates.length, 0, 'Should extract templates');
    assert(templates.some(t => t.name === 'user-card'), 'Should extract template with id');
});

test('HTML: Accurate line numbers', () => {
    const html = 'Line 1\n<h1>Title</h1>\nLine 3\n<div id="test">Content</div>';
    const elements = analyzer.extractHTMLElements(html, 'test.html');
    const h1 = elements.find(e => e.type === 'h1');
    assertEquals(h1.line, 2, 'H1 should be on line 2');
    const div = elements.find(e => e.type === 'div');
    assertEquals(div.line, 4, 'Div should be on line 4');
});

test('HTML: Extracts from sample.html fixture', () => {
    const filePath = path.join(__dirname, 'fixtures/sample.html');
    const content = fs.readFileSync(filePath, 'utf8');
    const elements = analyzer.extractHTMLElements(content, filePath);
    assertGreaterThan(elements.length, 20, 'Should extract many elements from fixture');

    // Check for specific elements
    const headings = elements.filter(e => e.type.startsWith('h'));
    assertGreaterThan(headings.length, 5, 'Should extract multiple headings');

    const sections = elements.filter(e => ['section', 'article', 'aside', 'nav', 'header', 'footer', 'main'].includes(e.type));
    assertGreaterThan(sections.length, 5, 'Should extract semantic sections');

    const forms = elements.filter(e => e.type === 'form');
    assertGreaterThan(forms.length, 0, 'Should extract forms');

    const custom = elements.filter(e => e.type === 'custom-element');
    assertGreaterThan(custom.length, 0, 'Should extract custom elements');
});

// ============================================================================
// MARKDOWN TESTS
// ============================================================================

console.log('\n--- Markdown Section Extraction Tests ---\n');

test('Markdown: Extracts headings', () => {
    const md = '# Main Title\n## Subtitle\n### Section\n#### Subsection';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const headings = sections.filter(s => s.type.startsWith('h'));
    assertEquals(headings.length, 4, 'Should extract all heading levels');
    assert(headings.some(h => h.type === 'h1' && h.name === 'Main Title'), 'Should extract h1');
    assert(headings.some(h => h.type === 'h2' && h.name === 'Subtitle'), 'Should extract h2');
});

test('Markdown: Extracts code blocks', () => {
    const md = '```javascript\ncode here\n```\n\n```python\nmore code\n```';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const codeBlocks = sections.filter(s => s.type === 'code-block');
    assertEquals(codeBlocks.length, 2, 'Should extract code blocks');
    assert(codeBlocks.some(c => c.name === 'code-block-javascript'), 'Should detect language');
    assert(codeBlocks.some(c => c.name === 'code-block-python'), 'Should detect python');
});

test('Markdown: Extracts ordered lists', () => {
    const md = '1. First item\n2. Second item\n3. Third item';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const lists = sections.filter(s => s.type === 'ordered-list');
    assertEquals(lists.length, 3, 'Should extract all list items');
});

test('Markdown: Extracts unordered lists', () => {
    const md = '- Item one\n* Item two\n+ Item three';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const lists = sections.filter(s => s.type === 'unordered-list');
    assertEquals(lists.length, 3, 'Should extract all list markers');
});

test('Markdown: Extracts link references', () => {
    const md = '[homepage]: https://example.com\n[docs]: https://docs.example.com';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const links = sections.filter(s => s.type === 'link-reference');
    assertEquals(links.length, 2, 'Should extract link references');
    assert(links.some(l => l.name.includes('homepage')), 'Should extract homepage link');
});

test('Markdown: Accurate line numbers', () => {
    const md = '# Title\n\nSome text\n\n## Subtitle\n\nMore text';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    const h1 = sections.find(s => s.type === 'h1');
    assertEquals(h1.line, 1, 'H1 should be on line 1');
    const h2 = sections.find(s => s.type === 'h2');
    assertEquals(h2.line, 5, 'H2 should be on line 5');
});

test('Markdown: Handles empty lines', () => {
    const md = '\n\n# Title\n\n\n## Subtitle\n\n';
    const sections = analyzer.extractMarkdownSections(md, 'test.md');
    assertEquals(sections.length, 2, 'Should ignore empty lines');
});

test('Markdown: Extracts from sample.md fixture', () => {
    const filePath = path.join(__dirname, 'fixtures/sample.md');
    const content = fs.readFileSync(filePath, 'utf8');
    const sections = analyzer.extractMarkdownSections(content, filePath);
    assertGreaterThan(sections.length, 30, 'Should extract many sections from fixture');

    // Check for specific elements
    const headings = sections.filter(s => s.type.startsWith('h'));
    assertGreaterThan(headings.length, 15, 'Should extract multiple headings');

    const codeBlocks = sections.filter(s => s.type === 'code-block');
    assertGreaterThan(codeBlocks.length, 5, 'Should extract code blocks');

    const lists = sections.filter(s => s.type === 'ordered-list' || s.type === 'unordered-list');
    assertGreaterThan(lists.length, 10, 'Should extract list items');
});

// ============================================================================
// XML TESTS
// ============================================================================

console.log('\n--- XML Element Extraction Tests ---\n');

test('XML: Extracts root elements with namespace', () => {
    const xml = '<?xml version="1.0"?><root xmlns="http://example.com">Content</root>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const roots = elements.filter(e => e.type === 'root-element');
    assertGreaterThan(roots.length, 0, 'Should extract root element');
    assert(roots.some(r => r.name === 'root'), 'Should extract root tag');
});

test('XML: Extracts elements with id', () => {
    const xml = '<config id="main-config"><setting id="timeout">30</setting></config>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const withId = elements.filter(e => e.type === 'element-with-id');
    assertGreaterThan(withId.length, 0, 'Should extract elements with id');
    assert(withId.some(e => e.name.includes('main-config')), 'Should extract config id');
});

test('XML: Extracts elements with name attribute', () => {
    const xml = '<dependency name="react" version="18.0.0"/>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const withName = elements.filter(e => e.type === 'element-with-name');
    assertGreaterThan(withName.length, 0, 'Should extract elements with name');
    assert(withName.some(e => e.name.includes('react')), 'Should extract dependency name');
});

test('XML: Extracts processing instructions', () => {
    const xml = '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="style.xsl"?>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const pi = elements.filter(e => e.type === 'processing-instruction');
    assertGreaterThan(pi.length, 0, 'Should extract processing instructions');
});

test('XML: Extracts TODO/FIXME comments', () => {
    const xml = '<!-- TODO: Add validation --><root><!-- FIXME: Update schema --></root>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const comments = elements.filter(e => e.type === 'comment');
    assertEquals(comments.length, 2, 'Should extract comment annotations');
    assert(comments.some(c => c.name.includes('TODO')), 'Should extract TODO');
    assert(comments.some(c => c.name.includes('FIXME')), 'Should extract FIXME');
});

test('XML: Extracts namespaced elements', () => {
    const xml = '<root xmlns:build="http://build"><build:target>prod</build:target></root>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const namespaced = elements.filter(e => e.type === 'namespaced-element');
    assertGreaterThan(namespaced.length, 0, 'Should extract namespaced elements');
    assert(namespaced.some(e => e.name === 'build:target'), 'Should extract build:target');
});

test('XML: Accurate line numbers', () => {
    const xml = '<?xml version="1.0"?>\n<root>\n  <element id="test">Value</element>\n</root>';
    const elements = analyzer.extractXMLElements(xml, 'test.xml');
    const element = elements.find(e => e.name.includes('test'));
    assertEquals(element.line, 3, 'Element should be on line 3');
});

test('XML: Extracts from sample.xml fixture', () => {
    const filePath = path.join(__dirname, 'fixtures/sample.xml');
    const content = fs.readFileSync(filePath, 'utf8');
    const elements = analyzer.extractXMLElements(content, filePath);
    assertGreaterThan(elements.length, 30, 'Should extract many elements from fixture');

    // Check for specific element types
    const withId = elements.filter(e => e.type === 'element-with-id');
    assertGreaterThan(withId.length, 10, 'Should extract elements with id');

    const withName = elements.filter(e => e.type === 'element-with-name');
    assertGreaterThan(withName.length, 5, 'Should extract elements with name');

    const namespaced = elements.filter(e => e.type === 'namespaced-element');
    assertGreaterThan(namespaced.length, 5, 'Should extract namespaced elements');

    const comments = elements.filter(e => e.type === 'comment');
    assertGreaterThan(comments.length, 2, 'Should extract annotated comments');
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

console.log('\n--- Integration Tests ---\n');

test('Integration: extractMethods routes to HTML extractor', () => {
    const html = '<h1>Test</h1>';
    const elements = analyzer.extractMethods(html, 'test.html');
    assertGreaterThan(elements.length, 0, 'Should use HTML extractor');
    assert(elements[0].type === 'h1', 'Should extract HTML elements');
});

test('Integration: extractMethods routes to Markdown extractor', () => {
    const md = '# Test Heading';
    const sections = analyzer.extractMethods(md, 'test.md');
    assertGreaterThan(sections.length, 0, 'Should use Markdown extractor');
    assert(sections[0].type === 'h1', 'Should extract Markdown sections');
});

test('Integration: extractMethods routes to XML extractor', () => {
    const xml = '<root id="test">Content</root>';
    const elements = analyzer.extractMethods(xml, 'test.xml');
    assertGreaterThan(elements.length, 0, 'Should use XML extractor');
    assert(elements[0].type === 'element-with-id', 'Should extract XML elements');
});

test('Integration: .htm extension uses HTML extractor', () => {
    const html = '<h1>Test</h1>';
    const elements = analyzer.extractMethods(html, 'test.htm');
    assertGreaterThan(elements.length, 0, 'Should handle .htm extension');
});

test('Integration: .markdown extension uses Markdown extractor', () => {
    const md = '# Test';
    const sections = analyzer.extractMethods(md, 'test.markdown');
    assertGreaterThan(sections.length, 0, 'Should handle .markdown extension');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 MARKUP LANGUAGE TEST RESULTS SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(({ name, error }) => {
        console.log(`  - ${name}`);
        console.log(`    ${error}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 ALL MARKUP LANGUAGE TESTS PASSED!');
    console.log('\nSupported formats:');
    console.log('  • HTML (.html, .htm) - headings, sections, forms, scripts, custom elements, templates');
    console.log('  • Markdown (.md, .markdown) - headings, code blocks, lists, tables, link references');
    console.log('  • XML (.xml) - root elements, namespaced elements, attributes, comments, processing instructions');
    process.exit(0);
}
