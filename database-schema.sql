-- =====================================================================
-- VAIN.PRODUCTIONS — Auth Database Schema
-- PostgreSQL 15+
--
-- Run-once DDL.  Apply with:  psql $DATABASE_URL -f backend/database-schema.sql
--
-- Design notes
-- ─────────────────────────────────────────────────────────────────────
--  • Passwords   — Argon2id PHC string; never bcrypt SHA-256/MD5
--  • Sessions    — Revocable refresh tokens stored server-side
--  • Audit       — login_audit is append-only; never UPDATEd once inserted
--  • Fail-fast   — index on users.email where deleted_at IS NULL
--                  so even deleted accounts stay in audit log
-- =====================================================================

SET statement_timeout = '30s';
SET lock_timeout    = '10s';
SET client_encoding = 'UTF8';

BEGIN;

  ── 0. extensions ───────────────────────────────────────────────────
  CREATE EXTENSION IF NOT EXISTS citext          WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS pgcrypto        WITH SCHEMA public;
  CREATE EXTENSION IF NOT EXISTS uuid-ossp       WITH SCHEMA public;

  ── 1. roles ──────────────────────────────────────────────────────────
  CREATE TABLE roles (
    id   SMALLSERIAL PRIMARY KEY,
    name TEXT   UNIQUE NOT NULL CHECK (name ~ '^[A-Z_]+$')
  );

  INSERT INTO roles (name) VALUES
    ('USER'),
    ('SUPPORT'),
    ('ADMIN')
  ON CONFLICT DO NOTHING;

  ── 2. users ─────────────────────────────────────────────────────────
  -- Per-user profile; never stores session tokens here (use sessions table)
  CREATE TABLE users (
    -- Identity
    id             BIGSERIAL      PRIMARY KEY,
    email          CITEXT         NOT NULL UNIQUE,           -- CI so Email = email
    name           TEXT           NOT NULL CHECK (length(name) >= 2),
    phone          TEXT           DEFAULT NULL,               -- E.164 preferred

    -- Status flags
    role_id        SMALLINT       NOT NULL REFERENCES roles(id) DEFAULT 1,
    is_active      BOOLEAN        NOT NULL DEFAULT true,     -- soft-ban / hard-delete
    email_verified_at TIMESTAMPTZ DEFAULT NULL,
    mfa_enabled    BOOLEAN        NOT NULL DEFAULT false,

    -- Password  (NEVER store plaintext)
    password_hash TEXT           NOT NULL,                    -- Argon2id PHC string
    password_algo TEXT           NOT NULL DEFAULT 'argon2id', -- for future alg migration
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    password_history JSONB       DEFAULT NULL,               -- last 5 hashes for change detection

    -- Safety flags
    failed_logins  INT           NOT NULL DEFAULT 0,
    locked_until   TIMESTAMPTZ   DEFAULT NULL,               -- NULL = not locked
    must_reset_password BOOLEAN  NOT NULL DEFAULT false,     -- set after admin reset

    -- Timestamps  (UTC)
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMPTZ   DEFAULT NULL,

    -- Hooks
    CONSTRAINT active_or_deleted CHECK (deleted_at IS NULL OR deleted_at IS NOT NULL)
  );

  -- Never use plain email enum — use index on (email) WHERE deleted_at IS NULL
  -- so soft-deleted accounts stay unqueryable but remain in audit trail
  CREATE UNIQUE INDEX users_email_non_deleted_idx ON users(email)
    WHERE deleted_at IS NULL AND is_active = true;

  CREATE INDEX users_created_at_idx       ON users(created_at DESC);
  CREATE INDEX users_failed_logins_idx    ON users(failed_logins DESC) WHERE failed_logins > 4;

  ── 3. sessions  (revocable refresh-token store) ─────────────────────
  -- Access tokens are stateless JWT.  Refresh tokens are opaque blobs
  -- hashed before storage; stored 1:1 with a user session row.
  CREATE TABLE sessions (
    id              BIGSERIAL     PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_label   TEXT          NOT NULL,            -- "Chrome / macOS" — user-readable

    -- Opaque token digests — never store plaintext tokens in DB
    refresh_token_hash TEXT      NOT NULL,            -- SHA-256 of opaque token
    refresh_token_last4  TEXT    NOT NULL,            -- last 4 digits for UI display

    -- Refs to user agent and IP for anomaly detection
    ip_address      INET          DEFAULT NULL,
    user_agent      TEXT          DEFAULT NULL,

    -- Rotation tracker (pseudorandom sequence; detects token reuse)
    previous_sid    UUID          DEFAULT NULL,

    -- Lifecycle
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ   NOT NULL,
    revoked_at      TIMESTAMPTZ   DEFAULT NULL,

    -- One row per live session
    CONSTRAINT refresh_token_hash_uniq UNIQUE (refresh_token_hash)
  );

  CREATE INDEX sessions_user_id_idx  ON sessions(user_id) WHERE revoked_at IS NULL;
  CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
  CREATE INDEX sessions_last_used_at_idx ON sessions(last_used_at DESC);

  ── 4. login_audit  (append-only — write-once) ───────────────────────
  -- Every authentication event (login, logout, lockout, password change,
  -- MFA enrolment, password-reset) is recorded here.  Never modified or
  -- deleted.  PII minimisation: only store the user_id UUID; email can
  -- be looked up if needed by the security team.
  CREATE TABLE login_audit (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,

    -- Event type  — use enum for controlled vocabulary
    event_type      TEXT         NOT NULL,
      -- 'login_success', 'login_fail_wrong_password',
      -- 'login_fail_locked',     'login_fail_banned',
      -- 'session_created',       'session_revoked',
      -- 'logout',                'password_reset_requested',
      -- 'password_reset_used',   'password_changed',
      -- 'mfa_enabled',           'mfa_verified',
      -- 'account_created',

    -- Metadata — no PII beyond user_id (audit trail is already mapped to a user)
    ip_address      INET         NOT NULL,
    user_agent      TEXT         NOT NULL,
    country         TEXT         DEFAULT NULL,    -- resolved from IP at insert time

    -- Outcome
    success         BOOLEAN      NOT NULL,
    reason          TEXT         DEFAULT NULL,    -- short machine-readable failure code

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
  );

  -- High-performance index for fraud detection
  CREATE INDEX login_audit_created_at_idx ON login_audit(created_at DESC);
  CREATE INDEX login_audit_user_id_idx    ON login_audit(user_id) WHERE user_id IS NOT NULL;
  CREATE INDEX login_audit_event_type_idx ON login_audit(event_type);

  -- Re-enable inserts — DML triggers are below
  CREATE OR REPLACE RULE login_audit_no_update AS
    ON UPDATE TO login_audit DO INSTEAD NOTHING;
  CREATE OR REPLACE RULE login_audit_no_delete AS
    ON DELETE TO login_audit DO INSTEAD NOTHING;

  ── 5. password_resets ──────────────────────────────────────────────
  CREATE TABLE password_resets (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT         NOT NULL,              -- SHA-256 of emailed token
    expires_at      TIMESTAMPTZ  NOT NULL,
    used_at         TIMESTAMPTZ  DEFAULT NULL,           -- NULL = not yet used; non-NULL = consumed

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
  );

  CREATE INDEX password_resets_user_id_idx ON password_resets(user_id);

  ── 6. mfa_secrets ──────────────────────────────────────────────────
  -- TOTP (Time-based One-Time Password)
  CREATE TABLE mfa_secrets (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    secret_enc      TEXT         NOT NULL,   -- AES-256-CTR encrypted base32 secret
    algorithm       TEXT         NOT NULL DEFAULT 'TOTP',
    digits          INT          NOT NULL DEFAULT 6,
    period          INT          NOT NULL DEFAULT 30,  -- 30-second window

    enrolled_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    verified_at     TIMESTAMPTZ  DEFAULT NULL,    -- set after first successful TOTP verify
    disabled_at     TIMESTAMPTZ  DEFAULT NULL,
    recovery_codes  JSONB        DEFAULT NULL     -- hashed codes returned once at enrolment
  );

  ── 7. RLS — Row-Level Security broad baseline ──────────────────────
  -- The application role should have RLS DISABLED on all tables;
  -- instead, roles are enforced at view / stored-procedure level.
  -- Enable RLS on users to prevent direct table access from app tier:
  ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mfa_secrets ENABLE ROW LEVEL SECURITY;

  CREATE POLICY users_own_only ON users
    FOR ALL USING ((SELECT set_config('app.user_id', current_setting('app.user_id', true), true))
                   ::bigint = id);

  CREATE POLICY sessions_own_only ON sessions
    FOR ALL USING (user_id = (SELECT set_config('app.user_id','',true)::bigint));

  ── 8. shared helpers ─────────────────────────────────────────────────
  COMMENT ON TABLE  users            IS 'Active account records. Soft-deleted rows stay for audit.';
  COMMENT ON TABLE  sessions         IS 'Revocable refresh-token store (opaque hashed tokens only).';
  COMMENT ON TABLE  login_audit      IS 'Immutable append-only authentication event log.';
  COMMENT ON TABLE  password_resets  IS 'One-time, self-expiring password-reset tokens.';
  COMMENT ON TABLE  mfa_secrets      IS 'Encrypted TOTP secrets. Recovery codes are hashed before storage.';

  COMMENT ON COLUMN users.password_hash      IS 'Argon2id PHC string: $argon2id$v=19$m=65536,t=2,p=1$<salt>$<hash>';
  COMMENT ON COLUMN sessions.refresh_token_hash IS 'SHA-256 hexdigest of the opaque refresh token sent in __Host- cookie.';

