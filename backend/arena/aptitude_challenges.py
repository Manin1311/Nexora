"""
Aptitude question bank for the Speed Screening (Aptitude Battles).
Questions cover math, logic, and verbal categories with answers evaluated on the server.
"""

APTITUDE_CHALLENGES = [
    # ── EASY QUESTIONS (+10 Points) ──────────────────────────────────────────
    {
        "id": "apt-e1",
        "type": "logic",
        "difficulty": "easy",
        "question": "Which number should come next in the sequence?\n2, 1, 1/2, 1/4, ...",
        "options": ["1/3", "1/8", "2/8", "1/16"],
        "correct_option": 1,  # 1/8
    },
    {
        "id": "apt-e2",
        "type": "math",
        "difficulty": "easy",
        "question": "If a circle has a radius of 7 cm, what is its approximate circumference? (Use pi = 22/7)",
        "options": ["22 cm", "44 cm", "88 cm", "154 cm"],
        "correct_option": 1,  # 44 cm
    },
    {
        "id": "apt-e3",
        "type": "verbal",
        "difficulty": "easy",
        "question": "Choose the word that is a synonym of 'OBSTINATE':",
        "options": ["Stubborn", "Flexible", "Friendly", "Generous"],
        "correct_option": 0,  # Stubborn
    },
    {
        "id": "apt-e4",
        "type": "logic",
        "difficulty": "easy",
        "question": "If the code for 'CAT' is 'ECV', what is the code for 'DOG'?",
        "options": ["FQI", "FPH", "FRJ", "EPH"],
        "correct_option": 0,  # FQI
    },
    {
        "id": "apt-e5",
        "type": "verbal",
        "difficulty": "easy",
        "question": "Choose the word that is an antonym of 'ALIEN':",
        "options": ["Native", "Foreign", "Resident", "Natural"],
        "correct_option": 0,  # Native
    },
    {
        "id": "apt-e6",
        "type": "math",
        "difficulty": "easy",
        "question": "What is 15% of 200?",
        "options": ["20", "25", "30", "35"],
        "correct_option": 2,  # 30
    },
    {
        "id": "apt-e7",
        "type": "logic",
        "difficulty": "easy",
        "question": "Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?",
        "options": ["7", "10", "12", "13"],
        "correct_option": 1,  # 10
    },

    # ── MEDIUM QUESTIONS (+20 Points) ────────────────────────────────────────
    {
        "id": "apt-m1",
        "type": "math",
        "difficulty": "medium",
        "question": "A train running at 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
        "options": ["120 metres", "180 metres", "324 metres", "150 metres"],
        "correct_option": 3,  # 150 metres
    },
    {
        "id": "apt-m2",
        "type": "logic",
        "difficulty": "medium",
        "question": "If A + B = 76 and A - B = 38, what is the value of B?",
        "options": ["19", "57", "38", "24"],
        "correct_option": 0,  # 19
    },
    {
        "id": "apt-m3",
        "type": "math",
        "difficulty": "medium",
        "question": "A shopkeeper sells an item for $120, making a 20% profit on cost price. What was the cost price?",
        "options": ["$100", "$96", "$90", "$110"],
        "correct_option": 0,  # $100
    },
    {
        "id": "apt-m4",
        "type": "logic",
        "difficulty": "medium",
        "question": "Find the odd number out in this sequence:\n3, 5, 7, 9, 11, 13",
        "options": ["3", "9", "11", "13"],
        "correct_option": 1,  # 9
    },
    {
        "id": "apt-m5",
        "type": "math",
        "difficulty": "medium",
        "question": "If 6 men can complete a job in 12 days, how many days will 8 men take to complete the same job?",
        "options": ["8 days", "9 days", "10 days", "6 days"],
        "correct_option": 1,  # 9 days
    },
    {
        "id": "apt-m6",
        "type": "logic",
        "difficulty": "medium",
        "question": "In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?",
        "options": ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJEFJDM"],
        "correct_option": 0,  # EOJDJEFM
    },

    # ── HARD QUESTIONS (+30 Points) ──────────────────────────────────────────
    {
        "id": "apt-h1",
        "type": "math",
        "difficulty": "hard",
        "question": "The average of 5 consecutive integers is 20. What is the largest of these integers?",
        "options": ["22", "24", "20", "21"],
        "correct_option": 0,  # 22
    },
    {
        "id": "apt-h2",
        "type": "logic",
        "difficulty": "hard",
        "question": "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
        "options": ["Brother", "Uncle", "Father", "Grandfather"],
        "correct_option": 2,  # Father
    },
    {
        "id": "apt-h3",
        "type": "math",
        "difficulty": "hard",
        "question": "Two pipes A and B can fill a tank in 20 min and 30 min respectively. If both pipes are opened together, how long will it take to fill the tank?",
        "options": ["10 min", "12 min", "15 min", "25 min"],
        "correct_option": 1,  # 12 min
    },
    {
        "id": "apt-h4",
        "type": "math",
        "difficulty": "hard",
        "question": "A sum of money doubles itself at compound interest in 15 years. It will become eight times itself in how many years?",
        "options": ["30 years", "45 years", "60 years", "50 years"],
        "correct_option": 1,  # 45 years
    },
    {
        "id": "apt-h5",
        "type": "logic",
        "difficulty": "hard",
        "question": "In a clock, how many times in 24 hours do the hour and minute hands overlap?",
        "options": ["24 times", "22 times", "44 times", "12 times"],
        "correct_option": 1,  # 22 times
    },
]
