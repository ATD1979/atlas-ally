// Atlas Ally - WhatsApp number normalizer
// v2026.05.13 - Carry-forwards A+B (auto-prefix '+' for unprefixed input,
//               strip non-digit formatting for consistent rate-limit bucketing)
//
// Normalizes a WhatsApp/phone string to canonical E.164 form: '+' followed by
// digits only. All downstream lookups, rate-limit buckets, and DB keys then
// match regardless of how the user typed the number.
//
// Why this exists:
//   Until v6.33 the cleaning logic
//
//     const clean = whatsapp.replace(/\s/g, '').replace(/^00/, '+');
//
//   was duplicated inline across 7 call sites (auth.js, payments.js,
//   server.js). Two bugs followed from that pattern:
//
//   A) Unprefixed input - a user typing '16825617016' (no '+') would slip
//      past the old logic, db.getUser('16825617016') would miss the admin
//      record at '+16825617016', the handler would return needs_signup: true,
//      and a duplicate user record could be created in /signup. Caught when
//      Adrian typed his admin number without the '+' during signup.html
//      testing.
//
//   B) Format-variant rate-limit bypass - the OTP rate limiter keys off the
//      cleaned value, but '(682) 561-7016', '682-561-7016', and '+16825617016'
//      hashed to different keys because the old logic only stripped whitespace,
//      not parens/hyphens/dots. A user retrying with varied formats could
//      bypass the per-phone cap.
//
// Both bugs are fixed by:
//   1. stripping every character that is not a digit (preserving a leading '+')
//   2. auto-prefixing '+' when the result is 10-15 digits with no '+' (E.164
//      length range)
//
// Note on 10-digit input:
//   A bare 10-digit number like '6825617016' is normalized to '+6825617016' -
//   country code 682 (Cook Islands), NOT a NANP number missing its '1'. There
//   is no server-side way to disambiguate 10-digit NANP from 10-digit
//   international. Forcing the country code is the client-side input's job;
//   the server normalizes whatever arrives without guessing.
//
// Usage:
//   const { cleanWhatsapp } = require('../lib/clean-whatsapp');  // adjust path
//
//   cleanWhatsapp('+16825617016')      // '+16825617016'
//   cleanWhatsapp('16825617016')       // '+16825617016'   (A)
//   cleanWhatsapp('(682) 561-7016')    // '+6825617016'    (B; 10-digit caveat)
//   cleanWhatsapp(' 0049 30 1234567')  // '+49301234567'   ('00' → '+')
//   cleanWhatsapp('')                  // ''
//   cleanWhatsapp(null)                // ''               (defensive)
function cleanWhatsapp(input) {
  if (!input || typeof input !== 'string') return '';

  let s = input.trim();

  // Convert leading '00' (international dialing prefix) to '+'. Must run
  // before the digit-only strip so the '+' survives.
  s = s.replace(/^00/, '+');

  // Preserve presence of a leading '+' across the digit-only strip.
  // Also collapses accidental '++' input to a single '+'.
  const hadLeadingPlus = s.startsWith('+');

  // Strip everything that is not a digit.
  s = s.replace(/\D/g, '');

  if (hadLeadingPlus) {
    s = '+' + s;
  }

  // Carry-forward A: auto-prefix '+' when the input is 10–15 digits with no
  // '+' — i.e., a valid E.164 length range. See note above on the 10-digit
  // NANP ambiguity.
  if (!s.startsWith('+') && /^\d{10,15}$/.test(s)) {
    s = '+' + s;
  }

  return s;
}

module.exports = { cleanWhatsapp };