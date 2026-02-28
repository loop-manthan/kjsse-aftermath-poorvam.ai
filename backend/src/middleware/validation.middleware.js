export const validateRegistration = (req, res, next) => {
  const { name, phone, password, userType, location, address } = req.body;

  if (!name || !phone || !password || !userType || !location || !address) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided" });
  }

  if (!["client", "worker"].includes(userType)) {
    return res.status(400).json({ error: "Invalid user type" });
  }

  if (!/^\+?[1-9]\d{9,14}$/.test(phone)) {
    return res.status(400).json({ error: "Invalid phone number format" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  if (!location.coordinates || location.coordinates.length !== 2) {
    return res.status(400).json({ error: "Invalid location coordinates" });
  }

  next();
};

export const validateJobCreation = (req, res, next) => {
  const { description, paymentOffer, location, address } = req.body;

  if (!description || !paymentOffer || !location || !address) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided" });
  }

  if (paymentOffer < 0) {
    return res.status(400).json({ error: "Payment offer must be positive" });
  }

  if (!location.coordinates || location.coordinates.length !== 2) {
    return res.status(400).json({ error: "Invalid location coordinates" });
  }

  next();
};

export const validateReview = (req, res, next) => {
  const { jobId, rating } = req.body;

  if (!jobId || !rating) {
    return res.status(400).json({ error: "Job ID and rating are required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  next();
};
