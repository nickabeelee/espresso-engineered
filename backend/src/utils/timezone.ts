export type TimeFormat = 'HH:MM' | 'HH:MM:SS' | 'HH:MM z';

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function formatTimeWithTimezone(
  date: Date,
  timezone: string,
  format: TimeFormat = 'HH:MM'
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  };

  if (format === 'HH:MM:SS') {
    options.second = '2-digit';
  }

  if (format === 'HH:MM z') {
    options.timeZoneName = 'short';
  }

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);
  const partMap = new Map(parts.map(part => [part.type, part.value]));

  const hour = (partMap.get('hour') ?? '').padStart(2, '0');
  const minute = (partMap.get('minute') ?? '').padStart(2, '0');
  const second = (partMap.get('second') ?? '').padStart(2, '0');
  const timezoneName = partMap.get('timeZoneName') ?? timezone;

  switch (format) {
    case 'HH:MM':
      return `${hour}:${minute}`;
    case 'HH:MM:SS':
      return `${hour}:${minute}:${second}`;
    case 'HH:MM z':
      return `${hour}:${minute} ${timezoneName}`;
    default:
      return `${hour}:${minute}`;
  }
}
