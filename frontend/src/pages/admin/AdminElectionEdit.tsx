import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Candidate { _id: string; name: string; party?: string; bio?: string; }
interface Election { _id: string; title: string; description?: string; status: string; startTime: string; endTime: string; candidates: Candidate[]; }

const toLocalDatetime = (iso: string) => new Date(iso).toISOString().slice(0, 16);

export default function AdminElectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => api.get<{ data: Election }>(`/elections/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const [form, setForm] = useState<Partial<Election>>({});
  const [newCandidate, setNewCandidate] = useState({ name: '', party: '', bio: '' });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/elections/${id}`, form),
    onSuccess: () => { toast.success('Election updated'); qc.invalidateQueries({ queryKey: ['election', id] }); },
    onError: () => toast.error('Update failed'),
  });

  const addCandidateMutation = useMutation({
    mutationFn: () => api.post(`/elections/${id}/candidates`, newCandidate),
    onSuccess: () => {
      toast.success('Candidate added');
      qc.invalidateQueries({ queryKey: ['election', id] });
      setNewCandidate({ name: '', party: '', bio: '' });
    },
    onError: () => toast.error('Failed to add candidate'),
  });

  const removeCandidateMutation = useMutation({
    mutationFn: (cid: string) => api.delete(`/elections/${id}/candidates/${cid}`),
    onSuccess: () => { toast.success('Candidate removed'); qc.invalidateQueries({ queryKey: ['election', id] }); },
    onError: () => toast.error('Failed to remove candidate'),
  });

  if (isLoading || !election) {
    return <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />;
  }

  const merged = { ...election, ...form };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Edit Election</h1>
        <button onClick={() => navigate('/admin/elections')} className="text-sm text-cyan-300 hover:text-cyan-200">← Back</button>
      </div>

      {/* Election fields */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="font-semibold text-white">Details</h2>
        <input value={merged.title ?? ''} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Title" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
        <textarea value={merged.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Description" rows={2} className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400 resize-none" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Start Time</label>
            <input type="datetime-local" value={merged.startTime ? toLocalDatetime(merged.startTime) : ''}
              onChange={(e) => setForm((p) => ({ ...p, startTime: new Date(e.target.value).toISOString() }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">End Time</label>
            <input type="datetime-local" value={merged.endTime ? toLocalDatetime(merged.endTime) : ''}
              onChange={(e) => setForm((p) => ({ ...p, endTime: new Date(e.target.value).toISOString() }))}
              className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Status</label>
          <select value={merged.status ?? 'draft'} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 transition">
          <Save className="h-4 w-4" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Candidates */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="font-semibold text-white">Candidates ({election.candidates.length})</h2>

        {election.candidates.map((c) => (
          <div key={c._id} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-slate-950/30 px-4 py-3">
            <div>
              <p className="text-white font-medium">{c.name}</p>
              {c.party && <p className="text-xs text-slate-400">{c.party}</p>}
            </div>
            <button onClick={() => { if (confirm(`Remove ${c.name}?`)) removeCandidateMutation.mutate(c._id); }}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition" aria-label="Remove candidate">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Add candidate form */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <h3 className="text-sm font-medium text-slate-300">Add Candidate</h3>
          <input value={newCandidate.name} onChange={(e) => setNewCandidate((p) => ({ ...p, name: e.target.value }))}
            placeholder="Name *" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          <input value={newCandidate.party} onChange={(e) => setNewCandidate((p) => ({ ...p, party: e.target.value }))}
            placeholder="Party (optional)" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          <input value={newCandidate.bio} onChange={(e) => setNewCandidate((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Bio (optional)" className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" />
          <button onClick={() => addCandidateMutation.mutate()} disabled={addCandidateMutation.isPending || !newCandidate.name.trim()}
            className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60 transition">
            <Plus className="h-4 w-4" /> {addCandidateMutation.isPending ? 'Adding...' : 'Add Candidate'}
          </button>
        </div>
      </div>
    </div>
  );
}
