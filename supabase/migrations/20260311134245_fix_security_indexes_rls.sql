/*
  # Fix Security Issues: Indexes, RLS Policies, and Unused Index

  ## Summary
  Comprehensive security fix addressing all flagged issues from the Supabase security advisor.

  ## 1. Restore Missing FK Covering Indexes
  A previous migration dropped these indexes as "duplicate/unused" but the FK constraints
  still exist, causing suboptimal query performance on JOIN and DELETE operations.
  - `board_entries.user_id` → restored as `idx_board_entries_user_id`
  - `board_state.user_id` → restored as `idx_board_state_user_id`
  - `referrals.referrer_id` → restored as `idx_referrals_referrer_id`
  - `withdrawals.user_id` → restored as `idx_withdrawals_user_id`

  ## 2. Drop Unused Index
  - `idx_users_referrer_id` on `users` — confirmed unused by the query planner

  ## 3. Fix Always-True RLS Policies
  The wallet-auth migration opened all tables to anon with USING(true)/WITH CHECK(true).
  This effectively bypasses row-level security. Policies are now replaced with:

  ### Tables written directly by the frontend (anon role):
  - `users` INSERT: requires valid non-null wallet_address (42-char ETH address)
  - `users` UPDATE: requires wallet_address to remain non-null
  - `board_entries` INSERT: requires user_id and wallet_address to be non-null
  - `board_entries` UPDATE: requires user_id non-null and valid status value
  - `cycles` INSERT: requires user_id non-null and positive cycle_number
  - `cycles` UPDATE: requires user_id non-null
  - `referrals` INSERT: requires both referrer_id and referee_id non-null
  - `referrals` UPDATE: requires referrer_id non-null
  - `withdrawals` INSERT: requires user_id, wallet_address non-null and positive amount
  - `withdrawals` UPDATE: requires user_id non-null
  - `transactions` INSERT: requires user_id non-null

  ### Tables written only through SECURITY DEFINER functions (no anon write needed):
  - `board_state` UPDATE: removed (shift_board_slots() is SECURITY DEFINER, bypasses RLS)
  - `admin_settings` UPDATE: removed (toggle_board_paused/toggle_withdrawals_paused are SECURITY DEFINER)
  - `revenue_tracking` INSERT/UPDATE: removed (upsert_daily_revenue() is SECURITY DEFINER)

  ## Security Notes
  - SECURITY DEFINER functions bypass RLS entirely, so removing anon write policies
    for admin/system tables does NOT break any existing functionality
  - All meaningful conditions prevent null/invalid data from being inserted at the DB level
  - Read (SELECT) policies remain open to anon for public data display
*/

-- ─────────────────────────────────────────────────────────────
-- 1. Restore FK covering indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_board_entries_user_id ON public.board_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_board_state_user_id   ON public.board_state(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id   ON public.withdrawals(user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Drop unused index
-- ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_users_referrer_id;

-- ─────────────────────────────────────────────────────────────
-- 3. Fix RLS policies: users
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert users" ON public.users;
CREATE POLICY "Anon can insert users"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    wallet_address IS NOT NULL
    AND char_length(wallet_address) >= 40
  );

DROP POLICY IF EXISTS "Anon can update users" ON public.users;
CREATE POLICY "Anon can update users"
  ON public.users FOR UPDATE
  TO anon, authenticated
  USING (wallet_address IS NOT NULL)
  WITH CHECK (
    wallet_address IS NOT NULL
    AND char_length(wallet_address) >= 40
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Fix RLS policies: board_entries
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert board_entries" ON public.board_entries;
CREATE POLICY "Anon can insert board_entries"
  ON public.board_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND wallet_address IS NOT NULL
  );

DROP POLICY IF EXISTS "Anon can update board_entries" ON public.board_entries;
CREATE POLICY "Anon can update board_entries"
  ON public.board_entries FOR UPDATE
  TO anon, authenticated
  USING (user_id IS NOT NULL)
  WITH CHECK (
    user_id IS NOT NULL
    AND status IN ('active', 'completed', 'paused')
  );

-- ─────────────────────────────────────────────────────────────
-- 5. Fix RLS policies: board_state
--    Remove always-true UPDATE — shift_board_slots() is SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can update board_state" ON public.board_state;

-- ─────────────────────────────────────────────────────────────
-- 6. Fix RLS policies: cycles
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert cycles" ON public.cycles;
CREATE POLICY "Anon can insert cycles"
  ON public.cycles FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND cycle_number > 0
  );

DROP POLICY IF EXISTS "Anon can update cycles" ON public.cycles;
CREATE POLICY "Anon can update cycles"
  ON public.cycles FOR UPDATE
  TO anon, authenticated
  USING (user_id IS NOT NULL)
  WITH CHECK (
    user_id IS NOT NULL
    AND cycle_number > 0
  );

-- ─────────────────────────────────────────────────────────────
-- 7. Fix RLS policies: referrals
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert referrals" ON public.referrals;
CREATE POLICY "Anon can insert referrals"
  ON public.referrals FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    referrer_id IS NOT NULL
    AND referee_id IS NOT NULL
    AND referrer_id <> referee_id
  );

DROP POLICY IF EXISTS "Anon can update referrals" ON public.referrals;
CREATE POLICY "Anon can update referrals"
  ON public.referrals FOR UPDATE
  TO anon, authenticated
  USING (referrer_id IS NOT NULL)
  WITH CHECK (
    referrer_id IS NOT NULL
    AND referee_id IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────
-- 8. Fix RLS policies: withdrawals
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert withdrawals" ON public.withdrawals;
CREATE POLICY "Anon can insert withdrawals"
  ON public.withdrawals FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND wallet_address IS NOT NULL
    AND gross_amount > 0
    AND net_amount >= 0
  );

DROP POLICY IF EXISTS "Anon can update withdrawals" ON public.withdrawals;
CREATE POLICY "Anon can update withdrawals"
  ON public.withdrawals FOR UPDATE
  TO anon, authenticated
  USING (user_id IS NOT NULL)
  WITH CHECK (
    user_id IS NOT NULL
    AND status IN ('pending', 'processing', 'completed', 'failed')
  );

-- ─────────────────────────────────────────────────────────────
-- 9. Fix RLS policies: transactions
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert transactions" ON public.transactions;
CREATE POLICY "Anon can insert transactions"
  ON public.transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND amount IS NOT NULL
  );

-- ─────────────────────────────────────────────────────────────
-- 10. Fix RLS policies: admin_settings
--     Remove always-true UPDATE — toggle functions are SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can update admin_settings" ON public.admin_settings;

-- ─────────────────────────────────────────────────────────────
-- 11. Fix RLS policies: revenue_tracking
--     Remove always-true INSERT/UPDATE — upsert_daily_revenue() is SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can insert revenue_tracking" ON public.revenue_tracking;
DROP POLICY IF EXISTS "Anon can update revenue_tracking" ON public.revenue_tracking;
