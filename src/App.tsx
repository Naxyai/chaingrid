import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Referrals from './pages/Referrals';
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board" element={<Board />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
