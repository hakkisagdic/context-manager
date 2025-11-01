# Ruby Sample File for Method Extraction Testing

class Calculator
  attr_accessor :value

  def initialize(initial_value = 0)
    @value = initial_value
  end

  def add(x, y)
    x + y
  end

  def subtract(x, y)
    x - y
  end

  def self.multiply(x, y)
    x * y
  end

  def divide(x, y)
    raise "Division by zero" if y.zero?
    x / y
  end

  def question_method?
    @value > 0
  end

  def exclamation_method!
    @value = 0
  end

  private

  def private_helper
    @value * 2
  end
end

def standalone_function(param)
  param * 2
end

def process_block(&block)
  block.call if block_given?
end
