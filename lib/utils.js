// --- ID Generation ---
export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// --- Constants ---
export const TICKET_STATES = ['need', 'have', 'not needed'];
export const TICKET_LABELS = { need: 'Need Ticket', have: 'Have Ticket', 'not needed': 'Free/N/A' };
export const TICKET_COLORS = {
  need: 'text-orange-400 bg-orange-400/15',
  have: 'text-emerald-400 bg-emerald-400/15',
  'not needed': 'text-slate-400 bg-slate-400/15',
};

export const ATTEND_STATES = ['undecided', 'going', 'maybe', 'not going'];
export const ATTEND_LABELS = { undecided: 'Undecided', going: 'Going', maybe: 'Maybe', 'not going': 'Not Going' };
export const ATTEND_COLORS = {
  going: 'text-emerald-400 bg-emerald-400/15',
  maybe: 'text-amber-400 bg-amber-400/15',
  undecided: 'text-slate-400 bg-slate-400/15',
  'not going': 'text-red-400 bg-red-400/15',
};
export const DOT_COLORS = {
  going: 'bg-emerald-400',
  maybe: 'bg-amber-400',
  undecided: 'bg-slate-500',
  'not going': 'bg-red-400',
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const DAYS_HDR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Date/Time Helpers ---
export function formatDate(ds) {
  if (!ds) return '';
  const [y, m, d] = ds.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

export function formatTime12(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function sixMonthsFromNow() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().split('T')[0];
}

export function dateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function showOnDate(show, ds) {
  return show.endDate ? ds >= show.date && ds <= show.endDate : show.date === ds;
}

export function getCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export function timeAgo(ts) {
  if (!ts) return null;
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function showTimeStr(s) {
  if (s.startTime) {
    const st = formatTime12(s.startTime);
    const et = s.endTime ? formatTime12(s.endTime) : null;
    return et ? `${st} – ${et}` : st;
  }
  return '(all day)';
}

export function buildEventTimes(show) {
  if (show.endDate) return { allDay: true, start: show.date, end: show.endDate };
  if (!show.startTime) return { allDay: true, start: show.date, end: show.date };
  const startDT = `${show.date}T${show.startTime}:00`;
  if (show.endTime) {
    let endDate = show.date;
    if (show.endTime < show.startTime) {
      const d = new Date(show.date);
      d.setDate(d.getDate() + 1);
      endDate = d.toISOString().split('T')[0];
    }
    return { allDay: false, start: startDT, end: `${endDate}T${show.endTime}:00` };
  }
  const [h, m] = show.startTime.split(':').map(Number);
  const endH = h + 4;
  let endDate = show.date;
  if (endH >= 24) {
    const d = new Date(show.date);
    d.setDate(d.getDate() + 1);
    endDate = d.toISOString().split('T')[0];
  }
  const endTime = `${String(endH % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { allDay: false, start: startDT, end: `${endDate}T${endTime}:00` };
}

// --- Show Factory ---
export const emptyShow = () => ({
  id: '',
  date: '',
  endDate: '',
  artist: '',
  venue: '',
  ticketStatus: 'need',
  attending: 'undecided',
  startTime: null,
  endTime: null,
  notes: '',
  source: 'manual',
  calendarSynced: false,
  calendarEventId: null,
  lastVerified: null,
  unverified: false,
});
