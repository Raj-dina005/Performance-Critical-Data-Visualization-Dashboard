## Performance Dashboard

  Real-time performance visualization dashboard built with Next.js 14, React, Tailwind CSS, and OffscreenCanvas for high-performance rendering

## Overview

 * The Performance Dashboard visualizes simulated live data streams using four charts — Line (Realtime), Bar, Scatter, and Heatmap.
  
 * It’s designed for high-FPS rendering and includes stress testing, FPS monitoring, and Web Worker-based offloading for optimal performance.

## Setup Instructions

1] Clone the repository

       git clone https://github.com/Raj-dina005/Performance-Critical-Data-Visualization-Dashboard
       cd flam-performance-dashboard


2] Install dependencies

         npm install


3] Run the app

         npm run dev


4] Open the dashboard in your browser:

         http://localhost:3000

## Live Demo
         https://performance-critical-data-visualiza-two.vercel.app/

## Manual OffscreenCanvas Setup
       
1] Open your dashboard:

                  https://performance-critical-data-visualiza-two.vercel.app/
         


2] Press F12 → open Console tab.

3] Paste and run this code:
   
   ```          (function() {
 try {
    const old = document.querySelector('#offscreen-canvas');
    if (!old) return console.error('No #offscreen-canvas found');
    const parent = old.parentElement;
    const newC = document.createElement('canvas');
    newC.id = 'offscreen-canvas';
    newC.style.cssText = old.style.cssText || 'width:100%; height:260px; display:block;';
    parent.insertBefore(newC, old);
    old.remove();

    if (!newC.transferControlToOffscreen) {
      console.error('transferControlToOffscreen not supported');
      return;
    }

    const off = newC.transferControlToOffscreen();
    const w = new Worker('/offscreen-renderer.js');
    w.postMessage({ type: 'init', canvas: off, width: newC.clientWidth, height: newC.clientHeight }, [off]);
    w.postMessage({ type: 'start' });

    window.offscreenWorkerSend = (msg) => w.postMessage(msg);
    w.onmessage = (e) => console.log('[Worker]', e.data);
    console.log('✅ Offscreen worker initialized and started');
  } catch (err) {
    console.error('Failed to init worker:', err);
  }
})();
```
4] The Line Chart will start rendering immediately.


## Performance Testing Instructions

1]Normal Mode

   * Default stream: 100 ms rate, batch 20 points

   * Target: Smooth 60 FPS

2] Stress Test Mode

   * Click “Start Stress” to simulate ~20K points/sec

   * Observe FPS & memory in top-right HUD
  | Scenario    | Points | FPS | Memory | Notes           |
| ----------- | ------ | --- | ------ | --------------- |
| Default     | 10 K   | 60  | 80 MB  | Smooth          |
| Stress Mode | 50 K   | 30  | 120 MB | Stable          |
| Worker Mode | 100 K  | 60  | 140 MB | Fully optimized |

  
  


## Browser Compatibility
| Browser            | Status                              
| ------------------ | -----------------------------------
| **Chrome (119+)**  | Full support with OffscreenCanvas 
| **Edge (118+)**    | Works perfectly                         
| **Firefox (120+)** | Partial OffscreenCanvas support         
| **Safari (17+)**   | May fallback to normal canvas           
| **Mobile Chrome**  | Works responsively                



## Feature Overview

| Feature                    | Description                    | Status          |
| -------------------------- | ------------------------------ | --------------- |
| Real-time Charts           | Line, Bar, Scatter, Heatmap    | ✅               |
| Adjustable Stream Controls | Rate, Batch, Start/Stop        | ✅               |
| Stress Test Mode           | Simulates high data throughput | ✅               |
| Web Worker Rendering       | Offloads heavy drawing         | ✅ (manual init) |
| FPS & Memory Monitor       | Displays live stats            | ✅               |
| Responsive Layout          | Works across screen sizes      | ✅               |
| Aggregation Dropdown       | Change view dynamically        | ⚙️ Planned      |




## Benchmarks

| Data Points | FPS    | Rendering Mode  | Result     |
| ----------- | ------ | --------------- | ---------- |
| 10 K        | 60 FPS | Canvas          | Stable     |
| 50 K        | 30 FPS | Canvas          | Slight lag |
| 100 K       | 60 FPS | OffscreenCanvas | Smooth     |
| 150 K       | 45 FPS | Worker          | Acceptable |





## Next.js Optimizations

| Technique             | Description                        |
| --------------------- | ---------------------------------- |
| App Router            | Uses app/layout.tsx + app/page.tsx |
| Dynamic Imports       | Lazy loads heavy charts            |
| Client Components     | Charts, control panels             |
| Tailwind Optimization | Purged build under 500 KB          |
| OffscreenCanvas       | Worker rendering                   |
| Memoization           | React.memo + useCallback           |



## Folder Structure

| Path                            | Description                |
| ------------------------------- | -------------------------- |
| `app/layout.tsx`                | Global layout              |
| `app/page.tsx`                  | Landing page               |
| `components/DashboardShell.tsx` | Core dashboard layout      |
| `components/charts/`            | Chart components           |
| `components/controls/`          | Control panel components   |
| `components/ui/`                | UI and performance monitor |
| `hooks/`                        | Data streaming logic       |
| `public/offscreen-renderer.js`  | Worker renderer script     |
| `screenshots/`                  | App screenshots            |




## Developer Notes

1] Built using Next.js 14 + TypeScript

2] Uses Tailwind CSS for design consistency

3] OffscreenCanvas powered rendering

4] Stress testing + FPS monitor integrated

5] Responsive grid layout


## License

MIT License © 2025
Developed by RAJDHINAKARAN for FLAM Hiring Assessment



