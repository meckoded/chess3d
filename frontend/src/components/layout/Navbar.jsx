import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuth from '../../hooks/useAuth';
import {
  HiOutlineHome,
  HiOutlineLogin,
  HiOutlineUserAdd,
  HiOutlineUser,
  HiOutlineStar,
  HiOutlineShieldCheck,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
} from 'react-icons/hi';
import { GiChessRook } from 'react-icons/gi';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: HiOutlineHome, public: true },
    { to: '/leaderboard', label: 'Leaderboard', icon: HiOutlineStar, public: true },
    { to: '/lobby', label: 'Lobby', icon: GiChessRook, public: false },
    { to: '/profile', label: 'Profile', icon: HiOutlineUser, public: false },
    ...(isAdmin
      ? [{ to: '/admin', label: 'Admin', icon: HiOutlineShieldCheck, public: false }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold gradient-text"
          >
            <GiChessRook className="text-3xl text-amber-500" />
            <span className="hidden sm:inline">Chess3D</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(
              (link) =>
                (link.public || isAuthenticated) && (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-300
                               hover:text-amber-400 hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <link.icon className="text-lg" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                )
            )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">
                  {user?.username}
                  <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                    {user?.elo || 1200} ELO
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-red-400
                             hover:bg-slate-800/50 rounded-lg transition-all duration-200"
                >
                  <HiOutlineLogout />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">
                  <HiOutlineLogin className="inline mr-1" />
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">
                  <HiOutlineUserAdd className="inline mr-1" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-300 hover:text-amber-400 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <HiOutlineX className="text-2xl" />
            ) : (
              <HiOutlineMenu className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-700/50 bg-slate-800/90 backdrop-blur-lg"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(
                (link) =>
                  (link.public || isAuthenticated) && (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-300
                                 hover:text-amber-400 hover:bg-slate-700/50 transition-all"
                    >
                      <link.icon className="text-lg" />
                      <span>{link.label}</span>
                    </Link>
                  )
              )}
              <div className="pt-2 border-t border-slate-700/50">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400
                               hover:bg-slate-700/50 transition-all w-full"
                  >
                    <HiOutlineLogout />
                    <span>Logout</span>
                  </button>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 btn-secondary text-center text-sm py-2"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 btn-primary text-center text-sm py-2"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
