'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'supplier-hub-table-col-widths';

/** Default widths (px): company, category, trade, contact, phone, email, remarks, status, actions */
export const SUPPLIER_HUB_DEFAULT_COL_WIDTHS = [200, 120, 120, 120, 100, 180, 160, 88, 52];

function normalizeStoredWidths(p: number[]): number[] {
  let w = [...p];
  // Migrate older 8-column saves (no remarks) → insert remarks width at index 6
  if (w.length === 8) {
    w = [...w.slice(0, 6), SUPPLIER_HUB_DEFAULT_COL_WIDTHS[6]!, ...w.slice(6)];
  }
  if (w.length !== SUPPLIER_HUB_DEFAULT_COL_WIDTHS.length) return [...SUPPLIER_HUB_DEFAULT_COL_WIDTHS];
  return w.map((x, i) => {
    const d = SUPPLIER_HUB_DEFAULT_COL_WIDTHS[i] ?? 80;
    const n = typeof x === 'number' && !Number.isNaN(x) ? x : d;
    return Math.max(40, Math.min(800, n));
  });
}

export function useSupplierHubColumnWidths() {
  const [widths, setWidths] = useState<number[]>(SUPPLIER_HUB_DEFAULT_COL_WIDTHS);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as number[];
      if (!Array.isArray(p)) return;
      setWidths(normalizeStoredWidths(p));
    } catch {
      /* ignore */
    }
  }, []);

  const startResize = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = widthsRef.current[colIndex];

    const onMove = (ev: MouseEvent) => {
      ev.preventDefault();
      const dw = ev.clientX - startX;
      setWidths((prev) => {
        const n = [...prev];
        n[colIndex] = Math.max(48, Math.min(800, startW + dw));
        widthsRef.current = n;
        return n;
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widthsRef.current));
      } catch {
        /* ignore */
      }
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
  }, []);

  return { widths, startResize };
}
