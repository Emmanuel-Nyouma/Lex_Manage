import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useLexStore from '../store/useLexStore';
import { API_CONFIG } from '../config/api.config';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);

  const { currentUser, accessToken } = useLexStore();
  const WS_URL = API_CONFIG.WS_URL;

  useEffect(() => {
    // If we don't have auth data, ensure any existing socket is closed
    if (!currentUser?.tenantId || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketInstance(null);
      }
      return;
    }

    // Prevent multiple connections if the critical auth data hasn't changed.
    // (`auth` is a callback now, so stash the token the socket was built with on
    // the instance instead of reading it back from opts.)
    if (socketRef.current?.connected && socketRef.current._authToken === accessToken) {
      return;
    }

    // Clean up previous instance before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(WS_URL, {
      // Skip the HTTP long-polling handshake. Polling sessions return
      // `400 Bad Request` when the server drops the socket mid-request (e.g. an
      // expired-token rejection), which spams the console; websocket avoids it.
      transports: ['websocket'],
      // `auth` as a callback is re-evaluated on every (re)connection attempt, so
      // reconnections always use the freshest token from the store rather than a
      // stale value captured when this socket was first created.
      auth: (cb) => cb({ token: useLexStore.getState().accessToken }),
      query: {
        tenantId: currentUser.tenantId
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocketInstance(socket);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketInstance(null);
      if (reason === 'io server disconnect') {
        // The server kicked us (socket.io won't auto-reconnect in this case).
        // Retry after a short delay with a fresh token (via the auth callback),
        // but guard against reconnecting a socket we've already cleaned up to
        // avoid a tight reject→reconnect loop.
        setTimeout(() => {
          if (socketRef.current === socket) socket.connect();
        }, 2000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket._authToken = accessToken;
    socketRef.current = socket;

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketInstance(null);
    };
  }, [currentUser?.tenantId, accessToken, WS_URL]);

  return socketInstance;
};
