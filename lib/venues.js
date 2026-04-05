// EDM/Electronic music venues by city — Ticketmaster venue IDs
// Used for venue-based discovery searches (catches events not tagged as electronic genre)

const VENUE_DATA = {
  'new york': {
    stateCode: 'NY',
    venues: [
      { id: 'KovZ917AOcZ', name: 'Great Hall - Avant Gardner' },
      { id: 'KovZpZA67IvA', name: 'Kings Hall - Avant Gardner' },
      { id: 'KovZ917AINX', name: 'The Brooklyn Mirage' },
      { id: 'Z7r9jZa77t', name: 'Lost Circus - Avant Gardner' },
      { id: 'KovZpZA6enaA', name: 'Elsewhere' },
      { id: 'KovZ917AQXF', name: 'Marquee New York' },
      { id: 'KovZpZAEteAA', name: 'Knockdown Center' },
      { id: 'KovZpZAEAFnA', name: 'Good Room' },
      { id: 'Z7r9jZa7rg', name: 'Public Records NYC' },
      { id: 'KovZpZAFkn6A', name: 'Terminal 5' },
      { id: 'KovZpa6WFe', name: 'Webster Hall' },
      { id: 'Z7r9jZa7DH', name: 'H0L0' },
      { id: 'Z7r9jZa7MU', name: 'Racket NYC' },
      { id: 'KovZpZAklIaA', name: '99 Scott' },
    ],
  },
  'los angeles': {
    stateCode: 'CA',
    venues: [
      { id: 'KovZpZAEd16A', name: 'Exchange LA' },
      { id: 'KovZpZAdIAtA', name: 'Academy LA' },
      { id: 'KovZ917AI1p', name: 'Avalon Hollywood' },
      { id: 'KovZpZAEeFkA', name: 'Sound Nightclub' },
      { id: 'KovZ917ALnY', name: 'Factory 93' },
      { id: 'KovZpa3u7e', name: 'Shrine Auditorium' },
      { id: 'KovZpZAEAlaA', name: 'Hollywood Palladium' },
      { id: 'KovZpZAkJnnA', name: 'El Rey Theatre' },
      { id: 'KovZpa6OCe', name: 'Echoplex' },
      { id: 'KovZ917AEuz', name: '1720' },
      { id: 'KovZpZAEFeEA', name: 'Catch One' },
    ],
  },
  'miami': {
    stateCode: 'FL',
    venues: [
      { id: 'KovZpZA1A6EA', name: 'Club Space' },
      { id: 'Z7r9jZaduE', name: 'The Ground at Club Space' },
      { id: 'Z7r9jZad69', name: 'E11EVEN Miami' },
      { id: 'Z7r9jZadI7', name: 'Floyd Miami' },
      { id: 'KovZpZA6AIIA', name: 'Treehouse' },
      { id: 'KovZ917AI0J', name: 'Oasis Wynwood' },
      { id: 'KovZ917Ac_V', name: 'LIV Nightclub' },
      { id: 'KovZ917AICk', name: 'Story Nightclub' },
    ],
  },
  'chicago': {
    stateCode: 'IL',
    venues: [
      { id: 'KovZ917AESx', name: 'Radius Chicago' },
      { id: 'KovZpZAJtF7A', name: 'Concord Music Hall' },
      { id: 'KovZpZAFdJnA', name: 'Aragon Ballroom' },
      { id: 'KovZpaoMXe', name: 'Metro' },
      { id: 'Z7r9jZades', name: 'PRYSM Nightclub' },
      { id: 'KovZpZA1En6A', name: 'Sound-Bar' },
      { id: 'ZFr9jZ1vev', name: 'SpyBar' },
      { id: 'KovZpZAJntvA', name: 'Thalia Hall' },
      { id: 'KovZ917AI5F', name: 'The Salt Shed' },
    ],
  },
  'las vegas': {
    stateCode: 'NV',
    venues: [
      { id: 'Z7r9jZa7iO', name: 'Zouk Nightclub' },
      { id: 'KovZ917AEKe', name: 'Hakkasan Nightclub' },
      { id: 'KovZpZAkntkA', name: 'Encore Beach Club' },
      { id: 'KovZpZAE7JFA', name: 'Marquee Nightclub' },
      { id: 'KovZpZAE7nvA', name: 'TAO Nightclub' },
      { id: 'KovZpZAEd66A', name: 'Wet Republic' },
      { id: 'KovZ917Amqw', name: 'AREA15' },
    ],
  },
  'san francisco': {
    stateCode: 'CA',
    venues: [
      { id: 'rZ7HnEZ17f37g', name: 'The Midway' },
      { id: 'KovZ917ALXB', name: 'The Great Northern' },
      { id: 'KovZpZAa17tA', name: '1015 Folsom' },
      { id: 'Z7r9jZadNg', name: 'Temple Nightclub' },
      { id: 'KovZpZAEet6A', name: 'The Regency Ballroom' },
      { id: 'KovZpZAJvllA', name: 'The Lodge at Regency' },
      { id: 'KovZpaKope', name: 'Bill Graham Civic Auditorium' },
    ],
  },
  'denver': {
    stateCode: 'CO',
    venues: [
      { id: 'KovZ917A_jf', name: 'Temple Nightclub' },
      { id: 'KovZ917AY2e', name: 'Club Vinyl' },
      { id: 'KovZ917AYbY', name: 'Meow Wolf Denver' },
      { id: 'KovZ917AxRI', name: 'Mission Ballroom' },
      { id: 'KovZpZAJv67A', name: 'Ogden Theatre' },
      { id: 'Z7r9jZaAg3', name: 'Number Thirty Eight' },
      { id: 'KovZpZAkEk1A', name: 'Bluebird Theater' },
      { id: 'KovZpZAaeIvA', name: 'Red Rocks Amphitheatre' },
      { id: 'KovZpZAAlIvA', name: 'Church Nightclub' },
      { id: 'KovZpZAIetnA', name: 'Beta Nightclub' },
    ],
  },
  'detroit': {
    stateCode: 'MI',
    venues: [
      { id: 'KovZpZAJFdvA', name: 'TV Lounge' },
      { id: 'KovZpa35Oe', name: 'Magic Stick' },
      { id: 'Z7r9jZad82', name: 'Marble Bar' },
      { id: 'Z7r9jZaA-L', name: 'Spot Lite' },
      { id: 'KovZpZAJAd6A', name: 'Masonic Temple Detroit' },
      { id: 'ZFr9jZ16aF', name: 'Elektricity Nightclub' },
      { id: 'KovZpZAkInIA', name: 'Grasshopper Underground' },
      { id: 'KovZ917A-lO', name: 'Russell Industrial Center' },
      { id: 'rZ7HnEZ17397P', name: 'Tangent Gallery' },
      { id: 'KovZpZAEAkEA', name: "Saint Andrew's Hall" },
    ],
  },
  'austin': {
    stateCode: 'TX',
    venues: [
      { id: 'ZFr9jZ1Fkk', name: 'Kingdom' },
      { id: 'Z7r9jZaA3a', name: 'Summit Rooftop' },
      { id: 'KovZ917AYuG', name: 'The Concourse Project' },
      { id: 'Z7r9jZa7-V', name: 'Cedar Street Courtyard' },
      { id: 'KovZpZAEAd7A', name: 'Empire Control Room' },
      { id: 'KovZpZAEAEeA', name: "Emo's Austin" },
      { id: 'KovZ917AxyZ', name: "Stubb's" },
      { id: 'KovZ917ACM7', name: 'The Mohawk' },
      { id: 'KovZpZAEFdJA', name: 'Vulcan Gas Company' },
      { id: 'Z7r9jZaAvF', name: 'Superstition' },
    ],
  },
  'seattle': {
    stateCode: 'WA',
    venues: [
      { id: 'KovZpZAEknlA', name: 'Showbox at The Market' },
      { id: 'KovZpa6Mee', name: 'Showbox SODO' },
      { id: 'KovZpappxe', name: 'Neumos' },
      { id: 'KovZ917AcMG', name: 'Kremwerk' },
      { id: 'Z7r9jZa7Ne', name: 'Supernova Seattle' },
      { id: 'KovZpZAFnltA', name: 'Neptune Theatre' },
      { id: 'KovZpZA1vFtA', name: 'The Crocodile' },
      { id: 'ZFr9jZ1Aed', name: 'Foundation Nightclub' },
      { id: 'KovZpZAaIEFA', name: 'Chop Suey' },
    ],
  },
  'washington dc': {
    stateCode: 'DC',
    venues: [
      { id: 'KovZpZAadt7A', name: 'Echostage' },
      { id: 'Z7r9jZad6W', name: 'Flash' },
      { id: 'KovZ917AJq3', name: 'Soundcheck' },
      { id: 'KovZpZA7knFA', name: '9:30 Club' },
      { id: 'KovZ917A3Y7', name: 'The Anthem' },
    ],
  },
  'atlanta': {
    stateCode: 'GA',
    venues: [
      { id: 'Z7r9jZadwf', name: 'Ravine' },
      { id: 'KovZ917AtK1', name: 'District' },
      { id: 'KovZ917AYbg', name: 'Believe Music Hall' },
      { id: 'KovZpaFEZe', name: 'Tabernacle' },
      { id: 'KovZpZAE6FnA', name: 'Terminal West' },
      { id: 'KovZ917AYK-', name: 'The Eastern' },
      { id: 'KovZpa3QVe', name: 'Opera Atlanta' },
    ],
  },
  'dallas': {
    stateCode: 'TX',
    venues: [
      { id: 'Z7r9jZadZ0', name: 'Stereo Live Dallas' },
      { id: 'KovZpZAJ7keA', name: "It'll Do Club" },
      { id: 'KovZpabvme', name: 'Lizard Lounge' },
      { id: 'KovZpZAEAFdA', name: 'South Side Ballroom' },
      { id: 'KovZpZAAIeEA', name: "Gilley's Dallas" },
    ],
  },
  'houston': {
    stateCode: 'TX',
    venues: [
      { id: 'KovZ917AGCf', name: 'Stereo Live Houston' },
      { id: 'rZ7HnEZ17qSp7', name: 'Warehouse Live' },
    ],
  },
  'boston': {
    stateCode: 'MA',
    venues: [
      { id: 'KovZ917AxdQ', name: 'Big Night Live' },
      { id: 'KovZ917ASgb', name: 'Roadrunner' },
      { id: 'KovZpZAFknIA', name: 'Royale Boston' },
      { id: 'KovZpZA11JtA', name: 'Paradise Rock Club' },
      { id: 'rZ7HnEZ17og0P', name: 'Brighton Music Hall' },
      { id: 'KovZ917AJxJ', name: 'The Grand' },
    ],
  },
  'philadelphia': {
    stateCode: 'PA',
    venues: [
      { id: 'KovZpa2y8e', name: 'Franklin Music Hall' },
      { id: 'KovZ917AxnI', name: 'NOTO' },
      { id: 'KovZpZAEkteA', name: 'The Fillmore Philadelphia' },
      { id: 'KovZ917Ahen', name: 'CODA' },
      { id: 'KovZpZAF7eJA', name: 'Underground Arts' },
    ],
  },
  'minneapolis': {
    stateCode: 'MN',
    venues: [
      { id: 'KovZpZAF7ItA', name: 'First Avenue' },
      { id: 'KovZpZAdJEJA', name: 'Skyway Theatre' },
      { id: 'KovZ917AQC0', name: 'Armory' },
      { id: 'KovZpZAF7IdA', name: 'Fine Line' },
      { id: 'Z7r9jZad2I', name: 'REV Ultra Lounge' },
    ],
  },
  'nashville': {
    stateCode: 'TN',
    venues: [
      { id: 'KovZ917APep', name: 'Brooklyn Bowl Nashville' },
      { id: 'KovZ917ACl7', name: 'The Basement East' },
      { id: 'KovZpZAJnJlA', name: 'Marathon Music Works' },
      { id: 'KovZpZAFaFnA', name: 'Exit/In' },
    ],
  },
  'portland': {
    stateCode: 'OR',
    venues: [
      { id: 'Z7r9jZad7E', name: '45 East' },
      { id: 'KovZpZAaIIaA', name: 'Holocene' },
      { id: 'KovZpZAEkdIA', name: 'Revolution Hall' },
      { id: 'KovZpap9re', name: 'Roseland Theater' },
      { id: 'KovZpZAIvlnA', name: 'Star Theater' },
      { id: 'KovZpZA1k1EA', name: 'Doug Fir Lounge' },
    ],
  },
  'san diego': {
    stateCode: 'CA',
    venues: [
      { id: 'KovZpZA1teEA', name: 'SOMA' },
      { id: 'KovZ917AfM7', name: 'The Music Box' },
      { id: 'KovZ917AxAB', name: 'Observatory North Park' },
      { id: 'KovZpZAEAltA', name: 'House of Blues San Diego' },
    ],
  },
  'phoenix': {
    stateCode: 'AZ',
    venues: [
      { id: 'Z7r9jZad9r', name: 'Shady Park' },
      { id: 'Z7r9jZa7TF', name: 'Walter WhereHouse' },
      { id: 'Z7r9jZa7Qp', name: 'Sunbar' },
      { id: 'KovZ917A887', name: 'The Van Buren' },
      { id: 'KovZpZA1kt1A', name: 'Crescent Ballroom' },
      { id: 'KovZ917ApoV', name: 'Rawhide Event Center' },
    ],
  },
};

