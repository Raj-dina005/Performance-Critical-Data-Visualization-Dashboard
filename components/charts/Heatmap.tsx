// components/charts/Heatmap.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; };

export default function Heatmap({ data, width = 380, height = 200 }: Props) {
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

      // Create a grid (20x10) and accumulate values
      const cols = 40;
      const rows = 10;
      const grid = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
      let minV = Infinity, maxV = -Infinity;
      for (const p of pts) { if (p.value < minV) minV = p.value; if (p.value > maxV) maxV = p.value; }
      if (!isFinite(minV) || !isFinite(maxV)) { minV = -1; maxV = 1; }
      const range = (maxV - minV) || 1;

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const col = Math.min(cols - 1, Math.max(0, Math.floor((i / Math.max(1, pts.length - 1)) * cols)));
        const row = Math.min(rows - 1, Math.max(0, Math.floor(((p.value - minV) / range) * rows)));
        grid[row][col] += 1;
      }

      const maxCount = Math.max(...grid.flat(), 1);
      const cellW = w / cols;
      const cellH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = grid[r][c];
          const intensity = v / maxCount;
          // simple blue->red gradient
          const rC = Math.floor(255 * intensity);
          const gC = Math.floor(120 * (1 - intensity));
          const bC = Math.floor(200 * (1 - intensity));
          ctx.fillStyle = `rgb(${rC},${gC},${bC})`;
          ctx.fillRect(c * cellW, h - (r + 1) * cellH, cellW, cellH);
        }
      }

      raf.current = requestAnimationFrame(draw);
    }

    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
  }, [width, height]);

  return <div style={{ width: '100%', minHeight: `${height}px` }}><canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} /></div>;
}
