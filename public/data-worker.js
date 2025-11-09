// public/data-worker.js
// Worker runs its own generator and posts snapshots to the main thread.
// Keep this plain JS (no module/bundling) and place in /public so it is fetchable.

(function () {
  // lightweight ring buffer
  function RingBuffer(capacity) {
    this.buffer = new Array(capacity).fill(null);
    this.capacity = capacity;
    this.write = 0;
    this.size = 0;
  }
  RingBuffer.prototype.push = function (item) {
    this.buffer[this.write] = item;
    this.write = (this.write + 1) % this.capacity;
    if (this.size < this.capacity) this.size++;
  };
  RingBuffer.prototype.toArray = function () {
    var out = [];
    var start = (this.write - this.size + this.capacity) % this.capacity;
    for (var i = 0; i < this.size; i++) {
      var v = this.buffer[(start + i) % this.capacity];
      if (v) out.push(v);
    }
    return out;
  };

  var buffer = new RingBuffer(200000);
  var id = 0;
  var rateMs = 100;
  var batchSize = 20;
  var running = false;
  var timer = null;

  function genBatch() {
    if (!running) return;
    var now = Date.now();
    for (var i = 0; i < batchSize; i++) {
      var value = Math.sin((id + i) * 0.01) * 50 + Math.random() * 20;
      var category = ['A','B','C'][Math.floor(Math.random()*3)];
      buffer.push({ t: now + i, v: value, id: id++, category: category });
    }
    // post a snapshot (structured clone)
    postMessage({ type: 'snapshot', data: buffer.toArray() });
    timer = setTimeout(genBatch, rateMs);
  }

  function start() { if (running) return; running = true; genBatch(); }
  function stop() { running = false; if (timer) { clearTimeout(timer); timer = null; } }

  onmessage = function (ev) {
    var msg = ev.data || {};
    if (msg.type === 'start') start();
    if (msg.type === 'stop') stop();
    if (msg.type === 'setOptions') {
      if (typeof msg.rateMs === 'number') rateMs = msg.rateMs;
      if (typeof msg.batchSize === 'number') batchSize = msg.batchSize;
      // if running, restart loop to apply new rate immediately
      if (running) {
        if (timer) clearTimeout(timer);
        genBatch();
      }
    }
    if (msg.type === 'ping') {
      postMessage({ type: 'pong' });
    }
  };

})();
