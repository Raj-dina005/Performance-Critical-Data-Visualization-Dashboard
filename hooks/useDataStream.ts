// hooks/useDataStream.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataPoint } from '../lib/types';
import { createGenerator, type GeneratorOptions } from '../lib/dataGenerator';

type Options = {
  rateMs?: number;
  batchSize?: number;
  running?: boolean;
  useWorker?: boolean; // preserved for UI, no-op here
  maxBuffer?: number; // how many points to keep in memory
};

export function useDataStream(initialOptions?: Options) {
  const optsRef = useRef<Required<Options>>({
    rateMs: initialOptions?.rateMs ?? 100,
    batchSize: initialOptions?.batchSize ?? 20,
    running: initialOptions?.running ?? false,
    useWorker: initialOptions?.useWorker ?? false,
    maxBuffer: initialOptions?.maxBuffer ?? 10000,
  });

  const [data, setData] = useState<DataPoint[]>([]);

  // keep a local ref to data for quick mutations from generator
  const bufferRef = useRef<DataPoint[]>([]);
  bufferRef.current = bufferRef.current || [];

  // generator controller
  const genRef = useRef<ReturnType<typeof createGenerator> | null>(null);

  // initialize generator once
  useEffect(() => {
    // create generator; its onData receives batches of DataPoint[]
    genRef.current = createGenerator((batch: DataPoint[]) => {
      // push into local buffer and trim to maxBuffer
      bufferRef.current.push(...batch);
      const max = optsRef.current.maxBuffer;
      if (bufferRef.current.length > max) {
        // keep the most recent max points
        bufferRef.current = bufferRef.current.slice(bufferRef.current.length - max);
      }
      // update React state (batched)
      setData(bufferRef.current.slice());
    }, { rateMs: optsRef.current.rateMs, batchSize: optsRef.current.batchSize, startId: 0 });

    // start if requested
    if (optsRef.current.running) genRef.current.start();

    return () => {
      // cleanup
      if (genRef.current) {
        genRef.current.stop();
        genRef.current = null;
      }
      bufferRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // controls API
  const start = useCallback(() => {
    if (!genRef.current) return;
    genRef.current.start();
    optsRef.current.running = true;
  }, []);

  const stop = useCallback(() => {
    if (!genRef.current) return;
    genRef.current.stop();
    optsRef.current.running = false;
  }, []);

  const generateOnce = useCallback(() => {
    genRef.current?.generateOnce();
  }, []);

  const setOptions = useCallback((newOpts: Partial<Options>) => {
    if (!genRef.current) return;
    if (typeof newOpts.rateMs === 'number') {
      genRef.current.setOptions({ rateMs: newOpts.rateMs });
      optsRef.current.rateMs = newOpts.rateMs;
    }
    if (typeof newOpts.batchSize === 'number') {
      genRef.current.setOptions({ batchSize: newOpts.batchSize });
      optsRef.current.batchSize = newOpts.batchSize;
    }
    if (typeof newOpts.maxBuffer === 'number') {
      optsRef.current.maxBuffer = newOpts.maxBuffer;
      // trim buffer immediately if needed
      if (bufferRef.current.length > optsRef.current.maxBuffer) {
        bufferRef.current = bufferRef.current.slice(bufferRef.current.length - optsRef.current.maxBuffer);
        setData(bufferRef.current.slice());
      }
    }
    if (typeof newOpts.useWorker === 'boolean') {
      optsRef.current.useWorker = newOpts.useWorker;
    }
  }, []);

  const getOptions = useCallback(() => ({ ...optsRef.current }), []);

  const running = useCallback(() => !!optsRef.current.running, []);

  return {
    data,
    controls: {
      start,
      stop,
      generateOnce,
      setOptions,
      getOptions,
      running,
    },
  };
}

export default useDataStream;
