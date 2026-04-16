// Atlas Ally — Static City Geocoder
// v2026.04.15 — clean slate
// Extracts location names from article text and returns coordinates.
// No paid API needed — uses a static city → lat/lng lookup per country.

const CITY_COORDS = {
  // Jordan
  JO: {
    'amman':     { lat: 31.956, lng: 35.945 },
    'zarqa':     { lat: 32.072, lng: 36.088 },
    'irbid':     { lat: 32.555, lng: 35.850 },
    'aqaba':     { lat: 29.532, lng: 35.006 },
    'madaba':    { lat: 31.716, lng: 35.793 },
    'mafraq':    { lat: 32.343, lng: 36.207 },
    'salt':      { lat: 32.039, lng: 35.728 },
    'karak':     { lat: 31.183, lng: 35.704 },
    'tafilah':   { lat: 30.834, lng: 35.604 },
    'ma\'an':    { lat: 30.193, lng: 35.734 },
    'maan':      { lat: 30.193, lng: 35.734 },
    'ajloun':    { lat: 32.333, lng: 35.750 },
    'jarash':    { lat: 32.274, lng: 35.900 },
    'jerash':    { lat: 32.274, lng: 35.900 },
    'petra':     { lat: 30.329, lng: 35.444 },
    'wadi rum':  { lat: 29.575, lng: 35.420 },
    'dead sea':  { lat: 31.560, lng: 35.473 },
    'jordan valley': { lat: 32.050, lng: 35.550 },
    'allenby':   { lat: 31.886, lng: 35.547 },
    'king hussein bridge': { lat: 31.886, lng: 35.547 },
  },

  // Ukraine
  UA: {
    'kyiv':      { lat: 50.450, lng: 30.523 },
    'kiev':      { lat: 50.450, lng: 30.523 },
    'kharkiv':   { lat: 49.993, lng: 36.230 },
    'odessa':    { lat: 46.482, lng: 30.723 },
    'odesa':     { lat: 46.482, lng: 30.723 },
    'lviv':      { lat: 49.839, lng: 24.029 },
    'dnipro':    { lat: 48.464, lng: 35.046 },
    'donetsk':   { lat: 48.015, lng: 37.802 },
    'zaporizhzhia': { lat: 47.838, lng: 35.139 },
    'zaporizhia': { lat: 47.838, lng: 35.139 },
    'mariupol':  { lat: 47.095, lng: 37.541 },
    'mykolaiv':  { lat: 46.975, lng: 31.994 },
    'kherson':   { lat: 46.636, lng: 32.617 },
    'chernihiv': { lat: 51.482, lng: 31.290 },
    'sumy':      { lat: 50.908, lng: 34.798 },
    'poltava':   { lat: 49.588, lng: 34.552 },
    'vinnytsia': { lat: 49.233, lng: 28.468 },
    'zhytomyr':  { lat: 50.254, lng: 28.659 },
    'khmelnytskyi': { lat: 49.422, lng: 26.987 },
    'bakhmut':   { lat: 48.598, lng: 37.999 },
    'avdiivka':  { lat: 48.135, lng: 37.757 },
  },

  // Lebanon
  LB: {
    'beirut':    { lat: 33.889, lng: 35.495 },
    'tripoli':   { lat: 34.436, lng: 35.850 },
    'sidon':     { lat: 33.563, lng: 35.370 },
    'saida':     { lat: 33.563, lng: 35.370 },
    'tyre':      { lat: 33.270, lng: 35.203 },
    'sour':      { lat: 33.270, lng: 35.203 },
    'nabatieh':  { lat: 33.377, lng: 35.484 },
    'zahle':     { lat: 33.850, lng: 35.902 },
    'baalbek':   { lat: 34.004, lng: 36.212 },
    'jounieh':   { lat: 33.981, lng: 35.617 },
    'south lebanon': { lat: 33.270, lng: 35.400 },
    'bekaa':     { lat: 33.850, lng: 35.900 },
    'beka\'a':   { lat: 33.850, lng: 35.900 },
  },

  // Egypt
  EG: {
    'cairo':     { lat: 30.044, lng: 31.236 },
    'alexandria': { lat: 31.200, lng: 29.918 },
    'giza':      { lat: 30.013, lng: 31.208 },
    'sharm el-sheikh': { lat: 27.912, lng: 34.330 },
    'hurghada':  { lat: 27.257, lng: 33.812 },
    'luxor':     { lat: 25.687, lng: 32.639 },
    'aswan':     { lat: 24.088, lng: 32.900 },
    'suez':      { lat: 29.974, lng: 32.527 },
    'sinai':     { lat: 29.500, lng: 34.000 },
    'north sinai': { lat: 30.500, lng: 33.800 },
    'rafah':     { lat: 31.277, lng: 34.252 },
    'ismailia':  { lat: 30.596, lng: 32.272 },
    'port said': { lat: 31.256, lng: 32.284 },
    'mansoura':  { lat: 31.037, lng: 31.381 },
  },

  // Israel
  IL: {
    'tel aviv':  { lat: 32.085, lng: 34.781 },
    'jerusalem': { lat: 31.769, lng: 35.216 },
    'haifa':     { lat: 32.794, lng: 34.989 },
    'beer sheva': { lat: 31.252, lng: 34.791 },
    'netanya':   { lat: 32.332, lng: 34.860 },
    'ashdod':    { lat: 31.804, lng: 34.649 },
    'ashkelon':  { lat: 31.669, lng: 34.571 },
    'sderot':    { lat: 31.524, lng: 34.597 },
    'gaza':      { lat: 31.505, lng: 34.467 },
    'west bank': { lat: 31.952, lng: 35.300 },
    'ramallah':  { lat: 31.898, lng: 35.206 },
    'nablus':    { lat: 32.222, lng: 35.255 },
    'jenin':     { lat: 32.464, lng: 35.297 },
    'hebron':    { lat: 31.530, lng: 35.095 },
    'northern israel': { lat: 32.900, lng: 35.300 },
    'eilat':     { lat: 29.558, lng: 34.952 },
    'golan':     { lat: 33.050, lng: 35.800 },
  },

  // Iraq
  IQ: {
    'baghdad':   { lat: 33.341, lng: 44.401 },
    'basra':     { lat: 30.508, lng: 47.783 },
    'mosul':     { lat: 36.340, lng: 43.130 },
    'erbil':     { lat: 36.191, lng: 44.009 },
    'sulaymaniyah': { lat: 35.557, lng: 45.435 },
    'najaf':     { lat: 31.997, lng: 44.336 },
    'karbala':   { lat: 32.616, lng: 44.024 },
    'kirkuk':    { lat: 35.468, lng: 44.392 },
    'fallujah':  { lat: 33.354, lng: 43.785 },
    'ramadi':    { lat: 33.426, lng: 43.301 },
    'tikrit':    { lat: 34.596, lng: 43.688 },
    'kurdistan': { lat: 36.500, lng: 44.000 },
  },

  // Syria
  SY: {
    'damascus':  { lat: 33.510, lng: 36.291 },
    'aleppo':    { lat: 36.202, lng: 37.161 },
    'homs':      { lat: 34.730, lng: 36.710 },
    'latakia':   { lat: 35.532, lng: 35.792 },
    'deir ez-zor': { lat: 35.336, lng: 40.141 },
    'raqqa':     { lat: 35.952, lng: 39.005 },
    'idlib':     { lat: 35.931, lng: 36.634 },
    'daraa':     { lat: 32.615, lng: 36.101 },
    'hasakah':   { lat: 36.483, lng: 40.749 },
    'tartus':    { lat: 34.891, lng: 35.887 },
  },

  // Pakistan
  PK: {
    'karachi':   { lat: 24.861, lng: 67.011 },
    'lahore':    { lat: 31.558, lng: 74.351 },
    'islamabad': { lat: 33.729, lng: 73.093 },
    'rawalpindi': { lat: 33.597, lng: 73.042 },
    'peshawar':  { lat: 34.015, lng: 71.580 },
    'quetta':    { lat: 30.183, lng: 66.996 },
    'multan':    { lat: 30.196, lng: 71.474 },
    'faisalabad': { lat: 31.418, lng: 73.078 },
    'khyber':    { lat: 34.100, lng: 71.083 },
    'balochistan': { lat: 28.000, lng: 65.000 },
    'waziristan': { lat: 32.300, lng: 69.800 },
    'swat':      { lat: 35.222, lng: 72.422 },
  },

  // Mexico
  MX: {
    'mexico city': { lat: 19.432, lng: -99.133 },
    'guadalajara': { lat: 20.659, lng: -103.350 },
    'monterrey': { lat: 25.686, lng: -100.316 },
    'tijuana':   { lat: 32.514, lng: -117.038 },
    'cancun':    { lat: 21.161, lng: -86.851 },
    'acapulco':  { lat: 16.853, lng: -99.823 },
    'culiacan':  { lat: 24.799, lng: -107.394 },
    'sinaloa':   { lat: 25.000, lng: -108.000 },
    'jalisco':   { lat: 20.659, lng: -103.350 },
    'juarez':    { lat: 31.738, lng: -106.487 },
    'ciudad juarez': { lat: 31.738, lng: -106.487 },
    'michoacan': { lat: 19.566, lng: -101.707 },
    'guerrero':  { lat: 17.550, lng: -99.500 },
    'veracruz':  { lat: 19.173, lng: -96.134 },
    'oaxaca':    { lat: 17.073, lng: -96.727 },
  },

  // Colombia
  CO: {
    'bogota':    { lat: 4.711, lng: -74.072 },
    'medellin':  { lat: 6.251, lng: -75.564 },
    'cali':      { lat: 3.451, lng: -76.532 },
    'cartagena': { lat: 10.391, lng: -75.479 },
    'barranquilla': { lat: 10.963, lng: -74.796 },
    'bucaramanga': { lat: 7.130, lng: -73.126 },
    'cucuta':    { lat: 7.893, lng: -72.507 },
    'caqueta':   { lat: 1.000, lng: -74.000 },
    'arauca':    { lat: 7.083, lng: -70.767 },
    'putumayo':  { lat: 0.500, lng: -76.000 },
  },

  // Nigeria
  NG: {
    'lagos':     { lat: 6.524, lng: 3.379 },
    'abuja':     { lat: 9.058, lng: 7.499 },
    'kano':      { lat: 12.000, lng: 8.517 },
    'ibadan':    { lat: 7.388, lng: 3.900 },
    'port harcourt': { lat: 4.777, lng: 7.013 },
    'maiduguri': { lat: 11.831, lng: 13.151 },
    'kaduna':    { lat: 10.523, lng: 7.441 },
    'jos':       { lat: 9.918, lng: 8.892 },
    'borno':     { lat: 11.831, lng: 13.151 },
    'northeast nigeria': { lat: 11.000, lng: 13.000 },
    'delta':     { lat: 5.700, lng: 5.900 },
    'benue':     { lat: 7.733, lng: 8.522 },
    'zamfara':   { lat: 12.170, lng: 6.657 },
  },

  // India
  IN: {
    'new delhi': { lat: 28.614, lng: 77.209 },
    'delhi':     { lat: 28.614, lng: 77.209 },
    'mumbai':    { lat: 19.076, lng: 72.877 },
    'bangalore': { lat: 12.972, lng: 77.594 },
    'bengaluru': { lat: 12.972, lng: 77.594 },
    'kolkata':   { lat: 22.573, lng: 88.364 },
    'chennai':   { lat: 13.083, lng: 80.270 },
    'hyderabad': { lat: 17.385, lng: 78.487 },
    'manipur':   { lat: 24.660, lng: 93.906 },
    'kashmir':   { lat: 34.083, lng: 74.797 },
    'jammu':     { lat: 32.733, lng: 74.872 },
    'punjab':    { lat: 31.147, lng: 75.341 },
    'assam':     { lat: 26.145, lng: 91.736 },
  },

  // Brazil
  BR: {
    'sao paulo': { lat: -23.549, lng: -46.633 },
    'rio de janeiro': { lat: -22.906, lng: -43.173 },
    'rio':       { lat: -22.906, lng: -43.173 },
    'salvador':  { lat: -12.972, lng: -38.501 },
    'brasilia':  { lat: -15.780, lng: -47.929 },
    'fortaleza': { lat: -3.717, lng: -38.543 },
    'manaus':    { lat: -3.119, lng: -60.022 },
    'recife':    { lat: -8.054, lng: -34.881 },
    'belem':     { lat: -1.456, lng: -48.490 },
    'bahia':     { lat: -12.972, lng: -38.501 },
    'amazonia':  { lat: -3.119, lng: -60.022 },
  },

  // Kenya
  KE: {
    'nairobi':   { lat: -1.286, lng: 36.817 },
    'mombasa':   { lat: -4.043, lng: 39.668 },
    'kisumu':    { lat: -0.102, lng: 34.762 },
    'nakuru':    { lat: -0.303, lng: 36.080 },
    'eldoret':   { lat: 0.520, lng: 35.270 },
    'garissa':   { lat: -0.453, lng: 39.646 },
    'wajir':     { lat: 1.750, lng: 40.067 },
    'turkana':   { lat: 3.118, lng: 35.597 },
    'lamu':      { lat: -2.269, lng: 40.902 },
    'somalia border': { lat: 1.500, lng: 41.000 },
  },

  // Philippines
  PH: {
    'manila':    { lat: 14.599, lng: 120.984 },
    'quezon city': { lat: 14.676, lng: 121.044 },
    'davao':     { lat: 7.073, lng: 125.613 },
    'cebu':      { lat: 10.317, lng: 123.891 },
    'mindanao':  { lat: 7.500, lng: 125.000 },
    'zamboanga': { lat: 6.910, lng: 122.073 },
    'cotabato':  { lat: 7.224, lng: 124.247 },
    'marawi':    { lat: 7.999, lng: 124.289 },
    'sulu':      { lat: 5.974, lng: 121.000 },
    'basilan':   { lat: 6.421, lng: 121.969 },
    'palawan':   { lat: 9.834, lng: 118.736 },
  },

  // Turkey
  TR: {
    'istanbul':  { lat: 41.015, lng: 28.979 },
    'ankara':    { lat: 39.920, lng: 32.854 },
    'izmir':     { lat: 38.424, lng: 27.143 },
    'antalya':   { lat: 36.897, lng: 30.713 },
    'gaziantep': { lat: 37.066, lng: 37.383 },
    'diyarbakir': { lat: 37.910, lng: 40.237 },
    'mersin':    { lat: 36.812, lng: 34.641 },
    'southeast turkey': { lat: 37.500, lng: 40.000 },
    'hatay':     { lat: 36.202, lng: 36.160 },
    'adana':     { lat: 37.000, lng: 35.321 },
    'sanliurfa': { lat: 37.159, lng: 38.796 },
    'kurdish':   { lat: 37.500, lng: 40.000 },
  },

  // South Africa
  ZA: {
    'johannesburg': { lat: -26.204, lng: 28.046 },
    'cape town': { lat: -33.925, lng: 18.424 },
    'durban':    { lat: -29.858, lng: 30.985 },
    'pretoria':  { lat: -25.746, lng: 28.188 },
    'soweto':    { lat: -26.268, lng: 27.859 },
    'sandton':   { lat: -26.108, lng: 28.055 },
    'eastern cape': { lat: -32.297, lng: 26.420 },
    'kwazulu-natal': { lat: -28.500, lng: 30.000 },
    'gauteng':   { lat: -26.204, lng: 28.046 },
    'limpopo':   { lat: -23.500, lng: 29.500 },
  },

  // France
  FR: {
    'paris':     { lat: 48.857, lng: 2.347 },
    'marseille': { lat: 43.296, lng: 5.381 },
    'lyon':      { lat: 45.748, lng: 4.847 },
    'toulouse':  { lat: 43.605, lng: 1.444 },
    'nice':      { lat: 43.710, lng: 7.262 },
    'nantes':    { lat: 47.218, lng: -1.553 },
    'strasbourg': { lat: 48.573, lng: 7.752 },
    'bordeaux':  { lat: 44.837, lng: -0.579 },
    'lille':     { lat: 50.629, lng: 3.057 },
    'rennes':    { lat: 48.117, lng: -1.677 },
  },

  // Japan
  JP: {
    'tokyo':     { lat: 35.689, lng: 139.692 },
    'osaka':     { lat: 34.694, lng: 135.502 },
    'kyoto':     { lat: 35.012, lng: 135.768 },
    'yokohama':  { lat: 35.444, lng: 139.638 },
    'nagoya':    { lat: 35.183, lng: 136.906 },
    'sapporo':   { lat: 43.062, lng: 141.354 },
    'fukuoka':   { lat: 33.590, lng: 130.402 },
    'kobe':      { lat: 34.691, lng: 135.196 },
    'hiroshima': { lat: 34.385, lng: 132.455 },
    'okinawa':   { lat: 26.212, lng: 127.681 },
  },

  // Thailand
  TH: {
    'bangkok':   { lat: 13.754, lng: 100.502 },
    'chiang mai': { lat: 18.788, lng: 98.993 },
    'phuket':    { lat: 7.878, lng: 98.398 },
    'pattaya':   { lat: 12.928, lng: 100.877 },
    'hat yai':   { lat: 7.009, lng: 100.476 },
    'deep south': { lat: 6.500, lng: 101.500 },
    'pattani':   { lat: 6.866, lng: 101.250 },
    'yala':      { lat: 6.541, lng: 101.281 },
    'narathiwat': { lat: 6.426, lng: 101.823 },
    'chiang rai': { lat: 19.910, lng: 99.841 },
  },

  // Morocco
  MA: {
    'casablanca': { lat: 33.573, lng: -7.589 },
    'rabat':     { lat: 33.992, lng: -6.851 },
    'marrakech': { lat: 31.629, lng: -7.981 },
    'fez':       { lat: 34.033, lng: -5.000 },
    'tangier':   { lat: 35.759, lng: -5.834 },
    'agadir':    { lat: 30.427, lng: -9.598 },
    'meknes':    { lat: 33.895, lng: -5.555 },
    'oujda':     { lat: 34.689, lng: -1.912 },
  },
};

