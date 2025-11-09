// components/DashboardShell.tsx
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import ScatterPlot from './charts/ScatterPlot';
import Heatmap from './charts/Heatmap';
import PerformanceMonitor from './ui/PerformanceMonitor';
import { useDataStream } from '../hooks/useDataStream';

// lazy-load ControlPanel and StressTools (client-only)
const ControlPanel = dynamic(() => import('./controls/ControlPanel'), { ssr: false });
const StressTools = dynamic(() => import('./controls/StressTools'), { ssr: false });

export default function DashboardShell() {
  const { data, controls } = useDataStream({ rateMs: 100, batchSize: 40, running: true });
  const running = controls.running();

  // read options and derive worker state
  const getOptions = controls.getOptions;
  const currentWorkerMode = (() => {
    try {
      return !!getOptions().useWorker;
    } catch {
      return false;
    }
  })();

  function setWorkerMode(v: boolean) {
    controls.setOptions({ useWorker: v });
  }

  // optional: light statistics for header
  const totalPoints = data.length;

  return (
    <main className="p-6 min-h-screen bg-[var(--bg-surface)] text-[var(--foreground)]">
      <header className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Performance Dashboard</h1>
          <div className="text-sm text-slate-400">
            Points stored: <span className="font-mono">{totalPoints}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <ControlPanel
            running={running}
            onStart={() => controls.start()}
            onStop={() => controls.stop()}
            onSetRate={(r) => controls.setOptions({ rateMs: r })}
            onSetBatch={(b) => controls.setOptions({ batchSize: b })}
          />

          <StressTools
            setWorkerMode={setWorkerMode}
            currentWorkerMode={currentWorkerMode}
            getCurrentOptions={getOptions}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="h2">Line Chart (realtime)</h2>
          <LineChart data={data} width={700} height={260} />
        </div>

        <div className="card">
          <h2 className="h2">Bar Chart (aggregate)</h2>
          <BarChart data={data} width={380} height={200} />
        </div>

        <div className="card">
          <h2 className="h2">Scatter Plot</h2>
          <ScatterPlot data={data} width={380} height={200} />
        </div>

        <div className="card">
          <h2 className="h2">Heatmap</h2>
          <Heatmap data={data} width={380} height={200} />
        </div>
      </section>

      <PerformanceMonitor />
    </main>
  );
}
