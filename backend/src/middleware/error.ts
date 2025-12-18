import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';

/**
 * Global error handler middleware for Fastify
 * Provides consistent error responses with proper HTTP status codes
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }

  // Handle Supabase/PostgreSQL errors
  if (error.message?.includes('duplicate key value')) {
    return reply.status(409).send({
      error: 'Conflict',
      message: 'Resource already exists'
    });
  }

  if (error.message?.includes('foreign key constraint')) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Referenced resource does not exist'
    });
  }

  if (error.message?.includes('violates row-level security policy')) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Access denied by security policy'
    });
  }

  // Handle authentication errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: error.message || 'Authentication required'
    });
  }

  // Handle authorization errors
  if (error.statusCode === 403) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: error.message || 'Access denied'
    });
  }

  // Handle not found errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: error.message || 'Resource not found'
    });
  }

  // Handle validation errors
  if (error.statusCode === 400) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: error.message || 'Invalid request'
    });
  }

  // Handle server errors
  if (error.statusCode && error.statusCode >= 500) {
    return reply.status(error.statusCode || 500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message
    });
  }

  // Default error response
  return reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message || 'Unknown error'
  });
}

/**
 * Custom error classes for specific business logic errors
 */
export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}