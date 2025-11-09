// components/charts/BarChart.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; className?: string };

export default function BarChart({ data, width = 400, height = 200, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // simple aggregation into 50 bins
    const bins = 50;
    const counts = new Array(bins).fill(0);
    let min = Infinity, max = -Infinity;
    for (const p of data) { if (p.v < min) min = p.v; if (p.v > max) max = p.v; }
    const range = (max - min) || 1;
    for (const p of data) {
      const i = Math.floor(((p.v - min) / range) * (bins - 1));
      counts[i]++;
    }
    const maxCount = Math.max(...counts, 1);
    ctx.clearRect(0,0,width,height);
    const bw = width / bins;
    for (let i=0;i<bins;i++){
      const h = (counts[i] / maxCount) * height;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(i * bw, height - h, bw - 1, h);
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} className={className} aria-label="Bar chart" />;
}
