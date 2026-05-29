// Countries with timezone, cities, keywords, and phone country code
export const COUNTRIES = [
  // ── Europe ──────────────────────────────────────────────────────
  {
    name: 'Romania', flag: '🇷🇴', timezone: 'Europe/Bucharest', code: '40',
    cities: ['București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Constanța', 'Craiova', 'Galați'],
    keywords: ['restaurante', 'salon coafura', 'dentist', 'cafenea', 'florarie', 'pizzerie', 'patiserie'],
  },
  {
    name: 'UK', flag: '🇬🇧', timezone: 'Europe/London', code: '44',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'cafe', 'florist', 'gym', 'barber', 'takeaway'],
  },
  {
    name: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', code: '49',
    cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dusseldorf', 'Leipzig'],
    keywords: ['restaurant', 'friseur', 'zahnarzt', 'cafe', 'blumenladen', 'bäckerei', 'fitnessstudio'],
  },
  {
    name: 'France', flag: '🇫🇷', timezone: 'Europe/Paris', code: '33',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Strasbourg'],
    keywords: ['restaurant', 'coiffeur', 'dentiste', 'cafe', 'fleuriste', 'boulangerie', 'salle de sport'],
  },
  {
    name: 'Spain', flag: '🇪🇸', timezone: 'Europe/Madrid', code: '34',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Bilbao', 'Alicante'],
    keywords: ['restaurante', 'peluqueria', 'dentista', 'cafeteria', 'floristeria', 'panaderia', 'gimnasio'],
  },
  {
    name: 'Italy', flag: '🇮🇹', timezone: 'Europe/Rome', code: '39',
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Bologna', 'Venice', 'Palermo'],
    keywords: ['ristorante', 'parrucchiere', 'dentista', 'bar', 'fioraio', 'pizzeria', 'pasticceria'],
  },
  {
    name: 'Netherlands', flag: '🇳🇱', timezone: 'Europe/Amsterdam', code: '31',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg'],
    keywords: ['restaurant', 'kapper', 'tandarts', 'cafe', 'bloemist', 'bakkerij', 'sportschool'],
  },
  {
    name: 'Poland', flag: '🇵🇱', timezone: 'Europe/Warsaw', code: '48',
    cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Katowice'],
    keywords: ['restauracja', 'fryzjer', 'dentysta', 'kawiarnia', 'kwiaciarnia', 'piekarnia', 'siłownia'],
  },
  {
    name: 'Portugal', flag: '🇵🇹', timezone: 'Europe/Lisbon', code: '351',
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Setúbal', 'Aveiro'],
    keywords: ['restaurante', 'cabeleireiro', 'dentista', 'cafe', 'florist', 'padaria', 'ginasio'],
  },
  {
    name: 'Greece', flag: '🇬🇷', timezone: 'Europe/Athens', code: '30',
    cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Rhodes', 'Corfu'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'cafe', 'florist', 'bakery', 'gym'],
  },
  // ── Americas ─────────────────────────────────────────────────────
  {
    name: 'USA East', flag: '🇺🇸', timezone: 'America/New_York', code: '1',
    cities: ['New York', 'Miami', 'Atlanta', 'Boston', 'Philadelphia', 'Charlotte', 'Orlando', 'Tampa'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'coffee shop', 'florist', 'gym', 'bakery', 'barbershop'],
  },
  {
    name: 'USA West', flag: '🇺🇸', timezone: 'America/Los_Angeles', code: '1',
    cities: ['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'San Diego', 'Las Vegas', 'Phoenix'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'coffee shop', 'florist', 'gym', 'bakery', 'barbershop'],
  },
  {
    name: 'Brazil', flag: '🇧🇷', timezone: 'America/Sao_Paulo', code: '55',
    cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Fortaleza', 'Salvador'],
    keywords: ['restaurante', 'salão de beleza', 'dentista', 'cafeteria', 'floricultura', 'padaria', 'academia'],
  },
  {
    name: 'Mexico', flag: '🇲🇽', timezone: 'America/Mexico_City', code: '52',
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún', 'Mérida'],
    keywords: ['restaurante', 'peluqueria', 'dentista', 'cafeteria', 'floristeria', 'panaderia', 'gimnasio'],
  },
  {
    name: 'Colombia', flag: '🇨🇴', timezone: 'America/Bogota', code: '57',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira'],
    keywords: ['restaurante', 'peluqueria', 'dentista', 'cafeteria', 'floristeria', 'panaderia', 'gimnasio'],
  },
  // ── Asia / Pacific ───────────────────────────────────────────────
  {
    name: 'UAE', flag: '🇦🇪', timezone: 'Asia/Dubai', code: '971',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'cafe', 'florist', 'gym', 'bakery'],
  },
  {
    name: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata', code: '91',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur'],
    keywords: ['restaurant', 'beauty salon', 'dentist', 'cafe', 'florist', 'bakery', 'gym'],
  },
  {
    name: 'Australia', flag: '🇦🇺', timezone: 'Australia/Sydney', code: '61',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra'],
    keywords: ['restaurant', 'hair salon', 'dentist', 'cafe', 'florist', 'gym', 'bakery', 'barbershop'],
  },
];

function getLocalHour(timezone) {
  return parseInt(
    new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  );
}

function getLocalTime(timezone) {
  return new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

// Returns hours until 10am in that timezone (negative = already past)
function hoursUntilOpen(timezone) {
  const hour = getLocalHour(timezone);
  if (hour < 10) return 10 - hour;
  if (hour >= 16) return 24 - hour + 10;
  return 0; // already open
}

export function getOpenCountries() {
  return COUNTRIES.filter(c => {
    const h = getLocalHour(c.timezone);
    return h >= 10 && h < 16;
  });
}

export function getCountriesWithTime() {
  return COUNTRIES.map(c => ({
    ...c,
    localTime: getLocalTime(c.timezone),
    localHour: getLocalHour(c.timezone),
    isOpen: (() => { const h = getLocalHour(c.timezone); return h >= 10 && h < 16; })(),
    hoursUntilOpen: hoursUntilOpen(c.timezone),
  })).sort((a, b) => {
    if (a.isOpen && !b.isOpen) return -1;
    if (!a.isOpen && b.isOpen) return 1;
    if (!a.isOpen && !b.isOpen) return a.hoursUntilOpen - b.hoursUntilOpen;
    return 0;
  });
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
