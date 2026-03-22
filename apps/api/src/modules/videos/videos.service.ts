import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { lessons } from '../../db/schema';
import { videoTranscodeQueue } from '../../workers/queues';
import { Errors } from '../../lib/errors';
import { nanoid } from 'nanoid';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET      = process.env.S3_BUCKET_NAME!;
const URL_EXPIRY  = Number(process.env.S3_PRESIGNED_URL_EXPIRY ?? 3600);

export class VideoService {
  // ─── Generate presigned upload URL ───────────────────────────
  async getUploadUrl(lessonId: string, fileName: string, contentType: string) {
    const ext     = fileName.split('.').pop() ?? 'mp4';
    const key     = `videos/raw/${lessonId}/${nanoid()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 }); // 10 min upload window
    return { uploadUrl, key };
  }

  // ─── Confirm upload + queue transcoding ──────────────────────
  async confirmUpload(lessonId: string, s3Key: string) {
    await db.update(lessons)
      .set({ videoKey: s3Key, updatedAt: new Date() })
      .where(eq(lessons.id, lessonId));

    await videoTranscodeQueue.add('transcode', { lessonId, s3Key }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
    });

    return { queued: true };
  }

  // ─── Get signed streaming URL (HLS manifest) ─────────────────
  async getStreamUrl(lessonId: string, userId: string, isEnrolled: boolean) {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });
    if (!lesson) throw Errors.notFound('Lesson');

    // Allow preview lessons without enrollment
    if (!lesson.isPreview && !isEnrolled) throw Errors.paymentRequired();

    const key = lesson.hlsUrl ?? lesson.videoKey;
    if (!key) throw Errors.notFound('Video');

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: URL_EXPIRY });

    return {
      streamUrl:    url,
      isHls:        !!lesson.hlsUrl,
      durationSeconds: lesson.durationSeconds,
    };
  }

  // ─── Delete video from S3 ─────────────────────────────────────
  async deleteVideo(s3Key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
  }
}
