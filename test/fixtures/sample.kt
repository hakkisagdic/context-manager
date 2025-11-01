/**
 * Kotlin Sample File for Method Extraction Testing
 */

class Calculator(private var value: Int = 0) {

    fun add(x: Int, y: Int): Int {
        return x + y
    }

    private fun subtract(x: Int, y: Int): Int {
        return x - y
    }

    suspend fun asyncOperation(): Int {
        delay(100)
        return value
    }

    inline fun inlineFunction(block: () -> Unit) {
        block()
    }

    companion object {
        fun multiply(x: Int, y: Int): Int {
            return x * y
        }
    }
}

fun standaloneFunction(param: Int): Int {
    return param * 2
}

suspend fun asyncStandaloneFunction(): String {
    return fetchData()
}

fun <T> genericFunction(item: T): T {
    return item
}

fun String.extensionFunction(): Int {
    return this.length
}

data class DataClass(val name: String, val age: Int)
