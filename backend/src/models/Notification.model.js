import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'job_posted',
      'job_accepted',
      'quote_received',
      'quote_accepted',
      'quote_rejected',
      'job_started',
      'job_completed',
      'payment_received',
      'payment_deadline'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    jobId: String,
    workerId: String,
    clientId: String,
    amount: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  playSound: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
