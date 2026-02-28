node test.js
╔════════════════════════════════════════════╗
║   AeroHacks AI Analyzer — Test Suite       ║
╚════════════════════════════════════════════╝
Server: http://localhost:5000/api/v1/ai

══════════════════════════════════════════
  TEST: Health Check
══════════════════════════════════════════

✅ SUCCESS — Health Check Response:

{
  "status": "ok"
}

══════════════════════════════════════════
  TEST: Resume Upload (PDF)
══════════════════════════════════════════

✅ SUCCESS — Resume Analysis Response:

{
  "success": true,
  "message": "Resume analyzed successfully",
  "data": {
    "analysisId": "e34385ea-f809-4dfd-94f1-f7e20fb5677f",
    "type": "resume",
    "fileName": "Om_UPADHYAY_RESUME.pdf",
    "analysis": {
      "parsedInfo": {
        "name": "Om Upadhyay",
        "email": "omupadhyay2007@gmail.com",
        "phone": "+91 9324769110",
        "skills": [
          "JavaScript",
          "TypeScript",
          "Python",
          "C++",
          "SQL (PostgreSQL)",
          "HTML/CSS",
          "React.js",
          "Next.js",
          "React Native",
          "Node.js",
          "Express.js",
          "Django",
          "Tailwind CSS",
          "REST APIs",
          "WebSockets (Socket.io)",
          "MongoDB",
          "Zod",
          "Git",
          "GitHub",
          "Docker",
          "AWS (Textract)",
          "Vercel",
          "Postman",
          "Linux",
          "System Design",
          "Authentication",
          "FinTech/Blockchain Integration",
          "Cybersecurity (CTF)",
          "Steganography",
          "Web Exploitation (XSS, Auth flaws)"
        ],
        "experience": [
          "B.Tech in Information Technology (Dwarkadas J. Sanghvi College, Mumbai, India) – Sep 2025 – Present",
          "Higher Secondary Certificate (Arya Gurukul College, Mumbai, India) – Apr 2023 – May 2025",
          "Reelvest (Lazarus) – Django, Finternet, AWS Textract – GitHub – Feb 2026",
          "FingerPe – React, Node.js, PostgreSQL – Live & GitHub – Jan 2026",
          "Mesh – MERN Stack, Decentralized Computing – GitHub – Jan 2026",
          "RESTful Products API – Node.js, Express, PostgreSQL – GitHub – Dec 2025",
          "ASHA Project – Mobile Development, Offline-First – Live & GitHub – Nov 2025",
          "Top 3% Global Rank on TryHackMe – Active CTF competitor (Linux, Steganography, Web Exploitation)"
        ],
        "education": [
          "B.Tech in Information Technology (Dwarkadas J. Sanghvi College, Mumbai, India)",
          "Higher Secondary Certificate (Arya Gurukul College, Mumbai, India)"
        ]
      },
      "scores": {
        "overall": 85,
        "skillsRelevance": 95,
        "experienceDepth": 75,
        "educationQuality": 80,
        "formatting": 60
      },
      "recommendations": [
        "Highlight achievements (e.g., hackathon wins, TryHackMe ranking) in a dedicated 'Achievements' section with quantifiable results (e.g., cash prizes, podium finishes).",
        "Include dates in the 'experience' section in a consistent format (e.g., 'MM/YYYY') to improve readability and chronological clarity.",
        "Add a brief summary or objective at the top to contextualize the candidate’s career focus (e.g., 'Full-Stack Developer with expertise in FinTech/Blockchain and Cybersecurity').",
        "Expand on technical skills with proficiency levels (e.g., 'Advanced: React.js, Node.js') and relevant certifications (e.g., AWS, CTF certs).",  
        "Ensure formatting adheres to standard resume conventions (e.g., consistent bullet points, clear section headers)."
      ]
    },
    "createdAt": "2026-02-21T06:38:32.394Z"
  }
}

