/**
 * app.js — QueueLess hash router + page implementations
 * Last updated: Oct 01, 2026
 *
 * Depends on: engine.js (window.Engine), ui.js (window.QL)
 *
 * Routes:
 *   C  /                    → Home
 *   A  /take-token          → Citizen: Take Token
 *   A  /token-status        → Citizen: Token Status
 *   B  /admin/login         → Admin: Login
 *   B  /admin/queue         → Admin: Queue Dashboard
 *   B  /admin/notifications → Admin: Notification Log
 *   B  /b/live              → Direction B: Live Ops Board
 *      *                    → 404
 *
 * Admin session key: sessionStorage "ql_admin"  = "1"
 * Last token key:    sessionStorage "ql_last_id" = tokenId
 */

"use strict";

/* ================================================================
   ROUTE TABLE
================================================================ */
var ROUTES = {
  "/":                    pageHome,
  "/take-token":          pageTakeToken,
  "/token-status":        pageTokenStatus,
  "/admin/login":         pageAdminLogin,
  "/admin/queue":         pageAdminQueue,
  "/admin/notifications": pageAdminNotifications,
  "/b/live":              pageDirectionBLive,
};

/* ================================================================
   ROUTER
================================================================ */
function getRoute() {
  var hash = window.location.hash || "#/";
  return hash.replace(/^#/, "") || "/";
}

function navigate(path) {
  window.location.hash = "#" + path;
}

function renderRoute() {
  var route   = getRoute();
  var root    = document.getElementById("app-root");
  if (!root) return;

  if (window.QL && window.QL.highlightNav) {
    window.QL.highlightNav(route);
  }

  var handler = ROUTES[route] || page404;
  root.innerHTML = "";
  var pageEl = document.createElement("div");
  pageEl.className = "page";
  handler(pageEl);
  root.appendChild(pageEl);
  window.scrollTo({ top: 0, behavior: "instant" });
}

window.addEventListener("hashchange", renderRoute);
document.addEventListener("DOMContentLoaded", renderRoute);

/* ================================================================
   SHARED HELPERS
================================================================ */
function pageHero(title, subtitle) {
  return '<div class="ql-pagehead">'
    + '<h1 class="ql-pagehead__title">' + title + '</h1>'
    + (subtitle ? '<p class="ql-pagehead__subtitle">' + subtitle + '</p>' : '')
    + '</div>';
}

function badge(status) {
  if (status === "RESERVED") return '<span class="badge badge-issued" style="background:rgba(251,191,36,0.2);color:#fbbf24;border-color:rgba(251,191,36,0.3)">Not checked-in</span>';
  if (status === "UNABLE_TO_PROCESS") return '<span class="badge badge-error">Unable to Process</span>';
  return window.QL ? window.QL.badge(status) :
    '<span class="badge badge-' + status.toLowerCase() + '">' + status + '</span>';
}

function esc(s) {
  // Self-contained — does NOT depend on window.QL.escapeHtml (which doesn't exist in this build)
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alert_(type, msg) {
  if (window.QL && window.QL.alert) return window.QL.alert(type, esc(msg));
  return '<div class="alert alert-' + type + '">' + esc(msg) + '</div>';
}

function fmtEta(s) {
  if (s == null) return "—";
  if (s === 0)   return "Now";
  if (window.QL && window.QL.formatEta) return window.QL.formatEta(s);
  return s < 60 ? s + "s" : Math.floor(s/60) + "m " + (s%60) + "s";
}

function fmtTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function isAdminAuthed() {
  return sessionStorage.getItem("ql_admin") === "1";
}

function adminGuard() {
  if (!isAdminAuthed()) {
    navigate("/admin/login");
    return false;
  }
  return true;
}

/* ================================================================
   C-ROUTES — Shared / Landing
================================================================ */
function pageHome(el) {
  el.innerHTML = [
    '<div class="ql-pagehead">',
      '<span class="ql-pagehead__eyebrow">&#127963; Central Government Services Office</span>',
      '<h1 class="ql-pagehead__title">Skip the Queue.<br>Not the Service.</h1>',
      '<p class="ql-pagehead__subtitle">Virtual tokens &bull; Real-time ETA &bull; WhatsApp/SMS reminders</p>',
    '</div>',

    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:24px">',

      '<div class="card card--glow" style="display:flex;flex-direction:column;gap:14px">',
        '<div style="font-size:2rem">&#127247;</div>',
        '<div><div style="font-weight:700;font-size:1rem;margin-bottom:6px">Take a Virtual Token</div>',
        '<div style="font-size:0.875rem;color:var(--color-text-soft);line-height:1.6">Join any service queue without standing in line. Receive live ETA and reminders on your phone.</div></div>',
        '<a href="#/take-token" id="cta-take-token" class="btn btn-primary btn-lg" style="margin-top:auto">&#127247; Take Token</a>',
      '</div>',

      '<div class="card" style="display:flex;flex-direction:column;gap:14px">',
        '<div style="font-size:2rem">&#128337;</div>',
        '<div><div style="font-weight:700;font-size:1rem;margin-bottom:6px">Check Your Status</div>',
        '<div style="font-size:0.875rem;color:var(--color-text-soft);line-height:1.6">View your token, how many are ahead, and your ETA — updated every time the queue moves.</div></div>',
        '<a href="#/token-status" id="cta-status" class="btn btn-secondary btn-lg" style="margin-top:auto">&#128337; My Status</a>',
      '</div>',

      '<div class="card" style="display:flex;flex-direction:column;gap:14px">',
        '<div style="font-size:2rem">&#128202;</div>',
        '<div><div style="font-weight:700;font-size:1rem;margin-bottom:6px">Live Ops Board</div>',
        '<div style="font-size:0.875rem;color:var(--color-text-soft);line-height:1.6">Public live board showing current token, queue depth, and notification delivery summary.</div></div>',
        '<a href="#/b/live" id="cta-live" class="btn btn-secondary btn-lg" style="margin-top:auto">&#128202; Live Board</a>',
      '</div>',

    '</div>',

    '<div class="card" style="max-width:640px">',
      '<div style="font-size:0.68rem;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--color-muted);margin-bottom:10px">&#128200; ETA Formula</div>',
      '<code style="display:block;background:rgba(0,0,0,0.3);border:1px solid var(--color-border);border-radius:4px;padding:12px 14px;font-size:0.875rem;color:#7dd3fc;margin-bottom:10px">',
        'etaSeconds = &lceil;(tokensAhead / activeCounters) &times; avgServiceSeconds&rceil;',
      '</code>',
      '<p style="font-size:0.8rem;color:var(--color-muted);margin:0;line-height:1.6">Pure explainable queue math — not AI. ETA recalculates every time the queue changes.</p>',
    '</div>',
  ].join("");
}

/* ================================================================
   A-ROUTES — Citizen
================================================================ */

/** A-01: Take Token */
function pageTakeToken(el) {
  var svcs = Engine.getServices("off-001");

  el.innerHTML = [
    pageHero("Take a Token", "Select your service, provide your phone number, and join the virtual queue."),
    '<div class="card" style="max-width:600px">',
      '<form id="take-token-form" novalidate autocomplete="off">',

        '<div class="form-group" style="margin-bottom:14px">',
          '<label class="form-label" for="tt-svc">Service</label>',
          '<select class="form-select" id="tt-svc" required aria-required="true">',
            '<option value="" disabled selected>Choose a service&hellip;</option>',
            svcs.map(function(s) {
              return '<option value="' + s.id + '">' + esc(s.name) + '</option>';
            }).join(""),
          '</select>',
        '</div>',
        '<div id="tt-reqs-panel" style="margin-bottom:14px"></div>',

        '<div class="form-group" style="margin-bottom:14px">',
          '<label class="form-label" for="tt-name">Name <span style="color:var(--color-muted);font-weight:400">(optional)</span></label>',
          '<input class="form-input" id="tt-name" type="text" placeholder="e.g. Arjun Kumar" autocomplete="name" />',
        '</div>',

        '<div class="form-group" style="margin-bottom:14px">',
          '<label class="form-label" for="tt-phone">Phone Number</label>',
          '<input class="form-input" id="tt-phone" type="tel" placeholder="+91 98765 43210" autocomplete="tel" required aria-required="true" />',
          '<div class="form-hint">Needed for reminders. We will not share your number.</div>',
        '</div>',

        '<div class="form-group" style="margin-bottom:14px">',
          '<label class="form-label">Where are you joining from?</label>',
          '<div style="display:flex;flex-direction:column;gap:8px">',
            '<label class="checkbox-row"><input type="radio" name="tt-join-mode" value="ON_SITE" checked /> I&rsquo;m at the office now</label>',
            '<label class="checkbox-row"><input type="radio" name="tt-join-mode" value="REMOTE" /> Joining from home (check-in required)</label>',
          '</div>',
        '</div>',

        '<div style="border-top:1px solid var(--color-border);padding-top:14px;margin-bottom:14px">',
          '<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted);margin-bottom:10px">Reminder preferences</div>',
          '<div style="display:flex;flex-direction:column;gap:8px">',
            '<label class="checkbox-row"><input type="checkbox" id="tt-wa" /> WhatsApp reminders</label>',
            '<label class="checkbox-row"><input type="checkbox" id="tt-sms" /> SMS reminders</label>',
            '<label class="checkbox-row"><input type="checkbox" id="tt-consent" required /> I consent to receive reminder messages on the above number</label>',
          '</div>',
          '<div class="form-hint" style="margin-top:6px">Demo thresholds: 60 s and 30 s before your turn (production: 10 min / 5 min).</div>',
        '</div>',

        '<div id="tt-result" style="margin-bottom:12px"></div>',

        '<button type="submit" id="tt-submit" class="btn btn-primary btn-lg" style="width:100%">&#127247; Get My Token</button>',
      '</form>',
    '</div>',
  ].join("");

  /* ── Form wiring ─────────────────────────────────────────────── */
  var form   = el.querySelector("#take-token-form");
  var result = el.querySelector("#tt-result");
  var submit = el.querySelector("#tt-submit");
  var svcSel = el.querySelector("#tt-svc");
  var reqsPanel = el.querySelector("#tt-reqs-panel");

  function renderReqs() {
    var sId = svcSel.value;
    if (!sId) {
      reqsPanel.innerHTML = '<div style="background:rgba(255,255,255,0.05);border:1px dashed var(--color-border);padding:12px;border-radius:4px;font-size:0.85rem;color:var(--color-text-soft);text-align:center">Select a service to view required documents.</div>';
      return;
    }
    var svc = svcs.filter(function(x) { return x.id === sId; })[0];
    if (!svc || !svc.requirements || svc.requirements.length === 0) {
      reqsPanel.innerHTML = '';
      return;
    }
    var html = '<div class="ql-section" style="padding:12px;background:rgba(14,165,233,0.05);border-color:rgba(14,165,233,0.2);margin:0">';
    html += '<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-brand);margin-bottom:8px">Documents Required (Demo)</div>';
    html += '<ul style="margin:0;padding-left:20px;font-size:0.85rem;color:var(--color-text-soft)">';
    svc.requirements.forEach(function(r) { html += '<li style="margin-bottom:4px">' + esc(r) + '</li>'; });
    html += '</ul></div>';
    reqsPanel.innerHTML = html;
  }
  svcSel.addEventListener("change", renderReqs);
  renderReqs();

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    result.innerHTML = "";

    var opts = {
      serviceId:     el.querySelector("#tt-svc").value,
      name:          el.querySelector("#tt-name").value,
      phone:         el.querySelector("#tt-phone").value,
      notifyWhatsApp:el.querySelector("#tt-wa").checked,
      notifySms:     el.querySelector("#tt-sms").checked,
      consentGiven:  el.querySelector("#tt-consent").checked,
      joinMode:      el.querySelector("input[name='tt-join-mode']:checked").value,
    };

    var tok;
    try { tok = Engine.takeToken(opts); }
    catch(err) {
      result.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>';
      return;
    }

    // Persist so status page can pick it up
    sessionStorage.setItem("ql_last_id", tok.id);

    submit.disabled = true;
    submit.innerHTML = (window.QL ? window.QL.spinner() : "") + " Issuing&hellip;";

    setTimeout(function() {
      submit.disabled = false;
      submit.innerHTML = "&#127247; Get My Token";

      result.innerHTML = [
        '<div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-left:4px solid #22c55e;border-radius:4px;padding:16px">',
          '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4ade80;margin-bottom:6px">Token Issued</div>',
          '<div class="ql-nums" style="font-size:2.2rem;font-weight:800;letter-spacing:-0.03em;color:#fff;line-height:1;margin-bottom:8px">' + esc(tok.tokenNumber) + '</div>',
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:0.85rem;color:var(--color-text-soft)">',
            badge("ISSUED"),
            '&bull; <strong class="ql-nums">' + tok.tokensAhead + '</strong> ahead',
            '&bull; ETA <strong class="ql-nums">' + fmtEta(tok.etaSeconds) + '</strong>',
          '</div>',
          '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">',
            '<a href="#/token-status" class="btn btn-primary btn-sm">Check Status &rarr;</a>',
          '</div>',
          '<div style="margin-top:8px;font-size:0.72rem;color:var(--color-muted)">Service: ' + esc(tok.serviceName) + '</div>',
        '</div>',
      ].join("");
      form.reset();
    }, 500);
  });
}

