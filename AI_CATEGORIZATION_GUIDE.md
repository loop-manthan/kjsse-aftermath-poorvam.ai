# AI-Powered Job Categorization Guide

## 🤖 Overview

The Poorvam.ai platform now uses **Google Gemini AI** to automatically categorize job requests and enhance job descriptions. When a client creates a job, the AI analyzes the description and intelligently identifies the appropriate worker category.

---

## ✨ Features

### 1. **Automatic Job Categorization**
- AI analyzes job description text
- Identifies the most relevant worker category
- Matches jobs with appropriate workers automatically

### 2. **Description Enhancement**
- AI improves job descriptions for clarity
- Adds relevant technical details
- Maintains original intent while making it more specific

### 3. **Smart Worker Matching**
- Jobs are automatically filtered by category
- Workers only see jobs matching their skills
- Better matching = faster job completion

---

## 🔧 Technical Implementation

### **Backend Components**

#### 1. AI Service (`src/services/ai.service.js`)

**Functions:**

**`categorizeJobDescription(description)`**
- Analyzes job description using Gemini AI
- Returns category name, display name, and confidence level
- Falls back to keyword matching if AI fails

```javascript
const result = await categorizeJobDescription("My kitchen tap is leaking");
// Returns: { category: 'plumber', displayName: 'Plumber', confidence: 'high' }
```

**`enhanceJobDescription(description, category)`**
- Improves description clarity
- Adds relevant technical details
- Keeps it concise (2-3 sentences)

```javascript
const enhanced = await enhanceJobDescription("Tap leaking", "Plumber");
// Returns: "Kitchen tap requires repair due to continuous water leakage. Professional plumber needed to fix or replace the faulty faucet and check for any pipe damage."
```

#### 2. Job Controller (`src/controllers/job.controller.js`)

**Updated `createJob` endpoint:**
```javascript
// Use AI to categorize
const categorization = await categorizeJobDescription(description);

// Enhance description
const enhancedDescription = await enhanceJobDescription(description, categorization.displayName);

// Create job with AI-generated category
const job = await Job.create({
  description: enhancedDescription,
  category: categorization.category,
  // ... other fields
});
```

#### 3. Matching System

Jobs are automatically matched with workers based on:
- **Category match**: Worker's categories include the job category
- **Distance**: Proximity to job location
- **Rating**: Worker's performance rating
- **Availability**: Worker's online/offline status

---

## 📊 Available Categories

The AI can identify these worker categories:

1. **Plumber** - Plumbing, pipes, water, drainage, leaks
2. **Electrician** - Electrical work, wiring, lights, power
3. **Carpenter** - Carpentry, furniture, wood work
4. **Painter** - Painting, walls, interior/exterior
5. **Cleaner** - Cleaning, housekeeping, maintenance
6. **Gardener** - Gardening, landscaping, lawn care
7. **Mechanic** - Vehicle repair, auto service
8. **AC Technician** - Air conditioning, HVAC, cooling
9. **Pest Control** - Pest control, fumigation
10. **Driver** - Driving, transport, delivery
11. **Cook** - Cooking, catering, food preparation
12. **Tutor** - Teaching, education, tutoring
13. **Beautician** - Beauty services, salon, grooming
14. **Tailor** - Tailoring, stitching, alterations
15. **Mason** - Masonry, construction, building

---

## 🚀 How It Works

### **Client Side (Job Creation)**

1. **Client enters job description**
   ```
   Example: "My bathroom tap is leaking and water is dripping continuously"
   ```

2. **AI analyzes the description**
   - Identifies keywords: "tap", "leaking", "water"
   - Matches with category: "Plumber"
   - Confidence: "high"

3. **AI enhances description**
   ```
   Enhanced: "Bathroom tap requires immediate repair due to continuous water leakage. 
   Professional plumber needed to fix the faulty faucet and prevent water wastage."
   ```

4. **Job is created with category**
   - Category: `plumber`
   - Display Name: `Plumber`
   - Enhanced description saved to database

5. **Success notification shown**
   - Green banner displays detected category
   - Shows confidence level
   - Auto-dismisses after 5 seconds

### **Worker Side (Job Display)**

1. **Worker logs in with categories**
   ```
   Worker categories: ["plumber", "electrician"]
   ```

