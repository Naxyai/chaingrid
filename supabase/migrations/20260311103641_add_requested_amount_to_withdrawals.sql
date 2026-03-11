/*
  # Add requested_amount to withdrawals table

  1. Changes
    - `withdrawals` table: add `requested_amount` column (the user-specified partial amount)
      When NULL, the full withdrawable_balance is used (legacy behaviour).

  2. Notes
    - Non-destructive: existing rows will have requested_amount = NULL (treated as full withdrawal)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'requested_amount'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN requested_amount numeric(18,2) DEFAULT NULL;
  END IF;
END $$;