/** A-02: Token Status */
function pageTokenStatus(el) {
  function renderStatus(tok) {
    if (!tok) {
      return '<div class="alert alert-error" style="max-width:500px">Token not found. Check the number and try again.</div>';
    }

    var isActive = tok.status === "ISSUED" || tok.status === "CALLED";
    var isReserved = tok.status === "RESERVED";
    var isUnable = tok.status === "UNABLE_TO_PROCESS";
    var etaPulse = isActive && tok.etaSeconds != null && tok.etaSeconds <= 60 ?
      ' style="color:#fbbf24;animation:live-ping 1.8s ease-out infinite"' : "";

    return [
      '<div class="card" style="max-width:500px">',
        '<div style="text-align:center;padding:16px 8px 20px">',
          '<div style="font-size:0.65rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-muted);margin-bottom:8px">Token Number</div>',
          '<div class="ql-nums" style="font-size:3.5rem;font-weight:800;letter-spacing:-0.04em;line-height:1;color:#fff;margin-bottom:10px">' + esc(tok.tokenNumber) + '</div>',
          '<div style="display:flex;justify-content:center;gap:8px;margin-bottom:16px">' + badge(tok.status) + '</div>',

          isUnable ? [
            '<div class="alert alert-error" style="text-align:left;margin-bottom:16px">',
              '<div style="font-weight:600;margin-bottom:4px">We were unable to process your request</div>',
              '<div style="font-size:0.85rem">Reason: <strong>' + esc(tok.outcomeReason || "Other") + '</strong></div>',
            '</div>',
          ].join("") : "",

          isReserved ? [
            '<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:4px;padding:12px;margin-bottom:16px;text-align:left">',
              '<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:#fbbf24;margin-bottom:6px">Check-in Required</div>',
              '<div style="font-size:0.85rem;color:var(--color-text-soft);margin-bottom:12px">This token will be eligible for calling only after you check in at the office.</div>',
              '<div style="text-align:center"><button id="ts-checkin-btn" class="btn btn-primary btn-sm">Check In Now</button></div>',
            '</div>',
          ].join("") : "",

          isActive ? [
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left">',
              '<div class="card" style="padding:12px">',
                '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted);margin-bottom:4px">Tokens Ahead</div>',
                '<div class="ql-nums" style="font-size:1.8rem;font-weight:700;color:var(--color-accent)">' + tok.tokensAhead + '</div>',
              '</div>',
              '<div class="card" style="padding:12px">',
                '<div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted);margin-bottom:4px">Est. Wait</div>',
                '<div class="ql-nums" style="font-size:1.8rem;font-weight:700' + (etaPulse ? ';color:#fbbf24' : '') + '">' + fmtEta(tok.etaSeconds) + '</div>',
              '</div>',
            '</div>',
          ].join("") : "",

          '<div style="margin-top:14px;font-size:0.78rem;color:var(--color-muted)">',
            'Service: ' + esc(tok.serviceName) + '<br>',
            tok.calledAt ? 'Called at: <span class="ql-nums">' + fmtTime(tok.calledAt) + '</span>' : "",
            tok.servedAt ? ' &bull; Served: <span class="ql-nums">' + fmtTime(tok.servedAt) + '</span>' : "",
          '</div>',

          (function() {
            var allSvcs = Engine.getServices(tok.officeId || "off-001");
            var svc = allSvcs.filter(function(x) { return x.id === tok.serviceId; })[0];
            if (svc && svc.requirements && svc.requirements.length > 0) {
              var h = '<div class="ql-section" style="margin-top:16px;padding:12px;background:rgba(255,255,255,0.03);border-color:var(--color-border);text-align:left">';
              h += '<div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted);margin-bottom:8px">Documents Required (Demo)</div>';
              h += '<ul style="margin:0;padding-left:20px;font-size:0.8rem;color:var(--color-text-soft)">';
              svc.requirements.forEach(function(r) { h += '<li style="margin-bottom:4px">' + esc(r) + '</li>'; });
              h += '</ul></div>';
              return h;
            }
            return "";
          })(),

        '</div>',

        isActive ? [
          '<div style="border-top:1px solid var(--color-border);padding:12px;text-align:center">',
            '<button id="ts-cancel-btn" class="btn btn-danger btn-sm">Cancel My Token</button>',
          '</div>',
        ].join("") : "",
      '</div>',
    ].join("");
  }

  function render(tokenId) {
    var tok = tokenId ? Engine.getToken(tokenId) : null;
    el.innerHTML = [
      pageHero("Your Token Status", "Real-time position and ETA for your active token."),

      '<div style="display:flex;flex-direction:column;gap:16px;max-width:500px">',

        '<div class="ql-section">',
          '<div class="ql-section__header"><h2 class="ql-section__title">Look up a token</h2></div>',
          '<div class="ql-section__body">',
            '<form id="ts-lookup-form" style="display:flex;gap:8px;flex-wrap:wrap">',
              '<input class="form-input" id="ts-lookup-input" type="text" placeholder="TW-0001" style="flex:1;min-width:120px" />',
              '<button type="submit" class="btn btn-primary">Look Up</button>',
            '</form>',
          '</div>',
        '</div>',

        '<div id="ts-status-card">' + renderStatus(tok) + '</div>',

      '</div>',
    ].join("");

    // Wire lookup form
    el.querySelector("#ts-lookup-form").addEventListener("submit", function(ev) {
      ev.preventDefault();
      var num = el.querySelector("#ts-lookup-input").value.trim();
      var found = Engine.findByNumber(num);
      el.querySelector("#ts-status-card").innerHTML = renderStatus(found);
      if (found) {
        sessionStorage.setItem("ql_last_id", found.id);
        wireActions(found.id);
      }
    });

    if (tok) wireActions(tok.id);
  }

  function wireActions(tokenId) {
    var cBtn = el.querySelector("#ts-cancel-btn");
    if (cBtn) {
      cBtn.addEventListener("click", function() {
        if (!confirm("Cancel token " + (Engine.getToken(tokenId)||{}).tokenNumber + "?")) return;
        try {
          Engine.cancel(tokenId);
          sessionStorage.removeItem("ql_last_id");
        } catch(err) { /* ignore */ }
        render(null);
      });
    }

    var chBtn = el.querySelector("#ts-checkin-btn");
    if (chBtn) {
      chBtn.addEventListener("click", function() {
        try {
          Engine.checkIn(tokenId);
        } catch(err) { alert(err.message); }
        render(tokenId);
      });
    }
  }

  var lastId = sessionStorage.getItem("ql_last_id");
  render(lastId);
}

