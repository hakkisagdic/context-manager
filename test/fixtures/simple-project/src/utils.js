// Utility functions

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function sum(numbers) {
    return numbers.reduce((acc, n) => acc + n, 0);
}

export const PI = 3.14159;
