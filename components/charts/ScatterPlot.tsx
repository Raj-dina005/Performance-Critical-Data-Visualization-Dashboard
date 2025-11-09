// components/charts/ScatterPlot.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; color?: string; };

export default function ScatterPlot({ data, width = 380, height = 200, color = '#60a5fa' }: Props) {
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

      let minV = Infinity, maxV = -Infinity;
      for (const p of pts) { if (p.value < minV) minV = p.value; if (p.value > maxV) maxV = p.value; }
      if (!isFinite(minV) || !isFinite(maxV)) { minV = -1; maxV = 1; }
      if (minV === maxV) maxV = minV + 1;
      const range = maxV - minV;

      ctx.fillStyle = color;
      const len = pts.length;
      for (let i = 0; i < len; i++) {
        const p = pts[i];
        const x = (i / Math.max(1, len - 1)) * w;
        const y = h - ((p.value - minV) / range) * h;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; } };
  }, [width, height, color]);

  return <div style={{ width: '100%', minHeight: `${height}px` }}><canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} /></div>;
}
