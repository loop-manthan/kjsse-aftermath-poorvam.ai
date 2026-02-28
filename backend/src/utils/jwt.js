import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  if (!userId) {
    throw new Error("userId is required to generate token");
  }

  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};
