// Atlas Ally — Enhanced Events/Incidents API
// v2026.04.16 — Using existing node-fetch + xml2js dependencies

const fetch = require('node-fetch');
const xml2js = require('xml2js');

// RSS parser using xml2js
async function parseRSS(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Atlas Ally Security Bot 1.0' },
      timeout: 10000
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const xml = await response.text();
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    let items = [];
    if (result.rss && result.rss.channel && result.rss.channel.item) {
      items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item];
    } else if (result.feed && result.feed.entry) {
      items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
    }
    
    return items.map(item => ({
      title: item.title || item.title && item.title._ || '',
      description: item.description || item.summary || '',
      link: item.link || (item.link && item.link.href) || '',
      published: item.pubDate || item.published || item.updated || new Date().toISOString()
    }));
    
  } catch (error) {
    console.error(`RSS parse error for ${url}:`, error.message);
    return [];
  }
}

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
        'https://www.insightcrime.org/feed/',
        'https://www.unodc.org/rss/en/frontpage.xml',
        'https://reliefweb.int/updates/rss.xml'
      ],

      // Weather and disaster alerts  
      weatherFeeds: [
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom'
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
      'security OR police OR military OR arrest OR raid OR operation'
    ];

    for (const keywords of keywordSets) {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Last 7 days
        const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
        
        // Enhanced query to exclude sports/person names for Jordan
        let query = country + ' ' + keywords;
        if (countryCode === 'JO') {
          query += ' -basketball -NBA -"Jordan Ott" -"Jordan Harrison" -sports -athlete -player';
        }
        
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=50&startdatetime=${dateStr}000000&format=json`;
        
        console.log(`GDELT: Fetching ${country} - ${keywords}`);
        const response = await fetch(url, { timeout: 10000 });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.articles) {
            const processed = data.articles.map(article => ({
              title: article.title,
              description: article.title,
              url: article.url,
              source: 'GDELT',
              type: this.categorizeIncident(article.title, keywords),
              severity: this.assessSeverity(article.title),
              location: article.location || country,
              country_code: countryCode,
              occurred_at: new Date(article.seendate).toISOString(),
              keywords: keywords
            }));
            
            events.push(...processed);
          }
        }
      } catch (error) {
        console.error(`GDELT query failed for ${country} - ${keywords}:`, error.message);
      }
    }

    return events;
  }

  // Crime-specific RSS feeds
  async fetchCrimeFeeds(countryCode) {
    const events = [];
    
    for (const feedUrl of this.sources.crimeFeeds) {
      try {
        console.log(`Crime feed: ${feedUrl}`);
        const items = await parseRSS(feedUrl);
        
        const filtered = items
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
        const items = await parseRSS(feedUrl);
        
        const alerts = items
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
        const items = await parseRSS(feedUrl);
        
        const filtered = items
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
    
    const [gdeltEvents, crimeEvents, embassyEvents, weatherEvents] = await Promise.all([
      this.fetchGDELTEvents(countryCode),
      this.fetchCrimeFeeds(countryCode),
      this.fetchEmbassyAlerts(countryCode),
      this.fetchWeatherAlerts(countryCode)
    ]);

    const allEvents = [
      ...gdeltEvents,
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

  // Helper functions
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

  categorizeAlert(title) {
    const lower = title.toLowerCase();
    if (lower.includes('shelter') || lower.includes('missile')) return 'air_threat';
    if (lower.includes('protest') || lower.includes('demonstration')) return 'civil_unrest';
    if (lower.includes('crime') || lower.includes('security')) return 'security_incident';
    return 'general_alert';
  }

  assessAlertSeverity(title) {
    const lower = title.toLowerCase();
    if (lower.includes('immediate') || lower.includes('urgent') || lower.includes('shelter')) return 'critical';
    if (lower.includes('warning') || lower.includes('avoid')) return 'high';
    return 'medium';
  }

  assessWeatherSeverity(title) {
    const lower = title.toLowerCase();
    if (lower.includes('major') || lower.includes('severe') || lower.includes('emergency')) return 'critical';
    if (lower.includes('warning')) return 'high';
    return 'medium';
  }

  categorizeCrime(text) {
    const lower = text.toLowerCase();
    if (lower.includes('drug') || lower.includes('cartel') || lower.includes('trafficking')) return 'drug_crime';
    if (lower.includes('murder') || lower.includes('killed')) return 'violent_crime';
    if (lower.includes('kidnap') || lower.includes('abduct')) return 'kidnapping';
    if (lower.includes('rob') || lower.includes('theft')) return 'theft';
    return 'crime';
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
    if (url.includes('reliefweb')) return 'ReliefWeb';
    if (url.includes('usgs')) return 'USGS';
    return 'Security Feed';
  }

  extractLocationFromText(text) {
    // Simple location extraction
    const locations = text.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
    return locations ? locations[0].replace('in ', '') : null;
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