// Match user's city to a venue list
export function getVenuesForCity(city) {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();

  // Direct match
  if (VENUE_DATA[normalized]) return VENUE_DATA[normalized].venues;

  // Partial match (handles "New York City", "Brooklyn", "NYC", etc.)
  for (const [key, data] of Object.entries(VENUE_DATA)) {
    if (normalized.includes(key) || key.includes(normalized)) return data.venues;
  }

  // Common aliases
  const aliases = {
    'nyc': 'new york', 'brooklyn': 'new york', 'manhattan': 'new york',
    'la': 'los angeles', 'hollywood': 'los angeles',
    'sf': 'san francisco', 'oakland': 'san francisco',
    'vegas': 'las vegas', 'lv': 'las vegas',
    'chi': 'chicago',
    'sea': 'seattle',
    'atx': 'austin',
    'dc': 'washington dc', 'washington': 'washington dc',
    'atl': 'atlanta',
    'dfw': 'dallas', 'fort worth': 'dallas',
    'htx': 'houston',
    'philly': 'philadelphia',
    'mpls': 'minneapolis', 'twin cities': 'minneapolis',
    'pdx': 'portland',
    'tempe': 'phoenix', 'scottsdale': 'phoenix',
  };

  if (aliases[normalized] && VENUE_DATA[aliases[normalized]]) {
    return VENUE_DATA[aliases[normalized]].venues;
  }

  return null;
}

// Get list of supported cities for display
export function getSupportedCities() {
  return Object.keys(VENUE_DATA).map(city =>
    city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
}

export default VENUE_DATA;
