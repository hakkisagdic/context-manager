/**
 * C++ Sample File for Method Extraction Testing
 */

#include <iostream>
#include <string>

class Calculator {
private:
    int value;

public:
    Calculator(int initialValue = 0) : value(initialValue) {}

    int add(int x, int y) {
        return x + y;
    }

    int subtract(int x, int y) const {
        return x - y;
    }

    static int multiply(int x, int y) {
        return x * y;
    }

    virtual int compute() {
        return value;
    }

    inline int getValue() const {
        return value;
    }
};

class AdvancedCalculator : public Calculator {
public:
    AdvancedCalculator() : Calculator(0) {}

    int compute() override final {
        return getValue() * 2;
    }

    virtual void reset() {
        // Reset implementation
    }
};

int standaloneFunction(int param) {
    return param * 2;
}

template<typename T>
T genericFunction(T item) {
    return item;
}

namespace Math {
    int power(int base, int exp) {
        int result = 1;
        for(int i = 0; i < exp; i++) {
            result *= base;
        }
        return result;
    }
}
