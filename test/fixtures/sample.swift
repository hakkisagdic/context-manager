/**
 * Swift Sample File for Method Extraction Testing
 */

class Calculator {
    private var value: Int

    init(initialValue: Int = 0) {
        self.value = initialValue
    }

    func add(_ x: Int, _ y: Int) -> Int {
        return x + y
    }

    private func subtract(_ x: Int, _ y: Int) -> Int {
        return x - y
    }

    static func multiply(_ x: Int, _ y: Int) -> Int {
        return x * y
    }

    func asyncOperation() async -> Int {
        return await fetchData()
    }

    class func classMethod() -> String {
        return "Class method"
    }
}

func standaloneFunction(param: Int) -> Int {
    return param * 2
}

func genericFunction<T>(item: T) -> T {
    return item
}

public func publicFunction() {
    print("Public function")
}

private func privateFunction() {
    print("Private function")
}

fileprivate func filePrivateFunction() {
    print("File private function")
}

struct Point {
    var x: Double
    var y: Double

    func distance() -> Double {
        return sqrt(x * x + y * y)
    }
}