/* ================================================================
   B-ROUTES — Admin
================================================================ */

/** B-01: Admin Login */
function pageAdminLogin(el) {
  if (isAdminAuthed()) { navigate("/admin/queue"); return; }

  el.innerHTML = [
    pageHero("Admin Login", "Enter the demo passcode to access the queue management dashboard."),
    '<div class="card" style="max-width:360px">',
      '<form id="admin-login-form" novalidate>',
        '<div class="form-group" style="margin-bottom:16px">',
          '<label class="form-label" for="al-code">Demo Passcode</label>',
          '<input class="form-input" id="al-code" type="password" placeholder="••••" autocomplete="off" />',
          '<div class="form-hint">Passcode for this demo: <code>admin</code></div>',
        '</div>',
        '<div id="al-error" style="margin-bottom:10px"></div>',
        '<button type="submit" id="al-submit" class="btn btn-primary" style="width:100%">Login &rarr;</button>',
      '</form>',
    '</div>',
  ].join("");

  el.querySelector("#admin-login-form").addEventListener("submit", function(ev) {
    ev.preventDefault();
    var code = el.querySelector("#al-code").value.trim();
    if (code === "admin" || code === "1234") {
      sessionStorage.setItem("ql_admin", "1");
      navigate("/admin/queue");
    } else {
      el.querySelector("#al-error").innerHTML = '<div class="alert alert-error">Incorrect passcode.</div>';
    }
  });
}

