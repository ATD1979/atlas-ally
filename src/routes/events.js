// Atlas Ally — Enhanced Incidents/Events API
// v2026.04.16 — Drug crime + conflict sources + 7-day rolling dashboard

const axios = require('axios');
const { parse } = require('rss-to-json');

// Multiple data sources for comprehensive incident coverage
class IncidentIngestion {
  constructor() {
    this.sources = {
      // High-signal embassy alerts
      embassyFeeds: {
        'JO': ['https://jo.usembassy.gov/feed/'],
        'UA': ['https://ua.usembassy.gov/feed/'],
        'IL': ['https://il.usembassy.gov/feed/'],
        'EG': ['https://eg.usembassy.gov/feed/'],
        'IQ': ['https://iq.usembassy.gov/feed/'],
        'PK': ['https://pk.usembassy.gov/feed/'],
        'AF': ['https://af.usembassy.gov/feed/'],
        'SY': ['https://sy.usembassy.gov/feed/'],
        'MX': ['https://mx.usembassy.gov/feed/'],
        'BR': ['https://br.usembassy.gov/feed/'],
        'CO': ['https://co.usembassy.gov/feed/']
      },

      // Drug trafficking and organized crime feeds
      crimeFeeds: [
        'https://www.insightcrime.org/feed/', // Best for cartel/drug trafficking
        'https://www.unodc.org/rss/en/frontpage.xml', // UN drug & crime reports
        'https://www.osac.gov/rss/events', // US State Dept security alerts
        'https://www.globalinitiative.net/feed/', // Organized crime research
        'https://www.occrp.org/en/feed' // Organized Crime Reporting Project
      ],

      // Conflict and violence sources
      conflictFeeds: [
        'https://reliefweb.int/updates/rss.xml', // UN humanitarian alerts
        'https://www.crisisgroup.org/crisiswatch/rss', // International Crisis Group
        'https://www.amnesty.org/en/rss/', // Human rights violations
        'https://www.hrw.org/rss' // Human Rights Watch
      ],

      // Weather and natural disaster alerts
      weatherFeeds: [
        'https://alerts.weather.gov/rss/', // US weather alerts
        'https://www.gdacs.org/xml/rss.xml', // Global disaster alerts
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom' // Earthquake alerts
      ]
    };
  }

  // Enhanced GDELT queries with drug/crime keywords
  async fetchGDELTEvents(countryCode) {
    const events = [];
    const country = this.getCountryName(countryCode);
    
    // Multiple keyword sets for comprehensive coverage
    const keywordSets = [
      // Violence & conflict
      'attack OR bombing OR shooting OR explosion OR missile OR airstrike OR drone',
      // Crime & drugs
      'cartel OR drug OR trafficking OR smuggling OR murder OR kidnapping OR robbery',
      // Protests & unrest  
      'protest OR riot OR demonstration OR strike OR unrest OR violence',
      // Security incidents
      'security OR police OR military OR arrest OR raid OR operation',
      // Terrorism
      'terrorist OR terrorism OR extremist OR militant OR insurgent'
    ];

    for (const keywords of keywordSets) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Last 7 days
        const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
        
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(country + ' ' + keywords)}&mode=artlist&maxrecords=50&startdatetime=${dateStr}000000&format=json`;
        
        console.log(`GDELT: Fetching ${country} - ${keywords}`);
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.articles) {
          const processed = response.data.articles.map(article => ({
            title: article.title,
            description: article.title, // GDELT doesn't provide descriptions
            url: article.url,
            source: 'GDELT',
            type: this.categorizeIncident(article.title, keywords),
            severity: this.assessSeverity(article.title),
            location: article.location || country,
            country_code: countryCode,
            coordinates: this.extractCoordinates(article),
            occurred_at: new Date(article.seendate).toISOString(),
            keywords: keywords
          }));
          
          events.push(...processed);
        }
      } catch (error) {
        console.error(`GDELT query failed for ${country} - ${keywords}:`, error.message);
      }
    }

    return events;
  }

  // UCDP (Uppsala University) free conflict data
  async fetchUCDPEvents(countryCode) {
    try {
      const country = this.getCountryName(countryCode);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const url = `https://ucdpapi.pcr.uu.se/api/gedevents/22.1?country=${encodeURIComponent(country)}&from=${startDate.toISOString().split('T')[0]}`;
      
