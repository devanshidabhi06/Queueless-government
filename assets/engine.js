/**
 * engine.js — QueueLess in-memory demo state engine
 * Created: Oct 01, 2026
 *
 * Exposes: window.Engine
 *   Engine.seed()           — deterministic seed / reset
 *   Engine.getOffices()
 *   Engine.getServices(officeId?)
 *   Engine.getQueue(serviceId)     — enriched (tokensAhead, etaSeconds)
 *   Engine.getAllQueues()
 *   Engine.getToken(tokenId)
 *   Engine.findByNumber(tokenNumber)
 *   Engine.takeToken(opts)         — generates TW-####
 *   Engine.callNext(serviceId)
 *   Engine.serve(tokenId)
 *   Engine.noShow(tokenId)
 *   Engine.cancel(tokenId)
 *   Engine.adjustCounters(serviceId, delta)
 *   Engine.runReminderCheck()      — demo thresholds 60s / 30s
 *   Engine.getNotificationLog()
 *   Engine.getAuditLog()
 *
 * ETA formula (AGENTS.md §6):
 *   etaSeconds = ceil( tokensAhead / activeCounters * avgServiceSeconds )
 *
 * Reminder rules (AGENTS.md §7, DEMO thresholds):
 *   60s: etaSeconds <= 60 AND reminder60SentAt is null
 *   30s: etaSeconds <= 30 AND reminder30SentAt is null
 *   Both require consentGiven = true + at least one channel, else SKIPPED.
 *   Provider failures never break core queue. Always writes a NotificationLog entry.
 */

"use strict";

