// lib/dataGenerator.ts
// Simple time-series data generator that produces DataPoint[]
// Must match lib/types.ts -> DataPoint { timestamp: number; value: number; category?: string; metadata?: Record<string, any> }

import type { DataPoint } from './types';

export type GeneratorOptions = {
  rateMs?: number;    // interval between batches (ms)
  batchSize?: number; // number of points per batch
  startId?: number;   // optional id seed stored in metadata
};

// helper to create a realistic value (sine + noise)
function makeValue(index: number, offset = 0) {
  // sin wave + light noise and slow drift
  return Math.sin((index + offset) * 0.01) * 50 + Math.random() * 6 + Math.sin((index + offset) * 0.001) * 6;
}

/**
 * generateBatch
 * - returns an array of DataPoint objects (timestamp, value, category, metadata)
 */
export function generateBatch(
  startTimestamp: number,
  startIndex: number,
  batchSize: number,
  categories: string[] = ['A', 'B', 'C']
): DataPoint[] {
  const out: DataPoint[] = [];
  for (let i = 0; i < batchSize; i++) {
    const idx = startIndex + i;
    const now = startTimestamp + i; // small offset per point (caller may adjust)
    const value = makeValue(idx, startIndex);
    const category = categories[(Math.floor(Math.random() * categories.length))];
    out.push({
      timestamp: now,
      value,
      category,
      metadata: { id: idx },
    });
  }
  return out;
}

/**
 * createGenerator
 * - returns a small controller API to start/stop continuous generation
 * - onData callback receives DataPoint[] batches
 */
export function createGenerator(
  onData: (batch: DataPoint[]) => void,
  opts?: GeneratorOptions
) {
  const options: Required<GeneratorOptions> = {
    rateMs: opts?.rateMs ?? 100,
    batchSize: opts?.batchSize ?? 20,
    startId: opts?.startId ?? 0,
  };

  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let nextIndex = options.startId;
  let lastTimestamp = Date.now();

  function genBatchOnce() {
    const batch = generateBatch(lastTimestamp, nextIndex, options.batchSize);
    // advance counters
    nextIndex += options.batchSize;
    lastTimestamp += options.rateMs;
    onData(batch);
  }

  function loop() {
    if (!running) return;
    genBatchOnce();
    timer = setTimeout(loop, options.rateMs);
  }

  return {
    start() {
      if (running) return;
      running = true;
      loop();
    },
    stop() {
      running = false;
      if (timer) { clearTimeout(timer); timer = null; }
    },
    setOptions(newOpts: Partial<GeneratorOptions>) {
      if (typeof newOpts.rateMs === 'number') options.rateMs = newOpts.rateMs;
      if (typeof newOpts.batchSize === 'number') options.batchSize = newOpts.batchSize;
      if (typeof newOpts.startId === 'number') options.startId = newOpts.startId;
    },
    generateOnce() {
      genBatchOnce();
    },
    isRunning() {
      return running;
    },
    // expose internal counters for debugging
    _debug() {
      return { nextIndex, lastTimestamp, options };
    },
  };
}
