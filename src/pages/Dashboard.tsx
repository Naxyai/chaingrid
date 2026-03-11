import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, RefreshCw, TrendingUp, Users, ArrowDownToLine, Zap, Award, ChevronRight, Gift, Star, DollarSign } from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { useBoard } from '../hooks/useBoard';
import { getUserCycles } from '../lib/supabase';
import { shortenAddress } from '../lib/web3';
import { Cycle } from '../types';
import { getRankInfo, CYCLE1_REFERRALS_REQUIRED, CYCLE2_REFERRALS_REQUIRED, FREE_CYCLE_THRESHOLD, COMMISSION_UNLOCK_CYCLES } from '../lib/constants';

export default function Dashboard() {
  const { wallet, user, refreshUser } = useApp();
  const { userSlot, remainingToComplete, usersAfterYou } = useBoard(wallet.address);
  const [walletOpen, setWalletOpen] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    if (user?.id) {
      getUserCycles(user.id).then(setCycles);
    }
  }, [user?.id]);

  if (!wallet.isConnected) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Wallet size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Connect to Access Dashboard</h2>
            <p className="text-gray-400 mb-6">Link your MetaMask wallet to view your contribution stats, progress, and payouts.</p>
            <button onClick={() => setWalletOpen(true)} className="btn-primary px-6 py-3">Connect Wallet</button>
          </div>
        </div>
        <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      </Layout>
    );
  }

  const totalCycles = user?.total_cycles_completed ?? 0;
  const isPostHundred = totalCycles >= FREE_CYCLE_THRESHOLD;
  const isFirstCycle = (user?.cycle_number ?? 1) === 1;
  const refsRequired = isPostHundred ? 0 : isFirstCycle ? CYCLE1_REFERRALS_REQUIRED : CYCLE2_REFERRALS_REQUIRED;
  const savedRefs = user?.saved_referrals ?? 0;
  const currentCredits = user?.referral_credits ?? 0;
  const totalAvailable = currentCredits + savedRefs;
  const refsStillNeeded = Math.max(0, refsRequired - totalAvailable);
  const rankInfo = getRankInfo(user?.rank ?? 'none');
  const cyclesLeftForVip = Math.max(0, COMMISSION_UNLOCK_CYCLES - totalCycles);

  const statCards = [
    { label: 'Current Round', value: user?.cycle_number ?? 1, sub: 'Active round', icon: RefreshCw, color: 'blue' },
    { label: 'Rounds Completed', value: totalCycles, sub: 'Total completions', icon: Award, color: 'yellow' },
    { label: 'Withdrawable', value: `$${(user?.withdrawable_balance ?? 0).toFixed(2)}`, sub: 'Ready to claim', icon: ArrowDownToLine, color: 'green' },
    { label: 'Commission Earned', value: `$${(user?.commission_earned ?? 0).toFixed(2)}`, sub: 'Total commissions', icon: DollarSign, color: 'teal' },
  ];

  return (
    <Layout>
      <div className="mb-8 mt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 border border-blue-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/20 flex items-center justify-center">
                <Wallet size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Connected Wallet</p>
                <p className="text-white font-mono font-bold">{shortenAddress(wallet.address!, 8)}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs">BNB Smart Chain</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={refreshUser} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
                <RefreshCw size={14} />
                Refresh
              </button>
              <Link to="/withdraw" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <ArrowDownToLine size={14} />
                Withdraw
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-5"
          >
            <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center ${
              stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              stat.color === 'teal' ? 'bg-teal-500/20 text-teal-400' :
              stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              <stat.icon size={18} />
            </div>
            <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-gray-400 text-xs">{stat.label}</div>
            <div className="text-gray-600 text-xs mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`glass-card rounded-xl p-5 border ${rankInfo.borderColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${rankInfo.bgColor}`}>
              <Star size={18} className={rankInfo.color} />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Current Rank</p>
              <p className={`font-black text-lg ${rankInfo.color}`}>{rankInfo.label}</p>
            </div>
          </div>
          {(user?.rank ?? 'none') === 'none' ? (
            <p className="text-gray-500 text-xs">{cyclesLeftForVip} more round{cyclesLeftForVip !== 1 ? 's' : ''} to unlock VIP</p>
          ) : (
            <p className="text-gray-400 text-xs">{rankInfo.commissionRate}% commission on referral withdrawals</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-5 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-yellow-500/20">
              <Gift size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Saved Referrals</p>
              <p className="font-black text-lg text-yellow-400">{savedRefs}</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">Auto-applied to future rounds</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`glass-card rounded-xl p-5 border ${refsStillNeeded > 0 ? 'border-orange-500/20' : 'border-green-500/20'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${refsStillNeeded > 0 ? 'bg-orange-500/20' : 'bg-green-500/20'}`}>
              <Users size={18} className={refsStillNeeded > 0 ? 'text-orange-400' : 'text-green-400'} />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Refs Needed</p>
              <p className={`font-black text-lg ${refsStillNeeded > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {refsStillNeeded === 0 ? 'Ready' : refsStillNeeded}
              </p>
            </div>
          </div>
          <p className="text-gray-500 text-xs">
            {isPostHundred ? 'No referrals required (post 100)' : `${totalAvailable} / ${refsRequired} credits available`}
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            Position Progress
          </h3>

          {userSlot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-gray-300 text-sm">Current Position</span>
                <span className="text-blue-400 font-bold text-xl">{userSlot.slot_number}</span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Position {userSlot.slot_number} → Position 1</span>
                  <span>{Math.round(((100 - userSlot.slot_number) / 99) * 100)}% complete</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((100 - userSlot.slot_number) / 99) * 100}%` }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="text-center p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="text-yellow-400 font-bold text-lg">{remainingToComplete}</div>
                  <div className="text-gray-500 text-xs">Contributions needed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="text-white font-bold text-lg">{usersAfterYou}</div>
                  <div className="text-gray-500 text-xs">After you</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-4">You haven't joined the donation board yet.</p>
              <Link to="/board" className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2">
                <Zap size={14} />
                Join Now
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-5 flex items-center gap-2">
            <Award size={16} className="text-yellow-400" />
            Stake Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/3 border border-white/5">
              <span className="text-gray-400 text-sm">Active Stake</span>
              <span className="text-white font-bold">$100.00</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/3 border border-white/5">
              <span className="text-gray-400 text-sm">Auto-renewed Amount</span>
              <span className="text-blue-400 font-bold">${(user?.auto_rolled_stake ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-gray-300 text-sm">Withdrawable Balance</span>
              <span className="text-green-400 font-bold text-lg">${(user?.withdrawable_balance ?? 0).toFixed(2)}</span>
            </div>
            {(user?.withdrawable_balance ?? 0) > 0 && (
              <Link to="/withdraw" className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                <ArrowDownToLine size={14} />
                Withdraw Now
                <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold flex items-center gap-2">
            <RefreshCw size={16} className="text-blue-400" />
            Recent Rounds
          </h3>
          <Link to="/history" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        {cycles.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No rounds yet. Join the donation board to start!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">Round</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-right">Reward</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {cycles.slice(0, 5).map((cycle) => (
                  <tr key={cycle.id} className="border-b border-white/3">
                    <td className="py-3 text-white">#{cycle.cycle_number}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        cycle.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        cycle.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                        cycle.status === 'no_reward' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {cycle.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-green-400 font-medium">
                      ${cycle.net_reward.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-gray-500 text-xs">
                      {new Date(cycle.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
