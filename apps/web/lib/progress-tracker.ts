import type { ProgressBatchItem } from '@lms/types';

const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const FLUSH_INTERVAL_MS = 10_000;

export class ProgressTracker {
  private buffer: ProgressBatchItem[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private lessonId: string;
  private duration: number;

  constructor(lessonId: string, duration: number) {
    this.lessonId = lessonId;
    this.duration = duration;
    this.startTimer();
    this.bindUnloadEvents();
  }

  track(positionSeconds: number) {
    this.buffer.push({
      lessonId:        this.lessonId,
      positionSeconds: Math.floor(positionSeconds),
      durationSeconds: this.duration,
      ts:              Date.now(),
    });
  }

  private async flush() {
    if (!this.buffer.length) return;
    const payload = this.buffer.splice(0); // atomic drain
    const body    = JSON.stringify({ items: payload });

    // sendBeacon is fire-and-forget — fires even on tab close
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(`${API_URL}/api/v1/progress/batch`, blob);
      if (!sent) {
        // Fallback to fetch if sendBeacon queue full
        fetch(`${API_URL}/api/v1/progress/batch`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          body,
          credentials: 'include',
          keepalive:   true,
        }).catch(() => {});
      }
    }
  }

  private startTimer() {
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  private bindUnloadEvents() {
    if (typeof document === 'undefined') return;
    const handler = () => this.flush();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
  }

  destroy() {
    this.flush();
    if (this.timer) clearInterval(this.timer);
  }
}