/** B-02: Admin Queue Dashboard */
function pageAdminQueue(el) {
  if (!adminGuard()) return;

  function render() {
    var allQueues = Engine.getAllQueues();
    var state     = Engine.getState();

    // Summary stats
    var totalActive = allQueues.reduce(function(s, q) { return s + q.queue.length; }, 0);
    var called      = state.tokens.filter(function(t) { return t.status === "CALLED"; }).length;
    var done        = state.tokens.filter(function(t) { return t.status === "DONE"; }).length;
    var notifTotal  = state.notificationLog.length;

    var serviceHTML = allQueues.map(function(g) {
      var svc   = g.service;
      var queue = g.queue;
      var issued = queue.filter(function(t) { return t.status === "ISSUED"; });

      var rows = queue.length ? queue.map(function(t) {
        var issuedRow = t.status === "ISSUED";
        var calledRow = t.status === "CALLED";
        return [
          '<tr>',
            '<td class="ql-nums" style="font-weight:700">' + esc(t.tokenNumber) + '</td>',
            '<td style="font-size:0.82rem">' + esc(t.name || "—") + '</td>',
            '<td>' + badge(t.status) + '</td>',
            '<td class="ql-nums">' + (t.tokensAhead != null ? t.tokensAhead : "—") + '</td>',
            '<td class="ql-nums" style="color:' + (t.etaSeconds != null && t.etaSeconds <= 30 ? "#fbbf24" : t.etaSeconds != null && t.etaSeconds <= 60 ? "#38bdf8" : "var(--color-text-soft)") + '">',
              fmtEta(t.etaSeconds),
            '</td>',
            '<td style="font-size:0.75rem;color:var(--color-muted)">' + (t.notifyWhatsApp ? "WA " : "") + (t.notifySms ? "SMS" : "") + (!t.notifyWhatsApp && !t.notifySms ? "—" : "") + '</td>',
            '<td style="white-space:nowrap">',
              calledRow ? [
                '<button class="btn btn-success btn-sm aq-serve" data-id="' + t.id + '" style="margin-right:4px">Served</button>',
                '<button class="btn btn-warning btn-sm aq-noshow" data-id="' + t.id + '" style="margin-right:4px">No-Show</button>',
                '<button class="btn btn-danger btn-sm aq-unable" data-id="' + t.id + '">Unable...</button>',
              ].join("") : "",
            '</td>',
          '</tr>',
        ].join("");
      }).join("") : [
        '<tr><td colspan="7" style="text-align:center;color:var(--color-muted);padding:20px 12px;font-size:0.85rem">Queue empty</td></tr>',
      ].join("");

      return [
        '<section class="ql-section" style="margin-bottom:16px">',
          '<div class="ql-section__header">',
            '<h2 class="ql-section__title">' + esc(svc.name) + '</h2>',
            '<div class="ql-section__actions">',
              // Counter control
              '<div style="display:flex;align-items:center;gap:6px;font-size:0.82rem">',
                '<button class="btn btn-secondary btn-sm aq-counter-minus" data-svc="' + svc.id + '">&#8722;</button>',
                '<span class="ql-nums" style="font-weight:700;min-width:20px;text-align:center">' + svc.activeCounters + '</span>',
                '<button class="btn btn-secondary btn-sm aq-counter-plus" data-svc="' + svc.id + '">&#43;</button>',
                '<span style="color:var(--color-muted)">counter' + (svc.activeCounters !== 1 ? "s" : "") + '</span>',
              '</div>',
              issued.length > 0 ?
                '<button class="btn btn-primary btn-sm aq-call-next" data-svc="' + svc.id + '">&#128221; Call Next</button>' :
                '<span style="font-size:0.78rem;color:var(--color-muted)">No tokens waiting</span>',
            '</div>',
          '</div>',
          '<div style="overflow-x:auto">',
            '<table class="ql-table" aria-label="Queue for ' + esc(svc.name) + '">',
              '<thead><tr>',
                '<th>Token</th><th>Name</th><th>Status</th><th>Ahead</th><th>ETA</th><th>Notify</th><th>Actions</th>',
              '</tr></thead>',
              '<tbody>' + rows + '</tbody>',
            '</table>',
          '</div>',
        '</section>',
      ].join("");
    }).join("");

    el.innerHTML = [
      '<div class="ql-pagehead">',
        '<span class="ql-pagehead__eyebrow">&#128203; Admin Panel</span>',
        '<h1 class="ql-pagehead__title">Queue Dashboard</h1>',
        '<p class="ql-pagehead__subtitle">Call tokens, mark served or no-show, run reminder checks.</p>',
      '</div>',

      // Top action bar
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:20px">',
        '<button id="aq-reminder-btn" class="btn btn-primary">&#9881;&#65039; Run Reminder Check Now</button>',
        '<button id="aq-reset-btn"    class="btn btn-secondary">&#9851;&#65039; Seed / Reset Demo</button>',
        '<a href="#/admin/notifications"  class="btn btn-secondary">&#128241; Notification Log</a>',
        '<button id="aq-logout-btn"   class="btn btn-danger">Logout</button>',
      '</div>',

      // KPI row
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:20px">',
        kpiTile("In Queue",  totalActive, "var(--color-accent)"),
        kpiTile("Called",    called,      "#fbbf24"),
        kpiTile("Done",      done,        "#4ade80"),
        kpiTile("Log Entries", notifTotal, "var(--color-text-soft)"),
      '</div>',

      // Reminder result placeholder
      '<div id="aq-reminder-result" style="margin-bottom:12px"></div>',

      // Per-service sections
      serviceHTML,
    ].join("");

    /* ── Event wiring ─────────────────────────────────────────── */
    el.querySelector("#aq-reminder-btn").addEventListener("click", function() {
      var logs = Engine.runReminderCheck();
      var sent    = logs.filter(function(l) { return l.status === "SENT"; }).length;
      var failed  = logs.filter(function(l) { return l.status === "FAILED"; }).length;
      var skipped = logs.filter(function(l) { return l.status === "SKIPPED"; }).length;
      var msg;
      if (!logs.length) {
        msg = '<div class="alert alert-info">No reminders due — all ETAs above threshold or already sent.</div>';
      } else {
        msg = '<div class="alert alert-success">&#10003; Reminder check complete: ' +
          '<strong>' + sent + '</strong> sent, ' +
          '<strong>' + skipped + '</strong> skipped, ' +
          '<strong>' + failed + '</strong> failed. ' +
          '<a href="#/admin/notifications" style="color:inherit;text-decoration:underline">View log &rarr;</a>' +
          '</div>';
      }
      el.querySelector("#aq-reminder-result").innerHTML = msg;
      render(); // refresh counts
      el.querySelector("#aq-reminder-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    el.querySelector("#aq-reset-btn").addEventListener("click", function() {
      if (!confirm("Reset all demo data? This clears tokens, notifications, and audit log.")) return;
      Engine.reset();
      render();
    });

    el.querySelector("#aq-logout-btn").addEventListener("click", function() {
      sessionStorage.removeItem("ql_admin");
      navigate("/admin/login");
    });

    el.querySelectorAll(".aq-call-next").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var svcId = btn.dataset.svc;
        var tok   = Engine.callNext(svcId);
        if (!tok) return;
        Engine.runReminderCheck(); // auto-check after queue moves
        render();
      });
    });

    el.querySelectorAll(".aq-serve").forEach(function(btn) {
      btn.addEventListener("click", function() {
        Engine.serve(btn.dataset.id);
        Engine.runReminderCheck();
        render();
      });
    });

    el.querySelectorAll(".aq-noshow").forEach(function(btn) {
      btn.addEventListener("click", function() {
        Engine.noShow(btn.dataset.id);
        Engine.runReminderCheck();
        render();
      });
    });

    el.querySelectorAll(".aq-unable").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var parent = btn.parentNode;
        parent.innerHTML = [
          '<select class="form-input aq-unable-reason" style="width:140px;display:inline-block;margin-right:4px;padding:2px 4px;font-size:0.75rem;height:26px">',
            '<option value="Missing documents">Missing documents</option>',
            '<option value="Details mismatch">Details mismatch</option>',
            '<option value="Payment pending">Payment pending</option>',
            '<option value="Applicant not present">Applicant not present</option>',
            '<option value="Invalid signature">Invalid signature</option>',
            '<option value="Application expired">Application expired</option>',
            '<option value="Overdue fees">Overdue fees</option>',
            '<option value="Other">Other</option>',
          '</select>',
          '<button class="btn btn-danger btn-sm aq-unable-confirm" data-id="' + btn.dataset.id + '">OK</button>',
          '<button class="btn btn-secondary btn-sm aq-unable-cancel" style="margin-left:4px">Cancel</button>'
        ].join("");

        parent.querySelector(".aq-unable-cancel").addEventListener("click", function() {
          render(); // Reset row to normal
        });

        parent.querySelector(".aq-unable-confirm").addEventListener("click", function() {
          var reason = parent.querySelector(".aq-unable-reason").value;
          try {
            Engine.unableToProcess(btn.dataset.id, reason);
            Engine.runReminderCheck();
            render();
          } catch(e) { alert(e.message); }
        });
      });
    });

    el.querySelectorAll(".aq-counter-plus").forEach(function(btn) {
      btn.addEventListener("click", function() { Engine.adjustCounters(btn.dataset.svc, +1); render(); });
    });
    el.querySelectorAll(".aq-counter-minus").forEach(function(btn) {
      btn.addEventListener("click", function() { Engine.adjustCounters(btn.dataset.svc, -1); render(); });
    });
  }

  render();
}

