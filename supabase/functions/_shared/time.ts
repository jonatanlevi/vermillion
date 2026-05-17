/** IANA timezone string (e.g. Asia/Jerusalem, America/New_York) */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * אזור זמן לחתימה: מה שהמכשיר מדווח ברגע הלחיצה (לא שעון מדינה קבועה באפליקציה).
 */
export function resolveStampTimezone(clientTz: string | null | undefined, profileTz: string | null | undefined): string {
  if (clientTz && isValidTimezone(clientTz)) return clientTz;
  if (profileTz && isValidTimezone(profileTz)) return profileTz;
  return 'UTC';
}

/** Local weekday (0=Sun … 5=Fri 6=Sat) and minutes-from-midnight in IANA timezone */
export function getLocalTimeParts(now: Date, timezone: string): { day: number; mins: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);

    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const day = dayMap[weekday] ?? now.getUTCDay();
    return { day, mins: hour * 60 + minute };
  } catch {
    return { day: now.getUTCDay(), mins: now.getUTCHours() * 60 + now.getUTCMinutes() };
  }
}

/** Hour/minute of an ISO timestamp in user timezone */
export function getLocalHM(iso: string, timezone: string): { hour: number; minute: number } {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  return {
    hour: parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10),
    minute: parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10),
  };
}
