import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import AuthPage from './pages/AuthPage';
import Navbar from './components/Navbar';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/auth" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
        <div className="mesh-bg" />
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
            <Route path="/results/:id" element={<ResultsPage />} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
