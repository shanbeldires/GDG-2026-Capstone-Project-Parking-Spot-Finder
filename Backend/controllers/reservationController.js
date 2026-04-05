import { ParkingSpot } from "../models/parkingSpot.js";
import Reservation from "../models/reservationModel.js";


export const reserveParking = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT (authentication middleware)
    const { parkingId } = req.body;

    // 1️. Validate input
    if (!parkingId) {
      return res.status(400).json({
        success: false,
        message: "Parking ID is required"
      });
    }

    // 2️. Prevent duplicate reservation by same user
    const existingReservation = await Reservation.findOne({
      userId,
      parkingId
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: "You already reserved this parking spot"
      });
    }

    // 3️. Atomic update (prevents overbooking)
    const parking = await ParkingSpot.findOneAndUpdate(
      { _id: parkingId, availableSlots: { $gt: 0 } },
      { $inc: { availableSlots: -1 } },
      { new: true }
    );

    if (!parking) {
      return res.status(400).json({
        success: false,
        message: "No available slots or parking not found"
      });
    }

    // 4️. Create reservation
    const reservation = await Reservation.create({
      userId,
      parkingId
    });

    // 5️. Success response
    res.status(201).json({
      success: true,
      message: "Reservation confirmed",
      reservation
    });

  } catch (error) {
    console.error("Reservation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};