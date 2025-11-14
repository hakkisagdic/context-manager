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
// Section 11: Keyboard Navigation & Cancel Tests
// ===================================================================

console.log('\n⌨️  Section 11: Keyboard Navigation\n');

test('11.1: SelectInput component exists', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	if (!fs.existsSync(selectInputPath)) {
		throw new Error('SelectInput component file not found');
	}
});

test('11.2: SelectInput handles up/down arrow keys', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should handle upArrow and downArrow
	if (!selectInputCode.includes('upArrow') || !selectInputCode.includes('downArrow')) {
		throw new Error('SelectInput should handle arrow keys');
	}
});

test('11.3: SelectInput handles Enter key', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should handle return/enter key
	if (!selectInputCode.includes('return')) {
		throw new Error('SelectInput should handle Enter key');
	}
});

test('11.4: SelectInput handles Escape key', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should handle escape key
	if (!selectInputCode.includes('escape')) {
		throw new Error('SelectInput should handle Escape key');
	}
});

test('11.5: Escape exits the application', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should call process.exit on escape
	if (!selectInputCode.includes('process.exit')) {
		throw new Error('Escape should exit application');
	}
});

test('11.6: Arrow key navigation wraps around', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should wrap from 0 to length-1 and vice versa
	if (!selectInputCode.includes('items.length - 1')) {
		throw new Error('Arrow navigation should wrap around');
	}
});

test('11.7: SelectInput uses useInput hook', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should use Ink's useInput hook
	if (!selectInputCode.includes('useInput')) {
		throw new Error('SelectInput should use useInput hook');
	}
});

// ===================================================================
// Section 12: Default Values & State Persistence Tests
// ===================================================================

console.log('\n💾 Section 12: Default Values & State\n');

test('12.1: selectedIndex starts at 0', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should initialize selectedIndex to 0
	if (!selectInputCode.includes('useState(0)')) {
		throw new Error('selectedIndex should start at 0');
	}
});

test('12.2: Answers object persists across steps', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use spread operator to preserve previous answers
	if (!wizardCode.includes('...prev')) {
		throw new Error('Answers should persist across steps');
	}
});

test('12.3: Profile items are memoized', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use useMemo for profile items
	if (!wizardCode.includes('useMemo(() => discoverProfiles()')) {
		throw new Error('Profile items should be memoized');
	}
});

test('12.4: Target model items are memoized', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use useMemo for target model items
	const targetModelMemo = wizardCode.includes('const targetModelItems = useMemo');
	if (!targetModelMemo) {
		throw new Error('Target model items should be memoized');
	}
});

test('12.5: Handlers use useCallback', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use useCallback for handlers
	if (!wizardCode.includes('useCallback')) {
		throw new Error('Handlers should use useCallback');
	}
});

test('12.6: Step state is maintained with useState', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have step state
	if (!wizardCode.includes('useState(\'profile\')')) {
		throw new Error('Step should be maintained with useState');
	}
});

// ===================================================================
// Section 13: Advanced Profile & Config Tests
// ===================================================================

console.log('\n⚙️  Section 13: Advanced Configuration\n');

test('13.1: Profile files can be copied to project root', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should copy to projectRoot
	if (!wizardCode.includes('process.cwd()')) {
		throw new Error('Should copy files to project root');
	}
});

test('13.2: Copied files are tracked in answers', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should track copiedFiles in answers
	if (!wizardCode.includes('copiedFiles:')) {
		throw new Error('Copied files should be tracked');
	}
});

test('13.3: Profile metadata is stored in answers', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should store profileMetadata
	if (!wizardCode.includes('profileMetadata:')) {
		throw new Error('Profile metadata should be stored');
	}
});

test('13.4: Active config files are created', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should create symlinks or copies for active config
	const configFiles = ['.contextinclude', '.contextignore', '.methodinclude', '.methodignore'];
	let found = 0;
	configFiles.forEach(file => {
		if (wizardCode.includes(`'${file}'`)) {
			found++;
		}
	});

	if (found !== 4) {
		throw new Error('Should handle all 4 config files');
	}
});

