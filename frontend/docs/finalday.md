# **Technical Blueprint: Smart College Hackathon Management & Verification System**

The operational execution of collegiate hackathons frequently suffers from profound logistical bottlenecks, encompassing manual registration verification, inefficient presentation evaluations, chaotic on-ground entry management, and vulnerability to coupon fraud during food distribution.1 The problem statement for AeroHacks mandates the rapid development of an end-to-end digital lifecycle management system utilizing the MERN (MongoDB, Express.js, React, Node.js) stack.1 Constructing a robust, scalable, and secure application to address these multifaceted challenges within a heavily constrained 15-hour hackathon environment requires meticulous architectural planning, aggressive feature prioritization, and the strategic deployment of zero-configuration plug-and-play Application Programming Interfaces (APIs) and Node Package Manager (npm) modules.

This comprehensive technical blueprint outlines the exact execution strategy, codebase architecture, and operational timeline required to build, deploy, and successfully demonstrate the hackathon management platform. By omitting protracted Continuous Integration/Continuous Deployment (CI/CD) pipelines and exhaustive testing suites in favor of rapid prototyping methodologies, the development team can focus entirely on delivering a high-impact Minimum Viable Product (MVP) that resolves the core administrative pain points.

## **1\. MVP Extraction**

The successful deployment of a full-scale hackathon management system within a strict 15-hour development window necessitates a rigorous prioritization strategy. Attempting to build all requested features concurrently typically results in an incomplete, non-functional application, leading to a catastrophic failure during the final demonstration.2 The architecture must resolve the operational bottlenecks identified in the AeroHacks problem statement: manual verification flaws, presentation evaluation inefficiencies, and on-ground entry chaos.1

To optimize execution and guarantee a functional deliverable, the system is segmented into a Minimum Viable Product (MVP) framework, categorized by P0 (Critical Path), P1 (High Value), and P2 (Bonus/Differentiator) features. This stratification ensures that core functionalities are demonstrably functional before engineering hours are invested in advanced, risk-prone integrations.

### **Feature Priority Matrix and Execution Constraints**

| Feature Module                   | Priority | Functional Description                                                                                                                                                        | Time Budget | Demo Success Condition                                                                                                                                                               |
| :------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication & RBAC**        | P0       | Implementation of role-based access control segregating Admins, Judges, and Participants using Passport.js and JSON Web Tokens (JWT).4                                        | 1.5 Hours   | The system accurately parses JWT payloads to grant Admin dashboard access while securely blocking unauthorized participant requests.6                                                |
| **Registration & Submissions**   | P0       | Facilitation of deadline-enforced individual and team registrations, coupled with secure upload endpoints for presentation (PPT) files and GitHub repository links.1          | 2.0 Hours   | Students can successfully instantiate teams, upload external links, and the database automatically locks further modifications once the programmatic deadline is breached.           |
| **Dynamic QR Entry & Meals**     | P0       | Generation of cryptographically signed, dynamic QR codes acting as secure access tokens for gate entry and three specific meals (Breakfast, Lunch, Dinner).1                  | 2.5 Hours   | QR scans successfully log real-time entry; subsequent scanning attempts of the same QR code immediately throw an "Already Consumed" exception, preventing physical double-spending.8 |
| **Live Evaluation Dashboard**    | P0       | Deployment of a real-time scoring matrix dashboard for judges, integrating an auto-updating leaderboard generation algorithm.1                                                | 2.0 Hours   | Judges input sub-scores (1-10) across customizable rubrics; the global leaderboard updates synchronously with deterministic tie-resolution logic applied to the dataset.             |
| **Face-Matching & Verification** | P1       | Integration of 1:1 facial descriptor comparison algorithms, analyzing the mathematical distance between an uploaded college ID card and a live webcam selfie.1                | 2.0 Hours   | The backend algorithm approves the participant's entry if the computed Euclidean distance between the two facial tensors falls below the strict 0.45 threshold.10                    |
| **OTP & Email Alerts**           | P1       | Dispatching of verification codes and system alerts via Simple Mail Transfer Protocol (SMTP) utilizing Nodemailer for account activation and shortlisting notifications.1     | 1.0 Hour    | The user receives an automated 6-digit verification code in their email inbox upon registration and successfully verifies the account against the database hash.                     |
| **Aadhaar Data Masking**         | P2       | Implementation of regular expression-based masking protocols to obfuscate the first 8 digits of a participant's uploaded Aadhaar number to ensure data privacy compliance.1   | 1.0 Hour    | A raw numeric string such as 1234 5678 9012 is dynamically intercepted, converted, and securely stored in the database as XXXX XXXX 9012\.13                                         |
| **AI PPT Evaluation**            | P2       | Deployment of OpenAI-driven natural language processing to parse extracted presentation text against predefined hackathon rubrics.1                                           | 1.5 Hours   | The system outputs a strictly typed JSON evaluation payload containing autonomous scores for innovation and feasibility, bypassing manual processing delays.15                       |
| **GitHub Plagiarism Check**      | P2       | Utilization of the Octokit REST API to fetch repository contents, combined with local heuristic algorithms for cosine similarity comparison against known boilerplate code.16 | 1.0 Hour    | The administrative dashboard visually flags student repositories that exhibit greater than 85% mathematical similarity to known source templates.18                                  |
| **Bandwidth-Light Mode**         | P2       | Implementation of CSS variable toggling to disable heavy media assets and animations, catering to overloaded and heavily congested campus Wi-Fi networks.1                    | 0.5 Hours   | The user interface seamlessly switches to a minimalist, text-only, high-contrast dark mode via a global context state toggle.20                                                      |

This matrix explicitly dictates the workflow of the three-person development team. Any deviation from the P0 critical path during the first eight hours of the hackathon will inevitably result in architectural failure. The success conditions provided serve as definitive checkpoints; a module is not considered complete until it satisfies the exact criteria outlined in the matrix.

## **2\. Fastest npm Packages & Plug-and-Play APIs**

In a hyper-compressed 15-hour sprint, developing complex infrastructure components from scratch—such as cryptographic signature validators or computer vision tensor models—is a critical anti-pattern that drains time and introduces severe bugs.2 The MERN stack architecture relies on highly optimized, zero-configuration npm packages and RESTful APIs that offer the lowest absolute time-to-implementation while maintaining enterprise-grade reliability.

### **OTP and Email Delivery Mechanisms**

For participant verification, Short Message Service (SMS) APIs like Twilio often appear attractive; however, they require stringent regulatory setups, including the registration of Sender IDs, verification of destination numbers in trial tiers, and complex webhook configurations.22 These administrative hurdles consume valuable hackathon hours. Therefore, the nodemailer package, combined with an App Password-enabled Gmail account, provides the fastest, zero-cost One-Time Password (OTP) delivery mechanism available to Node.js developers.11 This approach bypasses telecom regulations and delivers instantly to the participant's inbox.