      console.log(`UCDP: Fetching conflict data for ${country}`);
      const response = await axios.get(url, { timeout: 15000 });
      
      if (response.data && response.data.result) {
        return response.data.result.map(event => ({
          title: `Armed conflict incident in ${event.where_description}`,
          description: `${event.type_of_violence} - ${event.deaths_a + event.deaths_b + event.deaths_civilians + event.deaths_unknown} casualties`,
          source: 'UCDP',
          type: 'armed_conflict',
          severity: event.deaths_total > 10 ? 'critical' : event.deaths_total > 0 ? 'high' : 'medium',
          location: event.where_description,
          country_code: countryCode,
          coordinates: {
            lat: event.latitude,
            lng: event.longitude
          },
          occurred_at: event.date_start,
          casualties: event.deaths_total,
          conflict_type: event.type_of_violence
        }));
      }
    } catch (error) {
      console.error(`UCDP fetch failed for ${countryCode}:`, error.message);
    }
    return [];
  }

  // Crime-specific RSS feeds
  async fetchCrimeFeeds(countryCode) {
    const events = [];
    
    for (const feedUrl of this.sources.crimeFeeds) {
      try {
        console.log(`Crime feed: ${feedUrl}`);
        const feed = await parse(feedUrl);
        
        const filtered = feed.items
          .filter(item => this.isRelevantToCountry(item, countryCode))
          .filter(item => this.isCrimeRelated(item))
          .slice(0, 10)
          .map(item => ({
            title: item.title,
            description: item.description || '',
            url: item.link,
            source: this.getSourceName(feedUrl),
            type: this.categorizeCrime(item.title + ' ' + (item.description || '')),
            severity: this.assessSeverity(item.title + ' ' + (item.description || '')),
            location: this.extractLocationFromText(item.title + ' ' + (item.description || '')),
            country_code: countryCode,
            occurred_at: new Date(item.published || Date.now()).toISOString()
          }));
        
        events.push(...filtered);
      } catch (error) {
        console.error(`Crime feed failed ${feedUrl}:`, error.message);
      }
    }
    
    return events;
  }

  // Embassy and travel alerts (highest signal)
  async fetchEmbassyAlerts(countryCode) {
    const events = [];
    const feeds = this.sources.embassyFeeds[countryCode] || [];
    
    for (const feedUrl of feeds) {
      try {
        console.log(`Embassy feed: ${feedUrl}`);
        const feed = await parse(feedUrl);
        
        const alerts = feed.items
          .filter(item => this.isSecurityAlert(item))
          .slice(0, 5)
          .map(item => ({
            title: item.title,
            description: item.description || '',
            url: item.link,
            source: 'US Embassy',
            type: this.categorizeAlert(item.title),
            severity: this.assessAlertSeverity(item.title),
            location: this.getCountryName(countryCode),
            country_code: countryCode,
            occurred_at: new Date(item.published || Date.now()).toISOString(),
            is_official: true
          }));
        
        events.push(...alerts);
      } catch (error) {
        console.error(`Embassy feed failed ${feedUrl}:`, error.message);
      }
    }
    
    return events;
  }

  // Weather and disaster alerts
  async fetchWeatherAlerts(countryCode) {
    const events = [];
    
    for (const feedUrl of this.sources.weatherFeeds) {
      try {
        console.log(`Weather feed: ${feedUrl}`);
        const feed = await parse(feedUrl);
        
        const filtered = feed.items
          .filter(item => this.isRelevantToCountry(item, countryCode))
          .filter(item => this.isWeatherAlert(item))
          .slice(0, 5)
          .map(item => ({
            title: item.title,
            description: item.description || '',
            source: this.getSourceName(feedUrl),
            type: 'weather',
            severity: this.assessWeatherSeverity(item.title),
            location: this.extractLocationFromText(item.title),
            country_code: countryCode,
            occurred_at: new Date(item.published || Date.now()).toISOString()
          }));
        
        events.push(...filtered);
      } catch (error) {
        console.error(`Weather feed failed ${feedUrl}:`, error.message);
      }
    }
    
    return events;
  }

  // Comprehensive incident fetching
  async fetchAllIncidents(countryCode) {
    console.log(`Fetching all incident types for ${countryCode}`);
    
    const [gdeltEvents, ucdpEvents, crimeEvents, embassyEvents, weatherEvents] = await Promise.all([
      this.fetchGDELTEvents(countryCode),
      this.fetchUCDPEvents(countryCode), 
      this.fetchCrimeFeeds(countryCode),
      this.fetchEmbassyAlerts(countryCode),
      this.fetchWeatherAlerts(countryCode)
    ]);

    const allEvents = [
      ...gdeltEvents,
      ...ucdpEvents,
      ...crimeEvents,
      ...embassyEvents,
      ...weatherEvents
    ];

    // Remove duplicates and sort by recency
    const unique = this.deduplicateEvents(allEvents);
    const sorted = unique.sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

    // Generate 7-day dashboard statistics
    const stats = this.generate7DayStats(sorted);

    return {
      events: sorted.slice(0, 50), // Return top 50 most recent
      stats7d: stats,
      total: sorted.length,
      sources_used: [...new Set(sorted.map(e => e.source))],
      last_updated: new Date().toISOString()
    };
  }

  // 7-day dashboard statistics
  generate7DayStats(events) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = events.filter(e => new Date(e.occurred_at) > sevenDaysAgo);
    
    const stats = {
      total_incidents: recent.length,
      by_type: {},
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      threat_level: 'CLEAR',
      safety_score: 85
    };

    recent.forEach(event => {
      // Count by type
      stats.by_type[event.type] = (stats.by_type[event.type] || 0) + 1;
      
      // Count by severity
      stats.by_severity[event.severity] = (stats.by_severity[event.severity] || 0) + 1;
    });

    // Calculate threat level
    if (stats.by_severity.critical > 5) {
      stats.threat_level = 'HIGH THREAT';
      stats.safety_score = 25;
    } else if (stats.by_severity.critical > 0 || stats.by_severity.high > 10) {
      stats.threat_level = 'ELEVATED';
      stats.safety_score = 50;
    } else if (recent.length > 20) {
      stats.threat_level = 'MONITOR';
      stats.safety_score = 70;
    }

    return stats;
  }

  // Helper functions for categorization and filtering
  categorizeIncident(text, keywords) {
    const lower = text.toLowerCase();
    if (keywords.includes('attack') && (lower.includes('bomb') || lower.includes('explosion'))) return 'explosion';
    if (keywords.includes('attack') && (lower.includes('missile') || lower.includes('airstrike'))) return 'air_threat';
    if (lower.includes('drug') || lower.includes('cartel') || lower.includes('trafficking')) return 'drug_crime';
    if (lower.includes('protest') || lower.includes('riot')) return 'civil_unrest';
    if (lower.includes('shooting') || lower.includes('gunfire')) return 'armed_incident';
    if (lower.includes('weather') || lower.includes('storm')) return 'weather';
    return 'security_incident';
  }

  assessSeverity(text) {
    const lower = text.toLowerCase();
    const criticalKeywords = ['killed', 'dead', 'deaths', 'bomb', 'explosion', 'missile', 'attack', 'terror'];
    const highKeywords = ['injured', 'wounded', 'shooting', 'violence', 'clash'];
    
    if (criticalKeywords.some(keyword => lower.includes(keyword))) return 'critical';
    if (highKeywords.some(keyword => lower.includes(keyword))) return 'high';
    return 'medium';
  }

  isCrimeRelated(item) {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    const crimeKeywords = ['cartel', 'drug', 'trafficking', 'smuggling', 'murder', 'kidnapping', 
                          'robbery', 'theft', 'crime', 'arrest', 'seized', 'bust', 'raid'];
    return crimeKeywords.some(keyword => text.includes(keyword));
  }

  isSecurityAlert(item) {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    const alertKeywords = ['alert', 'security', 'warning', 'embassy', 'citizens', 'avoid', 'threat'];
    return alertKeywords.some(keyword => text.includes(keyword));
  }

  isWeatherAlert(item) {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    const weatherKeywords = ['storm', 'hurricane', 'earthquake', 'flood', 'disaster', 'warning', 'alert'];
    return weatherKeywords.some(keyword => text.includes(keyword));
  }

  getCountryName(countryCode) {
    const names = {
      'JO': 'Jordan', 'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France',
      'DE': 'Germany', 'JP': 'Japan', 'CN': 'China', 'BR': 'Brazil', 'IN': 'India',
      'MX': 'Mexico', 'ZA': 'South Africa', 'AU': 'Australia', 'CA': 'Canada',
      'RU': 'Russia', 'UA': 'Ukraine', 'TR': 'Turkey', 'EG': 'Egypt', 'SA': 'Saudi Arabia',
      'AE': 'UAE', 'IL': 'Israel', 'IQ': 'Iraq', 'SY': 'Syria', 'LB': 'Lebanon',
      'PK': 'Pakistan', 'AF': 'Afghanistan', 'IR': 'Iran'
    };
    return names[countryCode] || countryCode;
  }

  isRelevantToCountry(item, countryCode) {
    const country = this.getCountryName(countryCode);
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();
    return text.includes(country.toLowerCase());
  }

  deduplicateEvents(events) {
    const seen = new Set();
    return events.filter(event => {
      const key = event.title.substring(0, 100) + event.source;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getSourceName(url) {
    if (url.includes('insightcrime')) return 'InSight Crime';
    if (url.includes('unodc')) return 'UNODC';
    if (url.includes('osac')) return 'OSAC';
    if (url.includes('reliefweb')) return 'ReliefWeb';
    if (url.includes('crisisgroup')) return 'Crisis Group';
    return 'Security Feed';
  }

  extractLocationFromText(text) {
    // Simple location extraction - could be enhanced with NLP
    const locations = text.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
    return locations ? locations[0].replace('in ', '') : null;
  }

  extractCoordinates(article) {
    // GDELT sometimes provides coordinates
    if (article.lat && article.lon) {
      return { lat: parseFloat(article.lat), lng: parseFloat(article.lon) };
    }
    return null;
  }
}

// Main API endpoint
async function getEvents(req, res) {
  try {
    const countryCode = req.query.country_code || req.query.country || 'US';
    console.log(`EVENTS API: Fetching incidents for ${countryCode}`);
    
    const ingestion = new IncidentIngestion();
    const result = await ingestion.fetchAllIncidents(countryCode);
    
    console.log(`EVENTS API: Found ${result.events.length} incidents for ${countryCode}`);
    console.log(`EVENTS API: 7-day stats - Total: ${result.stats7d.total_incidents}, Threat: ${result.stats7d.threat_level}`);
    
    res.json(result);
    
  } catch (error) {
    console.error('EVENTS API ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to fetch incidents',
      details: error.message,
      events: [],
      stats7d: { total_incidents: 0, threat_level: 'UNKNOWN', safety_score: 50 }
    });
  }
}

module.exports = {
  getEvents,
  IncidentIngestion
};
