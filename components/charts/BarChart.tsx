// components/charts/BarChart.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; color?: string; };

export default function BarChart({ data, width = 380, height = 200, color = '#60a5fa' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);
  const dataRef = useRef<DataPoint[]>([]);
  dataRef.current = data || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cw = Math.max(1, Math.floor((canvas.clientWidth || width) * dpr));
    const ch = Math.max(1, Math.floor((canvas.clientHeight || height) * dpr));
    canvas.width = cw; canvas.height = ch;
    canvas.style.width = `${canvas.clientWidth || width}px`;
    canvas.style.height = `${canvas.clientHeight || height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function draw() {
      const pts = dataRef.current || [];
      const w = canvas.clientWidth || width;
      const h = canvas.clientHeight || height;
      ctx.clearRect(0, 0, w, h);

      if (!pts.length) { raf.current = requestAnimationFrame(draw); return; }

      // simple histogram
      const buckets = 40;
      let minV = Infinity, maxV = -Infinity;
      for (const p of pts) { if (p.value < minV) minV = p.value; if (p.value > maxV) maxV = p.value; }
      if (!isFinite(minV) || !isFinite(maxV)) { minV = -1; maxV = 1; }
      if (minV === maxV) maxV = minV + 1;
      const range = maxV - minV;

      const counts = new Array(buckets).fill(0);
      for (const p of pts) {
        const idx = Math.min(buckets - 1, Math.max(0, Math.floor(((p.value - minV) / range) * buckets)));
        counts[idx]++;
      }

      const barW = (w / buckets) * 0.9;
      const maxCount = Math.max(...counts, 1);
      ctx.fillStyle = color;
      for (let i = 0; i < buckets; i++) {
        const c = counts[i];
        const barH = (c / maxCount) * (h * 0.9);
        const x = i * (w / buckets) + (w / buckets - barW) / 2;
        const y = h - barH;
        ctx.fillRect(x, y, barW, barH);
      }

      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; } };
  }, [width, height, color]);

  return <div style={{ width: '100%', minHeight: `${height}px` }}><canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} /></div>;
}