function kpiTile(label, value, color) {
  return [
    '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--color-border);border-radius:6px;padding:12px">',
      '<div style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted);margin-bottom:4px">' + label + '</div>',
      '<div class="ql-nums" style="font-size:1.6rem;font-weight:700;line-height:1;color:' + color + '">' + value + '</div>',
    '</div>',
  ].join("");
}

/** B-03: Notification Log */
function pageAdminNotifications(el) {
  if (!adminGuard()) return;

  function render() {
    var logs = Engine.getNotificationLog();
    var sent    = logs.filter(function(l) { return l.status === "SENT";    }).length;
    var failed  = logs.filter(function(l) { return l.status === "FAILED";  }).length;
    var skipped = logs.filter(function(l) { return l.status === "SKIPPED"; }).length;

    var rows = logs.length ? logs.map(function(l) {
      return [
        '<tr>',
          '<td class="ql-nums" style="font-weight:700">' + esc(l.tokenNumber || "—") + '</td>',
          '<td>' + badge(l.channel) + '</td>',
          '<td class="ql-nums">' + l.thresholdSeconds + 's</td>',
          '<td>' + badge(l.status) + '</td>',
          '<td style="font-family:monospace;font-size:0.78rem;color:var(--color-muted)">' + esc(l.providerMessageId || "—") + '</td>',
          '<td style="font-size:0.78rem;color:#f87171;max-width:200px;word-break:break-word">' + esc(l.error || "") + '</td>',
          '<td class="ql-nums" style="color:var(--color-muted);font-size:0.78rem;white-space:nowrap">' + fmtTime(l.createdAt) + '</td>',
        '</tr>',
      ].join("");
    }).join("") : '<tr><td colspan="7" style="text-align:center;color:var(--color-muted);padding:24px">No notification attempts yet. Run a reminder check in the Queue Dashboard.</td></tr>';

    el.innerHTML = [
      '<div class="ql-pagehead">',
        '<span class="ql-pagehead__eyebrow">&#128241; Admin Panel</span>',
        '<h1 class="ql-pagehead__title">Notification Log</h1>',
        '<p class="ql-pagehead__subtitle">Truthful audit of every attempted WhatsApp / SMS reminder dispatch.</p>',
      '</div>',

      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:16px">',
        '<a href="#/admin/queue" class="btn btn-secondary btn-sm">&larr; Queue</a>',
        '<button id="an-reminder-btn" class="btn btn-primary btn-sm">&#9881;&#65039; Run Reminder Check Now</button>',
      '</div>',

      // KPI row
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:16px">',
        kpiTile("Sent",    sent,          "#4ade80"),
        kpiTile("Skipped", skipped,       "#94a3b8"),
        kpiTile("Failed",  failed,        "#f87171"),
        kpiTile("Total",   logs.length,   "var(--color-text-soft)"),
      '</div>',

      '<div class="ql-section">',
        '<div class="ql-section__header">',
          '<h2 class="ql-section__title">All Attempts</h2>',
          '<span style="font-size:0.72rem;color:var(--color-muted)">Most recent first</span>',
        '</div>',
        '<div style="overflow-x:auto">',
          '<table class="ql-table" aria-label="Notification log">',
            '<thead><tr>',
              '<th>Token</th><th>Channel</th><th>Threshold</th><th>Status</th>',
              '<th>Provider ID</th><th>Error</th><th>Time</th>',
            '</tr></thead>',
            '<tbody>' + rows + '</tbody>',
          '</table>',
        '</div>',
      '</div>',

      // Disclosure
      '<div class="alert alert-info" style="margin-top:16px;font-size:0.82rem">',
        '&#9432;&#65039; <strong>Demo disclosure:</strong> SENT/FAILED statuses are simulated (85%/15% split). ',
        'SKIPPED means no consent or channels. In production, Twilio delivers messages and returns real status codes.',
      '</div>',
    ].join("");

    el.querySelector("#an-reminder-btn").addEventListener("click", function() {
      Engine.runReminderCheck();
      render();
    });
  }

  render();
}

