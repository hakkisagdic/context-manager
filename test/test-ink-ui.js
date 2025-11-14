#!/usr/bin/env node
/**
 * Interactive Ink UI Test Screen
 * Demonstrates all Ink components and features
 */

async function main() {
    try {
        console.log('🎨 Loading Ink UI Test Screen...\n');

        // Import React and Ink
        const { default: React } = await import('react');
        const inkModule = await import('ink');
        const { render, Box, Text, Newline } = inkModule;
        const { default: SelectInput } = await import('../lib/ui/select-input.js');
        const { default: Spinner } = await import('ink-spinner');
        const { default: TextInput } = await import('ink-text-input');
        const { default: Wizard } = await import('../lib/ui/wizard.js');
        const { default: Dashboard } = await import('../lib/ui/dashboard.js');

        console.log('✅ Dependencies loaded successfully!\n');

        // Simple Test Menu Component
        const TestMenu = () => {
            const [screen, setScreen] = React.useState('menu');
            const [inputValue, setInputValue] = React.useState('');

            const menuItems = [
                { label: '🎨 Test Colors', value: 'colors' },
                { label: '📊 Test Progress Bar', value: 'progress' },
                { label: '🔄 Test Spinners', value: 'spinner' },
                { label: '📝 Test Input', value: 'input' },
                { label: '🧙 Test Wizard', value: 'wizard' },
                { label: '📈 Test Dashboard', value: 'dashboard' },
                { label: '❌ Exit', value: 'exit' }
            ];

            const handleSelect = (item) => {
                if (item.value === 'exit') {
                    process.exit(0);
                }
                setScreen(item.value);
            };

            // Main Menu
            if (screen === 'menu') {
                return React.createElement(Box, {
                    flexDirection: 'column',
                    padding: 1,
                    borderStyle: 'double',
                    borderColor: 'cyan'
                },
                    React.createElement(Text, { bold: true, color: 'cyan' }, '🎨 Ink UI Test Screen'),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, 'Select a test to run:'),
                    React.createElement(Newline),
                    React.createElement(SelectInput, {
                        items: menuItems,
                        onSelect: handleSelect
                    }),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, '[↑↓] Navigate  [Enter] Select  [Q] Quit')
                );
            }

            // Colors Test
            if (screen === 'colors') {
                return React.createElement(Box, {
                    flexDirection: 'column',
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'green'
                },
                    React.createElement(Text, { bold: true, color: 'green' }, '🌈 Color Test'),
                    React.createElement(Newline),
                    React.createElement(Text, { color: 'red' }, '🔴 Red Text'),
                    React.createElement(Text, { color: 'green' }, '🟢 Green Text'),
                    React.createElement(Text, { color: 'yellow' }, '🟡 Yellow Text'),
                    React.createElement(Text, { color: 'blue' }, '🔵 Blue Text'),
                    React.createElement(Text, { color: 'magenta' }, '🟣 Magenta Text'),
                    React.createElement(Text, { color: 'cyan' }, '🔷 Cyan Text'),
                    React.createElement(Newline),
                    React.createElement(Text, { bold: true }, '✨ Bold'),
                    React.createElement(Text, { dimColor: true }, ' 🌑 Dim'),
                    React.createElement(Newline),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, 'Press [Q] to exit, [M] for menu (not implemented)')
                );
            }

            // Progress Bar Test
            if (screen === 'progress') {
                const [prog, setProg] = React.useState(0);

                React.useEffect(() => {
                    const interval = setInterval(() => {
                        setProg(p => {
                            if (p >= 100) {
                                clearInterval(interval);
                                return 100;
                            }
                            return p + 5;
                        });
                    }, 200);

                    return () => clearInterval(interval);
                }, []);

                const barLength = Math.round((prog / 100) * 40);
                const status = prog === 100 ? '✅ Complete!' : '⏳ Processing...';

                return React.createElement(Box, {
                    flexDirection: 'column',
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow'
                },
                    React.createElement(Text, { bold: true, color: 'yellow' }, '📈 Progress Bar Test'),
                    React.createElement(Newline),
                    React.createElement(Text, null, `Progress: ${prog}%`),
                    React.createElement(Box, null,
                        React.createElement(Text, { color: 'green' }, '▓'.repeat(barLength)),
                        React.createElement(Text, { color: 'gray' }, '░'.repeat(40 - barLength))
                    ),
                    React.createElement(Text, { dimColor: true }, status),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, 'Press [Q] to exit')
                );
            }

            // Spinner Test
            if (screen === 'spinner') {
                return React.createElement(Box, {
                    flexDirection: 'column',
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'blue'
                },
                    React.createElement(Text, { bold: true, color: 'blue' }, '🔄 Spinner Test'),
                    React.createElement(Newline),
                    React.createElement(Box, null,
                        React.createElement(Spinner, { type: 'dots' }),
                        React.createElement(Text, null, ' Scanning files...')
                    ),
                    React.createElement(Box, null,
                        React.createElement(Spinner, { type: 'line' }),
                        React.createElement(Text, null, ' Calculating tokens...')
                    ),
                    React.createElement(Box, null,
                        React.createElement(Text, { color: 'green' }, '✓ '),
                        React.createElement(Text, null, 'Analysis complete!')
                    ),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, 'Press [Q] to exit')
                );
            }

            // Text Input Test
            if (screen === 'input') {
                return React.createElement(Box, {
                    flexDirection: 'column',
                    padding: 1,
                    borderStyle: 'round',
                    borderColor: 'magenta'
                },
                    React.createElement(Text, { bold: true, color: 'magenta' }, '📝 Text Input Test'),
                    React.createElement(Newline),
                    React.createElement(Text, null, 'Enter your name:'),
                    React.createElement(TextInput, {
                        value: inputValue,
                        onChange: setInputValue,
                        placeholder: 'Type here...'
                    }),
                    inputValue && React.createElement(Box, { marginTop: 1 },
                        React.createElement(Text, null, 'Hello, '),
                        React.createElement(Text, { bold: true, color: 'cyan' }, inputValue),
                        React.createElement(Text, null, '! 👋')
                    ),
                    React.createElement(Newline),
                    React.createElement(Text, { dimColor: true }, 'Press [Q] to exit')
                );
            }

            // Wizard Test
            if (screen === 'wizard') {
                const wizardComponents = {
                    Box: inkModule.Box,
                    Text: inkModule.Text,
                    SelectInput
                };

                return React.createElement(Wizard, {
                    components: wizardComponents,
                    onComplete: (answers) => {
                        console.log('\n✅ Wizard completed:', answers);
                        setScreen('menu');
                    }
                });
            }

            // Dashboard Test
            if (screen === 'dashboard') {
                const mockStats = {
                    totalFiles: 64,
                    totalTokens: 181480,
                    totalBytes: 782336,
                    totalLines: 28721,
                    byExtension: { '.js': { count: 64, tokens: 181480 } }
                };

                const dashboardComponents = {
                    Box: inkModule.Box,
                    Text: inkModule.Text,
                    useInput: inkModule.useInput
                };

                return React.createElement(Dashboard, {
                    stats: mockStats,
                    topFiles: [
                        { name: 'server.js', tokens: 12388 },
                        { name: 'handler.js', tokens: 11007 },
                        { name: 'security.js', tokens: 7814 }
                    ],
                    status: 'complete',
                    components: dashboardComponents
                });
            }

            return React.createElement(Text, null, 'Unknown screen: ' + screen);
        };

        // Render
        console.log('📋 Controls:');
        console.log('  [↑↓] Navigate');
        console.log('  [Enter] Select');
        console.log('  [Q] Quit\n');
        console.log('Starting UI...\n');

        render(React.createElement(TestMenu));

    } catch (error) {
        console.error('\n❌ Ink UI Test Failed!\n');
        console.error('Error:', error.message);
        console.error('\nMake sure Ink dependencies are installed:');
        console.error('  npm install ink react ink-spinner ink-text-input\n');

        if (error.stack) {
            console.error('Stack trace:');
            console.error(error.stack);
        }

        process.exit(1);
    }
}

main();
