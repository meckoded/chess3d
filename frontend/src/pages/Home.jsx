import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import HeroChessBoard from '../components/chess/HeroChessBoard';
import useAuthStore from '../store/authStore';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative h-[90vh] overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0">
          <Canvas gl={{ antialias: true }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 8, 5]} intensity={0.8} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 2.5}
            />
            <HeroChessBoard />
            <Environment preset="night" />
          </Canvas>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-900" />

        {/* Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-white">Chess</span>
            <span className="text-amber-500">3D</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-slate-300 max-w-2xl mb-10"
          >
            Experience chess like never before — three-dimensional battles, 
            real-time multiplayer, and competitive ELO rankings.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-4"
          >
            {isAuthenticated ? (
              <Link
                to="/lobby"
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                Play Now, {user?.username || 'Player'}
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 border border-slate-600/50"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-3xl font-bold text-center mb-16 text-white"
        >
          Why Chess<span className="text-amber-500">3D</span>?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🎯',
              title: '3D Immersion',
              desc: 'Rotate, zoom, and view the board from any angle. Every piece is rendered in stunning 3D detail.',
            },
            {
              icon: '⚡',
              title: 'Real-Time Multiplayer',
              desc: 'Challenge players worldwide with live WebSocket connections and instant move updates.',
            },
            {
              icon: '🏆',
              title: 'ELO Rankings',
              desc: 'Climb the leaderboard with our advanced rating system. Compete and prove your skill.',
            },
            {
              icon: '🔒',
              title: 'Secure Auth',
              desc: 'JWT-based authentication with refresh tokens keeps your account safe and sessions seamless.',
            },
            {
              icon: '📱',
              title: 'Responsive Design',
              desc: 'Play on any device — desktop, tablet, or mobile. Perfectly adapted to every screen.',
            },
            {
              icon: '🛡️',
              title: 'Admin Controls',
              desc: 'Full management dashboard for moderating users, reviewing games, and system oversight.',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 hover:border-amber-500/30 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make Your Move?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join players from around the world. Create an account, climb the ranks, 
            and become a chess legend.
          </p>
          <Link
            to={isAuthenticated ? '/lobby' : '/register'}
            className="inline-block px-10 py-5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-lg font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-amber-500/25"
          >
            {isAuthenticated ? 'Join a Game' : 'Create Free Account'}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