/* ================================================================
   DIRECTION B — Live Ops Board  (#/b/live)
   Uses Engine state; each module re-reads on each page render.
================================================================ */

function blBadge(status) { return badge(status); }

function renderLiveOpsBanner() {
  var allQueues   = Engine.getAllQueues();
  var totalActive = allQueues.reduce(function(s, g) { return s + g.queue.length; }, 0);
  var totalCounters = Engine.getServices("off-001").reduce(function(s, sv) { return s + sv.activeCounters; }, 0);

  var calledEntry = null;
  allQueues.forEach(function(g) {
    if (!calledEntry) {
      var c = g.queue.find(function(t) { return t.status === "CALLED"; });
      if (c) calledEntry = { token: c, service: g.service };
    }
  });

  var inner = calledEntry ? [
    '<div class="blive-banner__token ql-nums">' + esc(calledEntry.token.tokenNumber) + '</div>',
    '<div class="blive-banner__service">' + esc(calledEntry.service.name) + '</div>',
    '<div class="blive-banner__meta">Counter ' + calledEntry.service.activeCounters + ' &bull; Now serving</div>',
  ].join("") : [
    '<div class="blive-banner__token">—</div>',
    '<div class="blive-banner__service" style="color:var(--color-muted)">Queue ready — no token called yet</div>',
  ].join("");

  return [
    '<div class="blive-banner" id="blive-banner" role="region" aria-label="Currently serving">',
      '<div class="blive-banner__pulse" aria-hidden="true"></div>',
      '<div class="blive-banner__left">',
        '<div class="blive-banner__eyebrow"><span class="blive-dot" aria-hidden="true"></span> LIVE &mdash; Now Serving</div>',
        inner,
      '</div>',
      '<div class="blive-banner__right">',
        '<div class="blive-banner__kpi"><span class="blive-banner__kpi-val ql-nums">' + totalActive + '</span><span class="blive-banner__kpi-lbl">In Queue</span></div>',
        '<div class="blive-banner__kpi"><span class="blive-banner__kpi-val ql-nums">' + totalCounters + '</span><span class="blive-banner__kpi-lbl">Counters Open</span></div>',
        '<div class="blive-banner__kpi"><span class="blive-banner__kpi-val ql-nums">20s</span><span class="blive-banner__kpi-lbl">Avg Service</span></div>',
      '</div>',
    '</div>',
  ].join("");
}

function renderCountersRow() {
  var tiles = Engine.getAllQueues().map(function(g) {
    var svc     = g.service;
    var waiting = g.queue.filter(function(t) { return t.status === "ISSUED"; }).length;
    var maxEta  = g.queue.reduce(function(m, t) { return t.etaSeconds != null ? Math.max(m, t.etaSeconds) : m; }, 0);
    var calledTok = g.queue.find(function(t) { return t.status === "CALLED"; });
    return [
      '<div class="blive-counter-tile" role="group" aria-label="' + esc(svc.name) + '">',
        '<div class="blive-counter-tile__name">' + esc(svc.name) + '</div>',
        '<div class="blive-counter-tile__row">',
          '<div class="blive-counter-tile__kpi">',
            '<span class="ql-nums" style="font-size:1.7rem;font-weight:700;color:var(--color-accent);line-height:1">' + waiting + '</span>',
            '<span style="font-size:0.7rem;color:var(--color-muted);text-transform:uppercase;letter-spacing:0.06em">Waiting</span>',
          '</div>',
          '<div class="blive-counter-tile__kpi">',
            '<span class="ql-nums" style="font-size:1.7rem;font-weight:700;color:var(--color-text);line-height:1">' + svc.activeCounters + '</span>',
            '<span style="font-size:0.7rem;color:var(--color-muted);text-transform:uppercase;letter-spacing:0.06em">Counters</span>',
          '</div>',
          '<div class="blive-counter-tile__kpi">',
            '<span class="ql-nums" style="font-size:1.7rem;font-weight:700;line-height:1;color:' + (maxEta <= 60 ? "#fbbf24" : "var(--color-text-soft)") + '">' + fmtEta(maxEta) + '</span>',
            '<span style="font-size:0.7rem;color:var(--color-muted);text-transform:uppercase;letter-spacing:0.06em">Max Wait</span>',
          '</div>',
        '</div>',
        calledTok ? '<div style="margin-top:8px;font-size:0.75rem;color:var(--color-text-soft)">Serving <strong class="ql-nums">' + esc(calledTok.tokenNumber) + '</strong></div>' : "",
      '</div>',
    ].join("");
  }).join("");

  return [
    '<section class="ql-section" id="blive-counters" aria-label="Counter status">',
      '<div class="ql-section__header">',
        '<h2 class="ql-section__title">&#128203; Counter Status</h2>',
        '<a href="#/admin/queue" class="btn btn-sm btn-secondary">Admin Queue &rarr;</a>',
      '</div>',
      '<div class="ql-section__body"><div class="blive-counters-grid">' + tiles + '</div></div>',
    '</section>',
  ].join("");
}

