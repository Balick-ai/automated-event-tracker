import { NextResponse } from 'next/server';
import { getVenuesForCity } from '@/lib/venues';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'New York';
  const stateCode = searchParams.get('stateCode') || 'NY';
  const radius = searchParams.get('radius') || '25';

  const tmKey = process.env.TICKETMASTER_API_KEY;
  const ebToken = process.env.EVENTBRITE_API_TOKEN;

  if (!tmKey) {
    return NextResponse.json({ error: 'Ticketmaster API key not configured' }, { status: 500 });
  }

  const now = new Date();
  const startDateTime = now.toISOString().split('.')[0] + 'Z';
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);
  const endDateTime = endDate.toISOString().split('.')[0] + 'Z';

  try {
    // Run all searches in parallel
    const cityVenues = getVenuesForCity(city);
    const isNYC = (city.toLowerCase().includes('new york') || city.toLowerCase().includes('nyc') || city.toLowerCase().includes('brooklyn'));

    const searches = [
      { name: 'Ticketmaster genre', fn: fetchTicketmasterGenre(tmKey, city, stateCode, radius, startDateTime, endDateTime) },
    ];

    // Run venue-based search if we have venues for this city
    if (cityVenues && cityVenues.length > 0) {
      searches.push({ name: 'Ticketmaster venues', fn: fetchTicketmasterVenues(tmKey, cityVenues, startDateTime, endDateTime) });
    }

    // Add Eventbrite if configured (NYC organizers only for now)
    if (ebToken && isNYC) {
      searches.push({ name: 'Eventbrite', fn: fetchEventbriteVenues(ebToken) });
    }

    const results = await Promise.allSettled(searches.map(s => s.fn));

    // Collect all normalized events
    let allEvents = [];
    const sources = [];

    for (let i = 0; i < results.length; i++) {
      const name = searches[i].name;
      if (results[i].status === 'fulfilled') {
        allEvents.push(...results[i].value);
        sources.push(`${name}: ${results[i].value.length}`);
      } else {
        console.error(`${name} failed:`, results[i].reason);
        sources.push(`${name}: failed`);
      }
    }

    // If everything failed
    if (allEvents.length === 0 && results[0].status === 'rejected') {
      return NextResponse.json({ error: 'All searches failed' }, { status: 502 });
    }

    // Deduplicate across all sources (same artist + date)
    const seen = new Set();
    const deduped = allEvents.filter(e => {
      const key = `${e.artist.toLowerCase().trim()}|${e.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ events: deduped, count: deduped.length, sources });
  } catch (err) {
    console.error('Discovery error:', err);
    return NextResponse.json({ error: err.message || 'Discovery failed' }, { status: 500 });
  }
}

// --- Ticketmaster: Genre-filtered city search ---
async function fetchTicketmasterGenre(apiKey, city, stateCode, radius, startDateTime, endDateTime) {
  const allEvents = [];

  for (let page = 0; page < 2; page++) {
    const params = new URLSearchParams({
      apikey: apiKey,
      city,
      stateCode,
      radius,
      unit: 'miles',
      classificationName: 'music',
      genreId: 'KnvZfZ7vAve,KnvZfZ7vAvF',
      startDateTime,
      endDateTime,
      size: '100',
      sort: 'date,asc',
      page: String(page),
    });

    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!res.ok) {
      if (page === 0) throw new Error(`Ticketmaster API error: ${res.status}`);
      break;
    }

    const data = await res.json();
    const events = data?._embedded?.events || [];
    allEvents.push(...events);

    const totalPages = data?.page?.totalPages || 1;
    if (page + 1 >= totalPages) break;
  }

  return allEvents.map(normalizeTMEvent).filter(e => e.artist && e.date);
}

// --- Ticketmaster: Venue-based search (no genre filter) ---
async function fetchTicketmasterVenues(apiKey, venues, startDateTime, endDateTime) {
  // Batch venue IDs into groups (TM supports comma-separated venueId)
  const venueIds = venues.map(v => v.id).join(',');
  const allEvents = [];

  for (let page = 0; page < 2; page++) {
    const params = new URLSearchParams({
      apikey: apiKey,
      venueId: venueIds,
      classificationName: 'music',
      startDateTime,
      endDateTime,
      size: '100',
      sort: 'date,asc',
      page: String(page),
    });

    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!res.ok) {
      if (page === 0) throw new Error(`TM venue search error: ${res.status}`);
      break;
    }

    const data = await res.json();
    const events = data?._embedded?.events || [];
    allEvents.push(...events);

    const totalPages = data?.page?.totalPages || 1;
    if (page + 1 >= totalPages) break;
  }

  return allEvents.map(normalizeTMEvent).filter(e => e.artist && e.date);
}

// --- Eventbrite: Venue-based search ---
// Known Eventbrite organizer IDs for NYC EDM venues
const EVENTBRITE_ORGS = [
  { id: '19690491312', name: 'Avant Gardner' },
  // Add more organizer IDs as discovered
];

async function fetchEventbriteVenues(token) {
  const allEvents = [];

  for (const org of EVENTBRITE_ORGS) {
    try {
      const res = await fetch(
        `https://www.eventbriteapi.com/v3/organizations/${org.id}/events/?status=live&order_by=start_asc&time_filter=current_future`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        console.error(`Eventbrite org ${org.name} error:`, res.status);
        continue;
      }

      const data = await res.json();
      const events = data?.events || [];

      for (const event of events) {
        // Fetch venue details if available
        let venueName = org.name;
        if (event.venue_id) {
          try {
            const venueRes = await fetch(
              `https://www.eventbriteapi.com/v3/venues/${event.venue_id}/`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (venueRes.ok) {
              const venueData = await venueRes.json();
              venueName = venueData.name || org.name;
            }
          } catch { /* use org name as fallback */ }
        }

        const startLocal = event.start?.local; // "2026-04-15T20:00:00"
        const date = startLocal ? startLocal.split('T')[0] : null;
        const startTime = startLocal ? startLocal.split('T')[1]?.slice(0, 5) : null;
        const endLocal = event.end?.local;
        const endTime = endLocal ? endLocal.split('T')[1]?.slice(0, 5) : null;

        if (date) {
          allEvents.push({
            artist: event.name?.text || 'Unknown',
            venue: venueName,
            date,
            endDate: null,
            startTime,
            endTime,
            notes: '',
            ticketUrl: event.url || null,
          });
        }
      }
    } catch (err) {
      console.error(`Eventbrite org ${org.name} fetch error:`, err);
    }
  }

  return allEvents;
}

