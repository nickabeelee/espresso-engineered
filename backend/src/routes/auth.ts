import type { FastifyInstance } from 'fastify';

function buildRedirectUrl(request: { url: string }, path: string) {
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  const [, queryString] = request.url.split('?');
  const querySuffix = queryString ? `?${queryString}` : '';
  return `${frontendBaseUrl}${path}${querySuffix}`;
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get('/auth/new-account', async (request, reply) => {
    const destination = buildRedirectUrl(request, '/auth/new-account');
    return reply.redirect(destination);
  });

  fastify.get('/auth/new-password', async (request, reply) => {
    const destination = buildRedirectUrl(request, '/auth/new-password');
    return reply.redirect(destination);
  });
}
