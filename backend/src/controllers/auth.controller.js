import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  try {
    console.log("Register endpoint hit with body:", req.body);
    const {
      name,
      phone,
      email,
      password,
      userType,
      location,
      address,
      categories,
    } = req.body;

    // Validate required fields
    if (!name || !phone || !password || !userType || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate location
    if (
      !location ||
      !location.coordinates ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({ error: "Valid location is required" });
    }

    // Check if coordinates are valid (not [0, 0])
    if (location.coordinates[0] === 0 && location.coordinates[1] === 0) {
      return res.status(400).json({
        error: "Please provide a valid location or enable location access",
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    const user = await User.create({
      name,
      phone,
      email,
      password,
      userType,
      location,
      address,
      categories: userType === "worker" ? categories : [],
    });

    if (!user || !user._id) {
      console.error("User creation failed - no _id:", user);
      return res.status(500).json({ error: "User creation failed" });
    }

    console.log("User created successfully with ID:", user._id);
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
        location: user.location,
        address: user.address,
        categories: user.categories,
        status: user.status,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
        location: user.location,
        address: user.address,
        categories: user.categories,
        status: user.status,
        rating: user.rating,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, address, location, categories, status } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (location) updateData.location = location;
    if (categories) updateData.categories = categories;
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    if (req.user.userType !== "worker") {
      return res
        .status(403)
        .json({ error: "Only workers can update availability" });
    }

    const status = isAvailable ? "available" : "offline";

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { status },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      message: `Status updated to ${status}`,
      user,
    });
  } catch (error) {
    console.error("UpdateAvailability error:", error);
    res.status(500).json({ error: error.message });
  }
};
