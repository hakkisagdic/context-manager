import React from 'react';

/**
 * Format seconds to human-readable time
 */
const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

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
 * - barWidth: Width of progress bar (default: 40, 'auto' for terminal width)
 * - asciiMode: Use ASCII characters instead of Unicode (default: false)
 * - startTime: Start timestamp for speed/ETA calculation (milliseconds)
 * - showSpeed: Show speed and ETA (default: false)
 * - animationFrame: Animation frame number for indeterminate mode (default: 0)
 * - adaptToTerminal: Adapt bar width to terminal width (default: false)
 * - onComplete: Callback when progress reaches 100%
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
    startTime,
    showSpeed = false,
    animationFrame = 0,
    adaptToTerminal = false,
    onComplete,
    components
}) => {
    const { Box, Text } = components || {};

    if (!Box || !Text) {
        throw new Error('Box and Text components required in props');
    }

    // Terminal width adaptation
    let effectiveBarWidth = barWidth;
    if (adaptToTerminal && typeof process !== 'undefined' && process.stdout && process.stdout.columns) {
        // Reserve space for other UI elements (percentage, file count, etc.)
        // Typical: "[bar] 100% (999/999 files)" = ~30 chars + bar
        effectiveBarWidth = Math.max(20, Math.min(process.stdout.columns - 30, 100));
    } else if (barWidth === 'auto') {
        effectiveBarWidth = 40; // fallback
    }

    // Determine if in indeterminate mode
    const isIndeterminate = current === null || current === undefined || total === null || total === undefined;

    // Character sets for progress bar
    const chars = asciiMode
        ? { filled: '=', empty: '-', indeterminate: '~' }
        : { filled: '━', empty: '─', indeterminate: '⋯' };

    let bar, percentage, fileCountText;

    // Speed and ETA calculation
    let speed = 0;
    let eta = null;
    if (showSpeed && startTime && !isIndeterminate && current > 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds > 0) {
            speed = current / elapsedSeconds; // files per second
            const remaining = total - current;
            if (remaining > 0 && speed > 0) {
                eta = remaining / speed; // seconds
            }
        }
    }

    if (isIndeterminate) {
        // Indeterminate mode: show pulsing/animated bar with animation
        if (animationFrame > 0) {
            // Animated pattern: shift the indeterminate character
            const fullPattern = chars.indeterminate.repeat(effectiveBarWidth + 5);
            const startPos = animationFrame % 5;
            bar = fullPattern.substring(startPos, startPos + effectiveBarWidth);
        } else {
            bar = chars.indeterminate.repeat(effectiveBarWidth);
        }
        percentage = '...';
        fileCountText = current !== null && current !== undefined
            ? `(${current} files)`
            : '(processing...)';
    } else {
        // Normal mode: show percentage-based progress
        percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const filled = Math.min(Math.round((percentage / 100) * effectiveBarWidth), effectiveBarWidth);
        const empty = Math.max(effectiveBarWidth - filled, 0);
        bar = chars.filled.repeat(filled) + chars.empty.repeat(empty);
        fileCountText = `(${current}/${total} files)`;

        // Call onComplete callback when reaching 100%
        if (percentage === 100 && onComplete && typeof onComplete === 'function') {
            // Use setTimeout to avoid calling during render
            setTimeout(() => onComplete(), 0);
        }
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

    // Speed and ETA display
    if (showSpeed && speed > 0) {
        const speedText = speed < 1
            ? `${(speed * 60).toFixed(1)} files/min`
            : `${speed.toFixed(1)} files/sec`;

        const etaText = eta !== null ? ` • ETA: ${formatTime(eta)}` : '';

        children.push(
            React.createElement(Box, { key: 'speed', marginTop: 1 },
                React.createElement(Text, { color: 'cyan' }, '⚡ '),
                React.createElement(Text, { color: 'gray' }, speedText),
                eta !== null && React.createElement(Text, { color: 'gray' }, etaText)
            )
        );
    }

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

export { ProgressBar, SpinnerWithText, formatTime };
