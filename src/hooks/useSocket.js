import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import useLexStore from '../store/useLexStore';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const { currentUser, session } = useLexStore();
  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!currentUser?.tenantId || !session?.access_token) return;

    socketRef.current = io(WS_URL, {
      auth: { token: session.access_token },
      query: { tenantId: currentUser.tenantId }
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketInstance(socketRef.current);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setSocketInstance(null);
    };
  }, [currentUser?.tenantId, WS_URL]);

  return socketInstance;
};
