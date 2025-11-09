'use client';
import React from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

export default function PerformanceMonitor() {
  const { fps, mem } = usePerformanceMonitor();
  return (
    <div className="perf-overlay">
      <div>FPS: <span className="font-mono">{fps}</span></div>
      <div>Mem: <span className="font-mono">{mem ?? '—'} MB</span></div>
    </div>
  );
}
