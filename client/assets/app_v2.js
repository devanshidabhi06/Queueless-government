const $ = s => document.querySelector(s);

// Map Engine data to UI format
const OFF = window.Engine.getOffices().map(o => ({ id: o.id, name: o.name, p: o.name[0], n: 4 }));
const SV = {};
OFF.forEach(o => {
  SV[o.id] = window.Engine.getServices(o.id).map(s => [s.name, Math.round(s.avgServiceSeconds / 60), s.id, s.requirements || []]);
});

const NAMES = ['Meera', 'Kiran', 'Jay', 'Hetal', 'Rohan', 'Dipti', 'Nikhil', 'Pooja', 'Vivek', 'Sneha', 'Harsh', 'Anita'];
const S = { speed: 1, sel: '', adm: 'col', paused: false, mine: [], log: [] };
window.S = S; // exposed for chatbot.js (token lookup / location)

try { const s = JSON.parse(localStorage.getItem('ql_mine') || '[]'); S.mine = s; } catch (e) {}



function getEngineTime() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function fmt(m) {
  m = Math.round(m);
  return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

function say(m, type) {
  const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  S.log.unshift(`${nowStr} – ${m}`);
  S.log = S.log.slice(0, 30);
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = m;
  $('#toasts').appendChild(d);
  setTimeout(() => d.remove(), 6000);
  try {
    if (type === 'beep') {
      const a = new (window.AudioContext || window.webkitAudioContext)(), g = a.createOscillator();
      g.connect(a.destination); g.frequency.value = 880; g.start(); g.stop(a.currentTime + .25);
    }
  } catch (e) {}
}

function newWait(officeId) {
  const q = window.Engine.getAllQueues().find(q => q.service.officeId === officeId);
  if (!q || !q.queue.length) return 0;
  const last = q.queue[q.queue.length - 1];
  return last && last.etaSeconds ? Math.ceil(last.etaSeconds / 60) : 0;
}

function join() {
  const sId = $('#sv').value;
  const m = $('#join-msg');
  if (!sId) {
    m.textContent = "Please select a government office and a service.";
    m.style.color = "var(--bad)";
    return;
  }
  try {
    const t = window.Engine.takeToken({
      serviceId: sId,
      name: $('#nm').value || 'Citizen',
      phone: $('#ph').value || '+919999999999',
      notifyWhatsApp: $('#wa').checked,
      notifySms: $('#sms').checked,
      consentGiven: $('#consent').checked,
      joinMode: document.querySelector('input[name="joinMode"]:checked').value
    });
    t.travel = +$('#tr').value || 0;
    t.w0 = Math.max(Math.ceil(t.etaSeconds / 60), 1);
    S.mine.unshift(t.id);
    localStorage.setItem('ql_mine', JSON.stringify(S.mine));
    say(`🎫 Token ${t.tokenNumber} booked. Estimated wait ${Math.ceil(t.etaSeconds / 60)} min.`);
    draw();
    
    // Show success message inline
    const msgDiv = $('#join-msg');
    msgDiv.innerHTML = `✅ Token <b>${t.tokenNumber}</b> booked successfully!`;
    msgDiv.style.color = 'var(--ok)';
    setTimeout(() => { if(msgDiv.innerHTML.includes(t.tokenNumber)) msgDiv.innerHTML = ''; }, 5000);
    
  } catch (err) {
    // Show error message inline instead of alert
    const msgDiv = $('#join-msg');
    msgDiv.innerHTML = `⚠️ ${err.message}`;
    msgDiv.style.color = 'var(--bad)';
    setTimeout(() => { if(msgDiv.innerHTML.includes('⚠️')) msgDiv.innerHTML = ''; }, 5000);
  }
}

function searchToken() {
  const q = $('#ts-search').value.trim();
  const m = $('#ts-msg');
  if (!q) return;
  const state = window.Engine.getState();
  
  // Try to find token by TokenNumber or Phone
  const found = state.tokens.filter(t => 
    t.tokenNumber.toUpperCase() === q.toUpperCase() || 
    t.phone === q || 
    t.phone.includes(q) // in case they entered with/without +91
  ).filter(t => t.status === "ISSUED" || t.status === "CALLED" || t.status === "RESERVED");

  if (found.length === 0) {
    m.textContent = "No active tokens found for that query.";
    m.style.color = "var(--bad)";
    return;
  }
  
  S.mine = [];
  let added = 0;
  found.forEach(t => {
    S.mine.push(t.id);
    added++;
  });
  
  if (added > 0) {
    localStorage.setItem('ql_mine', JSON.stringify(S.mine));
    draw();
    m.innerHTML = `✅ Recovered ${added} active token(s)!`;
    m.style.color = "var(--ok)";
  } else {
    m.textContent = "Token is already shown below.";
    m.style.color = "var(--tx)";
  }
  setTimeout(() => m.textContent = '', 4000);
}

function cancel(id) {
  try {
    window.Engine.cancel(id);
    S.mine = S.mine.filter(x => x !== id);
    localStorage.setItem('ql_mine', JSON.stringify(S.mine));
    say(`Token cancelled.`);
    draw();
  } catch(e) {}
}

function checkIn(id) {
  try {
    window.Engine.checkIn(id);
    say(`Token checked in successfully.`);
    draw();
  } catch(e) {
    say(`Failed to check in: ${e.message}`, 'error');
  }
}

function showUnableDropdown(id) {
  const el = document.getElementById(`unb-${id}`);
  if (el) {
    el.innerHTML = `
      <select onchange="if(this.value) submitUnable('${id}', this.value)" style="padding:4px;border:1px solid #ef4444;color:#ef4444;border-radius:4px;outline:none;font-size:0.8rem;background:white">
        <option value="">Select reason...</option>
        <option value="Missing Documents">Missing Documents</option>
        <option value="Not Eligible">Not Eligible</option>
        <option value="Invalid Token">Invalid Token</option>
        <option value="Other">Other</option>
      </select>`;
  }
}

function submitUnable(id, reason) {
  try {
    window.Engine.reject(id, reason);
    say(`Token rejected: ${reason}`);
    draw();
  } catch(e) {
    say(`Failed to reject token: ${e.message}`, 'error');
  }
}

function adjCt(serviceId, delta) {
  const s = window.Engine.getState().services.find(s => s.id === serviceId);
  if (s) {
    s.activeCounters = Math.max(1, s.activeCounters + delta);
    draw();
  }
}

function runReminders() {
  const st = window.Engine.getState();
  let count = 0;
  st.tokens.filter(t => t.status === 'ISSUED').forEach(t => {
     if ((t.etaSeconds || 0) <= 1800 && !t.r30) { 
       t.r30 = true; 
       S.log.unshift(`Sent WhatsApp reminder to ${t.tokenNumber} (ETA <= 30m)`); 
       count++; 
     }
  });
  say(`Reminders checked. ${count} notifications sent.`);
  draw();
}

function delay(id) {
  say(`Delay requested for token. (Simulation feature)`);
}

function walkin() {
  const sId = SV[S.adm][0][2];
  try {
    window.Engine.takeToken({
      serviceId: sId,
      name: 'Walk-in',
      phone: '+919999999999',
      notifyWhatsApp: false,
      notifySms: false,
      consentGiven: true,
      joinMode: "ON_SITE"
    });
    draw();
  } catch(e) {}
}

function adv(serviceId, isSkip) {
  try {
    // We don't have per-counter UI properly mapped to engine in V2, we just callNext on the service
    const next = window.Engine.callNext(serviceId);
    if (!next) say("No more tokens to call.");
    draw();
  } catch(e) {
    alert(e.message);
  }
}

function serveTk(tokenId) {
  window.Engine.serve(tokenId);
  draw();
}

function crowd(oId) {
  const w = newWait(oId);
  return w < 12 ? ['Low', var_('ok')] : w < 30 ? ['Moderate', var_('warn')] : ['Crowded', var_('bad')];
}
function var_(n) { return getComputedStyle(document.documentElement).getPropertyValue('--' + n) }

function draw() {
  const S_t = getEngineTime();
  $('#clk').textContent = '🕘 ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  if (!isAdmin) {
    if ($('#sv') && $('#sv').value && $('#docs-req')) {
      const selectedSv = (SV[S.sel] || []).find(s => s[2] === $('#sv').value);
      if (selectedSv && selectedSv[3] && selectedSv[3].length > 0) {
        $('#docs-req').style.display = 'block';
        $('#docs-list').innerHTML = selectedSv[3].map(req => `<li>${req}</li>`).join('');
      } else {
        $('#docs-req').style.display = 'none';
      }
    } else if ($('#docs-req')) {
      $('#docs-req').style.display = 'none';
    }
    
    if (!S.sel) {
      if ($('#est')) $('#est').innerHTML = `Select a government office to see wait times.`;
      if ($('#live')) $('#live').innerHTML = `<p class="mut" style="padding:16px 0">Select an office above to see live queue status.</p>`;
    } else {
    const w = newWait(S.sel), [cl, cc] = crowd(S.sel);
    const est = Math.round(w);
    $('#est').innerHTML = `New token now → est. wait <b>${est} min</b> (±${Math.max(2, Math.round(est * .15))}) · call time ≈ <b>${fmt(S_t + est)}</b>`;
    
    // Combine all queues for the selected office
    const qs = window.Engine.getAllQueues().filter(q => q.service.officeId === S.sel);
    const qWait = qs.reduce((a, b) => a + b.queue.filter(t => t.status === 'ISSUED' || t.status === 'RESERVED').length, 0);
    const activeCounters = qs.reduce((a, b) => a + b.service.activeCounters, 0);
    const nowServing = qs.map(q => q.queue.filter(t => t.status === 'CALLED')).flat();

    $('#live').innerHTML = `<div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><b>${qWait}</b><span>Waiting</span></div><div class="kpi"><b>${nowServing.length}/${activeCounters}</b><span>Counters busy</span></div><div class="kpi"><b>${w}m</b><span>Wait now</span></div></div>
    <div class="mut">Crowd level: <b style="color:${cc}">${cl}</b></div><div class="bar"><i style="width:${Math.min(100, w * 2.2)}%;background:${cc}"></i></div>
    <p class="mut">Now serving: ${nowServing.map((t, i) => `<b>${t.tokenNumber}</b> (C${i + 1})`).join(' · ') || '–'}</p>`;
  }
  
  const hrs = [9, 10, 11, 12, 13, 14, 15, 16]; 
  $('#fc').innerHTML = hrs.map(h => {
    const cur = new Date().getHours() === h;
    const ht = Math.floor(30 + 50 * Math.sin((h - 9) / 7 * Math.PI));
    return `<div style="height:${ht}%;background:var(--ok);opacity:${cur ? 1 : .55};outline:${cur ? '2px solid var(--pri)' : '0'}"><span>${h > 12 ? h - 12 : h}${h >= 12 ? 'p' : 'a'}</span></div>`;
  }).join('');
  
  $('#log').innerHTML = S.log.map(l => `<div>${l}</div>`).join('') || '<span class="mut">Alerts appear here.</span>';
  
  const allAct = S.mine.map(id => window.Engine.getToken(id)).filter(Boolean);
  const act = allAct.length ? [allAct[allAct.length - 1]] : [];
  $('#mine').innerHTML = act.length ? act.map(t => {
    const etaM = Math.ceil((t.etaSeconds || 0) / 60);
    const pos = t.tokensAhead || 0;
    
    // Step logic
    let step = 1;
    if (t.status === 'ISSUED' || t.status === 'RESERVED') step = 2;
    else if (t.status === 'CALLED') step = 3;
    else if (t.status === 'DONE' || t.status === 'NO_SHOW' || t.status === 'CANCELLED') step = 4;

    const stepIcon = (s) => step > s ? '✓' : s;
    const stepColor = (s) => step > s ? 'color:var(--pri);border-color:var(--pri);background:var(--card)' : 
                             step === s ? 'background:var(--pri);color:var(--bg);border-color:var(--pri)' : 
                                          'background:var(--card);color:var(--mut);border-color:var(--bd)';
    const textColor = (s) => step >= s ? 'color:var(--tx)' : 'color:var(--mut)';

    const stepper = `
    <div style="display:flex;justify-content:center;margin-bottom:24px;position:relative;margin-top:24px">
      <div style="position:absolute;top:16px;left:0;right:0;height:2px;background:var(--bd);z-index:0"></div>
      <div style="display:flex;width:100%;justify-content:space-between;position:relative;z-index:1;text-align:center;">
        <div style="display:flex;flex-direction:column;align-items:center;width:80px;">
           <div style="width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;${stepColor(1)}">${stepIcon(1)}</div>
           <div style="font-size:0.75rem;font-weight:700;margin-top:8px;line-height:1.2;${textColor(1)};background:var(--card)">Token<br>Issued</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;width:80px;">
           <div style="width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;${stepColor(2)}">${stepIcon(2)}</div>
           <div style="font-size:0.75rem;font-weight:700;margin-top:8px;line-height:1.2;${textColor(2)};background:var(--card)">In<br>Queue</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;width:80px;">
           <div style="width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;${stepColor(3)}">${stepIcon(3)}</div>
           <div style="font-size:0.75rem;font-weight:700;margin-top:8px;line-height:1.2;${textColor(3)};background:var(--card)">Now<br>Calling</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;width:80px;">
           <div style="width:32px;height:32px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-weight:bold;${stepColor(4)}">${stepIcon(4)}</div>
           <div style="font-size:0.75rem;font-weight:700;margin-top:8px;line-height:1.2;${textColor(4)};background:var(--card)">Completed</div>
        </div>
      </div>
    </div>`;

    const badgeStr = t.status === 'RESERVED' ? '🟣 RESERVED' : t.status === 'ISSUED' ? '📋 ISSUED' : t.status === 'CALLED' ? '🟠 CALLED' : t.status === 'REJECTED' ? '🔴 REJECTED' : `🟢 ${t.status}`;

    let infoBoxes = '';
    if (t.status === 'ISSUED' || t.status === 'RESERVED') {
      infoBoxes = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:32px">
         <div style="border:1px solid var(--bd);border-radius:8px;padding:16px;text-align:left">
           <div style="font-size:0.75rem;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Tokens Ahead</div>
           <div style="font-size:2rem;font-weight:800;color:var(--pri)">${pos}</div>
         </div>
         <div style="border:1px solid var(--bd);border-radius:8px;padding:16px;text-align:left">
           <div style="font-size:0.75rem;color:var(--mut);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Est. Wait</div>
           <div style="font-size:2rem;font-weight:800;color:var(--tx)">${etaM}m</div>
         </div>
      </div>`;
    } else if (t.status === 'CALLED') {
      infoBoxes = `
      <div style="display:grid;grid-template-columns:1fr;margin-top:32px">
         <div style="border:2px solid var(--ok);background:var(--ok);border-radius:8px;padding:24px;text-align:center;color:var(--bg)">
           <div style="font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">It's your turn!</div>
           <div style="font-size:1.4rem;font-weight:800;">Please proceed to the counter.</div>
         </div>
      </div>`;
    } else if (t.status === 'REJECTED') {
       infoBoxes = `
      <div style="display:grid;grid-template-columns:1fr;margin-top:32px">
         <div style="border:1px solid var(--bad);background:#fef2f2;border-radius:8px;padding:24px;text-align:center">
           <div style="font-size:1.1rem;font-weight:700;color:var(--bad)">Token Rejected</div>
           <div style="margin-top:8px;font-size:0.9rem;color:#7f1d1d">Reason: ${t.rejectReason || 'N/A'}</div>
         </div>
      </div>`;
    } else {
       infoBoxes = `
      <div style="display:grid;grid-template-columns:1fr;margin-top:32px">
         <div style="border:1px solid var(--bd);background:var(--bg);border-radius:8px;padding:24px;text-align:center">
           <div style="font-size:1.1rem;font-weight:700;color:var(--mut)">Token is ${t.status.toLowerCase()}</div>
         </div>
      </div>`;
    }

    let actionBtns = '';
    if (t.status === 'ISSUED' || t.status === 'RESERVED') {
      const checkInBtn = (t.status === 'RESERVED') ? `<button class="btn s" onclick="checkIn('${t.id}')" style="background:var(--ok);color:white;border:none;width:auto;padding:8px 24px;border-radius:4px;font-weight:600;margin-right:12px;margin-bottom:8px">I have arrived (Check In)</button>` : '';
      actionBtns = `
      <div style="border-top:1px solid var(--bd);padding:20px;text-align:center">
         ${checkInBtn}
         <button class="btn s" onclick="cancel('${t.id}')" style="background:transparent;color:var(--bad);border:1px solid var(--bad);width:auto;padding:8px 24px;border-radius:4px;font-weight:600;margin-bottom:8px">Cancel My Token</button>
      </div>`;
    }

    return `
    <div style="margin-bottom:40px;padding-bottom:20px;">
      ${stepper}
      <div style="border:1px solid var(--bd);border-radius:8px;text-align:center;background:var(--bg);overflow:hidden;">
        <div style="padding:32px 20px 24px">
          <div style="font-size:0.75rem;font-weight:700;color:var(--mut);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Token Number</div>
          <div style="font-size:3.5rem;font-weight:900;color:var(--tx);line-height:1;margin-bottom:16px;letter-spacing:-1px">${t.tokenNumber}</div>
          <div class="pill" style="font-size:0.8rem;background:var(--card);border:1px solid var(--bd);color:var(--pri)">${badgeStr}</div>
          ${infoBoxes}
          ${(() => {
            if (t.joinMode === 'REMOTE' && (t.status === 'ISSUED' || t.status === 'RESERVED')) {
              return `<div style="margin-top:24px;text-align:left;background:#fef3c7;padding:12px;border-radius:8px;border-left:4px solid #f59e0b">
                        <strong style="color:#b45309;font-size:0.85rem;display:block;margin-bottom:4px">🏠 Remote Check-in Required</strong>
                        <div style="color:#92400e;font-size:0.85rem;line-height:1.4">You joined the queue from home. Please arrive at the office and scan the QR code to check in before your turn is called.</div>
                      </div>`;
            }
            return '';
          })()}
          <div style="margin-top:24px;font-size:0.9rem;color:var(--mut)">
            Service: ${t.serviceName}
          </div>
          ${(() => {
            const tr = (SV[t.officeId] || []).find(s => s[2] === t.serviceId);
            if (tr && tr[3] && tr[3].length) {
              return `<div style="margin-top:16px;text-align:left;background:#eff6ff;padding:12px;border-radius:8px;border-left:4px solid var(--pri)">
                        <strong style="color:var(--pri);font-size:0.85rem;display:block;margin-bottom:4px">📋 Mandatory Documents:</strong>
                        <ul style="margin:0;padding-left:18px;color:#1e3a8a;font-size:0.85rem">
                          ${tr[3].map(r => `<li>${r}</li>`).join('')}
                        </ul>
                      </div>`;
            }
            return '';
          })()}
        </div>
        ${actionBtns}
      </div>
    </div>`;
  }).join('') : '<p class="mut">No active token yet. Take one above — you can stay home until we alert you.</p>';
  } // close if (!isAdmin)
  
  if (isAdmin) drawAdm();
  if (!isAdmin) drawMap();
  if(typeof applyLang === 'function') applyLang();
}

function drawAdm() {
  try {
  const qs = window.Engine.getAllQueues().filter(q => q.service.officeId === S.adm);
  const issued = qs.reduce((a, b) => a + b.queue.filter(t => t.status === 'ISSUED' || t.status === 'RESERVED').length, 0);
  const called = qs.reduce((a, b) => a + b.queue.filter(t => t.status === 'CALLED').length, 0);
  const served = window.Engine.getState().tokens.filter(t => t.officeId === S.adm && t.status === 'DONE').length;
  
  $('#kp').innerHTML = [
    [issued + called, 'IN QUEUE', 'var(--pri)'], 
    [called, 'CALLED', '#d97706'], 
    [served, 'DONE', 'var(--ok)'], 
    [0, 'LOG ENTRIES', 'var(--tx)']
  ].map(k => `<div class="kpi" style="border:1px solid #eee;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-radius:6px;padding:16px;text-align:left;background:white">
    <div style="font-size:0.75rem;font-weight:700;color:#666;letter-spacing:1px">${k[1]}</div>
    <div style="font-size:1.8rem;font-weight:600;color:${k[2]};margin-top:4px">${k[0]}</div>
  </div>`).join('');
  
  $('#qlist').innerHTML = qs.map(q => {
    const act = q.queue.filter(t => t.status === 'ISSUED' || t.status === 'CALLED' || t.status === 'RESERVED');
    const waiting = act.filter(t => t.status === 'ISSUED' || t.status === 'RESERVED').length;
    return `
    <div class="card" style="padding:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:6px">
      <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;background:#fff">
        <div>
          <h3 style="margin:0;font-size:0.95rem;color:var(--tx);text-transform:uppercase;letter-spacing:0.5px">${q.service.name}</h3>
          <p class="mut" style="margin:4px 0 0 0;font-size:0.8rem">Counters busy: ${Math.min(q.service.activeCounters, called)}/${q.service.activeCounters} Waiting to check in: ${waiting}</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <span style="font-size:0.85rem;color:#666;display:flex;gap:4px;align-items:center;border:1px solid #ddd;padding:2px 6px;border-radius:4px"><span style="cursor:pointer;padding:0 4px;font-weight:bold" onclick="adjCt('${q.service.id}', -1)">-</span> <b style="min-width:14px;text-align:center">${q.service.activeCounters}</b> <span style="cursor:pointer;padding:0 4px;font-weight:bold" onclick="adjCt('${q.service.id}', 1)">+</span> counters</span>
          <button class="btn s" onclick="adv('${q.service.id}',false)" style="background:#5b45a6;color:white;border:none;padding:6px 12px;border-radius:4px">🔔 Call Next</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
          <tr style="border-bottom:1px solid #eee;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.5px;color:#888;background:#fafafa">
            <th style="padding:12px 20px;text-align:left;font-weight:600">Token</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">Name</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">Status</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">Ahead</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">ETA</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">Notify</th>
            <th style="padding:12px 20px;text-align:left;font-weight:600">Actions</th>
          </tr>
          ${act.map((t, i) => {
            const isCalled = t.status === 'CALLED';
            return `
            <tr style="border-bottom:1px solid #f5f5f5">
              <td style="padding:12px 20px;font-weight:700;color:var(--tx)">${t.tokenNumber}</td>
              <td style="padding:12px 20px;color:#444">${t.name || 'User ' + (i+1)}</td>
              <td style="padding:12px 20px">
                ${isCalled 
                  ? `<div style="color:#d97706;font-weight:600;font-size:0.75rem">🟠 CALLED</div><div style="font-size:0.7rem;color:#666">Proceed to Counter</div>` 
                  : t.status === 'RESERVED'
                    ? `<div style="color:#8b5cf6;font-weight:600;font-size:0.75rem">🟣 RESERVED</div><div style="font-size:0.7rem;color:#666">Remote Token</div>`
                    : `<div style="color:#2563eb;font-weight:600;font-size:0.75rem">🔵 ISSUED</div>`}
              </td>
              <td style="padding:12px 20px">${t.tokensAhead || i}</td>
              <td style="padding:12px 20px">${isCalled ? '<span style="color:#d97706;font-weight:600">Now</span>' : Math.ceil((t.etaSeconds||0)/60) + 'm'}</td>
              <td style="padding:12px 20px;color:#666;font-size:0.75rem">WA${i%3===0?' SMS':''}</td>
              <td style="padding:12px 20px;display:flex;gap:6px">
                <button class="btn s" onclick="serveTk('${t.id}')" style="background:#5b45a6;color:white;padding:4px 10px;font-size:0.8rem;border:none;border-radius:4px">Served</button>
                <button class="btn s g" onclick="cancel('${t.id}')" style="background:#f1f5f9;color:#475569;border:none;padding:4px 10px;font-size:0.8rem;border-radius:4px">No-Show</button>
                <div id="unb-${t.id}"><button class="btn s g" onclick="showUnableDropdown('${t.id}')" style="background:white;color:#ef4444;border:1px solid #ef4444;padding:4px 10px;font-size:0.8rem;border-radius:4px">Unable...</button></div>
              </td>
            </tr>`;
          }).join('')}
          ${act.length === 0 ? `<tr><td colspan="7" style="padding:20px;text-align:center;color:#888;background:#fff">No active tokens in this queue</td></tr>` : ''}
        </table>
      </div>
    </div>`;
  }).join('');
  } catch (e) { say('Error in drawAdm: ' + e.message); console.error(e); }
}

function show(id) {
  ['home', 'join', 'map', 'status', 'adm', 'how'].forEach(k => {
    const el = $('#v-' + k);
    if (el) el.classList.toggle('hide', k !== id);
  });
  window.scrollTo({top: 0, behavior: 'smooth'});
  [...$('#nav').children].forEach(b => { if (b.tagName === 'BUTTON') b.classList.toggle('on', b.dataset.k === id); });
  draw();
  setTimeout(() => {
    if (typeof mapInstances !== 'undefined') {
      Object.values(mapInstances).forEach(inst => {
        if (inst && inst.map) try { inst.map.invalidateSize(); } catch(e){}
      });
    }
  }, 150);
}

function fillSv() {
  if ($('#of') && $('#of').value) S.sel = $('#of').value;
  if (!S.sel || !SV[S.sel]) {
    if ($('#sv')) $('#sv').innerHTML = '<option value="" disabled selected>-- Select a service --</option>';
    return;
  }
  if ($('#sv')) $('#sv').innerHTML = '<option value="" disabled selected>-- Select a service --</option>' + SV[S.sel].map(s => `<option value="${s[2]}">${s[0]} (~${s[1]} min)</option>`).join('');
}

  // Determine if we are on the admin page
  const isAdmin = window.location.pathname.includes('admin.html');

  $('#nav').innerHTML = [
    ['home', '🏠 Home', 'index.html'], 
    ['join', '🎫 Join Queue', 'index.html#join'], 
    ['status', '📈 Status', 'index.html#status'], 
    ['how', 'ℹ️ Help', 'index.html#how'], 
    ['spacer', '', ''],
    ['adm', isAdmin ? '🔙 Back to Citizen App' : '🧑‍💼 Staff login', isAdmin ? 'index.html' : 'admin.html']
  ].map(a => {
    if (a[0] === 'spacer') return `<div style="flex-grow:1"></div>`;
    // If it's a cross-page link (or we are on admin which has no citizen sections)
    if (a[2] && (isAdmin || a[0] === 'adm')) {
       return `<a href="${a[2]}" style="text-decoration:none"><button data-k="${a[0]}">${a[1]}</button></a>`;
    }
    // Normal in-page citizen routing
    return `<button data-k="${a[0]}" onclick="show('${a[0]}')">${a[1]}</button>`;
  }).join('');
if ($('#of')) $('#of').innerHTML = '<option value="" disabled selected>-- Select an office --</option>' + OFF.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
if ($('#ao')) $('#ao').innerHTML = OFF.map(o => `<option value="${o.id}">${o.name}</option>`).join('');

/* ---------- map ---------- */
const GEO = {
  // Gujarat / Rajkot & Ahmedabad
  col: [22.2987, 70.7870],
  rto: [22.2860, 70.7780],
  pas: [22.3110, 70.7950],
  rmc: [22.3020, 70.7900],
  'ahm-col': [23.0618, 72.5800],
  'ahm-rto': [23.0673, 72.5833],
  
  // Delhi NCR
  'del-psk': [28.6297, 77.2250],
  'del-col': [28.6517, 77.2219],
  'del-rto': [28.5888, 77.2555],
  
  // Mumbai & Maharashtra
  'mum-psk': [19.0657, 72.8687],
  'mum-col': [19.0601, 72.8519],
  'mum-rto': [19.1136, 72.8697],
  'pun-psk': [18.5362, 73.9167],
  
  // Bengaluru & Karnataka
  'blr-psk': [12.9352, 77.6245],
  'blr-col': [12.9716, 77.5946],
  'blr-rto': [12.9784, 77.6408],
  
  // Chennai & Tamil Nadu
  'chn-psk': [13.0524, 80.1983],
  'chn-col': [13.0891, 80.2885],
  
  // Hyderabad & Telangana
  'hyd-psk': [17.4435, 78.4682],
  'hyd-col': [17.3916, 78.4739],
  
  // Kolkata & West Bengal
  'kol-psk': [22.5867, 88.4178],
  'kol-col': [22.5726, 88.3476],
  
  // North, Central & Other Major Hubs
  'jai-psk': [26.8920, 75.8038],
  'lko-psk': [26.8467, 80.9462],
  'chd-col': [30.7333, 76.7794],
  'bho-col': [23.2599, 77.4126],
  'pat-col': [25.6186, 85.1414],
  'guw-col': [26.1856, 91.7483]
};
window.GEO = GEO;

const INDIA_CENTER = [22.9734, 78.6569];
S.me = [22.9734, 78.6569];
S.isIndiaView = true;

const hav = (a, b) => {
  const r = x => x * Math.PI / 180;
  const dl = r(b[0] - a[0]);
  const dn = r(b[1] - a[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dn / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const etaKm = km => Math.max(3, Math.round(km * 1.35 / 24 * 60));

const mapInstances = {};

function pickOff(id) {
  S.sel = id;
  if ($('#of')) $('#of').value = id;
  fillSv();
  if ($('#tr')) $('#tr').value = etaKm(hav(S.me, GEO[id] || GEO['col']));
  draw();
  Object.values(mapInstances).forEach(inst => {
    if (inst && inst.map) drawRouteLine(inst, S.me);
  });
}

function updateRealTimeLocation(lat, lng, accuracy, skipPan) {
  S.me = [lat, lng];
  S.loc = 1;
  S.isIndiaView = false;
  const Leaflet = window.L;

  Object.values(mapInstances).forEach(inst => {
    if (!inst.map || !Leaflet) return;
    
    if (!skipPan) {
      inst.map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }

    const userIcon = Leaflet.divIcon({
      className: 'custom-user-pin',
      html: `<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 16px rgba(37,99,235,0.9);animation:pulse 2s infinite;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;">👤</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (inst.userMarker) {
      inst.userMarker.setLatLng([lat, lng]);
    } else {
      inst.userMarker = Leaflet.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(inst.map)
        .bindPopup('<b>📍 You (Live Location)</b>');
    }

    if (accuracy) {
      if (inst.accuracyCircle) {
        inst.accuracyCircle.setLatLng([lat, lng]);
        inst.accuracyCircle.setRadius(accuracy);
      } else {
        inst.accuracyCircle = Leaflet.circle([lat, lng], {
          radius: accuracy,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.15,
          weight: 1
        }).addTo(inst.map);
      }
    }

    drawRouteLine(inst, [lat, lng]);
  });

  if (S.sel && $('#tr')) {
    $('#tr').value = etaKm(hav(S.me, GEO[S.sel] || GEO['col']));
  }
}

function drawRouteLine(inst, userLatLng) {
  const Leaflet = window.L;
  if (!inst || !inst.map || !Leaflet) return;
  const targetId = S.sel || 'del-psk';
  const targetCoords = GEO[targetId] || GEO['col'];
  
  if (inst.routeLine) {
    inst.routeLine.setLatLngs([userLatLng, targetCoords]);
  } else {
    inst.routeLine = Leaflet.polyline([userLatLng, targetCoords], {
      color: '#2563eb',
      weight: 3,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round'
    }).addTo(inst.map);
  }
}

function locate() {
  if (!navigator.geolocation) {
    say('Geolocation not supported — showing India center.');
    return;
  }
  say('📍 Fetching real-time GPS location in India...');

  navigator.geolocation.getCurrentPosition(
    p => {
      const { latitude, longitude, accuracy } = p.coords;
      S.me = [latitude, longitude];
      S.loc = 1;
      S.isIndiaView = false;

      Object.values(mapInstances).forEach(inst => {
        if (!inst.map) return;
        inst.map.setView([latitude, longitude], 13);
        updateRealTimeLocation(latitude, longitude, accuracy);
      });

      say('✅ Location updated to live GPS! Nearest offices calculated.');
      draw();
    },
    err => {
      say('Location permission denied — centered on New Delhi demo coordinates.');
      const delhiCoords = [28.6139, 77.2090];
      updateRealTimeLocation(delhiCoords[0], delhiCoords[1], 400);
      Object.values(mapInstances).forEach(inst => {
        if (inst.map) inst.map.setView(delhiCoords, 12);
      });
      draw();
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function resetToIndia() {
  S.isIndiaView = true;
  Object.values(mapInstances).forEach(inst => {
    if (inst.map) {
      inst.map.flyTo(INDIA_CENTER, 5, { duration: 1.2 });
      if (inst.routeLine) {
        inst.map.removeLayer(inst.routeLine);
        inst.routeLine = null;
      }
    }
  });
  const res1 = $('#home-pincode-result'); if (res1) res1.innerHTML = '';
  const res2 = $('#tab-pincode-result'); if (res2) res2.innerHTML = '';
  say('🇮🇳 Map view reset to Pan-India Overview.');
}

function flyToZone(zone) {
  const ZONES = {
    all: { center: [22.9734, 78.6569], zoom: 5, name: 'Pan-India Overview' },
    north: { center: [28.6139, 77.2090], zoom: 7, name: 'Northern Zone (Delhi / UP / Punjab / Rajasthan)' },
    west: { center: [21.1702, 72.8311], zoom: 7, name: 'Western Zone (Maharashtra / Gujarat)' },
    south: { center: [13.0827, 80.2707], zoom: 7, name: 'Southern Zone (Karnataka / Tamil Nadu / Telangana)' },
    east: { center: [23.5000, 87.5000], zoom: 7, name: 'Eastern & North-Eastern Zone (WB / Bihar / Assam)' },
    central: { center: [23.2599, 77.4126], zoom: 7, name: 'Central Zone (Madhya Pradesh / Chhattisgarh)' }
  };

  const target = ZONES[zone] || ZONES.all;
  Object.values(mapInstances).forEach(inst => {
    if (inst.map) inst.map.flyTo(target.center, target.zoom, { duration: 1.2 });
  });
  say(`🗺️ Zoomed to ${target.name}.`);
}

// Indian Postal Circle prefix coordinates fallback
const PIN_PREFIX_COORDS = {
  '11': [28.6139, 77.2090, 'Connaught Place, New Delhi'],
  '12': [28.4595, 77.0266, 'Gurugram, Haryana'],
  '13': [30.1343, 77.2885, 'Ambala, Haryana'],
  '14': [30.9010, 75.8573, 'Ludhiana, Punjab'],
  '15': [30.2110, 74.9455, 'Bathinda, Punjab'],
  '16': [30.7333, 76.7794, 'Sector 17, Chandigarh'],
  '17': [31.1048, 77.1734, 'Shimla, Himachal Pradesh'],
  '18': [32.7266, 74.8570, 'Jammu, J&K'],
  '19': [34.0837, 74.7973, 'Srinagar, Kashmir'],
  '20': [27.8974, 78.0880, 'Aligarh, Uttar Pradesh'],
  '21': [25.4358, 81.8463, 'Prayagraj, Uttar Pradesh'],
  '22': [26.8467, 80.9462, 'Lucknow, Uttar Pradesh'],
  '23': [25.1337, 82.5644, 'Mirzapur, Uttar Pradesh'],
  '24': [30.3165, 78.0322, 'Dehradun, Uttarakhand'],
  '25': [28.9845, 77.7064, 'Meerut, Uttar Pradesh'],
  '26': [27.9135, 79.9288, 'Bareilly, Uttar Pradesh'],
  '27': [26.7606, 83.3732, 'Gorakhpur, Uttar Pradesh'],
  '28': [25.4484, 78.5685, 'Jhansi, Uttar Pradesh'],
  '30': [26.9124, 75.7873, 'Jaipur, Rajasthan'],
  '31': [25.3407, 74.6313, 'Bhilwara, Rajasthan'],
  '32': [25.2138, 75.8648, 'Kota, Rajasthan'],
  '33': [28.0229, 73.3119, 'Bikaner, Rajasthan'],
  '34': [26.2389, 73.0243, 'Jodhpur, Rajasthan'],
  '36': [22.3039, 70.8022, 'Rajkot, Gujarat'],
  '37': [23.2420, 69.6669, 'Bhuj, Kutch, Gujarat'],
  '38': [23.0225, 72.5714, 'Ahmedabad, Gujarat'],
  '39': [21.1702, 72.8311, 'Surat, Gujarat'],
  '40': [18.9388, 72.8353, 'Fort, Mumbai, Maharashtra'],
  '41': [18.5204, 73.8567, 'Pune, Maharashtra'],
  '42': [19.9975, 73.7898, 'Nashik, Maharashtra'],
  '43': [19.8762, 75.3433, 'Chhatrapati Sambhajinagar, Maharashtra'],
  '44': [21.1458, 79.0882, 'Nagpur, Maharashtra'],
  '45': [22.7196, 75.8577, 'Indore, Madhya Pradesh'],
  '46': [23.2599, 77.4126, 'Bhopal, Madhya Pradesh'],
  '47': [26.2183, 78.1828, 'Gwalior, Madhya Pradesh'],
  '48': [23.1815, 79.9864, 'Jabalpur, Madhya Pradesh'],
  '49': [21.2514, 81.6296, 'Raipur, Chhattisgarh'],
  '50': [17.3850, 78.4867, 'Abids, Hyderabad, Telangana'],
  '51': [14.4673, 78.8242, 'Kadapa, Andhra Pradesh'],
  '52': [16.5062, 80.6480, 'Vijayawada, Andhra Pradesh'],
  '53': [17.6868, 83.2185, 'Visakhapatnam, Andhra Pradesh'],
  '56': [12.9716, 77.5946, 'MG Road, Bengaluru, Karnataka'],
  '57': [12.9141, 74.8560, 'Mangaluru, Karnataka'],
  '58': [15.3647, 75.1240, 'Hubballi, Karnataka'],
  '59': [15.8497, 74.4977, 'Belagavi, Karnataka'],
  '60': [13.0827, 80.2707, 'Parrys, Chennai, Tamil Nadu'],
  '61': [10.7905, 78.7047, 'Tiruchirappalli, Tamil Nadu'],
  '62': [9.9252, 78.1198, 'Madurai, Tamil Nadu'],
  '63': [12.9165, 79.1325, 'Vellore, Tamil Nadu'],
  '64': [11.0168, 76.9558, 'Coimbatore, Tamil Nadu'],
  '67': [11.2588, 75.7804, 'Kozhikode, Kerala'],
  '68': [9.9816, 76.2999, 'Kochi, Kerala'],
  '69': [8.5241, 76.9366, 'Thiruvananthapuram, Kerala'],
  '70': [22.5726, 88.3639, 'BBD Bagh, Kolkata, West Bengal'],
  '71': [23.5204, 87.3119, 'Durgapur, West Bengal'],
  '72': [22.4257, 87.3199, 'Midnapore, West Bengal'],
  '73': [26.7271, 88.3953, 'Siliguri, West Bengal'],
  '74': [22.7210, 88.4820, 'Barasat, West Bengal'],
  '75': [20.2961, 85.8245, 'Bhubaneswar, Odisha'],
  '76': [19.3150, 84.7941, 'Berhampur, Odisha'],
  '77': [21.4669, 83.9812, 'Sambalpur, Odisha'],
  '78': [26.1856, 91.7483, 'Guwahati, Assam'],
  '79': [24.8170, 93.9368, 'Imphal, Manipur'],
  '80': [25.6186, 85.1414, 'Patna, Bihar'],
  '81': [25.2425, 86.9842, 'Bhagalpur, Bihar'],
  '82': [24.7914, 85.0002, 'Gaya, Bihar'],
  '83': [23.3441, 85.3096, 'Ranchi, Jharkhand'],
  '84': [26.1209, 85.3647, 'Muzaffarpur, Bihar'],
  '85': [25.7796, 87.4753, 'Purnia, Bihar']
};

function renderPincodeResult(pincode, placeName, lat, lng, nearestOffice, nearestKm, nearestWait) {
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const destCoords = (nearestOffice && GEO[nearestOffice.id]) ? GEO[nearestOffice.id] : GEO['col'];
  const gmapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${destCoords[0]},${destCoords[1]}`;

  const html = `
    <div style="background:var(--card);border:2px solid var(--pri);border-radius:12px;padding:16px 20px;box-shadow:0 6px 20px rgba(10,42,102,0.1);animation:in .3s ease;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.4rem">📍</span>
          <div>
            <h3 style="margin:0;font-size:1.1rem;color:var(--pri)">Location Found: <b>${placeName}</b></h3>
            <span class="mut" style="font-size:0.8rem">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)} • Zoom Level: 16× (Street View)</span>
          </div>
        </div>
        <span class="pill" style="background:var(--ok);font-size:0.75rem;padding:4px 10px;">👁️ Street View Ready</span>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin:12px 0;background:var(--bg);padding:10px 14px;border-radius:10px;border:1px solid var(--bd);">
        <div style="font-size:0.82rem">
          <span class="mut" style="display:block;font-size:0.72rem">🏛️ Nearest Center</span>
          <b style="color:var(--pri)">${nearestOffice.name}</b>
        </div>
        <div style="font-size:0.82rem">
          <span class="mut" style="display:block;font-size:0.72rem">🚗 Distance & Travel</span>
          <b>${nearestKm.toFixed(1)} km (~${etaKm(nearestKm)} min)</b>
        </div>
        <div style="font-size:0.82rem">
          <span class="mut" style="display:block;font-size:0.72rem">⏱️ Live Wait Time</span>
          <b style="color:var(--ok)">~${nearestWait} mins</b>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <a href="${streetViewUrl}" target="_blank" rel="noopener" class="btn s" style="background:#0a2a66;color:#fff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:700;display:inline-flex;align-items:center;gap:6px">
          👁️ Open 360° Street View Panorama ↗
        </a>
        <a href="${gmapsDirUrl}" target="_blank" rel="noopener" class="btn s g" style="padding:9px 16px;border-radius:8px;font-weight:600;display:inline-flex;align-items:center;gap:6px">
          🧭 Driving Directions ↗
        </a>
        <button class="btn s" onclick="pickOff('${nearestOffice.id}'); show('join');" style="background:#16a34a;color:#fff;padding:9px 16px;border-radius:8px;font-weight:700">
          🎟️ Book Virtual Token
        </button>
        <button class="btn s g" onclick="resetToIndia()" style="padding:9px 16px;border-radius:8px;font-weight:600">
          🔄 Pan-India Overview
        </button>
      </div>
    </div>
  `;

  const res1 = $('#home-pincode-result'); if (res1) res1.innerHTML = html;
  const res2 = $('#tab-pincode-result'); if (res2) res2.innerHTML = html;
}

async function searchByPincode(pincode) {
  const inputs = document.querySelectorAll('.pincode-input');
  if (!pincode) {
    inputs.forEach(inp => { if (inp.value) pincode = inp.value; });
  }
  pincode = (pincode || '').trim();

  if (!pincode) {
    say('⚠️ Please enter a PIN code or city name.');
    return;
  }

  inputs.forEach(inp => inp.value = pincode);
  say(`🔍 Searching location for ${pincode}...`);

  let lat = null, lng = null, placeName = pincode;

  const knownPins = {
    '110001': [28.6139, 77.2090, 'Connaught Place, New Delhi'],
    'delhi': [28.6139, 77.2090, 'New Delhi'],
    'new delhi': [28.6139, 77.2090, 'New Delhi'],
    '400001': [18.9388, 72.8353, 'Fort, Mumbai, Maharashtra'],
    'mumbai': [19.0760, 72.8777, 'Mumbai, Maharashtra'],
    '560001': [12.9716, 77.5946, 'MG Road, Bengaluru, Karnataka'],
    'bengaluru': [12.9716, 77.5946, 'Bengaluru, Karnataka'],
    'bangalore': [12.9716, 77.5946, 'Bengaluru, Karnataka'],
    '600001': [13.0827, 80.2707, 'Parrys, Chennai, Tamil Nadu'],
    'chennai': [13.0827, 80.2707, 'Chennai, Tamil Nadu'],
    '700001': [22.5726, 88.3639, 'BBD Bagh, Kolkata, West Bengal'],
    'kolkata': [22.5726, 88.3639, 'Kolkata, West Bengal'],
    '500001': [17.3850, 78.4867, 'Abids, Hyderabad, Telangana'],
    'hyderabad': [17.3850, 78.4867, 'Hyderabad, Telangana'],
    '380001': [23.0225, 72.5714, 'Ahmedabad, Gujarat'],
    'ahmedabad': [23.0225, 72.5714, 'Ahmedabad, Gujarat'],
    '360001': [22.3039, 70.8022, 'Rajkot Main, Gujarat'],
    'rajkot': [22.3039, 70.8022, 'Rajkot, Gujarat'],
    '411001': [18.5204, 73.8567, 'Pune, Maharashtra'],
    'pune': [18.5204, 73.8567, 'Pune, Maharashtra'],
    '302001': [26.9124, 75.7873, 'Jaipur, Rajasthan'],
    'jaipur': [26.9124, 75.7873, 'Jaipur, Rajasthan'],
    '226001': [26.8467, 80.9462, 'Lucknow, Uttar Pradesh'],
    'lucknow': [26.8467, 80.9462, 'Lucknow, Uttar Pradesh'],
    '160017': [30.7333, 76.7794, 'Sector 17, Chandigarh'],
    'chandigarh': [30.7333, 76.7794, 'Chandigarh'],
    '462001': [23.2599, 77.4126, 'Bhopal, Madhya Pradesh'],
    'bhopal': [23.2599, 77.4126, 'Bhopal, Madhya Pradesh'],
    '800001': [25.6186, 85.1414, 'Patna, Bihar'],
    'patna': [25.6186, 85.1414, 'Patna, Bihar'],
    '781001': [26.1856, 91.7483, 'Guwahati, Assam'],
    'guwahati': [26.1856, 91.7483, 'Guwahati, Assam'],
    '682001': [9.9816, 76.2999, 'Kochi, Kerala'],
    'kochi': [9.9816, 76.2999, 'Kochi, Kerala']
  };

  const queryKey = pincode.toLowerCase().trim();
  if (knownPins[queryKey]) {
    lat = knownPins[queryKey][0];
    lng = knownPins[queryKey][1];
    placeName = knownPins[queryKey][2];
  } else if (/^\d{6}$/.test(pincode)) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json`);
      const data = await res.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
        placeName = data[0].display_name.split(',')[0] + `, PIN ${pincode}`;
      }
    } catch (err) {
      console.warn("Geocoding fetch error:", err);
    }

    // Postal circle fallback if nominatim is slow or offline
    if (!lat && !lng) {
      const prefix = pincode.substring(0, 2);
      if (PIN_PREFIX_COORDS[prefix]) {
        lat = PIN_PREFIX_COORDS[prefix][0];
        lng = PIN_PREFIX_COORDS[prefix][1];
        placeName = `${PIN_PREFIX_COORDS[prefix][2]} (PIN ${pincode})`;
      }
    }
  }

  if (lat && lng) {
    // 1. Calculate nearest government office without mutating existing map
    let nearestOffice = OFF[0];
    let minKm = Infinity;
    OFF.forEach(o => {
      const coords = GEO[o.id] || GEO['col'];
      const km = hav([lat, lng], coords);
      if (km < minKm) {
        minKm = km;
        nearestOffice = o;
      }
    });
    const nearestKm = minKm;
    const nearestWait = newWait(nearestOffice.id);

    // 2. Update real-time position state without competing pan animation
    updateRealTimeLocation(lat, lng, 300, true);

    // 3. Zoom into Street View (zoom level 16) with smooth flight animation
    Object.values(mapInstances).forEach(inst => {
      if (inst.map) {
        inst.map.flyTo([lat, lng], 16, { duration: 1.5 });

        const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
        const popupHtml = `
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:6px;min-width:230px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span class="pill" style="background:#2563eb;font-size:10px">📍 Street View Active</span>
              <span style="font-size:10px;color:#64748b">Zoom: 16×</span>
            </div>
            <h4 style="margin:0 0 4px;color:#0a2a66;font-size:13.5px;font-weight:700">📍 ${placeName}</h4>
            <div style="font-size:11.5px;color:#475569;margin-bottom:8px">
              <div>🧭 Coordinates: <b>${lat.toFixed(4)}, ${lng.toFixed(4)}</b></div>
              <div>🏢 Nearest Office: <b>${nearestOffice.name.split(',')[0]}</b> (~${nearestKm.toFixed(1)} km)</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">
              <a href="${streetViewUrl}" target="_blank" rel="noopener" style="background:#0a2a66;color:#fff;text-decoration:none;padding:6px 10px;border-radius:6px;font-weight:700;font-size:11px;text-align:center;display:flex;align-items:center;justify-content:center;gap:4px">
                👁️ Open 360° Street View ↗
              </a>
              <div style="display:flex;gap:5px">
                <button onclick="pickOff('${nearestOffice.id}'); show('join');" style="background:#16a34a;color:#fff;border:none;padding:5px 8px;border-radius:6px;font-weight:700;font-size:10.5px;cursor:pointer;flex:1">🎟️ Get Token</button>
                <button onclick="resetToIndia()" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:5px 8px;border-radius:6px;font-weight:600;font-size:10.5px;cursor:pointer">🔄 Pan-India</button>
              </div>
            </div>
          </div>
        `;

        if (inst.userMarker) {
          inst.userMarker.bindPopup(popupHtml).openPopup();
          inst.map.once('moveend', () => {
            if (inst.userMarker) inst.userMarker.openPopup();
          });
        }
      }
    });

    // 4. Render dedicated result card with Street View & Nearest Office
    renderPincodeResult(pincode, placeName, lat, lng, nearestOffice, nearestKm, nearestWait);

    // 5. Update rankings directly without disrupting map animation
    ['home-map-rankings', 'tab-map-rankings', 'map-rankings'].forEach(rankId => {
      const rankEl = $('#' + rankId);
      if (rankEl) {
        const rows = OFF.map(o => {
          const g = GEO[o.id] || GEO['col'];
          const km = hav(S.me, g);
          const w = newWait(o.id);
          const e = etaKm(km);
          return { o, g, km, w, e, tot: e + w };
        }).sort((x, y) => x.tot - y.tot);

        rankEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h3 style="margin:0;font-size:0.95rem;color:var(--pri)">📍 Nearest Government Offices to Your Location</h3>
            <span style="font-size:0.75rem;color:var(--mut)">Sorted by total travel + wait time</span>
          </div>
        ` + rows.slice(0, 6).map((r, i) => `
          <div class="rk">
            <span><b>${r.o.name}</b> ${i === 0 ? '<span class="pill" style="background:var(--ok)">Fastest overall</span>' : ''}<br>
            <span class="mut">${r.km < 1000 ? r.km.toFixed(1) + ' km' : Math.round(r.km) + ' km'} · ${r.e} min travel + ${r.w} min wait = <b>${r.tot} min total</b></span></span>
            <span style="display:flex;gap:6px">
              <button class="btn s g" onclick="pickOff('${r.o.id}'); show('join');">Choose</button>
              <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${S.me[0]},${S.me[1]}&destination=${r.g[0]},${r.g[1]}">Directions</a>
            </span>
          </div>
        `).join('') + `<p class="mut" style="margin-top:8px;font-size:0.78rem">Interactive Real-Time Leaflet.js Pan-India Map with Live GPS Streaming & Queue Tracking.</p>`;
      }
    });

    say(`📍 Located ${placeName}! Zoomed to street view.`);
  } else {
    say(`⚠️ Could not find coordinates for "${pincode}". Try entering a city name or PIN.`);
  }
}

function initLeafletMapForElement(containerId, rankingsId) {
  const mapEl = $('#' + containerId);
  if (!mapEl) return;

  if (mapInstances[containerId]) {
    try { mapInstances[containerId].map.invalidateSize(); } catch(e){}
    return;
  }

  const initialCenter = S.isIndiaView ? INDIA_CENTER : (S.me || INDIA_CENTER);
  const initialZoom = S.isIndiaView ? 5 : 13;
  const Leaflet = window.L;

  if (Leaflet && typeof Leaflet.map === 'function') {
    try {
      mapEl.innerHTML = '';

      const map = Leaflet.map(containerId, {
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: false
      });

      const baseTileLayer = Leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS | QueueLess India',
        maxZoom: 19
      }).addTo(map);

      const userIcon = Leaflet.divIcon({
        className: 'custom-user-pin',
        html: `<div style="background:#2563eb;width:24px;height:24px;border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 16px rgba(37,99,235,0.9);animation:pulse 2s infinite;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;">👤</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const userMarker = Leaflet.marker(S.me || INDIA_CENTER, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<b>📍 You (Live Location)</b><br>Pan-India Real-Time Tracking');

      const officeMkrs = {};
      OFF.forEach(o => {
        const coords = GEO[o.id] || GEO['col'];
        const w = newWait(o.id);
        const color = w < 12 ? '#16a34a' : w < 25 ? '#d97706' : '#dc2626';

        const cityName = o.name.includes(',') ? o.name.split(',')[1].trim().replace(/\(.*\)/, '').trim() : o.name.split(' ')[0];
        const officeIcon = Leaflet.divIcon({
          className: 'custom-office-pin',
          html: `<div style="background:${color};color:#fff;font-weight:700;font-size:10.5px;padding:3px 8px;border-radius:14px;border:1.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);white-space:nowrap;display:inline-flex;align-items:center;gap:3px;cursor:pointer;">
                  <span>🏢</span> <span>${cityName}</span> <b style="background:rgba(0,0,0,0.25);padding:1px 4px;border-radius:8px;font-size:9.5px">${w}m</b>
                 </div>`,
          iconSize: [95, 26],
          iconAnchor: [47, 13]
        });

        const mkr = Leaflet.marker(coords, { icon: officeIcon }).addTo(map);

        const popupContent = `
          <div style="font-family:system-ui,-apple-system,sans-serif;padding:6px;min-width:210px">
            <h4 style="margin:0 0 4px;color:#0a2a66;font-size:14px;font-weight:700">🏢 ${o.name}</h4>
            <div style="font-size:12px;color:#475569;margin-bottom:8px">
              <div>⏱️ Live Wait: <b style="color:${color}">${w} mins</b></div>
              <div>⚡ Status: <b>${w < 12 ? '🟢 Fast moving' : w < 25 ? '🟡 Moderate queue' : '🔴 Busy queue'}</b></div>
            </div>
            <div style="display:flex;gap:6px">
              <button onclick="pickOff('${o.id}'); show('join');" style="background:#0a2a66;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-weight:700;font-size:11px;cursor:pointer;flex:1">🎟️ Get Token</button>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" target="_blank" rel="noopener" style="background:#f1f5f9;color:#0a2a66;text-decoration:none;padding:6px 10px;border-radius:6px;font-weight:600;font-size:11px;display:inline-flex;align-items:center">🧭 Navigate</a>
            </div>
          </div>
        `;
        mkr.bindPopup(popupContent);

        mkr.on('click', () => {
          pickOff(o.id);
          drawRouteLine(mapInstances[containerId], S.me);
        });

        officeMkrs[o.id] = mkr;
      });

      mapInstances[containerId] = { map, userMarker, officeMkrs, routeLine: null };

      setTimeout(() => {
        try { map.invalidateSize(); } catch(e){}
      }, 250);

      return;
    } catch(err) {
      console.warn("Leaflet map setup error:", err);
    }
  } else {
    console.warn("Leaflet library not ready yet");
  }
}

function drawMap() {
  const configs = [
    { container: 'home-map', ranking: 'home-map-rankings', section: 'v-home' },
    { container: 'map', ranking: 'map-rankings', section: 'v-join' },
    { container: 'tab-map', ranking: 'tab-map-rankings', section: 'v-map' }
  ];

  configs.forEach(cfg => {
    const sec = $('#' + cfg.section);
    if (!sec || sec.classList.contains('hide')) return;

    if (!mapInstances[cfg.container]) {
      initLeafletMapForElement(cfg.container, cfg.ranking);
    } else {
      const inst = mapInstances[cfg.container];
      inst.map.invalidateSize();
      OFF.forEach(o => {
        const mkr = inst.officeMkrs[o.id];
        if (mkr) {
          const w = newWait(o.id);
          const color = w < 12 ? '#16a34a' : w < 25 ? '#d97706' : '#dc2626';
          const isSel = o.id === S.sel;
          const cityName = o.name.includes(',') ? o.name.split(',')[1].trim().replace(/\(.*\)/, '').trim() : o.name.split(' ')[0];
          const iconHtml = `<div style="background:${color};color:#fff;font-weight:700;font-size:10.5px;padding:3px 8px;border-radius:14px;border:${isSel ? '2.5px solid #0a2a66' : '1.5px solid #fff'};box-shadow:0 2px 8px rgba(0,0,0,0.35);white-space:nowrap;display:inline-flex;align-items:center;gap:3px;cursor:pointer;">
                              <span>🏢</span> <span>${cityName}</span> <b style="background:rgba(0,0,0,0.25);padding:1px 4px;border-radius:8px;font-size:9.5px">${w}m</b>
                            </div>`;
          mkr.setIcon(window.L.divIcon({
            className: 'custom-office-pin',
            html: iconHtml,
            iconSize: [95, 26],
            iconAnchor: [47, 13]
          }));
        }
      });
    }

    const rankEl = $('#' + cfg.ranking);
    const rows = OFF.map(o => {
      const g = GEO[o.id] || GEO['col'];
      const km = hav(S.me, g);
      const w = newWait(o.id);
      const e = etaKm(km);
      return { o, g, km, w, e, tot: e + w };
    }).sort((x, y) => x.tot - y.tot);

    if (rankEl) {
      rankEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3 style="margin:0;font-size:0.95rem;color:var(--pri)">📍 Nearest Government Offices to Your Location</h3>
          <span style="font-size:0.75rem;color:var(--mut)">Sorted by total travel + wait time</span>
        </div>
      ` + rows.slice(0, 6).map((r, i) => `
        <div class="rk">
          <span><b>${r.o.name}</b> ${i === 0 ? '<span class="pill" style="background:var(--ok)">Fastest overall</span>' : ''}<br>
          <span class="mut">${r.km < 1000 ? r.km.toFixed(1) + ' km' : Math.round(r.km) + ' km'} · ${r.e} min travel + ${r.w} min wait = <b>${r.tot} min total</b></span></span>
          <span style="display:flex;gap:6px">
            <button class="btn s g" onclick="pickOff('${r.o.id}'); show('join');">Choose</button>
            <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&origin=${S.me[0]},${S.me[1]}&destination=${r.g[0]},${r.g[1]}">Directions</a>
          </span>
        </div>
      `).join('') + `<p class="mut" style="margin-top:8px;font-size:0.78rem">Interactive Real-Time Leaflet.js Pan-India Map with Live GPS Streaming & Queue Tracking.</p>`;
    }
  });

  // Update Pan-India Live Metrics counters if in DOM
  const totalOfficesEl = $('#india-total-offices');
  const liveCitizensEl = $('#india-live-citizens');
  const avgWaitEl = $('#india-avg-wait');
  if (totalOfficesEl) totalOfficesEl.textContent = OFF.length;
  if (liveCitizensEl) {
    const activeToks = window.Engine ? window.Engine.getState().tokens.filter(t => t.status === 'ISSUED' || t.status === 'CALLED' || t.status === 'RESERVED').length : 24;
    liveCitizensEl.textContent = activeToks;
  }
  if (avgWaitEl) {
    const totalW = OFF.reduce((sum, o) => sum + newWait(o.id), 0);
    avgWaitEl.textContent = Math.round(totalW / (OFF.length || 1)) + 'm';
  }
}

/* ---------- AI chatbot ---------- */
function addMsg(k, t, isHtml) {
  if (window.QueueLessBot && window.QueueLessBot.addMsg) {
    return window.QueueLessBot.addMsg(k, t, isHtml);
  }
  const d = document.createElement('div');
  d.className = 'm ' + k;
  if (isHtml && k === 'b') d.innerHTML = t;
  else d.textContent = t;
  const msgs = document.getElementById('msgs');
  if (msgs) { msgs.appendChild(d); msgs.scrollTop = 1e9; }
  return d;
}

function ask(q) {
  if (window.QueueLessBot && window.QueueLessBot.ask) {
    return window.QueueLessBot.ask(q);
  }
}

function aiState() {
  if (window.QueueLessBot && window.QueueLessBot.init) {
    window.QueueLessBot.init();
  }
}

function enableAI() {
  if (window.QueueLessBot && window.QueueLessBot.resetChat) {
    window.QueueLessBot.resetChat();
  }
}

// Greet on first load (only when the chat panel exists and is still empty)
(function () {
  const msgs = document.getElementById('msgs');
  if (msgs && !msgs.children.length && window.QueueLessBot && window.QueueLessBot.resetChat) {
    window.QueueLessBot.resetChat();
  }
})();

fillSv(); show(isAdmin ? 'adm' : 'home'); draw(); aiState(); if(typeof applyLang === 'function') applyLang();
let FS = 100;
function fs(d) {
  FS = d === 0 ? 100 : Math.min(150, Math.max(80, FS + d * 15));
  document.documentElement.style.fontSize = FS + "%";
  document.body.style.fontSize = FS + "%";
  if (typeof say === 'function') say(`Text size: ${FS}%`);
}

function toggleHc() {
  document.documentElement.classList.toggle('tw-high-contrast');
  if (typeof say === 'function') say(document.documentElement.classList.contains('tw-high-contrast') ? "High contrast enabled" : "High contrast disabled");
}

function toggleRm() {
  const isRm = document.documentElement.classList.toggle('tw-reduce-motion');
  if (typeof say === 'function') say(isRm ? "Reduced motion enabled" : "Reduced motion disabled");
  
  const vid = document.getElementById('ai-avatar-vid');
  const img = document.getElementById('ai-avatar-img');
  if (vid && img) {
    if (isRm) {
      vid.classList.add('hide');
      img.classList.remove('hide');
      vid.pause();
    } else {
      vid.classList.remove('hide');
      img.classList.add('hide');
      vid.play().catch(()=>{
        vid.classList.add('hide');
        img.classList.remove('hide');
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const vid = document.getElementById('ai-avatar-vid');
  const img = document.getElementById('ai-avatar-img');
  if (vid && img) {
    vid.addEventListener('error', () => {
      vid.classList.add('hide');
      img.classList.remove('hide');
    });
  }
});

function toggleAIWidget() {
  const w = document.getElementById('ai-widget');
  const fab = document.getElementById('ai-fab');
  if (!w || !fab) return;
  
  if (w.style.display === 'none' || w.style.display === '') {
    w.style.display = 'flex';
    fab.style.display = 'none';
    setTimeout(() => document.getElementById('ci').focus(), 50);
  } else {
    w.style.display = 'none';
    fab.style.display = 'flex';
    fab.focus();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const w = document.getElementById('ai-widget');
    if (w && w.style.display === 'flex') {
      toggleAIWidget();
    }
  }
});

// Polling for demo Engine
setInterval(() => {
  if (!S.paused) draw();
}, 2000);
