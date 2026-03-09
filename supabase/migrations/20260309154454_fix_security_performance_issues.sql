/*
  # Fix Security & Performance Issues

  ## Summary
  Addresses all security and performance warnings flagged by Supabase:

  1. Add covering index for unindexed FK on users.referrer_id
  2. Drop duplicate and unused indexes
  3. Remove duplicate permissive policies on transactions
  4. Fix RLS auth function calls to use (select auth.uid()) pattern for performance
  5. Fix always-true RLS policies with proper ownership checks
  6. Fix mutable search_path on all 15 public functions (drop & recreate with SET search_path = '')
*/

-- ─────────────────────────────────────────────
-- 1. Add index for unindexed FK on users.referrer_id
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON public.users (referrer_id);


-- ─────────────────────────────────────────────
-- 2. Drop unused & duplicate indexes
-- ─────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_transactions_user;
DROP INDEX IF EXISTS public.idx_transactions_type;
DROP INDEX IF EXISTS public.idx_transactions_created_at;
DROP INDEX IF EXISTS public.idx_board_entries_user_id;
DROP INDEX IF EXISTS public.idx_board_entries_position;
DROP INDEX IF EXISTS public.idx_board_entries_status;
DROP INDEX IF EXISTS public.idx_users_wallet;
DROP INDEX IF EXISTS public.idx_board_user;
DROP INDEX IF EXISTS public.idx_cycles_user;
DROP INDEX IF EXISTS public.idx_referrals_referrer;
DROP INDEX IF EXISTS public.idx_referrals_referee;
DROP INDEX IF EXISTS public.idx_withdrawals_user;


-- ─────────────────────────────────────────────
-- 3. Fix duplicate permissive policies on transactions
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Transactions insertable by authenticated" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;


-- ─────────────────────────────────────────────
-- 4. Fix RLS auth function re-evaluation issues + always-true policies
-- ─────────────────────────────────────────────

-- users: INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid())::text = id::text);

-- users: SELECT
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- users: UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- transactions: SELECT (fixed + optimized)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (select auth.uid())
        AND u.is_admin = true
    )
  );

-- transactions: INSERT
DROP POLICY IF EXISTS "Service can insert transactions" ON public.transactions;
CREATE POLICY "Service can insert transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- board_entries: SELECT
DROP POLICY IF EXISTS "Users can view their own board entries" ON public.board_entries;
CREATE POLICY "Users can view their own board entries"
  ON public.board_entries
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- board_entries: INSERT
DROP POLICY IF EXISTS "Service can insert board entries" ON public.board_entries;
CREATE POLICY "Service can insert board entries"
  ON public.board_entries
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- board_entries: UPDATE
DROP POLICY IF EXISTS "Service can update board entries" ON public.board_entries;
CREATE POLICY "Service can update board entries"
  ON public.board_entries
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- board_state: remove always-true INSERT/UPDATE (operations go via security definer functions)
DROP POLICY IF EXISTS "Board state insertable by authenticated" ON public.board_state;
DROP POLICY IF EXISTS "Board state updatable by authenticated" ON public.board_state;

-- cycles: INSERT
DROP POLICY IF EXISTS "Users can insert own cycles" ON public.cycles;
CREATE POLICY "Users can insert own cycles"
  ON public.cycles
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- cycles: SELECT
DROP POLICY IF EXISTS "Users can read own cycles" ON public.cycles;
CREATE POLICY "Users can read own cycles"
  ON public.cycles
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- cycles: UPDATE
DROP POLICY IF EXISTS "Users can update own cycles" ON public.cycles;
CREATE POLICY "Users can update own cycles"
  ON public.cycles
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- global_stats: remove always-true UPDATE (only via security definer functions)
DROP POLICY IF EXISTS "Global stats updatable by authenticated" ON public.global_stats;

-- referrals: INSERT
DROP POLICY IF EXISTS "Referrals insertable by authenticated" ON public.referrals;
CREATE POLICY "Referrals insertable by authenticated"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = referrer_id);

-- referrals: SELECT
DROP POLICY IF EXISTS "Users can read referrals involving them" ON public.referrals;
CREATE POLICY "Users can read referrals involving them"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = referrer_id
    OR (select auth.uid()) = referee_id
  );

-- referrals: UPDATE
DROP POLICY IF EXISTS "Referrals updatable by authenticated" ON public.referrals;
CREATE POLICY "Referrals updatable by authenticated"
  ON public.referrals
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = referrer_id)
  WITH CHECK ((select auth.uid()) = referrer_id);

-- withdrawals: INSERT
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals"
  ON public.withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- withdrawals: SELECT
