#!/usr/bin/env python3
"""Add fixed AI scores to all 50 teams in mockData.js"""

import re

# Read mockData.js
with open('frontend/src/data/mockData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Define fixed scores for all 50 teams
# Decrypters (id=1) gets 9.3, then descending scores for others
scores = {
    1: 9.3,   # Decrypters - highest
    2: 9.2,
    3: 9.1,
    4: 9.0,
    5: 8.9,
    6: 8.8,
    7: 8.7,
    8: 8.6,
    9: 8.5,
    10: 8.4,
    11: 8.3,
    12: 8.2,
    13: 8.1,
    14: 8.0,
    15: 7.9,
    16: 7.8,
    17: 7.7,
    18: 7.6,
    19: 7.5,
    20: 7.4,
    21: 7.3,
    22: 7.2,
    23: 7.1,
    24: 7.0,
    25: 6.9,
    26: 6.8,
    27: 6.7,
    28: 6.6,
    29: 6.5,
    30: 6.4,
    31: 6.3,
    32: 6.2,
    33: 6.1,
    34: 6.0,
    35: 5.9,
    36: 5.8,
    37: 5.7,
    38: 5.6,
    39: 5.5,
    40: 5.4,
    41: 5.3,
    42: 5.2,
    43: 5.1,
    44: 5.0,
    45: 4.9,
    46: 4.8,
    47: 4.7,
    48: 4.6,
    49: 4.5,
    50: 4.4,
}

# Pattern to find aiScore: null for each team
# We'll replace aiScore: null with the fixed score
for team_id, score in scores.items():
    # Find the team block and replace aiScore: null
    pattern = rf'(id: {team_id},[\s\S]*?)aiScore: null,'
    replacement = rf'\1aiScore: {score},'
    content = re.sub(pattern, replacement, content, count=1)

# Write back
with open('frontend/src/data/mockData.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully added fixed AI scores to all 50 teams")
print("   - Decrypters (id=1): 9.3 (highest)")
print("   - Team 2: 9.2")
print("   - Team 3: 9.1")
print("   - ...")
print("   - Team 50: 4.4 (lowest)")
print("\n📊 Scores range from 9.3 (Decrypters) down to 4.4 (Team 50)")
