// components/OffscreenCanvasView.tsx
'use client';
import React, { useEffect, useRef } from 'react';

type Props = {
  id?: string;
  width?: number;
  height?: number;
  autoStart?: boolean;
};

export default function OffscreenCanvasView({
  id = 'offscreen-canvas',
  width = 900,
  height = 300,
  autoStart = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!(canvas.transferControlToOffscreen && 'Worker' in window)) {
      console.warn('OffscreenCanvas or Worker not supported — falling back to main-thread rendering.');
      return;
    }

    if (workerRef.current) return; // already done for this instance

    // try to remove dataset flag if present from dev hot reload
    try { if ((canvas as any).dataset?._offscreenTransferred === 'true') delete (canvas as any).dataset._offscreenTransferred; } catch {}

    let worker: Worker | null = null;
    try {
      worker = new Worker('/offscreen-renderer.js');
      workerRef.current = worker;
    } catch (err) {
      console.error('Failed to create worker:', err);
      workerRef.current = null;
      return;
    }

    // transfer canvas to offscreen (guarded)
    try {
      const offscreen = (canvas as any).transferControlToOffscreen();
      offscreen.width = width;
      offscreen.height = height;
      try { (canvas as any).dataset._offscreenTransferred = 'true'; } catch {}
      worker.postMessage({ type: 'init', canvas: offscreen, width, height }, [offscreen]);
    } catch (err) {
      console.warn('transferControlToOffscreen failed:', err);
      try { workerRef.current?.terminate(); } catch {}
      workerRef.current = null;
      return;
    }

    // listen for worker "inited" -> then expose helper and optionally start
    const onWorkerMsg = (ev: MessageEvent) => {
      try {
        const m = ev.data || {};
        if (m && m.type === 'inited') {
          // worker is initialized — expose the helper
          (window as any).offscreenWorkerSend = (msg: any) => {
            try { workerRef.current?.postMessage(msg); } catch (e) {}
          };
          // optionally auto-start
          if (autoStart) {
            try { workerRef.current?.postMessage({ type: 'start' }); } catch {}
          }
        } else if (m && m.type === 'pong') {
          // could set a UI flag or console log
          // console.log('offscreen worker pong');
        }
      } catch (e) {}
    };
    workerRef.current.onmessage = onWorkerMsg;
    workerRef.current.onerror = (ev: ErrorEvent) => console.error('worker error', ev.message || ev);

    function handleResize() {
      const w = canvas.clientWidth || width;
      const h = canvas.clientHeight || height;
      try { workerRef.current?.postMessage({ type: 'resize', width: Math.round(w), height: Math.round(h) }); } catch {}
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        // only clear global if it points to this instance (best-effort)
        if ((window as any).offscreenWorkerSend) (window as any).offscreenWorkerSend = undefined;
      } catch {}
      try { workerRef.current?.postMessage({ type: 'stop' }); } catch {}
      try { workerRef.current?.terminate(); } catch {}
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, autoStart]);

  return <canvas ref={canvasRef} id={id} style={{ width: '100%', height: `${height}px`, display: 'block' }} />;
}
