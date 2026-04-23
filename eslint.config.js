// Atlas Ally — ESLint config (flat config, ESLint 9+)
// See https://eslint.org/docs/latest/use/configure/configuration-files
//
// Approach: extend @eslint/js "recommended" with practical tweaks for a
// 6-month-old codebase. Rules that indicate real bugs (no-undef, no-dupe-keys,
// no-const-assign etc.) stay at "error" so husky blocks commits that introduce
// them. Hygiene rules (no-unused-vars, no-empty catch blocks, etc.) are
// downgraded to "warn" so existing code doesn't trip the pre-commit hook.
//
// `eslint-config-prettier` is applied LAST so Prettier's formatting wins
// wherever the two conflict.

const js       = require('@eslint/js');
const globals  = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  // Ignore generated / vendored / large static content.
  {
    ignores: [
      'node_modules/**',
      'data/**',
      'coverage/**',
      'public/**',          // large static frontend; lint in a later pass
      'db-*.js',            // local diagnostic scripts, gitignored anyway
      '*.min.js',
    ],
  },

  // Baseline recommended rules for JavaScript.
  js.configs.recommended,

  // Project-wide language + globals + rule tweaks.
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType:  'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // ── Downgraded to warn — these fire on existing code and are hygiene,
      //    not bugs. Husky pre-commit only blocks on errors, so these inform
      //    the author without gating their workflow.
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-empty':              ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': 'warn',
      'no-useless-escape':     'warn',
      'no-prototype-builtins': 'warn',
      'no-case-declarations':  'warn',
      'no-inner-declarations': 'warn',
      'no-async-promise-executor': 'warn',

      // Remaining rules from js.configs.recommended stay at their default
      // severity (mostly error). Examples kept as errors:
      //   no-undef, no-const-assign, no-dupe-keys, no-dupe-args,
      //   no-unreachable, no-redeclare.
    },
  },

  // Disable ESLint rules that conflict with Prettier.
  // This block must come LAST so it wins.
  prettier,
];
