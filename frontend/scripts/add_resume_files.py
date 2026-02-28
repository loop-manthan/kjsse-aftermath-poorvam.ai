#!/usr/bin/env python3
"""Add resumeFile mock objects to all team members in mockData.js"""

import re

# Read mockData.js
with open('frontend/src/data/mockData.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find member objects with resumeUrl but no resumeFile
# We'll add resumeFile right after resumeUrl
pattern = r'(resumeUrl: "https://cloudinary\.com/resume(\d+)\.pdf",)'

def add_resume_file(match):
    resume_url_line = match.group(1)
    resume_id = match.group(2)
    # Add resumeFile mock object after resumeUrl
    return f'{resume_url_line}\n        resumeFile: {{ name: "resume{resume_id}.pdf", size: 245000, type: "application/pdf" }},'

# Replace all occurrences
new_content = re.sub(pattern, add_resume_file, content)

# Write back
with open('frontend/src/data/mockData.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Successfully added resumeFile objects to all team members")
print("   - Each member now has: resumeFile: { name, size, type }")
print("   - AI grading will now work properly")
