import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import SelectInput from './select-input.js';

/**
 * Interactive Configuration Wizard
 * Guides users through context generation setup
 */
export default function Wizard({ onComplete }) {
	const [step, setStep] = useState('use-case');
	const [answers, setAnswers] = useState({});

	const useCaseItems = [
		{ label: '🐛 Bug Fix', value: 'bug-fix' },
		{ label: '✨ New Feature', value: 'feature' },
		{ label: '👀 Code Review', value: 'code-review' },
		{ label: '♻️  Refactoring', value: 'refactoring' },
		{ label: '🔒 Security Audit', value: 'security' },
		{ label: '📚 Documentation', value: 'documentation' },
		{ label: '⚙️  Custom', value: 'custom' }
	];

	const targetModelItems = [
		{ label: 'Claude Opus (200k tokens)', value: 'claude-opus' },
		{ label: 'Claude Sonnet (200k tokens)', value: 'claude-sonnet' },
		{ label: 'GPT-4 Turbo (128k tokens)', value: 'gpt-4-turbo' },
		{ label: 'GPT-4 (8k tokens)', value: 'gpt-4' },
		{ label: 'Gemini Pro (1M tokens)', value: 'gemini-pro' },
		{ label: 'Custom', value: 'custom' }
	];

	const outputFormatItems = [
		{ label: 'TOON (most efficient, 40-50% reduction)', value: 'toon' },
		{ label: 'JSON (standard format)', value: 'json' },
		{ label: 'GitIngest (single file)', value: 'gitingest' },
		{ label: 'Markdown (documentation)', value: 'markdown' },
		{ label: 'YAML (human-readable)', value: 'yaml' },
		{ label: 'CSV (spreadsheet)', value: 'csv' }
	];

	const handleUseCaseSelect = useCallback((item) => {
		setAnswers(prev => ({ ...prev, useCase: item.value }));
		setStep('target-model');
	}, []);

	const handleTargetModelSelect = useCallback((item) => {
		setAnswers(prev => ({ ...prev, targetModel: item.value }));
		setStep('output-format');
	}, []);

	const handleOutputFormatSelect = useCallback((item) => {
		const finalAnswers = { ...answers, outputFormat: item.value };
		setAnswers(finalAnswers);
		setStep('complete');

		// Call completion callback
		if (onComplete) {
			onComplete(finalAnswers);
		}
	}, [answers, onComplete]);

	// Build children array and filter out falsy values
	const children = [
		React.createElement(Box, { key: 'title', marginBottom: 1 },
			React.createElement(Text, { bold: true, color: 'cyan' }, '🧙 Context Generation Wizard')
		)
	];

	// Step 1: Use Case
	if (step === 'use-case') {
		children.push(
			React.createElement(Box, { key: 'use-case-step', flexDirection: 'column' },
				React.createElement(Box, { key: 'question-box', marginBottom: 1 },
					React.createElement(Text, null, 'What are you working on today?')
				),
				React.createElement(SelectInput, {
					key: 'select-input',
					items: useCaseItems,
					onSelect: handleUseCaseSelect
				}),
				React.createElement(Box, { key: 'help-box', marginTop: 1 },
					React.createElement(Text, { dimColor: true }, '[↑↓] Navigate  [Enter] Select  [Esc] Cancel')
				)
			)
		);
	}

	// Step 2: Target Model
	if (step === 'target-model') {
		children.push(
			React.createElement(Box, { key: 'target-model-step', flexDirection: 'column' },
				React.createElement(Box, { key: 'question-box-2', marginBottom: 1 },
					React.createElement(Text, null, 'Target LLM?')
				),
				React.createElement(SelectInput, {
					key: 'select-input-2',
					items: targetModelItems,
					onSelect: handleTargetModelSelect
				}),
				React.createElement(Box, { key: 'help-box-2', marginTop: 1 },
					React.createElement(Text, { dimColor: true }, '[↑↓] Navigate  [Enter] Select  [Esc] Cancel')
				)
			)
		);
	}

	// Step 3: Output Format
	if (step === 'output-format') {
		children.push(
			React.createElement(Box, { key: 'output-format-step', flexDirection: 'column' },
				React.createElement(Box, { key: 'question-box-3', marginBottom: 1 },
					React.createElement(Text, null, 'Output format?')
				),
				React.createElement(SelectInput, {
					key: 'select-input-3',
					items: outputFormatItems,
					onSelect: handleOutputFormatSelect
				}),
				React.createElement(Box, { key: 'help-box-3', marginTop: 1 },
					React.createElement(Text, { dimColor: true }, '[↑↓] Navigate  [Enter] Select  [Esc] Cancel')
				)
			)
		);
	}

	// Complete
	if (step === 'complete') {
		children.push(
			React.createElement(Box, { key: 'complete-step', flexDirection: 'column' },
				React.createElement(Box, { marginBottom: 1 },
					React.createElement(Text, { bold: true, color: 'green' }, '✓ Configuration Complete!')
				),
				React.createElement(Box, { flexDirection: 'column' },
					React.createElement(Text, null, `Use Case: ${answers.useCase}`),
					React.createElement(Text, null, `Target Model: ${answers.targetModel}`),
					React.createElement(Text, null, `Output Format: ${answers.outputFormat}`)
				)
			)
		);
	}

	return React.createElement(Box, {
		flexDirection: 'column',
		padding: 1,
		borderStyle: 'round',
		borderColor: 'cyan',
		width: 76
	}, ...children);
}
