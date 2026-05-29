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

// Comprehensive country name → phone code lookup (NANP territories share '1')
export const COUNTRY_CODE_MAP = {
  'afghanistan': '93', 'albania': '355', 'algeria': '213',
  'american samoa': '1', 'andorra': '376', 'angola': '244',
  'anguilla': '1', 'antarctica': '672', 'antigua and barbuda': '1',
  'argentina': '54', 'armenia': '374', 'aruba': '297',
  'australia': '61', 'austria': '43', 'azerbaijan': '994',
  'bahamas': '1', 'bahrain': '973', 'bangladesh': '880',
  'barbados': '1', 'belarus': '375', 'belgium': '32',
  'belize': '501', 'benin': '229', 'bermuda': '1',
  'bhutan': '975', 'bolivia': '591', 'bosnia and herzegovina': '387',
  'botswana': '267', 'brazil': '55', 'british indian ocean territory': '246',
  'british virgin islands': '1', 'brunei': '673', 'bulgaria': '359',
  'burkina faso': '226', 'burundi': '257', 'cambodia': '855',
  'cameroon': '237', 'canada': '1', 'cape verde': '238',
  'cayman islands': '1', 'central african republic': '236', 'chad': '235',
  'chile': '56', 'china': '86', 'christmas island': '61',
  'cocos islands': '61', 'colombia': '57', 'comoros': '269',
  'cook islands': '682', 'costa rica': '506', 'croatia': '385',
  'cuba': '53', 'curacao': '599', 'cyprus': '357',
  'czech republic': '420', 'czechia': '420',
  'democratic republic of the congo': '243', 'denmark': '45',
  'djibouti': '253', 'dominica': '1', 'dominican republic': '1',
  'east timor': '670', 'ecuador': '593', 'egypt': '20',
  'el salvador': '503', 'equatorial guinea': '240', 'eritrea': '291',
  'estonia': '372', 'ethiopia': '251', 'falkland islands': '500',
  'faroe islands': '298', 'fiji': '679', 'finland': '358',
  'france': '33', 'french polynesia': '689', 'gabon': '241',
  'gambia': '220', 'georgia': '995', 'germany': '49',
  'ghana': '233', 'gibraltar': '350', 'greece': '30',
  'greenland': '299', 'grenada': '1', 'guam': '1',
  'guatemala': '502', 'guernsey': '44', 'guinea': '224',
  'guinea-bissau': '245', 'guyana': '592', 'haiti': '509',
  'honduras': '504', 'hong kong': '852', 'hungary': '36',
  'iceland': '354', 'india': '91', 'indonesia': '62',
  'iran': '98', 'iraq': '964', 'ireland': '353',
  'isle of man': '44', 'israel': '972', 'italy': '39',
  'ivory coast': '225', "cote d'ivoire": '225',
  'jamaica': '1', 'japan': '81', 'jersey': '44',
  'jordan': '962', 'kazakhstan': '7', 'kenya': '254',
  'kiribati': '686', 'kosovo': '383', 'kuwait': '965',
  'kyrgyzstan': '996', 'laos': '856', 'latvia': '371',
  'lebanon': '961', 'lesotho': '266', 'liberia': '231',
  'libya': '218', 'liechtenstein': '423', 'lithuania': '370',
  'luxembourg': '352', 'macau': '853', 'macedonia': '389',
  'north macedonia': '389', 'madagascar': '261', 'malawi': '265',
  'malaysia': '60', 'maldives': '960', 'mali': '223',
  'malta': '356', 'marshall islands': '692', 'mauritania': '222',
  'mauritius': '230', 'mayotte': '262', 'mexico': '52',
  'micronesia': '691', 'moldova': '373', 'monaco': '377',
  'mongolia': '976', 'montenegro': '382', 'montserrat': '1',
  'morocco': '212', 'mozambique': '258', 'myanmar': '95',
  'burma': '95', 'namibia': '264', 'nauru': '674',
  'nepal': '977', 'netherlands': '31', 'netherlands antilles': '599',
  'new caledonia': '687', 'new zealand': '64', 'nicaragua': '505',
  'niger': '227', 'nigeria': '234', 'niue': '683',
  'north korea': '850', 'northern mariana islands': '1',
  'norway': '47', 'oman': '968', 'pakistan': '92',
  'palau': '680', 'palestine': '970', 'panama': '507',
  'papua new guinea': '675', 'paraguay': '595', 'peru': '51',
  'philippines': '63', 'poland': '48', 'portugal': '351',
  'puerto rico': '1', 'qatar': '974', 'republic of the congo': '242',
  'reunion': '262', 'romania': '40', 'russia': '7',
  'rwanda': '250', 'saint barthelemy': '590', 'saint helena': '290',
  'saint kitts and nevis': '1', 'saint lucia': '1',
  'saint martin': '590', 'saint pierre and miquelon': '508',
  'saint vincent and the grenadines': '1', 'samoa': '685',
  'san marino': '378', 'sao tome and principe': '239',
  'saudi arabia': '966', 'senegal': '221', 'serbia': '381',
  'seychelles': '248', 'sierra leone': '232', 'singapore': '65',
  'sint maarten': '1', 'slovakia': '421', 'slovenia': '386',
  'solomon islands': '677', 'somalia': '252', 'south africa': '27',
  'south korea': '82', 'korea': '82', 'south sudan': '211',
  'spain': '34', 'sri lanka': '94', 'sudan': '249',
  'suriname': '597', 'svalbard and jan mayen': '47', 'swaziland': '268',
  'eswatini': '268', 'sweden': '46', 'switzerland': '41',
  'syria': '963', 'taiwan': '886', 'tajikistan': '992',
  'tanzania': '255', 'thailand': '66', 'togo': '228',
  'tokelau': '690', 'tonga': '676', 'trinidad and tobago': '1',
  'tunisia': '216', 'turkey': '90', 'turkmenistan': '993',
  'turks and caicos islands': '1', 'tuvalu': '688',
  'u.s. virgin islands': '1', 'us virgin islands': '1',
  'uganda': '256', 'ukraine': '380', 'united arab emirates': '971',
  'uae': '971', 'united kingdom': '44', 'uk': '44',
  'england': '44', 'scotland': '44', 'wales': '44',
  'united states': '1', 'usa': '1', 'us': '1',
  'uruguay': '598', 'uzbekistan': '998', 'vanuatu': '678',
  'vatican': '379', 'venezuela': '58', 'vietnam': '84',
  'wallis and futuna': '681', 'western sahara': '212',
  'yemen': '967', 'zambia': '260', 'zimbabwe': '263',
};

/**
 * Detect the phone country code from a location string.
 * Checks COUNTRIES cities/names first, then the full COUNTRY_CODE_MAP.
 * Returns null if nothing matches (caller should fall back to config.countryCode).
 */
export function getCountryCodeForLocation(location) {
  const loc = location.toLowerCase().trim();

  // 1. Match against COUNTRIES entries (name + cities) — most specific
  for (const c of COUNTRIES) {
    if (loc === c.name.toLowerCase()) return c.code;
    for (const city of c.cities) {
      if (loc === city.toLowerCase()) return c.code;
    }
  }

  // 2. Substring match against COUNTRIES names
  for (const c of COUNTRIES) {
    if (loc.includes(c.name.toLowerCase())) return c.code;
  }

  // 3. Full COUNTRY_CODE_MAP lookup (longest match wins to avoid 'guinea' shadowing 'guinea-bissau')
  let best = null;
  let bestLen = 0;
  for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (loc.includes(name) && name.length > bestLen) {
      best = code;
      bestLen = name.length;
    }
  }
  return best;
}