(function () {

  /* ================================================================
     UTILITIES
  ================================================================ */
  var _uid = 0;
  function uid()  { return "ql-" + (++_uid).toString(36) + Math.random().toString(36).slice(2, 6); }
  function now()  { return new Date(); }
  function pad4(n){ return String(n).padStart(4, "0"); }

  function fmtTime(d) {
    if (!d) return "—";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  /* ================================================================
     SEED DATA
  ================================================================ */
  var SEED_OFFICES = [
    { id: "off-001", name: "Central Government Services Office" },
  ];

  var SEED_SERVICES = [
    { id: "svc-001", officeId: "off-001", name: "Driving Licence Renewal",  avgServiceSeconds: 20, activeCounters: 2, requirements: ["Valid old licence", "Address proof", "Medical certificate", "Passport size photo"] },
    { id: "svc-002", officeId: "off-001", name: "Ration Card Amendment",    avgServiceSeconds: 20, activeCounters: 1, requirements: ["Original ration card", "Address proof", "Aadhaar copy of family members", "Passport size photo"] },
    { id: "svc-003", officeId: "off-001", name: "Income Certificate",       avgServiceSeconds: 20, activeCounters: 1, requirements: ["Valid photo ID", "Address proof", "Income declaration", "Supporting income records"] },
  ];

  /* Seed citizen specs — staggered createdAt produces realistic ETAs */
  var SEED_SPECS = [
    { serviceId: "svc-001", name: "Arjun Kumar",    phone: "+91-9876543001", wa: true,  sms: false, consent: true  },
    { serviceId: "svc-001", name: "Priya Sharma",   phone: "+91-9876543002", wa: true,  sms: true,  consent: true  },
    { serviceId: "svc-001", name: "Ravi Patel",     phone: "+91-9876543003", wa: false, sms: true,  consent: true  },
    { serviceId: "svc-001", name: null,             phone: "+91-9876543004", wa: false, sms: false, consent: false },
    { serviceId: "svc-001", name: "Meena Nair",     phone: "+91-9876543005", wa: true,  sms: false, consent: true  },
    { serviceId: "svc-002", name: "Sunita Devi",    phone: "+91-9876543006", wa: true,  sms: false, consent: true  },
    { serviceId: "svc-002", name: "Mohammed Rizvi", phone: "+91-9876543007", wa: false, sms: false, consent: false },
    { serviceId: "svc-002", name: "Lakshmi R.",     phone: "+91-9876543008", wa: false, sms: true,  consent: true  },
    { serviceId: "svc-003", name: "Vijay Kumar",    phone: "+91-9876543009", wa: true,  sms: false, consent: true  },
    { serviceId: "svc-003", name: null,             phone: "+91-9876543010", wa: false, sms: false, consent: true  },
  ];

  /* ================================================================
     STATE
  ================================================================ */
  var STATE = {
    offices:         [],
    services:        [],
    tokens:          [],
    notificationLog: [],
    auditLog:        [],
    _seq:            0,       // global token sequence (TW-0001, TW-0002, …)
  };

  /* ================================================================
     INTERNAL HELPERS
  ================================================================ */
  /** Active (ISSUED, CALLED, RESERVED) tokens for a service, oldest-first */
  function activeQueue(serviceId) {
    return STATE.tokens
      .filter(function(t) {
        return t.serviceId === serviceId && (t.status === "ISSUED" || t.status === "CALLED" || t.status === "RESERVED");
      })
      .sort(function(a, b) { 
        var timeA = a.checkedInAt ? a.checkedInAt.getTime() : a.createdAt.getTime();
        var timeB = b.checkedInAt ? b.checkedInAt.getTime() : b.createdAt.getTime();
        return timeA - timeB; 
      });
  }

  /** How many active tokens joined before this one */
  function ahead(token) {
    return activeQueue(token.serviceId)
      .filter(function(t) { 
        if (t.status === "RESERVED") return false;
        var tTime = t.checkedInAt ? t.checkedInAt.getTime() : t.createdAt.getTime();
        var myTime = token.checkedInAt ? token.checkedInAt.getTime() : token.createdAt.getTime();
        return tTime < myTime; 
      })
      .length;
  }

  /** ETA in seconds for a token */
  function eta(token) {
    var svc = STATE.services.find(function(s) { return s.id === token.serviceId; });
    if (!svc || svc.activeCounters < 1) return 0;
    return Math.ceil((ahead(token) / svc.activeCounters) * svc.avgServiceSeconds);
  }

  /** Attach computed fields to a raw token object */
  function enrich(token) {
    var svc = STATE.services.find(function(s) { return s.id === token.serviceId; });
    var isActive = token.status === "ISSUED" || token.status === "CALLED";
    return Object.assign({}, token, {
      serviceName:  svc ? svc.name : "Unknown",
      tokensAhead:  isActive ? ahead(token) : null,
      etaSeconds:   isActive ? eta(token)   : null,
    });
  }

  /** Append to audit log */
  function audit(type, tokenId, actor, meta) {
    STATE.auditLog.unshift({
      id: uid(), tokenId: tokenId || null, type: type,
      actor: actor || "system", meta: meta || {},
      createdAt: now(),
    });
  }

  /**
   * Simulate a provider send — 85% SENT, 15% FAILED for demo realism.
   * Never throws; always returns a NotificationLog-shaped object.
   */
  function simSend(tok, channel, thresholdSeconds) {
    var ok = Math.random() > 0.15;
    return {
      id: uid(),
      tokenId:         tok.id,
      tokenNumber:     tok.tokenNumber,
      channel:         channel,
      thresholdSeconds:thresholdSeconds,
      status:          ok ? "SENT" : "FAILED",
      providerMessageId: ok ? ("SM" + Math.random().toString(36).slice(2, 12).toUpperCase()) : null,
      error:           ok ? null : "Twilio 400: Phone unreachable [demo simulation]",
      createdAt:       now(),
    };
  }

  function writeSkip(tok, channel, thresholdSeconds, reason) {
    return {
      id: uid(),
      tokenId:          tok.id,
      tokenNumber:      tok.tokenNumber,
      channel:          channel,
      thresholdSeconds: thresholdSeconds,
      status:           "SKIPPED",
      providerMessageId:null,
      error:            reason,
      createdAt:        now(),
    };
  }

  /* ================================================================
     ENGINE API
  ================================================================ */
  var Engine = {};

  /* ── Seed / Reset ────────────────────────────────────────────── */
  /**
   * Deterministic reset to a clean demo state.
   * Can be called at any time by admin to restart the demo.
   */
  Engine.seed = function () {
    STATE.offices         = SEED_OFFICES.map(function(o) { return Object.assign({}, o, { createdAt: now() }); });
    STATE.services        = SEED_SERVICES.map(function(s) { return Object.assign({}, s, { createdAt: now() }); });
    STATE.tokens          = [];
    STATE.notificationLog = [];
    STATE.auditLog        = [];
    STATE._seq            = 0;

    var base = now().getTime();
    SEED_SPECS.forEach(function(spec, i) {
      STATE._seq++;
      var tok = {
        id:               uid(),
        officeId:         "off-001",
        serviceId:        spec.serviceId,
        tokenNumber:      "TW-" + pad4(STATE._seq),
        name:             spec.name || null,
        phone:            spec.phone,
        status:           "ISSUED",
        joinMode:         "ON_SITE",
        checkedInAt:      new Date(base - (SEED_SPECS.length - i) * 3500),
        notifyWhatsApp:   !!spec.wa,
        notifySms:        !!spec.sms,
        consentGiven:     !!spec.consent,
        reminder60SentAt: null,
        reminder30SentAt: null,
        createdAt:        new Date(base - (SEED_SPECS.length - i) * 3500),
        calledAt:         null,
        servedAt:         null,
        outcomeReason:    null,
        outcomeAt:        null,
      };
      STATE.tokens.push(tok);
      audit("TOKEN_ISSUED", tok.id, "system:seed");
    });

    // Call the first ISSUED token per service so demo shows work in progress
    ["svc-001", "svc-002", "svc-003"].forEach(function(svcId) {
      var first = STATE.tokens.find(function(t) {
        return t.serviceId === svcId && t.status === "ISSUED";
      });
      if (first) {
        first.status   = "CALLED";
        first.calledAt = now();
        audit("TOKEN_CALLED", first.id, "system:seed");
      }
    });

    return STATE;
  };

  Engine.reset = Engine.seed;   // alias

  /* ── Reads ───────────────────────────────────────────────────── */
  Engine.getState    = function ()          { return STATE; };
  Engine.getOffices  = function ()          { return STATE.offices.slice(); };
  Engine.getServices = function (officeId)  {
    return STATE.services.filter(function(s) { return !officeId || s.officeId === officeId; });
  };

  /** Enriched queue for a service (ISSUED + CALLED, sorted oldest-first) */
  Engine.getQueue = function (serviceId) {
    return activeQueue(serviceId).map(enrich);
  };

  /** All queues grouped by service */
  Engine.getAllQueues = function () {
    return STATE.services.map(function(svc) {
      return { service: svc, queue: Engine.getQueue(svc.id) };
    });
  };

  /** Single enriched token by ID */
  Engine.getToken = function (tokenId) {
    var t = STATE.tokens.find(function(t) { return t.id === tokenId; });
    return t ? enrich(t) : null;
  };

  /** Find enriched token by tokenNumber string (e.g. "TW-0003") */
  Engine.findByNumber = function (tokenNumber) {
    var t = STATE.tokens.find(function(t) {
      return t.tokenNumber === String(tokenNumber).trim().toUpperCase();
    });
    return t ? enrich(t) : null;
  };

  /* ── Citizen mutations ───────────────────────────────────────── */
  /**
   * Issue a new token.
   * Throws with user-readable message on validation failure.
   * @param {{ serviceId, phone, name?, notifyWhatsApp?, notifySms?, consentGiven? }} opts
   */
  Engine.takeToken = function (opts) {
    var svc = STATE.services.find(function(s) { return s.id === opts.serviceId; });
    if (!svc)                                   throw new Error("Please select a service.");
    if (!opts.phone || !opts.phone.trim())       throw new Error("Phone number is required.");
    if ((opts.notifyWhatsApp || opts.notifySms) && !opts.consentGiven) {
      throw new Error("Please tick the consent box to enable reminders.");
    }

    var p = opts.phone.trim();
    var hasActive = STATE.tokens.some(function(t) {
      return t.phone === p && t.serviceId === opts.serviceId && (t.status === "ISSUED" || t.status === "CALLED" || t.status === "RESERVED");
    });
    if (hasActive) {
      var masked = p.length > 4 ? "****" + p.slice(-4) : "****";
      audit("TOKEN_BLOCKED_DUPLICATE", null, "SYSTEM", { notes: "Blocked duplicate token for phone " + masked + " (Service: " + opts.serviceId + ")" });
      throw new Error("You already have an active token for this service.");
    }

    var jMode = opts.joinMode === "REMOTE" ? "REMOTE" : "ON_SITE";
    var isRemote = jMode === "REMOTE";

    STATE._seq++;
    var tok = {
      id:               uid(),
      officeId:         svc.officeId,
      serviceId:        opts.serviceId,
      tokenNumber:      "TW-" + pad4(STATE._seq),
      name:             (opts.name || "").trim() || null,
      phone:            p,
      status:           isRemote ? "RESERVED" : "ISSUED",
      joinMode:         jMode,
      checkedInAt:      isRemote ? null : now(),
      notifyWhatsApp:   !!opts.notifyWhatsApp,
      notifySms:        !!opts.notifySms,
      consentGiven:     !!opts.consentGiven,
      reminder60SentAt: null,
      reminder30SentAt: null,
      createdAt:        now(),
      calledAt:         null,
      servedAt:         null,
      outcomeReason:    null,
      outcomeAt:        null,
    };
    STATE.tokens.push(tok);
    audit("TOKEN_ISSUED", tok.id, "citizen");
    return enrich(tok);
  };

  /** Cancel a token (citizen-initiated) */
  Engine.cancel = function (tokenId) {
    var t = STATE.tokens.find(function(t) { return t.id === tokenId; });
    if (!t) throw new Error("Token not found.");
    t.status = "CANCELLED";
    audit("TOKEN_CANCELLED", tokenId, "citizen");
    return enrich(t);
  };

  /** Check-in a RESERVED token (citizen-initiated) */
  Engine.checkIn = function (idOrNum) {
    var str = String(idOrNum).trim();
    var t = STATE.tokens.find(function(tok) { return tok.id === str || tok.tokenNumber === str.toUpperCase(); });
    if (!t) throw new Error("Token not found.");
    if (t.status !== "RESERVED") throw new Error("Token is already checked in or not reserved.");
    t.checkedInAt = now();
    t.status = "ISSUED";
    audit("TOKEN_CHECKED_IN", t.id, "citizen");
    return enrich(t);
  };

  /* ── Admin mutations ─────────────────────────────────────────── */
  /**
   * Call the next ISSUED and checked-in token in a service queue.
   * @returns enriched token, or null if queue is empty.
   */
  Engine.callNext = function (serviceId) {
    var q = activeQueue(serviceId);
    var issued = q.filter(function(t) { return t.status === "ISSUED" && t.checkedInAt; });
    if (!issued.length) {
      var reserved = q.filter(function(t) { return t.status === "RESERVED"; });
      if (reserved.length > 0) throw new Error("No checked-in tokens available. There are remote tokens waiting to check in.");
      return null;
    }
    var next     = issued[0];
    next.status  = "CALLED";
    next.calledAt = now();
    audit("TOKEN_CALLED", next.id, "admin");
    return enrich(next);
  };

  /** Mark a token as DONE (served) */
  Engine.serve = function (tokenId) {
    var t = STATE.tokens.find(function(t) { return t.id === tokenId; });
    if (!t) throw new Error("Token not found.");
    t.status   = "DONE";
    t.servedAt = now();
    audit("TOKEN_SERVED", tokenId, "admin");
    return enrich(t);
  };

  /** Mark a token as NO_SHOW */
  Engine.noShow = function (tokenId) {
    var t = STATE.tokens.find(function(t) { return t.id === tokenId; });
    if (!t) throw new Error("Token not found.");
    t.status = "NO_SHOW";
    audit("TOKEN_NO_SHOW", tokenId, "admin");
    return enrich(t);
  };

  /** Mark a token as UNABLE_TO_PROCESS (admin-initiated) */
  Engine.unableToProcess = function (tokenIdOrNumber, reason) {
    var str = String(tokenIdOrNumber).trim();
    var t = STATE.tokens.find(function(tok) { return tok.id === str || tok.tokenNumber === str.toUpperCase(); });
    if (!t) throw new Error("Token not found.");
    t.status = "UNABLE_TO_PROCESS";
    t.outcomeReason = reason || "Other";
    t.outcomeAt = now();
    var masked = t.phone.length > 4 ? "****" + t.phone.slice(-4) : "****";
    audit("TOKEN_UNABLE_TO_PROCESS", t.id, "admin", { notes: "Reason: " + t.outcomeReason + " (Phone: " + masked + ")" });
    return enrich(t);
  };

  /** Adjust active counter count for a service (+1 / -1, min 1) */
  Engine.adjustCounters = function (serviceId, delta) {
    var svc = STATE.services.find(function(s) { return s.id === serviceId; });
    if (!svc) return null;
    svc.activeCounters = Math.max(1, svc.activeCounters + delta);
    audit("COUNTERS_CHANGED", null, "admin", { serviceId: serviceId, newCount: svc.activeCounters });
    return svc.activeCounters;
  };

  /**
   * Deterministic reminder check (admin-triggered or on queue change).
   * DEMO thresholds: 60 s / 30 s.
   * Always writes a NotificationLog entry (SENT | FAILED | SKIPPED).
   * Provider failures never throw.
   * @returns {Array} log entries created this run
   */
  Engine.runReminderCheck = function () {
    var created = [];
    var active  = STATE.tokens.filter(function(t) {
      return (t.status === "ISSUED" || t.status === "CALLED") && t.checkedInAt;
    });

    active.forEach(function(tok) {
      var e = eta(tok);

      /* ── 60-second threshold ───────────────────────────────── */
      if (e <= 60 && tok.reminder60SentAt === null) {
        var hasChannels = tok.notifyWhatsApp || tok.notifySms;
        if (!tok.consentGiven || !hasChannels) {
          var skip60 = writeSkip(tok, hasChannels ? "WHATSAPP" : "WHATSAPP", 60, "No consent or no channels enabled");
          STATE.notificationLog.unshift(skip60);
          created.push(skip60);
        } else {
          if (tok.notifyWhatsApp) {
            var l1 = simSend(tok, "WHATSAPP", 60);
            STATE.notificationLog.unshift(l1);
            created.push(l1);
          }
          if (tok.notifySms) {
            var l2 = simSend(tok, "SMS", 60);
            STATE.notificationLog.unshift(l2);
            created.push(l2);
          }
        }
        tok.reminder60SentAt = now();
      }

      /* ── 30-second threshold ───────────────────────────────── */
      if (e <= 30 && tok.reminder30SentAt === null) {
        var hasChannels30 = tok.notifyWhatsApp || tok.notifySms;
        if (!tok.consentGiven || !hasChannels30) {
          var skip30 = writeSkip(tok, "WHATSAPP", 30, "No consent or no channels enabled");
          STATE.notificationLog.unshift(skip30);
          created.push(skip30);
        } else {
          if (tok.notifyWhatsApp) {
            var m1 = simSend(tok, "WHATSAPP", 30);
            STATE.notificationLog.unshift(m1);
            created.push(m1);
          }
          if (tok.notifySms) {
            var m2 = simSend(tok, "SMS", 30);
            STATE.notificationLog.unshift(m2);
            created.push(m2);
          }
        }
        tok.reminder30SentAt = now();
      }
    });

    audit("REMINDER_CHECK", null, "admin", { checked: active.length, logsCreated: created.length });
    return created;
  };

  /* ── Log reads ───────────────────────────────────────────────── */
  Engine.getNotificationLog = function () { return STATE.notificationLog.slice(); };
  Engine.getAuditLog        = function () { return STATE.auditLog.slice(); };

  /* ── Bootstrap ───────────────────────────────────────────────── */
  Engine.seed();

  window.Engine = Engine;

})();
