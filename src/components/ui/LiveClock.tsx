'use client';

import { useEffect, useMemo, useState, type JSX } from 'react';

export interface LiveClockProps {
  timeZone: string;
  hour12?: boolean;
  className?: string;
  offsetClassName?: string;
}

function formatTime(date: Date, timeZone: string, hour12: boolean): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12, timeZone }).format(date);
}

/** "GMT+5" -> "(GMT +5)" - the spacing the original uses. */
function formatOffset(date: Date, timeZone: string): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  const raw = part?.value ?? 'GMT';
  return `(${raw.replace(/^GMT/, 'GMT ').trim()})`;
}

/**
 * Studio-local clock. Renders nothing time-specific on the server (server time !=
 * visitor time -> hydration mismatch), then ticks on the client.
 *
 * Optimization: instead of a 1 s interval (60 renders/min for a minute display),
 * it sleeps until the next minute boundary, then ticks every 60 s. Both timers are
 * cleared on unmount.
 */
export function LiveClock({ timeZone, hour12 = true, className, offsetClassName }: LiveClockProps): JSX.Element {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval !== undefined) clearInterval(interval);
    };
  }, []);

  const offset = useMemo<string>(() => (now ? formatOffset(now, timeZone) : ''), [now, timeZone]);

  return (
    <p className={className}>
      <time dateTime={now?.toISOString()}>{now ? formatTime(now, timeZone, hour12) : '\u00a0'}</time>{' '}
      <span className={offsetClassName}>{offset}</span>
    </p>
  );
}
