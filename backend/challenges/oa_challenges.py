OA_CHALLENGES = {
    'Amazon': [
        {
            'id': 101,
            'title': 'Log Dispatch Partitioning',
            'topic': 'String Partitioning',
            'difficulty': 'medium',
            'xp': 150,
            'estimated_time': '30 mins',
            'description': (
                "A system logs user activities as sequences of single-character operations.\n"
                "You want to partition these logs into the maximum number of contiguous sub-sequences "
                "such that each unique character appears in at most one sub-sequence.\n\n"
                "Return a list of integers representing the size of these sub-sequences in order."
            ),
            'default_code': {
                'python': (
                    "def solve(logs):\n"
                    "    # Write your Python solution here\n"
                    "    pass\n"
                ),
                'javascript': (
                    "function solve(logs) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return [];\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [['a', 'b', 'a', 'b', 'c', 'b', 'a', 'c', 'a', 'd', 'e', 'f', 'd', 'e', 'g', 'i', 'h', 'i', 'j', 'h', 'k', 'l', 'i', 'j']],
                    'expected': [9, 7, 8]
                },
                {
                    'input': [['a', 'b', 'c']],
                    'expected': [1, 1, 1]
                },
                {
                    'input': [['z', 'a', 'z', 'b', 'b', 'c', 'c', 'c']],
                    'expected': [3, 2, 3]
                }
            ]
        },
        {
            'id': 102,
            'title': 'Optimize Truck Route Load',
            'topic': 'Dynamic Programming',
            'difficulty': 'hard',
            'xp': 200,
            'estimated_time': '40 mins',
            'description': (
                "Given a list of positive integer weights representing parcels, "
                "and an integer representing the maximum carrying capacity of an Amazon delivery truck, "
                "find the maximum total weight that can be loaded onto the truck without exceeding the capacity.\n"
                "Each parcel can be loaded at most once.\n\n"
                "Input formats:\n"
                "- weights: list of integers\n"
                "- capacity: integer"
            ),
            'default_code': {
                'python': (
                    "def solve(weights, capacity):\n"
                    "    # Write your Python solution here\n"
                    "    return 0\n"
                ),
                'javascript': (
                    "function solve(weights, capacity) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return 0;\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [[10, 20, 30, 40], 50],
                    'expected': 50
                },
                {
                    'input': [[12, 13, 15, 19], 10],
                    'expected': 0
                },
                {
                    'input': [[14, 8, 9, 22, 11], 29],
                    'expected': 29
                }
            ]
        }
    ],
    'Google': [
        {
            'id': 201,
            'title': 'Email Sanitizer System',
            'topic': 'String Sets',
            'difficulty': 'medium',
            'xp': 150,
            'estimated_time': '30 mins',
            'description': (
                "Google Mail routes emails according to rules:\n"
                "1. If you add periods ('.') in the local name (before the '@'), they are ignored.\n"
                "2. If you add a plus sign ('+') in the local name, everything after the plus sign is ignored.\n\n"
                "Given a list of email strings, determine the number of unique mailboxes that actually receive emails."
            ),
            'default_code': {
                'python': (
                    "def solve(emails):\n"
                    "    # Write your Python solution here\n"
                    "    return 0\n"
                ),
                'javascript': (
                    "function solve(emails) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return 0;\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [["test.email+alex@google.com", "test.e.mail+bob.cathy@google.com", "testemail+david@google.com"]],
                    'expected': 1
                },
                {
                    'input': [["a@g.com", "b@g.com", "c@g.com"]],
                    'expected': 3
                },
                {
                    'input': [["test.email+alex@google.com", "test.email@google.com"]],
                    'expected': 1
                }
            ]
        },
        {
            'id': 202,
            'title': 'Maximize Server Group Efficiency',
            'topic': 'Greedy Algorithm',
            'difficulty': 'hard',
            'xp': 200,
            'estimated_time': '45 mins',
            'description': (
                "You are auditing N processing servers, each with a processing speed (positive integer).\n"
                "You need to group servers into triplets (groups of 3).\n"
                "The efficiency score of a triplet is the middle (median) value of the three speeds.\n"
                "Return the maximum sum of efficiencies you can obtain by forming as many disjoint triplets as possible from the servers.\n\n"
                "Example: speeds = [1, 2, 3, 4, 5, 6, 7, 8, 9].\n"
                "Max sum is 18 (Triplets: [9,8,1]->8, [7,6,2]->6, [5,4,3]->4. Sum = 18)."
            ),
            'default_code': {
                'python': (
                    "def solve(speeds):\n"
                    "    # Write your Python solution here\n"
                    "    return 0\n"
                ),
                'javascript': (
                    "function solve(speeds) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return 0;\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [[1, 2, 3, 4, 5, 6, 7, 8, 9]],
                    'expected': 18
                },
                {
                    'input': [[2, 4, 1, 2, 7, 8]],
                    'expected': 9
                },
                {
                    'input': [[1, 2, 3]],
                    'expected': 2
                }
            ]
        }
    ],
    'TCS': [
        {
            'id': 301,
            'title': 'Sweet Distribution Puzzle',
            'topic': 'Math & Modular Arithmetic',
            'difficulty': 'easy',
            'xp': 100,
            'estimated_time': '25 mins',
            'description': (
                "A sweet shop distributes N sweets to P children sitting in a circle.\n"
                "The sweets are distributed sequentially (1 to P, then wrap around to 1).\n"
                "If distribution starts at child index S (1-indexed), find the 1-indexed position of the child who receives the last sweet.\n\n"
                "Input formats:\n"
                "- N: number of sweets\n"
                "- P: number of children\n"
                "- S: starting child index"
            ),
            'default_code': {
                'python': (
                    "def solve(N, P, S):\n"
                    "    # Write your Python solution here\n"
                    "    return 1\n"
                ),
                'javascript': (
                    "function solve(N, P, S) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return 1;\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [2, 5, 1],
                    'expected': 2
                },
                {
                    'input': [5, 2, 2],
                    'expected': 2
                },
                {
                    'input': [10, 3, 1],
                    'expected': 1
                }
            ]
        },
        {
            'id': 302,
            'title': 'Find Minimum Missing Transaction ID',
            'topic': 'Arrays / Hash Table',
            'difficulty': 'medium',
            'xp': 150,
            'estimated_time': '30 mins',
            'description': (
                "Given an unsorted list of integer IDs (which can include positive, negative, and zero values),\n"
                "find the smallest positive transaction ID (i.e. greater than 0) that is missing from the list."
            ),
            'default_code': {
                'python': (
                    "def solve(ids):\n"
                    "    # Write your Python solution here\n"
                    "    return 1\n"
                ),
                'javascript': (
                    "function solve(ids) {\n"
                    "    // Write your JavaScript solution here\n"
                    "    return 1;\n"
                    "}\n"
                )
            },
            'tests': [
                {
                    'input': [[3, 4, -1, 1]],
                    'expected': 2
                },
                {
                    'input': [[1, 2, 0]],
                    'expected': 3
                },
                {
                    'input': [[7, 8, 9, 11, 12]],
                    'expected': 1
                }
            ]
        }
    ]
}
