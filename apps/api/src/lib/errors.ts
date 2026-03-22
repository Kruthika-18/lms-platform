export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ─── Error factories ──────────────────────────────────────────
export const Errors = {
  notFound:       (resource: string) => new AppError('NOT_FOUND',       `${resource} not found`,                  404),
  unauthorized:   ()                 => new AppError('UNAUTHORIZED',    'Authentication required',                 401),
  forbidden:      ()                 => new AppError('FORBIDDEN',       'You do not have permission',              403),
  conflict:       (msg: string)      => new AppError('CONFLICT',        msg,                                       409),
  validation:     (msg: string)      => new AppError('VALIDATION_ERROR', msg,                                      422),
  rateLimited:    ()                 => new AppError('RATE_LIMITED',    'Too many requests, slow down',            429),
  alreadyEnrolled:()                 => new AppError('ALREADY_ENROLLED','Already enrolled in this course',        409),
  paymentRequired:()                 => new AppError('PAYMENT_REQUIRED','Upgrade your plan to access this',       402),
};
