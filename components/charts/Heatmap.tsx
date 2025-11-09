// components/charts/Heatmap.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
  cols?: number;
  rows?: number;
};

export default function Heatmap({
  data,
  width = 380,
  height = 200,
  cols = 40,
  rows = 10,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<DataPoint[]>(data);
  dataRef.current = data;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // guard: canvas not mounted

    const ctx = canvas.getContext('2d');
    if (!ctx) return; // guard: context unavailable

    // DPR scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const clientW = canvas.clientWidth || width;
    const clientH = canvas.clientHeight || height;
    canvas.width = Math.max(1, Math.floor(clientW * dpr));
    canvas.height = Math.max(1, Math.floor(clientH * dpr));
    canvas.style.width = `${clientW}px`;
    canvas.style.height = `${clientH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let mounted = true;

    function draw() {
      // ensure we still have canvas and ctx
      const c = canvasRef.current;
      if (!mounted || !c || !ctx) {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        return;
      }

      const pts = dataRef.current || [];
      const w = c.clientWidth || width;
      const h = c.clientHeight || height;
      ctx.clearRect(0, 0, w, h);

      if (!pts.length) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // compute min/max
      let min = Infinity, max = -Infinity;
      for (const p of pts) {
        const v = p.value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) { min -= 1; max += 1; }
      const range = max - min || 1;

      // aggregate into grid cells
      const counts = new Array(cols * rows).fill(0);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        // x slot by index, y slot by normalized value
        const xSlot = Math.floor((i / Math.max(1, pts.length - 1)) * (cols - 1));
        const ySlot = Math.floor(((p.value - min) / range) * (rows - 1));
        const idx = ySlot * cols + xSlot;
        counts[idx] = (counts[idx] || 0) + 1;
      }

      const maxCount = Math.max(...counts, 1);
      const cellW = w / cols;
      const cellH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let cIdx = 0; cIdx < cols; cIdx++) {
          const idx = r * cols + cIdx;
          const val = counts[idx] || 0;
          const norm = val / maxCount;
          // color ramp: transparent -> blue
          const alpha = Math.min(1, Math.max(0, norm));
          ctx.fillStyle = `rgba(59,130,246,${alpha})`;
          ctx.fillRect(cIdx * cellW, h - (r + 1) * cellH, Math.max(0, cellW - 1), Math.max(0, cellH - 1));
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [width, height, cols, rows]);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