// --- Normalize a Ticketmaster event ---
function normalizeTMEvent(event) {
  const artist = extractArtist(event);
  const venue = event._embedded?.venues?.[0]?.name || 'TBA';
  const dateInfo = event.dates?.start || {};
  const date = dateInfo.localDate || null;
  const startTime = dateInfo.localTime ? dateInfo.localTime.slice(0, 5) : null;
  const notes = extractNotes(event);
  const ticketUrl = event.url || null;

  return { artist, venue, date, endDate: null, startTime, endTime: null, notes, ticketUrl };
}

function extractArtist(event) {
  const attractions = event._embedded?.attractions;
  if (attractions?.length > 0) {
    return attractions[0].name;
  }
  let name = event.name || 'Unknown';
  name = name.replace(/\s+at\s+.+$/i, '').trim();
  return name;
}

function extractNotes(event) {
  const parts = [];

  const attractions = event._embedded?.attractions;
  if (attractions?.length > 1) {
    const supports = attractions.slice(1).map(a => a.name).join(', ');
    parts.push(`w/ ${supports}`);
  }

  const prices = event.priceRanges;
  if (prices?.length > 0) {
    const p = prices[0];
    if (p.min && p.max) {
      parts.push(`$${p.min}–$${p.max}`);
    } else if (p.min) {
      parts.push(`From $${p.min}`);
    }
  }

  const genre = event.classifications?.[0]?.genre?.name;
  const subGenre = event.classifications?.[0]?.subGenre?.name;
  if (subGenre && subGenre !== 'Undefined') {
    parts.push(subGenre);
  } else if (genre && genre !== 'Undefined' && genre !== 'Music') {
    parts.push(genre);
  }

  return parts.join(' · ');
}
