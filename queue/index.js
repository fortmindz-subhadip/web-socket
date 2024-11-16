// // Import necessary modules
// const { Queue, Worker } = require('bullmq');
// const Redis = require('ioredis');

// // Redis connection configuration
// const redisConnection = new Redis({
//   host: 'localhost', // Replace with your Redis host
//   port: 6379         // Replace with your Redis port
// });

// // Create BullMQ queues
// const availableRidesQueue = new Queue('availableRides', { connection: redisConnection });
// const acceptedRidesQueue = new Queue('acceptedRides', { connection: redisConnection });

// // Function to add a ride to the available rides queue
// async function addRideToAvailableQueue(ride) {
//   await availableRidesQueue.add('ride', ride);
//   console.log('Ride added to available queue:', ride);
// }

// // Function to move a ride to the accepted rides queue
// async function acceptRide(rideId) {
//   const jobs = await availableRidesQueue.getJobs(['waiting']);

//   for (const job of jobs) {
//     if (job.data.id === rideId) {
//       // Move the job to the accepted rides queue
//       await acceptedRidesQueue.add('acceptedRide', job.data);
//       await job.remove();
//       console.log('Ride accepted and moved to accepted rides queue:', job.data);
//       return;
//     }
//   }
//   console.log('Ride not found in available rides queue:', rideId);
// }

// // Function to cancel a ride and move it back to the available queue
// async function cancelAcceptedRide(rideId) {
//   const jobs = await acceptedRidesQueue.getJobs(['waiting']);

//   for (const job of jobs) {
//     if (job.data.id === rideId) {
//       // Move the job back to the available rides queue
//       await availableRidesQueue.add('ride', job.data);
//       await job.remove();
//       console.log('Ride canceled and moved back to available queue:', job.data);
//       return;
//     }
//   }
//   console.log('Ride not found in accepted rides queue:', rideId);
// }

// // Worker to process the available rides queue
// const availableRidesWorker = new Worker('availableRides', async (job) => {
//   console.log('Processing available ride:', job.data);
// }, { connection: redisConnection });

// // Worker to process the accepted rides queue
// const acceptedRidesWorker = new Worker('acceptedRides', async (job) => {
//   console.log('Processing accepted ride:', job.data);
// }, { connection: redisConnection });

// // Example usage
// (async () => {
//   // Add a new ride
//   await addRideToAvailableQueue({ id: 'ride1', passenger: 'John Doe', destination: '123 Main St' });

//   // Accept the ride
//   await acceptRide('ride1');

//   // Cancel the ride and move it back to the available queue
//   await cancelAcceptedRide('ride1');
// })();

// process.on('SIGINT', () => {
//   redisConnection.quit();
//   console.log('Redis connection closed.');
// });
