// hooks/useDataStream.ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { startGenerator } from '../lib/dataGenerator';
import type { DataPoint } from '../lib/types';

type Options = { rateMs?: number; batchSize?: number; running?: boolean; useWorker?: boolean };

export function useDataStream(initial: Options = { rateMs: 100, batchSize: 20, running: true, useWorker: false }) {
  const [snapshot, setSnapshot] = useState<DataPoint[]>([]);
  const optsRef = useRef({ rateMs: 100, batchSize: 20, running: true, useWorker: false, ...initial });
  const stopRef = useRef<(() => void) | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // internal: start worker-based generator
  const startWorker = useCallback(() => {
    if (workerRef.current) {
      // already started
      workerRef.current.postMessage({ type: 'start' });
      return;
    }
    try {
      const w = new Worker('/data-worker.js');
      w.onmessage = (ev) => {
        const msg = ev.data || {};
        if (msg.type === 'snapshot') {
          setSnapshot(msg.data || []);
        }
      };
      workerRef.current = w;
      // apply current options and start
      workerRef.current.postMessage({ type: 'setOptions', rateMs: optsRef.current.rateMs, batchSize: optsRef.current.batchSize });
      workerRef.current.postMessage({ type: 'start' });
      stopRef.current = () => {
        try { workerRef.current?.postMessage({ type: 'stop' }); } catch (e) {}
      };
    } catch (e) {
      // worker failed — fall back silently later
      console.warn('Worker start failed', e);
      workerRef.current = null;
    }
  }, []);

  // internal: stop and terminate worker completely
  const terminateWorker = useCallback(() => {
    if (!workerRef.current) return;
    try {
      workerRef.current.postMessage({ type: 'stop' });
      workerRef.current.terminate();
    } catch (e) {}
    workerRef.current = null;
    stopRef.current = null;
  }, []);

  // start generator in main thread
  const startMain = useCallback(() => {
    if (stopRef.current) return;
    stopRef.current = startGenerator((arr) => {
      setSnapshot(arr);
    }, { rateMs: optsRef.current.rateMs, batchSize: optsRef.current.batchSize });
  }, []);

  // stop main generator
  const stopMain = useCallback(() => {
    if (!stopRef.current) return;
    try { stopRef.current(); } catch (e) {}
    stopRef.current = null;
  }, []);

  // public start: choose worker or main
  const start = useCallback(() => {
    if (optsRef.current.useWorker) {
      // ensure main is stopped
      stopMain();
      terminateWorker();
      startWorker();
      optsRef.current.running = true;
      return;
    }
    // main thread generator
    terminateWorker();
    startMain();
    optsRef.current.running = true;
  }, [startMain, startWorker, stopMain, terminateWorker]);

  const stop = useCallback(() => {
    if (optsRef.current.useWorker) {
      if (workerRef.current) workerRef.current.postMessage({ type: 'stop' });
      stopRef.current = null;
      optsRef.current.running = false;
      return;
    }
    // main thread stop
    stopMain();
    optsRef.current.running = false;
  }, [stopMain]);

  // set options (applies to worker or main)
  const setOptions = useCallback((o: { rateMs?: number; batchSize?: number; useWorker?: boolean }) => {
    optsRef.current = { ...optsRef.current, ...o };
    // if switching to worker mode
    if (typeof o.useWorker === 'boolean' && o.useWorker !== !!workerRef.current) {
      // if switching on, start worker; if switching off, terminate worker and start main if running
      if (o.useWorker) {
        // move to worker
        stopMain();
        terminateWorker();
        startWorker();
      } else {
        // move to main
        terminateWorker();
        if (optsRef.current.running) startMain();
      }
    } else {
      // same runtime: apply options to currently running generator
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'setOptions', rateMs: optsRef.current.rateMs, batchSize: optsRef.current.batchSize });
      } else {
        // restart main generator to pick options
        const wasRunning = !!stopRef.current;
        if (wasRunning) {
          stopMain();
          startMain();
        }
      }
    }
  }, [startMain, startWorker, stopMain, terminateWorker]);

  useEffect(() => {
    // initial choice
    if (optsRef.current.useWorker) {
      startWorker();
    } else {
      startMain();
    }
    return () => {
      stopMain();
      terminateWorker();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data: snapshot,
    controls: {
      start,
      stop,
      running: () => optsRef.current.running === true,
      setOptions,
      getOptions: () => ({ rateMs: optsRef.current.rateMs, batchSize: optsRef.current.batchSize, useWorker: optsRef.current.useWorker, running: optsRef.current.running }),
    },
  };
}
