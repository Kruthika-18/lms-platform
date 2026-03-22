'use client';
import Link from 'next/link';
import { Navbar } from '../components/layout/navbar';
import { CourseGrid } from '../components/course/course-grid';
import { useAuthStore } from '../lib/auth-store';
import { ArrowRight, Star, Users, PlayCircle, Award, Zap, TrendingUp, Code2, BrainCircuit, BarChart3 } from 'lucide-react';

const STATS = [
  { label: 'Learners',  value: '500K+', icon: Users },
  { label: 'Courses',   value: '200+',  icon: PlayCircle },
  { label: 'Graduates', value: '85K+',  icon: Award },
  { label: 'Rating',    value: '4.8★',  icon: Star },
];

const CATEGORIES = [
  { label: 'Artificial Intelligence', icon: BrainCircuit, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300', href: '/courses?tag=ai' },
  { label: 'Data Science',            icon: BarChart3,    color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',         href: '/courses?tag=data-science' },
  { label: 'Software Engineering',    icon: Code2,        color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300', href: '/courses?tag=engineering' },
  { label: 'Career Growth',           icon: TrendingUp,   color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',     href: '/courses?tag=career' },
];

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-brand-900 dark:via-brand-900 dark:to-purple-950 pt-20 pb-28">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100/40 dark:bg-brand-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100/40 dark:bg-purple-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-brand-100 dark:bg-brand-800/60 text-brand-700 dark:text-brand-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Join 500,000+ learners advancing their careers
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Learn the skills that<br />
              <span className="text-brand-600 dark:text-brand-400">tech companies hire for</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              Expert-led courses in AI, Data Science, and Software Engineering.
              Go from zero to job-ready with hands-on projects and verified certificates.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/courses" className="btn-primary text-base px-6 py-3 flex items-center gap-2">
                Explore courses <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href={user ? '/dashboard' : '/auth/register'} className="btn-secondary text-base px-6 py-3">
                {user ? 'Go to dashboard' : 'Start for free — no credit card'}
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Icon className="w-5 h-5 text-brand-500 mr-1.5" />
                    <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-white dark:bg-brand-900 border-b border-gray-100 dark:border-brand-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-heading text-center mb-10">Explore by topic</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CATEGORIES.map(({ label, icon: Icon, color, href }) => (
                <Link key={label} href={href}
                  className={`${color} flex flex-col items-center gap-3 p-6 rounded-xl font-medium transition-all hover:scale-[1.02] hover:shadow-md`}>
                  <Icon className="w-8 h-8" />
                  <span className="text-sm text-center">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured courses */}
        <section className="py-16 bg-gray-50 dark:bg-brand-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="section-heading">Most popular courses</h2>
              <Link href="/courses" className="text-brand-600 dark:text-brand-400 text-sm font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <CourseGrid />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-brand-600 dark:bg-brand-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Ready to accelerate your career?
            </h2>
            <p className="text-brand-200 mb-8 max-w-lg mx-auto">
              Join thousands of learners who landed their dream jobs after completing our courses.
            </p>
            <Link href={user ? '/dashboard' : '/auth/register'}
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors">
              {user ? 'Go to my dashboard' : 'Get started free'} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-brand-900 border-t border-gray-100 dark:border-brand-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform</h3>
              {['Courses', 'Learning Paths', 'Certificates', 'Pricing'].map((item) => (
                <Link key={item} href={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-2">
                  {item}
                </Link>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Company</h3>
              {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                <Link key={item} href={`/${item.toLowerCase()}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-2">
                  {item}
                </Link>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Support</h3>
              {['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <Link key={item} href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-2">
                  {item}
                </Link>
              ))}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">LearnHub</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                The fastest path to a career in tech. Learn, build, get hired.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-brand-800 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} LearnHub. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}