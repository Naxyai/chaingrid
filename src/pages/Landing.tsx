import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Users, Trophy, ArrowRight, ChevronRight, TrendingUp, Shield,
  RefreshCw, Lock, Globe, CheckCircle, ChevronDown, GitBranch, DollarSign,
  BarChart2, Cpu, Star, ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBoard } from '../hooks/useBoard';
import Layout from '../components/Layout';
import SlotBoard from '../components/SlotBoard';
import WalletModal from '../components/WalletModal';
import Footer from '../components/Footer';
import { CYCLE_TABLE, RANK_INFO, RANK_ORDER } from '../lib/constants';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay },
});

function LayoutGridIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

const FAQ_ITEMS = [
  { q: 'What is ChainGrid?', a: 'ChainGrid is a decentralized board game on BNB Smart Chain. Players enter a 100-slot board, and every new participant shifts everyone forward one position. Reach slot 1 to complete a cycle and earn rewards.' },
  { q: 'How much does it cost to enter?', a: 'The entry deposit is $100 USDT (BEP-20). After your first cycle, your stake auto-rolls forward so you never have to manually re-deposit.' },
  { q: 'Are the rewards automatic?', a: "Yes. Smart contracts handle all reward calculations and payouts on-chain. No admin can freeze or withhold funds — it's fully non-custodial." },
  { q: 'What are referral commissions?', a: 'Referring new players unlocks commissions based on your rank (VIP: 2%, Elite: 3%, President: 4%, Founder: 5%). Commissions are paid per cycle completion.' },
  { q: 'What is the Auto-Roll mechanic?', a: "When you complete a cycle, $100 of your reward is automatically re-entered into the next cycle as your deposit. This compounds your position without any action required." },
  { q: 'How are ranks determined?', a: "Ranks are earned by completing cycles and building a referral network. VIP requires 25 cycles, higher ranks require direct referrals of the same rank tier below you." },
];

