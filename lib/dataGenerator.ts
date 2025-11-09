// lib/dataGenerator.ts
import type { DataPoint } from './types';

export class RingBuffer {
  buffer: (DataPoint | null)[];
  capacity: number;
  write = 0;
  size = 0;
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }
  push(item: DataPoint) {
    this.buffer[this.write] = item;
    this.write = (this.write + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  }
  toArray(): DataPoint[] {
    const out: DataPoint[] = [];
    const start = (this.write - this.size + this.capacity) % this.capacity;
    for (let i = 0; i < this.size; i++) {
      const v = this.buffer[(start + i) % this.capacity];
      if (v) out.push(v);
    }
    return out;
  }
}

export function startGenerator(onData: (arr: DataPoint[]) => void, options = { rateMs: 100, batchSize: 20 }) {
  const buffer = new RingBuffer(200_000);
  let id = 0;
  let running = true;

  function genBatch() {
    if (!running) return;
    const now = Date.now();
    for (let i = 0; i < options.batchSize; i++) {
      const value = Math.sin((id + i) * 0.01) * 50 + Math.random() * 20;
      const category = ['A','B','C'][Math.floor(Math.random()*3)];
      buffer.push({ t: now + i, v: value, id: id++, category });
    }
    onData(buffer.toArray());
    setTimeout(genBatch, options.rateMs);
  }
  genBatch();
  return () => { running = false; };
}
