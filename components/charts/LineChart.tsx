// components/charts/LineChart.tsx
'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = { data: DataPoint[]; width?: number; height?: number; className?: string };

export default function LineChart({ data, width = 800, height = 240, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDraw = useRef(0);

  // Downsample based on width (LOD)
  const processed = useMemo(() => {
    const w = Math.max(1, Math.floor(width));
    const step = Math.max(1, Math.floor(data.length / w));
    const out: DataPoint[] = [];
    for (let i = 0; i < data.length; i += step) out.push(data[i]);
    return out;
  }, [data, width]);

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

    function draw() {
      const now = performance.now();
      if (now - lastDraw.current < 16) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastDraw.current = now;

      ctx.clearRect(0, 0, width, height);
      if (processed.length === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // bounds
      let minV = Infinity, maxV = -Infinity;
      for (const p of processed) { if (p.v < minV) minV = p.v; if (p.v > maxV) maxV = p.v; }
      if (!isFinite(minV) || !isFinite(maxV)) { rafRef.current = requestAnimationFrame(draw); return; }
      const pad = (maxV - minV) * 0.1 || 1;
      minV -= pad; maxV += pad;

      ctx.lineWidth = 1.4;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();
      const len = processed.length;
      for (let i = 0; i < len; i++) {
        const p = processed[i];
        const x = (i / (len - 1)) * width;
        const y = height - ((p.v - minV) / (maxV - minV)) * height;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [processed, width, height]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label="Line chart" />;
}
