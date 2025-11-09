// public/offscreen-renderer.js
(function () {
  // config
  let running = false;
  let rateMs = 100;
  let batchSize = 40;
  let capacity = 1_200_000;
  let buf = new Float32Array(capacity * 2);
  let write = 0;
  let len = 0;
  let idCounter = 0;

  // offscreen canvas state
  let canvas = null;
  let ctx = null;
  let canvasW = 800;
  let canvasH = 300;

  function pushPoint(t, v) {
    const idx = (write % capacity) * 2;
    buf[idx] = t;
    buf[idx + 1] = v;
    write++;
    if (len < capacity) len++;
  }

  function genBatch() {
    const now = Date.now();
    for (let i = 0; i < batchSize; i++) {
      const v = Math.sin((idCounter + i) * 0.01) * 50 + Math.random() * 20;
      pushPoint(now + i, v);
      idCounter++;
    }
  }

  function downsampleMinMax(width) {
    const out = new Float32Array(width * 2);
    if (len === 0) return out;
    const currentLen = Math.min(len, capacity);
    const bucketSize = Math.max(1, Math.floor(currentLen / width));
    const startIndex = (write - currentLen + capacity) % capacity;
    for (let b = 0; b < width; b++) {
      let min = Infinity, max = -Infinity;
      const start = startIndex + b * bucketSize;
      const end = Math.min(startIndex + currentLen, start + bucketSize);
      for (let i = start; i < end; i++) {
        const idx = (i % capacity) * 2;
        const v = buf[idx + 1];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === Infinity) { min = 0; max = 0; }
      out[b * 2] = min;
      out[b * 2 + 1] = max;
    }
    return out;
  }

  function draw() {
    if (!ctx || canvasW <= 0 || canvasH <= 0) return;
    const width = canvasW;
    const height = canvasH;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const buckets = downsampleMinMax(width);
    let gmin = Infinity, gmax = -Infinity;
    for (let i = 0; i < width; i++) {
      const mn = buckets[i * 2];
      const mx = buckets[i * 2 + 1];
      if (mn < gmin) gmin = mn;
      if (mx > gmax) gmax = mx;
    }
    if (!isFinite(gmin) || !isFinite(gmax)) { gmin = -100; gmax = 100; }
    const pad = (gmax - gmin) * 0.05 || 1;
    gmin -= pad; gmax += pad;

    // draw filled min->max vertical columns
    ctx.fillStyle = '#e6f0ff';
    for (let x = 0; x < width; x++) {
      const mn = buckets[x * 2];
      const mx = buckets[x * 2 + 1];
      const y1 = height - ((mn - gmin) / (gmax - gmin)) * height;
      const y2 = height - ((mx - gmin) / (gmax - gmin)) * height;
      const h = Math.max(1, Math.abs(y2 - y1));
      ctx.fillRect(x, Math.min(y1, y2), 1, h);
    }

    // stroke midline
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#2b78da';
    for (let x = 0; x < width; x++) {
      const mn = buckets[x * 2];
      const mx = buckets[x * 2 + 1];
      const mid = (mn + mx) * 0.5;
      const y = height - ((mid - gmin) / (gmax - gmin)) * height;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  let renderTimer = null;
  function startRenderLoop() {
    if (renderTimer) return;
    const targetMs = 1000 / 60;
    function loop() {
      try { draw(); } catch (e) {}
      renderTimer = setTimeout(loop, targetMs);
    }
    loop();
  }
  function stopRenderLoop() {
    if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
  }

  onmessage = function (ev) {
    const msg = ev.data || {};
    if (msg.type === 'init') {
      canvas = msg.canvas;
      canvasW = msg.width || canvas.width || 800;
      canvasH = msg.height || canvas.height || 300;
      canvas.width = canvasW;
      canvas.height = canvasH;
      ctx = canvas.getContext('2d');
      draw();
      // inform main thread worker is ready
      postMessage({ type: 'inited' });
    } else if (msg.type === 'start') {
      if (running) return;
      running = true;
      (function generatorLoop() {
        if (!running) return;
        genBatch();
        setTimeout(generatorLoop, rateMs);
      })();
      startRenderLoop();
    } else if (msg.type === 'stop') {
      running = false;
      stopRenderLoop();
    } else if (msg.type === 'setOptions') {
      if (typeof msg.rateMs === 'number') rateMs = msg.rateMs;
      if (typeof msg.batchSize === 'number') batchSize = msg.batchSize;
    } else if (msg.type === 'resize') {
      canvasW = msg.width;
      canvasH = msg.height;
      if (canvas) { canvas.width = canvasW; canvas.height = canvasH; }
      draw();
    } else if (msg.type === 'clear') {
      len = 0; write = 0; buf = new Float32Array(capacity * 2);
      draw();
    } else if (msg.type === 'ping') {
      postMessage({ type: 'pong' });
    }
  };
})();
