import { Worker } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { lessons } from '../db/schema';
import { redis } from '../lib/redis';

const execAsync = promisify(exec);
const s3        = new S3Client({ region: process.env.AWS_REGION! });
const BUCKET    = process.env.S3_BUCKET_NAME!;
const TMP_DIR   = '/tmp/lms-transcode';

export const videoTranscodeWorker = new Worker(
  'video-transcode',
  async (job) => {
    const { lessonId, s3Key } = job.data;
    await fs.mkdir(TMP_DIR, { recursive: true });

    const localInput = path.join(TMP_DIR, `${lessonId}_input.mp4`);
    const outputDir  = path.join(TMP_DIR, lessonId);
    await fs.mkdir(outputDir, { recursive: true });

    try {
      // Download from S3
      job.updateProgress(10);
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
      const chunks: Buffer[] = [];
      for await (const chunk of obj.Body as AsyncIterable<Buffer>) chunks.push(chunk);
      await fs.writeFile(localInput, Buffer.concat(chunks));

      // Transcode to HLS with multiple quality levels
      job.updateProgress(20);
      const ffmpegCmd = `ffmpeg -i "${localInput}" \
        -filter_complex "[0:v]split=3[v1][v2][v3]" \
        -map "[v1]" -map 0:a -c:v libx264 -b:v 800k  -s 640x360  -hls_time 6 -hls_playlist_type vod "${outputDir}/360p.m3u8" \
        -map "[v2]" -map 0:a -c:v libx264 -b:v 2500k -s 1280x720  -hls_time 6 -hls_playlist_type vod "${outputDir}/720p.m3u8" \
        -map "[v3]" -map 0:a -c:v libx264 -b:v 5000k -s 1920x1080 -hls_time 6 -hls_playlist_type vod "${outputDir}/1080p.m3u8" \
        -y`;

      await execAsync(ffmpegCmd);
      job.updateProgress(70);

      // Get video duration
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${localInput}"`,
      );
      const durationSeconds = Math.round(parseFloat(stdout.trim()));

      // Create master HLS playlist
      const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8`;
      await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterPlaylist);

      // Upload all HLS files to S3
      job.updateProgress(80);
      const files = await fs.readdir(outputDir);
      for (const file of files) {
        const filePath = path.join(outputDir, file);
        const fileContent = await fs.readFile(filePath);
        const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
        await s3.send(new PutObjectCommand({
          Bucket:      BUCKET,
          Key:         `videos/hls/${lessonId}/${file}`,
          Body:        fileContent,
          ContentType: contentType,
        }));
      }

      // Update lesson with HLS URL and duration
      const hlsKey = `videos/hls/${lessonId}/master.m3u8`;
      await db.update(lessons)
        .set({ hlsUrl: hlsKey, durationSeconds, updatedAt: new Date() })
        .where(eq(lessons.id, lessonId));

      job.updateProgress(100);
      console.info(`[transcode] Completed lessonId=${lessonId} duration=${durationSeconds}s`);
    } finally {
      // Cleanup temp files
      await fs.rm(localInput, { force: true });
      await fs.rm(outputDir, { recursive: true, force: true });
    }
  },
  { connection: redis, concurrency: 2 }, // limit concurrent transcodes
);
