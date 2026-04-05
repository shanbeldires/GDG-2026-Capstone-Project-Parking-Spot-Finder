import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import userValidationSchema from "../validation/userValidation.js";
import RefreshToken from "../models/refreshToken.js";
import sendEmail from "../utils/sendEmail.js";
import {
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  CLIENT_URL
} from "../config/env.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "invalid credentials" });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await RefreshToken.findOneAndUpdate(
      { userId: user._id },
      { token: hashedRefreshToken, expiresAt },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: "logged in successfully", accessToken, refreshToken });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    const { error } = userValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken: crypto.createHash("sha256").update(verificationToken).digest("hex"),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
    });

    await user.save();

    const verificationURL = `${CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail(
      email,
      "Verify your email",
      `<p>Click to verify:</p><a href="${verificationURL}">${verificationURL}</a>`
    );

    const savedUser = user.toObject();
    delete savedUser.password;

    const accessToken = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: savedUser._id },
      REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await RefreshToken.findOneAndUpdate(
      { userId: savedUser._id },
      { token: hashedRefreshToken, expiresAt },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "user created successfully",
      data: savedUser,
      accessToken,
      refreshToken
    });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetURL = `${CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      "Password Reset",
      `<p>Reset your password:</p><a href="${resetURL}">${resetURL}</a>`
    );

    res.json({ message: "Reset link sent to email" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const AccessRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: "refresh token not found" });
    }

    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const refreshTokenDoc = await RefreshToken.findOne({
      token: hashedRefreshToken,
      expiresAt: { $gt: new Date() }
    });

    if (!refreshTokenDoc) {
      return res.status(401).json({ error: "invalid refresh token" });
    }

    const user = await User.findById(refreshTokenDoc.userId);
    if (!user) {
      return res.status(401).json({ error: "user not found" });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    return res.status(200).json({ accessToken });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const logOut = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "refresh token not found" });
    }

    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    await RefreshToken.deleteOne({ token: hashedRefreshToken });

    return res.status(200).json({ message: "logged out successfully" });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ data: user });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