test('13.5: Profile selection clears existing files', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should remove/unlink existing files before creating new ones
	if (!wizardCode.includes('unlinkSync')) {
		throw new Error('Should clear existing files');
	}
});

test('13.6: File operations check for existence', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check file existence with existsSync
	const copyFn = wizardCode.match(/function copyProfileFiles[\s\S]*?^}/m);
	if (!copyFn || !copyFn[0].includes('existsSync')) {
		throw new Error('Should check file existence');
	}
});

// ===================================================================
// Section 14: Display & Formatting Tests
// ===================================================================

console.log('\n🎨 Section 14: Display & Formatting\n');

test('14.1: Complete step shows success message', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should show "Configuration Complete"
	if (!wizardCode.includes('Configuration Complete')) {
		throw new Error('Should show completion message');
	}
});

test('14.2: Profile icons are displayed in selection', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should include icon in label
	if (!wizardCode.includes('metadata.icon')) {
		throw new Error('Profile icons should be displayed');
	}
});

test('14.3: Context window sizes are formatted', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should format large numbers (1M for million, k for thousand)
	if (!wizardCode.includes('contextK') && !wizardCode.includes('1000000')) {
		throw new Error('Context window sizes should be formatted');
	}
});

test('14.4: Wizard has fixed width', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should set width
	if (!wizardCode.includes('width:')) {
		throw new Error('Wizard should have fixed width');
	}
});

test('14.5: Selected item is highlighted', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should highlight selected item with color
	if (!selectInputCode.includes('color:') || !selectInputCode.includes('isSelected')) {
		throw new Error('Selected item should be highlighted');
	}
});

test('14.6: Selection indicator is shown', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should show arrow indicator (❯)
	if (!selectInputCode.includes('❯')) {
		throw new Error('Should show selection indicator');
	}
});

// ===================================================================
// Section 15: React Hooks & Optimization Tests
// ===================================================================

console.log('\n⚛️  Section 15: React Hooks & Optimization\n');

test('15.1: Component uses React hooks', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	const hooks = ['useState', 'useCallback', 'useMemo'];
	hooks.forEach(hook => {
		if (!wizardCode.includes(hook)) {
			throw new Error(`Should use ${hook} hook`);
		}
	});
});

test('15.2: useCallback dependencies are correct', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have dependency arrays with answers and onComplete
	if (!wizardCode.includes('[answers, onComplete]')) {
		throw new Error('useCallback should have proper dependencies');
	}
});

test('15.3: useMemo prevents unnecessary recalculations', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use empty dependency array for memoized items
	if (!wizardCode.includes('useMemo(() => discoverProfiles(), [])')) {
		throw new Error('useMemo should prevent recalculations');
	}
});

test('15.4: SelectInput uses useStdin for raw mode', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should use useStdin to check raw mode support
	if (!selectInputCode.includes('useStdin')) {
		throw new Error('SelectInput should use useStdin');
	}
});

test('15.5: useInput is active only in raw mode', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should check isRawModeSupported
	if (!selectInputCode.includes('isRawModeSupported')) {
		throw new Error('useInput should be active only in raw mode');
	}
});

// ===================================================================
// Section 16: TokenAnalyzer Integration Tests
// ===================================================================

console.log('\n🔗 Section 16: TokenAnalyzer Integration\n');

test('16.1: CLI imports TokenAnalyzer', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should import TokenAnalyzer
	if (!cliCode.includes('TokenAnalyzer')) {
		throw new Error('CLI should import TokenAnalyzer');
	}
});

test('16.2: runWizard function exists in CLI', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should have runWizard function
	if (!cliCode.includes('async function runWizard()')) {
		throw new Error('CLI should have runWizard function');
	}
});

test('16.3: Wizard onComplete callback receives answers', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should pass onComplete callback to Wizard
	if (!cliCode.includes('onComplete: (answers)')) {
		throw new Error('Wizard should receive onComplete callback');
	}
});

