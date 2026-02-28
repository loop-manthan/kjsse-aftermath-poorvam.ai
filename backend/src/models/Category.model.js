import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  jobCount: {
    type: Number,
    default: 0
  },
  workerCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.index({ name: 1 });
categorySchema.index({ keywords: 1 });

const Category = mongoose.model('Category', categorySchema);

export default Category;
