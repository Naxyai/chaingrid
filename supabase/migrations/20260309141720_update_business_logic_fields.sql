/*
  # Update Business Logic Fields

  1. Modified Tables
    - `users`: Added saved_referrals, direct_referrals_count, rank, rollin_balance, total_withdrawn, commission_earned, referrer_id
  2. New Tables
    - `transactions`: Full ledger of all money movements
  3. Modified Tables
    - `global_stats`: Added total_company_fees, total_commissions_paid
  4. New RPC Functions
    - increment_direct_referrals
    - add_global_company_fee
    - add_global_commission
  5. New RLS policies for transactions table
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'saved_referrals') THEN
    ALTER TABLE users ADD COLUMN saved_referrals integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'direct_referrals_count') THEN
    ALTER TABLE users ADD COLUMN direct_referrals_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rank') THEN
    ALTER TABLE users ADD COLUMN rank text DEFAULT 'none';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'rollin_balance') THEN
    ALTER TABLE users ADD COLUMN rollin_balance numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_withdrawn') THEN
    ALTER TABLE users ADD COLUMN total_withdrawn numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'commission_earned') THEN
    ALTER TABLE users ADD COLUMN commission_earned numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referrer_id') THEN
    ALTER TABLE users ADD COLUMN referrer_id uuid REFERENCES users(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_stats' AND column_name = 'total_company_fees') THEN
    ALTER TABLE global_stats ADD COLUMN total_company_fees numeric(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'global_stats' AND column_name = 'total_commissions_paid') THEN
    ALTER TABLE global_stats ADD COLUMN total_commissions_paid numeric(10,2) DEFAULT 0;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit','cycle_reward','rollin','referral_commission','withdrawal','withdrawal_fee')),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  reference_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions"
      ON transactions FOR SELECT
      TO authenticated
      USING (auth.uid()::text = user_id::text OR EXISTS (SELECT 1 FROM users WHERE id = user_id AND is_admin = true));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Service can insert transactions') THEN
    CREATE POLICY "Service can insert transactions"
      ON transactions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE OR REPLACE FUNCTION increment_direct_referrals(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users SET direct_referrals_count = COALESCE(direct_referrals_count, 0) + 1 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_global_company_fee(p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE global_stats SET total_company_fees = COALESCE(total_company_fees, 0) + p_amount WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_global_commission(p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE global_stats SET total_commissions_paid = COALESCE(total_commissions_paid, 0) + p_amount WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
