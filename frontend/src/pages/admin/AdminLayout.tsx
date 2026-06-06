import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Users, ScrollText, Vote, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { to: '/admin/stats', label: 'Stats', icon: BarChart3 },
  { to: '/admin/elections', label: 'Elections', icon: Vote },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/logs', label: 'Audit Logs', icon: ScrollText },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#04111f_0%,_#0a1524_100%)] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/10 flex flex-col py-6 px-4 gap-1">
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Admin Panel</p>
        </div>

        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
              ${isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}

        <div className="mt-auto space-y-1">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
