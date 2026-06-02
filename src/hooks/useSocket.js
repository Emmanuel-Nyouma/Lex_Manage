import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useLexStore from '../store/useLexStore';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  
  // ✅ FIXED: Use correct properties
  const { currentUser, accessToken } = useLexStore();
  const WS_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // ✅ Check for correct properties
    if (!currentUser?.tenantId || !accessToken) return;

    socketRef.current = io(WS_URL, {
      auth: { 
        token: accessToken  // ✅ Use accessToken from Zustand
      },
      query: { 
        tenantId: currentUser.tenantId 
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketInstance(socketRef.current);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketInstance(null);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setSocketInstance(null);
    };
  }, [currentUser?.tenantId, accessToken, WS_URL]);

  return socketInstance;
};
