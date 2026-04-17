// Atlas Ally — Enhanced News Feed API  
// v2026.04.16 — Using existing xml2js + node-fetch dependencies

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

// RSS feed parser using xml2js
async function parseRSS(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Atlas Ally News Bot 1.0'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xml);
    
    // Handle different RSS formats
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

// Google News RSS queries (more specific)
function getNewsQueries(countryCode) {
  const baseQueries = {
    'JO': [
      'Jordan security safety travel news',
      'Jordan middle east news -michael -peterson -river', // Exclude "Jordan" names
      'Amman Jordan news'
    ],
    'UA': [
      'Ukraine war conflict news',
      'Ukraine security military news',
      'Kiev Kyiv Ukraine news'
    ],
    'MX': [
      'Mexico security cartel crime news',
      'Mexico travel safety news',
      'Mexico City security news'
    ],
    'BR': [
      'Brazil crime security news',
      'Brazil safety travel news',
      'Rio Sao Paulo Brazil security'
    ],
    'IN': [
      'India security terrorism news',
      'India travel safety news',
      'Delhi Mumbai India security'
    ],
    'ZA': [
      'South Africa crime security news',
      'South Africa safety travel news',
      'Johannesburg Cape Town crime'
    ],
    'FR': [
      'France security terrorism news',
      'France protest strike news',
      'Paris France security news'
    ],
    'DE': [
      'Germany security news',
      'Germany protest news',
      'Berlin Germany security'
    ],
    'GB': [
      'United Kingdom security news',
      'UK Britain security news',
      'London UK security news'
    ],
    'US': [
      'United States security news',
      'America domestic security news',
      'USA homeland security news'
    ]
  };

  // Default queries for countries not specifically configured
  const countryNames = COUNTRY_VARIATIONS[countryCode] || [countryCode];
  const defaultQueries = [
    `${countryNames[0]} security safety travel news`,
    `${countryNames[0]} crime incident news`,
    `${countryNames[0]} emergency alert news`
  ];

  return baseQueries[countryCode] || defaultQueries;
}

// Enhanced content filtering
function isRelevantToCountry(article, countryCode) {
  const variations = COUNTRY_VARIATIONS[countryCode] || [countryCode];
  const content = (article.title + ' ' + (article.description || '')).toLowerCase();
  
  // Must contain at least one country variation
  const hasCountryRef = variations.some(name => 
    content.includes(name.toLowerCase())
  );
  
  if (!hasCountryRef) return false;

  // Special filtering for "Jordan" to avoid person names
  if (countryCode === 'JO') {
    // Exclude if contains basketball, NBA, river, or person indicators
    if (/basketball|nba|river|michael|peterson|brand|shoe|athlete/.test(content)) {
      return false;
    }
    // Include if contains Jordan + geographic/political terms
    if (/jordan.*(king|kingdom|amman|government|minister|embassy|border|security|military)/.test(content)) {
      return true;
    }
    // Include if contains "Jordan" + news-worthy terms
    if (/jordan.*(news|report|announced|said|officials|crisis|conflict|visit)/.test(content)) {
      return true;
    }
  }

  // Include articles with security/travel keywords
  const relevantKeywords = [
    'security', 'safety', 'travel', 'tourism', 'embassy', 'alert',
    'incident', 'attack', 'crime', 'police', 'government', 'minister',
    'crisis', 'conflict', 'protest', 'strike', 'emergency', 'warning'
  ];
  
  return relevantKeywords.some(keyword => content.includes(keyword));
}

// Multiple news sources for reliability
async function fetchFromMultipleSources(countryCode) {
  const results = [];
  
  // 1. Google News RSS (primary)
  const queries = getNewsQueries(countryCode);
  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=US&ceid=US:en`;
      console.log(`Fetching Google News: ${query}`);
      
      const items = await parseRSS(url);
      const filtered = items
        .filter(item => isRelevantToCountry(item, countryCode))
        .slice(0, 10)
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

  // 2. Global backup sources (filtered)
  const globalSources = [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
  ];

  for (const sourceUrl of globalSources) {
    try {
      console.log(`Fetching global source: ${sourceUrl}`);
      const items = await parseRSS(sourceUrl);
      const filtered = items
        .filter(item => isRelevantToCountry(item, countryCode))
        .slice(0, 5)
        .map(item => ({
          title: item.title,
          description: item.description || '',
          url: item.link,
          source_name: sourceUrl.includes('bbc') ? 'BBC' : 'Al Jazeera',
          published_at: item.published,
          country_code: countryCode
        }));
      
      results.push(...filtered);
    } catch (error) {
      console.error(`Global source failed: ${sourceUrl}`, error.message);
    }
  }

  // Remove duplicates and sort by relevance/recency
  const unique = results.filter((item, index, self) => 
    index === self.findIndex(t => t.title === item.title)
  );

  return unique
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 20); // Return top 20 most recent relevant articles
}

// Main news API endpoint
async function getNews(req, res) {
  try {
    const countryCode = req.query.country_code || req.query.country || 'US';
    const lang = req.query.lang || 'en';
    
    console.log(`NEWS API: Fetching news for ${countryCode}`);
    
    const articles = await fetchFromMultipleSources(countryCode);
    
    console.log(`NEWS API: Found ${articles.length} relevant articles for ${countryCode}`);
    
    // Return in expected format (compatible with existing frontend)
    res.json({
      articles: articles,
      country_code: countryCode,
      total: articles.length,
      sources_used: [...new Set(articles.map(a => a.source_name))],
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

module.exports = {
  getNews,
  fetchFromMultipleSources,
  isRelevantToCountry,
  getNewsQueries
};
