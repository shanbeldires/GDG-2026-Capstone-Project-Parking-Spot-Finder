import express from "express";
import {
  login,
  signup,
  logOut,
  getMe,
  AccessRefreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authentication.js";

const authRoutes = express.Router();

authRoutes.post("/login", login);
authRoutes.post("/register", signup);
authRoutes.post("/logout", verifyToken, logOut);
authRoutes.post("/refresh", AccessRefreshToken);
authRoutes.get("/me", verifyToken, getMe);

authRoutes.get("/verify-email/:token", verifyEmail);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password/:token", resetPassword);

export default authRoutes;
