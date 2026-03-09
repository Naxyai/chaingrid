import { useState, useEffect, useCallback, useRef } from 'react';
import { BoardSlot } from '../types';
import { supabase, getBoardState } from '../lib/supabase';

export function useBoard(userAddress?: string | null) {
  const [slots, setSlots] = useState<BoardSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMoved, setLastMoved] = useState<number | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const lastMovedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const data = await getBoardState();
    setSlots(data as BoardSlot[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('board_state_live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'board_state' }, (payload) => {
        const updatedSlot = payload.new as BoardSlot;
        setSlots(prev => {
          const next = [...prev];
          const idx = next.findIndex(s => s.slot_number === updatedSlot.slot_number);
          if (idx !== -1) next[idx] = updatedSlot;
          return next;
        });
        if (updatedSlot.slot_number === 100 && updatedSlot.wallet_address) {
          setMoveCount(c => c + 1);
          if (lastMovedTimer.current) clearTimeout(lastMovedTimer.current);
          setLastMoved(100);
          lastMovedTimer.current = setTimeout(() => setLastMoved(null), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (lastMovedTimer.current) clearTimeout(lastMovedTimer.current);
    };
  }, [refresh]);

  const userSlot = slots.find(
    s => s.wallet_address?.toLowerCase() === userAddress?.toLowerCase()
  );

  const occupiedCount = slots.filter(s => s.wallet_address !== null).length;
  const usersAfterYou = userSlot
    ? slots.filter(s => s.slot_number > userSlot.slot_number && s.wallet_address !== null).length
    : 0;
  const remainingToComplete = userSlot ? Math.max(0, userSlot.slot_number - 1) : 99;

  return {
    slots,
    loading,
    userSlot,
    occupiedCount,
    usersAfterYou,
    remainingToComplete,
    lastMoved,
    moveCount,
    refresh,
  };
}
