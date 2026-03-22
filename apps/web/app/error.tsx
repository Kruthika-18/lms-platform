'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">
            An unexpected error occurred. We've been notified and are working on it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="btn-primary flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <Link href="/" className="btn-secondary text-sm">Go home</Link>
          </div>
        </div>
      </body>
    </html>
  );
}
