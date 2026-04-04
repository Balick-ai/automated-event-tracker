import { NextResponse } from 'next/server';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch { /* empty body is fine */ }

  const city = body.city || 'New York';
  const stateCode = body.stateCode || 'NY';

  // User-provided key takes priority over server env key
  const apiKey = body.geminiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 6);
  const endDateStr = endDate.toISOString().split('T')[0];

  const location = stateCode ? `${city}, ${stateCode}` : city;

  // Two search prompts for comprehensive coverage
  const isNYC = (city.toLowerCase().includes('new york') || city.toLowerCase().includes('nyc') || city.toLowerCase().includes('brooklyn'));

  // Prompt 1: Aggregator sites (these cover events NOT on Ticketmaster)
  const searchPrompts = [
    `Search for upcoming EDM, electronic, house, and techno music events in ${location} happening between ${startDate} and ${endDateStr}. Check Resident Advisor, edmtrain, 19hz, DICE, and Bandsintown listings. Focus on events that might NOT be on Ticketmaster — club nights, underground parties, smaller venue shows. For each event you find, list: the artist/DJ name, venue, date, start time if known, and any supporting acts. List as many events as you can find.`,
  ];

  // Prompt 2: Venue-specific search targeting venues NOT covered by Ticketmaster
  if (isNYC) {
    searchPrompts.push(
      `Search for upcoming electronic music and DJ events at these ${location} nightclub and smaller venues between ${startDate} and ${endDateStr}. These venues often sell tickets through DICE, Bandsintown, Resident Advisor, or their own sites rather than Ticketmaster: Marquee NYC, Marquee Skydeck, Bossa Nova Civic Club, Basement, Schimanski, Paragon, Le Bain, Output, Nebula, Roulette, Nowadays, Jupiter Disco, Mood Ring, Black Flamingo, Silo, Baby's All Right, National Sawdust, Sultan Room, Lot 45. Also check Elsewhere Zone One, Elsewhere Hall, and any Avant Gardner events not on Ticketmaster. For each event, list: artist/DJ name, venue, date, start time if known, and any supporting acts.`
    );
  } else {
    searchPrompts.push(
      `Search for upcoming electronic music and DJ events at nightclubs, underground venues, and smaller music venues in ${location} between ${startDate} and ${endDateStr}. Focus on events sold through DICE, Bandsintown, Resident Advisor, or venue websites rather than Ticketmaster. For each event, list: artist/DJ name, venue, date, start time if known, and any supporting acts. List as many events as you can find.`
    );
  }

  try {
    // Step 1: Run both searches in parallel with Google Search grounding
    const searchResults = await Promise.allSettled(
      searchPrompts.map(prompt => callGemini(apiKey, prompt))
    );

    let combinedText = '';
    let failedSearches = 0;

    for (const result of searchResults) {
      if (result.status === 'fulfilled' && result.value) {
        combinedText += result.value + '\n\n';
      } else {
        failedSearches++;
        console.error('Gemini search failed:', result.reason?.message || 'unknown');
      }
    }

    if (!combinedText.trim()) {
      return NextResponse.json({
        error: failedSearches === 2
          ? 'Both AI searches failed. Check API key and try again.'
          : 'AI search returned no results.',
      }, { status: 502 });
    }

    // Step 2: Parse results into structured JSON
    const parsePrompt = `You are a data extraction tool. Below are search results about upcoming electronic music events in ${location}. Extract every event mentioned and return them as a JSON array. Return ONLY the JSON array with no other text, no markdown fences, no explanation.

Each object must have exactly these fields:
- "artist": string (main artist/DJ name)
- "venue": string (venue name)
- "date": string (YYYY-MM-DD format)
- "endDate": string or null (YYYY-MM-DD for multi-day events, null otherwise)
- "startTime": string or null (HH:MM in 24hr format if known, null if unknown)
- "endTime": string or null (HH:MM in 24hr format if known, null if unknown)
- "notes": string (supporting acts, special info, or empty string)

If a date is ambiguous, use your best judgment for the year ${now.getFullYear()}. If you cannot determine an exact date, skip that event.

SEARCH RESULTS:
${combinedText}

JSON ARRAY:`;

    const parseResult = await callGemini(apiKey, parsePrompt, false);

    if (!parseResult) {
      return NextResponse.json({ error: 'Failed to parse search results' }, { status: 502 });
    }

    // Extract JSON from response
    const events = extractJSON(parseResult);

    // Normalize
    const valid = events
      .filter(d => d.artist && d.date && d.venue)
      .map(d => ({
        artist: String(d.artist).trim(),
        venue: String(d.venue).trim(),
        date: String(d.date).trim(),
        endDate: d.endDate ? String(d.endDate).trim() : null,
        startTime: d.startTime ? String(d.startTime).trim() : null,
        endTime: d.endTime ? String(d.endTime).trim() : null,
        notes: d.notes ? String(d.notes).trim() : '',
        ticketUrl: null,
      }));

    // Deduplicate
    const seen = new Set();
    const deduped = valid.filter(d => {
      const key = `${d.artist.toLowerCase()}|${d.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      events: deduped,
      count: deduped.length,
      searchesCompleted: 2 - failedSearches,
    });
  } catch (err) {
    console.error('AI search error:', err);
    return NextResponse.json({ error: err.message || 'AI search failed' }, { status: 500 });
  }
}

async function callGemini(apiKey, prompt, useSearch = true) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Gemini API error:', res.status, errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.filter(p => p.text).map(p => p.text).join('\n');
}

function extractJSON(text) {
  if (!text) return [];
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const s = cleaned.indexOf('[');
  const e = cleaned.lastIndexOf(']');
  if (s !== -1 && e !== -1 && e > s) {
    try { return JSON.parse(cleaned.slice(s, e + 1)); } catch { /* fall through */ }
  }
  const objects = [];
  const regex = /\{[^{}]*"artist"[^{}]*\}/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    try { objects.push(JSON.parse(match[0])); } catch { /* skip */ }
  }
  return objects;
}
