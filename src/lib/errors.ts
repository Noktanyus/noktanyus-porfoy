/**
 * Re-export shared error classes from @/modules/shared/errors
 * for backward compatibility with existing code that imports from @/lib/errors.
 */
export {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
} from '@/modules/shared/errors';