export default function Landing() {
  const { wallet, globalStats } = useApp();
  const { slots } = useBoard();
  const [walletOpen, setWalletOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Layout fullWidth>
      <div className="overflow-x-hidden">

        {/* HERO */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-4">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-500/3 rounded-full blur-3xl" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center py-20">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Live on BNB Smart Chain
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
                Enter the Board.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-green-400">
                  Move Forward.
                </span>{' '}
                Earn Rewards.
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-xl">
                A decentralized on-chain board game where every new player moves you closer to your reward.
                100 slots, infinite cycles, transparent mechanics — no trust required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                {wallet.isConnected ? (
                  <Link to="/board" className="btn-primary flex items-center gap-2 justify-center text-base px-7 py-3.5">
                    <LayoutGridIcon size={18} />
                    View Live Board
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <button onClick={() => setWalletOpen(true)} className="btn-primary flex items-center gap-2 justify-center text-base px-7 py-3.5">
                    <Zap size={18} />
                    Connect Wallet
                    <ChevronRight size={16} />
                  </button>
                )}
                <Link to="/board" className="btn-secondary flex items-center gap-2 justify-center text-base px-7 py-3.5">
                  <LayoutGridIcon size={18} />
                  View Live Board
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                {[
                  { icon: Lock,        text: 'Non-Custodial' },
                  { icon: Globe,       text: 'Permissionless' },
                  { icon: CheckCircle, text: 'On-Chain Verified' },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-1.5">
                    <b.icon size={14} className="text-green-400" />
                    {b.text}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Live Board Preview</h3>
                  <div className="flex items-center gap-1.5 text-xs text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Real-time
                  </div>
                </div>
                <SlotBoard slots={slots} compact />
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-white font-black text-lg">{globalStats?.total_users ?? 0}</div>
                    <div className="text-gray-500 text-[10px]">Players</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-yellow-400 font-black text-lg">{globalStats?.total_cycles_completed ?? 0}</div>
                    <div className="text-gray-500 text-[10px]">Cycles</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/3 border border-white/5">
                    <div className="text-green-400 font-black text-lg">${(globalStats?.total_withdrawn_usd ?? 0).toLocaleString()}</div>
                    <div className="text-gray-500 text-[10px]">Paid Out</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* LIVE STATS */}
        <section className="py-16 px-4 bg-white/1 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Total Players',    value: globalStats?.total_users?.toLocaleString() ?? '0',                      icon: Users,      color: 'blue' },
                { label: 'Cycles Completed', value: globalStats?.total_cycles_completed?.toLocaleString() ?? '0',            icon: Trophy,     color: 'yellow' },
                { label: 'Total Paid Out',   value: `$${(globalStats?.total_withdrawn_usd ?? 0).toLocaleString()}`,          icon: TrendingUp, color: 'green' },
                { label: 'Commissions Paid', value: `$${(globalStats?.total_commissions_paid ?? 0).toLocaleString()}`,       icon: DollarSign, color: 'teal' },
              ].map((stat, i) => (
                <motion.div key={stat.label} {...fadeUp(i * 0.1)} className="text-center">
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    'bg-teal-500/20 text-teal-400'
                  }`}><stat.icon size={22} /></div>
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">On-chain verified</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-4">
                Simple Mechanics
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">How ChainGrid Works</h2>
              <p className="text-gray-400 max-w-xl mx-auto text-lg">
                Four steps from wallet connection to earning on-chain rewards
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: '01', title: 'Connect Wallet',  desc: 'Link MetaMask to BNB Smart Chain. The platform is completely non-custodial — your keys, your funds.', icon: Zap, color: 'blue' },
                { num: '02', title: 'Enter the Board', desc: 'Deposit $100 USDT to join at slot 100. Every new entrant moves everyone forward one position automatically.', icon: ArrowRight, color: 'teal' },
                { num: '03', title: 'Move & Cycle',    desc: "As new players join, your slot number decreases. Reach slot 1 and your cycle is complete — smart contract pays you instantly.", icon: RefreshCw, color: 'yellow' },
                { num: '04', title: 'Earn & Roll',     desc: '$100 of your reward auto-rolls into the next cycle. Withdraw the rest directly to your wallet anytime.', icon: Trophy, color: 'green' },
              ].map((step, i) => (
                <motion.div key={step.num} {...fadeUp(i * 0.1)} className="glass-card rounded-2xl p-6 relative group hover:border-white/15 transition-all border border-white/6">
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-500">
                    {step.num}
                  </div>
                  <div className={`w-11 h-11 rounded-xl mb-5 flex items-center justify-center ${
                    step.color === 'blue'   ? 'bg-blue-500/20 text-blue-400' :
                    step.color === 'teal'   ? 'bg-teal-500/20 text-teal-400' :
                    step.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    <step.icon size={22} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ADVANCED FEATURES */}
        <section className="py-24 px-4 bg-white/1 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs mb-4">
                Advanced Features
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Platform Features</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Designed for transparency, fairness, and compounding growth</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Cpu,        color: 'blue',   badge: 'Fully Automated',  title: 'Smart Contract Engine',    desc: 'All board movements, cycle completions, and reward distributions are executed autonomously by audited BSC smart contracts. Zero human intervention.' },
                { icon: GitBranch,  color: 'orange', badge: 'Up to 5% Commission', title: 'Multi-Level Referrals', desc: 'Build your referral network to unlock passive commission income. Each rank tier unlocks higher commission percentages on every cycle your referrals complete.' },
                { icon: RefreshCw,  color: 'teal',   badge: 'Set & Forget',     title: 'Auto-Roll Compounding',    desc: 'Your $100 stake automatically re-enters the next cycle. Compound your position without manual actions — the board engine handles everything.' },
                { icon: BarChart2,  color: 'green',  badge: '5 Rank Tiers',     title: 'Rank Progression',         desc: 'Progress from Unranked to Founder through cycle completions and referral building. Each rank unlocks higher commission rates and platform privileges.' },
                { icon: Lock,       color: 'yellow', badge: 'Self-Sovereign',   title: 'Non-Custodial',            desc: "Your funds are never held by ChainGrid. Smart contracts custody assets during active cycles. Withdrawals go directly on-chain to your wallet — no KYC, no gatekeeping." },
                { icon: Globe,      color: 'cyan',   badge: 'Open to All',      title: 'Permissionless Access',    desc: 'Any wallet on BNB Smart Chain can participate. No registration, no approval process. Connect your wallet and join the next available slot instantly.' },
              ].map((feat, i) => {
                const clrMap: Record<string, string> = {
                  blue:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  teal:   'bg-teal-500/20 text-teal-400 border-teal-500/30',
                  green:  'bg-green-500/20 text-green-400 border-green-500/30',
                  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  cyan:   'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                };
                const clr = clrMap[feat.color];
                return (
                  <motion.div key={feat.title} {...fadeUp(i * 0.08)} className="glass-card rounded-2xl p-6 border border-white/6 hover:border-white/12 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${clr}`}>
                        <feat.icon size={20} />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clr}`}>{feat.badge}</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-2">{feat.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RANK SYSTEM */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs mb-4">
                Commission System
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Rank & Commission Tiers</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Build your network and earn passive income as your referrals cycle</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {RANK_ORDER.filter(r => r !== 'none').map((rank, i) => {
                const info = RANK_INFO[rank];
                const gradMap: Record<string, string> = {
                  vip:       'from-blue-500/20 to-blue-600/5 border-blue-500/25',
                  elite:     'from-cyan-500/20 to-cyan-600/5 border-cyan-500/25',
                  president: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/25',
                  founder:   'from-green-500/20 to-green-600/5 border-green-500/25',
                };
                return (
                  <motion.div key={rank} {...fadeUp(i * 0.1)} className={`rounded-2xl p-6 border bg-gradient-to-b ${gradMap[rank] ?? ''} text-center`}>
                    <div className={`w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center ${info.bgColor} border ${info.borderColor}`}>
                      <Star size={20} className={info.color} />
                    </div>
                    <div className={`text-base font-black mb-1 ${info.color}`}>{info.label}</div>
                    <div className="text-4xl font-black text-white mb-1">{info.commissionRate}%</div>
                    <div className="text-gray-400 text-xs mb-4">Per cycle commission</div>
                    <div className={`text-xs px-3 py-1.5 rounded-lg ${info.bgColor} ${info.color} border ${info.borderColor} leading-relaxed`}>
                      {info.requirement}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CYCLE REWARD TABLE */}
        <section className="py-16 px-4 bg-white/1 border-y border-white/5">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs mb-4">
                Transparent Economics
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Cycle Reward Table</h2>
              <p className="text-gray-400">Fixed, on-chain reward structure — no surprises</p>
            </motion.div>

            <motion.div {...fadeUp(0.1)} className="glass-card rounded-2xl overflow-hidden">
              <div className="grid grid-cols-6 gap-0 text-xs font-semibold text-gray-400 uppercase tracking-wider p-4 border-b border-white/5 bg-white/2">
                <div>Cycle</div>
                <div className="text-center">Deposit</div>
                <div className="text-center">Referrals</div>
                <div className="text-center">Gross</div>
                <div className="text-center">Withdraw</div>
                <div className="text-center">Auto-Roll</div>
              </div>
              {CYCLE_TABLE.map((row, i) => (
                <div key={row.cycle} className={`grid grid-cols-6 gap-0 p-4 text-sm ${i < CYCLE_TABLE.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/2 transition-colors`}>
                  <div className="font-bold text-white">{row.cycle}</div>
                  <div className="text-center text-gray-300">${row.deposit}</div>
                  <div className="text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.referrals === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {row.referrals === 0 ? 'None' : `${row.referrals}x`}
                    </span>
                  </div>
                  <div className="text-center text-yellow-400 font-bold">${row.gross}</div>
                  <div className="text-center text-green-400 font-bold">${row.withdrawable}</div>
                  <div className="text-center text-blue-400">${row.autoRoll}</div>
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="grid sm:grid-cols-3 gap-4 mt-6">
              {[
                { icon: Shield,     color: 'blue',  title: '10% Platform Fee',    desc: 'Applies only on withdrawals, not on auto-rolled stakes.' },
                { icon: RefreshCw,  color: 'teal',  title: 'Infinite Cycles',     desc: "No limit on how many cycles you can complete. Each cycle's $100 auto-rolls." },
                { icon: TrendingUp, color: 'green', title: 'Compounding Returns', desc: 'Cycle rewards increase as you build referral networks and climb ranks.' },
              ].map(card => {
                const clr = { blue: 'bg-blue-500/20 text-blue-400', teal: 'bg-teal-500/20 text-teal-400', green: 'bg-green-500/20 text-green-400' }[card.color];
                return (
                  <div key={card.title} className="glass-card rounded-xl p-4 flex gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${clr}`}>
                      <card.icon size={16} />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{card.title}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{card.desc}</div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* SECURITY & TRANSPARENCY */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp()}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs mb-6">
                  Security & Trust
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">Built for Security.<br />Designed for Trust.</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Every reward, movement, and payout is executed on-chain by smart contracts. No admin has the power to pause your earnings, freeze your funds, or alter the board mechanics.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Lock,        title: 'Non-Custodial Funds',  desc: 'Smart contracts hold deposits during active cycles only. Completed rewards go directly to your wallet.' },
                    { icon: CheckCircle, title: 'Auditable On-Chain',   desc: 'Every transaction is permanently recorded on BNB Smart Chain. Verify any action on BscScan.' },
                    { icon: Shield,      title: 'No Admin Backdoors',   desc: 'Contracts are immutable post-deployment. The team cannot modify reward logic or halt payouts.' },
                    { icon: Globe,       title: 'Open Participation',   desc: 'No KYC, no whitelists. Any BNB Smart Chain wallet can join immediately.' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon size={14} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{item.title}</div>
                        <div className="text-gray-500 text-xs leading-relaxed mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div {...fadeUp(0.15)} className="space-y-4">
                <div className="glass-card rounded-2xl p-6 border border-green-500/15">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 font-semibold text-sm">Contracts Live on BSC</span>
                  </div>
                  <div className="space-y-0">
                    {[
                      { label: 'Network',      value: 'BNB Smart Chain (BSC)' },
                      { label: 'Chain ID',     value: '56' },
                      { label: 'Token',        value: 'USDT BEP-20' },
                      { label: 'Entry Cost',   value: '$100 USDT' },
                      { label: 'Platform Fee', value: '10% on withdrawal' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-2.5 border-b border-white/5 last:border-0 text-sm">
                        <span className="text-gray-400">{row.label}</span>
                        <span className="text-white font-medium">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <a href="https://bscscan.com" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    <ArrowUpRight size={12} />View on BscScan
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: '100',   color: 'text-white',   label: 'Board Slots' },
                    { value: '$200',  color: 'text-yellow-400', label: 'Cycle 1 Payout' },
                    { value: '5%',    color: 'text-green-400',  label: 'Max Commission' },
                    { value: '∞',     color: 'text-blue-400',   label: 'Cycles Possible' },
                  ].map(c => (
                    <div key={c.label} className="glass-card rounded-xl p-4 text-center border border-white/5">
                      <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
                      <div className="text-gray-400 text-xs mt-1">{c.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-4 bg-white/1 border-y border-white/5">
          <div className="max-w-3xl mx-auto">
            <motion.div {...fadeUp()} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs mb-4">
                FAQ
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Frequently Asked Questions</h2>
            </motion.div>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <motion.div key={i} {...fadeUp(i * 0.06)} className="glass-card rounded-xl border border-white/6 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-colors"
                  >
                    <span className="text-white font-semibold text-sm">{item.q}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {item.a}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div {...fadeUp()} className="glass-card rounded-3xl p-10 sm:p-16 text-center border border-blue-500/15 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-blue-500/8 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-6">
                  <Shield size={28} className="text-blue-400" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Enter the Grid?</h2>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
                  Join thousands of players already cycling on ChainGrid. Connect your wallet, deposit once, and let the board engine work for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {wallet.isConnected ? (
                    <Link to="/board" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
                      <Zap size={18} />Enter the Board
                    </Link>
                  ) : (
                    <button onClick={() => setWalletOpen(true)} className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5">
                      <Zap size={18} />Connect Wallet
                    </button>
                  )}
                  <Link to="/history" className="btn-secondary inline-flex items-center gap-2 text-base px-8 py-3.5">
                    View History
                  </Link>
                </div>
                <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" />No KYC</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" />No Registration</span>
                  <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" />Instant Entry</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </Layout>
  );
}
