import Transaction from '../models/Transaction.model.js';
import Job from '../models/Job.model.js';

export const createPaymentOrder = async (req, res) => {
  try {
    const { jobId, tip = 0 } = req.body;

    const job = await Job.findById(jobId).populate('clientId workerId');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed before payment' });
    }

    const totalAmount = job.paymentOffer + tip;

    const transaction = await Transaction.create({
      jobId,
      amount: job.paymentOffer,
      tip,
      mode: 'online',
      status: 'pending'
    });

    res.json({
      success: true,
      transaction: {
        transactionId: transaction.transactionId,
        amount: totalAmount
      },
      message: 'Payment order created. Integration with Razorpay pending.'
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    transaction.status = 'completed';
    await transaction.save();

    const job = await Job.findByIdAndUpdate(
      transaction.jobId,
      {
        paymentStatus: 'completed',
        paymentMode: 'online',
        tip: transaction.tip
      },
      { new: true }
    ).populate('clientId workerId');

    res.json({
      success: true,
      message: 'Payment verified successfully',
      transaction,
      job
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const confirmOfflinePayment = async (req, res) => {
  try {
    const { jobId, tip = 0 } = req.body;

    const job = await Job.findById(jobId).populate('clientId workerId');
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.workerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only worker can confirm offline payment' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed' });
    }

    const transaction = await Transaction.create({
      jobId,
      amount: job.paymentOffer,
      tip,
      mode: 'offline',
      status: 'completed'
    });

    job.paymentStatus = 'completed';
    job.paymentMode = 'offline';
    job.tip = tip;
    await job.save();

    res.json({
      success: true,
      message: 'Offline payment confirmed',
      transaction,
      job
    });
  } catch (error) {
    console.error('Offline payment error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const jobs = await Job.find({
      $or: [{ clientId: userId }, { workerId: userId }]
    });

    const jobIds = jobs.map(job => job._id);

    const transactions = await Transaction.find({
      jobId: { $in: jobIds }
    })
    .populate({
      path: 'jobId',
      populate: [
        { path: 'clientId', select: 'name phone' },
        { path: 'workerId', select: 'name phone' }
      ]
    })
    .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
