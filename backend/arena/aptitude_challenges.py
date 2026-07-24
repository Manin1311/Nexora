"""
Aptitude question bank for the Speed Screening (Aptitude Battles).
Questions cover math, logic, and verbal categories with answers evaluated on the server.
"""

APTITUDE_CHALLENGES = [
    {
        "id": "apt-1",
        "type": "logic",
        "difficulty": "easy",
        "question": "Which number should come next in the sequence?\n2, 1, 1/2, 1/4, ...",
        "options": ["1/3", "1/8", "2/8", "1/16"],
        "correct_option": 1,  # 1/8
    },
    {
        "id": "apt-2",
        "type": "math",
        "difficulty": "easy",
        "question": "If a circle has a radius of 7 cm, what is its approximate circumference? (Use pi = 22/7)",
        "options": ["22 cm", "44 cm", "88 cm", "154 cm"],
        "correct_option": 1,  # 44 cm
    },
    {
        "id": "apt-3",
        "type": "verbal",
        "difficulty": "easy",
        "question": "Choose the word that is a synonym of 'OBSTINATE':",
        "options": ["Stubborn", "Flexible", "Friendly", "Generous"],
        "correct_option": 0,  # Stubborn
    },
    {
        "id": "apt-4",
        "type": "math",
        "difficulty": "medium",
        "question": "A train running at 60 km/hr crosses a telephone pole in 9 seconds. What is the length of the train?",
        "options": ["120 metres", "180 metres", "324 metres", "150 metres"],
        "correct_option": 3,  # 150 metres
    },
    {
        "id": "apt-5",
        "type": "logic",
        "difficulty": "medium",
        "question": "If A + B = 76 and A - B = 38, what is the value of B?",
        "options": ["19", "57", "38", "24"],
        "correct_option": 0,  # 19
    },
    {
        "id": "apt-6",
        "type": "math",
        "difficulty": "medium",
        "question": "A shopkeeper sells an item for $120, making a 20% profit on the cost price. What was the cost price?",
        "options": ["$100", "$96", "$90", "$110"],
        "correct_option": 0,  # $100
    },
    {
        "id": "apt-7",
        "type": "logic",
        "difficulty": "medium",
        "question": "Find the odd number out in this sequence:\n3, 5, 7, 9, 11, 13",
        "options": ["3", "9", "11", "13"],
        "correct_option": 1,  # 9 (composite, others are prime)
    },
    {
        "id": "apt-8",
        "type": "logic",
        "difficulty": "easy",
        "question": "If the code for 'CAT' is 'ECV', what is the code for 'DOG'?",
        "options": ["FQI", "FPH", "FRJ", "EPH"],
        "correct_option": 0,  # FQI (shifted by 2 letters)
    },
    {
        "id": "apt-9",
        "type": "verbal",
        "difficulty": "easy",
        "question": "Choose the word that is an antonym of 'ALIEN':",
        "options": ["Native", "Foreign", "Resident", "Natural"],
        "correct_option": 0,  # Native
    },
    {
        "id": "apt-10",
        "type": "math",
        "difficulty": "hard",
        "question": "The average of 5 consecutive integers is 20. What is the largest of these integers?",
        "options": ["22", "24", "20", "21"],
        "correct_option": 0,  # 22 (integers are 18, 19, 20, 21, 22)
    },
]
