import Link from 'next/link';
import { Navbar } from '../../components/layout/navbar';
import { ArrowRight, BookOpen, Clock, Users, Star, Award } from 'lucide-react';

const PATHS = [
  {
    id:          'data-science',
    title:       'Data Science Career Path',
    description: 'Go from beginner to job-ready data scientist. Covers Python, statistics, ML, and real-world projects.',
    icon:        '📊',
    gradient:    'from-blue-500 to-cyan-500',
    courses:     6,
    hours:       48,
    enrolled:    42000,
    rating:      4.8,
    level:       'Beginner → Advanced',
    badge:       'Most popular',
    skills:      ['Python', 'Pandas', 'Scikit-learn', 'SQL', 'Tableau'],
  },
  {
    id:          'ai-ml',
    title:       'AI & Machine Learning Path',
    description: 'Deep dive into machine learning algorithms, deep learning, NLP, and deploying ML models to production.',
    icon:        '🤖',
    gradient:    'from-purple-500 to-brand-500',
    courses:     8,
    hours:       72,
    enrolled:    31000,
    rating:      4.9,
    level:       'Intermediate → Advanced',
    badge:       'Trending',
    skills:      ['TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'MLOps'],
  },
  {
    id:          'fullstack',
    title:       'Full-Stack Web Development',
    description: 'Build modern web applications from scratch. Master React, Node.js, databases, and cloud deployment.',
    icon:        '💻',
    gradient:    'from-emerald-500 to-teal-500',
    courses:     7,
    hours:       60,
    enrolled:    28000,
    rating:      4.7,
    level:       'Beginner → Advanced',
    badge:       null,
    skills:      ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  },
  {
    id:          'python',
    title:       'Python Programming Path',
    description: 'Master Python from the basics to advanced topics including OOP, algorithms, and automation.',
    icon:        '🐍',
    gradient:    'from-amber-500 to-orange-500',
    courses:     5,
    hours:       36,
    enrolled:    89000,
    rating:      4.8,
    level:       'Beginner → Intermediate',
    badge:       'Best for beginners',
    skills:      ['Python', 'OOP', 'Algorithms', 'File I/O', 'APIs'],
  },
];

export const metadata = { title: 'Learning Paths' };

export default function LearningPathsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-brand-900">
        {/* Header */}
        <section className="bg-white dark:bg-brand-900 border-b border-gray-100 dark:border-brand-800 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-3">
              Structured Learning Paths
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Hand-curated course sequences that take you from zero to job-ready — with certificates at every milestone.
            </p>
          </div>
        </section>

        {/* Paths grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PATHS.map((path) => (
              <div key={path.id} className="card overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                {/* Gradient header */}
                <div className={`h-2 bg-gradient-to-r ${path.gradient}`} />
                <div className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{path.icon}</span>
                      <div>
                        {path.badge && (
                          <span className="inline-block text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/50 px-2 py-0.5 rounded-full mb-1">
                            {path.badge}
                          </span>
                        )}
                        <h2 className="font-display font-bold text-gray-900 dark:text-white text-xl leading-tight">
                          {path.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                    {path.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-5">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{path.courses} courses</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{path.hours}h content</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(path.enrolled / 1000).toFixed(0)}k enrolled</span>
                    <span className="flex items-center gap-1 text-amber-500"><Star className="w-3.5 h-3.5 fill-current" />{path.rating}</span>
                  </div>

                  {/* Level badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <Award className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{path.level}</span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {path.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <Link href={`/courses?tag=${path.id}`}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                    Start path <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
