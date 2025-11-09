'use client';
import React, { useEffect, useRef } from 'react';
import type { DataPoint } from '../../lib/types';

type Props = {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
};

export default function LineChart({
  data,
  width = 700,
  height = 260,
  color = '#3b82f6',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<DataPoint[]>(data);
  dataRef.current = data;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return; // ✅ early exit fixes build issue

    const dpr = window.devicePixelRatio || 1;
    const clientW = canvas.clientWidth || width;
    const clientH = canvas.clientHeight || height;
    canvas.width = Math.floor(clientW * dpr);
    canvas.height = Math.floor(clientH * dpr);
    canvas.style.width = `${clientW}px`;
    canvas.style.height = `${clientH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = color;

    let mounted = true;

    const draw = () => {
      if (!mounted) return;
      if (!ctx) return; // ✅ ensure ctx not null inside animation loop

      const w = canvas.clientWidth || width;
      const h = canvas.clientHeight || height;

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      const pts = dataRef.current || [];
      if (pts.length === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      let minV = Infinity;
      let maxV = -Infinity;
      for (let i = 0; i < pts.length; i++) {
        const v = pts[i].value;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      if (minV === maxV) {
        minV -= 1;
        maxV += 1;
      }
      const range = maxV - minV;
      const stepX = w / Math.max(1, pts.length - 1);

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const x = i * stepX;
        const y = h - ((pts[i].value - minV) / range) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [width, height, color]);

  return (
    <div style={{ width, height }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
