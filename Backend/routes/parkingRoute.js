import express from 'express'
const router  = express.Router();

import {
  getAllParkingSpots,
  getParkingSpotById,
  createParkingSpot,
  updateParkingSpot,
  deleteParkingSpot,
} from "../controllers/parkingController.js";

import { verifyToken } from "../middleware/authentication.js";

router.get("/", getAllParkingSpots);
router.get("/:id", getParkingSpotById);

//  Protected routes — valid JWT required
router.post("/", verifyToken, createParkingSpot);
router.put("/:id", verifyToken, updateParkingSpot);
router.delete("/:id", verifyToken, deleteParkingSpot);

export default router;