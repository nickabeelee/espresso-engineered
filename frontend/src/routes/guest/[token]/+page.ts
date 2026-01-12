import type { PageLoad } from './$types';
import type { GuestReflectionContext } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/guest/brews/${params.token}`);
    if (!response.ok) {
      return { guestError: 'This guest link is no longer available.' };
    }

    const payload = await response.json();
    return { guest: payload.data as GuestReflectionContext };
  } catch (error) {
    return { guestError: 'Unable to load the guest reflection.' };
  }
};
