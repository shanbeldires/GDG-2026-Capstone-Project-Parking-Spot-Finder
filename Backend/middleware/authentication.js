import jwt from "jsonwebtoken";
import {ACCESS_TOKEN_SECRET_KEY} from "../config/env.js";
export const verifyToken = async(req,res,next)=>{
  try{
        const accessToken = req.cookies.accessToken;
        if(!accessToken){
            return res.status(401).json({error:"access token not found"})
        
        }
        const decoded = jwt.verify(accessToken,ACCESS_TOKEN_SECRET_KEY);
        req.user = decoded;
        next();

  }catch(error){
     return res.status(400).json({error:error.message})
  
  }
}