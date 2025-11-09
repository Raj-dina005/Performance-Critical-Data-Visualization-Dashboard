// components/charts/ScatterPlot.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; className?: string };

export default function ScatterPlot({ data, width = 380, height = 200, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * DPR); canvas.height = Math.floor(height * DPR);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,width,height);
    let min = Infinity, max = -Infinity;
    for (const p of data) { if (p.v < min) min = p.v; if (p.v > max) max = p.v; }
    const range = (max - min) || 1;
    const maxPoints = Math.min(2000, data.length);
    const step = Math.max(1, Math.floor(data.length / maxPoints));
    ctx.fillStyle = '#fb923c';
    for (let i = 0; i < data.length; i += step) {
      const p = data[i];
      const x = ((i / (data.length - 1)) || 0) * width;
      const y = height - ((p.v - min) / range) * height;
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
    }
  }, [data, width, height]);

  return <canvas ref={ref} className={className} aria-label="Scatter plot" />;
}
