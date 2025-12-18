import { FastifyReply } from 'fastify';

/**
 * Helper function to handle common error patterns in API routes
 */
export function handleRouteError(error: unknown, reply: FastifyReply, operation: string) {
  // Handle NotFoundError or similar
  if (error instanceof Error && error.message.includes('not found')) {
    return reply.status(404).send({
      error: 'Not Found',
      message: error.message
    });
  }

  // Handle access denied errors
  if (error instanceof Error && error.message.includes('access denied')) {
    return reply.status(404).send({
      error: 'Not Found',
      message: error.message
    });
  }

  // Handle validation errors (Zod)
  if (error instanceof Error && error.name === 'ZodError') {
    return reply.status(400).send({
      error: 'Validation Error',
      message: `Invalid ${operation} data`,
      details: (error as any).errors
    });
  }

  // Handle foreign key constraint violations
  if (error instanceof Error && error.message.includes('Referenced resource does not exist')) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message
    });
  }

  // Handle referential integrity violations
  if (error instanceof Error && error.message.includes('referenced by other records')) {
    return reply.status(409).send({
      error: 'Conflict',
      message: error.message
    });
  }

  // Default server error
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: `Failed to ${operation}`
  });
}

/**
 * Check if error indicates a validation issue
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof Error && (
    error.name === 'ZodError' ||
    error.message.includes('Referenced resource does not exist')
  );
}

/**
 * Check if error indicates a not found issue
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('not found') ||
    error.message.includes('access denied')
  );
}

/**
 * Check if error indicates a conflict issue
 */
export function isConflictError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('referenced by other records');
}