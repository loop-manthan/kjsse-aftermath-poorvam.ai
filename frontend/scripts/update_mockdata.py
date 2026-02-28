#!/usr/bin/env python3
"""Update mockData.js with teams 15-50 in v3.0 structure"""

# Read the generated teams
with open('teams_15_50.txt', 'r', encoding='utf-8') as f:
    new_teams_content = f.read()

# Read current mockData.js
with open('frontend/src/data/mockData.js', 'r', encoding='utf-8') as f:
    current_content = f.read()

# Find where team 15 starts (after team 14 ends)
team_14_end = current_content.find('  },\n  {\n    id: 15,')

if team_14_end == -1:
    print("ERROR: Could not find team 15 start marker")
    exit(1)

# Find where mockEntryLogs starts
entry_logs_start = current_content.find('\nexport const mockEntryLogs = [')

if entry_logs_start == -1:
    print("ERROR: Could not find mockEntryLogs marker")
    exit(1)

# Find the closing bracket before mockEntryLogs (end of teams array)
teams_array_end = current_content.rfind('];', 0, entry_logs_start)

if teams_array_end == -1:
    print("ERROR: Could not find teams array end")
    exit(1)

# Extract parts
before_team_15 = current_content[:team_14_end + 4]  # Include '  },\n'
after_teams = current_content[teams_array_end:]

# Clean up the new teams content (remove first comment line)
new_teams_lines = new_teams_content.split('\n')[1:]  # Skip first line
new_teams_str = '\n'.join(new_teams_lines)

# Remove trailing comma from last team
new_teams_str = new_teams_str.rstrip().rstrip(',')

# Construct new content
new_content = before_team_15 + '\n' + new_teams_str + '\n' + after_teams

# Write back
with open('frontend/src/data/mockData.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully updated mockData.js with all 50 teams in v3.0 structure")
print(f"   - Kept teams 1-14 (already v3.0)")
print(f"   - Replaced teams 15-50 with new v3.0 structure")
print(f"   - All teams now have: registrationStatus, aiScore, pptFile, proper members objects")
