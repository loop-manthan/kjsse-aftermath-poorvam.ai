#!/usr/bin/env python3
"""Generate mock teams 15-50 with v3.0 structure"""

teams_data = [
    (15, "CyberGuardians", "Security Audit Platform", "cyberguardians/audit", ["Rahul Bhat", "Prerna Shah", "Akshay Nair", "Divya Iyer"]),
    (16, "DataMiners", "Big Data Analytics Dashboard", "dataminers/analytics", ["Shweta Kumari", "Vivek Sharma", "Nandini Joshi"]),
    (17, "MobileFirst", "Cross-Platform App Framework", "mobilefirst/framework", ["Kartik Gupta", "Sneha Reddy", "Aryan Patel", "Tanya Singh"]),
    (18, "GameDev", "Educational Game Engine", "gamedev/engine", ["Rohan Malhotra", "Isha Kapoor"]),
    (19, "IoTExperts", "Smart Home Automation", "iotexperts/smart-home", ["Saurabh Desai", "Priya Menon", "Harsh Jain"]),
    (20, "MLMasters", "AutoML Platform", "mlmasters/automl", ["Aditya Sharma", "Kavita Reddy", "Nitin Kumar", "Pooja Verma"]),
    (21, "CloudCompute", "Distributed Computing Platform", "cloudcompute/distributed", ["Vikram Singh", "Anita Patel", "Rahul Nair"]),
    (22, "APIBuilders", "API Gateway Solution", "apibuilders/gateway", ["Manish Gupta", "Riya Sharma", "Karan Mehta", "Neha Patel"]),
    (23, "DevOpsNinjas", "CI/CD Pipeline Automation", "devopsninjas/cicd", ["Arjun Kumar", "Sneha Iyer"]),
    (24, "FullStackers", "MERN Stack Boilerplate", "fullstackers/boilerplate", ["Rajesh Nair", "Priyanka Singh", "Amit Verma"]),
    (25, "FrontendMasters", "Component Library", "frontendmasters/components", ["Varun Reddy", "Anjali Kapoor", "Siddharth Joshi", "Meera Patel"]),
    (26, "BackendExperts", "Microservices Framework", "backendexperts/microservices", ["Karthik Rao", "Divya Menon", "Rohan Gupta"]),
    (27, "DatabasePros", "NoSQL Query Optimizer", "databasepros/optimizer", ["Suresh Kumar", "Lakshmi Iyer", "Arun Sharma", "Kavya Reddy"]),
    (28, "SecurityFirst", "Penetration Testing Tool", "securityfirst/pentest", ["Vijay Nair", "Prerna Kapoor"]),
    (29, "NetworkGeeks", "Network Monitoring Dashboard", "networkgeeks/monitor", ["Ashok Singh", "Ritu Verma", "Manoj Kumar"]),
    (30, "AIResearchers", "NLP Model Training Platform", "airesearchers/nlp", ["Deepak Sharma", "Swati Reddy", "Nikhil Patel", "Ananya Iyer"]),
    (31, "DataScientists", "Predictive Analytics Tool", "datascientists/analytics", ["Ramesh Gupta", "Pooja Nair", "Sanjay Mehta"]),
    (32, "WebDevelopers", "CMS Platform", "webdevelopers/cms", ["Sunil Kumar", "Neha Sharma", "Rakesh Verma", "Priya Kapoor"]),
    (33, "MobileDevelopers", "React Native Framework", "mobiledevelopers/rn", ["Anil Reddy", "Shruti Iyer"]),
    (34, "CloudArchitects", "Serverless Framework", "cloudarchitects/serverless", ["Mohan Singh", "Kavita Nair", "Rajiv Kumar"]),
    (35, "DevSecOps", "Security Scanning Tool", "devsecops/scanner", ["Prakash Sharma", "Anjali Reddy", "Vivek Patel", "Riya Mehta"]),
    (36, "QAExperts", "Test Automation Framework", "qaexperts/automation", ["Suresh Nair", "Priyanka Gupta", "Amit Sharma"]),
    (37, "UIDesigners", "Design System", "uidesigners/design", ["Kiran Kumar", "Neha Iyer", "Siddharth Reddy", "Meera Kapoor"]),
    (38, "UXResearchers", "User Testing Platform", "uxresearchers/testing", ["Arun Patel", "Divya Sharma"]),
    (39, "ProductManagers", "Roadmap Planning Tool", "productmanagers/roadmap", ["Rajesh Kumar", "Swati Nair", "Manoj Reddy"]),
    (40, "TechWriters", "Documentation Generator", "techwriters/docs", ["Sunil Sharma", "Priya Iyer", "Rakesh Patel", "Anjali Mehta"]),
    (41, "SRETeam", "Observability Platform", "sreteam/observability", ["Mohan Reddy", "Kavita Gupta", "Rajiv Nair"]),
    (42, "PlatformEngineers", "Internal Developer Platform", "platformengineers/idp", ["Prakash Kumar", "Riya Sharma", "Vivek Iyer", "Neha Reddy"]),
    (43, "DataEngineers", "ETL Pipeline Builder", "dataengineers/etl", ["Suresh Patel", "Priyanka Nair"]),
    (44, "MLEngineers", "Model Deployment Platform", "mlengineers/deploy", ["Anil Kumar", "Shruti Sharma", "Sanjay Reddy"]),
    (45, "BlockchainDevs", "Smart Contract Platform", "blockchaindevs/contracts", ["Kiran Gupta", "Meera Iyer", "Siddharth Patel", "Divya Mehta"]),
    (46, "ARVRDevelopers", "Metaverse Platform", "arvrdevelopers/metaverse", ["Arun Sharma", "Swati Kapoor", "Manoj Nair"]),
    (47, "QuantumComputing", "Quantum Algorithm Simulator", "quantumcomputing/simulator", ["Rajesh Reddy", "Priya Gupta", "Rakesh Iyer", "Anjali Patel"]),
    (48, "EdgeComputing", "Edge Processing Framework", "edgecomputing/framework", ["Sunil Nair", "Kavita Sharma"]),
    (49, "CodeOptimizers", "Code Performance Analyzer", "codeoptimizers/analyzer", ["Harsh Gupta", "Priya Kumar", "Nitin Sharma", "Aarti Patel"]),
    (50, "AIAssistants", "Personal AI Assistant", "aiassistants/personal", ["Vikash Rao", "Shruti Desai", "Amit Verma"]),
]

