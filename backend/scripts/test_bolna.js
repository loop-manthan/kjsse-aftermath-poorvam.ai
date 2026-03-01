#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(backendRoot, ".env") });

const BOLNA_API_BASE = "https://api.bolna.ai/v2";

const args = process.argv.slice(2);
const FLAGS = {
  sync: args.includes("--sync"),
  verbose: args.includes("--verbose"),
  showBody: args.includes("--show-body"),
};

function mask(value, visible = 4) {
  if (!value) return "(missing)";
  if (value.length <= visible * 2) return "*".repeat(value.length);
  return `${value.slice(0, visible)}${"*".repeat(value.length - visible * 2)}${value.slice(-visible)}`;
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function fail(msg) {
  console.log(`❌ ${msg}`);
}

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

async function scanIntegrationWiring() {
  section("Repo Wiring Check");

  const checks = [
    {
      name: "Backend createJob triggers Bolna sync",
      file: path.join(backendRoot, "src", "controllers", "job.controller.js"),
      includes: "syncAllPendingJobsToBolna()",
    },
    {
      name: "Bolna service uses PATCH /v2/agent/:id",
      file: path.join(backendRoot, "src", "services", "bolna.service.js"),
      includes: "PATCH",
    },
    {
      name: "Frontend triggers Make webhook after job post",
      file: path.join(workspaceRoot, "frontend", "src", "components", "client", "CreateJob.tsx"),
      includes: "hook.eu1.make.com",
    },
  ];

  for (const check of checks) {
    const content = await readIfExists(check.file);
    if (!content) {
      fail(`${check.name} — file not found: ${check.file}`);
      continue;
    }

    if (content.includes(check.includes)) {
      ok(`${check.name}`);
    } else {
      warn(`${check.name} — expected pattern not found: ${check.includes}`);
    }
  }
}

async function checkBolnaApi() {
  section("Bolna API Check");

  const bolnaKey = process.env.BOLNA_KEY;
  const agentId = process.env.BOLNA_AGENT_ID;

  if (!bolnaKey || !agentId) {
    fail("BOLNA_KEY or BOLNA_AGENT_ID missing in backend/.env");
    return { canProceed: false };
  }

  ok(`BOLNA_KEY present: ${mask(bolnaKey)}`);
  ok(`BOLNA_AGENT_ID present: ${agentId}`);

  const url = `${BOLNA_API_BASE}/agent/${agentId}`;
  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bolnaKey}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    fail(`Network/API call failed: ${error.message}`);
    return { canProceed: false };
  }

  const bodyText = await response.text();

  if (response.ok) {
    ok(`GET ${url} -> ${response.status}`);

    if (FLAGS.verbose || FLAGS.showBody) {
      const preview = bodyText.length > 1000 ? `${bodyText.slice(0, 1000)}...` : bodyText;
      console.log("Response preview:");
      console.log(preview || "(empty)");
    }

    return { canProceed: true, status: response.status };
  }

  warn(`GET ${url} -> ${response.status}`);

  if (response.status === 401 || response.status === 403) {
    fail("Bolna authentication failed. Check BOLNA_KEY permissions.");
  } else if (response.status === 404) {
    fail("Agent not found. Check BOLNA_AGENT_ID.");
  } else {
    warn("Non-200 response received. Endpoint may still be reachable but request failed.");
  }

  if (FLAGS.showBody || FLAGS.verbose) {
    const preview = bodyText.length > 1000 ? `${bodyText.slice(0, 1000)}...` : bodyText;
    console.log("Error response preview:");
    console.log(preview || "(empty)");
  }

  return { canProceed: false, status: response.status };
}

async function checkMongoPendingJobs() {
  section("Mongo Pending Jobs Check");

  if (!process.env.MONGO_URI) {
    warn("MONGO_URI missing. Skipping pending-jobs diagnostics.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { default: Job } = await import("../src/models/Job.model.js");

    const pendingCount = await Job.countDocuments({ status: "pending" });
    ok(`Pending jobs in DB: ${pendingCount}`);

    const sample = await Job.findOne({ status: "pending" })
      .select("description paymentOffer address category createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (sample) {
      console.log("Latest pending job sample:");
      console.log({
        description: sample.description,
        paymentOffer: sample.paymentOffer,
        address: sample.address,
        category: sample.category,
        createdAt: sample.createdAt,
      });
    } else {
      warn("No pending jobs found.");
    }
  } catch (error) {
    fail(`MongoDB diagnostics failed: ${error.message}`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

async function runLiveSyncIfRequested() {
  section("Bolna Sync Test");

  if (!FLAGS.sync) {
    warn("Dry-run mode: live Bolna PATCH skipped.");
    console.log("Run with --sync to execute the real syncAllPendingJobsToBolna() flow.");
    return;
  }

  if (!process.env.MONGO_URI) {
    fail("MONGO_URI is required for --sync mode.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const { syncAllPendingJobsToBolna } = await import("../src/services/bolna.service.js");

    const result = await syncAllPendingJobsToBolna();
    if (result?.success) {
      ok(`Bolna sync success. Pending jobs synced: ${result.jobCount ?? "unknown"}`);
    } else {
      fail(`Bolna sync failed: ${result?.error || "unknown error"}`);
    }
  } catch (error) {
    fail(`Live sync execution failed: ${error.message}`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

function printHowItWorksSummary() {
  section("How Bolna Works In This Codebase");
  console.log("1) Frontend CreateJob posts data and also triggers a Make webhook.");
  console.log("2) Backend createJob saves the job and calls syncAllPendingJobsToBolna() asynchronously.");
  console.log("3) Bolna service fetches all pending jobs from MongoDB.");
  console.log("4) Service builds one consolidated system prompt with all pending jobs.");
  console.log("5) Service PATCH-es Bolna agent at /v2/agent/:agentId with updated prompt.");
  console.log("6) If Bolna update fails, job creation still succeeds (non-blocking error handling).");
}

async function main() {
  console.log("Bolna Integration Diagnostic");
  console.log(`Mode: ${FLAGS.sync ? "LIVE SYNC" : "DRY RUN"}`);

  await scanIntegrationWiring();
  await checkBolnaApi();
  await checkMongoPendingJobs();
  await runLiveSyncIfRequested();
  printHowItWorksSummary();

  section("Done");
  ok("test_bolna.js completed");
}

main().catch((error) => {
  fail(`Unhandled error: ${error.message}`);
  process.exitCode = 1;
});
