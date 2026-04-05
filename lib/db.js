import { openDB } from 'idb';

const DB_NAME = 'event-tracker-db';
const DB_VERSION = 1;
const SHOWS_STORE = 'shows';
const SETTINGS_STORE = 'settings';

const DEFAULT_SETTINGS = {
  syncNotGoing: false,
  calendarId: null,
  calendarName: 'Automated Event Tracker',
  city: 'New York',
  stateCode: 'NY',
  radius: 25,
  googleTokens: null,
  userGeminiKey: null,
  lastAISearch: null,
  autoSearchFrequency: 'off',
  autoSearchTypes: 'ticketmaster',
  lastAutoSearch: null,
};

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SHOWS_STORE)) {
        db.createObjectStore(SHOWS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    },
  });
}

// Shows
export async function getAllShows() {
  const db = await getDB();
  return db.getAll(SHOWS_STORE);
}

export async function getShow(id) {
  const db = await getDB();
  return db.get(SHOWS_STORE, id);
}

export async function putShow(show) {
  const db = await getDB();
  return db.put(SHOWS_STORE, show);
}

export async function deleteShow(id) {
  const db = await getDB();
  return db.delete(SHOWS_STORE, id);
}

export async function saveAllShows(shows) {
  const db = await getDB();
  const tx = db.transaction(SHOWS_STORE, 'readwrite');
  await tx.store.clear();
  for (const show of shows) {
    await tx.store.put(show);
  }
  await tx.done;
}

// Settings
export async function getSettings() {
  const db = await getDB();
  const stored = await db.get(SETTINGS_STORE, 'main');
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export async function saveSettings(settings) {
  const db = await getDB();
  return db.put(SETTINGS_STORE, settings, 'main');
}

export { DEFAULT_SETTINGS };
