import { Worker } from 'bullmq';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { certificates, users, courses } from '../db/schema';
import { redis } from '../lib/redis';
import { nanoid } from 'nanoid';

const s3 = new S3Client({ region: process.env.AWS_REGION! });

const CERT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1100px; height: 780px;
    font-family: 'Inter', sans-serif;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .cert {
    width: 1060px; height: 740px;
    border: 8px solid #1a1a2e;
    padding: 60px;
    position: relative;
    background: linear-gradient(135deg, #fafafa 0%, #f0f0ff 100%);
  }
  .corner { position: absolute; width: 60px; height: 60px; }
  .tl { top: 10px; left: 10px; border-top: 4px solid #6c63ff; border-left: 4px solid #6c63ff; }
  .tr { top: 10px; right: 10px; border-top: 4px solid #6c63ff; border-right: 4px solid #6c63ff; }
  .bl { bottom: 10px; left: 10px; border-bottom: 4px solid #6c63ff; border-left: 4px solid #6c63ff; }
  .br { bottom: 10px; right: 10px; border-bottom: 4px solid #6c63ff; border-right: 4px solid #6c63ff; }
  .platform { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #6c63ff; margin-bottom: 16px; }
  h1 { font-family: 'Playfair Display', serif; font-size: 52px; color: #1a1a2e; margin-bottom: 8px; }
  .sub { font-size: 15px; color: #666; letter-spacing: 1px; margin-bottom: 40px; }
  .recipient { font-family: 'Playfair Display', serif; font-size: 38px; color: #6c63ff; margin-bottom: 16px; border-bottom: 2px solid #e0e0ff; padding-bottom: 16px; }
  .course-label { font-size: 13px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .course-title { font-size: 22px; font-weight: 500; color: #1a1a2e; margin-bottom: 40px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; }
  .date { font-size: 13px; color: #666; }
  .code { font-family: monospace; font-size: 11px; color: #bbb; }
</style>
</head>
<body>
<div class="cert">
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="platform">LearnHub Platform</div>
  <h1>Certificate</h1>
  <div class="sub">OF COMPLETION</div>
  <div class="sub" style="margin-bottom:16px">This certifies that</div>
  <div class="recipient">{{name}}</div>
  <div class="course-label">has successfully completed</div>
  <div class="course-title">{{courseTitle}}</div>
  <div class="footer">
    <div class="date">Issued on {{date}}</div>
    <div class="code">ID: {{code}}</div>
  </div>
</div>
</body>
</html>`;

const template = Handlebars.compile(CERT_TEMPLATE);

export const certificateWorker = new Worker(
  'certificates',
  async (job) => {
    const { userId, courseId } = job.data;

    const [user, course] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, userId) }),
      db.query.courses.findFirst({ where: eq(courses.id, courseId) }),
    ]);
    if (!user || !course) throw new Error('User or course not found');

    const verificationCode = nanoid(16).toUpperCase();
    const html = template({
      name:        user.name,
      courseTitle: course.title,
      date:        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      code:        verificationCode,
    });

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page    = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ width: '1100px', height: '780px', printBackground: true });
    await browser.close();

    // Upload to S3
    const key = `certificates/${userId}/${courseId}.pdf`;
    await s3.send(new PutObjectCommand({
      Bucket:      process.env.S3_BUCKET_NAME!,
      Key:         key,
      Body:        pdf,
      ContentType: 'application/pdf',
    }));

    const pdfUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    await db.insert(certificates).values({
      userId,
      courseId,
      verificationCode,
      pdfUrl,
    }).onConflictDoNothing();

    console.info(`[cert] Issued certificate for user ${userId} course ${courseId}`);
  },
  { connection: redis, concurrency: 3 },
);
