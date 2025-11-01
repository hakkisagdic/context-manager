// Sample Rust file for testing method extraction

use std::collections::HashMap;

/// A simple struct
pub struct Calculator {
    value: i32,
}

impl Calculator {
    /// Creates a new Calculator
    pub fn new(initial: i32) -> Self {
        Calculator { value: initial }
    }

    /// Adds a value
    pub fn add(&mut self, x: i32) {
        self.value += x;
    }

    /// Gets the current value
    pub fn get_value(&self) -> i32 {
        self.value
    }

    /// Async method example
    pub async fn fetch_data(&self) -> Result<String, String> {
        Ok("data".to_string())
    }

    /// Unsafe method example
    pub unsafe fn raw_pointer_operation(&self) -> *const i32 {
        &self.value as *const i32
    }
}

/// A free function
pub fn calculate_sum(a: i32, b: i32) -> i32 {
    a + b
}

/// Another free function with generics
fn process_data<T>(data: T) -> T {
    data
}

/// Async free function
pub async fn async_operation() -> Result<(), Box<dyn std::error::Error>> {
    Ok(())
}

/// Const function
pub const fn const_operation(x: i32) -> i32 {
    x * 2
}

fn main() {
    let mut calc = Calculator::new(10);
    calc.add(5);
    println!("Result: {}", calc.get_value());
}
