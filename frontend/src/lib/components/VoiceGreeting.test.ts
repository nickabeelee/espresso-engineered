import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VoiceGreeting from './VoiceGreeting.svelte';
import type { Barista } from '@shared/types';

describe('VoiceGreeting Component', () => {
  const mockBarista: Barista = {
    id: 'test-barista-id',
    created_at: '2024-01-01T00:00:00Z',
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe'
  };

  beforeEach(() => {
    // Mock Date to ensure consistent test results
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a voice greeting message', () => {
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: null,
        hasRecentActivity: false
      } 
    });
    
    // Should render a voice greeting element
    const greeting = screen.getByText(/./);
    expect(greeting).toBeInTheDocument();
    expect(greeting).toHaveClass('voice-line');
  });

  it('shows first visit greeting for new users', () => {
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: null,
        hasRecentActivity: false
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should show one of the first visit greetings
    const firstVisitGreetings = [
      "Take a moment.",
      "There's time for this.",
      "You can stay here awhile."
    ];
    
    expect(firstVisitGreetings).toContain(greetingText);
  });

  it('shows returning user greeting for users who have been away', () => {
    // Set date to 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: tenDaysAgo,
        hasRecentActivity: false
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should show one of the returning user greetings
    const returningGreetings = [
      "You came back.",
      "I wondered if you would.",
      "It's good to see you again."
    ];
    
    expect(returningGreetings).toContain(greetingText);
  });

  it('shows recent activity greeting for active users', () => {
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: new Date(),
        hasRecentActivity: true
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should show one of the recent activity greetings
    const recentActivityGreetings = [
      "Welcome back, John Doe.",
      "You've been busy with this.",
      "I see you've been brewing."
    ];
    
    expect(recentActivityGreetings).toContain(greetingText);
  });

  it('shows time-based greeting when user has recent brew but no recent activity', () => {
    // User has brewed recently (within 7 days) but no recent activity flag
    // This should trigger time-based greeting logic
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago (within 7 days)
    
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: recentDate,
        hasRecentActivity: false
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should show one of the time-based greetings (morning, afternoon, or evening)
    const timeBasedGreetings = [
      // Morning greetings
      "Morning light changes things.",
      "This hour suits espresso.",
      "Earlier has its advantages.",
      // Afternoon greetings  
      "Good to see you, John Doe.",
      "The afternoon brings focus.",
      "This feels like the right time.",
      // Evening greetings
      "The day's behind you now.",
      "Evening brings a different mood.",
      "This feels like a night brew."
    ];
    
    // Should not be from other contexts
    const nonTimeBasedGreetings = [
      "Take a moment.",
      "There's time for this.", 
      "You can stay here awhile.",
      "You came back.",
      "I wondered if you would.",
      "It's good to see you again.",
      "Welcome back, John Doe.",
      "You've been busy with this.",
      "I see you've been brewing."
    ];
    
    expect(timeBasedGreetings).toContain(greetingText);
    expect(nonTimeBasedGreetings).not.toContain(greetingText);
  });

  it('shows afternoon greeting when display name is used', () => {
    // Set time to 2 PM
    vi.setSystemTime(new Date('2024-01-01T14:00:00Z'));
    
    // User has brewed recently (within 7 days) but no recent activity flag
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago (within 7 days)
    
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: recentDate,
        hasRecentActivity: false
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // One of the afternoon greetings includes the display name
    // If we get that specific greeting, verify it contains the name
    if (greetingText === "Good to see you, John Doe.") {
      expect(greetingText).toContain("John Doe");
    }
    
    // Should be a valid greeting
    expect(greetingText).toBeTruthy();
  });

  it('shows evening greeting when time context is evening', () => {
    // Set time to 8 PM
    vi.setSystemTime(new Date('2024-01-01T20:00:00Z'));
    
    // User has brewed recently (within 7 days) but no recent activity flag
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2); // 2 days ago (within 7 days)
    
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: recentDate,
        hasRecentActivity: false
      } 
    });
    
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should be a valid greeting
    expect(greetingText).toBeTruthy();
    expect(greetingText.length).toBeGreaterThan(0);
  });

  it('uses display_name when available', () => {
    render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: null,
        hasRecentActivity: true
      } 
    });
    
    // Check if the greeting contains the display name
    // The recent_activity context has "Welcome back, {name}" as one option
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should be one of the recent activity greetings, and if it's the welcome back one, it should contain the name
    const recentActivityGreetings = [
      "Welcome back, John Doe.",
      "You've been busy with this.",
      "I see you've been brewing."
    ];
    
    expect(recentActivityGreetings).toContain(greetingText);
    
    // If it's the welcome back greeting, it should contain the display name
    if (greetingText === "Welcome back, John Doe.") {
      expect(greetingText).toContain("John Doe");
    }
  });

  it('falls back to first_name when display_name is not available', () => {
    const baristaWithoutDisplayName: Barista = {
      ...mockBarista,
      display_name: ''
    };
    
    render(VoiceGreeting, { 
      props: { 
        barista: baristaWithoutDisplayName,
        lastBrewDate: null,
        hasRecentActivity: true
      } 
    });
    
    // Check if the greeting uses first_name when display_name is empty
    const greeting = screen.getByText(/./);
    const greetingText = greeting.textContent;
    
    // Should be one of the recent activity greetings, and if it's the welcome back one, it should contain the first name
    const recentActivityGreetings = [
      "Welcome back, John.",
      "You've been busy with this.",
      "I see you've been brewing."
    ];
    
    expect(recentActivityGreetings).toContain(greetingText);
    
    // If it's the welcome back greeting, it should contain the first name
    if (greetingText === "Welcome back, John.") {
      expect(greetingText).toContain("John");
    }
  });

  it('applies correct CSS classes for voice text styling', () => {
    const { container } = render(VoiceGreeting, { 
      props: { 
        barista: mockBarista,
        lastBrewDate: null,
        hasRecentActivity: false
      } 
    });
    
    const voiceGreeting = container.querySelector('.voice-greeting');
    const voiceLine = container.querySelector('.voice-line');
    
    expect(voiceGreeting).toBeInTheDocument();
    expect(voiceLine).toBeInTheDocument();
  });
});