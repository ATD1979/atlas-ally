// v2026.04.15 — clean slate
const { fetchWithTimeout } = require('./lib/http');
const { COUNTRIES } = require('./countries');
const db = require('./db');

// Open-Meteo is completely free, no API key needed
// WMO weather codes: https://open-meteo.com/en/docs

const SEVERE_CODES = {
  45: { label: 'Fog', severity: 'warn', icon: '🌫️' },
  48: { label: 'Freezing fog', severity: 'warn', icon: '🌫️' },
  51: { label: 'Drizzle', severity: 'info', icon: '🌦️' },
  61: { label: 'Rain', severity: 'info', icon: '🌧️' },
  71: { label: 'Snow', severity: 'warn', icon: '🌨️' },
  77: { label: 'Snow grains', severity: 'warn', icon: '🌨️' },
  80: { label: 'Heavy showers', severity: 'warn', icon: '🌧️' },
  82: { label: 'Violent rain showers', severity: 'danger', icon: '⛈️' },
  85: { label: 'Heavy snow showers', severity: 'danger', icon: '❄️' },
  95: { label: 'Thunderstorm', severity: 'danger', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', severity: 'danger', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', severity: 'danger', icon: '🌩️' },
};

async function getWeatherAlert(lat, lng, cityName, countryCode) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,windspeed_10m,weathercode,precipitation&daily=weathercode,precipitation_sum,windspeed_10m_max,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;

    const res = await fetchWithTimeout(url, {}, 6000);
    if (!res.ok) return null;
    const data = await res.json();

    const current = data.current;
    const daily = data.daily;
    const alerts = [];

    // Check current conditions
    const currentCode = current?.weathercode;
    if (currentCode && SEVERE_CODES[currentCode]) {
      const w = SEVERE_CODES[currentCode];
      alerts.push({
        type: 'weather',
        title: `${w.label} — ${cityName}`,
        description: `Current conditions: ${w.label}. Temperature ${Math.round(current.temperature_2m)}°C, Wind ${Math.round(current.windspeed_10m)} km/h`,
        severity: w.severity,
        icon: w.icon,
        current: true,
      });
    }

    // Check next 3 days for severe weather
    if (daily?.weathercode) {
      daily.weathercode.forEach((code, i) => {
        if (!SEVERE_CODES[code]) return;
        if (SEVERE_CODES[code].severity === 'info') return; // Skip mild
        const w = SEVERE_CODES[code];
        const date = daily.time[i];
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const precip = daily.precipitation_sum[i];
        const wind = Math.round(daily.windspeed_10m_max[i]);

        alerts.push({
          type: 'weather',
          title: `${w.label} forecast — ${cityName}`,
          description: `${date}: ${w.label}. High ${maxTemp}°C / Low ${minTemp}°C, ${precip}mm rain, Wind up to ${wind} km/h`,
          severity: w.severity,
          icon: w.icon,
          forecast_date: date,
          current: false,
        });
      });
    }

    // Extreme heat check (above 42°C)
    if (daily?.temperature_2m_max) {
      daily.temperature_2m_max.forEach((temp, i) => {
        if (temp >= 42) {
          alerts.push({
            type: 'weather',
            title: `Extreme heat warning — ${cityName}`,
            description: `${daily.time[i]}: Temperature forecast to reach ${Math.round(temp)}°C. Avoid outdoor activity, stay hydrated.`,
            severity: 'danger',
            icon: '🌡️',
            forecast_date: daily.time[i],
          });
        }
      });
    }

    return {
      current: {
        temp: Math.round(current?.temperature_2m),
        wind: Math.round(current?.windspeed_10m),
        code: currentCode,
        precip: current?.precipitation,
      },
      alerts,
      source: 'Open-Meteo',
    };
  } catch(e) {
    console.warn(`Weather fetch failed for ${cityName}:`, e.message);
    return null;
  }
}

async function getWeatherForCountry(countryCode) {
  const country = COUNTRIES[countryCode];
  if (!country?.cities?.length) return null;

  // Get weather for capital / first city
  const capital = country.cities[0];
  return await getWeatherAlert(capital.lat, capital.lng, capital.name, countryCode);
}

// Post a weather event to the events table and dispatch alert
async function checkAndPostWeatherAlerts(countryCode) {
  const weather = await getWeatherForCountry(countryCode);
  if (!weather?.alerts?.length) return;

  const dangerous = weather.alerts.filter(a => a.severity === 'danger');
  for (const alert of dangerous) {
    const existing = db.db.prepare(
      `SELECT id FROM events WHERE country_code = ? AND type = 'weather' AND title = ? AND created_at > datetime('now', '-6 hours')`
    ).get(countryCode, alert.title);
    if (existing) continue; // Don't spam duplicate alerts

    db.addEvent.run({
      country_code: countryCode,
      type: 'weather',
      title: alert.title,
      description: alert.description,
      location: COUNTRIES[countryCode]?.cities?.[0]?.name || countryCode,
      lat: COUNTRIES[countryCode]?.cities?.[0]?.lat || null,
      lng: COUNTRIES[countryCode]?.cities?.[0]?.lng || null,
      severity: alert.severity,
      source: 'Open-Meteo',
      source_url: 'https://open-meteo.com',
      submitted_by: 'system',
    });
    console.log(`🌩️ Weather alert posted for ${countryCode}: ${alert.title}`);
  }
}

async function checkAllWeather() {
  console.log('🌤️ Checking weather for all monitored countries...');
  const codes = Object.keys(COUNTRIES);
  for (const code of codes) {
    await checkAndPostWeatherAlerts(code);
    await new Promise(r => setTimeout(r, 500)); // rate limit
  }
  console.log('🌤️ Weather check complete');
}

module.exports = { getWeatherForCountry, getWeatherAlert, checkAllWeather };
