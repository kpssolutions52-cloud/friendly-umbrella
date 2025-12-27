'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }


    // Create socket connection with authentication
    const socket = io(WS_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Quote/RFQ Events
    socket.on('quote:updated', (data: {
      event: 'quote:created' | 'quote:responded' | 'quote:accepted' | 'quote:rejected' | 'quote:cancelled' | 'quote:countered';
      data: {
        quoteRequestId: string;
        status: string;
        updatedAt: string;
      };
    }) => {
      const { event, data: eventData } = data;
      
      let title = '';
      let description = '';
      let variant: 'default' | 'destructive' = 'default';

      switch (event) {
        case 'quote:responded':
          title = 'New Quote Response';
          description = 'A supplier has responded to your quote request.';
          break;
        case 'quote:accepted':
          title = 'Quote Accepted';
          description = 'Your quote response has been accepted by the company.';
          variant = 'default';
          break;
        case 'quote:rejected':
          title = 'Quote Rejected';
          description = 'Your quote response has been rejected.';
          variant = 'destructive';
          break;
        case 'quote:countered':
          title = 'Counter-Offer Received';
          description = 'The company has submitted a counter-offer to your bid.';
          break;
        case 'quote:cancelled':
          title = 'Quote Cancelled';
          description = 'A quote request has been cancelled.';
          variant = 'destructive';
          break;
        default:
          title = 'Quote Update';
          description = 'A quote has been updated.';
      }

      toast({
        title,
        description,
        variant,
        action: eventData.quoteRequestId ? {
          altText: 'View Quote',
          onClick: () => router.push(`/rfq/${eventData.quoteRequestId}`),
        } : undefined,
      });
    });

    // RFQ Creation Events
    socket.on('rfq:created', (data: {
      event: 'rfq:created';
      data: {
        rfqId: string;
        companyId: string;
        companyName: string;
        title: string;
        category?: string;
        createdAt: string;
      };
    }) => {
      const { data: eventData } = data;
      
      toast({
        title: 'New RFQ Available',
        description: `${eventData.companyName} has posted a new RFQ: ${eventData.title}. Click to view.`,
        variant: 'default',
      });
    });

    // Price Update Events (if needed)
    socket.on('price:updated', (data: {
      event: 'price:updated';
      data: {
        productId: string;
        productName: string;
        priceType: 'default' | 'private';
        newPrice: number;
        currency: string;
        supplierId?: string;
        updatedAt: string;
      };
    }) => {
      const { data: eventData } = data;
      
      // Only show price updates for private prices (targeted to specific company)
      if (eventData.priceType === 'private') {
        toast({
          title: 'Price Updated',
          description: `New price for ${eventData.productName}: ${eventData.currency} ${eventData.newPrice.toFixed(2)}`,
          variant: 'default',
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, isAuthenticated, toast, router]);

  // Reconnect when token changes
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
