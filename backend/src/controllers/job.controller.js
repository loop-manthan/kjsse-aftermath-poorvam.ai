import Job from '../models/Job.model.js';
import User from '../models/User.model.js';
import { extractCategory } from '../utils/categoryExtractor.js';
import { calculateDistance } from '../utils/distance.js';

export const createJob = async (req, res) => {
  try {
    const { description, paymentOffer, location, address } = req.body;
    
    if (req.user.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can create jobs' });
    }
    
    const category = await extractCategory(description);
    
    const job = await Job.create({
      clientId: req.user._id,
      description,
      paymentOffer,
      location,
      address,
      category
    });
    
    await job.populate('clientId', 'name phone address');
    
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.userType === 'client') {
      query.clientId = req.user._id;
    } else {
      query.workerId = req.user._id;
    }
    
    const jobs = await Job.find(query)
      .populate('clientId', 'name phone address rating')
      .populate('workerId', 'name phone address rating categories')
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
      .populate('clientId', 'name phone address rating')
      .populate('workerId', 'name phone address rating categories');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (
      job.clientId._id.toString() !== req.user._id.toString() &&
      (!job.workerId || job.workerId._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can accept jobs' });
    }
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This job is not assigned to you' });
    }
    
    if (job.status !== 'assigned') {
      return res.status(400).json({ error: 'Job cannot be accepted in current status' });
    }
    
    job.status = 'accepted';
    job.acceptedAt = new Date();
    await job.save();
    
    await User.findByIdAndUpdate(req.user._id, { status: 'busy' });
    
    await job.populate('clientId', 'name phone address');
    
    res.json({
      message: 'Job accepted successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const startJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can start jobs' });
    }
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This job is not assigned to you' });
    }
    
    if (job.status !== 'accepted') {
      return res.status(400).json({ error: 'Job must be accepted before starting' });
    }
    
    job.status = 'in_progress';
    job.startedAt = new Date();
    await job.save();
    
    res.json({
      message: 'Job started successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can complete jobs' });
    }
    
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This job is not assigned to you' });
    }
    
    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Job must be in progress to complete' });
    }
    
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();
    
    await User.findByIdAndUpdate(req.user._id, { status: 'available' });
    
    res.json({
      message: 'Job completed successfully',
      job
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
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (
      job.clientId.toString() !== req.user._id.toString() &&
      (!job.workerId || job.workerId.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (['completed', 'cancelled'].includes(job.status)) {
      return res.status(400).json({ error: 'Job cannot be cancelled in current status' });
    }
    
    job.status = 'cancelled';
    job.cancelledAt = new Date();
    job.cancellationReason = reason || 'No reason provided';
    await job.save();
    
    if (job.workerId) {
      await User.findByIdAndUpdate(job.workerId, { status: 'available' });
    }
    
    res.json({
      message: 'Job cancelled successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
