import { createClient } from '@supabase/supabase-js';
import {
  FREE_CYCLE_THRESHOLD,
  COMMISSION_UNLOCK_CYCLES,
  CYCLE1_WITHDRAWABLE,
  CYCLE1_AUTOROLL,
  CYCLE1_REFERRALS_REQUIRED,
  CYCLE2_WITHDRAWABLE,
  CYCLE2_AUTOROLL,
  CYCLE2_REFERRALS_REQUIRED,
} from './constants';
import { Rank } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────────────────────────────────────
// User helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrCreateUser(walletAddress: string, referrerAddress?: string) {
  const addr = walletAddress.toLowerCase();
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', addr)
    .maybeSingle();

  if (existing) return existing;

  let referrerId: string | null = null;
  if (referrerAddress) {
    const { data: referrer } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', referrerAddress.toLowerCase())
      .maybeSingle();
    if (referrer) referrerId = referrer.id;
  }

  const { data: created, error } = await supabase
    .from('users')
    .insert({ wallet_address: addr, referrer_id: referrerId })
    .select()
    .maybeSingle();

  if (error) throw error;
  return created;
}

export async function getGlobalStats() {
  const { data } = await supabase
    .from('global_stats')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  return data;
}

export async function getBoardState() {
  const { data } = await supabase
    .from('board_state')
    .select('*')
    .order('slot_number', { ascending: true });
  return data || [];
}

export async function getUserCycles(userId: string) {
  const { data } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('cycle_number', { ascending: false });
  return data || [];
}

