import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    paymentOffer: {
      type: Number,
      min: 0,
    },
    pricing: {
      clientBudget: {
        type: Number,
        min: 0,
      },
      workerQuote: Number,
      finalPrice: Number,
      negotiationStatus: {
        type: String,
        enum: ["pending", "accepted", "countered", "agreed"],
        default: "pending",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
        "negotiating",
      ],
      default: "pending",
    },
    distance: {
      type: Number,
      default: 0,
    },
    assignedAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    workDuration: {
      startedAt: Date,
      completedAt: Date,
      totalHours: Number,
    },
    payment: {
      method: {
        type: String,
        enum: ["cash", "upi", "online"],
        default: "cash",
      },
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
      paidAt: Date,
      transactionId: String,
      deadline: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending",
    },
    paymentMode: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    tip: {
      type: Number,
      default: 0,
    },
    workerRating: {
      type: Number,
      min: 0,
      max: 5,
    },
    clientRating: {
      type: Number,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ status: 1, category: 1 });
jobSchema.index({ clientId: 1, createdAt: -1 });
jobSchema.index({ workerId: 1, status: 1 });
jobSchema.index({ location: "2dsphere" });

const Job = mongoose.model("Job", jobSchema);

export default Job;