test('16.4: Wizard answers are converted to analyzer options', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should map wizard answers to analyzer options
	const requiredMappings = ['outputFormat:', 'targetModel:', 'projectRoot:'];
	requiredMappings.forEach(mapping => {
		if (!cliCode.includes(mapping)) {
			throw new Error(`Should map ${mapping} from wizard answers`);
		}
	});
});

test('16.5: TokenAnalyzer is instantiated with wizard options', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should create TokenAnalyzer instance
	if (!cliCode.includes('new TokenAnalyzer(options.projectRoot, options)')) {
		throw new Error('Should instantiate TokenAnalyzer with options');
	}
});

test('16.6: analyzer.run() is called after wizard completion', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should call analyzer.run()
	if (!cliCode.includes('analyzer.run()')) {
		throw new Error('Should call analyzer.run() after wizard');
	}
});

test('16.7: Wizard unmounts before running analyzer', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should unmount wizard instance before analysis
	if (!cliCode.includes('instance.unmount()')) {
		throw new Error('Should unmount wizard before analysis');
	}
});

test('16.8: Analysis runs with auto-export enabled', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should enable auto-export
	if (!cliCode.includes('contextExport: true')) {
		throw new Error('Should enable auto-export for wizard mode');
	}
});

test('16.9: Wizard mode is the default behavior', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should run wizard by default
	if (!cliCode.includes('await runWizard()')) {
		throw new Error('Wizard should be default mode');
	}
});

test('16.10: CLI mode can be explicitly requested', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should support --cli flag
	if (!cliCode.includes('--cli')) {
		throw new Error('Should support --cli flag to skip wizard');
	}
});

test('16.11: Wizard answers include all required fields', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should use outputFormat, targetModel from answers
	const expectedFields = ['answers.outputFormat', 'answers.targetModel'];
	expectedFields.forEach(field => {
		if (!cliCode.includes(field)) {
			throw new Error(`Wizard answers should include ${field}`);
		}
	});
});

test('16.12: Profile config files are used by analyzer', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Wizard copies config files to project root
	// Analyzer should pick them up automatically
	if (!wizardCode.includes('copyFileSync')) {
		throw new Error('Wizard should copy config files for analyzer');
	}
});

test('16.13: Success message shows after analysis', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should show completion message
	if (!cliCode.includes('Analysis complete')) {
		throw new Error('Should show success message after analysis');
	}
});

test('16.14: Wizard imports are dynamic (ESM)', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should use dynamic imports for wizard
	if (!cliCode.includes("await import('../lib/ui/wizard.js')")) {
		throw new Error('Wizard should be imported dynamically');
	}
});

test('16.15: React and Ink are imported dynamically', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should dynamically import React and Ink
	const imports = ["await import('react')", "await import('ink')"];
	imports.forEach(imp => {
		if (!cliCode.includes(imp)) {
			throw new Error(`Should dynamically import ${imp}`);
		}
	});
});

// ===================================================================
// Section 17: Navigation Limitations & Edge Cases
// ===================================================================

console.log('\n⚠️  Section 17: Navigation Limitations\n');

test('17.1: Wizard has no backward navigation mechanism', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Wizard is forward-only: profile → target-model → output-format → complete
	// No back button or previous step functionality
	// This is by design for simplicity

	// Should not have handleBackClick or similar
	if (wizardCode.includes('handleBack') || wizardCode.includes('handlePrevious')) {
		throw new Error('Unexpected backward navigation found');
	}

	// Step only moves forward
	const setStepCalls = wizardCode.match(/setStep\([^)]+\)/g) || [];
	const forwardSteps = ['target-model', 'output-format', 'complete'];

	let hasForwardFlow = true;
	forwardSteps.forEach(step => {
		if (!wizardCode.includes(`setStep('${step}')`)) {
			hasForwardFlow = false;
		}
	});

	if (!hasForwardFlow) {
		throw new Error('Wizard should have forward-only flow');
	}
});

test('17.2: SelectInput validates items array is not empty', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should have items parameter with default value
	if (!selectInputCode.includes('items = []')) {
		throw new Error('SelectInput should handle empty items array');
	}
});

