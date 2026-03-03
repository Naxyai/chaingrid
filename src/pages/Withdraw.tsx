import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, Wallet, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { requestWithdrawal } from '../lib/supabase';
import { PLATFORM_FEE_PERCENT, BSCSCAN_BASE } from '../lib/constants';

export default function Withdraw() {
  const { wallet, user, refreshUser } = useApp();
  const [walletOpen, setWalletOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const gross = user?.withdrawable_balance ?? 0;
  const fee = gross * (PLATFORM_FEE_PERCENT / 100);
  const net = gross - fee;

  const handleWithdraw = async () => {
    if (!wallet.address || !user || gross <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const withdrawal = await requestWithdrawal(user.id, wallet.address, gross);
      setTxHash(withdrawal?.id ?? null);
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Wallet size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Connect to Withdraw</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to withdraw your earnings.</p>
            <button onClick={() => setWalletOpen(true)} className="btn-primary px-6 py-3">Connect Wallet</button>
          </div>
        </div>
        <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Withdraw</h1>
          <p className="text-gray-400">Claim your earnings to your wallet</p>
        </div>

        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-8 text-center border border-green-500/20"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Withdrawal Initiated!</h2>
            <p className="text-gray-400 mb-6">Your withdrawal request has been submitted. Funds will be transferred after verification.</p>
            {txHash && (
              <div className="p-3 rounded-lg bg-slate-800/60 border border-white/10 text-xs font-mono text-gray-300 mb-4 break-all">
                Request ID: {txHash}
              </div>
            )}
            <button onClick={() => { setSuccess(false); setTxHash(null); }} className="btn-secondary text-sm px-4 py-2">
              New Withdrawal
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                <ArrowDownToLine size={16} className="text-green-400" />
                Withdrawal Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/3 border border-white/5">
                  <span className="text-gray-400 text-sm">Gross Reward</span>
                  <span className="text-white font-bold">${gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <span className="text-gray-400 text-sm">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                  <span className="text-red-400">-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-gray-200 font-semibold">Net Withdrawable</span>
                    <span className="text-green-400 font-black text-xl">${net.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Withdrawal is processed by an authorized signer wallet on BNB Smart Chain.</p>
                  <p>Gas fees are covered by the platform. Only net amount is transferred on-chain.</p>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            {gross <= 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 text-center">
                <p className="text-gray-400 text-sm">No withdrawable balance. Complete a cycle to earn rewards.</p>
              </div>
            ) : (
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={18} />
                    Withdraw ${net.toFixed(2)} to Wallet
                  </>
                )}
              </button>
            )}

            <div className="text-center">
              <a
                href={`${BSCSCAN_BASE}/address/${wallet.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 text-xs hover:text-gray-300 inline-flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={11} />
                View on BscScan
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
