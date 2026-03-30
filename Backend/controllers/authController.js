import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModel.js";
import userValidationSchema from "../validation/userValidation.js";
import RefreshToken from "../models/refreshToken.js";
import{
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
} from "../config/env.js";

export const login = async (req, res,) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return  res.status(400).json({ error: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return  res.status(404).json({ error: "user not found" });
    } 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return  res.status(401).json({ error: "invalid credentials" });
    }
    const accessToken = jwt.sign({ 
     id: user._id,
      role:user.role,},
      ACCESS_TOKEN_SECRET_KEY,
      {expiresIn:ACCESS_TOKEN_EXPIRES_IN}
    )
    const refreshToken = jwt.sign({ 
      id: user._id, },
      REFRESH_TOKEN_SECRET_KEY,
      {expiresIn:REFRESH_TOKEN_EXPIRES_IN}
    )
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt =new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
   
    const savedRefreshToken = await RefreshToken.findOneAndUpdate(
      {userId: user._id},
     { token: hashedRefreshToken,expiresAt},
      {upsert: true, new: true },
    );
    return res.status(200).json({message:"logged in successfully",accessToken,refreshToken });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const signup = async (req, res, ) => {
  try {
    const{fullName,email,password,role}=req.body;
    
    const { error } = userValidationSchema.validate(req.body);
    if (error) {
      return  res.status(400).json({ error: error.details[0].message });
    }
   
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return  res.status(400).json({ error: "user already exists" });
    }
   
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new User({
      fullName,
      email,
      password: hashedPassword,
      role
    });
    await user.save();
    const savedUser = user.toObject();
    delete savedUser.password;

    const accessToken = jwt.sign({ 
      id: savedUser._id,
      role:savedUser.role,},
      ACCESS_TOKEN_SECRET_KEY,
      {expiresIn:ACCESS_TOKEN_EXPIRES_IN}
    )
    const refreshToken = jwt.sign({ 
      id: savedUser._id,},
      REFRESH_TOKEN_SECRET_KEY,
      {expiresIn:REFRESH_TOKEN_EXPIRES_IN}
    )
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt =new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
   
    const savedRefreshToken = await RefreshToken.findOneAndUpdate(
      {userId: savedUser._id},
      { token: hashedRefreshToken,expiresAt},
      {upsert: true, new: true },
    );
    
    return res.status(201).json({message:"user created successfully",data:savedUser,accessToken,refreshToken  });


  } catch (error) {
    return res.status(400).json({ error: error.message });
  
  }
};  
export const AccessRefreshToken = async (req, res, ) => {
  try{
    const {refreshToken} = req.body;
    if (!refreshToken) {
      return  res.status(401).json({ error: "refresh token not found" });
      }
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const refreshTokenDoc = await RefreshToken.findOne({ token: hashedRefreshToken,expiresAt:{ $gt: new Date() }});
    if (!refreshTokenDoc) {
      return  res.status(401).json({ error: "invalid refresh token" });
    }
    const user = await User.findById(refreshTokenDoc.userId);
    if (!user) {
      return  res.status(401).json({ error: "user not found" });
    }
    const accessToken = jwt.sign({
       id: user._id,
       role:user.role,}, 
       ACCESS_TOKEN_SECRET_KEY, 
       { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );
    return res.status(200).json({ accessToken });
  }
  catch(error){
    return res.status(500).json({ error: error.message });
  }

}
export const logOut = async (req, res, ) => {
  try {
    const {refreshToken} = req.body;
    if(!refreshToken){
      return res.status(401).json({ error: "refresh token not found" });
    
    }
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await RefreshToken.deleteOne({ token: hashedRefreshToken });

    return res.status(200).json({ message: "logged out successfully" });
    
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};      
export const getMe = async (req, res, ) => {
  try {
    
    const user = await User.findById(req.user.id).select("-password");
    if(!user){
      return  res.status(404).json({ error: "user not found" });
    
    }
    return res.status(200).json({data:user});

  } catch (error) {
    return res.status(400).json({ error: error.message });
  
  }
};