import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { redis } from '../lib/redis';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST!,
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: Number(process.env.SMTP_PORT ?? 465) === 465,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

interface EmailJob {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
}

export const emailWorker = new Worker<EmailJob>(
  'emails',
  async (job) => {
    const { to, subject, html, text } = job.data;
    await transporter.sendMail({
      from:    `"LearnHub" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ''),
    });
    console.info(`[email] Sent "${subject}" to ${to}`);
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: { max: 50, duration: 1000 }, // 50 emails/sec max
  },
);

// ─── Email templates ─────────────────────────────────────────
export function buildWelcomeEmail(name: string) {
  return {
    subject: 'Welcome to LearnHub 🎓',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#6c4de4">Welcome, ${name}!</h1>
        <p>Your account is ready. Start learning today with 50+ free courses.</p>
        <a href="${process.env.FRONTEND_URL}/courses"
           style="display:inline-block;background:#6c4de4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
          Browse Courses
        </a>
      </div>`,
  };
}

export function buildCertificateEmail(name: string, courseName: string, pdfUrl: string) {
  return {
    subject: `🏆 Your certificate for "${courseName}" is ready`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#6c4de4">Congratulations, ${name}!</h1>
        <p>You've completed <strong>${courseName}</strong>. Your certificate is ready to download.</p>
        <a href="${pdfUrl}"
           style="display:inline-block;background:#6c4de4;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
          Download Certificate
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px">
          Share your achievement on LinkedIn to let employers know about your new skills.
        </p>
      </div>`,
  };
}
