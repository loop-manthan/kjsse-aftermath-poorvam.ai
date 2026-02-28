import { GoogleGenerativeAI } from "@google/generative-ai";
import Category from "../models/Category.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const categorizeJobDescription = async (description) => {
  try {
    // Get all active categories from database
    const categories = await Category.find({ isActive: true });
    const categoryList = categories.map((cat) => ({
      name: cat.name,
      displayName: cat.displayName,
      description: cat.description,
      keywords: cat.keywords,
    }));

    // Create prompt for Gemini
    const prompt = `You are an AI assistant that categorizes job requests for a local services platform.

Available Categories:
${categoryList.map((cat) => `- ${cat.name}: ${cat.description} (Keywords: ${cat.keywords.join(", ")})`).join("\n")}

Job Description: "${description}"

Analyze the job description and determine which category it belongs to. Consider:
1. The main task or service needed
2. Keywords and technical terms used
3. The type of professional required

Respond with ONLY the category name (e.g., "plumber", "electrician", etc.) from the available categories list above. If multiple categories could apply, choose the most relevant one. If no category matches, respond with "general".`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const categoryName = response.text().trim().toLowerCase();

    // Validate that the returned category exists
    const validCategory = categories.find((cat) => cat.name === categoryName);

    return {
      category: validCategory ? validCategory.name : "general",
      displayName: validCategory ? validCategory.displayName : "General",
      confidence: validCategory ? "high" : "low",
    };
  } catch (error) {
    console.error("AI Categorization error:", error);
    // Fallback to keyword matching if AI fails
    return fallbackCategorization(description);
  }
};

// Fallback categorization using keyword matching
const fallbackCategorization = async (description) => {
  try {
    const categories = await Category.find({ isActive: true });
    const descLower = description.toLowerCase();

    // Score each category based on keyword matches
    const scores = categories.map((cat) => {
      let score = 0;
      cat.keywords.forEach((keyword) => {
        if (descLower.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      return { category: cat, score };
    });

    // Sort by score and get the best match
    scores.sort((a, b) => b.score - a.score);

    if (scores[0].score > 0) {
      return {
        category: scores[0].category.name,
        displayName: scores[0].category.displayName,
        confidence: "medium",
      };
    }

    return {
      category: "general",
      displayName: "General",
      confidence: "low",
    };
  } catch (error) {
    console.error("Fallback categorization error:", error);
    return {
      category: "general",
      displayName: "General",
      confidence: "low",
    };
  }
};

export const enhanceJobDescription = async (description, category) => {
  try {
    const prompt = `You are an AI assistant helping to improve job descriptions for a local services platform.

Category: ${category}
Original Description: "${description}"

Enhance this job description by:
1. Making it clearer and more specific
2. Adding relevant technical details if missing
3. Keeping it concise (2-3 sentences max)
4. Maintaining the original intent

Respond with ONLY the enhanced description, nothing else.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text().trim();
  } catch (error) {
    console.error("Description enhancement error:", error);
    return description; // Return original if enhancement fails
  }
};
