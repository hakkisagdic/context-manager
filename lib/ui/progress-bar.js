import React from 'react';

/**
 * Progress Bar Component for Ink Terminal UI
 * Shows analysis progress with file count and token count
 *
 * Props:
 * - current: Current progress value (null for indeterminate mode)
 * - total: Total target value (null for indeterminate mode)
 * - tokens: Current token count
 * - maxTokens: Maximum token count (0 for unlimited)
 * - currentFile: Currently processing file path
 * - barWidth: Width of progress bar (default: 40)
 * - asciiMode: Use ASCII characters instead of Unicode (default: false)
 * - components: { Box, Text } - Required Ink components
 *
 * Note: Components are passed via props to avoid ESM import issues
 */
const ProgressBar = ({
    current,
    total,
    tokens = 0,
    maxTokens = 0,
    currentFile,
    barWidth = 40,
    asciiMode = false,
    components
}) => {
    const { Box, Text } = components || {};

    if (!Box || !Text) {
        throw new Error('Box and Text components required in props');
    }

    // Determine if in indeterminate mode
    const isIndeterminate = current === null || current === undefined || total === null || total === undefined;

    // Character sets for progress bar
    const chars = asciiMode
        ? { filled: '=', empty: '-', indeterminate: '~' }
        : { filled: '━', empty: '─', indeterminate: '⋯' };

    let bar, percentage, fileCountText;

    if (isIndeterminate) {
        // Indeterminate mode: show pulsing/animated bar
        const indeterminatePattern = chars.indeterminate.repeat(barWidth);
        bar = indeterminatePattern;
        percentage = '...';
        fileCountText = current !== null && current !== undefined
            ? `(${current} files)`
            : '(processing...)';
    } else {
        // Normal mode: show percentage-based progress
        percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const filled = Math.min(Math.round((percentage / 100) * barWidth), barWidth);
        const empty = Math.max(barWidth - filled, 0);
        bar = chars.filled.repeat(filled) + chars.empty.repeat(empty);
        fileCountText = `(${current}/${total} files)`;
    }

    const tokenPercentage = maxTokens > 0 ? ((tokens / maxTokens) * 100).toFixed(1) : 0;

    const children = [];

    // Title
    children.push(
        React.createElement(Box, { key: 'title' },
            React.createElement(Text, { bold: true, color: 'cyan' }, '📊 Project Analysis')
        )
    );

    // Progress bar
    const barColor = isIndeterminate ? 'cyan' : 'green';
    const percentageText = isIndeterminate ? ` ${percentage}` : ` ${percentage}%`;

    children.push(
        React.createElement(Box, { key: 'bar', marginTop: 1 },
            React.createElement(Text, { color: barColor }, bar),
            React.createElement(Text, { color: 'yellow' }, percentageText),
            React.createElement(Text, { color: 'gray' }, ` ${fileCountText}`)
        )
    );

    // Current file
    if (currentFile) {
        children.push(
            React.createElement(Box, { key: 'current', marginTop: 1 },
                React.createElement(Text, { color: 'gray' }, 'Current: '),
                React.createElement(Text, null, currentFile)
            )
        );
    }

    // Tokens
    const tokenColor = tokenPercentage > 90 ? 'red' : 'green';
    const tokenChildren = [
        React.createElement(Text, { key: 't1', color: 'gray' }, 'Tokens: '),
        React.createElement(Text, { key: 't2', color: tokenColor }, tokens.toLocaleString())
    ];

    if (maxTokens > 0) {
        tokenChildren.push(
            React.createElement(Text, { key: 't3', color: 'gray' },
                ` / ${maxTokens.toLocaleString()} (${tokenPercentage}%)`)
        );
    }

    children.push(
        React.createElement(Box, { key: 'tokens', marginTop: 1 }, ...tokenChildren)
    );

    return React.createElement(Box, { flexDirection: 'column' }, ...children);
};

/**
 * Spinner Component with message
 */
const SpinnerWithText = ({ text, status = 'pending', components }) => {
    const { Box, Text, Spinner } = components || {};

    if (!Box || !Text) {
        throw new Error('Box and Text components required in props');
    }

    const statusIcons = {
        pending: '○',
        active: Spinner ? React.createElement(Spinner, { type: 'dots' }) : '⏳',
        complete: '✓',
        error: '✗'
    };

    const statusColors = {
        pending: 'gray',
        active: 'cyan',
        complete: 'green',
        error: 'red'
    };

    const icon = status === 'active' && Spinner
        ? React.createElement(Spinner, { type: 'dots' })
        : statusIcons[status];

    return React.createElement(Box, null,
        React.createElement(Text, { color: statusColors[status] },
            icon,
            ' ',
            text
        )
    );
};

export { ProgressBar, SpinnerWithText };
