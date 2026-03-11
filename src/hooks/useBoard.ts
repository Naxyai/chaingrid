import { useState, useEffect, useCallback, useRef } from 'react';
import { BoardSlot } from '../types';
import { supabase, getBoardState } from '../lib/supabase';

export function useBoard(userAddress?: string | null) {
  const [slots, setSlots] = useState<BoardSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMoved, setLastMoved] = useState<number | null>(null);
  const [recentlyMoved, setRecentlyMoved] = useState<Set<number>>(new Set());
  const [moveCount, setMoveCount] = useState(0);
  const lastMovedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentlyMovedTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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

        setMoveCount(c => c + 1);

        if (lastMovedTimer.current) clearTimeout(lastMovedTimer.current);
        setLastMoved(updatedSlot.slot_number);
        lastMovedTimer.current = setTimeout(() => setLastMoved(null), 2000);

        const slotNum = updatedSlot.slot_number;
        setRecentlyMoved(prev => new Set(prev).add(slotNum));
        const existing = recentlyMovedTimers.current.get(slotNum);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          setRecentlyMoved(prev => {
            const next = new Set(prev);
            next.delete(slotNum);
            return next;
          });
          recentlyMovedTimers.current.delete(slotNum);
        }, 2500);
        recentlyMovedTimers.current.set(slotNum, timer);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (lastMovedTimer.current) clearTimeout(lastMovedTimer.current);
      recentlyMovedTimers.current.forEach(t => clearTimeout(t));
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
    recentlyMoved,
    moveCount,
    refresh,
  };
}
