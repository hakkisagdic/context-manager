<?php
/**
 * PHP Sample File for Method Extraction Testing
 */

class Calculator {
    private $value;

    public function __construct($initialValue = 0) {
        $this->value = $initialValue;
    }

    public function add($x, $y) {
        return $x + $y;
    }

    private function subtract($x, $y) {
        return $x - $y;
    }

    public static function multiply($x, $y) {
        return $x * $y;
    }

    protected function divide($x, $y) {
        if ($y === 0) {
            throw new Exception("Division by zero");
        }
        return $x / $y;
    }
}

function standalone_function($param) {
    return $param * 2;
}

function process_array(array $items) {
    return array_map(function($item) {
        return $item * 2;
    }, $items);
}

?>
