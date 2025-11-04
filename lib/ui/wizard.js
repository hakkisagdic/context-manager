import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import SelectInput from './select-input.js';
import { LLMDetector } from '../utils/llm-detector.js';

/**
 * Interactive Configuration Wizard
 * Guides users through context generation setup
 * v2.3.7 - Dynamic LLM model selection
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

	// Dynamic LLM model list from JSON config
	const targetModelItems = useMemo(() => {
		const models = LLMDetector.getModelList();
		const items = [
			{ label: '✨ Auto-detect from environment', value: 'auto' }
		];

		// Add models grouped by vendor
		const anthropicModels = models.filter(m => m.vendor === 'Anthropic');
		const openaiModels = models.filter(m => m.vendor === 'OpenAI');
		const googleModels = models.filter(m => m.vendor === 'Google');
		const otherModels = models.filter(m => !['Anthropic', 'OpenAI', 'Google'].includes(m.vendor));

		// Anthropic (Claude)
		anthropicModels.forEach(model => {
			const contextK = Math.floor(model.contextWindow / 1000);
			items.push({
				label: `${model.name} (${contextK}k context)`,
				value: model.id
			});
		});

		// OpenAI (GPT-4)
		openaiModels.forEach(model => {
			const contextK = Math.floor(model.contextWindow / 1000);
			items.push({
				label: `${model.name} (${contextK}k context)`,
				value: model.id
			});
		});

		// Google (Gemini)
		googleModels.forEach(model => {
			const contextK = model.contextWindow >= 1000000
				? Math.floor(model.contextWindow / 1000000) + 'M'
				: Math.floor(model.contextWindow / 1000) + 'k';
			items.push({
				label: `${model.name} (${contextK} context)`,
				value: model.id
			});
		});

		// Others
		otherModels.forEach(model => {
			const contextK = Math.floor(model.contextWindow / 1000);
			items.push({
				label: `${model.name} (${contextK}k context)`,
				value: model.id
			});
		});

		return items;
	}, []);

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
		let selectedModel = item.value;

		// Handle auto-detect
		if (selectedModel === 'auto') {
			selectedModel = LLMDetector.detect();
			if (selectedModel === 'unknown') {
				// Fallback to default if detection fails
				selectedModel = 'claude-sonnet-4.5';
			}
		}

		setAnswers(prev => ({ ...prev, targetModel: selectedModel }));
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
