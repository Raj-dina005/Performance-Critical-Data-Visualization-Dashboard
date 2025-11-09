// components/charts/LineChart.tsx
'use client';

import React, { useEffect, useRef } from 'react';

type DataPoint = {
  timestamp: number;
  value: number;
  [k: string]: any;
};

type Props = {
  data: DataPoint[]; // incoming data array (newest at end)
  width?: number;
  height?: number;
  color?: string;
};

export default function LineChart({
  data,
  width = 700,
  height = 260,
  color = '#3b82f6', // tailwind blue-400
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDataRef = useRef<DataPoint[]>([]);
  const mountedRef = useRef(true);

  // keep a stable ref to data to avoid re-registering the animation loop too often
  useEffect(() => {
    lastDataRef.current = data;
  }, [data]);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // create/obtain 2D context safely
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // No 2D context available — possibly running in an environment that doesn't support canvas
      console.warn('LineChart: 2D context not available');
      ctxRef.current = null;
      return;
    }
    ctxRef.current = ctx;

    // device pixel ratio scaling for crisp lines
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const pixelWidth = Math.max(1, Math.floor((canvas.clientWidth || width) * dpr));
    const pixelHeight = Math.max(1, Math.floor((canvas.clientHeight || height) * dpr));
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${canvas.clientWidth || width}px`;
    canvas.style.height = `${canvas.clientHeight || height}px`;
    ctx.scale(dpr, dpr);

    // drawing parameters
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.clearRect(0, 0, width, height);

    let lastDrawTime = performance.now();

    function draw() {
      if (!mountedRef.current) return;
      const ctxNow = ctxRef.current;
      const canvasNow = canvasRef.current;
      if (!ctxNow || !canvasNow) {
        // if context or canvas missing, stop loop
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return;
      }

      // throttle if needed (we keep an rAF loop but not heavy)
      const now = performance.now();
      const elapsed = now - lastDrawTime;
      // draw at screen refresh; you can use elapsed to skip heavy draws

      // prepare drawing surface
      // use CSS width/height (not pixelWidth) because ctx was scaled by DPR
      const w = canvasNow.clientWidth || width;
      const h = canvasNow.clientHeight || height;
      ctxNow.clearRect(0, 0, w, h);

      const processed = lastDataRef.current || [];
      if (processed.length === 0) {
        // nothing to draw
        lastDrawTime = now;
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // compute min/max of value
      let minV = Number.POSITIVE_INFINITY;
      let maxV = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < processed.length; i++) {
        const v = processed[i].value;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      if (minV === Infinity || maxV === -Infinity) {
        minV = 0;
        maxV = 1;
      }
      // small padding
      if (minV === maxV) {
        maxV = minV + 1;
      }
      const vRange = maxV - minV;

      // map values to canvas coordinates (left-to-right)
      const pts = processed;
      const len = pts.length;
      const stepX = Math.max(1, w / Math.max(1, len - 1));

      ctxNow.beginPath();
      for (let i = 0; i < len; i++) {
        const p = pts[i];
        const x = i * stepX;
        // invert Y because canvas origin is top-left
        const y = h - ((p.value - minV) / vRange) * h;
        if (i === 0) ctxNow.moveTo(x, y);
        else ctxNow.lineTo(x, y);
      }
      ctxNow.strokeStyle = color;
      ctxNow.stroke();

      // optional: draw a thin filled stroke for visual weight (shadow-like)
      // small circle at latest point
      const last = pts[len - 1];
      const lastX = (len - 1) * stepX;
      const lastY = h - ((last.value - minV) / vRange) * h;
      ctxNow.beginPath();
      ctxNow.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
      ctxNow.fillStyle = color;
      ctxNow.fill();

      lastDrawTime = now;
      rafRef.current = requestAnimationFrame(draw);
    }

    // start loop
    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);

    // cleanup
    return () => {
      mountedRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // clear refs we set
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, color]);

  return (
    <div style={{ width: '100%', minHeight: `${height}px` }}>
      <canvas
        ref={canvasRef}
        id="linechart-canvas"
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
        aria-hidden
      />
    </div>
  );
}
