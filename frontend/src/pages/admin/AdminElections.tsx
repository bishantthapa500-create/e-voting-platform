import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Election { _id: string; title: string; status: string; startTime: string; endTime: string; candidates: unknown[]; }

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminElections() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startTime: '', endTime: '' });

  const { data: elections = [], isLoading } = useQuery({
    queryKey: ['adminElections'],
    queryFn: () => api.get<{ data: Election[] }>('/elections').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/elections', form),
    onSuccess: () => {
      toast.success('Election created');
      qc.invalidateQueries({ queryKey: ['adminElections'] });
      setShowCreate(false);
      setForm({ title: '', description: '', startTime: '', endTime: '' });
    },
    onError: () => toast.error('Failed to create election'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/elections/${id}`),
    onSuccess: () => { toast.success('Election deleted'); qc.invalidateQueries({ queryKey: ['adminElections'] }); },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Elections</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition"
        >
          <Plus className="h-4 w-4" /> New Election
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Create Election</h2>
          <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title *" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 outline-none" />
          <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-400 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-400 outline-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 transition">
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : elections.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No elections yet.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 text-left font-medium">Title</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Start</th>
                <th className="px-5 py-3 text-left font-medium">Candidates</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((e) => (
                <tr key={e._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition">
                  <td className="px-5 py-3 text-white font-medium">{e.title}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold
                      ${e.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' :
                        e.status === 'draft' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-500/15 text-slate-300'}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{fmt(e.startTime)}</td>
                  <td className="px-5 py-3 text-slate-400">{(e.candidates as unknown[]).length}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => navigate(`/admin/elections/${e._id}`)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this election?')) deleteMutation.mutate(e._id); }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
