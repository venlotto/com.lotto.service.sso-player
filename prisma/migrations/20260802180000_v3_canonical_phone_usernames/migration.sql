-- Player usernames become phone numbers in the canonical local form (0412…).
--
-- The phone IS the username and was stored exactly as typed, so one person
-- could exist as 4120000001, 04120000001 and +584120000001 at once. That makes
-- a player impossible to join against POS purchase records, which is how we
-- determine the bingo cards they own.
--
-- This is a HARD migration: there is no backward-compatible lookup path in the
-- code. After it runs, a username is either a canonical phone or the service's
-- own admin account. The service is not yet in production, so no live player
-- is affected.

-- 1. Canonicalize every username that is unambiguously a Venezuelan mobile.
--    A row that would collide with an existing canonical row is left alone
--    here and removed by step 2 as a stale duplicate.
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

-- 2. Remove what can no longer be a player: malformed numbers that lost a
--    digit (the 9-digit rows), seeded test logins, and any duplicate left by
--    step 1. Lookup is canonical-only now, so these rows can never
--    authenticate again — leaving them would just hold a username hostage.
--
--    'admin' is deliberately KEPT: it is the service's own bootstrap account,
--    not a player, and BootstrapService recreates it on startup anyway, so
--    deleting it would be churn rather than cleanup.
--    users_roles cascades on delete; refresh_tokens carry no FK and are
--    harmless once orphaned.
DELETE FROM users
WHERE username <> 'admin'
  AND username !~ '^0(412|414|416|424|426)[0-9]{7}$';
