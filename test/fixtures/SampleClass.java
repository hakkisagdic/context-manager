package com.example.demo;

import java.util.ArrayList;
import java.util.List;

/**
 * Sample Java class for testing method extraction
 */
public class SampleClass {
    private String name;
    private int age;

    // Constructor
    public SampleClass(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Public method with return type
    public String getName() {
        return this.name;
    }

    // Public method with void return
    public void setName(String name) {
        this.name = name;
    }

    // Static method
    public static int calculateSum(int a, int b) {
        return a + b;
    }

    // Private method
    private void validateAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative");
        }
    }

    // Protected method
    protected boolean isAdult() {
        return this.age >= 18;
    }

    // Method with generic type
    public <T> List<T> createList(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) {
            list.add(item);
        }
        return list;
    }

    // Synchronized method
    public synchronized void incrementAge() {
        this.age++;
    }

    // Method with throws declaration
    public void riskyOperation() throws Exception {
        if (this.age < 0) {
            throw new Exception("Invalid state");
        }
    }

    // Final method
    public final String getFullInfo() {
        return String.format("Name: %s, Age: %d", this.name, this.age);
    }
}
