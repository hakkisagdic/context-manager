import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';

/**
 * Custom SelectInput Component for Ink 6.x
 * Replaces deprecated ink-select-input package
 * Based on official Ink examples/select-input implementation
 *
 * @param {Array} items - Array of {label, value} objects
 * @param {Function} onSelect - Callback when item is selected
 * @param {number} initialIndex - Initial selected index (default: 0)
 */
export default function SelectInput({ items = [], onSelect, initialIndex = 0 }) {
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const { isRawModeSupported } = useStdin();

	useInput(useCallback((input, key) => {
		// Prevent navigation if items array is empty
		if (items.length === 0) {
			return;
		}

		if (key.upArrow) {
			setSelectedIndex(prev =>
				prev === 0 ? items.length - 1 : prev - 1
			);
		}

		if (key.downArrow) {
			setSelectedIndex(prev =>
				prev === items.length - 1 ? 0 : prev + 1
			);
		}

		if (key.return) {
			// Validate index is within bounds and item exists
			if (selectedIndex >= 0 && selectedIndex < items.length && items[selectedIndex]) {
				if (onSelect && typeof onSelect === 'function') {
					onSelect(items[selectedIndex]);
				}
			}
		}

		if (key.escape || (key.ctrl && input === 'c')) {
			process.exit(0);
		}
	}, [selectedIndex, items, onSelect]), { isActive: isRawModeSupported });

	// Handle empty items array
	if (items.length === 0) {
		return React.createElement(Box, { flexDirection: 'column' },
			React.createElement(Text, { dimColor: true }, '(No items available)')
		);
	}

	// Show ALL items (no scrolling/limit) - per Ink docs
	return React.createElement(Box, { flexDirection: 'column' },
		...items.map((item, index) => {
			const isSelected = index === selectedIndex;
			// Replace newlines with spaces to avoid rendering issues
			const label = (item.label || '').replace(/\n/g, ' ');

			return React.createElement(Text, {
				key: item.value || item.label || index,  // Use unique value as key
				color: isSelected ? 'cyan' : undefined
			}, `${isSelected ? '❯ ' : '  '}${label}`);
		})
	);
}