2. **System fetches matching jobs**
   ```javascript
   // Only shows jobs where category matches worker's skills
   const jobs = await Job.find({
     status: 'pending',
     category: { $in: worker.categories }
   });
   ```

3. **Worker sees relevant jobs only**
   - Plumber sees plumbing jobs
   - Electrician sees electrical jobs
   - No irrelevant job notifications

---

## 🔑 Setup Instructions

### **1. Get Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

### **2. Configure Backend**

Add to `backend/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### **3. Install Dependencies**

Already installed:
```bash
npm install @google/generative-ai
```

### **4. Seed Categories**

Run once to populate database:
```bash
cd backend
npm run seed:categories
```

### **5. Restart Backend**

```bash
npm start
```

---

## 💡 Usage Examples

### **Example 1: Plumbing Job**

**Input:**
```
Description: "Tap is broken"
```

**AI Processing:**
- Category: `plumber`
- Enhanced: "Kitchen/bathroom tap requires repair or replacement. Professional plumber needed to fix the broken faucet."

**Result:**
- Job created with category "plumber"
- Only plumbers see this job
- Enhanced description provides clarity

### **Example 2: Electrical Job**

**Input:**
```
Description: "Light not working in bedroom"
```

**AI Processing:**
- Category: `electrician`
- Enhanced: "Bedroom light fixture requires electrical repair. Electrician needed to diagnose and fix the non-functional light, check wiring and replace bulb or fixture if necessary."

**Result:**
- Job created with category "electrician"
- Only electricians see this job

### **Example 3: Multiple Keywords**

**Input:**
```
Description: "Need someone to fix my car's engine and also paint the garage"
```

**AI Processing:**
- Primary category: `mechanic` (most prominent task)
- Note: AI chooses the most relevant single category

**Result:**
- Job created with category "mechanic"
- Client can create separate job for painting

---

## 🎯 Confidence Levels

The AI returns confidence levels:

- **High**: Clear match with category keywords and context
- **Medium**: Keyword match using fallback system
- **Low**: No clear match, defaults to "general"

**Confidence Display:**
```javascript
{
  category: 'plumber',
  displayName: 'Plumber',
  confidence: 'high'  // Shown to client
}
```

---

## 🔄 Fallback System

If Gemini API fails (network error, rate limit, etc.):

1. **Keyword Matching Fallback**
   - Scores each category based on keyword matches
   - Selects category with highest score
   - Returns "medium" confidence

2. **Default Fallback**
   - If no keywords match
   - Returns "general" category
   - Returns "low" confidence

**Example Fallback:**
```javascript
// AI service unavailable
// Fallback to keyword matching
const descLower = "tap leaking".toLowerCase();
// Matches keywords: ["tap", "leak", "water"]
// Best match: "plumber" category
```

---

## 📱 Frontend Integration

### **CreateJob Component**

**AI Categorization Display:**
```tsx
{aiCategory && (
  <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30">
    <p className="text-white font-medium">
      AI Detected Category: {aiCategory.displayName}
    </p>
    <p className="text-white/60 text-sm">
      Confidence: {aiCategory.confidence}
    </p>
  </div>
)}
```

**Features:**
- Green success banner
- Shows detected category
- Displays confidence level
- Auto-dismisses after 5 seconds

---

## 🧪 Testing

### **Test Cases**

1. **Clear Category Match**
   ```
   Input: "Plumber needed for pipe repair"
   Expected: category = "plumber", confidence = "high"
   ```

2. **Ambiguous Description**
   ```
   Input: "Need help with home maintenance"
   Expected: category = "general", confidence = "low"
   ```

3. **Multiple Keywords**
   ```
   Input: "Fix electrical wiring and install new lights"
   Expected: category = "electrician", confidence = "high"
   ```

4. **Regional Terms**
   ```
   Input: "Bijli ka kaam hai" (Hindi for electrical work)
   Expected: AI should understand context
   ```

### **Manual Testing**

1. Create a job with description: "My tap is leaking"
2. Check response for `aiCategorization` field
3. Verify category is "plumber"
4. Check worker dashboard - only plumbers see the job
5. Verify enhanced description is clearer

---

## 🛡️ Error Handling

### **API Errors**

```javascript
try {
  const categorization = await categorizeJobDescription(description);
} catch (error) {
  console.error('AI Categorization error:', error);
  // Falls back to keyword matching
  return fallbackCategorization(description);
}
```

### **Invalid API Key**

If `GEMINI_API_KEY` is missing or invalid:
- System logs error
- Falls back to keyword matching
- Jobs still created successfully
- No user-facing errors

### **Rate Limiting**

If Gemini API rate limit exceeded:
- Automatic fallback to keyword matching
- Consider implementing caching
- Monitor API usage in Google Cloud Console

---

## 📈 Performance Optimization

### **Current Implementation**
- AI call on every job creation
- ~1-2 second response time
- Enhances both category and description

### **Optimization Options**

1. **Caching**
   ```javascript
   // Cache common descriptions
   const cache = new Map();
   if (cache.has(description)) {
     return cache.get(description);
   }
   ```

2. **Batch Processing**
   - Process multiple jobs together
   - Reduce API calls

3. **Client-Side Preview**
   - Show predicted category before submission
   - Allow manual override

---

## 🔐 Security Considerations

1. **API Key Protection**
   - Never expose in frontend
   - Store in `.env` file
   - Add to `.gitignore`

2. **Input Validation**
   - Sanitize job descriptions
   - Limit description length
   - Prevent injection attacks

3. **Rate Limiting**
   - Monitor API usage
   - Implement request throttling
   - Set usage quotas

---

## 📊 Monitoring & Analytics

### **Track These Metrics**

1. **Categorization Accuracy**
   - % of jobs correctly categorized
   - User feedback on categories

2. **AI Performance**
   - Average response time
   - Success vs fallback rate
   - API error rate

3. **Worker Matching**
   - Jobs matched to workers
   - Time to job acceptance
   - Category distribution

### **Logging**

```javascript
console.log('AI Categorization:', {
  description: description.substring(0, 50),
  category: categorization.category,
  confidence: categorization.confidence,
  responseTime: Date.now() - startTime
});
```

---

## 🚀 Future Enhancements

1. **Multi-Category Support**
   - Jobs requiring multiple worker types
   - Primary + secondary categories

2. **Learning from Feedback**
   - Track manual category changes
   - Improve AI prompts based on corrections

3. **Language Support**
   - Hindi, Tamil, Telugu descriptions
   - Regional language understanding

4. **Smart Pricing**
   - AI suggests payment based on job complexity
   - Market rate analysis

5. **Urgency Detection**
   - Identify urgent jobs from description
   - Priority matching for emergencies

---

## 📞 Support

### **Common Issues**

**Issue**: "AI categorization not working"
- **Solution**: Check `GEMINI_API_KEY` in `.env`
- Verify API key is valid in Google Cloud Console
- Check backend logs for errors

**Issue**: "All jobs showing as 'general'"
- **Solution**: Descriptions too vague
- Add more specific keywords
- Check if categories are seeded in database

**Issue**: "Workers not seeing jobs"
- **Solution**: Verify worker categories match job categories
- Check worker availability status
- Ensure worker is within distance range

---

## 📝 API Response Format

### **Job Creation Response**

```json
{
  "message": "Job created successfully",
  "job": {
    "_id": "507f1f77bcf86cd799439011",
    "description": "Bathroom tap requires immediate repair...",
    "category": "plumber",
    "paymentOffer": 500,
    "status": "pending",
    "location": {
      "type": "Point",
      "coordinates": [72.8777, 19.0760]
    }
  },
  "aiCategorization": {
    "category": "plumber",
    "displayName": "Plumber",
    "confidence": "high"
  }
}
```

---

## ✅ Summary

The AI-powered job categorization system:

✅ **Automatically categorizes** jobs using Gemini AI  
✅ **Enhances descriptions** for better clarity  
✅ **Matches workers** based on skills and categories  
✅ **Provides fallback** with keyword matching  
✅ **Shows confidence** levels to users  
✅ **Filters jobs** on worker dashboard by category  
✅ **Improves matching** accuracy and speed  

**Result**: Better job-worker matching, faster service delivery, and improved user experience!

---

**Implementation Date:** February 28, 2026  
**Status:** ✅ Complete and Working  
**Version:** 1.0.0
