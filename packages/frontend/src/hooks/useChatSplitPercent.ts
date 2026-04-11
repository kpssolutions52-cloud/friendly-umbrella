'use client';

import { useCallback, useEffect, useState } from 'react';

export const CHAT_SPLIT_MIN = 22;
export const CHAT_SPLIT_MAX = 70;
export const CHAT_SPLIT_DEFAULT = 33;

/** Persisted chat column width (%) for QS / supplier split layouts. */
export function useChatSplitPercent(storageKey: string) {
  const [percent, setPercentState] = useState(CHAT_SPLIT_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v) {
        const n = parseFloat(v);
        if (!Number.isNaN(n)) {
          setPercentState(Math.min(CHAT_SPLIT_MAX, Math.max(CHAT_SPLIT_MIN, n)));
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [storageKey]);

  const setChatSplitPercent = useCallback(
    (n: number) => {
      const clamped = Math.min(CHAT_SPLIT_MAX, Math.max(CHAT_SPLIT_MIN, Math.round(n * 10) / 10));
      setPercentState(clamped);
      try {
        localStorage.setItem(storageKey, String(clamped));
      } catch {
        /* ignore */
      }
    },
    [storageKey]
  );

  return { chatSplitPercent: percent, setChatSplitPercent, ready };
}

export function useMinMd() {
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsMd(mq.matches);
    const handler = () => setIsMd(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMd;
}
