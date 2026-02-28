import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  byUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ jobId: 1 });
reviewSchema.index({ forUser: 1 });
reviewSchema.index({ byUser: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
