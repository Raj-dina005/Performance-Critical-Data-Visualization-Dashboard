'use client';
import { useEffect, useRef, useState } from 'react';

export function usePerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const [mem, setMem] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const frames = useRef(0);
  const last = useRef(performance.now());

  useEffect(() => {
    function loop() {
      frames.current++;
      const now = performance.now();
      if (now - last.current >= 1000) {
        setFps(Math.round((frames.current * 1000) / (now - last.current)));
        frames.current = 0;
        last.current = now;
        if ((performance as any).memory) {
          const m = (performance as any).memory;
          setMem(Math.round((m.usedJSHeapSize / 1024 / 1024) * 100) / 100);
        }
      }
      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return { fps, mem };
}