══════════════════════════════════════════
  TEST: PPT Upload (PPTX)
══════════════════════════════════════════

✅ SUCCESS — PPT Analysis Response:

{
  "success": true,
  "message": "Presentation analyzed successfully",
  "data": {
    "analysisId": "79c47b3e-00ec-4af6-b68e-b482e5f4f5c9",
    "type": "presentation",
    "fileName": "AeroHacks_Pitch_Deck.pptx",
    "analysis": {
      "projectInfo": {
        "title": "Smart Hackathon Management System (AeroHacks)",
        "description": "A secure, automated, and intelligent system for managing hackathon participant registration, identity verification, judging, and analytics using QR tracking, AI face recognition, and automated PPT evaluation.",
        "technologies": [
          "React",
          "Tailwind CSS",
          "Node.js",
          "Express",
          "MongoDB",
          "face-api.js",
          "JWT Authentication",
          "AES-256 Encryption",
          "OTP Email Verification",
          "Auto-scaling Infrastructure"
        ]
      },
      "scores": {
        "overall": 92,
        "clarity": 95,
        "innovation": 90,
        "technicalDepth": 98,
        "designQuality": 85,
        "feasibility": 95
      },
      "feedback": [
        "The presentation clearly outlines the three core pillars (Security, AI, and Automation) with well-structured feature breakdowns and measurable benefits.",
        "The integration of face-api.js for real-time fraud detection and dynamic QR codes for anti-spoofing is highly impressive and demonstrates deep technical thinking.",
        "The impact metrics (e.g., 70% reduction in manual verification time) are compelling but could benefit from additional real-world validation or case studies."
      ],
      "strengths": [
        "Strong technical depth with a scalable architecture (React, Node.js, MongoDB) and robust security measures (AES-256, JWT, OTP).",
        "Innovative use of AI/ML for both identity verification and automated judging, addressing key pain points in hackathon management."
      ],
      "improvements": [
        "Provide more visuals or demos to reinforce the design quality and user experience, especially for the dynamic QR and analytics features.",      
        "Clarify how the 'Human Review System' integrates with the AI judging process to avoid ambiguity in the workflow."
      ]
    },
    "createdAt": "2026-02-21T06:38:37.701Z"
  }
}

══════════════════════════════════════════
  TEST: Get All Analyses
══════════════════════════════════════════

✅ SUCCESS — All Analyses Response:

