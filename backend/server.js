import 'dotenv/config'; // MUST be first — loads .env before any other module initializes
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./src/routes/auth.routes.js";
import jobRoutes from "./src/routes/job.routes.js";
import matchingRoutes from "./src/routes/matching.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import categoryRoutes from "./src/routes/category.routes.js";
import voiceRoutes from "./src/routes/voice.routes.js";

import {
  errorHandler,
  notFound,
} from "./src/middleware/errorHandler.middleware.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5000",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json({
    message: "Poorvam.ai API Server",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint working" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/matching", matchingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/voice", voiceRoutes);

app.use(notFound);
app.use(errorHandler);

// Only start listening when run directly (not when imported by tests)
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export { app, server };
