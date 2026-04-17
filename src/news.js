// Atlas Ally — Enhanced News Feed API
// v2026.04.16 — Fixed country filtering + multiple sources

const axios = require('axios');
const { parse } = require('rss-to-json');

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
      
      const feed = await parse(url);
      const filtered = feed.items
        .filter(item => isRelevantToCountry(item, countryCode))
        .slice(0, 10)
        .map(item => ({
          title: item.title,
          description: item.description || '',
          url: item.link,
          source: 'Google News',
          published: item.published || new Date().toISOString(),
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
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://rss.reuters.com/news/world'
  ];

  for (const sourceUrl of globalSources) {
    try {
      console.log(`Fetching global source: ${sourceUrl}`);
      const feed = await parse(sourceUrl);
      const filtered = feed.items
        .filter(item => isRelevantToCountry(item, countryCode))
        .slice(0, 5)
        .map(item => ({
          title: item.title,
          description: item.description || '',
          url: item.link,
          source: sourceUrl.includes('bbc') ? 'BBC' : sourceUrl.includes('aljazeera') ? 'Al Jazeera' : 'Reuters',
          published: item.published || new Date().toISOString(),
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
    .sort((a, b) => new Date(b.published) - new Date(a.published))
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
    
    // Return in expected format
    res.json({
      articles: articles,
      country_code: countryCode,
      total: articles.length,
      sources_used: [...new Set(articles.map(a => a.source))],
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
