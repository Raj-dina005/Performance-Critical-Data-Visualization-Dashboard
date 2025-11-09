// components/DashboardShell.tsx
'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import OffscreenCanvasView from './OffscreenCanvasView';
import BarChart from './charts/BarChart';
import ScatterPlot from './charts/ScatterPlot';
import Heatmap from './charts/Heatmap';
import PerformanceMonitor from './ui/PerformanceMonitor';
import { useDataStream } from '../hooks/useDataStream';

// lazy-load ControlPanel and StressTools (client-only)
const ControlPanel = dynamic(() => import('./controls/ControlPanel'), { ssr: false });
const StressTools = dynamic(() => import('./controls/StressTools'), { ssr: false });

export default function DashboardShell() {
  // keep using the data stream for the non-offscreen charts (bar, scatter, heatmap)
  const { data, controls } = useDataStream({ rateMs: 100, batchSize: 40, running: true });
  const running = controls.running();

  // local state to track if an offscreen worker helper is present
  const [workerAvailable, setWorkerAvailable] = useState(false);

  // read options and derive worker state
  const getOptions = controls.getOptions;
  const currentWorkerMode = (() => {
    try {
      return !!getOptions().useWorker;
    } catch {
      return false;
    }
  })();

  // poll for presence of the global helper so the UI shows Worker: ON/OFF correctly
  useEffect(() => {
    const check = () => setWorkerAvailable(typeof (window as any).offscreenWorkerSend === 'function');
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  // expose a small ping helper (call from console to check worker responds)
  useEffect(() => {
    (window as any).pingWorker = () => {
      try {
        (window as any).offscreenWorkerSend?.({ type: 'ping' });
        console.log('ping sent');
      } catch (e) {
        console.warn('ping failed', e);
      }
    };
    return () => { (window as any).pingWorker = undefined; };
  }, []);

  function setWorkerMode(v: boolean) {
    // update hook-backed options (so non-offscreen charts stay consistent)
    controls.setOptions({ useWorker: v });
    // forward to the offscreen worker if present
    try { (window as any).offscreenWorkerSend?.({ type: 'setOptions', useWorker: v }); } catch (_) {}
  }

  // helper that forwards to both hook controls and offscreen worker (if available)
  function handleStart() {
    controls.start();
    try { (window as any).offscreenWorkerSend?.({ type: 'start' }); } catch (_) {}
  }
  function handleStop() {
    controls.stop();
    try { (window as any).offscreenWorkerSend?.({ type: 'stop' }); } catch (_) {}
  }
  function handleSetRate(ms: number) {
    controls.setOptions({ rateMs: ms });
    try { (window as any).offscreenWorkerSend?.({ type: 'setOptions', rateMs: ms }); } catch (_) {}
  }
  function handleSetBatch(batch: number) {
    controls.setOptions({ batchSize: batch });
    try { (window as any).offscreenWorkerSend?.({ type: 'setOptions', batchSize: batch }); } catch (_) {}
  }

  // optional: light statistics for header
  const totalPoints = data.length;

  return (
    <main className="p-6 min-h-screen bg-[var(--bg-surface)] text-[var(--foreground)]">
      <header className="mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Performance Dashboard</h1>
          <div className="text-sm text-slate-400">
            Points stored (local buffer): <span className="font-mono">{totalPoints}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <ControlPanel
            running={running}
            onStart={handleStart}
            onStop={handleStop}
            onSetRate={handleSetRate}
            onSetBatch={handleSetBatch}
          />

          <StressTools
            setWorkerMode={setWorkerMode}
            currentWorkerMode={currentWorkerMode}
            getCurrentOptions={getOptions}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OffscreenCanvas-powered Line Chart (heavy rendering lives in worker) */}
        <div className="card">
          <h2 className="h2">Line Chart (Offscreen / realtime)</h2>
          {/* autoStart=true so on-mount the Offscreen worker will be initialized automatically */}
          <OffscreenCanvasView width={900} height={260} autoStart={true} />
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

      <div className="mt-4 text-sm text-zinc-500">
        <span className="mr-4">Worker: <span className="font-mono">{workerAvailable ? 'ON' : 'OFF'}</span></span>
        <span>Mode: <span className="font-mono">{currentWorkerMode ? 'WORKER' : 'HOOKS'}</span></span>
        <span className="ml-6 text-xs text-zinc-400">Tip: open Console and run <code>pingWorker()</code> to ping worker.</span>
      </div>

      <PerformanceMonitor />
    </main>
  );
}
