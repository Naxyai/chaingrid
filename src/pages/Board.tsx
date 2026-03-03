import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Users, Target, ChevronRight, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import SlotBoard from '../components/SlotBoard';
import WalletModal from '../components/WalletModal';
import { useBoard } from '../hooks/useBoard';
import { useApp } from '../context/AppContext';
import { joinBoard } from '../lib/supabase';

export default function Board() {
  const { wallet, user, refreshUser } = useApp();
  const { slots, loading, userSlot, occupiedCount, usersAfterYou, remainingToComplete, lastMoved, refresh } = useBoard(wallet.address);
  const [walletOpen, setWalletOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

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

  return (
    <Layout fullWidth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-white">Live Board</h1>
                <p className="text-gray-400 text-sm mt-1">100 slots · Real-time updates</p>
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
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <SlotBoard slots={slots} userAddress={wallet.address} lastMoved={lastMoved} />
              )}
            </motion.div>

            {lastMoved && (
              <motion.div
                key={lastMoved}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400 flex items-center gap-2"
              >
                <Zap size={14} />
                New join detected — all users shifted forward!
              </motion.div>
            )}
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
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-400 text-sm">Empty Slots</span>
                  <span className="text-gray-300">{100 - occupiedCount}</span>
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5 border border-yellow-500/20">
                <h3 className="text-white font-bold mb-2">Not on Board</h3>
                <p className="text-gray-400 text-sm mb-4">You haven't entered the board yet. Pay $100 to join at slot 100.</p>
                {joinError && <p className="text-red-400 text-xs mb-3">{joinError}</p>}
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

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Board Rules</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2"><ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />New users enter at slot 100</li>
                <li className="flex items-start gap-2"><ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />Every join shifts all users forward by 1</li>
                <li className="flex items-start gap-2"><ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />Reach slot 1 to complete a cycle</li>
                <li className="flex items-start gap-2"><ChevronRight size={12} className="text-blue-400 mt-0.5 shrink-0" />99 joins needed per cycle completion</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </Layout>
  );
}
