// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Driver from "./models/driverModel.js";
import User from "./models/userModel.js";
import Ride from "./models/rideModel.js";
import DriverConfirmation from "./models/driverConfirmation.js";
import  {addRideToAvailableQueue, getAvailableRides, logAvailableRides}  from "./queue/queueManager.js";
// Configure dotenv
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Socket.IO setup
let avaiableRideLIst = [];

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("register", async (data) => {
    try {
      const existUser = await User.findOne({ email: data.email });
      if (existUser) {
        io.emit("registerError", { message: "User already exists." });
      } else {
        const newUser = new User({
          name: data.name,
          email: data.email,
          password: data.password, // Ideally, the password should be hashed before saving.
        });
        await newUser.save();
        io.emit("registerSuccess", {
          message: "Registration successful.",
          user: newUser,
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      io.emit("registerError", {
        message: "An error occurred during registration.",
      });
    }
  });
  socket.on("getProfile", async (data) => {
    try {
      console.log(data);
      const getProfile = await User.findById(data._id);
      if (getProfile) {
        io.emit("userdetails", getProfile);
      } else {
        io.emit("getprofileErr", { message: "Account not found" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      io.emit("getprofileErr", {
        message: "An error occurred while fetching the profile.",
      });
    }
  });

  socket.on("rideBook", async (data) => {
    try {
      const { dropoffLocation, pickupLocation, userId } = data;
      console.log(data);
  
      const pickupTime = new Date();
      const dropoffTime = new Date(pickupTime);
      dropoffTime.setUTCHours(dropoffTime.getUTCHours() + 1);
  
      console.log("Pickup time in UTC:", pickupTime.toUTCString());
      console.log("Dropoff time in UTC + 1 hour:", dropoffTime.toUTCString());
  
      // Create a new Ride object
      const createRide = new Ride({
        userId: userId,
        dropoffLocation: dropoffLocation,
        pickupLocation: pickupLocation,
        pickupTime: pickupTime.toUTCString(),
        dropoffTime: dropoffTime.toUTCString(),
      });
  
      // Save the ride to the database
      await createRide.save();
  
      // Emit a success message and the created ride
      io.emit("createRideBook", {
        message: "Destination created successfully",
        createRide,
      });
      addRideToAvailableQueue(createRide)
      // Add the created ride to the available ride list
      avaiableRideLIst.push(createRide);
      socket.emit("avaiableRideList", {
        message: "ride list",
        avaiableRideLIst,
      });
      const availableRidesData = await getAvailableRides();

      // Emit the data to the client
      socket.emit('queue', {availableRidesData});
      socket.on('reconnect', () => {
        console.log(`User reconnected: ${socket.id}`);
        // Send the available rides to the user when they reconnect
        socket.emit('available_ridelist', availableRidesData);
      });
    } catch (error) {
      console.error("Error creating ride:", error);
      // Emit an error message to the client
      socket.emit("Riderror", {
        message: "An error occurred while creating the ride",
        error: error.message,
      });
    }
  });
  
  //join user-to a room
  socket.on("join-user-to-room", ({ userId, roomId }) => {
    if (roomId && userId) {
      socket.join(roomId); // Join the user to the specified room
      console.log(`User ${userId} joined room ${roomId}`);

      // Notify the user that they joined successfully
      io.to(socket.id).emit("joined-room", {
        message: `You joined room ${roomId}`,
      });

      // Optionally, notify the room that a new user joined
      socket.to(roomId).emit("user-joined", {
        userId,
        message: `User ${userId} has joined the room`,
      });
    }
  });





  socket.on("reconnect",async () => {
    console.log(`User ${socket.id} has reconnected`);
    // Emit the current available ride list when the user reconnects
    const availableRidesData = await getAvailableRides();

    socket.emit("available_ridelist", availableRidesData);
  });

  // Track when the user tries to reconnect
  socket.on("reconnect_attempt", () => {
    console.log(`User ${socket.id} is attempting to reconnect`);
    // You can also emit an event or log to track attempts
  });





  // get all the ride list  for drivers only
  socket.on("getAvaiable-ridelist", async (data) => {
    try {
      const riderId = data.riderId;
      const findRider = await Driver.findById({ _id: riderId });
      if (!findRider) {
        socket.emit("riderNotfound", {
          message: "rider not found",
          status: fasle,
        });
      }
      socket.emit("get-avaiableRidelist", {
        message: "ride list",
        avaiableRideLIst,
      });
    } catch (error) {
      socket.emit("avaiable-rider-err", {
        message: " an errr occur",
        error: error,
      });
    }
  });

  // driverConfirmation for the ride ==> means he/she accept this ride
  socket.on("driver-confirmation", async ({ driverId, rideId }) => {
    try {
      // Validate the input data
      if (!driverId || !rideId) {
        return socket.emit("notFound", { message: "Invalid input data", status: 400 });
      }
  
      // Check if the driver exists
      const findDriver = await Driver.findById(driverId);
      if (!findDriver) {
        return socket.emit("notFound", { message: "Driver not found", status: 404 });
      }
  
      // Check if the booking has already been confirmed for the ride
      const existingConfirmation = await DriverConfirmation.findOne({ rideId, driverId });
      if (existingConfirmation) {
        return socket.emit("rideAlreadyConfirmed", { message: "Ride already confirmed by this driver", status: 400 });
      }
  
      // Create the driver booking confirmation
      // const driverBookingConfirmation = new Ride({
      //   rideId: rideId,
      //   driverId: driverId,
      // });
      // await driverBookingConfirmation.save();
  const driverBookingConfirmation=  await Ride.findOneAndUpdate({_id:rideId},{driverId:driverId},  { new: true } 
  )
      // Notify the rider that the driver has accepted the ride
      socket.to(`${rideId}`).emit("rideConfirm", {
        message: `Mr ${findDriver.name} has accepted your ride`,
      });
  
      // Optionally,  sending the confimation message to the driver as well 
      socket.emit("confirmationSuccess", { message: `You have successfully confirmed the ride for ${rideId}` });
      // join driver to the room after confim that he accept this ride.

      socket.join(`${rideId}`);
    } catch (error) {
      // Log the error for debugging and notify the client
      console.error("Error in driver-confirmation:", error);
      socket.emit("error", { message: "Something went wrong. Please try again later.", status: 500 });
    }
  });
  
  // produce location to user that  where is the driver right now.and after reach the user location update user that i am reach near you  location


// start the destination send the loaction in the room  ==> this is for driverOnly .make sure this location send only the perticular roomId
  socket.on('produce-location',async(data)=>{
let {roomId,location}=data
socket.to(`${roomId}`).emit('location',{message:"location",location})
  })

// socket.on('startJouney')



  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Start the server


















server.listen(4000, () => {
  console.log("Server listening on port 4000");
});
