import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LayoutGrid, Users, ArrowDownToLine, History, Shield, Menu, X, LogOut, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { shortenAddress } from '../lib/web3';
import WalletModal from './WalletModal';

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/board', label: 'Board', icon: LayoutGrid },
  { to: '/dashboard', label: 'Dashboard', icon: Zap },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { to: '/history', label: 'History', icon: History },
];

const bottomTabLinks = [
  { to: '/board', label: 'Board', icon: LayoutGrid },
  { to: '/dashboard', label: 'Dashboard', icon: Zap },
  { to: '/referrals', label: 'Referrals', icon: Users },
  { to: '/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { to: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const { wallet, disconnect, user } = useApp();
  const location = useLocation();
  const [walletOpen, setWalletOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/5"
        style={{ background: 'rgba(6,9,20,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Zap size={16} className="text-blue-400" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">
                Chain<span className="text-blue-400">Grid</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.slice(1).map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === to
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
              {user?.is_admin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                  }`}
                >
                  <Shield size={14} />
                  Admin
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {wallet.isConnected && wallet.address ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm font-mono">{shortenAddress(wallet.address)}</span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Disconnect"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setWalletOpen(true)}
                  className="btn-primary text-sm px-3 py-1.5 hidden sm:block"
                >
                  Connect
                </button>
              )}

              <button
                onClick={() => setMobileOpen(v => !v)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="md:hidden border-t border-white/5"
              style={{ background: 'rgba(6,9,20,0.98)' }}
            >
              <div className="px-4 pt-3 pb-4 space-y-1">
                {navLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === to
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/25'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                ))}
                {user?.is_admin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === '/admin'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/25'
                        : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-500/8'
                    }`}
                  >
                    <Shield size={17} />
                    Admin
                  </Link>
                )}

                <div className="pt-2 border-t border-white/5">
                  {wallet.isConnected && wallet.address ? (
                    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-sm font-mono">{shortenAddress(wallet.address)}</span>
                      </div>
                      <button
                        onClick={() => { disconnect(); setMobileOpen(false); }}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <LogOut size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setWalletOpen(true); setMobileOpen(false); }}
                      className="w-full btn-primary py-3 text-sm"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/8"
        style={{ background: 'rgba(6,9,20,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {bottomTabLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-0 flex-1 ${
                  active ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  active ? 'bg-blue-500/20 border border-blue-500/30' : ''
                }`}>
                  <Icon size={17} />
                </div>
                <span className="text-[10px] font-medium truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
