import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import errorHandler from "./errorHandler/errorHandler.js";
import dotenv from "dotenv";
dotenv.config();
import { CLIENT_URL } from "./config/env.js";
import authRoutes from "./routes/authRoute.js";
import parkingRoutes from "./routes/parkingRoute.js"
import reservationRoutes from "./routes/reservationRoute.js";
const app = express();

// Middlewares
app.use(cors({ origin:CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet())

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/parking-spots", parkingRoutes)
app.use("/api/v1/reserve", reservationRoutes);



// Error handler
app.use(errorHandler);

export default app;