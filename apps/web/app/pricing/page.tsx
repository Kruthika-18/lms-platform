'use client';
import { Navbar } from '../../components/layout/navbar';
import { Check, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../lib/auth-store';

const FREE_FEATURES = [
  '50+ free courses',
  'Course completion certificates',
  'Basic progress tracking',
  'Community forum access',
  '720p video quality',
];

const PRO_FEATURES = [
  'Everything in Free',
  '200+ premium courses',
  'LinkedIn-shareable certificates',
  '1080p + download for offline',
  'AI Q&A assistant per lesson',
  'Code playground & grader',
  'Priority support',
];

export default function PricingPage() {
  const { user } = useAuthStore();

  const handleFree = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/auth/register';
    }
  };

  const handlePro = () => {
    toast.info('Payment system coming soon! Contact us at hello@learnhub.dev');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-brand-900">

        {/* Header */}
        <section className="py-20 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Invest in your future
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Start free, upgrade when you're ready. Cancel anytime.
          </p>
        </section>

        {/* Plans */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/50 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Free</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Perfect for getting started</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">/ forever</span>
              </div>

              <button onClick={handleFree}
                className="btn-secondary block w-full text-center text-sm py-2.5 mb-8">
                {user ? 'Go to dashboard' : 'Get started free'}
              </button>

              <ul className="space-y-3">
                {FREE_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-brand-500 ring-2 ring-brand-500 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/50 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">Pro</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">For serious learners</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">/ per month</span>
              </div>

              <button onClick={handlePro}
                className="btn-primary block w-full text-center text-sm py-2.5 mb-8">
                Start Pro — 7 days free
              </button>

              <ul className="space-y-3">
                {PRO_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <p className="text-center text-sm text-gray-400 mt-12">
            Questions? <a href="mailto:hello@learnhub.dev" className="text-brand-600 hover:underline">Email us</a> — we reply in under 24 hours.
          </p>
        </section>
      </main>
    </>
  );
}