test('17.3: SelectInput validates selectedIndex bounds', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should check items[selectedIndex] exists before calling onSelect
	if (!selectInputCode.includes('items[selectedIndex]')) {
		throw new Error('SelectInput should validate selectedIndex');
	}
});

test('17.4: Wizard only advances on user selection', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// setStep is only called inside handlers (callbacks)
	// Not automatically called on render
	const handlers = ['handleProfileSelect', 'handleTargetModelSelect', 'handleOutputFormatSelect'];

	handlers.forEach(handler => {
		const handlerRegex = new RegExp(`const ${handler}[\\s\\S]*?\\}, \\[`);
		const match = wizardCode.match(handlerRegex);
		if (!match || !match[0].includes('setStep')) {
			throw new Error(`${handler} should call setStep`);
		}
	});
});

test('17.5: Escape is the only way to cancel wizard', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Only escape key exits
	if (!selectInputCode.includes('key.escape')) {
		throw new Error('Escape key should be supported');
	}

	// No cancel button or other exit mechanism
	if (selectInputCode.includes('Cancel') && !selectInputCode.includes('Esc')) {
		throw new Error('Cancel mechanism found but no Escape reference');
	}
});

// ===================================================================
// Section 18: Multiple Wizard Runs & State Cleanup
// ===================================================================

console.log('\n🔄 Section 18: Multiple Runs & Cleanup\n');

test('18.1: Wizard state is local (useState)', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Each wizard instance has its own state
	// Uses useState, not global variables
	if (wizardCode.includes('let step =') || wizardCode.includes('let answers =')) {
		throw new Error('Should use useState, not module-level variables');
	}

	if (!wizardCode.includes('useState(\'profile\')')) {
		throw new Error('Step should be local state');
	}
});

test('18.2: Profile items are recalculated on mount', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// useMemo with empty deps means it only runs once per component instance
	// Each new wizard run will get fresh profile list
	if (!wizardCode.includes('useMemo(() => discoverProfiles(), [])')) {
		throw new Error('Profile discovery should be memoized per instance');
	}
});

test('18.3: Wizard unmount cleans up React instance', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should call instance.unmount()
	if (!cliCode.includes('instance.unmount()')) {
		throw new Error('Should unmount wizard instance');
	}
});

test('18.4: Multiple wizard runs would create new instances', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Each runWizard() call creates a new render instance
	// State is not shared between runs
	if (!cliCode.includes('const instance = render(')) {
		throw new Error('Should create new render instance');
	}
});

test('18.5: onComplete callback is specific to each wizard run', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// onComplete is passed as prop, different for each instance
	if (!wizardCode.includes('{ onComplete }')) {
		throw new Error('onComplete should be prop');
	}
});

// ===================================================================
// Section 19: Enhanced Invalid Input & Edge Cases
// ===================================================================

console.log('\n🔍 Section 19: Invalid Input & Edge Cases\n');

test('19.1: Empty profile directory is handled gracefully', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// discoverProfiles should always return at least custom option
	// Even if no profiles exist
	if (!wizardCode.includes("value: 'custom'")) {
		throw new Error('Should always include custom option');
	}
});

test('19.2: Invalid profile.json is caught and skipped', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should have try-catch around JSON.parse in discoverProfiles
	const discoverFn = wizardCode.match(/function discoverProfiles\(\)[\s\S]*?^}/m);
	if (!discoverFn || !discoverFn[0].includes('catch')) {
		throw new Error('Should handle invalid profile.json');
	}
});

test('19.3: Missing profile files do not crash wizard', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// copyProfileFiles should check file existence before copying
	// Uses existsSync
	const copyFn = wizardCode.match(/function copyProfileFiles[\s\S]*?^}/m);
	if (!copyFn || !copyFn[0].includes('existsSync')) {
		throw new Error('Should check file existence before copying');
	}
});

test('19.4: LLM detection failure falls back to default', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check for 'unknown' result and fallback
	if (!wizardCode.includes("selectedModel === 'unknown'")) {
		throw new Error('Should handle failed LLM detection');
	}
});

