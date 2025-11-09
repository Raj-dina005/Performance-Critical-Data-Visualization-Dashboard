// lib/types.ts
export type DataPoint = {
  timestamp: number; // ms since epoch
  value: number;
  category?: string;
  metadata?: Record<string, any>;
};
