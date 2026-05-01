import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function useAuth() {
  const { user, isAuthenticated, token, login, logout, setAuth } = useAuthStore();

  const loginUser = useCallback(
    async (email, password) => {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        login(data.user, data.token);
        toast.success('Welcome back!');
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || 'Login failed';
        toast.error(msg);
        throw err;
      }
    },
    [login]
  );

  const registerUser = useCallback(
    async (username, email, password) => {
      try {
        const { data } = await api.post('/auth/register', {
          username,
          email,
          password,
        });
        login(data.user, data.token);
        toast.success('Account created successfully!');
        return data;
      } catch (err) {
        const msg = err.response?.data?.message || 'Registration failed';
        toast.error(msg);
        throw err;
      }
    },
    [login]
  );

  const logoutUser = useCallback(() => {
    logout();
    toast.success('Logged out');
  }, [logout]);

  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAuthenticated,
    token,
    isAdmin,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
  };
}
