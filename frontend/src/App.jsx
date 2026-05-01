import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import useAuthStore from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';

export default function App() {
  const theme = useAuthStore((s) => s.theme);
  const [toastOpts, setToastOpts] = useState({});

  // Initialize dark mode from stored theme
  useEffect(() => {
    const stored = theme || 'dark';
    document.documentElement.classList.toggle('dark', stored === 'dark');
    setToastOpts(stored === 'dark' ? {
      style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' }
    } : {
      style: { background: '#ffffff', color: '#1e293b', border: '1px solid rgba(148,163,184,0.2)' }
    });
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setToastOpts(isDark ? {
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' }
      } : {
        style: { background: '#ffffff', color: '#1e293b', border: '1px solid rgba(148,163,184,0.2)' }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:id"
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: toastOpts,
        }}
      />
    </div>
  );
}
