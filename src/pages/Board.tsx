import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Users, Target, ChevronRight, Zap, ArrowUp, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import SlotBoard from '../components/SlotBoard';
import WalletModal from '../components/WalletModal';
import { useBoard } from '../hooks/useBoard';
import { useApp } from '../context/AppContext';
import { joinBoard, autoRollReentry } from '../lib/supabase';

export default function Board() {
  const { wallet, user, refreshUser } = useApp();
  const { slots, loading, userSlot, occupiedCount, usersAfterYou, remainingToComplete, lastMoved, moveCount, refresh } = useBoard(wallet.address);
  const [walletOpen, setWalletOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const [rollSuccess, setRollSuccess] = useState(false);

  const rollinBalance = user?.rollin_balance ?? 0;
  const isOnBoard = !!userSlot;
  const canRollin = rollinBalance >= 100 && !isOnBoard;

  const handleJoin = async () => {
    if (!wallet.address || !user) return;
    setJoining(true);
    setJoinError(null);
    try {
      await joinBoard(user.id, wallet.address);
      await refresh();
      await refreshUser();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join board');
    } finally {
      setJoining(false);
    }
  };

  const handleRollin = async () => {
    if (!wallet.address || !user) return;
    setRolling(true);
    setRollError(null);
    setRollSuccess(false);
    try {
      await autoRollReentry(user.id, wallet.address);
      await refresh();
      await refreshUser();
      setRollSuccess(true);
      setTimeout(() => setRollSuccess(false), 3000);
    } catch (err) {
      setRollError(err instanceof Error ? err.message : 'Roll-in failed');
    } finally {
      setRolling(false);
    }
  };

  return (
    <Layout fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-white">Live Board</h1>
                <p className="text-gray-400 text-sm mt-1">100 slots · Real-time updates · {moveCount} moves</p>
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
                  <span>EXIT — Slot 1 (top-left)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                  <span>ENTRY — Slot 100 (bottom-right)</span>
                  <ArrowUp size={12} className="rotate-180" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <SlotBoard slots={slots} userAddress={wallet.address} lastMoved={lastMoved} />
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
                  New join detected — all users shifted upward toward exit!
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:w-72 space-y-4">
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
                    <span className="text-gray-400">Current Slot</span>
                    <span className="text-blue-400 font-bold text-lg">{userSlot.slot_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Users After You</span>
                    <span className="text-white">{usersAfterYou}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Joins to Cycle</span>
                    <span className="text-yellow-400 font-semibold">{remainingToComplete}</span>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress to Cycle</span>
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
              </motion.div>
            ) : wallet.isConnected && !userSlot ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 border border-yellow-500/20 space-y-3">
                <div>
                  <h3 className="text-white font-bold mb-1">Not on Board</h3>
                  <p className="text-gray-400 text-sm">You haven't entered the board yet. Pay $100 to join at slot 100 (bottom).</p>
                </div>

                {joinError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={12} />
                    {joinError}
                  </div>
                )}

                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  {joining ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Enter Board ($100) <ChevronRight size={14} /></>
                  )}
                </button>

                {canRollin && (
                  <div className="border-t border-white/5 pt-3">
                    <p className="text-xs text-gray-400 mb-2">
                      Auto-Roll Balance: <span className="text-teal-400 font-semibold">${rollinBalance.toFixed(2)}</span>
                    </p>

                    {rollError && (
                      <div className="flex items-center gap-2 text-red-400 text-xs p-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-2">
                        <AlertCircle size={12} />
                        {rollError}
                      </div>
                    )}

                    {rollSuccess && (
                      <div className="flex items-center gap-2 text-green-400 text-xs p-2 rounded-lg bg-green-500/10 border border-green-500/20 mb-2">
                        <CheckCircle2 size={12} />
                        Roll-in successful!
                      </div>
                    )}

                    <button
                      onClick={handleRollin}
                      disabled={rolling}
                      className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2"
                    >
                      {rolling ? (
                        <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <RotateCcw size={14} className="text-teal-400" />
                          Auto Roll-in ($100)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
                <h3 className="text-white font-bold mb-2">Connect to Play</h3>
                <p className="text-gray-400 text-sm mb-4">Connect your wallet to join the board and start earning.</p>
                <button onClick={() => setWalletOpen(true)} className="w-full btn-primary text-sm py-2.5">
                  Connect Wallet
                </button>
              </motion.div>
            )}

            {wallet.isConnected && user && (user.rollin_balance ?? 0) >= 100 && isOnBoard && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-4 border border-teal-500/20">
                <div className="flex items-center gap-2 text-teal-400 text-sm font-semibold mb-1">
                  <RotateCcw size={14} />
                  Roll-in Ready
                </div>
                <p className="text-gray-400 text-xs">
                  ${(user.rollin_balance ?? 0).toFixed(2)} queued — will auto-enter when your current cycle completes.
                </p>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Board Rules</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  New users enter at slot 100 (bottom)
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  Every join shifts all users upward by 1
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-green-400 mt-0.5 shrink-0" />
                  Reach slot 1 (top) to complete a cycle
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                  Roll-in auto-re-enters after cycle completes
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={12} className="text-teal-400 mt-0.5 shrink-0" />
                  Saved referrals auto-applied to next cycle
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