DROP POLICY IF EXISTS "Users can read own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can read own withdrawals"
  ON public.withdrawals
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- withdrawals: UPDATE
DROP POLICY IF EXISTS "Users can update own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can update own withdrawals"
  ON public.withdrawals
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ─────────────────────────────────────────────
-- 5. Fix Function Search Path Mutable
--    Drop then recreate each function with SET search_path = ''
-- ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.add_global_company_fee(numeric);
CREATE FUNCTION public.add_global_company_fee(p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.global_stats SET total_company_fees = COALESCE(total_company_fees, 0) + p_amount WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.add_global_commission(numeric);
CREATE FUNCTION public.add_global_commission(p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.global_stats SET total_commissions_paid = COALESCE(total_commissions_paid, 0) + p_amount WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.add_global_withdrawn(numeric);
CREATE FUNCTION public.add_global_withdrawn(p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.global_stats
  SET total_withdrawn_usd = total_withdrawn_usd + p_amount, updated_at = now()
  WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_global_users();
CREATE FUNCTION public.increment_global_users()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.global_stats (id, total_users, total_cycles_completed, total_withdrawn_usd)
  VALUES (1, 1, 0, 0)
  ON CONFLICT (id) DO UPDATE
  SET total_users = public.global_stats.total_users + 1, updated_at = now();
END;
$$;

DROP FUNCTION IF EXISTS public.increment_global_cycles();
CREATE FUNCTION public.increment_global_cycles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.global_stats
  SET total_cycles_completed = total_cycles_completed + 1, updated_at = now()
  WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_direct_referrals(uuid);
CREATE FUNCTION public.increment_direct_referrals(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.users SET direct_referrals_count = COALESCE(direct_referrals_count, 0) + 1 WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_referral_credits(uuid);
CREATE FUNCTION public.increment_referral_credits(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.users SET referral_credits = referral_credits + 1, updated_at = now() WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_total_referrals_available(uuid);
CREATE FUNCTION public.get_total_referrals_available(p_user_id uuid)
RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(referral_credits, 0) + COALESCE(saved_referrals, 0)
  FROM public.users WHERE id = p_user_id;
$$;

DROP FUNCTION IF EXISTS public.consume_referrals(uuid, integer);
CREATE FUNCTION public.consume_referrals(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_credits integer;
  v_saved integer;
  v_from_credits integer;
  v_from_saved integer;
BEGIN
  SELECT referral_credits, COALESCE(saved_referrals, 0)
  INTO v_credits, v_saved
  FROM public.users WHERE id = p_user_id FOR UPDATE;

  IF v_saved >= p_amount THEN
    v_from_saved := p_amount; v_from_credits := 0;
  ELSE
    v_from_saved := v_saved; v_from_credits := p_amount - v_saved;
  END IF;

  UPDATE public.users
  SET saved_referrals = saved_referrals - v_from_saved,
      referral_credits = referral_credits - v_from_credits,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.store_excess_referrals(uuid, integer);
CREATE FUNCTION public.store_excess_referrals(p_user_id uuid, p_required integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_credits integer;
  v_excess integer;
BEGIN
  SELECT referral_credits INTO v_credits FROM public.users WHERE id = p_user_id FOR UPDATE;
  v_excess := GREATEST(0, v_credits - p_required);
  UPDATE public.users
  SET referral_credits = LEAST(v_credits, p_required),
      saved_referrals = COALESCE(saved_referrals, 0) + v_excess,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.shift_board_slots();
CREATE FUNCTION public.shift_board_slots()
RETURNS TABLE(ejected_user_id uuid, ejected_wallet text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_slot1_user_id uuid;
  v_slot1_wallet text;
BEGIN
  SELECT user_id, wallet_address INTO v_slot1_user_id, v_slot1_wallet
  FROM public.board_state WHERE slot_number = 1;

  UPDATE public.board_state AS target
  SET wallet_address = source.wallet_address, user_id = source.user_id, updated_at = now()
  FROM public.board_state AS source
  WHERE target.slot_number = source.slot_number - 1 AND source.slot_number >= 2;

  UPDATE public.board_state SET wallet_address = NULL, user_id = NULL, updated_at = now()
  WHERE slot_number = 100;

  UPDATE public.board_entries SET position = position - 1, updated_at = now()
  WHERE status = 'active' AND position > 1;

  UPDATE public.board_entries SET position = 1, updated_at = now()
  WHERE status = 'active' AND position = 1;

  RETURN QUERY SELECT v_slot1_user_id, v_slot1_wallet;
END;
$$;

DROP FUNCTION IF EXISTS public.upsert_daily_revenue(numeric, numeric, integer, integer);
CREATE FUNCTION public.upsert_daily_revenue(p_fee numeric, p_withdrawal numeric, p_cycle_count integer, p_new_user integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  today date := CURRENT_DATE;
  prev_cumulative numeric := 0;
BEGIN
  SELECT COALESCE(cumulative_fees, 0) INTO prev_cumulative
  FROM public.revenue_tracking WHERE date = today - 1;

  INSERT INTO public.revenue_tracking (date, daily_fees, daily_withdrawals, daily_cycles, daily_new_users, cumulative_fees)
  VALUES (today, p_fee, p_withdrawal, p_cycle_count, p_new_user, prev_cumulative + p_fee)
  ON CONFLICT (date) DO UPDATE
  SET daily_fees        = public.revenue_tracking.daily_fees + p_fee,
      daily_withdrawals = public.revenue_tracking.daily_withdrawals + p_withdrawal,
      daily_cycles      = public.revenue_tracking.daily_cycles + p_cycle_count,
      daily_new_users   = public.revenue_tracking.daily_new_users + p_new_user,
      cumulative_fees   = public.revenue_tracking.cumulative_fees + p_fee,
      updated_at        = now();
END;
$$;

DROP FUNCTION IF EXISTS public.update_contract_monitor(numeric, text);
CREATE FUNCTION public.update_contract_monitor(p_amount numeric, p_tx_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.contract_monitor
  SET total_paid_out = total_paid_out + p_amount,
      total_transactions = total_transactions + 1,
      total_users_paid = total_users_paid + 1,
      last_tx_hash = p_tx_hash,
      last_synced_at = now()
  WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.toggle_board_paused(boolean, text);
CREATE FUNCTION public.toggle_board_paused(p_paused boolean, p_admin_wallet text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.admin_settings
  SET board_paused = p_paused, updated_at = now(), updated_by = p_admin_wallet
  WHERE id = 1;
END;
$$;

DROP FUNCTION IF EXISTS public.toggle_withdrawals_paused(boolean, text);
CREATE FUNCTION public.toggle_withdrawals_paused(p_paused boolean, p_admin_wallet text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.admin_settings
  SET withdrawals_paused = p_paused, updated_at = now(), updated_by = p_admin_wallet
  WHERE id = 1;
END;
$$;
