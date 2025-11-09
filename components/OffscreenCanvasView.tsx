// components/OffscreenCanvasView.tsx
'use client';

import React, { useEffect, useRef } from 'react';

type OffscreenCanvasViewProps = {
  width?: number;
  height?: number;
  autoStart?: boolean;
};

export default function OffscreenCanvasView({
  width = 900,
  height = 260,
  autoStart = true,
}: OffscreenCanvasViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'offscreen-canvas';
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      canvas.style.display = 'block';
      wrapper.appendChild(canvas);
      canvasRef.current = canvas;
    }

    // clear any previous transfer flag if present
    try {
      if ((canvas as any).dataset && (canvas as any).dataset._offscreenTransferred === 'true') {
        delete (canvas as any).dataset._offscreenTransferred;
      }
    } catch {
      // ignore
    }

    // TypeScript-safe feature checks
    const canTransfer = typeof (canvas as any).transferControlToOffscreen === 'function';
    const hasWorker = typeof Worker !== 'undefined';

    if (!canTransfer || !hasWorker) {
      console.warn('OffscreenCanvas or Worker not supported in this environment. Using main-thread canvas fallback.');
      return;
    }

    try {
      const offscreen = (canvas as any).transferControlToOffscreen();
      if ((canvas as any).dataset) (canvas as any).dataset._offscreenTransferred = 'true';

      // ensure worker file exists at /offscreen-renderer.js in public/
      const w = new Worker('/offscreen-renderer.js', { type: 'module' });
      workerRef.current = w;

      w.postMessage({ type: 'init', width: canvas.clientWidth || width, height: canvas.clientHeight || height }, [offscreen]);

      if (autoStart) w.postMessage({ type: 'start' });

      (window as any).offscreenWorkerSend = (msg: any) => {
        try {
          w.postMessage(msg);
        } catch (err) {
          console.warn('offscreenWorkerSend failed:', err);
        }
      };

      w.onmessage = (e: MessageEvent) => {
        // debug: console.log('[offscreen worker]', e.data);
      };

      w.onerror = (ev) => {
        console.error('Offscreen worker error:', ev);
      };
    } catch (err) {
      console.error('Failed to initialize offscreen worker:', err);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }

    return () => {
      try {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        if ((window as any).offscreenWorkerSend) {
          try {
            delete (window as any).offscreenWorkerSend;
          } catch {
            (window as any).offscreenWorkerSend = undefined;
          }
        }
        if (canvasRef.current && (canvasRef.current as any).dataset) {
          try {
            delete (canvasRef.current as any).dataset._offscreenTransferred;
          } catch {}
        }
        if (canvasRef.current && wrapper.contains(canvasRef.current)) {
          wrapper.removeChild(canvasRef.current);
          canvasRef.current = null;
        }
      } catch (cleanupErr) {
        console.warn('OffscreenCanvas cleanup error:', cleanupErr);
      }
    };
  }, [height, width, autoStart]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        minHeight: `${height}px`,
        display: 'block',
      }}
    />
  );
}
