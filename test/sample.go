package main

import (
	"fmt"
	"errors"
)

// Calculator represents a simple calculator
type Calculator struct {
	value int
}

// NewCalculator creates a new Calculator
func NewCalculator() *Calculator {
	return &Calculator{value: 0}
}

// Add adds n to the calculator value
func (c *Calculator) Add(n int) {
	c.value += n
}

// Subtract subtracts n from the calculator value
func (c *Calculator) Subtract(n int) {
	c.value -= n
}

// GetValue returns the current value
func (c Calculator) GetValue() int {
	return c.value
}

// Multiply multiplies two numbers
func Multiply(a, b int) int {
	return a * b
}

// Divide divides two numbers
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("division by zero")
	}
	return a / b, nil
}

// Reader interface for reading operations
type Reader interface {
	Read(p []byte) (n int, err error)
	Close() error
}

// Writer interface for writing operations
type Writer interface {
	Write(p []byte) (n int, err error)
	Flush() error
}

func main() {
	calc := NewCalculator()
	calc.Add(10)
	fmt.Printf("Value: %d\n", calc.GetValue())

	result := Multiply(5, 3)
	fmt.Printf("Result: %d\n", result)
}
