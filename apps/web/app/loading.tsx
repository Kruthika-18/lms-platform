export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-brand-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-200 dark:border-brand-700 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse-soft">Loading…</p>
      </div>
    </div>
  );
}
