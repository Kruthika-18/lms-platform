import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

export const certificateQueue    = new Queue('certificates',    { connection: redis });
export const videoTranscodeQueue = new Queue('video-transcode', { connection: redis });
export const emailQueue          = new Queue('emails',          { connection: redis });
