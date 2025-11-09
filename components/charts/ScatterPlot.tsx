// components/charts/ScatterPlot.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
};

export default function ScatterPlot({
  data,
  width = 380,
  height = 200,
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
      // re-check canvas and ctx so TS is satisfied
      const c = canvasRef.current;
      if (!mounted || !c || !ctx) {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        return;
      }

      const pts = dataRef.current || [];
      const w = c.clientWidth || width;
      const h = c.clientHeight || height;

      // clear
      ctx.clearRect(0, 0, w, h);

      if (!pts.length) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // compute min/max for scaling on value axis
      let min = Infinity, max = -Infinity;
      for (const p of pts) {
        const v = p.value;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) { min -= 1; max += 1; }
      const range = max - min || 1;

      // sample if too many points for performance
      const sampleEvery = Math.max(1, Math.floor(pts.length / 150));
      ctx.fillStyle = color;
      for (let i = 0; i < pts.length; i += sampleEvery) {
        const p = pts[i];
        // x space by index, y by normalized value
        const x = (i / Math.max(1, pts.length - 1)) * w;
        const y = h - ((p.value - min) / range) * h;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
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
  }, [width, height, color]);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
