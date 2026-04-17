import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface ChartState {
  symbol: string;
  timeframe: string;
  fromTimestamp: number;
  toTimestamp: number;
  barIndex?: number;
}

export type BroadcastRole = 'presenter' | 'viewer';

export interface PresenceUser {
  role: BroadcastRole;
  joined_at: string;
  presence_ref?: string;
}

const THROTTLE_MS = 300;

export function useSessionBroadcast(sessionId: string | undefined, role: BroadcastRole) {
  const [chartState, setChartState] = useState<ChartState | null>(null);
  const [presenceCount, setPresenceCount] = useState(0);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcastAtRef = useRef<number>(0);
  const pendingStateRef = useRef<ChartState | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`session-${sessionId}`, {
      config: { presence: { key: '' } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'chart-state' }, (payload) => {
      // Presenter ignores incoming broadcasts to prevent echo loops
      if (role === 'presenter') return;
      const state = payload.payload as ChartState;
      setChartState(state);
    });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<PresenceUser>();
      const users: PresenceUser[] = [];
      Object.values(state).forEach((arr) => {
        arr.forEach((u) => users.push(u as PresenceUser));
      });
      setPresenceUsers(users);
      setPresenceCount(users.length);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({ role, joined_at: new Date().toISOString() });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setIsConnected(false);
      }
    });

    return () => {
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, role]);

  const broadcastChartState = useCallback((state: ChartState) => {
    const channel = channelRef.current;
    if (!channel) return;

    const send = (s: ChartState) => {
      lastBroadcastAtRef.current = Date.now();
      void channel.send({ type: 'broadcast', event: 'chart-state', payload: s });
    };

    const now = Date.now();
    const sinceLast = now - lastBroadcastAtRef.current;

    if (sinceLast >= THROTTLE_MS) {
      send(state);
      return;
    }

    // Throttle: queue the latest state and flush after remaining delay
    pendingStateRef.current = state;
    if (pendingTimerRef.current) return;
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      const pending = pendingStateRef.current;
      pendingStateRef.current = null;
      if (pending) send(pending);
    }, THROTTLE_MS - sinceLast);
  }, []);

  return {
    broadcastChartState,
    chartState,
    presenceCount,
    presenceUsers,
    isConnected,
  };
}
