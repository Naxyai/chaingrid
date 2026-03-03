import { useState, useEffect, useCallback } from 'react';
import { WalletState } from '../types';
import { connectMetaMask, getConnectedAccount, getChainId, onAccountsChanged, onChainChanged } from '../lib/web3';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    error: null,
  });

  const connect = useCallback(async () => {
    setWallet(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const address = await connectMetaMask();
      const chainId = await getChainId();
      setWallet({ address, isConnected: true, isConnecting: false, chainId, error: null });
    } catch (err) {
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: null, isConnected: false, isConnecting: false, chainId: null, error: null });
  }, []);

  useEffect(() => {
    (async () => {
      const address = await getConnectedAccount();
      const chainId = await getChainId();
      if (address) {
        setWallet({ address, isConnected: true, isConnecting: false, chainId, error: null });
      }
    })();

    const removeAccounts = onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWallet({ address: null, isConnected: false, isConnecting: false, chainId: null, error: null });
      } else {
        setWallet(prev => ({ ...prev, address: accounts[0], isConnected: true }));
      }
    });

    const removeChain = onChainChanged((chainId) => {
      setWallet(prev => ({ ...prev, chainId: parseInt(chainId, 16) }));
    });

    return () => {
      removeAccounts();
      removeChain();
    };
  }, []);

  return { wallet, connect, disconnect };
}
