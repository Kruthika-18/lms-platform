import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { quizzes, quizQuestions, quizAttempts } from '../../db/schema';
import { Errors } from '../../lib/errors';

export class QuizService {
  async getQuiz(quizId: string, forStudent = true) {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: { questions: { orderBy: quizQuestions.position } },
    });
    if (!quiz) throw Errors.notFound('Quiz');

    if (forStudent) {
      // Strip correct answers before sending to student
      return {
        ...quiz,
        questions: quiz.questions.map((q) => ({
          ...q,
          options: q.options.map(({ id, text }) => ({ id, text })),
        })),
      };
    }
    return quiz;
  }

  async submitAttempt(userId: string, quizId: string, answers: Record<string, string[]>) {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: { questions: true },
    });
    if (!quiz) throw Errors.notFound('Quiz');

    let score = 0;
    let maxScore = 0;

    const results = quiz.questions.map((q) => {
      maxScore += q.points;
      const userAnswers = answers[q.id] ?? [];
      const correctIds  = q.options.filter((o) => o.isCorrect).map((o) => o.id);

      const isCorrect =
        userAnswers.length === correctIds.length &&
        userAnswers.every((a) => correctIds.includes(a));

      if (isCorrect) score += q.points;

      return {
        questionId:  q.id,
        correct:     isCorrect,
        explanation: q.explanation,
        correctIds,
      };
    });

    const pct    = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = pct >= quiz.passingScore;

    const [attempt] = await db.insert(quizAttempts).values({
      userId,
      quizId,
      score: pct,
      maxScore: 100,
      passed,
      answers,
    }).returning();

    return { attempt, results, passed, score: pct };
  }

  async getBestAttempt(userId: string, quizId: string) {
    const attempts = await db.query.quizAttempts.findMany({
      where: and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)),
      orderBy: (t, { desc }) => [desc(t.score)],
      limit: 1,
    });
    return attempts[0] ?? null;
  }
}
