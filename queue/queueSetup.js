import { Queue } from 'bullmq';

// Create and export email queue
export const emailQueue = new Queue('emailSending');

// Create and export report queue
export const reportQueue = new Queue('reportGeneration');

console.log('Queues setup completed.');