import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Users, Target, ChevronRight, Zap, ArrowUp, RotateCcw, AlertCircle, CheckCircle2, ExternalLink, Wallet, TrendingUp, ArrowDownLeft } from 'lucide-react';
import Layout from '../components/Layout';
import SlotBoard from '../components/SlotBoard';
import WalletModal from '../components/WalletModal';
import { useBoard } from '../hooks/useBoard';
import { useApp } from '../context/AppContext';
import { joinBoard, autoRollReentry, manualRollReentry } from '../lib/supabase';
import { sendUSDTDeposit, getUSDTBalance } from '../lib/web3';
import { DEPOSIT_RECEIVER, DEPOSIT_AMOUNT, BSCSCAN_BASE } from '../lib/constants';

export default function Board() {
  const { wallet, user, refreshUser } = useApp();
  const { slots, loading, userSlot, occupiedCount, usersAfterYou, remainingToComplete, lastMoved, recentlyMoved, moveCount, refresh } = useBoard(wallet.address);
  const [walletOpen, setWalletOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [manualRolling, setManualRolling] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const [rollSuccess, setRollSuccess] = useState<'auto' | 'manual' | null>(null);

  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [joinStep, setJoinStep] = useState<'idle' | 'checking' | 'confirm' | 'sending' | 'recording' | 'done'>('idle');

  const rollinBalance = user?.rollin_balance ?? 0;
  const withdrawableBalance = user?.withdrawable_balance ?? 0;
  const totalBalance = rollinBalance + withdrawableBalance;
  const isOnBoard = !!userSlot;
  const canAutoRollin = rollinBalance >= 100 && !isOnBoard;
  const canManualRollin = withdrawableBalance >= 100 && !isOnBoard;

  const handleJoin = async () => {
    if (!wallet.address || !user) return;
    setJoining(true);
    setJoinError(null);
    setDepositTxHash(null);

    try {
      setJoinStep('checking');
      const usdtBalance = await getUSDTBalance(wallet.address);
      if (usdtBalance < DEPOSIT_AMOUNT) {
        throw new Error(
          `Insufficient USDT balance. You need $${DEPOSIT_AMOUNT} USDT BEP20, but have $${usdtBalance.toFixed(2)} USDT.`,
        );
      }

      setJoinStep('sending');
      const txHash = await sendUSDTDeposit(wallet.address, DEPOSIT_RECEIVER, DEPOSIT_AMOUNT);
      setDepositTxHash(txHash);

      setJoinStep('recording');
      await joinBoard(user.id, wallet.address);
      await refresh();
      await refreshUser();
      setJoinStep('done');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join board');
      setJoinStep('idle');
    } finally {
      setJoining(false);
    }
  };

  const joinStepLabel =
    joinStep === 'checking' ? 'Checking balance...' :
    joinStep === 'sending'  ? 'Confirm USDT transfer...' :
    joinStep === 'recording' ? 'Registering contribution...' :
    'Contribute & Join ($100)';

  const handleAutoRollin = async () => {
    if (!wallet.address || !user) return;
    setRolling(true);
    setRollError(null);
    setRollSuccess(null);
    try {
      await autoRollReentry(user.id, wallet.address);
      await refresh();
      await refreshUser();
      setRollSuccess('auto');
      setTimeout(() => setRollSuccess(null), 3000);
    } catch (err) {
      setRollError(err instanceof Error ? err.message : 'Auto roll-in failed');
    } finally {
      setRolling(false);
    }
  };

  const handleManualRollin = async () => {
    if (!wallet.address || !user) return;
    setManualRolling(true);
    setRollError(null);
    setRollSuccess(null);
    try {
      await manualRollReentry(user.id, wallet.address);
      await refresh();
      await refreshUser();
      setRollSuccess('manual');
      setTimeout(() => setRollSuccess(null), 3000);
    } catch (err) {
      setRollError(err instanceof Error ? err.message : 'Manual roll-in failed');
    } finally {
      setManualRolling(false);
    }
  };

  return (
    <Layout fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-white">Live Donation Board</h1>
                <p className="text-gray-400 text-sm mt-1">100 positions · Real-time updates · {moveCount} movements</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-green-400 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </div>
                <button
                  onClick={refresh}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <ArrowUp size={12} />
                  <span>PAYOUT — Position 1 (top-left)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <span>ENTRY — Position 100 (bottom-right)</span>
                  <ArrowUp size={12} className="rotate-180" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <SlotBoard slots={slots} userAddress={wallet.address} lastMoved={lastMoved} recentlyMoved={recentlyMoved} />
              )}
            </motion.div>

            <AnimatePresence>
              {lastMoved && (
                <motion.div
                  key="shift-notice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 flex items-center gap-2"
                >
                  <Zap size={14} />
                  New contribution detected — all members shifted upward toward payout!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:w-72 space-y-4">

            {wallet.isConnected && user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-xl p-5 border border-white/10"
              >
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Wallet size={16} className="text-blue-400" />
                  Your Balances
                </h3>

                <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/20 p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <TrendingUp size={11} />
                      Total Balance
                    </span>
                    <span className="text-white font-black text-lg">${totalBalance.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs text-gray-300">Withdrawable</span>
                    </div>
                    <span className="text-green-400 font-semibold text-sm">${withdrawableBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-400" />
                      <span className="text-xs text-gray-300">Auto-Renew Balance</span>
                    </div>
                    <span className="text-teal-400 font-semibold text-sm">${rollinBalance.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target size={16} className="text-blue-400" />
                Board Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Occupied Slots</span>
                  <span className="text-white font-bold">{occupiedCount} / 100</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupiedCount}%` }}
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400 text-sm">Empty Slots</span>
                  <span className="text-gray-300">{100 - occupiedCount}</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <span className="text-gray-400 text-sm">Total Moves</span>
                  <span className="text-teal-400 font-semibold">{moveCount}</span>
                </div>
              </div>
            </motion.div>

            {wallet.isConnected && userSlot ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 border border-blue-500/20">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  Your Position
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Position</span>
                    <span className="text-blue-400 font-bold text-lg">{userSlot.slot_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Users After You</span>
                    <span className="text-white">{usersAfterYou}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contributions to Payout</span>
                    <span className="text-yellow-400 font-semibold">{remainingToComplete}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress to Payout</span>
                      <span>{Math.round(((100 - userSlot.slot_number) / 99) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((100 - userSlot.slot_number) / 99) * 100}%` }}
                        className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-green-500"
                      />
                    </div>
                  </div>
                </div>

                {user && (rollinBalance >= 100 || withdrawableBalance >= 100) && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold mb-1">
                      <RotateCcw size={12} />
                      Re-entry Ready
                    </div>
                    <p className="text-gray-400 text-xs">
                      Funds queued — will auto-renew when your current round completes.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : wallet.isConnected && !userSlot ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 border border-yellow-500/20 space-y-3">
                <div>
                  <h3 className="text-white font-bold mb-1">Not Yet Participating</h3>
                  <p className="text-gray-400 text-sm">You haven't joined the donation board yet. Send 100 USDT (BEP20) to enter at position 100 (bottom).</p>
                </div>

                {joinError && (
                  <div className="flex items-start gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                {depositTxHash && joinStep === 'recording' && (
                  <div className="flex items-start gap-2 text-blue-400 text-xs p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <CheckCircle2 size={12} className="shrink-0 mt-0.5 text-green-400" />
                    <span className="text-gray-300">
                      Tx sent!{' '}
                      <a
                        href={`${BSCSCAN_BASE}/tx/${depositTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline inline-flex items-center gap-0.5"
                      >
                        View <ExternalLink size={10} />
                      </a>
                    </span>
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {joinStepLabel}
                    </>
                  ) : (
                    <>Contribute & Join ($100) <ChevronRight size={14} /></>
                  )}
                </button>

                {(canAutoRollin || canManualRollin) && (
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Or re-enter from balance</p>

                    {rollError && (
                      <div className="flex items-center gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <AlertCircle size={12} />
                        {rollError}
                      </div>
                    )}

                    {rollSuccess && (
                      <div className="flex items-center gap-2 text-green-400 text-xs p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 size={12} />
                        {rollSuccess === 'auto' ? 'Auto re-entry successful!' : 'Manual re-entry successful!'}
                      </div>
                    )}

                    {canAutoRollin && (
                      <button
                        onClick={handleAutoRollin}
                        disabled={rolling || manualRolling}
                        className="w-full btn-secondary text-sm py-2.5 flex items-center justify-center gap-2"
                      >
                        {rolling ? (
                          <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <RotateCcw size={14} className="text-teal-400" />
                            <span>Auto Re-entry <span className="text-teal-400 font-semibold">${rollinBalance.toFixed(2)}</span></span>
                          </>
                        )}
                      </button>
                    )}

                    {canManualRollin && (
                      <button
                        onClick={handleManualRollin}
                        disabled={rolling || manualRolling}
                        className="w-full text-sm py-2.5 flex items-center justify-center gap-2 rounded-lg border border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {manualRolling ? (
                          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ArrowDownLeft size={14} />
                            <span>Manual Re-entry <span className="font-semibold">${Math.min(withdrawableBalance, 100).toFixed(2)}</span></span>
                          </>
                        )}
                      </button>
                    )}

                    <p className="text-xs text-gray-500 leading-relaxed">
                      Auto re-entry uses your renew balance. Manual re-entry deducts $100 from your withdrawable balance.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">Connect to Participate</h3>
                <p className="text-gray-400 text-sm mb-4">Connect your wallet to join the donation board and start receiving payouts.</p>
                <button onClick={() => setWalletOpen(true)} className="w-full btn-primary text-sm py-2.5">
                  Connect Wallet
                </button>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Platform Rules</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  New members enter at position 100 (bottom)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  Every contribution shifts all members upward by 1
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-green-400 mt-0.5 shrink-0" />
                  Reach position 1 (top) to receive your payout
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                  Auto re-entry uses your renew balance ($100)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-green-400 mt-0.5 shrink-0" />
                  Manual re-entry deducts $100 from withdrawable
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-teal-400 mt-0.5 shrink-0" />
                  Saved referrals auto-applied to next round
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </Layout>
  );
}
