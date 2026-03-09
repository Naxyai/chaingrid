import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BoardEntry {
  id: string;
  user_id: string;
  wallet_address: string;
  position: number;
  cycle_number: number;
  entry_type: 'deposit' | 'rollin';
  status: 'active' | 'paused' | 'completed';
  created_at: string;
}

interface AdminSettings {
  board_paused: boolean;
}

export default function BoardControl() {
  const [entries, setEntries] = useState<BoardEntry[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ board_paused: false });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ents }, { data: s }] = await Promise.all([
      supabase.from('board_entries').select('*').eq('status', 'active').order('position', { ascending: true }),
      supabase.from('admin_settings').select('board_paused').eq('id', 1).maybeSingle(),
    ]);
    setEntries(ents ?? []);
    if (s) setSettings(s as AdminSettings);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleBoard = async () => {
    setToggling(true);
    await supabase.rpc('toggle_board_paused', { p_paused: !settings.board_paused });
    setSettings(prev => ({ ...prev, board_paused: !prev.board_paused }));
    setToggling(false);
  };

  const removeEntry = async (id: string) => {
    if (!confirm('Remove this board entry? This cannot be undone.')) return;
    await supabase.from('board_entries').update({ status: 'completed' }).eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
            <LayoutGrid size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Board Control</h2>
            <p className="text-gray-400 text-xs">{entries.length} active entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={toggleBoard}
            disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              settings.board_paused
                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
            }`}
          >
            {settings.board_paused ? <><Play size={14} /> Resume Board</> : <><Pause size={14} /> Pause Board</>}
          </button>
        </div>
      </div>

      {settings.board_paused && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm font-medium">Board engine is currently PAUSED — no new movements will occur</p>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No active board entries</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-left text-gray-500 text-xs">
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Wallet</th>
                  <th className="px-4 py-3 font-medium text-center">Cycle</th>
                  <th className="px-4 py-3 font-medium text-center">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold text-base ${
                        entry.position <= 10 ? 'text-green-400' :
                        entry.position <= 25 ? 'text-yellow-400' : 'text-white'
                      }`}>#{entry.position}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{entry.wallet_address.slice(0, 14)}...</td>
                    <td className="px-4 py-3 text-center text-blue-400">#{entry.cycle_number}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        entry.entry_type === 'deposit'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                      }`}>{entry.entry_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeEntry(entry.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
