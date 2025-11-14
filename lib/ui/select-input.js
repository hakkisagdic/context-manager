import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useStdin } from 'ink';
import TextInput from 'ink-text-input';

/**
 * Advanced SelectInput Component for Ink 6.x
 * Replaces deprecated ink-select-input package with enhanced features
 *
 * Features:
 * - Keyboard navigation with arrow keys
 * - Search/filter functionality
 * - Multi-select mode
 * - Disabled options
 * - Option grouping
 * - Custom rendering
 * - Custom key bindings
 *
 * @param {Array} items - Array of {label, value, isDisabled?, group?} objects
 * @param {Function} onSelect - Callback when item is selected (item or items array in multi-select)
 * @param {number} initialIndex - Initial selected index (default: 0)
 * @param {boolean} searchable - Enable search/filter (default: false)
 * @param {boolean} multiSelect - Enable multi-select mode (default: false)
 * @param {Function} renderItem - Custom item renderer (item, isSelected) => string
 * @param {Object} keyBindings - Custom key bindings {up, down, select, cancel, toggle}
 * @param {Array} itemGroups - Array of {title, items} for grouped display
 * @param {string} searchPlaceholder - Placeholder for search input (default: "Search...")
 */
export default function SelectInput({
	items = [],
	onSelect,
	initialIndex = 0,
	searchable = false,
	multiSelect = false,
	renderItem,
	keyBindings,
	itemGroups,
	searchPlaceholder = "Search..."
}) {
	const [selectedIndex, setSelectedIndex] = useState(initialIndex);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedItems, setSelectedItems] = useState(new Set());
	const { isRawModeSupported } = useStdin();

	// Default key bindings
	const defaultKeyBindings = {
		up: 'upArrow',
		down: 'downArrow',
		select: 'return',
		cancel: 'escape',
		toggle: 'space' // For multi-select
	};

	const keys = { ...defaultKeyBindings, ...keyBindings };

	// Process items - handle both itemGroups and flat items
	const processedItems = useMemo(() => {
		if (itemGroups && itemGroups.length > 0) {
			// Flatten groups into items with group info
			return itemGroups.flatMap(group =>
				(group.items || []).map(item => ({
					...item,
					group: group.title
				}))
			);
		}
		return items;
	}, [items, itemGroups]);

	// Filter items based on search query
	const filteredItems = useMemo(() => {
		if (!searchable || !searchQuery) {
			return processedItems;
		}

		const query = searchQuery.toLowerCase();
		return processedItems.filter(item => {
			const label = (item.label || '').toLowerCase();
			const value = (item.value || '').toString().toLowerCase();
			return label.includes(query) || value.includes(query);
		});
	}, [processedItems, searchQuery, searchable]);

	// Get enabled items for navigation
	const enabledIndices = useMemo(() => {
		return filteredItems
			.map((item, index) => item.isDisabled ? -1 : index)
			.filter(index => index !== -1);
	}, [filteredItems]);

	// Navigate to next enabled item
	const navigateUp = useCallback(() => {
		if (enabledIndices.length === 0) return;

		const currentPos = enabledIndices.indexOf(selectedIndex);
		const nextPos = currentPos <= 0 ? enabledIndices.length - 1 : currentPos - 1;
		setSelectedIndex(enabledIndices[nextPos]);
	}, [selectedIndex, enabledIndices]);

	const navigateDown = useCallback(() => {
		if (enabledIndices.length === 0) return;

		const currentPos = enabledIndices.indexOf(selectedIndex);
		const nextPos = currentPos >= enabledIndices.length - 1 ? 0 : currentPos + 1;
		setSelectedIndex(enabledIndices[nextPos]);
	}, [selectedIndex, enabledIndices]);

	// Handle item selection
	const handleSelect = useCallback(() => {
		if (filteredItems.length === 0) return;

		const item = filteredItems[selectedIndex];
		if (!item || item.isDisabled) return;

		if (multiSelect) {
			// Toggle selection
			const newSelected = new Set(selectedItems);
			if (newSelected.has(item.value)) {
				newSelected.delete(item.value);
			} else {
				newSelected.add(item.value);
			}
			setSelectedItems(newSelected);
		} else {
			// Single select
			if (onSelect && typeof onSelect === 'function') {
				onSelect(item);
			}
		}
	}, [filteredItems, selectedIndex, multiSelect, selectedItems, onSelect]);

	// Confirm multi-select
	const confirmMultiSelect = useCallback(() => {
		if (multiSelect && onSelect && typeof onSelect === 'function') {
			const selected = filteredItems.filter(item => selectedItems.has(item.value));
			onSelect(selected);
		}
	}, [multiSelect, filteredItems, selectedItems, onSelect]);

	// Input handler
	useInput(useCallback((input, key) => {
		// Skip input handling when in search mode
		if (searchable && !key.return && !key.escape && !(key.ctrl && input === 'c')) {
			return;
		}

		// Prevent navigation if items array is empty
		if (filteredItems.length === 0) {
			return;
		}

		// Navigation
		if ((keys.up === 'upArrow' && key.upArrow) ||
		    (keys.up !== 'upArrow' && input === keys.up)) {
			navigateUp();
		}

		if ((keys.down === 'downArrow' && key.downArrow) ||
		    (keys.down !== 'downArrow' && input === keys.down)) {
			navigateDown();
		}

		// Selection
		if ((keys.select === 'return' && key.return) ||
		    (keys.select !== 'return' && input === keys.select)) {
			if (multiSelect) {
				confirmMultiSelect();
			} else {
				handleSelect();
			}
		}

		// Toggle in multi-select mode
		if (multiSelect &&
		    ((keys.toggle === 'space' && input === ' ') ||
		     (keys.toggle !== 'space' && input === keys.toggle))) {
			handleSelect();
		}

		// Cancel
		if ((keys.cancel === 'escape' && key.escape) ||
		    (keys.cancel !== 'escape' && input === keys.cancel) ||
		    (key.ctrl && input === 'c')) {
			process.exit(0);
		}
	}, [filteredItems, navigateUp, navigateDown, handleSelect, confirmMultiSelect,
	    multiSelect, searchable, keys]), { isActive: isRawModeSupported });

	// Handle empty items array
	if (processedItems.length === 0) {
		return React.createElement(Box, { flexDirection: 'column' },
			React.createElement(Text, { dimColor: true }, '(No items available)')
		);
	}

	// Render search input
	const renderSearch = () => {
		if (!searchable) return null;

		return React.createElement(Box, {
			key: 'search-box',
			flexDirection: 'column',
			marginBottom: 1
		},
			React.createElement(Text, { key: 'search-label', dimColor: true }, '🔍 Search: '),
			React.createElement(TextInput, {
				key: 'search-input',
				value: searchQuery,
				onChange: setSearchQuery,
				placeholder: searchPlaceholder
			})
		);
	};

	// Render items with grouping
	const renderItems = () => {
		if (filteredItems.length === 0) {
			return React.createElement(Text, {
				key: 'no-items',
				dimColor: true
			}, 'No matching items');
		}

		const elements = [];
		let lastGroup = null;

		filteredItems.forEach((item, index) => {
			// Add group header if this is a grouped list
			if (itemGroups && item.group && item.group !== lastGroup) {
				elements.push(
					React.createElement(Text, {
						key: `group-${item.group}`,
						bold: true,
						color: 'yellow',
						dimColor: true
					}, `\n${item.group}:`)
				);
				lastGroup = item.group;
			}

			const isSelected = index === selectedIndex;
			const isChecked = multiSelect && selectedItems.has(item.value);

			// Replace newlines with spaces to avoid rendering issues
			const label = (item.label || '').replace(/\n/g, ' ');

			// Custom rendering
			let displayText;
			if (renderItem && typeof renderItem === 'function') {
				displayText = renderItem(item, isSelected, isChecked);
			} else {
				// Default rendering
				const cursor = isSelected ? '❯ ' : '  ';
				const checkbox = multiSelect ? (isChecked ? '[✓] ' : '[ ] ') : '';
				const prefix = cursor + checkbox;
				displayText = `${prefix}${label}`;
			}

			elements.push(
				React.createElement(Text, {
					key: `item-${index}-${item.value || item.label || 'empty'}`,
					color: isSelected ? 'cyan' : (item.isDisabled ? 'gray' : undefined),
					dimColor: item.isDisabled
				}, displayText)
			);
		});

		return elements;
	};

	// Render help text
	const renderHelp = () => {
		const hints = [];

		if (multiSelect) {
			hints.push('[Space] Toggle');
			hints.push('[Enter] Confirm');
		} else {
			hints.push('[Enter] Select');
		}

		if (searchable) {
			hints.push('[Type] Search');
		}

		hints.push('[Esc] Cancel');

		return React.createElement(Box, {
			key: 'help-text',
			marginTop: 1
		},
			React.createElement(Text, { key: 'help-hints', dimColor: true }, hints.join('  '))
		);
	};

	// Main render
	const children = [
		renderSearch(),
		...renderItems(),
		renderHelp()
	].filter(Boolean); // Remove null values

	return React.createElement(Box, { flexDirection: 'column' }, ...children);
}
