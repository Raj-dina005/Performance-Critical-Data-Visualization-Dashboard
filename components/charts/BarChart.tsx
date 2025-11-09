// components/charts/BarChart.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
  bins?: number;
  color?: string;
};

export default function BarChart({
  data,
  width = 380,
  height = 200,
  bins = 40,
  color = '#60a5fa',
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
        // nothing to draw
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // compute min/max using .value
      let min = Infinity, max = -Infinity;
      for (const p of pts) {
        const v = (p as DataPoint).value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) { min -= 1; max += 1; }
      const range = max - min || 1;

      // bins
      const counts = new Array(bins).fill(0);
      for (const p of pts) {
        const v = (p as DataPoint).value;
        const t = Math.floor(((v - min) / range) * bins);
        const idx = Math.min(Math.max(t, 0), bins - 1);
        counts[idx]++;
      }

      // draw bars
      const barW = w / bins;
      const maxCount = Math.max(...counts, 1);
      ctx.fillStyle = color;
      for (let i = 0; i < bins; i++) {
        const ccount = counts[i];
        const bh = (ccount / maxCount) * (h - 8);
        const x = i * barW + 1;
        const y = h - bh - 4;
        ctx.fillRect(x, y, Math.max(0, barW - 2), Math.max(0, bh));
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
  }, [width, height, bins, color]);

  return (
    <div style={{ width, height }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-hidden="false"
      />
    </div>
  );
}
