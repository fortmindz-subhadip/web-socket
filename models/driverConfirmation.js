
import mongoose from "mongoose";


const driverConfirmationSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    confirmationTime: {
        type: String,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'ongoing', 'completed', 'cancelled'],
        default:'pending'
    }
});

const DriverConfirmation = mongoose.model('DriverConfirmation', driverConfirmationSchema);
export default DriverConfirmation