{
  "success": true,
  "count": 2,
  "data": [
    {
      "analysisId": "e34385ea-f809-4dfd-94f1-f7e20fb5677f",
      "type": "resume",
      "fileName": "Om_UPADHYAY_RESUME.pdf",
      "analysis": {
        "parsedInfo": {
          "name": "Om Upadhyay",
          "email": "omupadhyay2007@gmail.com",
          "phone": "+91 9324769110",
          "skills": [
            "JavaScript",
            "TypeScript",
            "Python",
            "C++",
            "SQL (PostgreSQL)",
            "HTML/CSS",
            "React.js",
            "Next.js",
            "React Native",
            "Node.js",
            "Express.js",
            "Django",
            "Tailwind CSS",
            "REST APIs",
            "WebSockets (Socket.io)",
            "MongoDB",
            "Zod",
            "Git",
            "GitHub",
            "Docker",
            "AWS (Textract)",
            "Vercel",
            "Postman",
            "Linux",
            "System Design",
            "Authentication",
            "FinTech/Blockchain Integration",
            "Cybersecurity (CTF)",
            "Steganography",
            "Web Exploitation (XSS, Auth flaws)"
          ],
          "experience": [
            "B.Tech in Information Technology (Dwarkadas J. Sanghvi College, Mumbai, India) – Sep 2025 – Present",
            "Higher Secondary Certificate (Arya Gurukul College, Mumbai, India) – Apr 2023 – May 2025",
            "Reelvest (Lazarus) – Django, Finternet, AWS Textract – GitHub – Feb 2026",
            "FingerPe – React, Node.js, PostgreSQL – Live & GitHub – Jan 2026",
            "Mesh – MERN Stack, Decentralized Computing – GitHub – Jan 2026",
            "RESTful Products API – Node.js, Express, PostgreSQL – GitHub – Dec 2025",
            "ASHA Project – Mobile Development, Offline-First – Live & GitHub – Nov 2025",
            "Top 3% Global Rank on TryHackMe – Active CTF competitor (Linux, Steganography, Web Exploitation)"
          ],
          "education": [
            "B.Tech in Information Technology (Dwarkadas J. Sanghvi College, Mumbai, India)",
            "Higher Secondary Certificate (Arya Gurukul College, Mumbai, India)"
          ]
        },
        "scores": {
          "overall": 85,
          "skillsRelevance": 95,
          "experienceDepth": 75,
          "educationQuality": 80,
          "formatting": 60
        },
        "recommendations": [
          "Highlight achievements (e.g., hackathon wins, TryHackMe ranking) in a dedicated 'Achievements' section with quantifiable results (e.g., cash prizes, podium finishes).",
          "Include dates in the 'experience' section in a consistent format (e.g., 'MM/YYYY') to improve readability and chronological clarity.",        
          "Add a brief summary or objective at the top to contextualize the candidate’s career focus (e.g., 'Full-Stack Developer with expertise in FinTech/Blockchain and Cybersecurity').",
          "Expand on technical skills with proficiency levels (e.g., 'Advanced: React.js, Node.js') and relevant certifications (e.g., AWS, CTF certs).",
          "Ensure formatting adheres to standard resume conventions (e.g., consistent bullet points, clear section headers)."
        ]
      },
      "createdAt": "2026-02-21T06:38:32.394Z"
    },
    {
      "analysisId": "79c47b3e-00ec-4af6-b68e-b482e5f4f5c9",
      "type": "presentation",
      "fileName": "AeroHacks_Pitch_Deck.pptx",
      "analysis": {
        "projectInfo": {
          "title": "Smart Hackathon Management System (AeroHacks)",
          "description": "A secure, automated, and intelligent system for managing hackathon participant registration, identity verification, judging, and analytics using QR tracking, AI face recognition, and automated PPT evaluation.",
            "Node.js",
            "Express",
            "MongoDB",
            "face-api.js",
            "JWT Authentication",
            "AES-256 Encryption",
            "OTP Email Verification",
            "Auto-scaling Infrastructure"
          ]
        },
        "scores": {
          "overall": 92,
          "clarity": 95,
          "innovation": 90,
          "technicalDepth": 98,
          "designQuality": 85,
          "feasibility": 95
        },
        "feedback": [
          "The presentation clearly outlines the three core pillars (Security, AI, and Automation) with well-structured feature breakdowns and measurable benefits.",
          "The integration of face-api.js for real-time fraud detection and dynamic QR codes for anti-spoofing is highly impressive and demonstrates deep technical thinking.",
          "The impact metrics (e.g., 70% reduction in manual verification time) are compelling but could benefit from additional real-world validation or case studies."
        ],
        "strengths": [
          "Strong technical depth with a scalable architecture (React, Node.js, MongoDB) and robust security measures (AES-256, JWT, OTP).",
          "Innovative use of AI/ML for both identity verification and automated judging, addressing key pain points in hackathon management."
        ],
        "improvements": [
          "Provide more visuals or demos to reinforce the design quality and user experience, especially for the dynamic QR and analytics features.",
          "Clarify how the 'Human Review System' integrates with the AI judging process to avoid ambiguity in the workflow."
        ]
      },
      "createdAt": "2026-02-21T06:38:37.701Z"
    }
  ]
}

══════════════════════════════════════════
  TEST SUMMARY
══════════════════════════════════════════
  Health     : ✅ SUCCESS
  Resume     : ✅ SUCCESS
  PPT        : ✅ SUCCESS
══════════════════════════════════════════