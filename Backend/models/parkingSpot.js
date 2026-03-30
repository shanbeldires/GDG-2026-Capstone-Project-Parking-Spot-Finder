import mongoose from 'mongoose';

const parkingSpotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Parking spot name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"],
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be >= -90"],
      max: [90,  "Latitude must be <= 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be >= -180"],
      max: [180,  "Longitude must be <= 180"],
    },
    totalSlots: {
      type: Number,
      required: [true, "Total slots is required"],
      min: [0, "Total slots cannot be negative"],
    },
    availableSlots: {
      type: Number,
      min: [0, "Available slots cannot be negative"],
      // Defaulted to totalSlots in the pre-save hook below
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, 
  }
);

//  Pre-save hook
parkingSpotSchema.pre("save", function (next) {
  if (this.isNew && this.availableSlots === undefined) {
    this.availableSlots = this.totalSlots;
  }
  if (this.availableSlots > this.totalSlots) {
    return next(new Error("Available slots cannot exceed total slots"));
  }
  next();
});

parkingSpotSchema.methods.toAPIFormat = function (extraFields = {}) {
  return {
    id:             this._id,
    name:           this.name,
    latitude:       this.latitude,
    longitude:      this.longitude,
    availableSlots: this.availableSlots,
    totalSlots:     this.totalSlots,
    address:        this.address,
    ...extraFields, // e.g. distanceKm when using nearby filter
  };
};

export const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema)