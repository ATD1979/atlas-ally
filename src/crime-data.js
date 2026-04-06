// Global Crime Index data — Numbeo 2024
// crime_index: 0-100 (higher = more crime)
// safety_index: 0-100 (higher = safer)

const CRIME_DATA = [
  // JO - Jordan
  { country_code:'JO', city:'Amman',    lat:31.9539, lng:35.9106, crime_index:36.2, safety_index:63.8 },
  { country_code:'JO', city:'Zarqa',    lat:32.0728, lng:36.0877, crime_index:42.1, safety_index:57.9 },
  { country_code:'JO', city:'Irbid',    lat:32.5556, lng:35.8500, crime_index:30.5, safety_index:69.5 },
  // UA - Ukraine
  { country_code:'UA', city:'Kyiv',     lat:50.4501, lng:30.5234, crime_index:48.3, safety_index:51.7 },
  { country_code:'UA', city:'Kharkiv',  lat:49.9935, lng:36.2304, crime_index:52.1, safety_index:47.9 },
  { country_code:'UA', city:'Odesa',    lat:46.4825, lng:30.7233, crime_index:55.4, safety_index:44.6 },
  // LB - Lebanon
  { country_code:'LB', city:'Beirut',   lat:33.8938, lng:35.5018, crime_index:51.2, safety_index:48.8 },
  { country_code:'LB', city:'Tripoli',  lat:34.4367, lng:35.8497, crime_index:58.3, safety_index:41.7 },
  // EG - Egypt
  { country_code:'EG', city:'Cairo',    lat:30.0444, lng:31.2357, crime_index:52.8, safety_index:47.2 },
  { country_code:'EG', city:'Alexandria',lat:31.2001,lng:29.9187, crime_index:48.6, safety_index:51.4 },
  { country_code:'EG', city:'Giza',     lat:30.0131, lng:31.2089, crime_index:54.1, safety_index:45.9 },
  // MX - Mexico
  { country_code:'MX', city:'Mexico City',lat:19.4326,lng:-99.1332,crime_index:70.4,safety_index:29.6 },
  { country_code:'MX', city:'Guadalajara',lat:20.6597,lng:-103.3496,crime_index:65.2,safety_index:34.8 },
  { country_code:'MX', city:'Tijuana',  lat:32.5149, lng:-117.0382,crime_index:82.3,safety_index:17.7 },
  { country_code:'MX', city:'Monterrey',lat:25.6866, lng:-100.3161,crime_index:63.1,safety_index:36.9 },
  // PK - Pakistan
  { country_code:'PK', city:'Karachi',  lat:24.8607, lng:67.0011, crime_index:64.2, safety_index:35.8 },
  { country_code:'PK', city:'Lahore',   lat:31.5204, lng:74.3587, crime_index:57.8, safety_index:42.2 },
  { country_code:'PK', city:'Islamabad',lat:33.6844, lng:73.0479, crime_index:44.3, safety_index:55.7 },
  // TH - Thailand
  { country_code:'TH', city:'Bangkok',  lat:13.7563, lng:100.5018,crime_index:43.6, safety_index:56.4 },
  { country_code:'TH', city:'Pattaya',  lat:12.9236, lng:100.8825,crime_index:51.2, safety_index:48.8 },
  { country_code:'TH', city:'Chiang Mai',lat:18.7883,lng:98.9853, crime_index:37.8, safety_index:62.2 },
  // FR - France
  { country_code:'FR', city:'Paris',    lat:48.8566, lng:2.3522,  crime_index:52.1, safety_index:47.9 },
  { country_code:'FR', city:'Marseille',lat:43.2965, lng:5.3698,  crime_index:64.3, safety_index:35.7 },
  { country_code:'FR', city:'Lyon',     lat:45.7640, lng:4.8357,  crime_index:47.2, safety_index:52.8 },
  // JP - Japan
  { country_code:'JP', city:'Tokyo',    lat:35.6762, lng:139.6503,crime_index:22.4, safety_index:77.6 },
  { country_code:'JP', city:'Osaka',    lat:34.6937, lng:135.5023,crime_index:24.1, safety_index:75.9 },
  // ZA - South Africa
  { country_code:'ZA', city:'Johannesburg',lat:-26.2041,lng:28.0473,crime_index:77.8,safety_index:22.2 },
  { country_code:'ZA', city:'Cape Town',lat:-33.9249,lng:18.4241, crime_index:72.4, safety_index:27.6 },
  { country_code:'ZA', city:'Durban',   lat:-29.8587,lng:31.0218, crime_index:74.1, safety_index:25.9 },
  // IL - Israel
  { country_code:'IL', city:'Tel Aviv', lat:32.0853, lng:34.7818, crime_index:37.4, safety_index:62.6 },
  { country_code:'IL', city:'Jerusalem',lat:31.7683, lng:35.2137, crime_index:42.8, safety_index:57.2 },
  // IQ - Iraq
  { country_code:'IQ', city:'Baghdad',  lat:33.3152, lng:44.3661, crime_index:65.4, safety_index:34.6 },
  { country_code:'IQ', city:'Basra',    lat:30.5085, lng:47.7804, crime_index:62.1, safety_index:37.9 },
  // CO - Colombia
  { country_code:'CO', city:'Bogota',   lat:4.7110,  lng:-74.0721,crime_index:67.3, safety_index:32.7 },
  { country_code:'CO', city:'Medellin', lat:6.2442,  lng:-75.5812,crime_index:62.8, safety_index:37.2 },
  { country_code:'CO', city:'Cali',     lat:3.4516,  lng:-76.5320,crime_index:71.2, safety_index:28.8 },
  // NG - Nigeria
  { country_code:'NG', city:'Lagos',    lat:6.5244,  lng:3.3792,  crime_index:70.1, safety_index:29.9 },
  { country_code:'NG', city:'Abuja',    lat:9.0765,  lng:7.3986,  crime_index:58.3, safety_index:41.7 },
  // IN - India
  { country_code:'IN', city:'Mumbai',   lat:19.0760, lng:72.8777, crime_index:46.3, safety_index:53.7 },
  { country_code:'IN', city:'Delhi',    lat:28.7041, lng:77.1025, crime_index:52.7, safety_index:47.3 },
  { country_code:'IN', city:'Bangalore',lat:12.9716, lng:77.5946, crime_index:41.8, safety_index:58.2 },
  // BR - Brazil
  { country_code:'BR', city:'São Paulo',lat:-23.5505,lng:-46.6333,crime_index:67.8, safety_index:32.2 },
  { country_code:'BR', city:'Rio de Janeiro',lat:-22.9068,lng:-43.1729,crime_index:73.4,safety_index:26.6 },
  { country_code:'BR', city:'Fortaleza',lat:-3.7172, lng:-38.5433,crime_index:74.2, safety_index:25.8 },
  // KE - Kenya
  { country_code:'KE', city:'Nairobi',  lat:-1.2921, lng:36.8219, crime_index:62.4, safety_index:37.6 },
  { country_code:'KE', city:'Mombasa',  lat:-4.0435, lng:39.6682, crime_index:57.8, safety_index:42.2 },
  // PH - Philippines
  { country_code:'PH', city:'Manila',   lat:14.5995, lng:120.9842,crime_index:56.3, safety_index:43.7 },
  { country_code:'PH', city:'Cebu',     lat:10.3157, lng:123.8854,crime_index:48.2, safety_index:51.8 },
  // TR - Turkey
  { country_code:'TR', city:'Istanbul', lat:41.0082, lng:28.9784, crime_index:44.7, safety_index:55.3 },
  { country_code:'TR', city:'Ankara',   lat:39.9334, lng:32.8597, crime_index:39.2, safety_index:60.8 },
  { country_code:'TR', city:'Izmir',    lat:38.4192, lng:27.1287, crime_index:37.8, safety_index:62.2 },
  // MA - Morocco
  { country_code:'MA', city:'Casablanca',lat:33.5731,lng:-7.5898, crime_index:52.3, safety_index:47.7 },
  { country_code:'MA', city:'Marrakech',lat:31.6295, lng:-7.9811, crime_index:46.8, safety_index:53.2 },
  { country_code:'MA', city:'Rabat',    lat:33.9716, lng:-6.8498, crime_index:41.2, safety_index:58.8 },
];

module.exports = { CRIME_DATA };
