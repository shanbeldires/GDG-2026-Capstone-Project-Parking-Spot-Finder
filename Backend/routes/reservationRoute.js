import express from "express";
import { reserveParking } from "../controllers/reservationController.js";
import { verifyToken } from "../middleware/authentication.js";

const router = express.Router();

router.post("/", verifyToken, reserveParking);

export default router;