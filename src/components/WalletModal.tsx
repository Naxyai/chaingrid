import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isMetaMaskAvailable } from '../lib/web3';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { wallet, connect } = useApp();

  const handleConnect = async () => {
    await connect();
    if (!wallet.error) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-md relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="glass-card rounded-2xl p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-4 neon-glow-blue">
                  <Wallet className="text-blue-400" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                <p className="text-gray-400 text-sm">Connect to BNB Smart Chain to play</p>
              </div>

              {wallet.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2"
                >
                  <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-400 text-sm">{wallet.error}</p>
                </motion.div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleConnect}
                  disabled={wallet.isConnecting}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 hover:bg-orange-500/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <img src="https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?w=40&h=40&fit=crop" alt="" className="w-6 h-6 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <Wallet size={20} className="text-orange-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">MetaMask</p>
                    <p className="text-gray-400 text-xs">{isMetaMaskAvailable() ? 'Ready to connect' : 'Install MetaMask'}</p>
                  </div>
                  {wallet.isConnecting && (
                    <div className="ml-auto w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs text-gray-500">
                    <span className="px-2 bg-[#0a0e1a]">or</span>
                  </div>
                </div>

                <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/20 transition-all opacity-60 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <ExternalLink size={18} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-semibold">WalletConnect</p>
                    <p className="text-gray-400 text-xs">Coming soon</p>
                  </div>
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-6">
                Network will auto-switch to{' '}
                <span className="text-yellow-400 font-medium">BNB Smart Chain</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
