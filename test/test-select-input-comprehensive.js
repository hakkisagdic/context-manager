// Comprehensive tests for the SelectInput Component

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import SelectInput from '../path/to/SelectInput'; // Adjust the import path as necessary

describe('SelectInput Component', () => {
    test('renders correctly with options', () => {
        render(<SelectInput options={[{ value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }]} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    test('calls onChange when option is selected', () => {
        const handleChange = jest.fn();
        render(<SelectInput options={[{ value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }]} onChange={handleChange} />);
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
        expect(handleChange).toHaveBeenCalledWith('2');
    });

    test('displays placeholder when no option is selected', () => {
        render(<SelectInput options={[{ value: '1', label: 'Option 1' }]} placeholder="Select an option" />);
        expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    test('renders disabled state correctly', () => {
        render(<SelectInput options={[{ value: '1', label: 'Option 1' }]} disabled />);
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    test('renders error message when provided', () => {
        render(<SelectInput options={[{ value: '1', label: 'Option 1' }]} error="There is an error" />);
        expect(screen.getByText('There is an error')).toBeInTheDocument();
    });
});