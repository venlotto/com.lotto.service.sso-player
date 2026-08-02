-- Canonicalize player phone usernames to the local 0-prefixed form (0412…).
--
-- The phone IS the username and was stored exactly as typed, producing several
-- spellings for the same person. That makes a player impossible to join
-- reliably against POS purchase records, which is how we determine the bingo
-- cards they own.
--
-- Only unambiguous Venezuelan mobile numbers are touched. Anything else
-- (staff logins like 'admin', malformed 9-digit rows) is deliberately left
-- alone rather than guessed at.

-- Rows that would collide with an existing canonical row are skipped: the
-- canonical row wins and the legacy duplicate is left for manual review.
WITH candidate AS (
  SELECT
    id,
    username,
    '0' || regexp_replace(
             regexp_replace(username, '^(\+?58|0058)', ''),
             '^0', ''
           ) AS canonical
  FROM users
  WHERE username ~ '^(\+?58|0058)?0?(412|414|416|424|426)[0-9]{7}$'
)
UPDATE users u
SET username = c.canonical
FROM candidate c
WHERE u.id = c.id
  AND u.username <> c.canonical
  AND NOT EXISTS (SELECT 1 FROM users x WHERE x.username = c.canonical);
