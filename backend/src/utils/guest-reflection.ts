import crypto from 'node:crypto';
import type { Brew, GuestReflectionState } from '../types/index.js';

const DEFAULT_GUEST_WINDOW_MINUTES = 15;

export function getGuestEditWindowMinutes(): number {
  const minutes = Number.parseInt(process.env.GUEST_REFLECTION_WINDOW_MINUTES || '', 10);
  if (Number.isFinite(minutes) && minutes > 0) {
    return minutes;
  }
  return DEFAULT_GUEST_WINDOW_MINUTES;
}

export function getGuestEditWindowMs(): number {
  return getGuestEditWindowMinutes() * 60 * 1000;
}

export function generateGuestToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashGuestToken(token);
  return { token, hash };
}

export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function deriveGuestReflectionState(brew: Pick<Brew, 'guest_token_hash' | 'guest_submitted_at' | 'guest_edit_expires_at'>): GuestReflectionState | 'none' {
  if (!brew.guest_token_hash) {
    return 'none';
  }
  if (brew.guest_edit_expires_at) {
    const expiresAt = new Date(brew.guest_edit_expires_at).getTime();
    return Date.now() < expiresAt ? 'editing' : 'locked';
  }
  if (!brew.guest_submitted_at) {
    return 'draft';
  }
  return 'locked';
}

export function isGuestReflectionLocked(brew: Pick<Brew, 'guest_edit_expires_at'>): boolean {
  if (!brew.guest_edit_expires_at) {
    return false;
  }
  return Date.now() < new Date(brew.guest_edit_expires_at).getTime();
}
