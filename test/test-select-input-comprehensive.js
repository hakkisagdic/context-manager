// test/test-select-input-comprehensive.js
const assert = require('assert');
const { render } = require('ink-testing-library');
const SelectInput = require('../path/to/your/SelectInput'); // Update with the correct path to your component

describe('SelectInput Component', () => {
    it('renders the SelectInput with default options', () => {
        const { lastFrame } = render(<SelectInput options={['Option 1', 'Option 2']} />);
        assert(lastFrame().includes('Option 1'));
        assert(lastFrame().includes('Option 2'));
    });

    it('handles user selection', () => {
        const { lastFrame, stdin } = render(<SelectInput options={['Option 1', 'Option 2']} />);
        
        // Simulate user input
        stdin.write('1');
        stdin.write('\n');

        const updatedFrame = lastFrame();
        assert(updatedFrame.includes('You selected: Option 1'));
    });

    it('displays error message when invalid selection is made', () => {
        const { lastFrame, stdin } = render(<SelectInput options={['Option 1', 'Option 2']} />);
        
        // Simulate invalid input
        stdin.write('invalid');
        stdin.write('\n');

        const updatedFrame = lastFrame();
        assert(updatedFrame.includes('Invalid selection. Please try again.'));
    });
});