/**
 * Bolna AI Service
 * Updates the Bolna AI agent's system prompt with ALL pending job data
 * so the voice agent has context about every unaccepted job.
 */

import Job from "../models/Job.model.js";

const BOLNA_API_BASE = "https://api.bolna.ai/v2";

// The base prompt that is already in use on the Bolna agent
const BASE_PROMPT = `You are an agent that calls blue collar workers and assigns them gigs based on the knowledge base given to you. You have backend access as well. You have to guide the workers and answer their questions. You can also use webhooks. You can speak all Indian languages. You can even make up the job yourself too, but keep in mind the properties of the job from the knowledge base. You have to be polite and clear. Do not ask anything from the user. Only give information and answer questions. Do not repeat the same stuff again and again.`;

/**
 * Fetches all pending (unaccepted) jobs from the database and builds
 * a combined system prompt with the base prompt + all pending job data.
 * Then patches the Bolna AI agent's system prompt via the v2 PATCH API.
 *
 * This is called every time a new job is created, ensuring the agent
 * always has the full list of available/unaccepted jobs.
 *
 * @returns {Promise<Object>} Bolna API response
 */
export const syncAllPendingJobsToBolna = async () => {
  const bolnaKey = process.env.BOLNA_KEY;
  const agentId = process.env.BOLNA_AGENT_ID;

  if (!bolnaKey || !agentId) {
    console.warn(
      "Bolna AI: Missing BOLNA_KEY or BOLNA_AGENT_ID in environment variables. Skipping agent update.",
    );
    return null;
  }

  try {
    // Fetch ALL pending (unaccepted) jobs from the database
    const pendingJobs = await Job.find({ status: "pending" })
      .populate("clientId", "name phone address")
      .sort({ createdAt: -1 })
      .lean();

    if (pendingJobs.length === 0) {
      console.log("Bolna AI: No pending jobs found. Updating with base prompt only.");
    }

    // Build the job listings section
    const jobListings = pendingJobs
      .map((job, index) => {
        return `Job #${index + 1}:
  - Description: ${job.description}
  - Payment: ₹${job.paymentOffer}
  - Location: ${job.address || "Not specified"}
  - Category: ${job.category || "Not categorized"}
  - Client Name: ${job.clientId?.name || "Unknown"}
  - Posted: ${new Date(job.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
      })
      .join("\n\n");

    // Combine the base prompt with all pending jobs
    const fullSystemPrompt = `${BASE_PROMPT}

--- AVAILABLE JOBS (${pendingJobs.length} total) ---
${pendingJobs.length > 0 ? jobListings : "No jobs currently available."}
--- END OF AVAILABLE JOBS ---

When speaking to workers, inform them about these available jobs. Match the worker's skills and location to the most relevant jobs. If a worker is interested in a job, guide them on how to accept it.`;

    // PATCH the Bolna agent with the updated prompt
    const response = await fetch(
      `${BOLNA_API_BASE}/agent/${agentId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${bolnaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_prompts: {
            task_1: {
              system_prompt: fullSystemPrompt,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Bolna AI: Failed to update agent. Status: ${response.status}, Body: ${errorBody}`,
      );
      return { success: false, error: errorBody };
    }

    const data = await response.json();
    console.log(
      `Bolna AI: Agent updated successfully with ${pendingJobs.length} pending job(s):`,
      data,
    );
    return { success: true, data, jobCount: pendingJobs.length };
  } catch (error) {
    console.error("Bolna AI: Error updating agent:", error.message);
    return { success: false, error: error.message };
  }
};
