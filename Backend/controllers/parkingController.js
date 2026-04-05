import ParkingSpot from "../models/parkingModel.js";

//  Helper: standard API response shape
const respond = (res, statusCode, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

//  GET /parking-spots
//  Returns all active parking spots.
export const getAllParkingSpots = async (req, res) => {
  try {
    const { available, lat, lng, radius } = req.query;

    const filter = { isActive: true };
    if (available === "true") {
      filter.availableSlots = { $gt: 0 };
    }

    let spots = await ParkingSpot.find(filter);

    // Optional: client-side distance filter using Haversine
    if (lat && lng && radius) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxKm   = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLng) || isNaN(maxKm)) {
        return respond(res, 400, false, "lat, lng and radius must be valid numbers");
      }

      spots = spots
        .map((spot) => {
          const distanceKm = haversineKm(userLat, userLng, spot.latitude, spot.longitude);
          return { spot, distanceKm: parseFloat(distanceKm.toFixed(2)) };
        })
        .filter(({ distanceKm }) => distanceKm <= maxKm)
        .sort((a, b) => a.distanceKm - b.distanceKm) // nearest first
        .map(({ spot, distanceKm }) => spot.toAPIFormat({ distanceKm }));
    } else {
      spots = spots.map((spot) => spot.toAPIFormat());
    }

    return respond(res, 200, true, "Parking spots retrieved successfully", spots);
  } catch (error) {
    console.error("getAllParkingSpots error:", error);
    return respond(res, 500, false, "Internal server error");
  }
};

//  GET /parking-spots/:id
//  Returns a single parking spot by MongoDB _id.
export const getParkingSpotById = async (req, res) => {
  try {
    const { id } = req.params;

    const spot = await ParkingSpot.findOne({ _id: id, isActive: true });

    if (!spot) {
      return respond(res, 404, false, "Parking spot not found");
    }

    return respond(res, 200, true, "Parking spot retrieved successfully", spot.toAPIFormat());
  } catch (error) {
    
    if (error.name === "CastError") {
      return respond(res, 400, false, "Invalid parking spot ID");
    }
    console.error("getParkingSpotById error:", error);
    return respond(res, 500, false, "Internal server error");
  }
};

//  POST /parking-spots
//  Creates a new parking spot.
//  Protected — requires valid JWT.
export const createParkingSpot = async (req, res) => {
  try {
    const { name, latitude, longitude, totalSlots, address } = req.body;

    if (!name || latitude === undefined || longitude === undefined || totalSlots === undefined) {
      return respond(res, 400, false, "name, latitude, longitude and totalSlots are required");
    }

    const spot = new ParkingSpot({ name, latitude, longitude, totalSlots, address });
    await spot.save();

    return respond(res, 201, true, "Parking spot created successfully", spot.toAPIFormat());
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return respond(res, 400, false, messages.join(". "));
    }
    console.error("createParkingSpot error:", error);
    return respond(res, 500, false, "Internal server error");
  }
};

//  PUT /parking-spots/:id
//  Updates a parking spot. Send only changed fields.
//  Protected — requires valid JWT.
export const updateParkingSpot = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, totalSlots, availableSlots, address } = req.body;

    const spot = await ParkingSpot.findOne({ _id: id, isActive: true });

    if (!spot) {
      return respond(res, 404, false, "Parking spot not found");
    }

    // Only touch fields that were sent in the request body
    if (name            !== undefined) spot.name            = name;
    if (latitude        !== undefined) spot.latitude        = latitude;
    if (longitude       !== undefined) spot.longitude       = longitude;
    if (totalSlots      !== undefined) spot.totalSlots      = totalSlots;
    if (availableSlots  !== undefined) spot.availableSlots  = availableSlots;
    if (address         !== undefined) spot.address         = address;

    await spot.save(); 

    return respond(res, 200, true, "Parking spot updated successfully", spot.toAPIFormat());
  } catch (error) {
    if (error.name === "CastError") {
      return respond(res, 400, false, "Invalid parking spot ID");
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return respond(res, 400, false, messages.join(". "));
    }
    console.error("updateParkingSpot error:", error);
    return respond(res, 500, false, "Internal server error");
  }
};

//  DELETE /parking-spots/:id
//  Soft-deletes (sets isActive = false).
//  Protected — requires valid JWT.
export const deleteParkingSpot = async (req, res) => {
  try {
    const { id } = req.params;

    const spot = await ParkingSpot.findOne({ _id: id, isActive: true });

    if (!spot) {
      return respond(res, 404, false, "Parking spot not found");
    }

    spot.isActive = false;
    await spot.save();

    return respond(res, 200, true, "Parking spot deleted successfully");
  } catch (error) {
    if (error.name === "CastError") {
      return respond(res, 400, false, "Invalid parking spot ID");
    }
    console.error("deleteParkingSpot error:", error);
    return respond(res, 500, false, "Internal server error");
  }
};

//  Private helpers
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

