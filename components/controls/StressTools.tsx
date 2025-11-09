'use client';
import React, { useState } from 'react';
import { runStressReport } from '../../lib/stressReporter';

type Props = {
  setWorkerMode: (v: boolean) => void;
  currentWorkerMode: boolean;
  getCurrentOptions: () => { rateMs: number; batchSize: number; useWorker?: boolean };
};

export default function StressTools({ setWorkerMode, currentWorkerMode, getCurrentOptions }: Props) {
  const [runningReport, setRunningReport] = useState(false);

  async function handleRunReport() {
    setRunningReport(true);
    // run default 10s report
    await runStressReport(10000, 200);
    setRunningReport(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          setWorkerMode(!currentWorkerMode);
        }}
        className={`px-2 py-1 rounded ${currentWorkerMode ? 'bg-emerald-600' : 'bg-gray-700'}`}
        title="Toggle Web Worker for generator"
      >
        {currentWorkerMode ? 'Worker: ON' : 'Worker: OFF'}
      </button>

      <button
        onClick={handleRunReport}
        className="px-3 py-1 rounded bg-yellow-600"
        disabled={runningReport}
      >
        {runningReport ? 'Running report...' : 'Run Stress Report (10s)'}
      </button>
    </div>
  );
}
