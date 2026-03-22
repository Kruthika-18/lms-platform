import 'dotenv/config';
import { db } from './index';
import { users, courses, sections, lessons } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Admin user ──────────────────────────────────────────────
  const [admin] = await db.insert(users).values({
    email:        'admin@learnhub.dev',
    passwordHash: await bcrypt.hash('admin123456', 12),
    name:         'Admin User',
    role:         'admin',
    plan:         'enterprise',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing().returning();
  console.log('✅ Admin:', admin?.email);

  // ─── Instructor ──────────────────────────────────────────────
  const [instructor] = await db.insert(users).values({
    email:        'instructor@learnhub.dev',
    passwordHash: await bcrypt.hash('instructor123', 12),
    name:         'Dr. Sarah Chen',
    title:        'Senior Data Scientist',
    bio:          'Former Google ML engineer with 10 years experience in Python and AI.',
    role:         'instructor',
    plan:         'pro',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing().returning();
  console.log('✅ Instructor:', instructor?.email);

  // ─── Sample student ──────────────────────────────────────────
  await db.insert(users).values({
    email:        'student@learnhub.dev',
    passwordHash: await bcrypt.hash('student123', 12),
    name:         'Alex Learner',
    role:         'student',
    plan:         'free',
    emailVerifiedAt: new Date(),
  }).onConflictDoNothing();

  if (!instructor) { console.log('ℹ️  Seed already ran'); return; }

  // ─── Python for Data Science course ─────────────────────────
  const [pythonCourse] = await db.insert(courses).values({
    slug:             'python-for-data-science',
    instructorId:     instructor.id,
    title:            'Python for Data Science: Zero to Hero',
    description:      'A comprehensive course covering Python programming fundamentals and data science libraries including NumPy, Pandas, Matplotlib, and Scikit-learn.',
    shortDescription: 'Master Python and data science libraries from scratch.',
    priceCents:       0,
    isFree:           true,
    isPublished:      true,
    difficulty:       'beginner',
    tags:             ['python', 'data-science', 'pandas', 'numpy'],
    enrollmentCount:  12547,
    rating:           4.8,
    ratingCount:      2341,
    publishedAt:      new Date(),
  }).returning();

  // ─── Sections & Lessons ──────────────────────────────────────
  const sectionData = [
    {
      title:    'Getting Started with Python',
      position: 0,
      lessons: [
        { title: 'Course Introduction & Setup',    type: 'video',   duration: 480,  isPreview: true  },
        { title: 'Python Basics: Variables & Types', type: 'video', duration: 1200, isPreview: false },
        { title: 'Control Flow & Functions',        type: 'video',  duration: 1560, isPreview: false },
        { title: 'Python Basics Quiz',              type: 'quiz',   duration: 0,    isPreview: false },
      ],
    },
    {
      title:    'NumPy & Pandas Deep Dive',
      position: 1,
      lessons: [
        { title: 'NumPy Arrays & Operations',  type: 'video',   duration: 2100, isPreview: false },
        { title: 'Pandas DataFrames',          type: 'video',   duration: 2400, isPreview: false },
        { title: 'Data Cleaning Techniques',   type: 'video',   duration: 1800, isPreview: false },
        { title: 'Hands-on Lab: EDA Project',  type: 'lab',     duration: 0,    isPreview: false },
      ],
    },
    {
      title:    'Data Visualisation',
      position: 2,
      lessons: [
        { title: 'Matplotlib Fundamentals',     type: 'video',   duration: 1560, isPreview: false },
        { title: 'Seaborn Statistical Plots',   type: 'video',   duration: 1320, isPreview: false },
        { title: 'Building Interactive Charts', type: 'video',   duration: 1080, isPreview: false },
      ],
    },
    {
      title:    'Intro to Machine Learning',
      position: 3,
      lessons: [
        { title: 'ML Concepts & Workflow',       type: 'video',   duration: 1800, isPreview: false },
        { title: 'Scikit-learn Crash Course',    type: 'video',   duration: 2160, isPreview: false },
        { title: 'Your First ML Model',          type: 'lab',     duration: 0,    isPreview: false },
        { title: 'Final Assessment',             type: 'quiz',    duration: 0,    isPreview: false },
      ],
    },
  ];

  for (const sec of sectionData) {
    const [section] = await db.insert(sections).values({
      courseId: pythonCourse.id,
      title:    sec.title,
      position: sec.position,
    }).returning();

    for (let i = 0; i < sec.lessons.length; i++) {
      const l = sec.lessons[i];
      await db.insert(lessons).values({
        sectionId:       section.id,
        title:           l.title,
        position:        i,
        type:            l.type as any,
        durationSeconds: l.duration,
        isPreview:       l.isPreview,
      });
    }
  }
  console.log('✅ Python course seeded');

  // ─── Machine Learning Fundamentals course ────────────────────
  await db.insert(courses).values({
    slug:             'machine-learning-fundamentals',
    instructorId:     instructor.id,
    title:            'Machine Learning Fundamentals',
    description:      'Build a solid foundation in machine learning algorithms including supervised, unsupervised, and reinforcement learning.',
    shortDescription: 'The essential ML course every data scientist needs.',
    priceCents:       4999,
    isFree:           false,
    isPublished:      true,
    difficulty:       'intermediate',
    tags:             ['machine-learning', 'scikit-learn', 'ai'],
    enrollmentCount:  8921,
    rating:           4.9,
    ratingCount:      1876,
    publishedAt:      new Date(),
  }).onConflictDoNothing();

  await db.insert(courses).values({
    slug:             'deep-learning-with-pytorch',
    instructorId:     instructor.id,
    title:            'Deep Learning with PyTorch',
    description:      'Master neural networks, CNNs, RNNs and Transformers using PyTorch.',
    shortDescription: 'Build state-of-the-art deep learning models from scratch.',
    priceCents:       7999,
    isFree:           false,
    isPublished:      true,
    difficulty:       'advanced',
    tags:             ['deep-learning', 'pytorch', 'neural-networks'],
    enrollmentCount:  5234,
    rating:           4.7,
    ratingCount:      987,
    publishedAt:      new Date(),
  }).onConflictDoNothing();

  console.log('✅ Additional courses seeded');
  console.log('\n🎉 Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@learnhub.dev / admin123456');
  console.log('  Instructor: instructor@learnhub.dev / instructor123');
  console.log('  Student:    student@learnhub.dev / student123');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
