import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

/**
 * useSocket — Manages Socket.io connection lifecycle.
 * If handlers are passed, they are registered as event listeners.
 */
export default function useSocket({
  gameId,
  onGameUpdate,
  onGameOver,
  onOpponentConnected,
  onOpponentDisconnected,
  onChatMessage,
  onMoveError,
  onDrawOffered,
  onDrawDeclined,
} = {}) {
  const socketRef = useRef(null);
  const token = useAuthStore((s) => s.token);
  const handlersRef = useRef(null);

  // Keep handlers ref fresh
  handlersRef.current = {
    onGameUpdate,
    onGameOver,
    onOpponentConnected,
    onOpponentDisconnected,
    onChatMessage,
    onMoveError,
    onDrawOffered,
    onDrawDeclined,
  };

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Auto-join game room if gameId provided
      if (gameId) {
        socket.emit('join_game', { gameId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socket.on('connected', (data) => {
      console.log('[Socket] Auth OK:', data.username);
    });

    // Game events → handler bridge
    socket.on('game_update', (data) => {
      handlersRef.current?.onGameUpdate?.(data);
    });

    socket.on('game_over', (data) => {
      handlersRef.current?.onGameOver?.(data);
    });

    socket.on('opponent_connected', (data) => {
      handlersRef.current?.onOpponentConnected?.(data);
    });

    socket.on('opponent_disconnected', (data) => {
      handlersRef.current?.onOpponentDisconnected?.(data);
    });

    socket.on('chat_message', (data) => {
      handlersRef.current?.onChatMessage?.(data);
    });

    socket.on('move_error', (data) => {
      handlersRef.current?.onMoveError?.(data);
    });

    socket.on('draw_offered', (data) => {
      handlersRef.current?.onDrawOffered?.(data);
    });

    socket.on('draw_declined', (data) => {
      handlersRef.current?.onDrawDeclined?.(data);
    });

    socket.on('error', (data) => {
      console.warn('[Socket] Server error:', data.message);
    });

    socketRef.current = socket;

    return () => {
      if (gameId) socket.emit('leave_game', { gameId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, gameId]);

  // --- Imperative helpers (for use outside useEffect) ---

  const connect = useCallback(() => socketRef.current, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return { connect, disconnect, emit, on, off, getSocket };
}
