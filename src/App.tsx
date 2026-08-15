import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import { Header } from './components/Header';
import { Homepage } from './pages/Homepage';
import { AreaDashboard } from './pages/AreaDashboard';
import { ChangeDetailPage } from './pages/ChangeDetailPage';
import { ExplorePage } from './pages/ExplorePage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { LegalPage } from './pages/LegalPage';

function AppContent() {
  const location = useLocation();
  const isDashboardOrDetail = location.pathname.startsWith('/area/');

  return (
    <div className="min-h-screen bg-black font-sans text-white flex flex-col antialiased">
      {!isDashboardOrDetail && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/area/:zip" element={<AreaDashboard />} />
          <Route path="/area/:zip/change/:id" element={<ChangeDetailPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/data-sources" element={<DataSourcesPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
