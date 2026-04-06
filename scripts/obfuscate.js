#!/usr/bin/env node
// Atlas Ally — Frontend obfuscation build script
// Extracts all <script> blocks from index.html, obfuscates them,
// and writes a protected version to public/index.html

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC = path.join(__dirname, '../public/index.html');
const OUT = path.join(__dirname, '../public/index.html');

console.log('🔒 Atlas Ally — Obfuscating frontend JS...');

let html = fs.readFileSync(SRC, 'utf8');

// Find all inline script blocks (not src="" ones)
const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
let scriptCount = 0;
let totalOriginal = 0;
let totalObfuscated = 0;

html = html.replace(scriptRegex, (match, jsContent) => {
  const trimmed = jsContent.trim();
  // Skip empty scripts and tiny ones (less than 100 chars)
  if (!trimmed || trimmed.length < 100) return match;

  try {
    const result = JavaScriptObfuscator.obfuscate(trimmed, {
      compact: true,
      controlFlowFlattening: false,      // keep false — too slow on mobile
      deadCodeInjection: false,           // keep false — increases size
      debugProtection: true,             // makes debugger painful to use
      debugProtectionInterval: 4000,
      disableConsoleOutput: false,        // keep console for error tracking
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,              // keep false — breaks global functions
      rotateStringArray: true,
      selfDefending: true,               // code resists reformatting
      shuffleStringArray: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayCallsTransform: true,
      stringArrayEncoding: ['rc4'],      // encrypt string literals
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,
      transformObjectKeys: false,
      unicodeEscapeSequence: false,
    });

    const obfuscated = result.getObfuscatedCode();
    scriptCount++;
    totalOriginal += trimmed.length;
    totalObfuscated += obfuscated.length;
    return `<script>${obfuscated}</script>`;
  } catch (e) {
    console.warn('  ⚠️  Could not obfuscate a script block:', e.message.slice(0, 80));
    return match; // Return original if obfuscation fails
  }
});

fs.writeFileSync(OUT, html, 'utf8');

console.log(`✅ Done — ${scriptCount} script blocks obfuscated`);
console.log(`   Original JS: ${(totalOriginal / 1024).toFixed(1)}KB`);
console.log(`   Obfuscated:  ${(totalObfuscated / 1024).toFixed(1)}KB`);
console.log(`   Output:      ${OUT}`);
