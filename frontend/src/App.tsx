import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Dashboard from './pages/Dashboard';
import ElectionsPage from './pages/Elections';
import ElectionDetail from './pages/ElectionDetail';
import ResultsPage from './pages/Results';
import AdminLayout from './pages/admin/AdminLayout';
import AdminElections from './pages/admin/AdminElections';
import AdminElectionEdit from './pages/admin/AdminElectionEdit';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';
import AdminStats from './pages/admin/AdminStats';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  return accessToken ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/verify-otp" element={<PublicOnlyRoute><VerifyOTP /></PublicOnlyRoute>} />

      {/* Authenticated voter routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/elections" element={<ProtectedRoute><ElectionsPage /></ProtectedRoute>} />
      <Route path="/elections/:id" element={<ProtectedRoute><ElectionDetail /></ProtectedRoute>} />
      <Route path="/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="stats" replace />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="elections" element={<AdminElections />} />
        <Route path="elections/:id" element={<AdminElectionEdit />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
