import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (!decoded.userId) {
      console.error("Token decoded but userId is missing:", decoded);
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res
      .status(401)
      .json({ error: "Authentication failed", details: error.message });
  }
};

export const authorizeUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};
