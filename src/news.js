// Atlas Ally — Enhanced News Service & API Handler
// v2026.04.16 — Compatible with both direct require and route usage

const fetch = require('node-fetch');
const xml2js = require('xml2js');

// Country name variations to improve filtering
const COUNTRY_VARIATIONS = {
  'JO': ['Jordan', 'Jordanian', 'Kingdom of Jordan', 'Amman'],
  'US': ['United States', 'America', 'American', 'USA', 'US'],
  'GB': ['United Kingdom', 'Britain', 'British', 'UK', 'England'],
  'FR': ['France', 'French', 'Paris'],
  'DE': ['Germany', 'German', 'Berlin'],
  'JP': ['Japan', 'Japanese', 'Tokyo'],
  'CN': ['China', 'Chinese', 'Beijing'],
  'BR': ['Brazil', 'Brazilian', 'Brasilia'],
  'IN': ['India', 'Indian', 'Delhi', 'Mumbai'],
  'MX': ['Mexico', 'Mexican', 'Mexico City'],
  'ZA': ['South Africa', 'South African', 'Johannesburg', 'Cape Town'],
  'AU': ['Australia', 'Australian', 'Sydney', 'Melbourne'],
  'CA': ['Canada', 'Canadian', 'Ottawa', 'Toronto'],
  'RU': ['Russia', 'Russian', 'Moscow'],
  'UA': ['Ukraine', 'Ukrainian', 'Kiev', 'Kyiv'],
  'TR': ['Turkey', 'Turkish', 'Ankara', 'Istanbul'],
  'EG': ['Egypt', 'Egyptian', 'Cairo'],
  'SA': ['Saudi Arabia', 'Saudi', 'Riyadh'],
  'AE': ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi'],
  'IL': ['Israel', 'Israeli', 'Jerusalem', 'Tel Aviv']
};

// RSS parser using xml2js
async function parseRSS(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Atlas Ally News Bot 1.0' },
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

// Enhanced content filtering for Jordan
function isRelevantToCountry(article, countryCode) {
  const variations = COUNTRY_VARIATIONS[countryCode] || [countryCode];
  const content = (article.title + ' ' + (article.description || '')).toLowerCase();
  
  const hasCountryRef = variations.some(name => 
    content.includes(name.toLowerCase())
  );
  
  if (!hasCountryRef) return false;

  // Special filtering for "Jordan" to avoid person names
  if (countryCode === 'JO') {
    if (/basketball|nba|river|michael|peterson|brand|shoe|athlete|sports|player|team|game|court/.test(content)) {
      return false;
    }
    if (/jordan.*(king|kingdom|amman|government|minister|embassy|border|security|military|country|nation)/.test(content)) {
      return true;
    }
  }

  // Include articles with relevant keywords
  const relevantKeywords = [
    'security', 'safety', 'travel', 'tourism', 'embassy', 'alert',
    'incident', 'attack', 'crime', 'police', 'government', 'minister',
    'crisis', 'conflict', 'protest', 'strike', 'emergency', 'warning'
  ];
  
  return relevantKeywords.some(keyword => content.includes(keyword));
}

// Fetch news from multiple sources
async function fetchFromMultipleSources(countryCode) {
  const results = [];
  const countryNames = COUNTRY_VARIATIONS[countryCode] || [countryCode];
  
  // Google News queries
  const queries = [
    `${countryNames[0]} security safety travel news`,
    `${countryNames[0]} government politics news`,
    `${countryNames[0]} emergency alert news`
  ];

  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
      console.log(`Fetching Google News: ${query}`);
      
      const items = await parseRSS(url);
      const filtered = items
        .filter(item => isRelevantToCountry(item, countryCode))
        .slice(0, 8)
        .map(item => ({
          title: item.title,
          description: item.description || '',
          url: item.link,
          source_name: 'Google News',
          published_at: item.published,
          country_code: countryCode
        }));
      
      results.push(...filtered);
    } catch (error) {
      console.error(`Google News query failed: ${query}`, error.message);
    }
  }

  // Remove duplicates and sort
  const unique = results.filter((item, index, self) => 
    index === self.findIndex(t => t.title === item.title)
  );

  return unique
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 15);
}

// Main API handler (for route usage)
async function getNews(req, res) {
  try {
    const countryCode = req.query.country_code || req.query.country || 'US';
    console.log(`NEWS API: Fetching news for ${countryCode}`);
    
    const articles = await fetchFromMultipleSources(countryCode);
    
    console.log(`NEWS API: Found ${articles.length} relevant articles for ${countryCode}`);
    
    res.json({
      articles: articles,
      country_code: countryCode,
      total: articles.length,
      sources_used: ['Google News'],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('NEWS API ERROR:', error);
    res.status(500).json({ 
      error: 'Failed to fetch news',
      details: error.message,
      articles: [] 
    });
  }
}

// Compatibility function for server.js
async function refreshAllNews() {
  console.log('NEWS: Background refresh triggered - using on-demand fetching');
  return { success: true, message: 'News system uses on-demand fetching' };
}

module.exports = {
  getNews,
  fetchFromMultipleSources,
  refreshAllNews,
  // Export the handler directly for Express route mounting
  router: function(app) {
    app.get('/api/news', getNews);
  }
};
