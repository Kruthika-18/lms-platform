'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import { apiPost } from '../../lib/api-client';
import { cn } from '../../lib/utils';
import type { QuizQuestion } from '@lms/types';

interface QuizEngineProps {
  quizId:    string;
  questions: QuizQuestion[];
  onComplete?: (passed: boolean, score: number) => void;
}

type Phase = 'answering' | 'submitted';

interface QuizResult {
  passed:  boolean;
  score:   number;
  results: Array<{ questionId: string; correct: boolean; explanation?: string; correctIds: string[] }>;
}

export function QuizEngine({ quizId, questions, onComplete }: QuizEngineProps) {
  const [answers,  setAnswers]  = useState<Record<string, string[]>>({});
  const [phase,    setPhase]    = useState<Phase>('answering');
  const [result,   setResult]   = useState<QuizResult | null>(null);
  const [current,  setCurrent]  = useState(0);
  const [loading,  setLoading]  = useState(false);

  const question = questions[current];
  const isMulti  = question?.type === 'multiple';

  const toggleOption = (optionId: string) => {
    if (phase !== 'answering') return;
    setAnswers((prev) => {
      const existing = prev[question.id] ?? [];
      if (isMulti) {
        return { ...prev, [question.id]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId] };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await apiPost<QuizResult>(`/api/v1/quizzes/${quizId}/submit`, { answers });
      setResult(res);
      setPhase('submitted');
      onComplete?.(res.passed, res.score);
    } finally {
      setLoading(false);
    }
  };

  const allAnswered = questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  if (phase === 'submitted' && result) {
    return (
      <div className="space-y-6">
        {/* Score card */}
        <div className={cn(
          'rounded-xl p-6 text-center border-2',
          result.passed
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        )}>
          {result.passed
            ? <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            : <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />}
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {result.score}%
          </h3>
          <p className={cn('font-medium', result.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300')}>
            {result.passed ? '🎉 Quiz passed!' : 'Keep practicing — you can do it!'}
          </p>
        </div>

        {/* Per-question breakdown */}
        {questions.map((q, i) => {
          const qResult = result.results.find((r) => r.questionId === q.id);
          return (
            <div key={q.id} className="card p-4">
              <div className="flex items-start gap-3 mb-3">
                {qResult?.correct
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <XCircle      className="w-5 h-5 text-red-500     flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Q{i + 1}. {q.text}
                </p>
              </div>
              <div className="space-y-1.5 ml-8">
                {q.options.map((opt) => {
                  const userPicked  = (answers[q.id] ?? []).includes(opt.id);
                  const isCorrect   = qResult?.correctIds.includes(opt.id);
                  return (
                    <div key={opt.id} className={cn(
                      'px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                      isCorrect  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200' : '',
                      userPicked && !isCorrect ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : '',
                      !isCorrect && !userPicked ? 'text-gray-500 dark:text-gray-400' : '',
                    )}>
                      {isCorrect ? '✓' : userPicked ? '✗' : '○'} {opt.text}
                    </div>
                  );
                })}
              </div>
              {qResult?.explanation && (
                <p className="ml-8 mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  💡 {qResult.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Question {current + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={cn(
                'w-6 h-6 rounded-full text-xs font-medium transition-colors',
                i === current ? 'bg-brand-600 text-white' :
                answers[questions[i].id]?.length ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400' :
                'bg-gray-100 dark:bg-gray-800 text-gray-400',
              )}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="card p-6">
        <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
          {isMulti && <span className="text-xs text-gray-400 block mb-2">Select all that apply</span>}
          {question.text}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const selected = (answers[question.id] ?? []).includes(opt.id);
          return (
            <button key={opt.id} onClick={() => toggleOption(opt.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                selected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-600',
              )}>
              <span className={cn(
                'inline-flex w-5 h-5 mr-3 rounded border-2 items-center justify-center text-xs flex-shrink-0',
                selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-300 dark:border-gray-600',
              )}>
                {selected && '✓'}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="btn-secondary text-sm disabled:opacity-40">
          Previous
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)}
            disabled={!(answers[question.id]?.length)}
            className="btn-primary text-sm disabled:opacity-40">
            Next question
          </button>
        ) : (
          <button onClick={submit}
            disabled={!allAnswered || loading}
            className="btn-primary text-sm disabled:opacity-40 flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
}