export async function getUserWithdrawals(userId: string) {
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getUserReferrals(userId: string) {
  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getUserTransactions(userId: string) {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Rank helpers
// ─────────────────────────────────────────────────────────────────────────────

async function computeRank(userId: string, totalCycles: number): Promise<Rank> {
  if (totalCycles < COMMISSION_UNLOCK_CYCLES) return 'none';

  const { data: directs } = await supabase
    .from('users')
    .select('rank')
    .eq('referrer_id', userId);

  if (!directs || directs.length === 0) return 'vip';

  const rankCounts: Record<string, number> = { none: 0, vip: 0, elite: 0, president: 0, founder: 0 };
  for (const d of directs) rankCounts[d.rank as string] = (rankCounts[d.rank as string] ?? 0) + 1;

  if ((rankCounts.president ?? 0) >= 5 || (rankCounts.founder ?? 0) >= 5) return 'founder';
  if ((rankCounts.elite ?? 0) >= 5) return 'president';
  if ((rankCounts.vip ?? 0) >= 5) return 'elite';
  return 'vip';
}

async function updateUserRank(userId: string, totalCycles: number) {
  const rank = await computeRank(userId, totalCycles);
  await supabase.from('users').update({ rank, updated_at: new Date().toISOString() }).eq('id', userId);
  return rank;
}

// ─────────────────────────────────────────────────────────────────────────────
// Commission distribution
// ─────────────────────────────────────────────────────────────────────────────

async function distributeReferralCommission(userId: string, withdrawableAmount: number) {
  const { data: user } = await supabase.from('users').select('referrer_id').eq('id', userId).maybeSingle();
  if (!user?.referrer_id) return;

  const { data: sponsor } = await supabase
    .from('users')
    .select('id, rank, total_cycles_completed, commission_earned, withdrawable_balance')
    .eq('id', user.referrer_id)
    .maybeSingle();

  if (!sponsor) return;
  if ((sponsor.total_cycles_completed ?? 0) < COMMISSION_UNLOCK_CYCLES) return;
  if (sponsor.rank === 'none') return;

  const rates: Record<string, number> = { vip: 2, elite: 3, president: 4, founder: 5 };
  const rate = rates[sponsor.rank] ?? 0;
  if (rate === 0) return;

  const commission = (withdrawableAmount * rate) / 100;

  await supabase.from('users').update({
    withdrawable_balance: (sponsor.withdrawable_balance ?? 0) + commission,
    commission_earned: (sponsor.commission_earned ?? 0) + commission,
    updated_at: new Date().toISOString(),
  }).eq('id', sponsor.id);

  await supabase.from('transactions').insert({
    user_id: sponsor.id,
    type: 'referral_commission',
    amount: commission,
    description: `${rate}% commission from referral cycle reward`,
    reference_id: userId,
  });

  await supabase.rpc('add_global_commission', { p_amount: commission });
}

// ─────────────────────────────────────────────────────────────────────────────
// Referral helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTotalAvailableReferrals(user: { referral_credits?: number; saved_referrals?: number }) {
  return (user.referral_credits ?? 0) + (user.saved_referrals ?? 0);
}

async function consumeReferralsForCycle(userId: string, required: number) {
  await supabase.rpc('consume_referrals', { p_user_id: userId, p_amount: required });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle completion
// ─────────────────────────────────────────────────────────────────────────────

async function completeCycleForUser(userId: string) {
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!user) return;

  const isFirstCycle = user.cycle_number === 1;
  const isPostHundred = (user.total_cycles_completed ?? 0) >= FREE_CYCLE_THRESHOLD;
  const required = isPostHundred ? 0 : isFirstCycle ? CYCLE1_REFERRALS_REQUIRED : CYCLE2_REFERRALS_REQUIRED;
  const totalAvailable = getTotalAvailableReferrals(user);
  const canComplete = isPostHundred || totalAvailable >= required;

  const withdrawable = isFirstCycle ? CYCLE1_WITHDRAWABLE : CYCLE2_WITHDRAWABLE;
  const autoRoll = isFirstCycle ? CYCLE1_AUTOROLL : CYCLE2_AUTOROLL;
  const gross = withdrawable + autoRoll;

  if (canComplete) {
    if (!isPostHundred) {
      await consumeReferralsForCycle(userId, required);
    }

    const newCyclesCompleted = (user.total_cycles_completed ?? 0) + 1;

    await supabase.from('users').update({
      withdrawable_balance: (user.withdrawable_balance ?? 0) + withdrawable,
      rollin_balance: (user.rollin_balance ?? 0) + autoRoll,
      cycle_number: user.cycle_number + 1,
      total_cycles_completed: newCyclesCompleted,
      current_slot: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    await supabase.from('cycles').insert({
      user_id: userId,
      cycle_number: user.cycle_number,
      deposit: 100,
      gross_reward: gross,
      platform_fee: 0,
      net_reward: withdrawable,
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    await supabase.from('transactions').insert([
      {
        user_id: userId,
        type: 'cycle_reward',
        amount: withdrawable,
        description: `Cycle ${user.cycle_number} reward — withdrawable`,
        reference_id: null,
      },
      {
        user_id: userId,
        type: 'rollin',
        amount: autoRoll,
        description: `Cycle ${user.cycle_number} auto-roll to rollin balance`,
        reference_id: null,
      },
    ]);

    const newRank = await updateUserRank(userId, newCyclesCompleted);
    if (newRank !== 'none') {
      await distributeReferralCommission(userId, withdrawable);
    }

    await supabase.rpc('increment_global_cycles');

    await triggerAutoRollin(userId, user.wallet_address);

  } else if (isFirstCycle) {
    await supabase.from('users').update({
      current_slot: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    await supabase.from('cycles').insert({
      user_id: userId,
      cycle_number: user.cycle_number,
      deposit: 100,
      gross_reward: 0,
      platform_fee: 0,
      net_reward: 0,
      status: 'paused',
      started_at: new Date().toISOString(),
      completed_at: null,
    });
  } else {
    await supabase.from('users').update({
      rollin_balance: (user.rollin_balance ?? 0) + autoRoll,
      cycle_number: user.cycle_number + 1,
      current_slot: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);

    await supabase.from('cycles').insert({
      user_id: userId,
      cycle_number: user.cycle_number,
      deposit: 100,
      gross_reward: autoRoll,
      platform_fee: 0,
      net_reward: 0,
      status: 'no_reward',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'rollin',
      amount: autoRoll,
      description: `Cycle ${user.cycle_number} no_reward — auto-roll only`,
      reference_id: null,
    });

    await triggerAutoRollin(userId, user.wallet_address);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paused cycle unlock
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAndUnlockPausedCycle(userId: string) {
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!user) return;

  const { data: pausedCycle } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'paused')
    .maybeSingle();

  if (!pausedCycle) return;

  const totalAvailable = getTotalAvailableReferrals(user);
  if (totalAvailable < CYCLE1_REFERRALS_REQUIRED) return;

  await consumeReferralsForCycle(userId, CYCLE1_REFERRALS_REQUIRED);

  const newCyclesCompleted = (user.total_cycles_completed ?? 0) + 1;

  await supabase.from('cycles').update({
    status: 'completed',
    gross_reward: CYCLE1_WITHDRAWABLE + CYCLE1_AUTOROLL,
    net_reward: CYCLE1_WITHDRAWABLE,
    completed_at: new Date().toISOString(),
  }).eq('id', pausedCycle.id);

  await supabase.from('users').update({
    withdrawable_balance: (user.withdrawable_balance ?? 0) + CYCLE1_WITHDRAWABLE,
    rollin_balance: (user.rollin_balance ?? 0) + CYCLE1_AUTOROLL,
    cycle_number: user.cycle_number + 1,
    total_cycles_completed: newCyclesCompleted,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await supabase.from('transactions').insert([
    {
      user_id: userId,
      type: 'cycle_reward',
      amount: CYCLE1_WITHDRAWABLE,
      description: `Cycle 1 paused → unlocked reward`,
      reference_id: null,
    },
    {
      user_id: userId,
      type: 'rollin',
      amount: CYCLE1_AUTOROLL,
      description: `Cycle 1 paused → unlocked auto-roll`,
      reference_id: null,
    },
  ]);

  const newRank = await updateUserRank(userId, newCyclesCompleted);
  if (newRank !== 'none') {
    await distributeReferralCommission(userId, CYCLE1_WITHDRAWABLE);
  }
  await supabase.rpc('increment_global_cycles');

  await triggerAutoRollin(userId, user.wallet_address);
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto roll-in — triggered automatically after cycle completes
// ─────────────────────────────────────────────────────────────────────────────

async function triggerAutoRollin(userId: string, walletAddress: string) {
  const { data: freshUser } = await supabase
    .from('users')
    .select('rollin_balance, current_slot')
    .eq('id', userId)
    .maybeSingle();

  if (!freshUser) return;
  if ((freshUser.rollin_balance ?? 0) < 100) return;

  const addr = walletAddress.toLowerCase();
  const { data: existingSlot } = await supabase.from('board_state').select('slot_number').eq('wallet_address', addr).maybeSingle();
  if (existingSlot) return;

  await supabase.from('users').update({
    rollin_balance: (freshUser.rollin_balance ?? 0) - 100,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await performBoardEntry(userId, walletAddress, 'rollin');
}

// ─────────────────────────────────────────────────────────────────────────────
// Core board entry — uses bulk shift RPC
// ─────────────────────────────────────────────────────────────────────────────

async function performBoardEntry(userId: string, walletAddress: string, entryType: 'deposit' | 'rollin') {
  const addr = walletAddress.toLowerCase();

  const { data: slotResult } = await supabase.rpc('shift_board_slots');

  await supabase
    .from('board_state')
    .update({ wallet_address: addr, user_id: userId, updated_at: new Date().toISOString() })
    .eq('slot_number', 100);

  await supabase.from('board_entries').insert({
    user_id: userId,
    wallet_address: addr,
    position: 100,
    entry_type: entryType,
    status: 'active',
  });

  await supabase.from('users').update({ current_slot: 100, updated_at: new Date().toISOString() }).eq('id', userId);

  const ejectedUserId = slotResult?.[0]?.ejected_user_id ?? null;

  if (ejectedUserId) {
    await supabase.from('board_entries')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('user_id', ejectedUserId)
      .eq('status', 'active');

    await completeCycleForUser(ejectedUserId);
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Join board (deposit)
// ─────────────────────────────────────────────────────────────────────────────

export async function joinBoard(userId: string, walletAddress: string, referrerId?: string) {
  const { data: cycleData } = await supabase
    .from('users')
    .select('cycle_number')
    .eq('id', userId)
    .maybeSingle();

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'deposit',
    amount: 100,
    description: `Board entry deposit — Cycle ${cycleData?.cycle_number ?? 1}`,
    reference_id: null,
  });

  await supabase.rpc('increment_global_users');

  if (referrerId) {
    await supabase.from('referrals').insert({ referrer_id: referrerId, referee_id: userId });
    await supabase.rpc('increment_referral_credits', { p_user_id: referrerId });
    await supabase.rpc('increment_direct_referrals', { p_user_id: referrerId });
    await checkAndUnlockPausedCycle(referrerId);
  }

  await performBoardEntry(userId, walletAddress, 'deposit');

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual auto-roll reentry (user-initiated)
// ─────────────────────────────────────────────────────────────────────────────

export async function autoRollReentry(userId: string, walletAddress: string) {
  const { data: user } = await supabase.from('users').select('rollin_balance, current_slot').eq('id', userId).maybeSingle();
  if (!user || (user.rollin_balance ?? 0) < 100) throw new Error('Insufficient rollin balance');

  const addr = walletAddress.toLowerCase();
  const { data: existingSlot } = await supabase.from('board_state').select('slot_number').eq('wallet_address', addr).maybeSingle();
  if (existingSlot) throw new Error('Already on board');

  if ((user.current_slot ?? 0) !== 0) {
    await supabase.from('users').update({ current_slot: 0, updated_at: new Date().toISOString() }).eq('id', userId);
  }

  await supabase.from('users').update({
    rollin_balance: (user.rollin_balance ?? 0) - 100,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await performBoardEntry(userId, walletAddress, 'rollin');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual roll-in using withdrawable balance
// ─────────────────────────────────────────────────────────────────────────────

export async function manualRollReentry(userId: string, walletAddress: string) {
  const { data: user } = await supabase.from('users').select('withdrawable_balance, current_slot').eq('id', userId).maybeSingle();
  if (!user || (user.withdrawable_balance ?? 0) < 100) throw new Error('Insufficient withdrawable balance (need $100)');

  const addr = walletAddress.toLowerCase();
  const { data: existingSlot } = await supabase.from('board_state').select('slot_number').eq('wallet_address', addr).maybeSingle();
  if (existingSlot) throw new Error('Already on board');

  if ((user.current_slot ?? 0) !== 0) {
    await supabase.from('users').update({ current_slot: 0, updated_at: new Date().toISOString() }).eq('id', userId);
  }

  await supabase.from('users').update({
    withdrawable_balance: (user.withdrawable_balance ?? 0) - 100,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'deposit',
    amount: 100,
    description: 'Manual roll-in from withdrawable balance',
    reference_id: null,
  });

  await performBoardEntry(userId, walletAddress, 'rollin');
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal
// ─────────────────────────────────────────────────────────────────────────────

export async function requestWithdrawal(
  userId: string,
  walletAddress: string,
  requestedAmount: number,
) {
  const { data: user } = await supabase
    .from('users')
    .select('withdrawable_balance, total_withdrawn')
    .eq('id', userId)
    .maybeSingle();

  const available = user?.withdrawable_balance ?? 0;
  if (requestedAmount <= 0) throw new Error('Amount must be greater than zero.');
  if (requestedAmount > available) throw new Error(`Requested amount exceeds available balance of $${available.toFixed(2)}.`);

  const platformFee = requestedAmount * 0.1;
  const netAmount = requestedAmount - platformFee;
  const remaining = available - requestedAmount;

  const { data, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      wallet_address: walletAddress.toLowerCase(),
      requested_amount: requestedAmount,
      gross_amount: requestedAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      status: 'pending',
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  await supabase.from('users').update({
    withdrawable_balance: remaining,
    total_withdrawn: (user?.total_withdrawn ?? 0) + netAmount,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  await supabase.from('transactions').insert([
    {
      user_id: userId,
      type: 'withdrawal',
      amount: netAmount,
      description: `Withdrawal of $${netAmount.toFixed(2)} (after 10% fee)`,
      reference_id: data?.id ?? null,
    },
    {
      user_id: userId,
      type: 'withdrawal_fee',
      amount: platformFee,
      description: `10% platform fee on $${requestedAmount.toFixed(2)} withdrawal`,
      reference_id: data?.id ?? null,
    },
  ]);

  await supabase.rpc('add_global_withdrawn', { p_amount: netAmount });
  await supabase.rpc('add_global_company_fee', { p_amount: platformFee });

  return data;
}

export async function executeWithdrawalOnChain(
  withdrawalId: string,
  walletAddress: string,
  netAmount: number,
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${supabaseUrl}/functions/v1/process-withdrawal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? anonKey}`,
      'Apikey': anonKey,
    },
    body: JSON.stringify({
      withdrawal_id: withdrawalId,
      wallet_address: walletAddress,
      net_amount: netAmount,
    }),
  });

  const json = await res.json() as { success?: boolean; tx_hash?: string; error?: string; code?: string };

  if (!res.ok) {
    if (json.code === 'SIGNER_NOT_CONFIGURED') {
      return 'PENDING_MANUAL';
    }
    throw new Error(json.error ?? 'On-chain transfer failed');
  }

  return json.tx_hash ?? 'PENDING_MANUAL';
}
