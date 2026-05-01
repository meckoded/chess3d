import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.confirm) {
      toast.error('All fields are required');
      return false;
    }
    if (form.username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Invalid email format');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      login(data.user, data.token);
      toast.success('Account created! Welcome to Chess3D.');
      navigate('/lobby');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/30"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join the Chess3D arena</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Username', name: 'username', type: 'text', placeholder: 'grandmaster99', auto: 'username' },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'your@email.com', auto: 'email' },
            { label: 'Password', name: 'password', type: 'password', placeholder: 'Min. 6 characters', auto: 'new-password' },
            { label: 'Confirm Password', name: 'confirm', type: 'password', placeholder: 'Repeat password', auto: 'new-password' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder={field.placeholder}
                autoComplete={field.auto}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-xl transition-all transform hover:scale-[1.02] mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
