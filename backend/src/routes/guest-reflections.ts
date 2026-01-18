import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';
import { validateSchema, guestReflectionUpdateSchema } from '../validation/schemas.js';
import { deriveGuestReflectionState, getGuestEditWindowMinutes, hashGuestToken } from '../utils/guest-reflection.js';
import type { GuestBrewSummary, GuestReflectionContext, GuestReflectionUpdateRequest, RoastLevel } from '../types/index.js';

const guestEditWindowMinutes = getGuestEditWindowMinutes();

type GuestBrewRow = {
  id: string;
  name?: string | null;
  rating?: number | null;
  tasting_notes?: string | null;
  reflections?: string | null;
  guest_display_name?: string | null;
  guest_submitted_at?: string | null;
  guest_edit_expires_at?: string | null;
  guest_token_hash?: string | null;
  bag?: {
    id?: string;
    name?: string | null;
    bean?: {
      id?: string;
      name?: string | null;
      roast_level?: string | null;
      roaster?: {
        id?: string;
        name?: string | null;
      } | null;
    } | null | Array<{
      id?: string;
      name?: string | null;
      roast_level?: string | null;
      roaster?: {
        id?: string;
        name?: string | null;
      } | null;
    }>;
  } | null | Array<{
    id?: string;
    name?: string | null;
    bean?: {
      id?: string;
      name?: string | null;
      roast_level?: string | null;
      roaster?: {
        id?: string;
        name?: string | null;
      } | null;
    } | null | Array<{
      id?: string;
      name?: string | null;
      roast_level?: string | null;
      roaster?: {
        id?: string;
        name?: string | null;
      } | null;
    }>;
  }>;
};

function takeFirst<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function normalizeGuestBrew(brew: GuestBrewRow): GuestBrewSummary {
  const bag = takeFirst(brew.bag);
  const bean = takeFirst(bag?.bean ?? null);
  const roaster = takeFirst(bean?.roaster ?? null);

  return {
    id: brew.id,
    name: brew.name ?? undefined,
    rating: brew.rating ?? null,
    tasting_notes: brew.tasting_notes ?? null,
    reflections: brew.reflections ?? null,
    guest_display_name: brew.guest_display_name ?? null,
    bag: bag?.id
      ? {
          id: bag.id,
          name: bag.name ?? null,
          bean: bean?.id
            ? {
                id: bean.id,
                name: bean.name ?? null,
                roast_level: (bean.roast_level as RoastLevel | null) ?? null,
                roaster: roaster?.id
                  ? {
                      id: roaster.id,
                      name: roaster.name ?? null
                    }
                  : null
              }
            : null
        }
      : null
  };
}

async function fetchGuestBrew(tokenHash: string): Promise<GuestBrewRow | null> {
  const { data, error } = await supabase
    .from('brew')
    .select(`
      id,
      name,
      rating,
      tasting_notes,
      reflections,
      guest_display_name,
      guest_submitted_at,
      guest_edit_expires_at,
      guest_token_hash,
      bag:bag_id (
        id,
        name,
        bean:bean_id (
          id,
          name,
          roast_level,
          roaster:roaster_id (
            id,
            name
          )
        )
      )
    `)
    .eq('guest_token_hash', tokenHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Database error: ${error.message}`);
  }

  return data as GuestBrewRow;
}

function buildGuestContext(brew: GuestBrewRow): GuestReflectionContext {
  const derivedState = deriveGuestReflectionState({
    guest_token_hash: brew.guest_token_hash ?? null,
    guest_submitted_at: brew.guest_submitted_at ?? null,
    guest_edit_expires_at: brew.guest_edit_expires_at ?? null
  });
  const state = brew.guest_submitted_at ? 'locked' : derivedState;

  return {
    brew: normalizeGuestBrew(brew),
    state: state === 'none' ? 'draft' : state,
    edit_expires_at: brew.guest_edit_expires_at ?? null,
    submitted_at: brew.guest_submitted_at ?? null,
    edit_window_minutes: guestEditWindowMinutes
  };
}

export async function guestReflectionRoutes(fastify: FastifyInstance) {
  fastify.get('/api/guest/brews/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };
      const tokenHash = hashGuestToken(token);

      const brew = await fetchGuestBrew(tokenHash);
      if (!brew) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invalid or expired guest link'
        });
      }

      const context = buildGuestContext(brew);
      return { data: context };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch guest reflection'
      });
    }
  });

  fastify.put('/api/guest/brews/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };
      const tokenHash = hashGuestToken(token);
      const updateRequest = validateSchema(guestReflectionUpdateSchema, request.body) as GuestReflectionUpdateRequest;

      const brew = await fetchGuestBrew(tokenHash);
      if (!brew) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invalid or expired guest link'
        });
      }

      const now = new Date();
      const hasSubmitted = Boolean(brew.guest_submitted_at);
      const expiresAt = brew.guest_edit_expires_at ? new Date(brew.guest_edit_expires_at) : null;
      if (expiresAt && now >= expiresAt) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Guest reflection has been finalized'
        });
      }

      if (updateRequest.submit && hasSubmitted) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Guest reflection has already been submitted'
        });
      }

      const updates: Record<string, unknown> = {};
      if (updateRequest.rating !== undefined) updates.rating = updateRequest.rating;
      if (updateRequest.tasting_notes !== undefined) updates.tasting_notes = updateRequest.tasting_notes.trim() || null;
      if (updateRequest.reflections !== undefined) updates.reflections = updateRequest.reflections.trim() || null;
      if (updateRequest.guest_display_name !== undefined) {
        updates.guest_display_name = updateRequest.guest_display_name.trim() || null;
      }

      if (updateRequest.submit && !hasSubmitted) {
        updates.guest_submitted_at = now.toISOString();
        updates.guest_token_hash = null;
        updates.guest_edit_expires_at = null;
      }

      if (!Object.keys(updates).length) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'No guest reflection updates provided'
        });
      }

      const { data, error } = await supabase
        .from('brew')
        .update(updates)
        .eq('id', brew.id)
        .select(`
          id,
          name,
          rating,
          tasting_notes,
          reflections,
          guest_display_name,
          guest_submitted_at,
          guest_edit_expires_at,
          guest_token_hash,
          bag:bag_id (
            id,
            name,
            bean:bean_id (
              id,
              name,
              roast_level,
              roaster:roaster_id (
                id,
                name
              )
            )
          )
        `)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const context = buildGuestContext(data as GuestBrewRow);
      return { data: context };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update guest reflection'
      });
    }
  });
}
