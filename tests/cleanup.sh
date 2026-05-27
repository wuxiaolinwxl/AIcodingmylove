#!/usr/bin/env bash
# Clean up users / couples / memories / messages / invitations
# created by smoke tests (rows whose username starts with smoke_).
# Also sweeps orphaned couples/memories/messages with no owning user.
set -e
DB_USER="${DB_USER:-ms_user}"
DB_PASS="${DB_PASS:-ms_password_123}"
DB_NAME="${DB_NAME:-memory_space}"

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<'SQL'
-- 1. Stash couple ids of smoke users into a temp table BEFORE we delete users
DROP TEMPORARY TABLE IF EXISTS _smoke_couples;
CREATE TEMPORARY TABLE _smoke_couples AS
  SELECT DISTINCT coupleId FROM users WHERE username LIKE 'smoke\_%' AND coupleId IS NOT NULL;

DROP TEMPORARY TABLE IF EXISTS _smoke_users;
CREATE TEMPORARY TABLE _smoke_users AS
  SELECT id FROM users WHERE username LIKE 'smoke\_%';

-- 2. Now safe to delete in any order
DELETE FROM messages    WHERE coupleId IN (SELECT coupleId FROM _smoke_couples);
DELETE FROM memories    WHERE coupleId IN (SELECT coupleId FROM _smoke_couples);
DELETE FROM invitations WHERE inviterId IN (SELECT id FROM _smoke_users);
DELETE FROM users       WHERE id IN (SELECT id FROM _smoke_users);
DELETE FROM couples     WHERE id IN (SELECT coupleId FROM _smoke_couples);

-- 3. Sweep any orphans (couples / memories / messages no longer referenced)
DELETE FROM memories WHERE coupleId NOT IN (SELECT id FROM couples);
DELETE FROM messages WHERE coupleId NOT IN (SELECT id FROM couples);
SQL
echo "smoke test data cleaned."
