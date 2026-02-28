import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import { calculateDistance } from "../utils/distance.js";
import {
  categorizeJobDescription,
  enhanceJobDescription,
} from "../services/ai.service.js";
import { createNotification } from "../services/notification.service.js";

export const createJob = async (req, res) => {
  try {
    const { description, paymentOffer, location, address } = req.body;

    if (req.user.userType !== "client") {
      return res.status(403).json({ error: "Only clients can create jobs" });
    }

    // Use AI to categorize the job description
    const categorization = await categorizeJobDescription(description);

    // Optionally enhance the description for better clarity
    const enhancedDescription = await enhanceJobDescription(
      description,
      categorization.displayName,
    );

    const job = await Job.create({
      clientId: req.user._id,
      description: enhancedDescription,
      paymentOffer,
      location,
      address,
      category: categorization.category,
      status: "pending",
    });

    await job.populate("clientId", "name phone address");

    res.status(201).json({
      message: "Job created successfully",
      job,
      aiCategorization: {
        category: categorization.category,
        displayName: categorization.displayName,
        confidence: categorization.confidence,
      },
    });
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    let query = {};

    if (req.user.userType === "client") {
      query.clientId = req.user._id;
    } else {
      query.workerId = req.user._id;
    }

    const jobs = await Job.find(query)
      .populate("clientId", "name phone address rating")
      .populate("workerId", "name phone address rating categories")
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate("clientId", "name phone address rating")
      .populate("workerId", "name phone address rating categories");

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (
      job.clientId._id.toString() !== req.user._id.toString() &&
      (!job.workerId || job.workerId._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.userType !== "worker") {
      return res.status(403).json({ error: "Only workers can accept jobs" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if job category matches worker's categories
    if (!req.user.categories.includes(job.category)) {
      return res
        .status(403)
        .json({ error: "This job category doesn't match your skills" });
    }

    // Handle pending jobs (worker self-assigns)
    if (job.status === "pending") {
      if (job.workerId) {
        return res
          .status(400)
          .json({ error: "Job is already assigned to another worker" });
      }

      // Assign worker and accept job in one step
      job.workerId = req.user._id;
      job.status = "accepted";
      job.assignedAt = new Date();
      job.acceptedAt = new Date();
      await job.save();

      await User.findByIdAndUpdate(req.user._id, { status: "busy" });

      await job.populate("clientId", "name phone address");
      await job.populate("workerId", "name phone address rating categories");

      return res.json({
        message: "Job accepted successfully",
        job,
      });
    }

    // Handle assigned jobs (worker confirms assignment)
    if (job.status === "assigned") {
      if (
        !job.workerId ||
        job.workerId.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "This job is not assigned to you" });
      }

      job.status = "accepted";
      job.acceptedAt = new Date();
      await job.save();

      await User.findByIdAndUpdate(req.user._id, { status: "busy" });

      await job.populate("clientId", "name phone address");
      await job.populate("workerId", "name phone address rating categories");

      return res.json({
        message: "Job accepted successfully",
        job,
      });
    }

    return res
      .status(400)
      .json({ error: "Job cannot be accepted in current status" });
  } catch (error) {
    console.error("Accept job error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const startJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.userType !== "worker") {
      return res.status(403).json({ error: "Only workers can start jobs" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "This job is not assigned to you" });
    }

    if (!["accepted", "assigned"].includes(job.status)) {
      return res
        .status(400)
        .json({ error: "Job must be accepted or assigned before starting" });
    }

    job.status = "in_progress";
    job.startedAt = new Date();
    if (!job.workDuration) {
      job.workDuration = {};
    }
    job.workDuration.startedAt = new Date();
    await job.save();

    res.json({
      message: "Job started successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.userType !== "worker") {
      return res.status(403).json({ error: "Only workers can complete jobs" });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "This job is not assigned to you" });
    }

    if (job.status !== "in_progress") {
      return res
        .status(400)
        .json({ error: "Job must be in progress to complete" });
    }

    const now = new Date();
    job.status = "completed";
    job.completedAt = now;

    if (!job.workDuration) {
      job.workDuration = {};
    }
    job.workDuration.completedAt = now;

    if (job.workDuration.startedAt) {
      const durationMs = now - new Date(job.workDuration.startedAt);
      job.workDuration.totalHours =
        Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    }

    if (!job.payment) {
      job.payment = {};
    }
    job.payment.status = "pending";
    job.payment.deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await job.save();

    await User.findByIdAndUpdate(req.user._id, { status: "available" });

    res.json({
      message: "Job completed successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (
      job.clientId.toString() !== req.user._id.toString() &&
      (!job.workerId || job.workerId.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (["completed", "cancelled"].includes(job.status)) {
      return res
        .status(400)
        .json({ error: "Job cannot be cancelled in current status" });
    }

    job.status = "cancelled";
    job.cancelledAt = new Date();
    job.cancellationReason = reason || "No reason provided";
    await job.save();

    if (job.workerId) {
      await User.findByIdAndUpdate(job.workerId, { status: "available" });
    }

    res.json({
      message: "Job cancelled successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableJobs = async (req, res) => {
  try {
    const { category, maxDistance = 10000, page = 1, limit = 20 } = req.query;

    const query = { status: "pending" };
    if (category && category !== "all") {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, totalCount] = await Promise.all([
      Job.find(query)
        .populate("clientId", "name phone address rating")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Job.countDocuments(query),
    ]);

    let jobsWithDistance = jobs;
    if (req.user && req.user.location) {
      jobsWithDistance = jobs
        .map((job) => {
          const distance = calculateDistance(
            req.user.location.coordinates,
            job.location.coordinates,
          );
          return { ...job, distance };
        })
        .filter((job) => job.distance <= maxDistance);
    }

    res.json({
      jobs: jobsWithDistance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalJobs: totalCount,
        jobsPerPage: parseInt(limit),
        hasNextPage: skip + jobs.length < totalCount,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Get available jobs error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (req.user.userType !== "worker") {
      return res.status(403).json({ error: "Only workers can apply to jobs" });
    }

    const job = await Job.findById(jobId).populate("clientId", "name");

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "pending") {
      return res.status(400).json({ error: "Job is no longer available" });
    }

    job.workerId = req.user._id;
    job.status = "accepted";
    job.assignedAt = new Date();

    await job.save();

    await createNotification({
      userId: job.clientId._id,
      type: "job_accepted",
      title: "Worker Assigned",
      message: `${req.user.name} accepted your job`,
      data: {
        jobId: job._id.toString(),
        workerId: req.user._id.toString(),
      },
    });

    res.json({ message: "Job accepted successfully", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Negotiation functions removed - using simple accept/reject flow

export const markPaid = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { method } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (job.status !== "completed") {
      return res
        .status(400)
        .json({ error: "Job must be completed before marking as paid" });
    }

    job.paymentStatus = "completed";
    job.paymentMode = method || "offline";

    await job.save();

    await User.findByIdAndUpdate(job.workerId, {
      $inc: {
        "earnings.total": job.paymentOffer,
        "earnings.thisMonth": job.paymentOffer,
      },
    });

    await createNotification({
      userId: job.workerId,
      type: "payment_received",
      title: "Payment Received",
      message: `Client marked payment of ₹${job.paymentOffer} as completed`,
      data: {
        jobId: job._id.toString(),
        amount: job.paymentOffer,
      },
    });

    res.json({ message: "Payment marked successfully", job });
  } catch (error) {
    console.error("Mark paid error:", error);
    res.status(500).json({ error: error.message });
  }
};
