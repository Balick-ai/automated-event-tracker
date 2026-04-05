import { buildEventTimes, ATTEND_LABELS, TICKET_LABELS } from './utils';

const CAL_API = 'https://www.googleapis.com/calendar/v3';

// --- Connection check ---
export function isConnected(settings) {
  return !!(settings?.googleTokens?.refresh_token);
}

// --- Token management ---
async function getValidToken(settings, persistSettings) {
  const tokens = settings.googleTokens;
  if (!tokens?.refresh_token) throw new Error('Not connected to Google Calendar');

  // Return existing token if still valid (60s buffer)
  if (tokens.access_token && tokens.expires_at > Date.now() + 60000) {
    return tokens.access_token;
  }

  // Refresh the token
  const res = await fetch('/api/auth/google/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.error === 'invalid_grant') {
      // Token revoked or expired — clear and require reconnection
      await persistSettings({ ...settings, googleTokens: null });
      throw new Error('Google Calendar session expired. Please reconnect in Settings.');
    }
    throw new Error('Failed to refresh Google token');
  }

  const data = await res.json();
  const updated = {
    ...tokens,
    access_token: data.access_token,
    expires_at: data.expires_at,
  };
  if (data.refresh_token) {
    updated.refresh_token = data.refresh_token;
  }

  await persistSettings({ ...settings, googleTokens: updated });
  return data.access_token;
}

// --- Fetch wrapper with auth ---
async function calFetch(path, options, settings, persistSettings) {
  const token = await getValidToken(settings, persistSettings);

  const res = await fetch(`${CAL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  // If 401, try refreshing once
  if (res.status === 401) {
    const freshToken = await getValidToken(
      { ...settings, googleTokens: { ...settings.googleTokens, expires_at: 0 } },
      persistSettings
    );
    const retry = await fetch(`${CAL_API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${freshToken}`,
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    return retry;
  }

  return res;
}

// --- Calendar management ---
export async function ensureCalendar(settings, persistSettings) {
  // Check if existing calendar ID is still valid
  if (settings.calendarId) {
    const check = await calFetch(`/calendars/${encodeURIComponent(settings.calendarId)}`, { method: 'GET' }, settings, persistSettings);
    if (check.ok) return settings.calendarId;
    // Calendar was deleted — fall through to create
  }

  // Create new calendar
  const calName = settings.calendarName || 'EDM Event Tracker';
  const res = await calFetch('/calendars', {
    method: 'POST',
    body: JSON.stringify({ summary: calName }),
  }, settings, persistSettings);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create calendar: ${err}`);
  }

  const cal = await res.json();
  await persistSettings({ ...settings, calendarId: cal.id });
  return cal.id;
}

// --- Event building ---
function buildCalendarEvent(show) {
  const times = buildEventTimes(show);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const event = {
    summary: show.artist,
    location: show.venue,
    description: [
      `Attending: ${ATTEND_LABELS[show.attending] || show.attending}`,
      `Ticket: ${TICKET_LABELS[show.ticketStatus] || show.ticketStatus}`,
      show.notes ? `\n${show.notes}` : '',
    ].filter(Boolean).join('\n'),
  };

  if (times.allDay) {
    // Google all-day end dates are exclusive — add 1 day
    const endDate = new Date(times.end);
    endDate.setDate(endDate.getDate() + 1);
    const endStr = endDate.toISOString().split('T')[0];

    event.start = { date: times.start };
    event.end = { date: endStr };
  } else {
    event.start = { dateTime: times.start, timeZone: tz };
    event.end = { dateTime: times.end, timeZone: tz };
  }

  return event;
}

// --- CRUD operations ---
export async function syncShowToCalendar(show, settings, persistSettings) {
  const calId = await ensureCalendar(settings, persistSettings);
  const event = buildCalendarEvent(show);

  let res;
  if (show.calendarEventId) {
    // Update existing event
    res = await calFetch(
      `/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(show.calendarEventId)}`,
      { method: 'PUT', body: JSON.stringify(event) },
      settings, persistSettings
    );

    // If event was deleted from calendar, create a new one
    if (res.status === 404 || res.status === 410) {
      res = await calFetch(
        `/calendars/${encodeURIComponent(calId)}/events`,
        { method: 'POST', body: JSON.stringify(event) },
        settings, persistSettings
      );
    }
  } else {
    // Create new event
    res = await calFetch(
      `/calendars/${encodeURIComponent(calId)}/events`,
      { method: 'POST', body: JSON.stringify(event) },
      settings, persistSettings
    );
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar sync failed: ${err}`);
  }

  const created = await res.json();
  return { ...show, calendarSynced: true, calendarEventId: created.id };
}

export async function deleteShowFromCalendar(show, settings, persistSettings) {
  if (!show.calendarEventId || !settings.calendarId) {
    return { ...show, calendarSynced: false, calendarEventId: null };
  }

  const res = await calFetch(
    `/calendars/${encodeURIComponent(settings.calendarId)}/events/${encodeURIComponent(show.calendarEventId)}`,
    { method: 'DELETE' },
    settings, persistSettings
  );

  // 404/410 = already gone, that's fine
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error('Failed to delete calendar event:', res.status);
  }

  return { ...show, calendarSynced: false, calendarEventId: null };
}

export async function syncAllShows(shows, settings, persistSettings, onProgress) {
  const toSync = shows.filter(s =>
    !s.calendarSynced && (s.attending !== 'not going' || settings.syncNotGoing)
  );

  if (toSync.length === 0) return shows;

  const calId = await ensureCalendar(settings, persistSettings);
  let updatedShows = [...shows];
  const results = [];

  for (let i = 0; i < toSync.length; i++) {
    const show = toSync[i];
    onProgress?.({ current: i + 1, total: toSync.length, results: [...results] });

    try {
      const synced = await syncShowToCalendar(show, settings, persistSettings);
      updatedShows = updatedShows.map(s => s.id === show.id ? synced : s);
      results.push({ show, status: 'synced' });
    } catch (err) {
      results.push({ show, status: 'failed', error: err.message });
    }

    // Small delay to avoid rate limiting
    if (i < toSync.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  onProgress?.({ current: toSync.length, total: toSync.length, results });
  return updatedShows;
}
