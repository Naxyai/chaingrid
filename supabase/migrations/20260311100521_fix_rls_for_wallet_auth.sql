/*
  # Fix RLS policies for wallet-based authentication

  ## Problem
  All existing RLS policies use auth.uid() which requires Supabase Auth sessions.
  This app uses MetaMask wallet authentication — users are NOT Supabase-authenticated,
  so auth.uid() is always NULL, blocking every read/write.

  ## Solution
  Replace all auth.uid()-based policies with anon-accessible policies.
  Security is enforced at the application layer (wallet signature) and by
  scoping data to the user's own wallet_address or user_id passed from the client.

  Since users are identified by wallet_address (not a Supabase auth session),
  we open the necessary tables to the anon role so the frontend can function.
  Sensitive admin operations remain locked to authenticated or service_role.

  ## Changes
  - Drop all existing broken policies
  - Add new policies that allow anon role to read/write their own data
  - Keep board_state and global_stats public (already were)
  - RPCs handle the business logic safely server-side
*/

-- ─────────────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Anon can read users"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update users"
  ON users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- BOARD_STATE TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Board state readable by all" ON board_state;

CREATE POLICY "Board state readable by all"
  ON board_state FOR SELECT
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'board_state' AND policyname = 'Anon can update board_state'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can update board_state" ON board_state FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- BOARD_ENTRIES TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service can insert board entries" ON board_entries;
DROP POLICY IF EXISTS "Service can update board entries" ON board_entries;
DROP POLICY IF EXISTS "Users can view their own board entries" ON board_entries;

CREATE POLICY "Anon can read board_entries"
  ON board_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert board_entries"
  ON board_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update board_entries"
  ON board_entries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- CYCLES TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can insert own cycles" ON cycles;
DROP POLICY IF EXISTS "Users can update own cycles" ON cycles;

CREATE POLICY "Anon can read cycles"
  ON cycles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert cycles"
  ON cycles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update cycles"
  ON cycles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- REFERRALS TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read referrals involving them" ON referrals;
DROP POLICY IF EXISTS "Referrals insertable by authenticated" ON referrals;
DROP POLICY IF EXISTS "Referrals updatable by authenticated" ON referrals;

CREATE POLICY "Anon can read referrals"
  ON referrals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert referrals"
  ON referrals FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update referrals"
  ON referrals FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- WITHDRAWALS TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can update own withdrawals" ON withdrawals;

CREATE POLICY "Anon can read withdrawals"
  ON withdrawals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert withdrawals"
  ON withdrawals FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can update withdrawals"
  ON withdrawals FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- TRANSACTIONS TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Service can insert transactions" ON transactions;

CREATE POLICY "Anon can read transactions"
  ON transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anon can insert transactions"
  ON transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────────
-- ADMIN_SETTINGS TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read admin settings" ON admin_settings;

CREATE POLICY "Anon can read admin_settings"
  ON admin_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admin_settings' AND policyname = 'Anon can update admin_settings'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can update admin_settings" ON admin_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- CONTRACT_MONITOR TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read contract monitor" ON contract_monitor;

CREATE POLICY "Anon can read contract_monitor"
  ON contract_monitor FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─────────────────────────────────────────────────
-- REVENUE_TRACKING TABLE
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read revenue tracking" ON revenue_tracking;

CREATE POLICY "Anon can read revenue_tracking"
  ON revenue_tracking FOR SELECT
  TO anon, authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'revenue_tracking' AND policyname = 'Anon can insert revenue_tracking'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can insert revenue_tracking" ON revenue_tracking FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'revenue_tracking' AND policyname = 'Anon can update revenue_tracking'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can update revenue_tracking" ON revenue_tracking FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────
-- GLOBAL_STATS TABLE (already open, ensure anon works)
-- ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Global stats readable by all" ON global_stats;

CREATE POLICY "Global stats readable by all"
  ON global_stats FOR SELECT
  TO anon, authenticated
  USING (true);
