import { motion, AnimatePresence } from 'framer-motion';
import { BoardSlot } from '../types';
import { shortenAddress } from '../lib/web3';

interface SlotBoardProps {
  slots: BoardSlot[];
  userAddress?: string | null;
  compact?: boolean;
  lastMoved?: number | null;
  recentlyMoved?: Set<number>;
}

export default function SlotBoard({ slots, userAddress, compact = false, lastMoved, recentlyMoved }: SlotBoardProps) {
  const getSlotData = (slotNumber: number) => slots.find(s => s.slot_number === slotNumber);

  const isUserSlot = (slot: BoardSlot | undefined) =>
    slot?.wallet_address && userAddress &&
    slot.wallet_address.toLowerCase() === userAddress.toLowerCase();

  const getSlotStyle = (slotNumber: number, slot: BoardSlot | undefined) => {
    if (isUserSlot(slot)) return 'user-slot';
    if (slotNumber === 1) return 'exit-slot';
    if (slotNumber === 100) return 'entry-slot';
    if (slot?.wallet_address) return 'occupied-slot';
    return 'empty-slot';
  };

  const rows = [];
  for (let row = 0; row < 10; row++) {
    const rowSlots = [];
    for (let col = 0; col < 10; col++) {
      const slotNumber = row * 10 + col + 1;
      rowSlots.push(slotNumber);
    }
    rows.push(rowSlots);
  }

  const cellSize = compact ? 'h-10 sm:h-12' : 'h-12 sm:h-14 md:h-16';
  const textSize = compact ? 'text-xs' : 'text-xs sm:text-sm';

  return (
    <div className="w-full">
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {rows.map((row, rowIdx) =>
          row.map((slotNumber) => {
            const slot = getSlotData(slotNumber);
            const styleClass = getSlotStyle(slotNumber, slot);
            const isUser = isUserSlot(slot);
            const wasJustMoved = lastMoved === slotNumber;
            const isRecentlyMoved = recentlyMoved?.has(slotNumber) && !isUser;

            return (
              <AnimatePresence key={slotNumber} mode="popLayout">
                <motion.div
                  layout
                  initial={wasJustMoved ? { scale: 1.2, opacity: 0.6 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className={`relative ${cellSize} rounded-lg flex flex-col items-center justify-center cursor-default select-none ${
                    isRecentlyMoved ? 'animate-slot-move' : 'transition-all duration-300'
                  } ${
                    styleClass === 'user-slot'
                      ? 'bg-sky-500/30 border-2 border-sky-400 shadow-lg shadow-sky-500/30'
                      : styleClass === 'exit-slot'
                      ? 'bg-green-500/20 border border-green-500/60'
                      : styleClass === 'entry-slot'
                      ? 'bg-blue-500/20 border border-blue-500/60'
                      : styleClass === 'occupied-slot'
                      ? 'bg-pink-500/20 border border-pink-500/60 hover:border-pink-400/60 hover:bg-pink-500/30'
                      : 'bg-slate-800/30 border border-slate-700/30'
                  } ${isUser ? 'animate-pulse-border' : ''}`}
                  title={isUser ? 'You are here' : slot?.wallet_address ? shortenAddress(slot.wallet_address) : `Slot ${slotNumber}`}
                >
                  {isUser && (
                    <div className="absolute inset-0 rounded-lg border-2 border-sky-400 animate-ping opacity-30" />
                  )}
                  {isRecentlyMoved && (
                    <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-ping opacity-40 pointer-events-none" />
                  )}

                  <span className={`${textSize} font-bold leading-none ${
                    slotNumber === 1 ? 'text-green-400' :
                    slotNumber === 100 ? 'text-blue-400' :
                    isUser ? 'text-sky-300' :
                    slot?.wallet_address ? 'text-pink-300' : 'text-slate-600'
                  }`}>
                    {slotNumber === 1 ? 'EXIT' : slotNumber === 100 ? 'ENTER' : slotNumber}
                  </span>

                  {slot?.wallet_address && !compact && (
                    <span className="text-[9px] text-slate-400 mt-0.5 truncate w-full text-center px-1">
                      {shortenAddress(slot.wallet_address, 3)}
                    </span>
                  )}

                  {isUser && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-400 rounded-full border-2 border-[#0a0e1a] animate-pulse" />
                  )}
                </motion.div>
              </AnimatePresence>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sky-500/30 border-2 border-sky-400" />
          <span className="text-gray-400">Your Position</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-pink-500/20 border border-pink-500/60" />
          <span className="text-pink-400">Occupied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/60" />
          <span className="text-gray-400">Payout (Position 1) — Top</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/60" />
          <span className="text-gray-400">Entry (Position 100) — Bottom</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-800/30 border border-slate-700/30" />
          <span className="text-gray-400">Empty</span>
        </div>
      </div>
    </div>
  );
}
