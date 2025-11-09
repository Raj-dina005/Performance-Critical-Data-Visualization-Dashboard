// lib/stressReporter.ts
// Client-side stress reporter: records FPS and memory samples for a duration and downloads JSON.

export type StressSample = { ts: number; fps: number; mem?: number | null };

export function runStressReport(durationMs = 10000, sampleIntervalMs = 200) {
  return new Promise<{ samples: StressSample[]; duration: number }>((resolve) => {
    const samples: StressSample[] = [];
    let rafHandle: number | null = null;
    let lastFrame = performance.now();
    let frameCount = 0;
    let lastSample = performance.now();

    function rafLoop(now: number) {
      frameCount++;
      // sample periodically
      if (now - lastSample >= sampleIntervalMs) {
        const fps = Math.round((frameCount * 1000) / (now - lastFrame));
        // capture memory if available
        const mem = (performance as any).memory ? Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100) / 100 : null;
        samples.push({ ts: Date.now(), fps, mem });
        lastSample = now;
        lastFrame = now;
        frameCount = 0;
      }
      rafHandle = requestAnimationFrame(rafLoop);
    }

    rafHandle = requestAnimationFrame(rafLoop);

    // stop after duration
    setTimeout(() => {
      if (rafHandle) cancelAnimationFrame(rafHandle);
      // final sample
      const finalFps = samples.length ? samples[samples.length - 1].fps : 0;
      const result = { samples, duration: durationMs };
      // download JSON
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stress-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resolve(result);
    }, durationMs);
  });
}
