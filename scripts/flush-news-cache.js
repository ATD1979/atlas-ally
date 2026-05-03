// scripts/flush-news-cache.js
//
// Clear news_cache rows for a given country and immediately repopulate via the
// current refresh pipeline. Useful after deploying changes to the noise filter,
// alias tiers, or LLM gate — gives a clean baseline so any subsequent noise is
// definitively a new leak rather than a stale-cache artifact.
//
// Usage:
//   railway run node scripts/flush-news-cache.js JO

const code = (process.argv[2] || '').toUpperCase();
if (!code) {
  console.error('Usage: node scripts/flush-news-cache.js <COUNTRY_CODE>');
  process.exit(1);
}

const db = require('../src/db');
const { refreshNewsForCountry } = require('../src/news');

(async () => {
  const sqlite = db.__db || db.db || db.connection || db.instance ||
                 (typeof db.prepare === 'function' ? db : null);

  if (!sqlite || typeof sqlite.prepare !== 'function') {
    console.error('Could not locate sqlite instance on db module exports.');
    console.error('Exports found:', Object.keys(db).join(', '));
    process.exit(2);
  }

  console.log(`Flushing news_cache for ${code}...`);
  const stmt = sqlite.prepare('DELETE FROM news_cache WHERE country_code = ?');
  const result = stmt.run(code);
  console.log(`  Deleted ${result.changes} rows.`);

  console.log(`Triggering fresh refresh for ${code} through current pipeline...`);
  const n = await refreshNewsForCountry(code, 'en');
  console.log(`  Repopulated ${n} articles. (LLM gate ran on weak-tier matches.)`);

  console.log('\nDone. Clean baseline established for', code);
  process.exit(0);
})().catch(e => {
  console.error('Flush failed:', e.message);
  process.exit(3);
});
