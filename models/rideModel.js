// Ride Schema
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    index: true,
    sparse: true,
    default: null, 
  },
  pickupLocation: {
    type: String,
    required: true,
  },
  dropoffLocation: {
    type: String,
    required: true,
  },
  pickupTime: {
    type: String,
    required: true,
  },
  dropoffTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "ongoing", "completed", "cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Ride = mongoose.model("Ride", rideSchema);

export default Ride;
