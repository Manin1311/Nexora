"""
Challenge definitions shared between REST API and WebSocket consumer.
Tests are defined so they can be serialized to JSON and sent to the browser.
The browser executes the code locally (JS via new Function, Python via Pyodide).
"""

ARENA_CHALLENGES = [
    {
        "id": "arena-1",
        "title": "FizzBuzz",
        "topic": "Math / Logic",
        "difficulty": "easy",
        "xp": 180,
        "description": (
            "Given an integer `n`, return a list of strings for numbers from 1 to n:\n\n"
            '- "FizzBuzz" if the number is divisible by both 3 and 5.\n'
            '- "Fizz" if divisible by 3.\n'
            '- "Buzz" if divisible by 5.\n'
            "- The number itself (as a string) otherwise."
        ),
        "examples": [
            {"input": "n=5", "output": '["1","2","Fizz","4","Buzz"]'},
        ],
        "default_code": {
            "javascript": "function solve(n) {\n    // Your solution here\n    return [];\n}",
            "python": "def solve(n):\n    # Your solution here\n    return []",
        },
        "tests": [
            {"args": [3],  "expected": ["1", "2", "Fizz"]},
            {"args": [5],  "expected": ["1", "2", "Fizz", "4", "Buzz"]},
            {"args": [15], "expected": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]},
        ],
    },
    {
        "id": "arena-2",
        "title": "Reverse Words",
        "topic": "Strings",
        "difficulty": "medium",
        "xp": 320,
        "description": (
            "Given an input string `s`, reverse the order of the words.\n\n"
            "A word is defined as a sequence of non-space characters. "
            "Words in `s` are separated by at least one space. "
            "Return a string of the words in reverse order joined by a single space, "
            "with no leading or trailing spaces."
        ),
        "examples": [
            {"input": 's="the sky is blue"',  "output": '"blue is sky the"'},
            {"input": 's="  hello world  "',  "output": '"world hello"'},
            {"input": 's="a good   example"', "output": '"example good a"'},
        ],
        "default_code": {
            "javascript": "function solve(s) {\n    // Your solution here\n    return '';\n}",
            "python": "def solve(s):\n    # Your solution here\n    return ''",
        },
        "tests": [
            {"args": ["the sky is blue"],  "expected": "blue is sky the"},
            {"args": ["  hello world  "],  "expected": "world hello"},
            {"args": ["a good   example"], "expected": "example good a"},
        ],
    },
    {
        "id": "arena-3",
        "title": "Two Sum",
        "topic": "Arrays / Hash Map",
        "difficulty": "easy",
        "xp": 250,
        "description": (
            "Given an array of integers `nums` and an integer `target`, "
            "return indices of the two numbers such that they add up to `target`.\n\n"
            "You may assume each input has exactly one solution, and you may not use "
            "the same element twice."
        ),
        "examples": [
            {"input": "nums=[2,7,11,15], target=9", "output": "[0,1]", "explanation": "nums[0]+nums[1]=9"},
            {"input": "nums=[3,2,4], target=6", "output": "[1,2]"},
        ],
        "default_code": {
            "javascript": "function solve(nums, target) {\n    // Your solution here\n    return [];\n}",
            "python": "def solve(nums, target):\n    # Your solution here\n    return []",
        },
        "tests": [
            {"args": [[2, 7, 11, 15], 9],  "expected": [0, 1]},
            {"args": [[3, 2, 4], 6],        "expected": [1, 2]},
            {"args": [[3, 3], 6],           "expected": [0, 1]},
        ],
    },
    {
        "id": "arena-4",
        "title": "Valid Parentheses",
        "topic": "Stack / Strings",
        "difficulty": "easy",
        "xp": 220,
        "description": (
            "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, "
            "determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "- Open brackets must be closed by the same type of brackets.\n"
            "- Open brackets must be closed in the correct order."
        ),
        "examples": [
            {"input": 's="()"',     "output": "true"},
            {"input": 's="()[]{}"', "output": "true"},
            {"input": 's="(]"',     "output": "false"},
        ],
        "default_code": {
            "javascript": "function solve(s) {\n    // Your solution here\n    return false;\n}",
            "python": "def solve(s):\n    # Your solution here\n    return False",
        },
        "tests": [
            {"args": ["()"],     "expected": True},
            {"args": ["()[]{}"], "expected": True},
            {"args": ["(]"],     "expected": False},
            {"args": ["{[]}"],   "expected": True},
        ],
    },
]
