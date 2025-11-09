// components/charts/LineChart.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
};

export default function LineChart({ data, width = 700, height = 260, color = '#3b82f6' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<DataPoint[]>([]);
  dataRef.current = data || [];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // DPR scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const cw = Math.max(1, Math.floor((canvas.clientWidth || width) * dpr));
    const ch = Math.max(1, Math.floor((canvas.clientHeight || height) * dpr));
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = `${canvas.clientWidth || width}px`;
    canvas.style.height = `${canvas.clientHeight || height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    let running = true;

    function draw() {
      const c = canvasRef.current;
      const ctxNow = ctxRef.current;
      if (!running || !c || !ctxNow) {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        return;
      }

      const w = c.clientWidth || width;
      const h = c.clientHeight || height;
      ctxNow.clearRect(0, 0, w, h);

      const pts = dataRef.current || [];
      if (!pts.length) {
        // placeholder grid if no data
        ctxNow.beginPath();
        ctxNow.strokeStyle = '#f3f3f3';
        for (let x = 0; x < w; x += Math.max(40, w / 10)) {
          ctxNow.moveTo(x, 0); ctxNow.lineTo(x, h);
        }
        ctxNow.stroke();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // compute range
      let minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const v = pts[i].value;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      if (minV === maxV) maxV = minV + 1;
      if (!isFinite(minV) || !isFinite(maxV)) { minV = -1; maxV = 1; }
      const range = maxV - minV;

      const len = pts.length;
      const stepX = Math.max(1, w / Math.max(1, len - 1));

      ctxNow.beginPath();
      ctxNow.strokeStyle = color;
      for (let i = 0; i < len; i++) {
        const p = pts[i];
        const x = i * stepX;
        const y = h - ((p.value - minV) / range) * h;
        if (i === 0) ctxNow.moveTo(x, y); else ctxNow.lineTo(x, y);
      }
      ctxNow.stroke();

      // draw last dot
      const last = pts[len - 1];
      const lx = (len - 1) * stepX;
      const ly = h - ((last.value - minV) / range) * h;
      ctxNow.beginPath();
      ctxNow.arc(lx, ly, 2.6, 0, Math.PI * 2);
      ctxNow.fill();

      rafRef.current = requestAnimationFrame(draw);
    }

    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, color]);

  return (
    <div style={{ width: '100%', minHeight: `${height}px` }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} />
    </div>
  );
}
