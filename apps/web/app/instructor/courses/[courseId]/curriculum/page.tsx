'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, GripVertical, Trash2, Video, HelpCircle, FileText, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../../../../lib/api-client';
import { toast } from 'sonner';
import { Navbar } from '../../../../components/layout/navbar';

const LESSON_TYPES = [
  { value: 'video',   label: 'Video',   icon: Video      },
  { value: 'quiz',    label: 'Quiz',    icon: HelpCircle },
  { value: 'article', label: 'Article', icon: FileText   },
];

function LessonRow({ lesson, sectionId, onDelete }: { lesson: any; sectionId: string; onDelete: () => void }) {
  const Icon = LESSON_TYPES.find((t) => t.value === lesson.type)?.icon ?? Video;
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg group">
      <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
        lesson.type === 'video'   ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30' :
        lesson.type === 'quiz'    ? 'bg-purple-50 text-purple-500 dark:bg-purple-900/30' :
        'bg-amber-50 text-amber-500 dark:bg-amber-900/30'
      }`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{lesson.title}</span>
      {lesson.isPreview && (
        <span className="text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-md">
          Preview
        </span>
      )}
      <button onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CurriculumBuilderPage() {
  const params    = useParams();
  const courseId  = params.courseId as string;
  const qc        = useQueryClient();

  const [expandedSections, setExpanded] = useState<Set<string>>(new Set());
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingLesson, setAddingLesson] = useState<string | null>(null); // sectionId
  const [lessonForm, setLessonForm] = useState({ title: '', type: 'video', isPreview: false });

  const { data: course, isLoading } = useQuery({
    queryKey: ['course-curriculum', courseId],
    queryFn: () => apiGet<any>(`/api/v1/courses/${courseId}`),
  });

  const addSection = useMutation({
    mutationFn: () => apiPost(`/api/v1/courses/${courseId}/sections`, {
      title:    newSectionTitle,
      position: course?.sections?.length ?? 0,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-curriculum'] }); setNewSectionTitle(''); toast.success('Section added'); },
    onError: () => toast.error('Failed to add section'),
  });

  const addLesson = useMutation({
    mutationFn: (sectionId: string) =>
      apiPost(`/api/v1/courses/sections/${sectionId}/lessons`, {
        ...lessonForm,
        position: course?.sections?.find((s: any) => s.id === sectionId)?.lessons?.length ?? 0,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['course-curriculum'] }); setAddingLesson(null); setLessonForm({ title: '', type: 'video', isPreview: false }); toast.success('Lesson added'); },
    onError: () => toast.error('Failed to add lesson'),
  });

  if (isLoading) return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="skeleton h-8 w-1/2 rounded" />
        {[1,2,3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">
            Curriculum Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {course?.title} · {course?.sections?.length ?? 0} sections · {course?.sections?.flatMap((s: any) => s.lessons ?? []).length ?? 0} lessons
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3 mb-6">
          {course?.sections?.map((section: any, idx: number) => {
            const isOpen = expandedSections.has(section.id);
            return (
              <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                  <span className="text-xs font-bold text-gray-400 w-5">S{idx + 1}</span>
                  <h3 className="font-medium text-gray-900 dark:text-white flex-1">{section.title}</h3>
                  <span className="text-xs text-gray-400">{section.lessons?.length ?? 0} lessons</span>
                  <button onClick={() => setExpanded((prev) => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n; })}
                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Lessons */}
                {isOpen && (
                  <div className="p-3 space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
                    {section.lessons?.map((lesson: any) => (
                      <LessonRow key={lesson.id} lesson={lesson} sectionId={section.id}
                        onDelete={() => { /* apiDelete(`/api/v1/lessons/${lesson.id}`) */ toast('Delete coming soon'); }} />
                    ))}

                    {/* Add lesson form */}
                    {addingLesson === section.id ? (
                      <div className="bg-white dark:bg-gray-900 border-2 border-brand-200 dark:border-brand-700 rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">New lesson</h4>
                        <input
                          value={lessonForm.title}
                          onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Lesson title..."
                          className="input-base text-sm"
                          autoFocus
                        />
                        <div className="flex items-center gap-3">
                          <div className="flex gap-2">
                            {LESSON_TYPES.map(({ value, label, icon: Icon }) => (
                              <button key={value}
                                onClick={() => setLessonForm((p) => ({ ...p, type: value }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  lessonForm.type === value
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}>
                                <Icon className="w-3 h-3" /> {label}
                              </button>
                            ))}
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer ml-auto">
                            <input type="checkbox" checked={lessonForm.isPreview}
                              onChange={(e) => setLessonForm((p) => ({ ...p, isPreview: e.target.checked }))}
                              className="rounded border-gray-300" />
                            Free preview
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addLesson.mutate(section.id)}
                            disabled={!lessonForm.title.trim() || addLesson.isPending}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40">
                            <Save className="w-3.5 h-3.5" /> Save lesson
                          </button>
                          <button onClick={() => setAddingLesson(null)} className="btn-secondary text-xs px-3 py-1.5">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAddingLesson(section.id)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
                        <Plus className="w-4 h-4" /> Add lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add section */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Add new section</h3>
          <div className="flex gap-3">
            <input
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newSectionTitle.trim() && addSection.mutate()}
              placeholder="Section title (e.g. Getting Started)"
              className="input-base text-sm flex-1"
            />
            <button
              onClick={() => addSection.mutate()}
              disabled={!newSectionTitle.trim() || addSection.isPending}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-40 flex-shrink-0">
              <Plus className="w-4 h-4" /> Add section
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