function renderInlineTokenForm() {
  var svcs    = Engine.getServices("off-001");
  var options = svcs.map(function(s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join("");

  return [
    '<section class="ql-section" id="blive-take-token" aria-label="Take a token">',
      '<div class="ql-section__header">',
        '<h2 class="ql-section__title">&#127247; Join the Queue</h2>',
        '<a href="#/take-token" class="btn btn-sm btn-primary" id="blive-full-form-link">Full form &rarr;</a>',
      '</div>',
      '<div class="ql-section__body">',
        '<form id="blive-token-form" class="blive-entry-form" novalidate autocomplete="off">',
          '<div class="blive-entry-form__row">',
            '<div class="form-group" style="flex:2">',
              '<label class="form-label" for="bl-svc">Service</label>',
              '<select class="form-select" id="bl-svc" required><option value="" disabled selected>Select a service&hellip;</option>' + options + '</select>',
            '</div>',
            '<div class="form-group" style="flex:2">',
              '<label class="form-label" for="bl-phone">Phone</label>',
              '<input class="form-input" id="bl-phone" type="tel" placeholder="+91 98765 43210" />',
            '</div>',
            '<div class="form-group" style="flex:1">',
              '<label class="form-label" style="visibility:hidden">Action</label>',
              '<button type="submit" id="bl-submit" class="btn btn-primary" style="width:100%">Get Token</button>',
            '</div>',
          '</div>',
          '<div class="blive-entry-form__checkboxes">',
            '<label class="checkbox-row"><input type="checkbox" id="bl-wa" /> WhatsApp</label>',
            '<label class="checkbox-row"><input type="checkbox" id="bl-sms" /> SMS</label>',
            '<label class="checkbox-row"><input type="checkbox" id="bl-consent" /> I consent to reminders</label>',
          '</div>',
          '<div id="bl-result" style="margin-top:8px"></div>',
        '</form>',
      '</div>',
    '</section>',
  ].join("");
}

function renderServiceTable() {
  var rows = Engine.getAllQueues().flatMap(function(g) {
    return g.queue.map(function(t, i) {
      return [
        '<tr>',
          i === 0 ? '<td rowspan="' + g.queue.length + '" style="font-weight:600;font-size:0.82rem;vertical-align:top;padding-top:13px;border-right:1px solid var(--color-border);white-space:normal;max-width:140px">' + esc(g.service.name) + '</td>' : "",
          '<td class="ql-nums" style="font-weight:700">' + esc(t.tokenNumber) + '</td>',
          '<td>' + badge(t.status) + '</td>',
          '<td class="ql-nums">' + (t.tokensAhead != null ? t.tokensAhead : "—") + '</td>',
          '<td class="ql-nums" style="color:' + (t.etaSeconds != null && t.etaSeconds <= 30 ? "#fbbf24" : t.etaSeconds != null && t.etaSeconds <= 60 ? "#38bdf8" : "var(--color-text-soft)") + '">' + fmtEta(t.etaSeconds) + '</td>',
        '</tr>',
      ].join("");
    });
  }).join("") || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--color-muted)">Queue empty</td></tr>';

  return [
    '<section class="ql-section" id="blive-service-table" aria-label="Queue snapshot">',
      '<div class="ql-section__header">',
        '<h2 class="ql-section__title">&#128202; Queue Snapshot</h2>',
        '<span style="font-size:0.72rem;color:var(--color-muted)">ETA = &lceil;(ahead &divide; counters) &times; avgSec&rceil;</span>',
      '</div>',
      '<div style="overflow-x:auto">',
        '<table class="ql-table" aria-label="Token queue by service">',
          '<thead><tr><th>Service</th><th>Token</th><th>Status</th><th>Ahead</th><th>ETA</th></tr></thead>',
          '<tbody>' + rows + '</tbody>',
        '</table>',
      '</div>',
    '</section>',
  ].join("");
}

function renderNotifSummary() {
  var logs    = Engine.getNotificationLog();
  var sent    = logs.filter(function(l) { return l.status === "SENT";    }).length;
  var failed  = logs.filter(function(l) { return l.status === "FAILED";  }).length;
  var skipped = logs.filter(function(l) { return l.status === "SKIPPED"; }).length;
  var total   = sent + failed + skipped;
  var recentLogs = logs.slice(0, 5);

  var sentPct    = total ? Math.round(sent/total*100)    : 0;
  var failedPct  = total ? Math.round(failed/total*100)  : 0;
  var skippedPct = total ? Math.round(skipped/total*100) : 0;

  var logRows = recentLogs.length ? recentLogs.map(function(l) {
    return [
      '<tr>',
        '<td class="ql-nums" style="font-weight:600">' + esc(l.tokenNumber || "—") + '</td>',
        '<td>' + badge(l.channel) + '</td>',
        '<td class="ql-nums">' + l.thresholdSeconds + 's</td>',
        '<td>' + badge(l.status) + '</td>',
        '<td class="ql-nums" style="color:var(--color-muted)">' + fmtTime(l.createdAt) + '</td>',
      '</tr>',
    ].join("");
  }).join("") : '<tr><td colspan="5" style="text-align:center;color:var(--color-muted);padding:16px">No reminders dispatched yet.</td></tr>';

  return [
    '<section class="ql-section" id="blive-notification-summary" aria-label="Notification delivery">',
      '<div class="ql-section__header">',
        '<h2 class="ql-section__title">&#128241; Notification Delivery</h2>',
        '<div class="ql-section__actions">',
          '<a href="#/admin/notifications" class="btn btn-sm btn-secondary" id="blive-full-log-link">Full log &rarr;</a>',
        '</div>',
      '</div>',
      '<div class="ql-section__body">',
        '<div class="blive-delivery-bar-wrap" aria-hidden="true">',
          '<div class="blive-delivery-bar">',
            '<div class="blive-delivery-bar__sent"    style="width:' + sentPct    + '%"></div>',
            '<div class="blive-delivery-bar__skipped" style="width:' + skippedPct + '%"></div>',
            '<div class="blive-delivery-bar__failed"  style="width:' + failedPct  + '%"></div>',
          '</div>',
        '</div>',
        '<div class="blive-notif-kpis" style="margin-bottom:12px">',
          '<div class="blive-notif-kpi blive-notif-kpi--sent"><span class="ql-nums" style="font-size:1.5rem;font-weight:700">' + sent + '</span><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em">Sent</span></div>',
          '<div class="blive-notif-kpi blive-notif-kpi--skipped"><span class="ql-nums" style="font-size:1.5rem;font-weight:700">' + skipped + '</span><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em">Skipped</span></div>',
          '<div class="blive-notif-kpi blive-notif-kpi--failed"><span class="ql-nums" style="font-size:1.5rem;font-weight:700">' + failed + '</span><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em">Failed</span></div>',
          '<div class="blive-notif-kpi" style="border-color:var(--color-border)"><span class="ql-nums" style="font-size:1.5rem;font-weight:700;color:var(--color-text-soft)">' + total + '</span><span style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--color-muted)">Total</span></div>',
        '</div>',
        '<div style="overflow-x:auto">',
          '<table class="ql-table"><thead><tr><th>Token</th><th>Channel</th><th>Threshold</th><th>Status</th><th>Time</th></tr></thead>',
          '<tbody>' + logRows + '</tbody></table>',
        '</div>',
      '</div>',
    '</section>',
  ].join("");
}

function renderTransparency() {
  return [
    '<aside class="blive-transparency" id="blive-transparency" role="complementary" aria-label="Transparency notice">',
      '<div class="blive-transparency__header"><span>&#9432;&#65039; Transparency &amp; Demo Disclosure</span></div>',
      '<div class="blive-transparency__body"><div class="blive-transparency__grid">',

        '<div>',
          '<div class="blive-transparency__label">ETA Formula</div>',
          '<code class="blive-transparency__code">etaSeconds = &lceil;(tokensAhead &divide; activeCounters) &times; avgServiceSeconds&rceil;</code>',
          '<p class="blive-transparency__desc">Pure explainable queue math — no AI or ML models.</p>',
        '</div>',

        '<div>',
          '<div class="blive-transparency__label">Demo Thresholds</div>',
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">',
            '<span class="badge badge-called">Reminder A &mdash; 60 s</span>',
            '<span class="badge badge-called">Reminder B &mdash; 30 s</span>',
          '</div>',
          '<p class="blive-transparency__desc">Production: 10 min / 5 min. Reminders are idempotent — never sent twice per token per threshold.</p>',
        '</div>',

        '<div>',
          '<div class="blive-transparency__label">Notification Truthfulness</div>',
          '<p class="blive-transparency__desc">',
            '<strong>SENT</strong> = provider confirmed delivery. ',
            '<strong>FAILED</strong> = provider returned error (logged verbatim). ',
            '<strong>SKIPPED</strong> = no consent or channels disabled — no API call made.',
          '</p>',
        '</div>',

      '</div></div>',
    '</aside>',
  ].join("");
}

function pageDirectionBLive(el) {
  el.innerHTML = [
    '<div class="ql-pagehead">',
      '<span class="ql-pagehead__eyebrow">&#127963; Central Government Services Office</span>',
      '<h1 class="ql-pagehead__title">Live Queue Board</h1>',
      '<p class="ql-pagehead__subtitle">Real-time token status &bull; Virtual queue &bull; Proactive reminders</p>',
    '</div>',
    '<div class="blive-layout">',
      renderLiveOpsBanner(),
      renderCountersRow(),
      renderInlineTokenForm(),
      renderServiceTable(),
      renderNotifSummary(),
      renderTransparency(),
    '</div>',
  ].join("");

  /* Inline form wiring */
  var form   = el.querySelector("#blive-token-form");
  var result = el.querySelector("#bl-result");
  var submit = el.querySelector("#bl-submit");
  if (!form) return;

  form.addEventListener("submit", function(ev) {
    ev.preventDefault();
    result.innerHTML = "";
    var opts = {
      serviceId:     el.querySelector("#bl-svc").value,
      phone:         el.querySelector("#bl-phone").value,
      notifyWhatsApp:el.querySelector("#bl-wa").checked,
      notifySms:     el.querySelector("#bl-sms").checked,
      consentGiven:  el.querySelector("#bl-consent").checked,
    };
    var tok;
    try { tok = Engine.takeToken(opts); }
    catch(err) {
      result.innerHTML = '<div class="alert alert-error">' + esc(err.message) + '</div>';
      return;
    }
    sessionStorage.setItem("ql_last_id", tok.id);
    submit.disabled = true;
    submit.innerHTML = (window.QL ? window.QL.spinner() : "") + " Issuing&hellip;";
    setTimeout(function() {
      submit.disabled = false;
      submit.innerHTML = "Get Token";
      result.innerHTML = [
        '<div class="blive-token-issued" role="status" aria-live="polite">',
          '<div class="blive-token-issued__label">Your Token</div>',
          '<div class="blive-token-issued__number ql-nums">' + esc(tok.tokenNumber) + '</div>',
          '<div class="blive-token-issued__meta">',
            badge("ISSUED"),
            ' &bull; <strong class="ql-nums">' + tok.tokensAhead + '</strong> ahead',
            ' &bull; ETA <strong class="ql-nums">' + fmtEta(tok.etaSeconds) + '</strong>',
          '</div>',
        '</div>',
      ].join("");
      form.reset();
    }, 500);
  });
}

/* ================================================================
   404
================================================================ */
function page404(el) {
  el.innerHTML = [
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:40vh;text-align:center;gap:20px">',
      '<div style="font-size:4rem;line-height:1">&#128369;</div>',
      '<div>',
        '<h1 style="font-size:1.5rem;font-weight:800;margin:0 0 8px">Page Not Found</h1>',
        '<p style="color:var(--color-text-soft);font-size:0.9rem;margin:0">',
          'Route <code style="background:rgba(255,255,255,0.07);padding:2px 6px;border-radius:4px">' + esc(getRoute()) + '</code> does not exist.',
        '</p>',
      '</div>',
      '<a href="#/" class="btn btn-primary">&larr; Back to Home</a>',
    '</div>',
  ].join("");
}
