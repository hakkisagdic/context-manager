#!/usr/bin/env node
/**
 * Test script for Wizard functionality
 * Tests if wizard can be instantiated without errors
 */

console.log('🧪 Testing Wizard Initialization...\n');

async function testWizard() {
    try {
        console.log('Step 1: Importing React...');
        const { default: React } = await import('react');
        console.log('✅ React imported successfully');

        console.log('\nStep 2: Importing Ink...');
        const inkModule = await import('ink');
        console.log('✅ Ink imported successfully');
        console.log('   Available components:', Object.keys(inkModule).join(', '));

        console.log('\nStep 3: Importing ink-select-input...');
        const { default: InkSelectInput } = await import('ink-select-input');
        console.log('✅ ink-select-input imported successfully');

        console.log('\nStep 4: Importing Wizard component...');
        const Wizard = require('../lib/ui/wizard');
        console.log('✅ Wizard component loaded');

        console.log('\nStep 5: Creating Wizard instance...');
        const components = {
            Box: inkModule.Box,
            Text: inkModule.Text,
            SelectInput: InkSelectInput
        };

        const wizardElement = React.createElement(Wizard, {
            components,
            onComplete: (answers) => {
                console.log('\n✅ Wizard completed with answers:', answers);
            }
        });

        console.log('✅ Wizard element created successfully');

        console.log('\nStep 6: Testing render (will timeout after 2s)...');

        const instance = inkModule.render(wizardElement);

        // Auto-close after 2 seconds for testing
        setTimeout(() => {
            console.log('\n✅ Wizard rendered successfully!');
            console.log('   Cleaning up...');
            instance.unmount();
            console.log('✅ Test complete!\n');

            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║            Wizard Test: PASSED ✅                      ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log('\nTo use wizard interactively:');
            console.log('  context-manager --wizard\n');

            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nStack trace:', error.stack);

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║            Wizard Test: FAILED ❌                      ║');
        console.log('╚════════════════════════════════════════════════════════╝');

        console.log('\nTo fix:');
        console.log('  npm install ink react ink-select-input\n');

        process.exit(1);
    }
}

testWizard();
