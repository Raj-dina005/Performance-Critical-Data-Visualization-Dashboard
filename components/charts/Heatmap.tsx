// components/charts/Heatmap.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; className?: string };

function colorFor(v: number, min: number, max: number) {
  const t = (v - min) / (max - min || 1);
  const r = Math.round(255 * t);
  const g = 80;
  const b = Math.round(255 * (1 - t));
  return `rgb(${r},${g},${b})`;
}

export default function Heatmap({ data, width = 380, height = 200, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.floor(width * DPR); canvas.height = Math.floor(height * DPR);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(DPR,0,0,DPR,0,0);

    const cols = 40, rows = 20;
    const grid = new Array(cols * rows).fill(0);
    let min = Infinity, max = -Infinity;
    for (const p of data) { if (p.v < min) min = p.v; if (p.v > max) max = p.v; }
    const chunk = Math.max(1, Math.floor(data.length / (cols * rows)));
    for (let i = 0; i < data.length; i += chunk) {
      const idx = Math.floor((i / data.length) * (cols * rows));
      grid[idx] += data[i].v;
    }
    const maxVal = Math.max(...grid, 1);
    const cellW = width / cols, cellH = height / rows;
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const v = grid[y * cols + x];
        ctx.fillStyle = colorFor(v, 0, maxVal);
        ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
      }
    }
  }, [data, width, height]);

  return <canvas ref={ref} className={className} aria-label="Heatmap" />;
}
