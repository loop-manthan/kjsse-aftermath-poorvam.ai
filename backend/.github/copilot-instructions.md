You are building the AeroHacks backend AI Analyzer module.

Context:
This backend is Node.js + Express and will later integrate into a full hackathon management system. Currently only the AI Analyzer module must be implemented.

Environment:

* Hugging Face API key is stored in backend/.env as HUGGING_FACE_API
* Use model: mistralai/Mistral-7B-Instruct-v0.2
* Base API URL: https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2

Requirements:
Create a production-ready modular backend implementation using this architecture:

backend/
├── src/
│   ├── routes/
│   │    ai.routes.js
│   ├── controllers/
│   │    ai.controller.js
│   ├── services/
│   │    ai.service.js
│   ├── utils/
│   │    fileParser.js
│   │    hfClient.js
│   │    idGenerator.js
│   ├── middleware/
│   │    upload.middleware.js
│   └── data/
│        analysisStore.js
├── server.js

Use:

* express
* multer
* pdf-parse
* officeparser
* axios
* dotenv
* uuid

Functional Requirements:

1. Implement endpoint:
   GET /api/v1/ai/health
   Returns:
   { status: "ok" }

2. Implement endpoint:
   POST /api/v1/ai/analyze/resume

Accept multipart/form-data:
file: resume.pdf

Steps:

* parse PDF text using pdf-parse
* send text to HuggingFace model
* prompt model to return structured JSON:
  parsed info, scores, recommendations
* generate analysisId
* store result in memory store
* return structured response

3. Implement endpoint:
   POST /api/v1/ai/analyze/ppt

Accept multipart/form-data:
file: presentation.pptx

Steps:

* extract text using officeparser
* send text to HuggingFace model
* prompt model to return scores and feedback
* generate analysisId
* store result
* return JSON response

4. Implement endpoint:
   GET /api/v1/ai/analysis/:analysisId

Return stored result.

5. Implement endpoint:
   GET /api/v1/ai/analysis

Return all stored analyses.

6. Implement endpoint:
   DELETE /api/v1/ai/analysis/:analysisId

Delete stored analysis.

Implementation constraints:

* Use multer disk storage
* Use in-memory storage first (analysisStore.js)
* Use service layer to call HuggingFace API
* hfClient.js must handle API calls
* fileParser.js must extract text from PDF and PPT
* ai.service.js must handle AI logic
* ai.controller.js must handle HTTP layer
* ai.routes.js must define routes

HuggingFace request format:

POST https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2

Headers:
Authorization: Bearer process.env.HUGGING_FACE_API
Content-Type: application/json

Body:
{
inputs: "prompt here"
}

server.js must:

* load dotenv
* initialize express
* use JSON middleware
* register ai routes under /api/v1/ai
* listen on port 5000

Generate complete working code for all files.
