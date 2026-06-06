import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface User { _id: string; name: string; email: string; role: string; isVerified: boolean; isActive: boolean; createdAt: string; }

export default function AdminUsers() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get<{ data: { users: User[]; total: number } }>('/admin/users').then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['adminUsers'] }); },
    onError: () => toast.error('Failed to update role'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['adminUsers'] }); },
    onError: () => toast.error('Failed to deactivate user'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users ({data?.total ?? 0})</h1>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white/5 animate-pulse" />)}</div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-left font-medium">Verified</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((u) => (
                <tr key={u._id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-slate-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold
                      ${u.role === 'ADMIN' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-500/15 text-slate-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{u.isVerified ? '✓' : '✗'}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => roleMutation.mutate({ id: u._id, role: u.role === 'ADMIN' ? 'VOTER' : 'ADMIN' })}
                        className="p-1.5 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 transition"
                        title={`Make ${u.role === 'ADMIN' ? 'VOTER' : 'ADMIN'}`}
                        aria-label="Toggle role"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      {u.isActive && (
                        <button
                          onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deactivateMutation.mutate(u._id); }}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          aria-label="Deactivate user"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
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
