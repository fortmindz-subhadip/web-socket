// queueManager.js - Separate file for queue management
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

// Redis connection configuration
const redisConnection = new Redis({
  host: 'localhost', // Replace with your Redis host
  port: 6379    ,
  maxRetriesPerRequest: null // Set this to null as per BullMQ requirements
  // Replace with your Redis port
});

// Create BullMQ queues
const availableRidesQueue = new Queue('availableRides', { connection: redisConnection });
const acceptedRidesQueue = new Queue('acceptedRides', { connection: redisConnection });

// Function to add a ride to the available rides queue
export async function addRideToAvailableQueue(ride) {
  await availableRidesQueue.add('ride', ride);
  console.log('Ride added to available queue:', ride);
}

// Function to move a ride to the accepted rides queue
export async function acceptRide(rideId) {
  const jobs = await availableRidesQueue.getJobs(['waiting']);

  for (const job of jobs) {
    if (job.data.id === rideId) {
      // Move the job to the accepted rides queue
      await acceptedRidesQueue.add('acceptedRide', job.data);
      await job.remove();
      console.log('Ride accepted and moved to accepted rides queue:', job.data);
      return;
    }
  }
  console.log('Ride not found in available rides queue:', rideId);
}

// Function to cancel a ride and move it back to the available queue
export async function cancelAcceptedRide(rideId) {
  const jobs = await acceptedRidesQueue.getJobs(['waiting']);

  for (const job of jobs) {
    if (job.data.id === rideId) {
      // Move the job back to the available rides queue
      await availableRidesQueue.add('ride', job.data);
      await job.remove();
      console.log('Ride canceled and moved back to available queue:', job.data);
      return;
    }
  }
  console.log('Ride not found in accepted rides queue:', rideId);
}
export async function logAvailableRides() {
    const jobs = await availableRidesQueue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed']);
    
    console.log(`There are ${jobs.length} jobs in the 'availableRides' queue:`);
    
    jobs.forEach((job) => {
      console.log(`Job ID: ${job.id}, Ride Data:`, job.data);
    });
  }
  export async function getAvailableRides() {
    const jobs = await availableRidesQueue.getJobs(['waiting', 'active', 'delayed', 'completed', 'failed']);
    
    console.log(`There are ${jobs.length} jobs in the 'availableRides' queue:`);
  
    // Return job data
    return jobs.map((job) => job.data);  // Return only job data, not job details
  }
// Worker to process the available rides queue
export const availableRidesWorker = new Worker('availableRides', async (job) => {
  console.log('Processing available ride:', job.data);
}, { connection: redisConnection });

// Worker to process the accepted rides queue
export const acceptedRidesWorker = new Worker('acceptedRides', async (job) => {
  console.log('Processing accepted ride:', job.data);
}, { connection: redisConnection });
