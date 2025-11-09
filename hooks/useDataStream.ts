// hooks/useDataStream.ts
'use client';
import { useEffect, useRef, useState } from 'react';
import type { DataPoint } from '../lib/types';
import { generateBatch } from '../lib/dataGenerator';

type Options = {
  rateMs?: number;    // interval between batches
  batchSize?: number; // points per batch
  running?: boolean;
};

export function useDataStream(initial: Options = {}) {
  const [data, setData] = useState<DataPoint[]>([]);
  const optionsRef = useRef<Required<Options>>({
    rateMs: initial.rateMs ?? 100,
    batchSize: initial.batchSize ?? 20,
    running: initial.running ?? false,
  });
  const timerRef = useRef<number | null>(null);

  function emitBatch() {
    const now = Date.now();
    const batch = generateBatch(now, optionsRef.current.batchSize);
    // append, but keep memory bounded (sliding window)
    setData((prev) => {
      const merged = prev.concat(batch);
      const maxPoints = 200000; // very large cap; adjust as needed
      if (merged.length > maxPoints) return merged.slice(merged.length - maxPoints);
      return merged;
    });
  }

  function start() {
    optionsRef.current.running = true;
    if (timerRef.current == null) {
      timerRef.current = window.setInterval(emitBatch, optionsRef.current.rateMs);
    }
  }

  function stop() {
    optionsRef.current.running = false;
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function setOptions(p: Partial<Options>) {
    if (typeof p.rateMs === 'number') optionsRef.current.rateMs = p.rateMs;
    if (typeof p.batchSize === 'number') optionsRef.current.batchSize = p.batchSize;
    if (typeof p.running === 'boolean') optionsRef.current.running = p.running;
    // restart timer with new rate if running
    if (optionsRef.current.running) {
      if (timerRef.current != null) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(emitBatch, optionsRef.current.rateMs);
    }
  }

  function running() {
    return optionsRef.current.running;
  }

  // cleanup on unmount
  useEffect(() => {
    if (optionsRef.current.running) start();
    return () => {
      if (timerRef.current != null) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // optional public API to clear data
  function clear() {
    setData([]);
  }

  return {
    data,
    controls: { start, stop, setOptions, running, getOptions: () => ({ ...optionsRef.current }), clear },
  };
}
