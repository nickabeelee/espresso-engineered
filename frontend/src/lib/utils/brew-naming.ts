import type { Brew } from '@shared/types';

type BrewNameOptions = {
  baristaDisplayName: string;
  beanName: string;
  brewedAt: Date;
  bagId?: string;
  existingBrews?: Brew[];
  excludeBrewId?: string;
};

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function buildBrewName(options: BrewNameOptions): string {
  const { baristaDisplayName, beanName, brewedAt } = options;
  const timeOfDay = getTimeOfDayLabel(brewedAt);
  const brewDate = formatBrewDate(brewedAt);
  const sequence = getBrewSequence(options, timeOfDay);
  const ordinal = formatOrdinal(sequence);

  const parts = [
    `${baristaDisplayName}'s`,
    ordinal,
    timeOfDay,
    beanName,
    brewDate
  ].filter((part) => Boolean(part && part.trim()));

  return parts.join(' ').trim();
}

function getTimeOfDayLabel(date: Date): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 22) {
    return 'evening';
  }

  return 'night';
}

function formatBrewDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  }).format(date);
}

function formatOrdinal(sequence: number): string {
  if (sequence <= 1) {
    return '';
  }

  const remainderTen = sequence % 10;
  const remainderHundred = sequence % 100;

  if (remainderTen === 1 && remainderHundred !== 11) return `${sequence}st`;
  if (remainderTen === 2 && remainderHundred !== 12) return `${sequence}nd`;
  if (remainderTen === 3 && remainderHundred !== 13) return `${sequence}rd`;
  return `${sequence}th`;
}

function getBrewSequence(options: BrewNameOptions, timeOfDay: TimeOfDay): number {
  const { brewedAt, bagId, existingBrews = [], excludeBrewId } = options;

  if (!bagId || existingBrews.length === 0) {
    return 1;
  }

  const range = getTimeOfDayRange(brewedAt, timeOfDay);
  const matches = existingBrews.filter((brew) => {
    if (!brew.created_at || brew.id === excludeBrewId) return false;
    if (brew.bag_id !== bagId) return false;

    const brewDate = new Date(brew.created_at);
    return brewDate >= range.start && brewDate < range.end;
  });

  return matches.length + 1;
}

function getTimeOfDayRange(date: Date, timeOfDay: TimeOfDay): { start: Date; end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (timeOfDay === 'morning') {
    return {
      start: new Date(year, month, day, 5, 0, 0, 0),
      end: new Date(year, month, day, 12, 0, 0, 0)
    };
  }

  if (timeOfDay === 'afternoon') {
    return {
      start: new Date(year, month, day, 12, 0, 0, 0),
      end: new Date(year, month, day, 17, 0, 0, 0)
    };
  }

  if (timeOfDay === 'evening') {
    return {
      start: new Date(year, month, day, 17, 0, 0, 0),
      end: new Date(year, month, day, 22, 0, 0, 0)
    };
  }

  if (date.getHours() >= 22) {
    return {
      start: new Date(year, month, day, 22, 0, 0, 0),
      end: new Date(year, month, day + 1, 5, 0, 0, 0)
    };
  }

  return {
    start: new Date(year, month, day - 1, 22, 0, 0, 0),
    end: new Date(year, month, day, 5, 0, 0, 0)
  };
}
