import Job from "../models/Job.model.js";
import User from "../models/User.model.js";
import { calculateDistance } from "../utils/distance.js";

export const findWorker = async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status !== "pending") {
      return res.status(400).json({ error: "Job is not in pending status" });
    }

    const workers = await User.find({
      userType: "worker",
      status: "available",
      categories: job.category,
    });

    if (workers.length === 0) {
      return res
        .status(404)
        .json({ error: "No available workers found for this category" });
    }

    const scoredWorkers = workers.map((worker) => {
      const distance = calculateDistance(
        job.location.coordinates,
        worker.location.coordinates,
      );

      const distanceScore = Math.max(0, 100 - distance * 10);
      const ratingScore = (worker.rating / 5.0) * 100;
      const visibilityScore = worker.visibilityWeight * 100;

      const finalScore =
        distanceScore * 0.5 + ratingScore * 0.3 + visibilityScore * 0.2;

      return {
        worker,
        distance,
        score: finalScore,
      };
    });

    scoredWorkers.sort((a, b) => b.score - a.score);

    const bestMatch = scoredWorkers[0];

    job.workerId = bestMatch.worker._id;
    job.status = "assigned";
    job.assignedAt = new Date();
    job.distance = bestMatch.distance;
    await job.save();

    await job.populate("workerId", "name phone address rating categories");

    res.json({
      message: "Worker assigned successfully",
      job,
      matchDetails: {
        distance: bestMatch.distance,
        workerRating: bestMatch.worker.rating,
        matchScore: bestMatch.score,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNearbyJobs = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { maxDistance = 10 } = req.query;

    const worker = await User.findById(workerId);

    if (!worker || worker.userType !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    console.log("Worker categories:", worker.categories);
    console.log("Worker ID:", worker._id);

    // Find jobs that are either:
    // 1. Pending and match worker's categories (available for self-assignment)
    // 2. Assigned to this specific worker (waiting for acceptance)
    const jobs = await Job.find({
      $or: [
        {
          status: "pending",
          category: { $in: worker.categories },
        },
        {
          status: "assigned",
          workerId: worker._id,
        },
      ],
    }).populate("clientId", "name phone address");

    console.log(`Found ${jobs.length} jobs (pending + assigned to worker)`);

    const nearbyJobs = jobs
      .map((job) => {
        const distance = calculateDistance(
          worker.location.coordinates,
          job.location.coordinates,
        );
        return { ...job.toObject(), distance };
      })
      .filter((job) => job.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    console.log(`${nearbyJobs.length} jobs within ${maxDistance}km distance`);

    res.json({ jobs: nearbyJobs });
  } catch (error) {
    console.error("Get nearby jobs error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getNearbyWorkers = async (req, res) => {
  try {
    const { maxDistance = 10 } = req.query;

    if (req.user.userType !== "client") {
      return res
        .status(403)
        .json({ error: "Only clients can view nearby workers" });
    }

    const workers = await User.find({
      userType: "worker",
      status: "available",
    }).select("-password");

    const nearbyWorkers = workers
      .map((worker) => {
        const distance = calculateDistance(
          req.user.location.coordinates,
          worker.location.coordinates,
        );
        return { ...worker.toObject(), distance };
      })
      .filter((worker) => worker.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);

    res.json({ workers: nearbyWorkers });
  } catch (error) {
    console.error("Get nearby workers error:", error);
    res.status(500).json({ error: error.message });
  }
};
