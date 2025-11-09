// lib/types.ts
// Shared types for the performance dashboard

export interface DataPoint {
  // unix millis timestamp (number)
  timestamp: number;

  // numeric value to plot
  value: number;

  // optional category for grouping/aggregation
  category?: string;

  // optional free-form metadata
  metadata?: Record<string, any>;
}

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export interface ChartConfig {
  type: ChartType;
  dataKey: string;
  color?: string;
  visible?: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // bytes
  renderTime: number; // ms
  dataProcessingTime: number; // ms
}
