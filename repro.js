import TokenUtils from './lib/utils/token-utils.js';

console.log('Testing TokenUtils.calculate...');

const content = 'function test() { return 42; }';
const filePath = 'test.js';

try {
    const tokens = TokenUtils.calculate(content, filePath);
    console.log(`Tokens: ${tokens} (Type: ${typeof tokens})`);
} catch (error) {
    console.error('Error:', error);
}

console.log('Testing estimate...');
const estimated = TokenUtils.estimate(content, filePath);
console.log(`Estimated: ${estimated} (Type: ${typeof estimated})`);
