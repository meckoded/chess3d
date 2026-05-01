import { GiChessRook } from 'react-icons/gi';
import { FaGithub, FaDiscord, FaTwitter } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GiChessRook className="text-2xl text-amber-500" />
              <span className="text-lg font-bold gradient-text">Chess3D</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Immersive 3D chess experience. Play with friends or compete on the
              global leaderboard.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="/leaderboard" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                  Leaderboard
                </a>
              </li>
              <li>
                <a href="/lobby" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                  Play Now
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Connect</h4>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400
                           hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              >
                <FaGithub className="text-lg" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-amber-400
                           hover:bg-slate-700 transition-all duration-200"
              >
                <FaDiscord className="text-lg" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-amber-400
                           hover:bg-slate-700 transition-all duration-200"
              >
                <FaTwitter className="text-lg" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center text-xs text-slate-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} Chess3D. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
