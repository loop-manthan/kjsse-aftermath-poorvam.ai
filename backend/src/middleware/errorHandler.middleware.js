export const errorHandler = (err, req, res, next) => {
  console.error("Error Handler Called:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      error: `${field} already exists`,
    });
  }

  // Mongoose cast error
  if (err.name === "CastError") {
    return res.status(400).json({
      error: "Invalid ID format",
    });
  }

  // Default error
  return res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ error: "Route not found" });
};
