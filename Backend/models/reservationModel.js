import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  parkingId: { type: mongoose.Schema.Types.ObjectId, ref: "Parking", required: true },
}, { timestamp: true });

export default mongoose.model("Reservation", reservationSchema);