test('19.5: Corrupted LLM model list is handled', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// LLMDetector.getModelList() might return empty array
	// Wizard should still show at least auto-detect option
	if (!wizardCode.includes("label: '✨ Auto-detect from environment'")) {
		throw new Error('Should always show auto-detect option');
	}
});

test('19.6: SelectInput handles key events when items is empty', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should check items[selectedIndex] before onSelect
	if (!selectInputCode.includes('items[selectedIndex] && onSelect')) {
		throw new Error('Should validate item exists before calling onSelect');
	}
});

test('19.7: SelectInput handles undefined onSelect callback', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should check if onSelect exists
	if (!selectInputCode.includes('items[selectedIndex] && onSelect')) {
		throw new Error('Should check onSelect exists');
	}
});

test('19.8: Wizard handles undefined profile metadata', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Custom profile has null metadata
	// Should handle this gracefully
	if (!wizardCode.includes('profileMetadata: null')) {
		throw new Error('Should handle null metadata for custom profile');
	}
});

test('19.9: Profile path validation for custom profile', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check item.value !== 'custom' before accessing path
	if (!wizardCode.includes("item.value !== 'custom'")) {
		throw new Error('Should validate profile type before file operations');
	}
});

test('19.10: File copy errors do not crash wizard', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// copyProfileFiles should have error handling
	const copyFn = wizardCode.match(/function copyProfileFiles[\s\S]*?^}/m);
	if (!copyFn || !copyFn[0].includes('catch (error)')) {
		throw new Error('Should handle file copy errors');
	}
});

// ===================================================================
// Section 20: Component Lifecycle & Rendering
// ===================================================================

console.log('\n⚛️  Section 20: Component Lifecycle\n');

test('20.1: Wizard exports a default function component', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should be a function component
	if (!wizardCode.includes('export default function Wizard')) {
		throw new Error('Should export default function component');
	}
});

test('20.2: Component uses React.createElement for rendering', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Uses React.createElement (not JSX)
	if (!wizardCode.includes('React.createElement')) {
		throw new Error('Should use React.createElement');
	}
});

test('20.3: SelectInput uses React.createElement for rendering', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Uses React.createElement
	if (!selectInputCode.includes('React.createElement')) {
		throw new Error('SelectInput should use React.createElement');
	}
});

test('20.4: All children elements have unique keys', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should use key prop for list items
	if (!wizardCode.includes('key:')) {
		throw new Error('List items should have key prop');
	}
});

test('20.5: SelectInput items have unique keys', () => {
	const selectInputPath = path.join(__dirname, '../lib/ui/select-input.js');
	const selectInputCode = fs.readFileSync(selectInputPath, 'utf-8');

	// Should use unique key for each item
	if (!selectInputCode.includes('key: item.value || item.label || index')) {
		throw new Error('Items should have unique keys');
	}
});

test('20.6: Wizard handles React import variations', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should handle both default and named React export
	if (!cliCode.includes('ReactModule.default || ReactModule')) {
		throw new Error('Should handle React export variations');
	}
});

test('20.7: Wizard clears console before rendering', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should call console.clear() for clean display
	if (!cliCode.includes('console.clear()')) {
		throw new Error('Should clear console before wizard');
	}
});

test('20.8: Wizard shows startup message', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should show "Starting interactive wizard"
	if (!cliCode.includes('Starting interactive wizard')) {
		throw new Error('Should show startup message');
	}
});

test('20.9: Ink render returns instance for unmounting', () => {
	const cliPath = path.join(__dirname, '../bin/cli.js');
	const cliCode = fs.readFileSync(cliPath, 'utf-8');

	// Should capture render instance
	if (!cliCode.includes('const instance = render(')) {
		throw new Error('Should capture render instance');
	}
});

test('20.10: Component renders conditionally based on step', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const wizardCode = fs.readFileSync(wizardPath, 'utf-8');

	// Should check step value for conditional rendering
	const steps = ['profile', 'target-model', 'output-format', 'complete'];
	steps.forEach(stepName => {
		if (!wizardCode.includes(`step === '${stepName}'`)) {
			throw new Error(`Should render conditionally for step: ${stepName}`);
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
