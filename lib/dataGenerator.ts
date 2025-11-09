// lib/dataGenerator.ts
import type { DataPoint } from './types';

export function generateBatch(baseTimestamp: number, count: number): DataPoint[] {
  const out: DataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = baseTimestamp + i;
    // sine + small noise to look realistic
    const value = Math.sin((t / 200) + (i / 10)) * 20 + Math.random() * 4;
    out.push({ timestamp: Date.now() + i, value, metadata: { genIndex: i } });
  }
  return out;
}
