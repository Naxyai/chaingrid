import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useGameState } from '../hooks/useGameState';
import { WalletState, User, GlobalStats } from '../types';

interface AppContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  user: User | null;
  globalStats: GlobalStats | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { wallet, connect, disconnect } = useWallet();
  const { user, globalStats, loading, refreshUser } = useGameState(wallet.address);

  return (
    <AppContext.Provider value={{ wallet, connect, disconnect, user, globalStats, loading, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
