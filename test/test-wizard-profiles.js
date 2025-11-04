/**
 * Test wizard profiles system
 * Tests profile discovery, metadata parsing, file copying, and named configs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Wizard Profiles System...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
	try {
		fn();
		console.log(`✅ ${name}`);
		passed++;
	} catch (error) {
		console.log(`❌ ${name}`);
		console.log(`   Error: ${error.message}`);
		failed++;
	}
}

// Test 1: Check if .context-manager/wizard-profiles directory exists
test('.context-manager/wizard-profiles directory exists', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	if (!fs.existsSync(profilesDir)) {
		throw new Error('.context-manager/wizard-profiles directory not found');
	}
});

// Test 2: Check all 6 profiles exist
test('All 6 wizard profiles exist', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const expectedProfiles = [
		'code-review',
		'security-audit',
		'llm-explain',
		'documentation',
		'minimal',
		'full'
	];

	expectedProfiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.existsSync(profilePath)) {
			throw new Error(`Profile '${profile}' not found`);
		}
	});
});

// Test 3: Each profile has 5 required files
test('Each profile has 5 required files', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir);
	const requiredFiles = [
		'profile.json',
		'.contextinclude',
		'.contextignore',
		'.methodinclude',
		'.methodignore'
	];

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.statSync(profilePath).isDirectory()) return;

		requiredFiles.forEach(file => {
			const filePath = path.join(profilePath, file);
			if (!fs.existsSync(filePath)) {
				throw new Error(`${profile}/${file} not found`);
			}
		});
	});
});

// Test 4: profile.json files are valid JSON with required fields
test('profile.json files are valid with required fields', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir);
	const requiredFields = ['id', 'name', 'icon', 'description', 'tokenBudget', 'includes', 'excludes', 'bestFor'];

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.statSync(profilePath).isDirectory()) return;

		const metadataPath = path.join(profilePath, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		requiredFields.forEach(field => {
			if (!(field in metadata)) {
				throw new Error(`${profile}/profile.json missing field '${field}'`);
			}
		});

		// Check ID matches directory name
		if (metadata.id !== profile) {
			throw new Error(`${profile}/profile.json id '${metadata.id}' doesn't match directory name`);
		}
	});
});

// Test 5: Filter files are not empty
test('All filter files have content', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir);
	const filterFiles = ['.contextinclude', '.methodinclude'];

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.statSync(profilePath).isDirectory()) return;

		filterFiles.forEach(file => {
			const filePath = path.join(profilePath, file);
			const content = fs.readFileSync(filePath, 'utf-8');
			// Allow comments but check for actual patterns
			const lines = content.split('\n').filter(line =>
				line.trim() && !line.trim().startsWith('#')
			);
			if (lines.length === 0) {
				throw new Error(`${profile}/${file} has no filter patterns`);
			}
		});
	});
});

// Test 6: Examples directory has backup profiles
test('examples/wizard-profiles backup exists', () => {
	const examplesDir = path.join(__dirname, '../examples/wizard-profiles');
	if (!fs.existsSync(examplesDir)) {
		throw new Error('examples/wizard-profiles directory not found');
	}

	const expectedProfiles = ['code-review', 'security-audit', 'llm-explain', 'documentation', 'minimal', 'full'];
	expectedProfiles.forEach(profile => {
		const profilePath = path.join(examplesDir, profile);
		if (!fs.existsSync(profilePath)) {
			throw new Error(`examples/wizard-profiles/${profile} not found`);
		}
	});
});

// Test 7: examples README exists and mentions profiles
test('examples/README.md documents profiles', () => {
	const readmePath = path.join(__dirname, '../examples/README.md');
	if (!fs.existsSync(readmePath)) {
		throw new Error('examples/README.md not found');
	}

	const content = fs.readFileSync(readmePath, 'utf-8');
	const requiredSections = [
		'Wizard Profiles',
		'Active vs Reference Profiles',
		'Creating Custom Profiles',
		'Profile Switching Workflow'
	];

	requiredSections.forEach(section => {
		if (!content.includes(section)) {
			throw new Error(`examples/README.md missing '${section}' section`);
		}
	});
});

// Test 8: custom-llm-profiles.example.json moved to examples/
test('custom-llm-profiles.example.json in examples/', () => {
	const examplePath = path.join(__dirname, '../examples/custom-llm-profiles.example.json');
	if (!fs.existsSync(examplePath)) {
		throw new Error('examples/custom-llm-profiles.example.json not found');
	}

	// Verify it's valid JSON
	JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
});

// Test 9: wizard.js has required functions
test('wizard.js has profile functions', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const content = fs.readFileSync(wizardPath, 'utf-8');

	const requiredFunctions = [
		'function discoverProfiles()',
		'function copyProfileFiles('
	];

	requiredFunctions.forEach(func => {
		if (!content.includes(func)) {
			throw new Error(`wizard.js missing '${func}'`);
		}
	});
});

// Test 10: wizard.js step changed to 'profile'
test('wizard.js initial step is profile', () => {
	const wizardPath = path.join(__dirname, '../lib/ui/wizard.js');
	const content = fs.readFileSync(wizardPath, 'utf-8');

	if (!content.includes("useState('profile')")) {
		throw new Error('wizard.js initial step should be "profile"');
	}
});

// Test 11: package.json includes .context-manager/ and examples/
test('package.json includes both directories', () => {
	const packagePath = path.join(__dirname, '../package.json');
	const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

	if (!pkg.files || !pkg.files.includes('.context-manager/')) {
		throw new Error('package.json files array missing .context-manager/');
	}

	if (!pkg.files || !pkg.files.includes('examples/')) {
		throw new Error('package.json files array missing examples/');
	}
});

// Test 12: .gitignore properly configured
test('.gitignore ignores named configs', () => {
	const gitignorePath = path.join(__dirname, '../.gitignore');
	const content = fs.readFileSync(gitignorePath, 'utf-8');

	const requiredPatterns = [
		'.contextinclude-*',
		'.contextignore-*',
		'.methodinclude-*',
		'.methodignore-*'
	];

	requiredPatterns.forEach(pattern => {
		if (!content.includes(pattern)) {
			throw new Error(`.gitignore missing pattern '${pattern}'`);
		}
	});
});

// Test 13: CHANGELOG has correct v2.3.8 entry
test('CHANGELOG has wizard profiles v2.3.8 entry', () => {
	const changelogPath = path.join(__dirname, '../docs/CHANGELOG.md');
	const content = fs.readFileSync(changelogPath, 'utf-8');

	if (!content.includes('[2.3.8]')) {
		throw new Error('CHANGELOG.md missing 2.3.8 entry');
	}

	const requiredKeywords = [
		'Wizard Profiles System',
		'Named Configuration System',
		'profile.json',
		'.context-manager/wizard-profiles/',
		'examples/wizard-profiles/'
	];

	requiredKeywords.forEach(keyword => {
		if (!content.includes(keyword)) {
			throw new Error(`CHANGELOG.md v2.3.8 missing keyword '${keyword}'`);
		}
	});
});

// Test 14: Token budgets are consistent across profiles
test('Token budgets follow consistent format', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir);

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.statSync(profilePath).isDirectory()) return;

		const metadataPath = path.join(profilePath, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		if (!metadata.tokenBudget) {
			throw new Error(`${profile} missing tokenBudget`);
		}

		const requiredSizes = ['small', 'medium', 'large'];
		requiredSizes.forEach(size => {
			if (!metadata.tokenBudget[size]) {
				throw new Error(`${profile} tokenBudget missing '${size}'`);
			}
		});
	});
});

// Test 15: Profile icons are emoji
test('Profile icons are emoji characters', () => {
	const profilesDir = path.join(__dirname, '../.context-manager/wizard-profiles');
	const profiles = fs.readdirSync(profilesDir);

	profiles.forEach(profile => {
		const profilePath = path.join(profilesDir, profile);
		if (!fs.statSync(profilePath).isDirectory()) return;

		const metadataPath = path.join(profilePath, 'profile.json');
		const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

		if (!metadata.icon || metadata.icon.length === 0) {
			throw new Error(`${profile} missing icon`);
		}

		// Icons should be single emoji (1-2 characters due to Unicode)
		if (metadata.icon.length > 4) {
			throw new Error(`${profile} icon too long: ${metadata.icon}`);
		}
	});
});

console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
	process.exit(1);
}

console.log('\n🎉 All wizard profiles tests passed!');
