/**
 * Venezuelan mobile phone normalization.
 *
 * The player's phone IS their username, and it has historically been stored
 * exactly as typed. That produced several shapes for the same person
 * (`4120000001`, `04120000001`, `+584120000001`, `0412-000-0001`), which makes
 * a player impossible to join reliably against anything else — notably the POS
 * purchase records that determine which bingo cards they own.
 *
 * The canonical form is the local one people actually write and read:
 * a leading zero plus ten digits — `04120000001`.
 */

/** Venezuelan mobile prefixes, without the leading zero. */
const MOBILE_PREFIXES = ["412", "414", "416", "424", "426"] as const;

/** Canonical length: leading zero + 10 digits. */
const CANONICAL_LENGTH = 11;

/**
 * Reduces any accepted phone shape to the canonical `0XXXXXXXXXX` form.
 *
 * Returns `null` when the input cannot be a Venezuelan mobile number, so
 * callers must decide explicitly what to do rather than silently storing junk.
 */
export function normalizeVePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Strip the country code in either of its written forms (+58 / 0058 / 58).
  if (digits.startsWith("0058")) digits = digits.slice(4);
  else if (digits.startsWith("58") && digits.length > 10) digits = digits.slice(2);

  // Work from the national 10-digit core, then re-add the canonical zero.
  const national = digits.startsWith("0") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  if (!MOBILE_PREFIXES.some((p) => national.startsWith(p))) return null;

  return `0${national}`;
}

/**
 * Returns true when the value is already in canonical form.
 */
export function isCanonicalVePhone(value: string | null | undefined): boolean {
  return !!value && value.length === CANONICAL_LENGTH && normalizeVePhone(value) === value;
}

/**
 * Every historical spelling of a phone, most-canonical first.
 *
 * Existing rows predate normalization, so a lookup that only tried the
 * canonical form would lock out every player already registered. Callers try
 * these in order and, on a legacy hit, should upgrade the stored value.
 */
export function phoneLookupCandidates(raw: string | null | undefined): string[] {
  const canonical = normalizeVePhone(raw);
  const candidates: string[] = [];

  if (canonical) {
    candidates.push(canonical); // 04120000001
    candidates.push(canonical.slice(1)); // 4120000001  (legacy, no leading zero)
    candidates.push(`58${canonical.slice(1)}`); // 584120000001
    candidates.push(`+58${canonical.slice(1)}`); // +584120000001
  }

  // Always keep the raw input as a last resort: it covers non-mobile and
  // non-phone usernames (staff logins such as "admin") unchanged.
  const trimmed = (raw ?? "").trim();
  if (trimmed && !candidates.includes(trimmed)) candidates.push(trimmed);

  return candidates;
}
