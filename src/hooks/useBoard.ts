import { useState, useEffect, useCallback } from 'react';
import { BoardSlot } from '../types';
import { supabase, getBoardState } from '../lib/supabase';

export function useBoard(userAddress?: string | null) {
  const [slots, setSlots] = useState<BoardSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMoved, setLastMoved] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const data = await getBoardState();
    setSlots(data as BoardSlot[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    const channel = supabase
      .channel('board_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_state' }, (payload) => {
        setLastMoved((payload.new as BoardSlot)?.slot_number ?? null);
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const userSlot = slots.find(
    s => s.wallet_address?.toLowerCase() === userAddress?.toLowerCase()
  );

  const occupiedCount = slots.filter(s => s.wallet_address !== null).length;
  const usersAfterYou = userSlot ? slots.filter(s => s.slot_number > userSlot.slot_number && s.wallet_address !== null).length : 0;
  const remainingToComplete = userSlot ? Math.max(0, userSlot.slot_number - 1) : 99;

  return { slots, loading, userSlot, occupiedCount, usersAfterYou, remainingToComplete, lastMoved, refresh };
}
