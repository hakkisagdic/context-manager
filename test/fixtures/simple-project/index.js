// Simple test project for CLI testing

function hello(name) {
    return `Hello, ${name}!`;
}

function add(a, b) {
    return a + b;
}

class Calculator {
    multiply(a, b) {
        return a * b;
    }

    divide(a, b) {
        if (b === 0) throw new Error('Division by zero');
        return a / b;
    }
}

module.exports = { hello, add, Calculator };
