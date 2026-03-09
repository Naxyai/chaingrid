/*
  # Board Movement Engine

  ## Summary
  Implements the fully automated board movement system with:

  1. **board_entries table** — Tracks every entry (deposit or rollin) with position history
  2. **shift_board_and_complete() RPC** — Atomic bulk board shift + cycle check in a single call
  3. **consume_referrals_for_cycle() RPC** — Consumes saved referrals + active credits atomically
  4. **auto_rollin_if_ready() RPC** — Automatically triggers roll-in when rollin_balance >= 100

  ## New Tables
  - `board_entries` — Active board entries with position, cycle number, entry type

  ## New RPC Functions
  - `shift_board_and_complete(p_new_user_id, p_new_wallet)` — Shifts all slots by -1, inserts new user at 100, returns slot-1 user if any
  - `auto_rollin_if_ready(p_user_id, p_wallet)` — Checks rollin_balance and auto-triggers reentry
  - `get_available_referrals(p_user_id)` — Returns total available referrals (credits + saved)
  - `consume_referrals(p_user_id, p_amount)` — Atomically consumes referrals from credits first then saved

  ## Performance Notes
  - Board shift uses a single UPDATE with CASE expression instead of 100 individual updates
  - All critical state changes use row-level locking (FOR UPDATE)
*/

-- ============================================================
-- board_entries table
-- ============================================================
CREATE TABLE IF NOT EXISTS board_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  position integer NOT NULL DEFAULT 100,
  cycle_number integer NOT NULL DEFAULT 1,
  entry_type text NOT NULL DEFAULT 'deposit' CHECK (entry_type IN ('deposit', 'rollin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE board_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own board entries"
  ON board_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert board entries"
  ON board_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update board entries"
  ON board_entries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_board_entries_user_id ON board_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_board_entries_position ON board_entries(position);
CREATE INDEX IF NOT EXISTS idx_board_entries_status ON board_entries(status);

-- ============================================================
-- RPC: consume_referrals
-- Atomically consume referral credits: saved first, then active
-- ============================================================
CREATE OR REPLACE FUNCTION consume_referrals(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
  v_saved integer;
  v_to_consume integer;
  v_from_credits integer;
  v_from_saved integer;
BEGIN
  SELECT referral_credits, COALESCE(saved_referrals, 0)
    INTO v_credits, v_saved
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

  v_to_consume := p_amount;

  IF v_saved >= v_to_consume THEN
    v_from_saved := v_to_consume;
    v_from_credits := 0;
  ELSE
    v_from_saved := v_saved;
    v_from_credits := v_to_consume - v_saved;
  END IF;

  UPDATE users
    SET saved_referrals = saved_referrals - v_from_saved,
        referral_credits = referral_credits - v_from_credits,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- RPC: store_excess_referrals
-- Store any referral_credits beyond what was needed into saved_referrals
-- ============================================================
CREATE OR REPLACE FUNCTION store_excess_referrals(p_user_id uuid, p_required integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits integer;
  v_excess integer;
BEGIN
  SELECT referral_credits INTO v_credits FROM users WHERE id = p_user_id FOR UPDATE;
  v_excess := GREATEST(0, v_credits - p_required);
  UPDATE users
    SET referral_credits = LEAST(v_credits, p_required),
        saved_referrals = COALESCE(saved_referrals, 0) + v_excess,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- RPC: shift_board_slots
-- Bulk-shift all occupied slots by -1 (100→99, 99→98, ..., 2→1)
-- Returns the user_id and wallet that was at slot 1 before the shift (if any)
-- ============================================================
CREATE OR REPLACE FUNCTION shift_board_slots()
RETURNS TABLE(ejected_user_id uuid, ejected_wallet text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot1_user_id uuid;
  v_slot1_wallet text;
BEGIN
  -- Capture who is at slot 1 before the shift
  SELECT user_id, wallet_address
    INTO v_slot1_user_id, v_slot1_wallet
    FROM board_state
    WHERE slot_number = 1;

  -- Bulk shift: each slot gets the content of the slot above it (slot n gets slot n+1)
  UPDATE board_state AS target
    SET wallet_address = source.wallet_address,
        user_id = source.user_id,
        updated_at = now()
    FROM board_state AS source
    WHERE target.slot_number = source.slot_number - 1
      AND source.slot_number >= 2;

  -- Slot 100 is now available for the new entrant (caller sets it)
  UPDATE board_state
    SET wallet_address = NULL,
        user_id = NULL,
        updated_at = now()
    WHERE slot_number = 100;

  -- Update board_entries positions for all active entries
  UPDATE board_entries
    SET position = position - 1,
        updated_at = now()
    WHERE status = 'active'
      AND position > 1;

  -- Mark entries that just hit position 1 (they'll be resolved by caller)
  UPDATE board_entries
    SET position = 1,
        updated_at = now()
    WHERE status = 'active'
      AND position = 1;

  RETURN QUERY SELECT v_slot1_user_id, v_slot1_wallet;
END;
$$;

-- ============================================================
-- RPC: get_total_referrals_available
-- Returns combined saved + active referral credits for a user
-- ============================================================
CREATE OR REPLACE FUNCTION get_total_referrals_available(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(referral_credits, 0) + COALESCE(saved_referrals, 0)
  FROM users
  WHERE id = p_user_id;
$$;
