// components/controls/ControlPanel.tsx
'use client';
import React, { useEffect, useState } from 'react';

type Props = {
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onSetRate: (rateMs: number) => void;
  onSetBatch: (batch: number) => void;
};

export default function ControlPanel({ running, onStart, onStop, onSetRate, onSetBatch }: Props) {
  const [localRate, setLocalRate] = useState(100);
  const [localBatch, setLocalBatch] = useState(20);
  const [stressActive, setStressActive] = useState(false);

  const STRESS_PRESET = { rateMs: 10, batch: 200 };

  useEffect(() => {
    if (!stressActive) {
      setLocalRate(100);
      setLocalBatch(20);
      onSetRate(100);
      onSetBatch(20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stressActive]);

  function toggleStartStop() {
    if (running) onStop(); else onStart();
  }

  function runStressToggle() {
    if (!stressActive) {
      setStressActive(true);
      setLocalRate(STRESS_PRESET.rateMs);
      setLocalBatch(STRESS_PRESET.batch);
      onSetRate(STRESS_PRESET.rateMs);
      onSetBatch(STRESS_PRESET.batch);
      onStart();
    } else {
      setStressActive(false);
      onStop();
      setLocalRate(100);
      setLocalBatch(20);
      onSetRate(100);
      onSetBatch(20);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-gray-800 text-white p-3 rounded">
      <button onClick={toggleStartStop} className={`px-3 py-1 rounded font-semibold ${running ? 'bg-red-600' : 'bg-green-600'}`}>
        {running ? 'Stop' : 'Start'}
      </button>

      <div className="flex items-center gap-2">
        <label className="text-sm">Rate (ms)</label>
        <input type="range" min={10} max={500} step={10} value={localRate}
          onChange={(e) => { const v = Number(e.target.value); setLocalRate(v); onSetRate(v); if (stressActive) setStressActive(false); }}
        />
        <span className="text-xs">{localRate}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm">Batch</label>
        <input type="range" min={1} max={500} step={1} value={localBatch}
          onChange={(e) => { const v = Number(e.target.value); setLocalBatch(v); onSetBatch(v); if (stressActive) setStressActive(false); }}
        />
        <span className="text-xs">{localBatch}</span>
      </div>

      <button onClick={runStressToggle} className={`px-3 py-1 rounded ${stressActive ? 'bg-yellow-600' : 'bg-indigo-600'}`}>
        {stressActive ? 'Stop Stress' : 'Start Stress'}
      </button>

      <div className="ml-2 text-xs text-gray-300">
        Mode: <span className="font-mono">{stressActive ? 'STRESS' : running ? 'LIVE' : 'PAUSED'}</span>
      </div>
    </div>
  );
}
