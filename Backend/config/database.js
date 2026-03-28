import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";
const connectDB = async () => {
    try {
      const connect = await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB", connect.connection.host);
        } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

export default connectDB;