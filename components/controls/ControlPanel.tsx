'use client';
import React, { useState, useEffect } from 'react';

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

  // stress presets — tweak if you want another target
  const STRESS_PRESET = { rateMs: 10, batch: 200 }; // ~20k points/sec

  useEffect(() => {
    // keep UI in sync: when stress toggles off, restore default controls
    if (!stressActive) {
      // optionally keep last user-configured values — we restore to 100/20 here
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
      // enable stress: set high load and start
      setStressActive(true);
      setLocalRate(STRESS_PRESET.rateMs);
      setLocalBatch(STRESS_PRESET.batch);
      onSetRate(STRESS_PRESET.rateMs);
      onSetBatch(STRESS_PRESET.batch);
      // ensure generator is started
      onStart();
    } else {
      // disable stress: stop and restore modest load
      setStressActive(false);
      onStop();
      // restore moderate defaults
      setLocalRate(100);
      setLocalBatch(20);
      onSetRate(100);
      onSetBatch(20);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-800 text-white p-3 rounded-lg">
      <button
        onClick={toggleStartStop}
        className={`px-3 py-1 rounded font-semibold transition ${
          running ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {running ? 'Stop' : 'Start'}
      </button>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-300">Rate (ms)</label>
        <input
          type="range"
          min={10}
          max={500}
          step={10}
          value={localRate}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLocalRate(v);
            onSetRate(v);
            // if user changes values while stress is active, disable stress mode
            if (stressActive) setStressActive(false);
          }}
          className="w-40 accent-blue-400"
        />
        <span className="text-xs w-12 text-right">{localRate}</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-300">Batch</label>
        <input
          type="range"
          min={1}
          max={500}
          step={1}
          value={localBatch}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLocalBatch(v);
            onSetBatch(v);
            if (stressActive) setStressActive(false);
          }}
          className="w-36 accent-pink-400"
        />
        <span className="text-xs w-10 text-right">{localBatch}</span>
      </div>

      {/* Stress Test button */}
      <button
        onClick={runStressToggle}
        className={`px-3 py-1 rounded font-semibold transition ${
          stressActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        title="Toggle Stress Test preset (fast updates + large batch)"
      >
        {stressActive ? 'Stop Stress' : 'Start Stress'}
      </button>

      {/* Quick status line */}
      <div className="ml-2 text-xs text-zinc-300">
        <div>Mode: <span className="font-mono">{stressActive ? 'STRESS' : running ? 'LIVE' : 'PAUSED'}</span></div>
      </div>
    </div>
  );
}
