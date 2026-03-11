import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownToLine, Wallet, Shield, CheckCircle, AlertCircle,
  ExternalLink, Loader2, Minus, DollarSign, TrendingUp,
} from 'lucide-react';
import Layout from '../components/Layout';
import WalletModal from '../components/WalletModal';
import { useApp } from '../context/AppContext';
import { requestWithdrawal, executeWithdrawalOnChain } from '../lib/supabase';
import { PLATFORM_FEE_PERCENT, BSCSCAN_BASE } from '../lib/constants';

type Step = 'form' | 'confirming' | 'sending' | 'success';

export default function Withdraw() {
  const { wallet, user, refreshUser } = useApp();
  const [walletOpen, setWalletOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = user?.withdrawable_balance ?? 0;
  const totalBalance = (user?.withdrawable_balance ?? 0) + (user?.rollin_balance ?? 0);
  const parsed = parseFloat(amount) || 0;
  const fee = parsed * (PLATFORM_FEE_PERCENT / 100);
  const net = parsed - fee;
  const isValidAmount = parsed >= 1 && parsed <= available;

  const setPercent = (pct: number) => {
    const amt = (available * pct) / 100;
    setAmount(amt.toFixed(2));
  };

  const handleWithdraw = async () => {
    if (!wallet.address || !user || !isValidAmount) return;
    setError(null);
    setStep('confirming');
    try {
      const withdrawal = await requestWithdrawal(user.id, wallet.address, parsed);
      if (!withdrawal) throw new Error('Failed to create withdrawal record.');
      setStep('sending');
      const result = await executeWithdrawalOnChain(withdrawal.id, wallet.address, net);
      setTxHash(result === 'PENDING_MANUAL' ? withdrawal.id : result);
      await refreshUser();
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed. Please try again.');
      setStep('form');
    }
  };

  const reset = () => {
    setStep('form');
    setAmount('');
    setTxHash(null);
    setError(null);
  };

  if (!wallet.isConnected) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Wallet size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Connect to Withdraw</h2>
            <p className="text-gray-400 mb-6 text-sm">Connect your wallet to access your payouts.</p>
            <button onClick={() => setWalletOpen(true)} className="btn-primary px-8 py-3">
              Connect Wallet
            </button>
          </div>
        </div>
        <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-4">

        <div className="mb-2">
          <h1 className="text-2xl font-black text-white">Withdraw Payouts</h1>
          <p className="text-gray-500 text-sm mt-0.5">USDT on BNB Smart Chain</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'success' ? (
            <motion.div
              key="success"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="glass-card rounded-2xl p-8 text-center border border-green-500/25"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={38} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Withdrawal Submitted!</h2>
              <p className="text-gray-400 mb-1 text-sm">
                <span className="text-green-400 font-bold text-base">${net.toFixed(2)} USDT</span> is being sent to your wallet.
              </p>
              <p className="text-gray-600 text-xs mb-6">Executes on-chain via platform signer on BSC.</p>

              {txHash && (
                <div className="mb-6">
                  {txHash.startsWith('0x') ? (
                    <a
                      href={`${BSCSCAN_BASE}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-400 text-sm hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink size={13} />
                      View on BscScan
                    </a>
                  ) : (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/8 text-xs font-mono text-gray-500 break-all">
                      Request ID: {txHash}
                    </div>
                  )}
                </div>
              )}

              <button onClick={reset} className="btn-secondary text-sm px-6 py-2.5">
                New Withdrawal
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >

              {/* Balance cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-xl p-4 border border-white/6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <DollarSign size={13} className="text-blue-400" />
                    </div>
                    <span className="text-gray-500 text-xs font-medium">Total Balance</span>
                  </div>
                  <p className="text-white font-black text-xl">${totalBalance.toFixed(2)}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">USDT</p>
                </div>

                <div className="glass-card rounded-xl p-4 border border-green-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                      <TrendingUp size={13} className="text-green-400" />
                    </div>
                    <span className="text-gray-500 text-xs font-medium">Available</span>
                  </div>
                  <p className="text-green-400 font-black text-xl">${available.toFixed(2)}</p>
                  <p className="text-gray-600 text-[10px] mt-0.5">Withdrawable</p>
                </div>
              </div>

              {available <= 0 ? (
                <div className="glass-card rounded-xl p-8 text-center border border-white/6">
                  <div className="w-14 h-14 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center mx-auto mb-4">
                    <ArrowDownToLine size={22} className="text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-semibold text-sm">No withdrawable balance</p>
                  <p className="text-gray-600 text-xs mt-1">Complete a round to receive your payout.</p>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-5 border border-white/6 space-y-5">

                  {/* Amount input */}
                  <div>
                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2.5 block">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg select-none">$</span>
                      <input
                        type="number"
                        min="1"
                        max={available}
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-20 py-4 text-white font-black text-2xl focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all placeholder:text-gray-700"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold select-none">USDT</span>
                    </div>

                    {/* Quick % buttons */}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-gray-600 text-xs">
                        Max: <span className="text-gray-400 font-semibold">${available.toFixed(2)}</span>
                      </span>
                      <div className="flex gap-1">
                        {[25, 50, 75, 100].map(pct => (
                          <button
                            key={pct}
                            onClick={() => setPercent(pct)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 border border-white/8 text-gray-500 hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/25 transition-all"
                          >
                            {pct === 100 ? 'MAX' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fee breakdown — shows when amount is entered */}
                  <AnimatePresence>
                    {parsed > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/6 pt-4 space-y-2">
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold mb-3">Breakdown</p>

                          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/3 border border-white/5">
                            <span className="text-gray-400 text-sm">Gross Amount</span>
                            <span className="text-white font-bold text-sm">${parsed.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                            <div className="flex items-center gap-2">
                              <Minus size={12} className="text-red-400" />
                              <span className="text-gray-400 text-sm">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                            </div>
                            <span className="text-red-400 font-bold text-sm">-${fee.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center justify-between py-3 px-3 rounded-xl bg-green-500/8 border border-green-500/20 mt-1">
                            <span className="text-white font-bold">You Receive</span>
                            <span className="text-green-400 font-black text-xl">${net.toFixed(2)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Destination */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Wallet size={14} className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Destination Wallet</p>
                      <p className="text-white text-xs font-mono truncate mt-0.5">{wallet.address}</p>
                    </div>
                    <a
                      href={`${BSCSCAN_BASE}/address/${wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-gray-600 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}

              {/* Info row */}
              <div className="flex items-start gap-2.5 px-1">
                <Shield size={13} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-gray-600 text-xs leading-relaxed">
                  Gas fees are covered by the platform. Net amount is transferred directly to your wallet on BSC.
                </p>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Withdraw button */}
              {available > 0 && (
                <button
                  onClick={handleWithdraw}
                  disabled={!isValidAmount || step !== 'form'}
                  className="w-full py-4 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2.5
                    bg-gradient-to-r from-green-600 to-emerald-500 text-white
                    hover:from-green-500 hover:to-emerald-400
                    disabled:opacity-35 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-600
                    shadow-lg shadow-green-900/25"
                >
                  {step === 'confirming' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating withdrawal...
                    </>
                  ) : step === 'sending' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending on-chain...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine size={18} />
                      {isValidAmount
                        ? `Withdraw $${net.toFixed(2)} USDT`
                        : parsed > available
                        ? 'Exceeds available balance'
                        : 'Enter amount to withdraw'}
                    </>
                  )}
                </button>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
