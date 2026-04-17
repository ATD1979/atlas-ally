// Atlas Ally — Shared RSS/Atom fetcher
// Replaces duplicate parsers previously in news.js, routes/events.js, routes/data.js,
// and services/events-ingest.js.

const fetch  = require('node-fetch');
const xml2js = require('xml2js');

const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

// Normalise an RSS/Atom item into a flat { title, description, link, published } shape.
// Handles the xml2js quirk where text nodes with attributes become { _: 'text', $: {...} }.
// Strips HTML tags from title and description.
function normaliseItem(item) {
  const titleRaw = item.title;
  const title =
    (titleRaw && typeof titleRaw === 'object' && titleRaw._) ||
    (typeof titleRaw === 'string' ? titleRaw : '') ||
    '';

  const descRaw = item.description || item.summary;
  const description =
    (descRaw && typeof descRaw === 'object' && descRaw._) ||
    (typeof descRaw === 'string' ? descRaw : '') ||
    '';

  let link = '';
  if (typeof item.link === 'string') {
    link = item.link;
  } else if (item.link && item.link.$ && item.link.$.href) {
    link = item.link.$.href; // Atom-style <link href="..."/>
  } else if (Array.isArray(item.link) && item.link[0]) {
    link = typeof item.link[0] === 'string' ? item.link[0] : (item.link[0].$ && item.link[0].$.href) || '';
  } else if (item.guid) {
    link = typeof item.guid === 'string' ? item.guid : (item.guid._ || '');
  }

  const published = item.pubDate || item.published || item.updated || '';

  const stripHtml = s => String(s).replace(/<[^>]*>/g, '').trim();

  return {
    title:       stripHtml(title),
    description: stripHtml(description),
    link:        String(link).trim(),
    published,
  };
}

// Fetch an RSS/Atom URL and return normalised items. Returns [] on any failure.
async function fetchRSS(url, { timeout = 8000, userAgent = 'AtlasAlly/1.0' } = {}) {
  try {
    const res = await fetch(url, {
      timeout,
      headers: { 'User-Agent': userAgent, Accept: 'application/rss+xml,application/atom+xml,*/*' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = await parser.parseStringPromise(xml);

    const raw = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const items = Array.isArray(raw) ? raw : [raw];
    return items.map(normaliseItem);
  } catch {
    return [];
  }
}

module.exports = { fetchRSS, normaliseItem };