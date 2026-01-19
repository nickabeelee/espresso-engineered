import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte/svelte5';
import RoasterSelector from './RoasterSelector.svelte';

// Mock the API client
vi.mock('$lib/api-client', () => ({
  apiClient: {
    getRoasters: vi.fn().mockResolvedValue({ 
      data: [
        { id: '1', name: 'Blue Bottle Coffee', created_at: '2023-01-01', website_url: 'https://bluebottlecoffee.com' },
        { id: '2', name: 'Stumptown Coffee', created_at: '2023-01-02', website_url: 'https://stumptowncoffee.com' }
      ] 
    })
  }
}));

describe('RoasterSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(RoasterSelector, { props: { value: '' } });
    
    expect(screen.getByText('Loading roasters...')).toBeInTheDocument();
  });

  it('renders with empty value', () => {
    render(RoasterSelector, { props: { value: '' } });
    
    // Component should render without errors
    expect(screen.getByText('Loading roasters...')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(RoasterSelector, { props: { value: '', disabled: true } });
    
    // Component should render without errors when disabled
    expect(screen.getByText('Loading roasters...')).toBeInTheDocument();
  });
});
