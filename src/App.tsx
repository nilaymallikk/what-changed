import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Header } from './components/Header';
import { Homepage } from './pages/Homepage';
import { AreaDashboard } from './pages/AreaDashboard';
import { ChangeDetailPage } from './pages/ChangeDetailPage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/area/:zip" element={<AreaDashboard />} />
            <Route path="/area/:zip/change/:id" element={<ChangeDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
