import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface LogEntry {
  _id: string;
  userId?: { name: string; email: string };
  action: string;
  ip: string;
  timestamp: string;
}

const fmt = (d: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(d));

export default function AdminLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () =>
      api.get<{ data: { logs: LogEntry[]; total: number } }>('/admin/logs?limit=50').then((r) => r.data.data),
    refetchInterval: 15_000, // refresh every 15s
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Audit Logs</h1>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-5 py-3 text-left font-medium">Timestamp</th>
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-left font-medium">Action</th>
                <th className="px-5 py-3 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs ?? []).map((log) => (
                <tr key={log._id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition">
                  <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap">{fmt(log.timestamp)}</td>
                  <td className="px-5 py-2.5 text-slate-300">
                    {log.userId ? `${log.userId.name} (${log.userId.email})` : 'Anonymous'}
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-cyan-300">{log.action}</td>
                  <td className="px-5 py-2.5 text-slate-500 font-mono text-xs">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
