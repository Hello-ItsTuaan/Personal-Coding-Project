import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MonHoc from './pages/MonHoc';
import DiemSo from './pages/DiemSo';
import LichKiemTra from './pages/LichKiemTra';
import MucTieu from './pages/MucTieu';
import BaoCao from './pages/BaoCao';
import SoSanhHocKy from './pages/SoSanhHocKy';
import LoTrinh from './pages/LoTrinh';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mon-hoc" element={<MonHoc />} />
        <Route path="/diem-so" element={<DiemSo />} />
        <Route path="/lich-kiem-tra" element={<LichKiemTra />} />
        <Route path="/muc-tieu" element={<MucTieu />} />
        <Route path="/bao-cao" element={<BaoCao />} />
        <Route path="/so-sanh" element={<SoSanhHocKy />} />
        <Route path="/lo-trinh" element={<LoTrinh />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
