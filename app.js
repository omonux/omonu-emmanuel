// app.js — OMONUX shared navigation + session (FAST + STABLE)

// --- Shared API helper (talks to the backend in /server) ---
// The backend serves both the API and these static files on the same
// origin (see server/index.js), so relative /api/* calls work with no
// CORS setup as long as you're running the site via `npm start` in
// /server — not by opening the HTML files directly from disk.
window.OmonuxAPI = (() => {
  const BASE = "/api";

  function token() { return localStorage.getItem("omonux_token"); }

  async function request(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    const t = token();
    if (t) headers["Authorization"] = "Bearer " + t;
    let res;
    try { res = await fetch(BASE + path, { ...opts, headers }); }
    catch (e) { const err = new Error("Can't reach the OMONUX backend. Is the server running?"); err.offline = true; throw err; }
    let body = null; try { body = await res.json(); } catch (e) {}
    if (!res.ok) { const err = new Error(body?.error || "Request failed."); err.status = res.status; err.body = body; throw err; }
    return body;
  }

  function setSession(token_, user) { localStorage.setItem("omonux_token", token_); localStorage.setItem("omonux_user", user?.email?.split("@")[0] || "Trader"); localStorage.setItem("omonux_email", user?.email || ""); }
  function clearSession() { localStorage.removeItem("omonux_token"); localStorage.removeItem("omonux_user"); localStorage.removeItem("omonux_email"); }

  return {
    register: (email, password) => request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    me: () => request("/auth/me"), getAccount: () => request("/paper/account"),
    placeOrder: (order) => request("/paper/order", { method: "POST", body: JSON.stringify(order) }),
    closePosition: (positionId, exitPrice) => request("/paper/close", { method: "POST", body: JSON.stringify({ positionId, exitPrice }) }),
    getSignals: () => request("/signals"), autoStatus: () => request("/auto-trade"), autoEvents: () => request("/auto-trade/events"),
    autoConfig: (config) => request("/auto-trade/config", { method: "PUT", body: JSON.stringify(config) }),
    autoStart: () => request("/auto-trade/start", { method: "POST" }), autoStop: () => request("/auto-trade/stop", { method: "POST" }),
    autoRunOnce: () => request("/auto-trade/run-once", { method: "POST" }),
    autoArmLive: (confirmation) => request("/auto-trade/arm-live", { method: "POST", body: JSON.stringify({ confirmation }) }),
    autoDisarmLive: () => request("/auto-trade/disarm-live", { method: "POST" }),
    getSettings: () => request("/settings"), updateSettings: (updates) => request("/settings", { method: "PUT", body: JSON.stringify(updates) }),
    getNotifications: () => request("/notifications"), connectTelegram: (chatId) => request("/telegram/connect", { method: "POST", body: JSON.stringify({ chatId }) }),
    testTelegram: () => request("/telegram/test", { method: "POST" }), getKeys: () => request("/keys"),
    saveExchangeKeys: (provider, apiKey, apiSecret) => request("/keys/exchange", { method: "PUT", body: JSON.stringify({ provider, apiKey, apiSecret }) }),
    removeExchangeKeys: () => request("/keys/exchange", { method: "DELETE" }), saveTelegramToken: (botToken) => request("/keys/telegram", { method: "PUT", body: JSON.stringify({ botToken }) }),
    removeTelegramToken: () => request("/keys/telegram", { method: "DELETE" }), saveAiVisionKey: (provider, apiKey) => request("/keys/ai-vision", { method: "PUT", body: JSON.stringify({ provider, apiKey }) }),
    removeAiVisionKey: () => request("/keys/ai-vision", { method: "DELETE" }),
    async scanChart(file) {
      const fd = new FormData(); fd.append("chart", file); const t = token(); let res;
      try { res = await fetch(BASE + "/chart-scan", { method: "POST", headers: t ? { Authorization: "Bearer " + t } : {}, body: fd }); }
      catch (e) { const err = new Error("Can't reach the OMONUX backend. Is the server running?"); err.offline = true; throw err; }
      let body = null; try { body = await res.json(); } catch (e) {}
      if (!res.ok) { const err = new Error(body?.error || "Chart scan failed."); err.status = res.status; err.body = body; throw err; }
      return body;
    },
    setSession, clearSession, isLoggedIn: () => Boolean(token()),
  };
})();

