(function (g) {
  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  /** Delay humano 800–2500 ms */
  function humanDelay() {
    var ms = 800 + Math.floor(Math.random() * 1701);
    return sleep(ms);
  }
  g.AFG = g.AFG || {};
  g.AFG.sleep = sleep;
  g.AFG.humanDelay = humanDelay;
})(typeof globalThis !== 'undefined' ? globalThis : window);
