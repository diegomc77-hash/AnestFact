/**
 * Prueba manual automatizada vía CDP (Chrome --remote-debugging-port=9222):
 * 1) Abrir AnesFact local con extensión 0.5.16
 * 2) Confirmar bridge + extensionId
 * 3) chrome.runtime.reload() en la extensión (bridge muere, sin F5 de AnesFact)
 * 4) Iniciar cola vía afGeclisaQueueRequestExtAction → ensure + external channel
 */
const CDP_PORT = process.env.AFG_CDP_PORT || '9333';
const CDP_BASE = 'http://127.0.0.1:' + CDP_PORT;
async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('fetch ' + url + ' ' + r.status);
  return r.json();
}

function cdp(wsUrl) {
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  const ws = new WebSocket(wsUrl);
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(String(ev.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method && listeners.has(msg.method)) {
      for (const fn of listeners.get(msg.method)) fn(msg.params);
    }
  });
  return {
    ready,
    on(method, fn) {
      if (!listeners.has(method)) listeners.set(method, []);
      listeners.get(method).push(fn);
    },
    send(method, params = {}) {
      const reqId = ++id;
      return new Promise((resolve, reject) => {
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    },
    close() {
      try {
        ws.close();
      } catch (e) {}
    },
  };
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function log(step, data) {
  console.log('STEP', step, typeof data === 'string' ? data : JSON.stringify(data));
}

async function main() {
  // sanity: local server has the fix
  const js = await (await fetch('http://127.0.0.1:8765/js/39-geclisa-queue.js')).text();
  if (!js.includes('AFG_PAGE_QUEUE_ACTION')) throw new Error('local 39-geclisa-queue.js without fix');
  log(0, 'local server has AFG_PAGE_QUEUE_ACTION');

  const targets = await getJson(CDP_BASE + '/json/list');
  let page = targets.find((t) => t.type === 'page' && /8765|AnestFact|github\.io/.test(t.url));
  if (!page) throw new Error('no AnesFact page in CDP on ' + CDP_PORT);

  const pageClient = cdp(page.webSocketDebuggerUrl);
  await pageClient.ready;
  await pageClient.send('Page.enable');
  await pageClient.send('Runtime.enable');

  // Navigate to LOCAL AnesFact (has the PWA fix) — twice so CS attaches after ext boot
  log(1, 'navigate local AnesFact via CDP :' + CDP_PORT);
  await pageClient.send('Page.navigate', { url: 'http://127.0.0.1:8765/' });
  await sleep(2000);
  await pageClient.send('Page.reload', { ignoreCache: true });
  await sleep(3000);

  // Wait for bridge alive / scripts
  let bridge = null;
  for (let i = 0; i < 20; i++) {
    const ev = await pageClient.send('Runtime.evaluate', {
      expression: `({
        title: document.title,
        bridgeAlive: !!window.__AFG_BRIDGE_ALIVE,
        extId: window.__AFG_EXT_ID || localStorage.getItem('afg_ext_id') || '',
        hasFn: typeof afGeclisaQueueRequestExtAction === 'function',
        bridgeFlag: !!window.__AFG_ANESFACT_BRIDGE__,
        cacheV: typeof AF_CACHE_V === 'string' ? AF_CACHE_V : null
      })`,
      returnByValue: true,
    });
    bridge = ev.result.value;
    if (bridge && bridge.hasFn && (bridge.bridgeAlive || bridge.extId || bridge.bridgeFlag)) break;
    await sleep(500);
  }
  log('1b', bridge);
  if (!bridge || !bridge.hasFn) throw new Error('afGeclisaQueueRequestExtAction not on page');
  if (!bridge.extId && !bridge.bridgeAlive && !bridge.bridgeFlag) {
    throw new Error('extension bridge not injected on localhost — check --load-extension');
  }

  // Force-wait BRIDGE_ALIVE extensionId
  for (let i = 0; i < 15 && !bridge.extId; i++) {
    await sleep(400);
    const ev = await pageClient.send('Runtime.evaluate', {
      expression: `({
        extId: window.__AFG_EXT_ID || localStorage.getItem('afg_ext_id') || '',
        bridgeAlive: !!window.__AFG_BRIDGE_ALIVE,
        bridgeFlag: !!window.__AFG_ANESFACT_BRIDGE__
      })`,
      returnByValue: true,
    });
    bridge = Object.assign(bridge, ev.result.value);
  }
  log('1c-extId', { extId: bridge.extId, bridgeAlive: bridge.bridgeAlive, bridgeFlag: bridge.bridgeFlag });
  if (!bridge.extId) throw new Error('no extensionId stored — BRIDGE_ALIVE missing extensionId?');

  // Find extension service worker and reload extension (kills CS without F5 on page)
  const targets2 = await getJson(CDP_BASE + '/json/list');
  let sw = targets2.find(
    (t) => t.type === 'service_worker' && String(t.url || '').includes(bridge.extId)
  );
  if (!sw) {
    // wake SW
    const all = await getJson(CDP_BASE + '/json/version');
    log('2-wake', all.Browser);
    await sleep(1000);
    const targets3 = await getJson(CDP_BASE + '/json/list');
    sw = targets3.find(
      (t) => t.type === 'service_worker' && String(t.url || '').includes('chrome-extension://') && String(t.url || '').includes(bridge.extId)
    );
  }
  if (!sw) {
    // fallback: any geclisa batch SW
    const targets4 = await getJson(CDP_BASE + '/json/list');
    sw = targets4.find((t) => t.type === 'service_worker' && /chrome-extension:\/\/[^/]+\/service_worker/.test(t.url || ''));
  }
  if (!sw) throw new Error('service worker not found for ' + bridge.extId);
  log(2, 'reload extension via SW ' + sw.url);
  const swClient = cdp(sw.webSocketDebuggerUrl);
  await swClient.ready;
  await swClient.send('Runtime.enable');
  await swClient.send('Runtime.evaluate', {
    expression: 'chrome.runtime.reload()',
    returnByValue: true,
  });
  swClient.close();
  await sleep(2500);

  // Confirm bridge DEAD on page (no F5)
  const dead = (
    await pageClient.send('Runtime.evaluate', {
      expression: `({
        bridgeFlag: !!window.__AFG_ANESFACT_BRIDGE__,
        // page-world flag may linger; probe listener via ping postMessage pattern:
        extIdStill: window.__AFG_EXT_ID || localStorage.getItem('afg_ext_id') || '',
        href: location.href
      })`,
      returnByValue: true,
    })
  ).result.value;
  log(3, dead);
  // After extension reload, isolated world CS is gone; page may still have stale __AFG_ANESFACT_BRIDGE__
  // from before if it was set on window from CS... actually CS sets window.__AFG_ANESFACT_BRIDGE__ in isolated? 
  // Content scripts have isolated world - __AFG_ANESFACT_BRIDGE__ is in isolated world, NOT page window.
  // Page sees __AFG_BRIDGE_ALIVE from postMessage. That stays true stale!
  // Clear page-side alive flag to reflect reality for our probe:
  await pageClient.send('Runtime.evaluate', {
    expression: 'window.__AFG_BRIDGE_ALIVE=false; true',
    returnByValue: true,
  });

  // Probe: postMessage QUEUE_START should NOT get ACK if CS dead (we listen briefly)
  const probe = (
    await pageClient.send('Runtime.evaluate', {
      expression: `new Promise(function(resolve){
        var got=false;
        function on(ev){
          var d=ev&&ev.data;
          if(d&&d.source==='AFG_EXT'&&d.type==='QUEUE_ACTION_ACK'){ got=true; }
        }
        window.addEventListener('message', on);
        window.postMessage({source:'AFG_ANESFACT', type:'QUEUE_START'}, '*');
        setTimeout(function(){
          window.removeEventListener('message', on);
          resolve({ postMessageAck: got, extId: localStorage.getItem('afg_ext_id')||'' });
        }, 800);
      })`,
      awaitPromise: true,
      returnByValue: true,
    })
  ).result.value;
  log('3b-postMessage-dead', probe);
  if (probe.postMessageAck) {
    console.warn('WARN postMessage still got ACK — bridge may have been reinjected by onInstalled already');
  } else {
    log('3c', 'confirmed: postMessage alone gets no ACK (bridge lost)');
  }

  // Seed minimal queue so StartUi wouldn't early-return if used; we call RequestExtAction directly
  await pageClient.send('Runtime.evaluate', {
    expression: `localStorage.setItem('afg_geclisa_queue', JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      items: [{ id: 'manual-test-1', status: 'queued', pac: 'PRUEBA, TEST', dni: '00000000' }]
    })); true`,
    returnByValue: true,
  });

  // Step 4: Iniciar via fixed channel (external → ensure → start)
  const startRes = (
    await pageClient.send('Runtime.evaluate', {
      expression: `new Promise(function(resolve){
        var acks=[];
        function on(ev){
          var d=ev&&ev.data;
          if(d&&d.source==='AFG_EXT'&&d.type==='QUEUE_ACTION_ACK'){
            acks.push({ action:d.action, via:d.via||null, ok:!!(d.result&&d.result.ok), error:d.error|| (d.result&&d.result.error)||null, message:(d.result&&d.result.message)||null, resultKeys:d.result?Object.keys(d.result):[] });
          }
        }
        window.addEventListener('message', on);
        try { afGeclisaQueueRequestExtAction('QUEUE_START'); }
        catch(e){ resolve({ threw:String(e&&e.message||e) }); return; }
        setTimeout(function(){
          window.removeEventListener('message', on);
          resolve({
            acks: acks,
            bridgeAlive: !!window.__AFG_BRIDGE_ALIVE,
            bridgeFlagPage: !!window.__AFG_ANESFACT_BRIDGE__,
            extId: localStorage.getItem('afg_ext_id')||'',
            hasChromeRuntime: !!(typeof chrome!=='undefined' && chrome.runtime && chrome.runtime.sendMessage)
          });
        }, 3500);
      })`,
      awaitPromise: true,
      returnByValue: true,
    })
  ).result.value;
  log(4, startRes);

  const okAck = (startRes.acks || []).some((a) => a.action === 'QUEUE_START' && !a.error);
  const viaExternal = (startRes.acks || []).some((a) => a.via === 'external');

  console.log('---- VERDICT ----');
  if (okAck) {
    console.log('PASS: QUEUE_ACTION_ACK received after extension reload without AnesFact F5');
    if (viaExternal) console.log('PASS: ACK via=external (ensure path)');
    else console.log('INFO: ACK without via=external (bridge reinjected + postMessage path)');
  } else {
    console.log('FAIL: no successful QUEUE_START ACK');
    console.log(JSON.stringify(startRes, null, 2));
    process.exitCode = 1;
  }

  pageClient.close();
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
