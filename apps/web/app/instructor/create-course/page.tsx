'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, BookOpen, Video, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '../../components/layout/navbar';
import { apiPost } from '../../lib/api-client';

const STEPS = [
  { id: 1, label: 'Basic info',     icon: BookOpen   },
  { id: 2, label: 'Content',        icon: Video      },
  { id: 3, label: 'Pricing',        icon: DollarSign },
];

const step1Schema = z.object({
  title:            z.string().min(10, 'At least 10 characters').max(500),
  shortDescription: z.string().min(20, 'At least 20 characters').max(500),
  description:      z.string().min(50, 'At least 50 characters'),
  difficulty:       z.enum(['beginner', 'intermediate', 'advanced']),
  tags:             z.string().transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean)),
});

const step3Schema = z.object({
  isFree:     z.boolean(),
  priceCents: z.number().min(0),
});

type Step1 = z.infer<typeof step1Schema>;

export default function CreateCoursePage() {
  const router       = useRouter();
  const [step, setStep]       = useState(1);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const step1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });

  const onStep1 = (data: Step1) => {
    setFormData({ ...formData, ...data });
    setStep(2);
  };

  const onStep2 = () => {
    setStep(3);
  };

  const onCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        ...formData,
        isFree:     formData.priceCents === 0,
        priceCents: formData.priceCents ?? 0,
      };
      const course = await apiPost<any>('/api/v1/courses', payload);
      toast.success('Course created! Now add your lessons.');
      router.push(`/instructor/courses/${course.id}/curriculum`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">Create a new course</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Share your expertise with learners worldwide.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map(({ id, label, icon: Icon }, idx) => (
            <div key={id} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                step > id ? 'bg-emerald-500 text-white'
                : step === id ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}>
                {step > id ? <Check className="w-4 h-4" /> : id}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === id ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${step > id ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {/* ─── Step 1: Basic Info ─────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={step1.handleSubmit(onStep1)} className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Course information</h2>

              <div>
                <label className="label-base">Course title *</label>
                <input {...step1.register('title')} placeholder="e.g. Python for Data Science: Zero to Hero"
                  className="input-base" />
                {step1.formState.errors.title && (
                  <p className="text-xs text-red-500 mt-1">{step1.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="label-base">Short description *</label>
                <input {...step1.register('shortDescription')}
                  placeholder="One sentence that sells the course (shown in cards)"
                  className="input-base" />
                {step1.formState.errors.shortDescription && (
                  <p className="text-xs text-red-500 mt-1">{step1.formState.errors.shortDescription.message}</p>
                )}
              </div>

              <div>
                <label className="label-base">Full description *</label>
                <textarea {...step1.register('description')} rows={5}
                  placeholder="Describe what students will learn, prerequisites, and who this is for..."
                  className="input-base resize-none" />
                {step1.formState.errors.description && (
                  <p className="text-xs text-red-500 mt-1">{step1.formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Difficulty *</label>
                  <select {...step1.register('difficulty')} className="input-base">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="label-base">Tags (comma-separated)</label>
                  <input {...step1.register('tags')} placeholder="python, data-science, ml" className="input-base" />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary flex items-center gap-2">
                  Next step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ─── Step 2: Content structure ──────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Course content</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You'll add your full curriculum (sections and lessons) after the course is created.
                For now, let's set a rough content plan.
              </p>

              <div className="bg-brand-50 dark:bg-brand-900/30 rounded-xl p-5 space-y-3">
                {[
                  { label: 'Introduction section',   desc: 'Course overview + prerequisites' },
                  { label: 'Core content sections',  desc: 'Main learning modules (add after creating)' },
                  { label: 'Projects & assessments', desc: 'Hands-on projects + quizzes' },
                  { label: 'Completion',             desc: 'Final project + certificate trigger' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-200 dark:bg-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-brand-700 dark:text-brand-200" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-800 dark:text-brand-200">{label}</p>
                      <p className="text-xs text-brand-600 dark:text-brand-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={onStep2} className="btn-primary flex items-center gap-2">
                  Next step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Pricing ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pricing</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Free',        price: 0,    desc: 'Maximize reach, build reputation' },
                  { label: '$19',         price: 1900, desc: 'Entry-level paid course'           },
                  { label: '$49',         price: 4900, desc: 'Standard course price'             },
                  { label: '$79',         price: 7900, desc: 'Premium comprehensive course'      },
                ].map(({ label, price, desc }) => {
                  const selected = formData.priceCents === price;
                  return (
                    <button key={price}
                      onClick={() => setFormData({ ...formData, priceCents: price, isFree: price === 0 })}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xl font-bold ${selected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-900 dark:text-white'}`}>
                          {label}
                        </span>
                        {selected && <Check className="w-5 h-5 text-brand-600" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={onCreate} disabled={creating || formData.priceCents === undefined}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40">
                  {creating
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <BookOpen className="w-4 h-4" />}
                  Create course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