// Country center fallbacks
const COUNTRY_CENTERS = {
  JO: { lat: 31.240, lng: 36.510 },
  UA: { lat: 48.380, lng: 31.160 },
  LB: { lat: 33.854, lng: 35.862 },
  EG: { lat: 26.820, lng: 30.802 },
  IL: { lat: 31.046, lng: 34.852 },
  IQ: { lat: 33.223, lng: 43.679 },
  SY: { lat: 34.802, lng: 38.997 },
  PK: { lat: 30.375, lng: 69.345 },
  MX: { lat: 23.634, lng: -102.552 },
  CO: { lat: 4.571, lng: -74.297 },
  NG: { lat: 9.082, lng: 8.675 },
  IN: { lat: 20.594, lng: 78.963 },
  BR: { lat: -14.235, lng: -51.925 },
  KE: { lat: -0.023, lng: 37.906 },
  PH: { lat: 12.880, lng: 121.774 },
  TR: { lat: 38.964, lng: 35.243 },
  ZA: { lat: -30.560, lng: 22.938 },
  FR: { lat: 46.228, lng: 2.214 },
  JP: { lat: 36.205, lng: 138.253 },
  TH: { lat: 15.870, lng: 100.993 },
  MA: { lat: 31.792, lng: -7.086 },
};

/**
 * Extract the best lat/lng for an article given its text and country.
 * Scans for known city/region names and returns their coordinates.
 * Falls back to country center if no city found.
 */
function extractLocation(text, countryCode) {
  const lower = text.toLowerCase();
  const cities = CITY_COORDS[countryCode] || {};

  // Sort city names longest-first to prefer specific matches (e.g. "new delhi" > "delhi")
  const cityNames = Object.keys(cities).sort((a, b) => b.length - a.length);

  for (const name of cityNames) {
    if (lower.includes(name)) {
      return {
        lat:      cities[name].lat,
        lng:      cities[name].lng,
        location: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      };
    }
  }

  // Fall back to country center
  const center = COUNTRY_CENTERS[countryCode];
  return center ? { lat: center.lat, lng: center.lng, location: null } : null;
}

/**
 * Haversine distance in km between two lat/lng points.
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { extractLocation, distanceKm, COUNTRY_CENTERS };
