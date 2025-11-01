/**
 * Scala Sample File for Method Extraction Testing
 */

class Calculator(private var value: Int = 0) {

  def add(x: Int, y: Int): Int = {
    x + y
  }

  private def subtract(x: Int, y: Int): Int = {
    x - y
  }

  def multiply(x: Int, y: Int): Int = x * y

  def asyncOperation(): Future[Int] = Future {
    value
  }
}

object Calculator {
  def apply(value: Int): Calculator = new Calculator(value)

  def multiply(x: Int, y: Int): Int = {
    x * y
  }
}

trait Computable {
  def compute(): Int
}

case class Point(x: Double, y: Double) {
  def distance(): Double = {
    math.sqrt(x * x + y * y)
  }
}

def standaloneFunction(param: Int): Int = {
  param * 2
}

val lambdaFunction = (x: Int) => x + 1

def higherOrderFunction(f: Int => Int): Int = {
  f(10)
}

def genericFunction[T](item: T): T = {
  item
}

override def toString: String = {
  s"Calculator($value)"
}
