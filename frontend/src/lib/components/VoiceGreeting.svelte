<script lang="ts">
  import type { Barista } from '@shared/types';

  export let barista: Barista;
  export let lastBrewDate: Date | null = null;
  export let hasRecentActivity: boolean = false;

  type TimeOfDay = 'morning' | 'afternoon' | 'evening';
  type GreetingContext = 'first_visit' | 'returning' | 'morning' | 'afternoon' | 'evening' | 'no_activity' | 'recent_activity';

  function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  function getGreetingContext(): GreetingContext {
    const timeOfDay = getTimeOfDay();
    
    // Check if this is likely a first visit (no recent activity and no last brew)
    if (!hasRecentActivity && !lastBrewDate) {
      return 'first_visit';
    }
    
    // Check if user has recent activity (brewed recently)
    if (hasRecentActivity) {
      return 'recent_activity';
    }
    
    // Check if user has been away for a while
    if (lastBrewDate) {
      const daysSinceLastBrew = (Date.now() - lastBrewDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBrew > 7) {
        return 'returning';
      }
    }
    
    // Default to time-based greeting
    return timeOfDay;
  }

  function selectGreeting(context: GreetingContext, baristaName: string): string {
    const greetings: Record<GreetingContext, string[]> = {
      first_visit: [
        "Take a moment.",
        "There's time for this.",
        "You can stay here awhile."
      ],
      returning: [
        "You came back.",
        "I wondered if you would.",
        "It's good to see you again."
      ],
      morning: [
        "Morning light changes things.",
        "This hour suits espresso.",
        "Earlier has its advantages."
      ],
      afternoon: [
        `Good to see you, ${baristaName}.`,
        "The afternoon brings focus.",
        "This feels like the right time."
      ],
      evening: [
        "The day's behind you now.",
        "Evening brings a different mood.",
        "This feels like a night brew."
      ],
      no_activity: [
        "Nothing here yet.",
        "You haven't started this one.",
        "When you're ready, I'll remember it."
      ],
      recent_activity: [
        `Welcome back, ${baristaName}.`,
        "You've been busy with this.",
        "I see you've been brewing."
      ]
    };

    const contextGreetings = greetings[context];
    // Use a simple hash of the current date to get consistent but varying greetings
    const today = new Date().toDateString();
    const hash = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const index = Math.abs(hash) % contextGreetings.length;
    
    return contextGreetings[index];
  }

  $: context = getGreetingContext();
  $: displayName = barista.display_name || barista.first_name || 'Barista';
  $: greeting = selectGreeting(context, displayName);
</script>

<div class="voice-greeting">
  <p class="voice-line">{greeting}</p>
</div>

<style>
  .voice-greeting {
    margin-bottom: 1rem;
  }

  .voice-line {
    font-family: 'Libre Baskerville', serif;
    color: var(--text-ink-muted);
    font-size: 0.95rem;
    line-height: 1.7;
    letter-spacing: 0.02em;
    font-style: normal;
    margin: 0;
  }
</style>