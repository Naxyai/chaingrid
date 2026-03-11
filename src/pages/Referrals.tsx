import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, ExternalLink, ChevronRight, Star, DollarSign, Gift } from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { getUserReferrals } from '../lib/supabase';
import { shortenAddress } from '../lib/web3';
import { Referral } from '../types';
import { getRankInfo, RANK_ORDER, RANK_INFO, COMMISSION_UNLOCK_CYCLES } from '../lib/constants';

export default function Referrals() {
  const { wallet, user } = useApp();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const referralLink = wallet.address
    ? `${window.location.origin}?ref=${wallet.address}`
    : '';

  useEffect(() => {
    if (user?.id) {
      getUserReferrals(user.id).then(setReferrals);
    }
  }, [user?.id]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wallet.isConnected) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Users size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Connect to View Referrals</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to see your referral stats and share your link.</p>
            <button onClick={() => setWalletOpen(true)} className="btn-primary px-6 py-3">Connect Wallet</button>
          </div>
        </div>
        <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      </Layout>
    );
  }

  const rankInfo = getRankInfo(user?.rank ?? 'none');
  const cyclesLeft = Math.max(0, COMMISSION_UNLOCK_CYCLES - (user?.total_cycles_completed ?? 0));
  const commissionEarned = user?.commission_earned ?? 0;
  const savedCredits = user?.saved_referrals ?? 0;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Referrals</h1>
        <p className="text-gray-400">Share your link, earn participation credits, and unlock commissions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Referrals', value: referrals.length, color: 'blue', icon: Users },
          { label: 'Direct Referrals', value: user?.direct_referrals_count ?? 0, color: 'green', icon: Users },
          { label: 'Saved Credits', value: savedCredits, color: 'yellow', icon: Gift },
          { label: 'Commission Earned', value: `$${commissionEarned.toFixed(2)}`, color: 'teal', icon: DollarSign },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-5 text-center"
          >
            <div className={`w-9 h-9 rounded-lg mb-3 mx-auto flex items-center justify-center ${
              stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
              stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
              stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-teal-500/20 text-teal-400'
            }`}>
              <stat.icon size={18} />
            </div>
            <div className={`text-2xl font-black mb-1 ${
              stat.color === 'blue' ? 'text-blue-400' :
              stat.color === 'green' ? 'text-green-400' :
              stat.color === 'yellow' ? 'text-yellow-400' :
              'text-teal-400'
            }`}>{stat.value}</div>
            <div className="text-gray-400 text-xs">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 mb-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <ExternalLink size={16} className="text-blue-400" />
          Your Referral Link
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg bg-slate-800/60 border border-white/10 font-mono text-sm text-gray-300 truncate">
            {referralLink}
          </div>
          <button
            onClick={copyLink}
            className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all flex items-center gap-2 ${
              copied
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-400" />
            Rank & Commission Tiers
          </h3>
          <div className="space-y-2">
            {RANK_ORDER.filter(r => r !== 'none').map((rankKey) => {
              const info = RANK_INFO[rankKey];
              const isCurrentRank = (user?.rank ?? 'none') === rankKey;
              return (
                <div
                  key={rankKey}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isCurrentRank
                      ? `${info.bgColor} ${info.borderColor}`
                      : 'bg-white/3 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isCurrentRank && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                    <span className={`text-sm font-semibold ${isCurrentRank ? info.color : 'text-gray-400'}`}>
                      {info.label}
                    </span>
                    {isCurrentRank && <span className="text-xs text-green-400 font-medium">Current</span>}
                  </div>
                  <span className={`text-sm font-bold ${isCurrentRank ? info.color : 'text-gray-500'}`}>
                    {info.commissionRate}%
                  </span>
                </div>
              );
            })}
          </div>
          {(user?.rank ?? 'none') === 'none' && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
              {cyclesLeft} more round{cyclesLeft !== 1 ? 's' : ''} needed to unlock VIP rank & commissions
            </div>
          )}
          {(user?.rank ?? 'none') !== 'none' && (
            <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              Commission rate: {rankInfo.commissionRate}% on all referrals' withdrawable earnings
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Referral Rules</h3>
          <div className="space-y-2.5">
            {[
              { rule: '1 referral = 1 participation credit', color: 'blue' },
              { rule: 'Round 1 requires 2 referral credits', color: 'yellow' },
              { rule: 'Rounds 2+ require 1 referral credit each', color: 'blue' },
              { rule: 'Round 1 pauses if 2 refs not met at position 1', color: 'orange' },
              { rule: 'Unused credits saved for future rounds', color: 'green' },
              { rule: 'After 100 rounds, no referrals needed', color: 'teal' },
              { rule: 'No credit in round 2+ = no payout, auto-renew only', color: 'red' },
              { rule: 'Commissions unlock after 25 completed rounds', color: 'yellow' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={12} className={`mt-0.5 shrink-0 ${
                  item.color === 'blue' ? 'text-blue-400' :
                  item.color === 'yellow' ? 'text-yellow-400' :
                  item.color === 'green' ? 'text-green-400' :
                  item.color === 'teal' ? 'text-teal-400' :
                  item.color === 'orange' ? 'text-orange-400' :
                  'text-red-400'
                }`} />
                <span className="text-gray-300 text-xs">{item.rule}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {savedCredits > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5 mb-6 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Gift size={18} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Saved Referral Credits</p>
                <p className="text-gray-400 text-xs">Will be used automatically in upcoming rounds</p>
              </div>
            </div>
            <div className="text-yellow-400 font-black text-2xl">{savedCredits}</div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Referral History
        </h3>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No referrals yet. Share your link to start earning participation credits!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                  <th className="pb-3 font-medium">Referee</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id} className="border-b border-white/3">
                    <td className="py-3 font-mono text-gray-300 text-xs">{shortenAddress(ref.referee_id, 6)}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ref.credited ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {ref.credited ? 'Credited' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500 text-xs">
                      {new Date(ref.created_at).toLocaleDateString()}
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