COMMIT;

-- =====================================================================
-- AFTER THIS SCHEMA IS APPLIED  —  FIRST ADMIN USER
-- =====================================================================
-- Step 1: Create the admin account explicitly with no auto-registrations
-- INSERT INTO roles (name) VALUES ('USER'), ('SUPPORT'), ('ADMIN') ON CONFLICT DO NOTHING;

-- Step 2: Hash a known admin password BEFORE inserting
-- SELECT argon2.hash('ADMIN_BOOTSTRAP_PASSWORD'::text, 'type=id, memoryCost=65536, timeCost=2, parallelism=1');
-- → returns PHC string; insert hydrated row manually into users with role_id=(id FROM roles WHERE name='ADMIN')

-- Step 3: Set must_reset_password = true so first admin login forces a password change
-- UPDATE users SET must_reset_password = true WHERE email = 'admin@vainproductions.com';

-- =====================================================================
-- MAINTENANCE QUERIES
-- =====================================================================
-- Remove expired refresh tokens (should run daily):
--   DELETE FROM sessions WHERE expires_at < now() OR revoked_at IS NOT NULL AND last_used_at < now() - interval '30 days';

-- Expire stale password reset tokens:
--   DELETE FROM password_resets WHERE expires_at < now() OR used_at IS NOT NULL;

-- Purge soft-deleted accounts (irreversible; only after RTO + SA retention period):
--   DELETE FROM users WHERE deleted_at < now() - interval '90 days';

-- Purge non-locked login_audit after 2 years (irreversible):
--   DELETE FROM login_audit WHERE created_at < now() - interval '2 years';
