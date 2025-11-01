"""
Python Sample File for Method Extraction Testing
"""

class Calculator:
    def __init__(self, initial_value=0):
        self.value = initial_value

    def add(self, x, y):
        """Add two numbers"""
        return x + y

    def subtract(self, x, y):
        """Subtract y from x"""
        return x - y

    async def async_operation(self):
        """Async method example"""
        await some_async_call()
        return self.value

    @staticmethod
    def multiply(x, y):
        """Static method to multiply"""
        return x * y

    @classmethod
    def from_string(cls, value_str):
        """Class method constructor"""
        return cls(int(value_str))

def standalone_function(param):
    """Standalone function"""
    return param * 2

async def async_function():
    """Async standalone function"""
    result = await fetch_data()
    return process(result)

# Lambda functions should not be extracted
lambda_func = lambda x: x + 1
