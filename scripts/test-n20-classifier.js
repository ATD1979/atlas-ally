// scripts/test-n20-classifier.js
//
// Validate the N20 alias-tier + LLM-disambiguation pipeline against curated test
// cases. Run after prompt changes to verify behavior before deploying.
//
// Usage:
//   railway run node scripts/test-n20-classifier.js
//
// `railway run` injects the production env (ANTHROPIC_API_KEY) without
// exposing it in your shell. Real API calls — about half a cent total.

const {
  classifyRelevance,
  llmIsRelevantToCountry,
  passesNoiseFilter,
} = require('../src/lib/countries-meta');

const KNOWN_GOOD = [
  // Strong-tier — should pass without LLM
  { title: 'King Abdullah meets Saudi crown prince in Amman' },
  { title: 'Jordanian forces conduct counterterrorism operation near Syrian border' },
  { title: 'Aqaba port expansion project breaks ground' },
  { title: 'Hashemite Kingdom announces water-sharing agreement with Israel' },
  { title: 'Wadi Rum film festival draws international visitors' },
  { title: 'Irbid municipality launches public transit overhaul' },
  { title: 'Zarqa industrial zone attracts new foreign investment' },
  { title: 'Captagon seizure reported on Jordanian-Syrian border' },
  // Weak-only — LLM must approve
  { title: 'Petra tourism revenue up 20% as visitors return' },
  { title: 'Jordan signs $1 billion trade deal with EU', description: 'Amman officials confirmed the agreement Friday' },
  { title: 'Jordan central bank holds interest rates steady' },
  { title: 'Jordan condemns Israeli settlement expansion' },
  { title: 'Jordan to host regional climate summit next March' },
  { title: 'Petra visitor cap announced by tourism ministry' },
  { title: 'Jordan parliament debates new electoral law' },
  { title: 'Royal Jordanian Airlines orders new aircraft' },
  { title: 'Iraq-Jordan oil pipeline talks resume after delay' },
  { title: 'Tourism in Jordan rebounds after pandemic slump' },
  { title: 'Jordan Arab Bank reports record quarterly profit' },
  { title: 'Floods in southern Jordan displace 200 families' },
];

const KNOWN_NOISE = [
  // Pre-LLM noise filter — should catch these for free
  { title: 'Michael Jordan retires from sports investments' },
  { title: 'Air Jordan 1 retro release sells out' },
  { title: 'Jordan Peterson cancels speaking tour' },
  { title: 'Jordan Spieth wins Masters in playoff' },
  { title: 'Eddie Jordan reflects on F1 career' },
  { title: 'Jordan Brand unveils new colorway for 2026' },
  { title: 'Jordan Henderson signs with Saudi club' },
  { title: 'Jordan Love throws three touchdowns in win' },
  { title: 'DeAndre Jordan announces retirement from NBA' },
  { title: 'Vernon Jordan, civil rights leader, dies at 85' },
  // Weak-only noise — LLM has to catch these
  { title: 'Petra Kvitova advances at Wimbledon quarterfinals' },
  { title: 'Petra Nemcova launches new charity initiative' },
  { title: 'Michael B. Jordan stars in new superhero film' },
  { title: 'Jordan Cooper named Tony Award nominee for new musical' },
  { title: 'Jordan Reed lands assistant coaching role at Maryland' },
  { title: 'Jordan Almonds emerge as top wedding favor of 2026' },
  { title: 'Petra brand cosmetics expand to UK retail stores' },
  { title: 'Jordan, Minnesota celebrates 175th anniversary' },
  { title: 'Climber Jordan Romero remembered on summit anniversary' },
  { title: 'Jordan Chiles named team captain for world championships' },
  // v6.27 prompt-tuning iteration — failures observed in production
  { title: "Jayson Tatum Gets Strong Achilles Warning From Jordan's Ex-Trainer Before Game 7" },
  { title: 'Benn Jordan, Musician, Scientist, and YouTuber on Flock Safety Cameras' },
  { title: 'Jordan, Cleveland sportscaster, retires after 40 years' },
];

async function simulatePipeline(testCase) {
  const code = 'JO';
  const fullText = (testCase.title || '') + ' ' + (testCase.description || '');

  const tier = classifyRelevance(fullText, code);
  if (tier === 'none')   return { stage: 'NONE',   verdict: 'reject', llmCalled: false };
  if (!passesNoiseFilter(testCase.title, code))
                          return { stage: 'NOISE',  verdict: 'reject', llmCalled: false };
  if (tier === 'strong') return { stage: 'STRONG', verdict: 'accept', llmCalled: false };

  const v = await llmIsRelevantToCountry(fullText, code, null);
  return { stage: 'LLM',  verdict: v ? 'accept' : 'reject', llmCalled: true };
}

function pad(s, n) { return String(s).padEnd(n, ' '); }

(async () => {
  console.log('\n=== N20 Classifier Test Harness — JO ===\n');

  let goodOK = 0, noiseOK = 0, llmCalls = 0;
  const failures = [];

  console.log('KNOWN-GOOD CASES (expected: accept)');
  console.log('─'.repeat(80));
  for (const c of KNOWN_GOOD) {
    const r = await simulatePipeline(c);
    if (r.llmCalled) llmCalls++;
    const pass = r.verdict === 'accept';
    if (pass) goodOK++;
    else failures.push({ title: c.title, expected: 'accept', stage: r.stage, got: r.verdict });
    console.log(`  [${pad(r.stage, 6)}] ${pass ? '✓' : '✗'} ${c.title}`);
  }

  console.log('\nKNOWN-NOISE CASES (expected: reject)');
  console.log('─'.repeat(80));
  for (const c of KNOWN_NOISE) {
    const r = await simulatePipeline(c);
    if (r.llmCalled) llmCalls++;
    const pass = r.verdict === 'reject';
    if (pass) noiseOK++;
    else failures.push({ title: c.title, expected: 'reject', stage: r.stage, got: r.verdict });
    console.log(`  [${pad(r.stage, 6)}] ${pass ? '✓' : '✗'} ${c.title}`);
  }

  const cost = (llmCalls * 0.00025).toFixed(4);
  console.log('\nSUMMARY');
  console.log('─'.repeat(80));
  console.log(`  Known-good accepted:  ${goodOK}/${KNOWN_GOOD.length} (${Math.round(100*goodOK/KNOWN_GOOD.length)}%)`);
  console.log(`  Known-noise rejected: ${noiseOK}/${KNOWN_NOISE.length} (${Math.round(100*noiseOK/KNOWN_NOISE.length)}%)`);
  console.log(`  LLM calls made:       ${llmCalls}`);
  console.log(`  Estimated cost:       $${cost}`);

  if (failures.length) {
    console.log('\nFAILURES');
    console.log('─'.repeat(80));
    for (const f of failures) {
      console.log(`  [${f.stage}] expected=${f.expected} got=${f.got}`);
      console.log(`           "${f.title}"`);
    }
  }

  console.log('');
  process.exit(failures.length ? 1 : 0);
})();
