import Review from '../models/Review.model.js';
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';

export const submitReview = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed jobs' });
    }
    
    const isClient = job.clientId.toString() === req.user._id.toString();
    const isWorker = job.workerId && job.workerId.toString() === req.user._id.toString();
    
    if (!isClient && !isWorker) {
      return res.status(403).json({ error: 'You are not part of this job' });
    }
    
    const forUser = isClient ? job.workerId : job.clientId;
    
    const existingReview = await Review.findOne({
      jobId,
      byUser: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this job' });
    }
    
    const review = await Review.create({
      jobId,
      byUser: req.user._id,
      forUser,
      rating,
      comment
    });
    
    if (isClient) {
      job.workerRating = rating;
    } else {
      job.clientRating = rating;
    }
    await job.save();
    
    const targetUser = await User.findById(forUser);
    const allReviews = await Review.find({ forUser });
    
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    targetUser.rating = totalRating / allReviews.length;
    targetUser.totalRatings = allReviews.length;
    targetUser.visibilityWeight = (targetUser.rating / 5.0) * 0.7 + 0.3;
    
    await targetUser.save();
    
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const reviews = await Review.find({ forUser: userId })
      .populate('byUser', 'name userType')
      .populate('jobId', 'category description')
      .sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
