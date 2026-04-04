import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'New York';
  const stateCode = searchParams.get('stateCode') || 'NY';
  const radius = searchParams.get('radius') || '25';

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Ticketmaster API key not configured' }, { status: 500 });
  }

  const now = new Date();
  const startDateTime = now.toISOString().split('.')[0] + 'Z';
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 6);
  const endDateTime = endDate.toISOString().split('.')[0] + 'Z';

  try {
    // Fetch multiple pages from Ticketmaster (up to 200 events)
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

      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Ticketmaster API error (page ${page}):`, res.status, errText);
        if (page === 0) {
          return NextResponse.json({ error: `Ticketmaster API error: ${res.status}` }, { status: 502 });
        }
        break;
      }

      const data = await res.json();
      const events = data?._embedded?.events || [];
      allEvents.push(...events);

      // Stop if no more pages
      const totalPages = data?.page?.totalPages || 1;
      if (page + 1 >= totalPages) break;
    }

    // Normalize Ticketmaster events
    const normalized = allEvents.map(event => {
      const artist = extractArtist(event);
      const venue = event._embedded?.venues?.[0]?.name || 'TBA';
      const dateInfo = event.dates?.start || {};
      const date = dateInfo.localDate || null;
      const startTime = dateInfo.localTime ? dateInfo.localTime.slice(0, 5) : null;
      const notes = extractNotes(event);
      const ticketUrl = event.url || null;

      return {
        artist,
        venue,
        date,
        endDate: null,
        startTime,
        endTime: null,
        notes,
        ticketUrl,
      };
    }).filter(e => e.artist && e.date);

    // Deduplicate within results (same artist + date)
    const seen = new Set();
    const deduped = normalized.filter(e => {
      const key = `${e.artist.toLowerCase().trim()}|${e.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ events: deduped, count: deduped.length });
  } catch (err) {
    console.error('Discovery error:', err);
    return NextResponse.json({ error: err.message || 'Discovery failed' }, { status: 500 });
  }
}

function extractArtist(event) {
  // Try attractions first (most reliable for artist name)
  const attractions = event._embedded?.attractions;
  if (attractions?.length > 0) {
    return attractions[0].name;
  }
  // Fall back to event name, clean up common suffixes
  let name = event.name || 'Unknown';
  // Remove venue-style suffixes like "at Brooklyn Mirage"
  name = name.replace(/\s+at\s+.+$/i, '').trim();
  return name;
}

function extractNotes(event) {
  const parts = [];

  // Additional attractions (supporting acts)
  const attractions = event._embedded?.attractions;
  if (attractions?.length > 1) {
    const supports = attractions.slice(1).map(a => a.name).join(', ');
    parts.push(`w/ ${supports}`);
  }

  // Price range
  const prices = event.priceRanges;
  if (prices?.length > 0) {
    const p = prices[0];
    if (p.min && p.max) {
      parts.push(`$${p.min}–$${p.max}`);
    } else if (p.min) {
      parts.push(`From $${p.min}`);
    }
  }

  // Genre info
  const genre = event.classifications?.[0]?.genre?.name;
  const subGenre = event.classifications?.[0]?.subGenre?.name;
  if (subGenre && subGenre !== 'Undefined') {
    parts.push(subGenre);
  } else if (genre && genre !== 'Undefined' && genre !== 'Music') {
    parts.push(genre);
  }

  return parts.join(' · ');
}
