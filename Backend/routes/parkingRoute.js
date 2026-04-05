import express from 'express';
const router = express.Router();

import {
  getAllParkingSpots,
  getParkingSpotById,
  createParkingSpot,
  updateParkingSpot,
  deleteParkingSpot,
} from "../controllers/parkingController.js";

import { verifyToken } from "../middleware/authentication.js";
import { authorization } from "../middleware/autherization.js";

// Public — anyone can read
router.get("/", getAllParkingSpots);
router.get("/:id", getParkingSpotById);

// Admin only — must be logged in AND have role "admin"
router.post("/", verifyToken, authorization("admin"), createParkingSpot);
router.put("/:id", verifyToken, authorization("admin"), updateParkingSpot);
router.delete("/:id", verifyToken, authorization("admin"), deleteParkingSpot);

export default router;