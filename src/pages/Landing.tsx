import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, ArrowRight, ChevronRight, TrendingUp, Shield, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBoard } from '../hooks/useBoard';
import Layout from '../components/Layout';
import SlotBoard from '../components/SlotBoard';
import WalletModal from '../components/WalletModal';
import { CYCLE_TABLE } from '../lib/constants';

const statVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

export default function Landing() {
  const { wallet, globalStats } = useApp();
  const { slots } = useBoard();
  const [walletOpen, setWalletOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => (c + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { num: '01', title: 'Connect Wallet', desc: 'Link your MetaMask to BNB Smart Chain and join the platform.', icon: Zap, color: 'blue' },
    { num: '02', title: 'Enter the Board', desc: 'Pay $100 to enter at slot 100. Every new join moves you forward.', icon: ArrowRight, color: 'purple' },
    { num: '03', title: 'Move & Cycle', desc: 'Each new user shifts everyone forward. Reach slot 1 to complete a cycle.', icon: RefreshCw, color: 'yellow' },
    { num: '04', title: 'Earn Rewards', desc: 'Collect your rewards on-chain, auto-roll your stake, and keep going.', icon: Trophy, color: 'green' },
  ];

  return (
    <Layout fullWidth>
    <div className="overflow-x-hidden">
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center py-20">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Live on BNB Smart Chain
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Enter the Board.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Move Forward.
              </span>{' '}
              Complete Cycles.
            </h1>

            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-xl">
              A decentralized gaming platform where every new player moves you closer to your reward.
              100 slots, infinite cycles, on-chain transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {wallet.isConnected ? (
                <Link to="/board" className="btn-primary flex items-center gap-2 justify-center text-base px-6 py-3">
                  <LayoutGrid size={18} />
                  View Live Board
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <button
                  onClick={() => setWalletOpen(true)}
                  className="btn-primary flex items-center gap-2 justify-center text-base px-6 py-3"
                >
                  <Zap size={18} />
                  Connect Wallet
                  <ChevronRight size={16} />
                </button>
              )}
              <Link to="/board" className="btn-secondary flex items-center gap-2 justify-center text-base px-6 py-3">
                View Live Board
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Live Board Preview</h3>
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Real-time
              </div>
            </div>
            <SlotBoard slots={slots} compact />
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Total Players', value: globalStats?.total_users?.toLocaleString() ?? '0', icon: Users, color: 'blue' },
              { label: 'Cycles Completed', value: globalStats?.total_cycles_completed?.toLocaleString() ?? '0', icon: Trophy, color: 'yellow' },
              { label: 'Total Withdrawn', value: `$${(globalStats?.total_withdrawn_usd ?? 0).toLocaleString()}`, icon: TrendingUp, color: 'green' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                variants={statVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <stat.icon size={22} />
                </div>
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
                <div className="text-xs text-gray-600 mt-1">On-chain verified</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Four simple steps to start earning on the ChainGrid platform
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 relative group hover:border-blue-500/30 transition-all"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                  {step.num}
                </div>
                <div className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center ${
                  step.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  step.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  step.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  <step.icon size={20} />
                </div>
                <h3 className="text-white font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Cycle Reward Table</h2>
            <p className="text-gray-400">Transparent reward structure for every cycle</p>
          </motion.div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-6 gap-0 text-xs font-semibold text-gray-400 uppercase tracking-wider p-4 border-b border-white/5">
              <div>Cycle</div>
              <div className="text-center">Deposit</div>
              <div className="text-center">Referrals</div>
              <div className="text-center">Gross</div>
              <div className="text-center">Withdraw</div>
              <div className="text-center">Auto-roll</div>
            </div>
            {CYCLE_TABLE.map((row, i) => (
              <motion.div
                key={row.cycle}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`grid grid-cols-6 gap-0 p-4 text-sm ${
                  i < CYCLE_TABLE.length - 1 ? 'border-b border-white/5' : ''
                } hover:bg-white/2 transition-colors`}
              >
                <div className="font-semibold text-white">{row.cycle}</div>
                <div className="text-center text-gray-300">${row.deposit}</div>
                <div className="text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    row.referrals === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {row.referrals === 0 ? 'None' : `${row.referrals}x`}
                  </span>
                </div>
                <div className="text-center text-yellow-400 font-bold">${row.gross}</div>
                <div className="text-center text-green-400 font-bold">${row.withdrawable}</div>
                <div className="text-center text-blue-400">${row.autoRoll}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-blue-500/20"
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-6 neon-glow-blue">
              <Shield size={28} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Ready to Enter the Grid?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join thousands of players already competing on the ChainGrid board.
              Transparent, on-chain, and rewarding.
            </p>
            {wallet.isConnected ? (
              <Link to="/board" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
                <Zap size={18} />
                Enter the Board
              </Link>
            ) : (
              <button
                onClick={() => setWalletOpen(true)}
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
              >
                <Zap size={18} />
                Connect Wallet
              </button>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-blue-400" />
            <span className="text-white font-bold">ChainGrid</span>
          </div>
          <p>Powered by BNB Smart Chain. Not financial advice.</p>
          <div className="flex gap-4">
            <Link to="/board" className="hover:text-white transition-colors">Board</Link>
            <Link to="/history" className="hover:text-white transition-colors">Transparency</Link>
          </div>
        </div>
      </footer>

      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
    </Layout>
  );
}

function LayoutGrid({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
