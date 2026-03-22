import '../db'; // ensure DB connection
import './certificate.worker';
import './video-transcode.worker';
import './email.worker';

console.info('[workers] All workers started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.info('[workers] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
