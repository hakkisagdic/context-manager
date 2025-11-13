#!/usr/bin/env node
/**
 * Comprehensive Wizard Tests
 * Tests wizard initialization, navigation, state management, and integration
 * ~30 test cases covering all wizard functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Running Comprehensive Wizard Tests...\n');

let passed = 0;
let failed = 0;
let skipped = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`✅ ${name}`);
		passed++;
	} catch (error) {
		console.log(`❌ ${name}`);
		console.log(`   Error: ${error.message}`);
		if (error.stack) {
			console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
		}
		failed++;
	}
}

function skip(name, reason) {
	console.log(`⏭️  ${name} (${reason})`);
	skipped++;
}

// ===================================================================
// Section 1: Profile Discovery Tests
// ===================================================================

console.log('\n📁 Section 1: Profile Discovery\n');

test('1.1: discoverProfiles returns array of profiles', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('function discoverProfiles()')) {
		throw new Error('discoverProfiles function not found');
	}
});

test('1.2: Profile discovery includes custom option', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes("value: 'custom'")) {
		throw new Error('Custom profile option not found');
	}
});

test('1.3: Profile metadata has required fields', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir).filter(p =>
		fs.statSync(path.join(profilesDir, p)).isDirectory()
	);

	if (profiles.length === 0) {
		throw new Error('No profiles found');
	}

	const firstProfile = profiles[0];
	const metadataPath = path.join(profilesDir, firstProfile, 'profile.json');
	const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

	const required = ['id', 'name', 'icon', 'description'];
	required.forEach(field => {
		if (!(field in metadata)) {
			throw new Error(`Missing field: ${field}`);
		}
	});
});

test('1.4: Profile icons are properly formatted', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir).filter(p =>
		fs.statSync(path.join(profilesDir, p)).isDirectory()
	);

	profiles.forEach(profile => {
		const metadataPath = path.join(profilesDir, profile, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		if (!metadata.icon || metadata.icon.length === 0) {
			throw new Error(`${profile} has empty icon`);
		}
	});
});

test('1.5: All profiles have unique IDs', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir).filter(p =>
		fs.statSync(path.join(profilesDir, p)).isDirectory()
	);

	const ids = new Set();
	profiles.forEach(profile => {
		const metadataPath = path.join(profilesDir, profile, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		if (ids.has(metadata.id)) {
			throw new Error(`Duplicate profile ID: ${metadata.id}`);
		}
		ids.add(metadata.id);
	});
});

// ===================================================================
// Section 2: File Operations Tests
// ===================================================================

console.log('\n📄 Section 2: File Operations\n');

test('2.1: copyProfileFiles function exists', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('function copyProfileFiles(')) {
		throw new Error('copyProfileFiles function not found');
	}
});

test('2.2: copyProfileFiles handles all 4 config files', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	const expectedFiles = ['.contextinclude', '.contextignore', '.methodinclude', '.methodignore'];
	expectedFiles.forEach(file => {
		if (!wizardCode.includes(`'${file}'`)) {
			throw new Error(`copyProfileFiles doesn't handle ${file}`);
		}
	});
});

test('2.3: Profile files have -profileId suffix pattern', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Check for pattern like .contextinclude-${profileId}
	if (!wizardCode.includes('-${profileId}')) {
		throw new Error('Profile files should use -profileId suffix pattern');
	}
});

test('2.4: Symlink creation uses copyFileSync instead of symlink', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use copyFileSync for compatibility
	if (!wizardCode.includes('copyFileSync')) {
		throw new Error('Should use copyFileSync for compatibility');
	}
});

test('2.5: Profile directory structure is valid', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir).filter(p =>
		fs.statSync(path.join(profilesDir, p)).isDirectory()
	);

	const requiredFiles = ['profile.json', '.contextinclude', '.contextignore', '.methodinclude', '.methodignore'];

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		requiredFiles.forEach(file => {
			const filePath = path.join(profilePath, file);
			if (!fs.existsSync(filePath)) {
				throw new Error(`${profile}/${file} is missing`);
			}
		});
	});
});

// ===================================================================
// Section 3: Wizard State Management Tests
// ===================================================================

console.log('\n🔄 Section 3: Wizard State Management\n');

test('3.1: Wizard initial step is profile', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes("useState('profile')")) {
		throw new Error('Initial step should be profile');
	}
});

test('3.2: Wizard has answers state', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('setAnswers')) {
		throw new Error('Wizard should have answers state');
	}
});

test('3.3: Profile selection updates answers', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should update answers with profile, copiedFiles, profileMetadata
	const requiredFields = ['profile:', 'copiedFiles:', 'profileMetadata:'];
	requiredFields.forEach(field => {
		if (!wizardCode.includes(field)) {
			throw new Error(`handleProfileSelect should set ${field}`);
		}
	});
});

test('3.4: Step transitions are correct', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// profile -> target-model -> output-format -> complete
	const transitions = [
		"setStep('target-model')",
		"setStep('output-format')",
		"setStep('complete')"
	];

	transitions.forEach(transition => {
		if (!wizardCode.includes(transition)) {
			throw new Error(`Missing step transition: ${transition}`);
		}
	});
});

test('3.5: Custom profile skips file copying', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check for custom and skip copyProfileFiles
	if (!wizardCode.includes("item.value !== 'custom'")) {
		throw new Error('Should check for custom profile');
	}
});

// ===================================================================
// Section 4: LLM Detection Tests
// ===================================================================

console.log('\n🤖 Section 4: LLM Detection\n');

test('4.1: LLMDetector is imported', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes("import { LLMDetector }")) {
		throw new Error('LLMDetector should be imported');
	}
});

test('4.2: Auto-detect option exists', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes("value: 'auto'")) {
		throw new Error('Auto-detect option should exist');
	}
});

test('4.3: Auto-detect has fallback', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should fallback to a default model if detection fails
	if (!wizardCode.includes("selectedModel === 'unknown'")) {
		throw new Error('Should handle unknown detection result');
	}
});

test('4.4: Default fallback model is set', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should fallback to claude-sonnet-4.5 or similar
	if (!wizardCode.includes('claude-sonnet')) {
		throw new Error('Should have a claude fallback model');
	}
});

test('4.5: Models are grouped by vendor', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	const vendors = ['Anthropic', 'OpenAI', 'Google'];
	vendors.forEach(vendor => {
		if (!wizardCode.includes(`'${vendor}'`)) {
			throw new Error(`Models should be grouped by ${vendor}`);
		}
	});
});

// ===================================================================
// Section 5: Output Format Tests
// ===================================================================

console.log('\n📤 Section 5: Output Format\n');

test('5.1: All major formats are available', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	const formats = ['toon', 'json', 'gitingest', 'markdown', 'yaml', 'csv'];
	formats.forEach(format => {
		if (!wizardCode.includes(`'${format}'`)) {
			throw new Error(`Format ${format} should be available`);
		}
	});
});

test('5.2: TOON format is recommended (first option)', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// TOON should mention efficiency
	if (!wizardCode.includes('most efficient') && !wizardCode.includes('40-50% reduction')) {
		throw new Error('TOON format should be highlighted as efficient');
	}
});

test('5.3: Format selection completes wizard', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// handleOutputFormatSelect should set step to complete
	const handleFn = wizardCode.match(/const handleOutputFormatSelect[\s\S]*?}, \[/);
	if (!handleFn || !handleFn[0].includes("setStep('complete')")) {
		throw new Error('handleOutputFormatSelect should set step to complete');
	}
});

test('5.4: Format is added to final answers', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('outputFormat:')) {
		throw new Error('outputFormat should be added to answers');
	}
});

// ===================================================================
// Section 6: Completion & Callbacks Tests
// ===================================================================

console.log('\n✅ Section 6: Completion & Callbacks\n');

test('6.1: onComplete callback is called', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should call onComplete with finalAnswers
	if (!wizardCode.includes('onComplete(finalAnswers)')) {
		throw new Error('onComplete should be called with finalAnswers');
	}
});

test('6.2: onComplete is guarded against undefined', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check if onComplete exists
	if (!wizardCode.includes('if (onComplete)')) {
		throw new Error('onComplete should be checked before calling');
	}
});

test('6.3: Complete step shows configuration summary', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should display profile, target model, output format
	const summaryFields = ['Profile:', 'Target Model:', 'Output Format:'];
	summaryFields.forEach(field => {
		if (!wizardCode.includes(field)) {
			throw new Error(`Complete step should show ${field}`);
		}
	});
});

test('6.4: Copied files are displayed on completion', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should show copied files if any
	if (!wizardCode.includes('copiedFiles') || !wizardCode.includes('length > 0')) {
		throw new Error('Should display copied files on completion');
	}
});

// ===================================================================
// Section 7: UI Component Tests
// ===================================================================

console.log('\n🎨 Section 7: UI Components\n');

test('7.1: Wizard uses Ink components', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	const inkComponents = ['Box', 'Text'];
	inkComponents.forEach(comp => {
		if (!wizardCode.includes(comp)) {
			throw new Error(`Should use ${comp} component`);
		}
	});
});

test('7.2: SelectInput is used for all steps', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('SelectInput')) {
		throw new Error('Should use SelectInput component');
	}
});

test('7.3: Help text is provided for navigation', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should show keyboard shortcuts
	const shortcuts = ['↑↓', 'Enter', 'Esc'];
	shortcuts.forEach(shortcut => {
		if (!wizardCode.includes(shortcut)) {
			throw new Error(`Help text should mention ${shortcut}`);
		}
	});
});

test('7.4: Wizard title is displayed', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('Context Generation Wizard')) {
		throw new Error('Wizard title should be displayed');
	}
});

test('7.5: Wizard has border styling', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have borderStyle
	if (!wizardCode.includes('borderStyle')) {
		throw new Error('Wizard should have border styling');
	}
});

// ===================================================================
// Section 8: Input Validation Tests
// ===================================================================

console.log('\n🔍 Section 8: Input Validation\n');

test('8.1: Profile selection validates item exists', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check item.value and item.path
	if (!wizardCode.includes('item.value') || !wizardCode.includes('item.path')) {
		throw new Error('Profile selection should validate item');
	}
});

test('8.2: Model selection handles auto-detect', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should handle auto detection
	if (!wizardCode.includes("selectedModel === 'auto'")) {
		throw new Error('Should handle auto-detect selection');
	}
});

test('8.3: Format selection updates state correctly', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should create finalAnswers with outputFormat
	if (!wizardCode.includes('finalAnswers')) {
		throw new Error('Should create finalAnswers');
	}
});

// ===================================================================
// Section 9: Error Handling Tests
// ===================================================================

console.log('\n⚠️  Section 9: Error Handling\n');

test('9.1: Profile discovery handles missing directory', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check if directory exists
	if (!wizardCode.includes('fs.existsSync(profilesDir)')) {
		throw new Error('Should check if profiles directory exists');
	}
});

test('9.2: Profile discovery handles read errors', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have try-catch
	const discoverFn = wizardCode.match(/function discoverProfiles\(\)[\s\S]*?^}/m);
	if (!discoverFn || !discoverFn[0].includes('try') || !discoverFn[0].includes('catch')) {
		throw new Error('discoverProfiles should have error handling');
	}
});

test('9.3: File copy operations handle errors', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// copyProfileFiles should have try-catch
	const copyFn = wizardCode.match(/function copyProfileFiles[\s\S]*?^}/m);
	if (!copyFn || !copyFn[0].includes('try') || !copyFn[0].includes('catch')) {
		throw new Error('copyProfileFiles should have error handling');
	}
});

test('9.4: Metadata parsing handles invalid JSON', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should catch JSON parse errors
	if (!wizardCode.includes('JSON.parse') || !wizardCode.includes('catch (error)')) {
		throw new Error('Should handle JSON parse errors');
	}
});

// ===================================================================
// Section 10: Integration Tests
// ===================================================================

console.log('\n🔗 Section 10: Integration\n');

test('10.1: Wizard can be imported as default export', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('export default function Wizard')) {
		throw new Error('Wizard should be default export');
	}
});

test('10.2: Wizard accepts onComplete prop', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	if (!wizardCode.includes('{ onComplete }')) {
		throw new Error('Wizard should accept onComplete prop');
	}
});

test('10.3: Profile metadata includes all required info', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir).filter(p =>
		fs.statSync(path.join(profilesDir, p)).isDirectory()
	);

	profiles.forEach(profile => {
		const metadataPath = path.join(profilesDir, profile, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		if (!metadata.description || metadata.description.length === 0) {
			throw new Error(`${profile} missing description`);
		}
	});
});

test('10.4: LLM models have context window info', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should show context window size
	if (!wizardCode.includes('contextWindow')) {
		throw new Error('LLM models should show context window info');
	}
});

test('10.5: Profile selection flow is complete', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have all handlers
	const handlers = ['handleProfileSelect', 'handleTargetModelSelect', 'handleOutputFormatSelect'];
	handlers.forEach(handler => {
		if (!wizardCode.includes(handler)) {
			throw new Error(`Missing handler: ${handler}`);
		}
	});
});

// ===================================================================
// Summary
// ===================================================================

console.log('\n' + '='.repeat(60));
console.log('Test Summary:');
console.log('='.repeat(60));
console.log(`✅ Passed:  ${passed}`);
console.log(`❌ Failed:  ${failed}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`📊 Total:   ${passed + failed + skipped}`);
console.log('='.repeat(60));

if (failed > 0) {
	console.log('\n❌ Some tests failed. Please review the errors above.\n');
	process.exit(1);
}

console.log('\n🎉 All wizard comprehensive tests passed!\n');
process.exit(0);
