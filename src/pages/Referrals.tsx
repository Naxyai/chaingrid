import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, ExternalLink, ChevronRight, Wallet } from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { getUserReferrals } from '../lib/supabase';
import { shortenAddress } from '../lib/web3';
import { Referral } from '../types';

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

  const credited = referrals.filter(r => r.credited).length;
  const pending = referrals.filter(r => !r.credited).length;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Referrals</h1>
        <p className="text-gray-400">Share your link and earn cycle credits</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Referrals', value: referrals.length, color: 'blue', desc: 'All time' },
          { label: 'Credited Cycles', value: credited, color: 'green', desc: 'Used as cycle credits' },
          { label: 'Available Credits', value: user?.referral_credits ?? 0, color: 'yellow', desc: 'Ready to use' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-6 text-center"
          >
            <div className={`text-4xl font-black mb-2 ${
              stat.color === 'blue' ? 'text-blue-400' :
              stat.color === 'green' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {stat.value}
            </div>
            <div className="text-white font-semibold mb-1">{stat.label}</div>
            <div className="text-gray-500 text-xs">{stat.desc}</div>
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
          <h3 className="text-white font-bold mb-4">Referral Rules</h3>
          <div className="space-y-3">
            {[
              { rule: '1 referral = 1 earning cycle credit', color: 'blue' },
              { rule: 'Cycle 1 requires 2 referrals', color: 'yellow' },
              { rule: 'Cycles 2+ require 1 referral each', color: 'blue' },
              { rule: 'Unused referrals roll forward', color: 'green' },
              { rule: 'After 100 cycles, no referral needed', color: 'purple' },
              { rule: 'No credit = cycle completes, no reward', color: 'red' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={14} className={`mt-0.5 shrink-0 ${
                  item.color === 'blue' ? 'text-blue-400' :
                  item.color === 'yellow' ? 'text-yellow-400' :
                  item.color === 'green' ? 'text-green-400' :
                  item.color === 'purple' ? 'text-purple-400' :
                  'text-red-400'
                }`} />
                <span className="text-gray-300 text-sm">{item.rule}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
          <h3 className="text-white font-bold mb-4">Cycle Credit Status</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Available Credits</span>
                <span className="text-yellow-400 font-bold text-2xl">{user?.referral_credits ?? 0}</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">Each credit unlocks one earning cycle</p>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Current Cycle</span>
                <span className="text-blue-400 font-bold text-lg">#{user?.cycle_number ?? 1}</span>
              </div>
            </div>

            {(user?.cycle_number ?? 1) >= 100 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <span className="text-green-400 text-sm font-semibold">Post-100 Milestone Reached!</span>
                <p className="text-gray-400 text-xs mt-1">No referrals needed — earn forever.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-6">
        <h3 className="text-white font-bold mb-5 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Referral History
        </h3>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No referrals yet. Share your link to start earning credits!
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