(() => {
  const go = (page) => { if (!page) return; const here = location.pathname.split("/").pop() || "index.html"; if (page === here) return; location.href = page; };
  const user = localStorage.getItem("omonux_user"); const hasToken = Boolean(localStorage.getItem("omonux_token")); const protect = document.body?.getAttribute("data-protect");
  if (protect === "1" && !hasToken) { go("login.html"); return; }
  const nameEl = document.getElementById("userName"); if (nameEl) nameEl.textContent = user || "Trader";
  const currentFile = (location.pathname.split("/").pop() || "index.html").toLowerCase(); document.querySelectorAll("a[href]").forEach((a) => { const href = (a.getAttribute("href") || "").toLowerCase(); if (href === currentFile) a.classList.add("active"); });
  let locked = false;
  document.addEventListener("click", (e) => {
    const logout = e.target.closest("#logoutBtn,[data-logout]"); if (logout) { e.preventDefault(); window.OmonuxAPI.clearSession(); go("index.html"); return; }
    const back = e.target.closest("[data-back]"); if (back) { e.preventDefault(); history.back(); return; }
    const btn = e.target.closest("[data-go]"); if (!btn) return; e.preventDefault(); if (locked) return; locked = true; const target = btn.getAttribute("data-go"); setTimeout(() => (locked = false), 600); go(target);
  });
  if (user) localStorage.setItem("omonux_last", currentFile);
})();

// ---- Real 30-minute candlestick chart used across trading views ----
(() => {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const enabled = ['index.html','dashboard.html','signals.html','paper.html','auto-trade.html'].includes(page); if (!enabled) return;
  const start = () => {
    if (document.getElementById('omonuxCandlePanel')) return; const anchor = document.querySelector('.wrap2') || document.querySelector('.wrap') || document.body; if (!anchor) return;
    const panel = document.createElement('section'); panel.id='omonuxCandlePanel'; panel.className='card omx-candle-panel';
    panel.innerHTML = `<div class="omx-chart-head"><div><h2 style="margin:0">Live 30-Minute Candles</h2><div class="small muted" id="omxCandleMeta">Real closed OHLCV data • Binance public market data</div></div><div class="omx-chart-controls"><select id="omxCandleSymbol"><option>BTC</option><option>ETH</option><option>SOL</option></select><span class="pill">30m</span></div></div><canvas id="omxCandleCanvas" height="330"></canvas><div id="omxCandleStatus" class="small muted"></div>`;
    const firstSection=anchor.querySelector('section'); anchor.insertBefore(panel, firstSection || anchor.firstChild); const canvas=document.getElementById('omxCandleCanvas'), ctx=canvas.getContext('2d'), status=document.getElementById('omxCandleStatus'), sel=document.getElementById('omxCandleSymbol');
    async function load(){ try{const r=await fetch(`/api/candles?symbol=${encodeURIComponent(sel.value)}&interval=30m&limit=80`);const d=await r.json();if(!r.ok)throw new Error(d.error||'Candle feed unavailable');draw(d.candles);status.textContent=`${d.symbol}/USDT • ${d.candles.length} closed candles • updated ${new Date(d.fetchedAt).toLocaleTimeString()}`;}catch(e){status.textContent=e.message;} }
    function draw(cs){ const ratio=window.devicePixelRatio||1,w=canvas.clientWidth||900,h=330;canvas.width=w*ratio;canvas.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);const pad={l:54,r:18,t:16,b:30},plotW=w-pad.l-pad.r,plotH=h-pad.t-pad.b,min=Math.min(...cs.map(c=>c.low)),max=Math.max(...cs.map(c=>c.high)),range=max-min||1,xStep=plotW/cs.length,bodyW=Math.max(2,xStep*.58);ctx.font='11px Arial';ctx.lineWidth=1;ctx.strokeStyle='rgba(148,163,184,.18)';ctx.fillStyle='rgba(148,163,184,.75)';for(let i=0;i<5;i++){const y=pad.t+plotH*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();const v=max-range*i/4;ctx.fillText(v>=1000?v.toFixed(0):v.toFixed(2),5,y+4);}cs.forEach((c,i)=>{const x=pad.l+xStep*i+xStep/2,y=v=>pad.t+(max-v)/range*plotH,up=c.close>=c.open;ctx.strokeStyle=up?'#22c55e':'#ef4444';ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();const top=y(Math.max(c.open,c.close)),bot=y(Math.min(c.open,c.close));ctx.fillRect(x-bodyW/2,top,bodyW,Math.max(1,bot-top));});ctx.fillStyle='rgba(148,163,184,.8)';const every=Math.max(1,Math.floor(cs.length/6));cs.forEach((c,i)=>{if(i%every===0)ctx.fillText(new Date(c.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),pad.l+xStep*i,pad.t+plotH+22);}); }
    sel.addEventListener('change',load); window.addEventListener('resize',load); load(); setInterval(load,30000);
  }; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();