def generate_team(team_id, team_name, problem, github_path, members):
    member_id_start = 43 + (team_id - 15) * 10
    members_js = []
    
    for idx, member_name in enumerate(members):
        is_leader = idx == 0
        member_id = member_id_start + idx
        email = member_name.lower().replace(" ", ".") + "@college.edu"
        mobile = f"987654{3210 + member_id}"
        aadhaar = f"XXXX XXXX {3210 + member_id}"
        
        member_js = f"""      {{
        id: {member_id},
        name: "{member_name}",
        email: "{email}",
        mobile: "{mobile}",
        college: "College Name",
        aadhaar: "{aadhaar}",
        isLeader: {"true" if is_leader else "false"},
        mobileVerified: true,
        aadhaarVerified: true,
        resumeUrl: "https://cloudinary.com/resume{member_id}.pdf",
        collegeIdUrl: "https://cloudinary.com/id{member_id}.jpg",
        qrCode: "data:image/png;base64,{team_name.lower()}-{member_name.split()[0].lower()}-qr",
        idCardUrl: "https://cloudinary.com/idcard{member_id}.png",
      }}"""
        members_js.append(member_js)
    
    members_str = ",\n".join(members_js)
    ppt_name = problem.lower().replace(" ", "-") + ".pptx"
    ppt_size = 3000000 + (team_id * 100000)
    
    return f"""  {{
    id: {team_id},
    hackathonCode: "AERO-2026-HC{1234 + team_id}",
    teamName: "{team_name}",
    members: [
{members_str}
    ],
    problemStatement: "{problem}",
    github: "https://github.com/{github_path}",
    pptFile: {{ name: "{ppt_name}", size: {ppt_size} }},
    pptUrl: "https://drive.google.com/presentation/d/{team_id}{team_name.lower()[:4]}",
    registrationStatus: "REGISTERED",
    registeredAt: "2026-02-19T{8 + (team_id % 4):02d}:{(team_id * 15) % 60:02d}:00Z",
    reviewedAt: null,
    shortlistedAt: null,
    aiScore: null,
    aiGradedAt: null,
    aiGradingStatus: null,
    aiFeedback: null,
    adminNotes: null,
    scores: null,
    totalScore: 0,
    evaluatedAt: null,
    evaluatedBy: null,
    isCheckedIn: false,
    checkedInAt: null,
    foodCoupons: {{ breakfast: false, lunch: false, dinner: false }},
    isShortlisted: false,
    submittedAt: "2026-02-19T{8 + (team_id % 4):02d}:{(team_id * 15) % 60:02d}:00Z",
  }}"""

print("// Generated teams 15-50 with v3.0 structure")
for team_data in teams_data:
    print(generate_team(*team_data) + ",")