JavaScript

// Quick Nodemailer OTP Implementation  
// Setup Time: 10 Minutes  
import nodemailer from "nodemailer";  
import crypto from "crypto";

// Initialize the transporter using environment variables to prevent credential leakage  
const transporter \= nodemailer.createTransport({  
 service: "gmail",  
 auth: {  
 user: process.env.EMAIL_USER,  
 pass: process.env.EMAIL_APP_PASSWORD // Must use Google App Password, not account password  
 },  
});

export const generateAndSendOTP \= async (userEmail) \=\> {  
 // Generate a cryptographically secure 6-digit OTP  
 const otp \= crypto.randomInt(100000, 999999).toString();

const mailOptions \= {  
 from: \`"AeroHacks Auth" \<${process.env.EMAIL\_USER}\>\`,  
    to: userEmail,  
    subject: "AeroHacks Hackathon \- Account Verification Code",  
    text: \`Your secure verification OTP is: ${otp}. This code is valid for exactly 10 minutes. Do not share it.\`,  
    html: \`\<b\>Your secure verification OTP is: \<span style="font-size:20px"\>${otp}\</span\>\</b\>\<br\>This code is valid for exactly 10 minutes.\`  
 };

await transporter.sendMail(mailOptions);  
 return otp; // Return to controller to hash and store in MongoDB  
};

### **File Storage for PPTs and College IDs**

Handling multipart form data and local file storage using the standard Node.js fs module is error-prone and scales poorly. Furthermore, cloud deployment platforms frequently used in hackathons (such as Render or Heroku) utilize ephemeral filesystems; any image stored locally will be deleted upon the container's next spin-up cycle. To circumvent this, the architecture utilizes cloudinary paired with multer. Cloudinary provides instant cloud storage and acts as a Content Delivery Network (CDN), returning a secure URL that can be safely stored as a string within the Mongoose schema.24

### **Cryptographic QR Code Generation and Scanning**

To facilitate the dynamic entry and food tracking protocols demanded by the problem statement, the system requires instantaneous QR code generation.1 The qrcode npm package is utilized on the backend to generate Base64 Data URIs instantaneously from signed JSON Web Tokens.7 For the administrative scanning interface, the qr-scanner package is deployed on the React frontend. This lightweight library leverages the browser's native BarcodeDetector API when available, utilizing WebWorkers to keep the main UI thread highly responsive during rapid scanning events at the physical venue.28

### **Lightweight 1:1 Face Matching Architecture**

The problem statement dictates a mandatory face match verification step between a photograph on a college ID card and a live webcam selfie.1 Relying on external cloud-based APIs (such as AWS Rekognition or Azure Face API) introduces unacceptable network latency, requires complex Identity and Access Management (IAM) configurations, and risks exceeding free-tier rate limits during a hackathon.24

Instead, the system integrates face-api.js, executing directly on the Node.js backend environment. By incorporating @tensorflow/tfjs-node, the application leverages underlying native C++ bindings for near-instant 1:1 facial matching without requiring external network calls.10 The library offers multiple models; while the MTCNN model is faster and more lightweight, the SSD Mobilenet V1 model is explicitly chosen for this implementation because it offers an astonishing prediction accuracy of 99.38% on the LFW (Labeled Faces in the Wild) benchmark, which is critical for preventing identity fraud.10

JavaScript

// Face-api.js 1:1 Matching Logic for Node.js \[9, 10\]  
// Setup Time: 25 Minutes  
import \* as faceapi from 'face-api.js';  
import canvas from 'canvas';  
import path from 'path';

// Monkey patch the Node.js environment to support browser-based HTMLCanvasElement  
const { Canvas, Image, ImageData } \= canvas;  
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

export const verifyIdentity \= async (idImageUrl, selfieUrl) \=\> {  
 // Load optimized quantized models from the local disk  
 const MODEL_URL \= path.join(\_\_dirname, '/models');  
 await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);  
 await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);  
 await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);

// Load images from the provided Cloudinary URLs into canvas elements  
 const idImage \= await canvas.loadImage(idImageUrl);  
 const selfie \= await canvas.loadImage(selfieUrl);

// Execute detection, calculate 68 facial landmarks, and compute the 128-dimensional descriptor  
 const idResults \= await faceapi.detectSingleFace(idImage).withFaceLandmarks().withFaceDescriptor();  
 const selfieResults \= await faceapi.detectSingleFace(selfie).withFaceLandmarks().withFaceDescriptor();

// Handle edge cases where the computer vision model fails to find a human face  
 if (\!idResults ||\!selfieResults) {  
 return { verified: false, error: "Human face could not be detected in one or both images." };  
 }

// Compute the Euclidean distance between the two 128-dimensional arrays  
 const distance \= faceapi.euclideanDistance(idResults.descriptor, selfieResults.descriptor);

// A Euclidean distance threshold \< 0.45 generally indicates a high-confidence match of the same person  
 return { verified: distance \< 0.45, distanceScore: distance };  
};

### **Client-Side Aadhaar Masking Protocol**

For compliance, security, and privacy, Aadhaar masking is executed to prevent the exposure of highly sensitive 12-digit national identity numbers.1 Relying on heavy OCR (Optical Character Recognition) libraries for image-based masking is excessively time-consuming for a 15-hour hackathon.33 Therefore, the system enforces a manual text input for the Aadhaar number, which is instantaneously processed via a strictly defined Regular Expression (^\[2-9\]{1}\[0-9\]{3}\\s?\[0-9\]{4}\\s?\[0-9\]{4}$).13 The logic captures the 12-digit string and obfuscates the first eight digits before it is transmitted to the database.14

JavaScript

// Rapid Aadhaar Masking Utility  
// Setup Time: 5 Minutes  
export const maskAadhaar \= (aadhaarString) \=\> {  
 // Strip all whitespace formatting from the user input  
 const cleanAadhaar \= aadhaarString.replace(/\\s/g, '');

// Validate against UIDAI mathematical standards (cannot start with 0 or 1, must be exactly 12 digits)  
 if (\!/^\[2-9\]{1}\[0-9\]{11}$/.test(cleanAadhaar)) {  
 throw new Error("Validation Failed: Invalid Aadhaar format provided.");  
 }

// Replace the first 8 numeric digits with the 'X' character, preserving only the last 4 digits for identification \[14\]  
 return cleanAadhaar.substring(0, 8).replace(/\[0-9\]/g, 'X') \+ cleanAadhaar.substring(8);  
};

## **3\. Rapid MERN Architecture**

A 15-hour sprint strictly prohibits over-engineering. The architecture must minimize cognitive load, eliminate excessive boilerplate, and prevent merge conflicts among team members.34 The project is structured using a strict REST-first Model-View-Controller (MVC) architecture, logically segregating responsibilities. The backend functions entirely as a headless JSON API, while the React frontend consumes these endpoints.35

### **REST-First File Structure Blueprint**

The directory structure enforces a clear separation of concerns, allowing the backend developer to manipulate controllers without interfering with the frontend developer's React component state.35

/server

├── /config \# db.js (Mongoose connection), passport.js (JWT strategy), cloudinary.js

├── /controllers \# authController.js, qrController.js, evalController.js (Fat models, skinny controllers)

├── /models \# User.js, Team.js, QRLog.js (Mongoose schemas)

├── /routes \# authRoutes.js, apiRoutes.js (Express routing logic)

├── /middlewares \# rbac.js (Role checking), requireAuth.js

└── server.js \# Express entry point and middleware mounting

/client

├── /src

│ ├── /components \# QRScanner.jsx, LeaderboardTable.jsx, Navbar.jsx

│ ├── /pages \# AdminDashboard.jsx, HackerProfile.jsx, Landing.jsx

│ ├── /context \# AuthContext.jsx (Global user state), ThemeContext.jsx (Bandwidth-light mode)

│ └── App.jsx \# React Router DOM configuration

### **Lean Mongoose Schemas and Indexing**

In a NoSQL database like MongoDB, schemas must be relatively flat and highly indexed to support rapid read/write operations during a live event. Deeply nested populates and complex relational joins will inevitably bottleneck the application.37 The implementation avoids complex cross-referencing in favor of storing referenced ObjectIDs and utilizing embedded documents where appropriate.

The User schema acts as the central source of truth for the participant's physical state at the hackathon, housing their verification status and meal consumption booleans.1

JavaScript

// models/User.js \[35, 37\]  
import mongoose from 'mongoose';

const UserSchema \= new mongoose.Schema({  
 name: { type: String, required: true },  
 email: { type: String, unique: true, required: true },  
 password: { type: String, required: true }, // Bcrypt hashed  
 role: { type: String, enum: \['participant', 'admin', 'judge'\], default: 'participant' },  
 verification: {  
 isVerified: { type: Boolean, default: false },  
 aadhaarMasked: { type: String }, // e.g., XXXXXXXX9012  
 idImageUrl: { type: String }, // Cloudinary URL  
 selfieUrl: { type: String }, // Cloudinary URL  
 faceMatchScore: { type: Number } // Euclidean distance  
 },  
 // Embedded document for highly efficient atomic updates during physical scanning  
 meals: {  
 breakfast: { consumed: { type: Boolean, default: false }, timestamp: Date },  
 lunch: { consumed: { type: Boolean, default: false }, timestamp: Date },  
 dinner: { consumed: { type: Boolean, default: false }, timestamp: Date }  
 },  
 hasEntered: { type: Boolean, default: false } // Tracks gate entry  
}, { timestamps: true });

export default mongoose.model('User', UserSchema);

To support real-time team tracking and evaluation, the Team schema embeds the final evaluation scores directly. By placing the totalScore directly on the schema and applying a descending index (-1), the database can generate the live leaderboard instantaneously without requiring costly application-level sorting or aggregation pipelines.1

JavaScript

// models/Team.js  
import mongoose from 'mongoose';

const TeamSchema \= new mongoose.Schema({  
 teamName: { type: String, required: true, unique: true },  
 members:,  
 problemStatement: { type: String, required: true },  
 submissions: {  
 roundOnePPT: { type: String }, // Cloudinary URL or Google Drive link  
 githubRepo: { type: String }, // HTTPS GitHub link  
 finalDemoVideo: { type: String }  
 },  
 // Evaluation metrics embedded to avoid complex joins  
 scores: {  
 innovation: { type: Number, default: 0 },  
 feasibility: { type: Number, default: 0 },  
 technicalDepth: { type: Number, default: 0 },  
 presentationClarity: { type: Number, default: 0 },  
 totalScore: { type: Number, default: 0 }  
 },  
 isShortlisted: { type: Boolean, default: false }  
}, { timestamps: true });

// Crucial: Create a descending index for instant leaderboard generation  
TeamSchema.index({ 'scores.totalScore': \-1 });

export default mongoose.model('Team', TeamSchema);

## **4\. Authentication, RBAC, and Dynamic QR Logic**

Security and access control are paramount in a hackathon management system. Organizers require a platform that definitively prevents duplicate gate entries, mitigates food coupon fraud, and strictly separates the permissions of hackers, judges, and administrators.1

### **Passport.js Local Strategy and JWT Implementation**

Relying on stateful, session-based authentication (like express-session) introduces unnecessary state management overhead and complications when deploying across distributed cloud architectures.5 The architecture instead employs passport-jwt to secure the RESTful endpoints statelessly.5

Upon successful login via the passport-local strategy (which verifies the bcrypt-hashed password against the MongoDB record), the Express server signs and issues a JSON Web Token.6 Embedding the user's role directly within the JWT payload is a highly efficient design pattern; it allows the backend to perform initial authorization checks without needing to query the database on every single incoming HTTP request.40

JavaScript

// config/passport.js \[5, 6, 41\]  
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';  
import User from '../models/User.js';

// Configure Passport to extract the JWT from the Authorization Header (Bearer token)  
const opts \= {  
 jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  
 secretOrKey: process.env.JWT_SECRET // Cryptographic secret stored in environment  
};

export default (passport) \=\> {  
 passport.use('jwt', new JwtStrategy(opts, async (jwt_payload, done) \=\> {  
 try {  
 // The payload contains the user ID and role encoded during login  
 const user \= await User.findById(jwt_payload.id).select('-password');  
 if (user) {  
 return done(null, user); // Attach the user object to req.user  
 }  
 return done(null, false); // Token is valid, but user no longer exists in DB  
 } catch (err) {  
 return done(err, false);  
 }  
 }));  
};

### **Role-Based Access Control (RBAC) Middleware**

Using the role embedded within the verified JWT payload, a custom Express middleware acts as a strict gatekeeper for administrative and judicial routes.4 This ensures that malicious participants cannot manually trigger REST calls to access the scoring matrices, approve verifications, or hit the QR scanning endpoints.43

JavaScript

// middlewares/rbac.js \[4, 43\]  
export const requireRole \= (allowedRoles) \=\> {  
 return (req, res, next) \=\> {  
 // Ensure the user object exists (populated by Passport) and their role is in the allowed array  
 if (\!req.user ||\!allowedRoles.includes(req.user.role)) {  
 return res.status(403).json({  
 success: false,  
 error: "Forbidden: You do not have the required administrative privileges to perform this action."  
 });  
 }  
 next(); // Privilege confirmed, proceed to the controller  
 };  
};

// Example implementation in route definitions:  
// router.post('/evaluate-team', passport.authenticate('jwt', { session: false }), requireRole(\['admin', 'judge'\]), submitScores);

### **One-Time Scan Protection and Atomic Update Logic**

The most critical failure point in physical hackathon logistics is the double-scanning of QR codes for food or entry.1 Traditional, naive implementations suffer from severe race conditions. If a volunteer scans a QR code, the server reads the database (consumed \= false), and before it can save the updated state (consumed \= true), a second volunteer scans the same code. Both instances will read false and sequentially write true, resulting in the participant receiving two meals.

To mathematically eliminate this vulnerability, the system utilizes MongoDB's atomic update operators. The QR code generated by the application contains a signed JWT of the user's ID and the specific intended action. When scanned, the backend executes a findOneAndUpdate operation that includes the expected current state within the query filter itself.8

JavaScript

// controllers/qrController.js \[8, 44\]  
import jwt from 'jsonwebtoken';  
import User from '../models/User.js';

export const processQRScan \= async (req, res) \=\> {  
 const { qrPayload, scanType } \= req.body; // scanType e.g., 'entry', 'breakfast', 'lunch'

try {  
 // Verify the cryptographically signed QR payload to prevent forged QR codes  
 const decoded \= jwt.verify(qrPayload, process.env.QR_SECRET);  
 const userId \= decoded.id;

    let updateQuery \= {};
    let condition \= { \_id: userId };

    // Construct the query based on the scan context
    if (scanType \=== 'entry') {
      condition.hasEntered \= false; // Optimistic locking: query only matches if they haven't entered
      updateQuery \= { $set: { hasEntered: true } };
    } else {
      // For meals, ensure the specific meal hasn't been eaten yet
      condition \= false;
      updateQuery \= {
        $set: {
         : true,
         : new Date()
        }
      };
    }

    // Atomic Update: This operation only succeeds if the query condition (e.g., consumed \== false)
    // is still absolutely true at the exact millisecond of database execution.
    // If a race condition occurs, the second thread will fail to find a matching document.
    const updatedUser \= await User.findOneAndUpdate(condition, updateQuery, { new: true });

    if (\!updatedUser) {
      // The condition failed, meaning the QR has already been used or the user is invalid
      return res.status(400).json({
        success: false,
        message: "CRITICAL ALERT: QR Code has already been consumed or is invalid."
      });
    }

    return res.status(200).json({
      success: true,
      message: \`${scanType.toUpperCase()} successfully recorded.\`,
      user: updatedUser.name
    });

} catch (error) {  
 return res.status(400).json({ success: false, message: "Invalid or forged QR Signature." });  
 }  
};

## **5\. Bonus Feature APIs**

To elevate the project into the winning tier and drastically improve the quality of life for the hackathon organizers, the integration of advanced artificial intelligence and external API mechanics is required. These features solve highly complex evaluation bottlenecks that traditionally slow down the transition from preliminary rounds to the final presentation.1

### **AI-Based PPT Evaluation using Structured Outputs**

Manual evaluation of round-one presentations introduces extreme delays and requires massive manpower from the judging panel.1 By leveraging OpenAI's gpt-4o-2024-08-06 model, the system can autonomously parse extracted text from the uploaded presentations and return baseline scores.15

Traditionally, prompting an LLM to return JSON is unreliable, often resulting in hallucinatory keys, missing required parameters, or malformed string data that crashes the backend parser. However, by utilizing OpenAI's new Structured Outputs feature in conjunction with the zod library, the model is mathematically constrained to perfectly adhere to the predefined schema. This guarantees 100% adherence, allowing the MERN backend to seamlessly insert the AI's output directly into the database without manual retry loops.15

JavaScript

// controllers/evalController.js  
import OpenAI from "openai";  
import { zodResponseFormat } from "openai/helpers/zod";  
import { z } from "zod";

// Initialize OpenAI client  
const openai \= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define the exact schema structure required for the database using Zod  
const EvaluationSchema \= z.object({  
 innovation: z.number().describe("Score 1-10 based on the novelty of the idea"),  
 feasibility: z.number().describe("Score 1-10 based on real-world execution capability"),  
 technical_depth: z.number().describe("Score 1-10 analyzing the technical stack complexity"),  
 justification: z.string().describe("A brief, 2-sentence reasoning justifying the provided scores")  
});

export const evaluatePitchDeck \= async (extractedPPTText) \=\> {  
 // Call the parse endpoint which enforces the Structured Output  
 const completion \= await openai.chat.completions.parse({  
 model: "gpt-4o-2024-08-06",  
 messages:,  
 // Force the model to generate a response matching the Zod schema  
 response_format: zodResponseFormat(EvaluationSchema, "pitch_evaluation"),  
 });

// The output is a fully typed, guaranteed JSON object ready for MongoDB insertion  
 return completion.choices.message.parsed;  
};

### **GitHub API Plagiarism Detection Heuristic**

To ensure code integrity and prevent teams from submitting pre-built boilerplate templates, the backend interfaces with the GitHub REST API to perform automated code similarity checks.1 Using the official octokit SDK, the application bypasses complex manual HTTP requests and securely authenticates to fetch repository contents.16

Because fetching massive repositories can hit rate limits or timeout thresholds, the logic focuses on scanning the primary entry point files (e.g., src/App.js or src/main.js). The fetched Base64 encoded content is decoded and then analyzed against a database of known templates using the text-similarity-node package. This specific library utilizes native C++ bindings to execute highly performant Cosine Similarity mathematical computations, drastically outperforming pure JavaScript string comparison implementations.17

JavaScript

// controllers/githubController.js \[16, 17, 18\]  
import { App } from "octokit";  
import textSimilarity from "text-similarity-node";

// Authenticate using a GitHub App token for higher rate limits \[16, 18\]  
const octokit \= new Octokit({ auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN });

export const checkCodePlagiarism \= async (owner, repo, referenceBoilerplateCode) \=\> {  
 try {  
 // Fetch the raw content of the primary source file \[16\]  
 const { data } \= await octokit.rest.repos.getContent({  
 owner,  
 repo,  
 path: 'src/main.js'  
 });

    // GitHub API returns content in base64; decode to utf-8 string \[16\]
    const decodedStudentContent \= Buffer.from(data.content, 'base64').toString('utf-8');

    // Calculate Cosine Similarity utilizing the native C++ library for maximum speed \[17, 48\]
    const similarityScore \= textSimilarity.similarity.cosine(decodedStudentContent, referenceBoilerplateCode);

    // A score \> 0.85 mathematically indicates heavy structural copying
    return { flagged: similarityScore \> 0.85, confidenceScore: similarityScore };

} catch (error) {  
 console.error("GitHub API Error: Unable to fetch repository data.", error);  
 return { flagged: false, error: "Plagiarism analysis failed due to network or access constraints." };  
 }  
};

### **Bandwidth-Light Mode Toggle**

A common phenomenon during major physical hackathons is the total collapse of the campus Wi-Fi infrastructure due to thousands of concurrent devices.1 A visually heavy dashboard will fail to load, crippling the administrative flow. To counter this, a "Bandwidth-Light Mode" is integrated via a CSS variable toggle. Managed by React Context, activating this mode strips out heavy DOM elements, nullifies background images, and switches the UI to a raw, high-contrast, text-only state.19

CSS

/\* App.css \*/  
:root {  
 \--app-bg-color: \#f4f7f6;  
 \--app-text-color: \#2c3e50;  
 \--display\-media: block;  
 \--card-shadow: 0 4px 6px rgba(0,0,0,0.1);  
}

/\*  
 When the data-theme attribute is toggled via React State,  
 the browser natively overrides the variables without requiring Javascript repaints.  
\*/  
\[data-theme='light-bandwidth'\] {  
 \--app-bg-color: \#000000;  
 \--app-text-color: \#00ff00; /\* High contrast terminal style for readability \*/  
 \--display\-media: none; /\* Suppresses all heavy image/video rendering entirely \*/  
 \--card-shadow: none; /\* Removes computationally expensive shadow rendering \*/  
}

img, video, iframe { display: var(--display-media); }  
body {  
 background-color: var(--app-bg-color);  
 color: var(--app-text-color);  
}  
.dashboard-card { box-shadow: var(--card-shadow); }

## **6\. Rapid Execution Blueprint**

Execution velocity is the primary delineating factor between winning and losing in a hackathon environment. Technical superiority means nothing if the application is not deployed and functional by the deadline. The following blueprint coordinates a standard team of three developers (Dev 1: Frontend/UI, Dev 2: Backend/Architecture, Dev 3: ML/Integrations) across a strict 15-hour timeline, designed to mitigate bottlenecks and ensure continuous integration of features.49

### **30-Minute Rapid Start Checklist**

The first thirty minutes dictate the momentum of the entire sprint. This phase involves zero coding and absolute infrastructure preparation.

1. **Initialize Repositories:** Clone a highly opinionated, pre-configured MERN boilerplate (such as hackathon-starter) to bypass Webpack/Babel configuration nightmares. Execute npm install concurrently across all machines.51
2. **Provision Cloud Infrastructure:** Spin up a MongoDB Atlas M0 Free Tier cluster. Create a Cloudinary account for media storage. Generate application-specific API keys for OpenAI and GitHub.24
3. **Environment Variables Distribution:** Create a centralized .env file containing MONGO_URI, JWT_SECRET, CLOUDINARY_URL, OPENAI_API_KEY, and EMAIL_APP_PASSWORD. Distribute this file via a secure, encrypted channel to the team.
4. **Postman/ThunderClient Setup:** Import pre-defined JSON schemas and REST API mockups into ThunderClient to allow the frontend developer to build HTTP requests before the backend routes are finalized.43

### **15-Hour Hour-by-Hour Sprint Matrix**

| Timeline       | Frontend (Dev 1: React)                                                   | Backend (Dev 2: Node/Express)                                                    | ML/Integration (Dev 3: APIs)                                                    | Synchronization Checkpoint                                                            |
| :------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ |
| **Hour 1-2**   | Scaffold React DOM, setup TailwindCSS, and build Context Providers.21     | Configure Express middleware, build Mongoose schemas, establish DB connection.35 | Provision API keys, set up Cloudinary Multer upload middleware.24               | Architecture spun up. Database successfully accepts basic test writes.                |
| **Hour 3-4**   | Build Login and Registration forms. Connect state to API endpoints.55     | Implement Passport Local/JWT strategies and Nodemailer OTP logic.11              | Implement face-api.js local loading, optimize weights, and test tensors.10      | Users can register, receive OTP, and login successfully to receive a JWT.             |
| **Hour 5-6**   | Build Participant Dashboard UI (Upload input fields for links/files).57   | Create RBAC middleware and team submission routing logic.43                      | Build Aadhaar Masking regex utility and test edge cases.13                      | Submissions and masked data are flowing into the database correctly.                  |
| **Hour 7-8**   | Implement QR Generator UI utilizing the qrcode package.7                  | Build JWT signing functions specifically for secure QR payloads.                 | Test and link Face Verification algorithm to the initial upload flow.9          | Secure, dynamic QR codes are visible on the participant dashboard.                    |
| **Hour 9-10**  | Build Admin QR Scanner UI utilizing the qr-scanner client-side library.28 | Implement strict atomic $set query logic for entry and meal consumption.8        | Write the OpenAI Structured Outputs evaluation script and define Zod schemas.15 | End-to-end QR scan physically alters database state securely without race conditions. |
| **Hour 11-12** | Build Live Leaderboard UI with auto-refreshing state hooks.               | Build evaluation calculation endpoints and tie-resolution sorting logic.         | Write GitHub Octokit fetching and Plagiarism cosine similarity check.16         | Administrator can view accurately sorted team scores on the dashboard.                |
| **Hour 13-14** | Implement Bandwidth-Light toggle context and CSS variables.20             | Finalize error handling, HTTP status codes, and input sanitization.              | Merge AI logic and GitHub endpoints to the main evaluation route.               | Feature freeze. All components are merged. No new logic is written.                   |
| **Hour 15**    | Polish UI (padding, responsive flexbox fixes on mobile views).            | Deploy backend to Render/Vercel and verify environment variables.                | Draft the Demo Script and meticulously test edge cases on production servers.   | **Deployment Complete. Codebase locked. Ready for the final Pitch.**                  |

### **Application Wireframe & Data Flow Architecture**

The user journey is architected to be highly linear, preventing users from accessing views out of sequence.

1. **Landing & Registration Node:** The user hits the /register route. They input data. The Aadhaar string is masked client/server-side. An OTP is dispatched via SMTP. The user enters the OTP to verify the account.
2. **Onboarding Verification Node:** The verified user uploads a photo of their ID and a live webcam selfie. The image buffers are passed to face-api.js. If the Euclidean distance is ![][image1], the account status is updated to Active.
3. **Participant Dashboard Node:** The active dashboard displays the team status, provides submission fields for the PPT and GitHub links, and renders the cryptographically signed dynamic QR code.
4. **Admin/Gate Logistics Node:** A volunteer opens the /scanner route on a mobile device. The camera reads the QR payload. The backend verifies the JWT signature and executes an atomic $set command. The UI flashes a large Green (Success) or Red (Already Scanned/Invalid) indicator based on the HTTP response.
5. **Evaluation Node:** The AI autonomously parses the submitted PPT text, generating a baseline JSON score. Human judges access the /judging-panel, augment the AI's baseline score, and submit it. The MongoDB index instantaneously recalculates the leaderboard, which re-renders on the main display.

### **3-Minute Demonstration Script**

_(The demonstration is the most critical phase of the hackathon. It must be meticulously orchestrated to showcase the exact resolution of the problem statement constraints without dead air or awkward pauses. The script is timed perfectly for a rapid-fire presentation.)_

**\[0:00 \- 0:45\] The Hook & Verification Execution:**

"Judges, the greatest bottleneck in hackathon logistics is manual verification and the chaotic queuing it creates. Welcome to the AeroHacks Management System. Watch closely as I register a new participant live on screen. I input the required data and upload an ID card alongside a live selfie. Instantly, our Node.js backend executes a local TensorFlow computer vision model. It computes a 1:1 facial descriptor match in milliseconds. Furthermore, notice the Aadhaar number input—it is automatically mathematically masked before it ever touches our MongoDB database. Verification is now instant, completely secure, and requires zero human intervention."

**\[0:45 \- 1:30\] The AI Evaluation Matrix:**

"Post-registration, teams submit their presentation decks and code repositories. Instead of organizers manually opening and reading over a hundred presentations, our system utilizes OpenAI's latest Structured Outputs feature. The AI evaluates the raw text against our custom hackathon rubrics, returning a strictly typed JSON payload mapping innovation and feasibility scores directly into our database. Simultaneously, the backend pings the GitHub API, utilizing C++ powered cosine similarity mathematics to analyze the student's source code against known templates, flagging plagiarism instantly. Our leaderboard is already populated with baseline metrics before human judging even begins."

**\[1:30 \- 2:15\] The Core Utility: QR Logistics & Cryptography:**

"Let us transition to the physical event execution. On the left is the participant's dynamic QR code. On the right, I am opening the mobile Administrator Scanner view. I scan the QR for 'Lunch'. \*\*. The meal is logged. Now, watch exactly what happens if a student attempts coupon fraud by screenshotting and passing this QR code to a friend in line. I scan it again. \*\*. Because we utilize strict atomic update operators at the database level, concurrent race conditions are mathematically impossible. Fraud is entirely eliminated from the venue."

**\[2:15 \- 2:45\] Network Resilience:**

"We know from experience that campus Wi-Fi infrastructure crashes during major hackathons. With a single click of this toggle, we activate 'Bandwidth-Light Mode.' Advanced CSS variable manipulation instantly strips heavy Document Object Model elements, removes images, and transitions the UI to a raw, high-contrast data feed that requires mere kilobytes to operate smoothly, ensuring the administrative dashboard never goes offline."

**\[2:45 \- 3:00\] The Conclusion:**

"In exactly 15 hours, our team has architected a mathematically secure, AI-augmented, and highly scalable MERN pipeline that completely digitizes the hackathon lifecycle. We have transformed chaos into a streamlined, autonomous flow. Thank you."

#### **Works cited**

1. PS 2.pdf
2. Zero to Hero in 36 Hours — A Hackathon Project Guide | by Nicholas Walsh | Medium, accessed on February 19, 2026, [https://medium.com/@nicholasmwalsh/zero-to-hero-in-36-hours-a-hackathon-project-guide-e7aeb5989c74](https://medium.com/@nicholasmwalsh/zero-to-hero-in-36-hours-a-hackathon-project-guide-e7aeb5989c74)
3. My first hackathon experience\!. 58 hours of tireless coding and one… | by Asavari Ambavane | Developer Students Club, VJTI | Medium, accessed on February 19, 2026, [https://medium.com/dscvjti/my-first-hackathon-experience-95ef45fd4b59](https://medium.com/dscvjti/my-first-hackathon-experience-95ef45fd4b59)
4. Building Role-Based Access Control (RBAC) in Express: A Practical Guide \- Medium, accessed on February 19, 2026, [https://medium.com/towardsdev/building-role-based-access-control-rbac-in-express-a-practical-guide-1f790b5aead0](https://medium.com/towardsdev/building-role-based-access-control-rbac-in-express-a-practical-guide-1f790b5aead0)
5. passport-jwt, accessed on February 19, 2026, [https://www.passportjs.org/packages/passport-jwt/](https://www.passportjs.org/packages/passport-jwt/)
6. How to Use Passport.js for Authentication in Node.js \- OneUptime, accessed on February 19, 2026, [https://oneuptime.com/blog/post/2026-01-22-nodejs-passport-authentication/view](https://oneuptime.com/blog/post/2026-01-22-nodejs-passport-authentication/view)
7. How to Generate QR Codes with Node.js and Express.js | by Mohsin Ansari \- Medium, accessed on February 19, 2026, [https://medium.com/@mohsinansari.dev/how-to-generate-qr-codes-with-node-js-and-express-js-a098f9a38525](https://medium.com/@mohsinansari.dev/how-to-generate-qr-codes-with-node-js-and-express-js-a098f9a38525)
8. Atomicity and Transactions \- Database Manual \- MongoDB Docs, accessed on February 19, 2026, [https://www.mongodb.com/docs/manual/core/write-operations-atomicity/](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
9. How To Compare Two Faces For Similarity Using Face-api-js In ReactJs, accessed on February 19, 2026, [https://petec0x0.medium.com/how-to-compare-two-faces-for-similarity-using-face-api-js-in-reactjs-e9344010dd89](https://petec0x0.medium.com/how-to-compare-two-faces-for-similarity-using-face-api-js-in-reactjs-e9344010dd89)
10. face-api.js, accessed on February 19, 2026, [https://justadudewhohacks.github.io/face-api.js/docs/index.html](https://justadudewhohacks.github.io/face-api.js/docs/index.html)
11. How I Used Nodemailer to Send OTPs in My App | by Ankit Kaushal \- Medium, accessed on February 19, 2026, [https://medium.com/@ankit-kaushal/how-i-used-nodemailer-to-send-otps-in-my-app-3979ee48fc2d](https://medium.com/@ankit-kaushal/how-i-used-nodemailer-to-send-otps-in-my-app-3979ee48fc2d)
12. AADHAAR Card Masking Made Easy with Intelligent Document Processing, accessed on February 19, 2026, [https://automationedge.com/blogs/aadhaar-card-masking-made-easy-with-intelligent-document-processing/](https://automationedge.com/blogs/aadhaar-card-masking-made-easy-with-intelligent-document-processing/)
13. How to check Aadhaar number is valid or not using Regular Expression \- GeeksforGeeks, accessed on February 19, 2026, [https://www.geeksforgeeks.org/dsa/how-to-check-aadhar-number-is-valid-or-not-using-regular-expression/](https://www.geeksforgeeks.org/dsa/how-to-check-aadhar-number-is-valid-or-not-using-regular-expression/)
14. Aadhaar masking \- javascript \- Stack Overflow, accessed on February 19, 2026, [https://stackoverflow.com/questions/59737177/aadhaar-masking](https://stackoverflow.com/questions/59737177/aadhaar-masking)
15. Structured model outputs | OpenAI API, accessed on February 19, 2026, [https://developers.openai.com/api/docs/guides/structured-outputs/](https://developers.openai.com/api/docs/guides/structured-outputs/)
16. REST API endpoints for repository contents \- GitHub Docs, accessed on February 19, 2026, [https://docs.github.com/en/rest/repos/contents](https://docs.github.com/en/rest/repos/contents)
17. High-performance and memory efficient native C++ text similarity algorithms for Node.js \- GitHub, accessed on February 19, 2026, [https://github.com/piotrmaciejbednarski/text-similarity-node](https://github.com/piotrmaciejbednarski/text-similarity-node)
18. octokit/octokit.js: The all-batteries-included GitHub SDK for Browsers, Node.js, and Deno., accessed on February 19, 2026, [https://github.com/octokit/octokit.js/](https://github.com/octokit/octokit.js/)
19. Implementing Light/Dark Theme \- My Struggles and Tips \- DEV Community, accessed on February 19, 2026, [https://dev.to/alexandru-ene-dev/implementing-lightdark-theme-my-struggles-and-tips-1aon](https://dev.to/alexandru-ene-dev/implementing-lightdark-theme-my-struggles-and-tips-1aon)
20. Light/dark mode: React implementation \- Ayc0, accessed on February 19, 2026, [https://ayc0.github.io/posts/light-dark-mode-react-implementation/](https://ayc0.github.io/posts/light-dark-mode-react-implementation/)
21. Creating Light/Dark mode on a React App with Context | by Gabriel Schincariol Cavalcante | LET'S MAKE SOMETHING UP | Medium, accessed on February 19, 2026, [https://medium.com/lets-make-something-up/creating-light-dark-mode-on-a-react-app-with-context-589a5465f639](https://medium.com/lets-make-something-up/creating-light-dark-mode-on-a-react-app-with-context-589a5465f639)
22. How to Implement OTP Authentication in Rust with Twilio, accessed on February 19, 2026, [https://www.twilio.com/en-us/blog/developers/community/how-to-implement-otp-authentication-in-rust-with-twilio](https://www.twilio.com/en-us/blog/developers/community/how-to-implement-otp-authentication-in-rust-with-twilio)
23. Send an SMS Verification Code in 5 minutes \- Twilio, accessed on February 19, 2026, [https://www.twilio.com/en-us/blog/sms-2fa-otp-5-minutes](https://www.twilio.com/en-us/blog/sms-2fa-otp-5-minutes)
24. Using Amazon Rekognition on Cloudinary to Auto-Tag Faces with Names \- GitHub, accessed on February 19, 2026, [https://github.com/cloudinary-devs/cloudinary-face-rekognition](https://github.com/cloudinary-devs/cloudinary-face-rekognition)
25. Node.js SDK – Node.js Upload \+ Image, Video Transformations | Documentation, accessed on February 19, 2026, [https://cloudinary.com/documentation/node_integration](https://cloudinary.com/documentation/node_integration)
26. Face-Detection Algorithms for Image Transformations | Documentation \- Cloudinary, accessed on February 19, 2026, [https://cloudinary.com/documentation/face_detection_based_transformations](https://cloudinary.com/documentation/face_detection_based_transformations)
27. qrcode \- NPM, accessed on February 19, 2026, [https://www.npmjs.com/package/qrcode](https://www.npmjs.com/package/qrcode)
28. qr-scanner \- NPM, accessed on February 19, 2026, [https://www.npmjs.com/package/qr-scanner](https://www.npmjs.com/package/qr-scanner)
29. Top 5 Face Recognition APIs (2026) \- Banuba, accessed on February 19, 2026, [https://www.banuba.com/blog/best-face-recognition-apis](https://www.banuba.com/blog/best-face-recognition-apis)
30. Face-api.js: JavaScript Face Recognition Leveraging TensorFlow.js \- InfoQ, accessed on February 19, 2026, [https://www.infoq.com/news/2018/11/faces-api-js/](https://www.infoq.com/news/2018/11/faces-api-js/)
31. Realtime JavaScript Face Tracking and Face Recognition using face-api.js' MTCNN Face Detector | by Vincent Mühler | ITNEXT, accessed on February 19, 2026, [https://itnext.io/realtime-javascript-face-tracking-and-face-recognition-using-face-api-js-mtcnn-face-detector-d924dd8b5740](https://itnext.io/realtime-javascript-face-tracking-and-face-recognition-using-face-api-js-mtcnn-face-detector-d924dd8b5740)
32. Aadhaar Masking Tool by FintegrationAI: Secure Aadhar Data Compliance, accessed on February 19, 2026, [https://www.fintegrationfs.com/post/aadhaar-masking-solution-with-fintegrationai](https://www.fintegrationfs.com/post/aadhaar-masking-solution-with-fintegrationai)
33. Devansh80/Aadhaar-UID-Masking-Tool: Final Year Project for Aadhar Card Masking Using Deep Learning and Image Processing Concepts. \- GitHub, accessed on February 19, 2026, [https://github.com/Devansh80/Aadhaar-UID-Masking-Tool](https://github.com/Devansh80/Aadhaar-UID-Masking-Tool)
34. How to Structure a MERN Stack Project Like a Professional (Scalable Folder Architecture), accessed on February 19, 2026, [https://medium.com/@sundararajanselvarasu/how-to-structure-a-mern-stack-project-like-a-professional-fe868d66ee63](https://medium.com/@sundararajanselvarasu/how-to-structure-a-mern-stack-project-like-a-professional-fe868d66ee63)
35. MERN Stack Project Structure: Best Practices \- DEV Community, accessed on February 19, 2026, [https://dev.to/kingsley/mern-stack-project-structure-best-practices-2adk](https://dev.to/kingsley/mern-stack-project-structure-best-practices-2adk)
36. Express.js And MongoDB REST API Tutorial, accessed on February 19, 2026, [https://www.mongodb.com/resources/languages/express-mongodb-rest-api-tutorial](https://www.mongodb.com/resources/languages/express-mongodb-rest-api-tutorial)
37. Building a Food Ordering System with MEAN Stack (Mongo, Express, Angular and Nodejs., accessed on February 19, 2026, [https://steemit.com/utopianio/@sirfreeman/building-a-food-ordering-system-with-mean-stack-mongo-express-angular-and-nodejs](https://steemit.com/utopianio/@sirfreeman/building-a-food-ordering-system-with-mean-stack-mongo-express-angular-and-nodejs)
38. User Authentication in Web Apps (Passport.js, Node, Express) \- YouTube, accessed on February 19, 2026, [https://www.youtube.com/watch?v=F-sFp_AvHc8](https://www.youtube.com/watch?v=F-sFp_AvHc8)
39. Documentation: Strategies \- Passport.js, accessed on February 19, 2026, [https://www.passportjs.org/concepts/authentication/strategies/](https://www.passportjs.org/concepts/authentication/strategies/)
40. Easy Way to Put User Role in JWT | Cerbos, accessed on February 19, 2026, [https://www.cerbos.dev/blog/easy-way-to-put-user-role-in-jwt](https://www.cerbos.dev/blog/easy-way-to-put-user-role-in-jwt)
41. Multiple passport-jwt strategy in the same app \- Stack Overflow, accessed on February 19, 2026, [https://stackoverflow.com/questions/39795898/multiple-passport-jwt-strategy-in-the-same-app](https://stackoverflow.com/questions/39795898/multiple-passport-jwt-strategy-in-the-same-app)
42. Role Based Access Control, secure and correct way? \- The freeCodeCamp Forum, accessed on February 19, 2026, [https://forum.freecodecamp.org/t/role-based-access-control-secure-and-correct-way/434475](https://forum.freecodecamp.org/t/role-based-access-control-secure-and-correct-way/434475)
43. How To Implement Express Authentication with RBAC (Role Based Access Control), accessed on February 19, 2026, [https://dev.to/ttibbs/express-authentication-rbac-5dfo](https://dev.to/ttibbs/express-authentication-rbac-5dfo)
44. Is it possible to have QR codes read and added to a MongoDB? \[closed\] \- Stack Overflow, accessed on February 19, 2026, [https://stackoverflow.com/questions/24300286/is-it-possible-to-have-qr-codes-read-and-added-to-a-mongodb](https://stackoverflow.com/questions/24300286/is-it-possible-to-have-qr-codes-read-and-added-to-a-mongodb)
45. MongoDB atomic update on document \- Working with Data, accessed on February 19, 2026, [https://www.mongodb.com/community/forums/t/mongodb-atomic-update-on-document/8843](https://www.mongodb.com/community/forums/t/mongodb-atomic-update-on-document/8843)
46. Introducing Structured Outputs in the API \- OpenAI, accessed on February 19, 2026, [https://openai.com/index/introducing-structured-outputs-in-the-api/](https://openai.com/index/introducing-structured-outputs-in-the-api/)
47. Scripting with the REST API and JavaScript \- GitHub Docs, accessed on February 19, 2026, [https://docs.github.com/rest/guides/scripting-with-the-rest-api-and-javascript](https://docs.github.com/rest/guides/scripting-with-the-rest-api-and-javascript)
48. Rabbitzzc/js-string-comparison: A library implementing different string similarity using JavaScript. \- GitHub, accessed on February 19, 2026, [https://github.com/Rabbitzzc/js-string-comparison](https://github.com/Rabbitzzc/js-string-comparison)
49. Plan Sprint Hackathon M2 22-23 | PDF | Prototype \- Scribd, accessed on February 19, 2026, [https://www.scribd.com/document/747305922/Plan-sprint-hackathon-M2-22-23](https://www.scribd.com/document/747305922/Plan-sprint-hackathon-M2-22-23)
50. How to Build a Teen Hackathon Team from Scratch | RISE Research, accessed on February 19, 2026, [https://riseglobaleducation.com/blogs/how-to-build-a-teen-hackathon-team-from-scratch](https://riseglobaleducation.com/blogs/how-to-build-a-teen-hackathon-team-from-scratch)
51. hackathon-starter \- NPM, accessed on February 19, 2026, [https://www.npmjs.com/package/hackathon-starter](https://www.npmjs.com/package/hackathon-starter)
52. Learn MERN and Get a Head Start At Your Next Hackathon | by Brayden Cloud \- Medium, accessed on February 19, 2026, [https://medium.com/hello-asterisk/learn-mern-and-get-a-head-start-at-your-next-hackathon-bad232a4a482](https://medium.com/hello-asterisk/learn-mern-and-get-a-head-start-at-your-next-hackathon-bad232a4a482)
53. sahat/hackathon-starter: A boilerplate for Node.js web applications \- GitHub, accessed on February 19, 2026, [https://github.com/sahat/hackathon-starter](https://github.com/sahat/hackathon-starter)
54. How to Authorize User Roles and Permissions | Node.js & Express Authorization Tutorial, accessed on February 19, 2026, [https://www.youtube.com/watch?v=fUWkVxCv4IQ](https://www.youtube.com/watch?v=fUWkVxCv4IQ)
55. Building a Secure MERN Stack Authentication System with JWT, Email Verification, and OTP-Based Password Reset | by Darshitt Chovatiya | Medium, accessed on February 19, 2026, [https://medium.com/@darshitt.chovatiya9/building-a-secure-mern-stack-authentication-system-with-jwt-email-verification-and-otp-based-bafa828d0eb1](https://medium.com/@darshitt.chovatiya9/building-a-secure-mern-stack-authentication-system-with-jwt-email-verification-and-otp-based-bafa828d0eb1)
56. Cloudinary Unsigned Upload and Face Detection \- DEV Community, accessed on February 19, 2026, [https://dev.to/codingcatdev/cloudinary-unsigned-upload-and-face-detection-ige](https://dev.to/codingcatdev/cloudinary-unsigned-upload-and-face-detection-ige)
57. Admin vs User Dashboards: A Full-Stack Role-Based Auth Example | by ΛK HΛY | Medium, accessed on February 19, 2026, [https://medium.com/@akxay/admin-vs-user-dashboards-a-full-stack-role-based-auth-example-cfc2165d365d](https://medium.com/@akxay/admin-vs-user-dashboards-a-full-stack-role-based-auth-example-cfc2165d365d)

[image1]: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAXCAYAAACvd9dwAAACNklEQVR4Xu2WvWsVQRRHrySCwa9CiQYJRBBBBBs1VoKIpIsIIaQIaqmdXfIXBLTQQrRRJGhpodhYWEjARmNKRbAzBCSITYjgB2p+h9mYm7vZfbsxr9E9cHi7d2bf7p25s7NmDQ0N/xJn5E15R/aGtqpsktflsxC7IE+6GAzLgRBrC3vlR3lJHpU/5Zjs8J0qcNbStVMuti07/y0X5az8Lj/JYyvd2sNm+VD2uxiJ8ZAjLlaFd5aSmHIxn5y3b6VLPfbLe/Kq7AptkUlLN/Nsly/krxAvY0iet3xycF+Oh1htqO8Tcl5eCW1FvLZ8cn60q9AnX8lBa1Ny5yyVBVJqVflg+STqJMe9qBJKuVVyvEAuZr8tuSYX5IPYUIMvlk/CJ8dxGTPycHZcltxzd86AsKYp5RysKdbKDdkT2uryN8mxni+786LkWCr7Qox+VNkeH7wrv1kqg42AmS9LrnN10ypIzC+BouTW4oelvmwfOZgxHuy2rX/TBd6KZckVwabPnuVlH+MaSo5z+jzOYm/SZX9YrpjCF80OSzP4WR6x9LasC18lMYnd8q3V2wqAB40zxzGxORcDYvw/A1AKpfFeTsvToa0VpyyN9BYXO2RpwF66GPfgYSZcLLJWcrfkU3nAxYB+PO+uEC+F2Xtk6eGY2SrslF8tzeJodsz3oK+EsuRYIstbipc1CAw4n3d8tz6xNJjHs7Z1wYgwMt2xoYCDlkqcBLeGto2A/+S/uUfbvykbGhr+Y5YAo+GSqbaJ7zcAAAAASUVORK5CYII=
