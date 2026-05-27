import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useLexStore from '../store/useLexStore';

export const useSocket = () => {
  const socket = useRef(null);
  const { currentUser } = useLexStore();

  useEffect(() => {
    if (!currentUser?.tenantId) return;

    socket.current = io('http://localhost:3001', {
      query: { tenantId: currentUser.tenantId }
    });

    socket.current.on('connect', () => {
      console.log('Socket connected');
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [currentUser?.tenantId]);

  return socket.current;
};
