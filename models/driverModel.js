

// models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Driver = mongoose.model("Driver", driverSchema);
export default Driver;
