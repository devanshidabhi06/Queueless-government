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
    { id: "col", name: "Collectorate, Rajkot" },
    { id: "rto", name: "RTO Office, Rajkot" },
    { id: "pas", name: "Passport Seva Kendra, Rajkot" },
    { id: "rmc", name: "RMC Civic Centre, Rajkot" },
    { id: "del-psk", name: "Central Passport Seva Kendra, New Delhi" },
    { id: "del-col", name: "District Magistrate Office, New Delhi" },
    { id: "del-rto", name: "Sarai Kale Khan RTO, New Delhi" },
    { id: "mum-psk", name: "Passport Seva Kendra BKC, Mumbai" },
    { id: "mum-col", name: "Mumbai Suburban Collectorate, Bandra" },
    { id: "mum-rto", name: "Andheri / Tardeo RTO, Mumbai" },
    { id: "blr-psk", name: "Passport Seva Kendra Koramangala, Bengaluru" },
    { id: "blr-col", name: "Bengaluru Urban DC Office, Bengaluru" },
    { id: "blr-rto", name: "Indiranagar RTO, Bengaluru" },
    { id: "chn-psk", name: "Passport Seva Kendra Saligramam, Chennai" },
    { id: "chn-col", name: "District Collectorate, Chennai" },
    { id: "hyd-psk", name: "Passport Seva Kendra Begumpet, Hyderabad" },
    { id: "hyd-col", name: "District Collectorate, Abids, Hyderabad" },
    { id: "kol-psk", name: "Passport Seva Kendra Salt Lake, Kolkata" },
    { id: "kol-col", name: "District Collectorate BBD Bagh, Kolkata" },
    { id: "ahm-col", name: "Collectorate Office, Ahmedabad" },
    { id: "ahm-rto", name: "Subhash Bridge RTO, Ahmedabad" },
    { id: "pun-psk", name: "Passport Seva Kendra Mundhwa, Pune" },
    { id: "jai-psk", name: "Passport Seva Kendra Lal Kothi, Jaipur" },
    { id: "lko-psk", name: "Passport Seva Kendra Gomti Nagar, Lucknow" },
    { id: "chd-col", name: "District Administrative Complex, Chandigarh" },
    { id: "bho-col", name: "District Collectorate, Bhopal" },
    { id: "pat-col", name: "District Collectorate, Patna" },
    { id: "guw-col", name: "Kamrup District Collectorate, Guwahati" }
  ];

  var SEED_SERVICES = [
    { id: "col-1", officeId: "col", category: "Revenue & Certification", name: "Income / Caste Certificate", avgServiceSeconds: 12 * 60, activeCounters: 2, requirements: ["Aadhaar Card & Ration Card", "Salary slip / Form 16 / Talati Panchnama", "Income Affidavit on Stamp Paper", "Father's School Leaving Certificate (for Caste)"] },
    { id: "col-2", officeId: "col", category: "Revenue & Certification", name: "Land Record (7/12)", avgServiceSeconds: 8 * 60, activeCounters: 1, requirements: ["District, Taluka & Village Name", "Survey Number / Gut Number", "Khata Account Number", "Applicant Identity Proof (Aadhaar)"] },
    { id: "col-3", officeId: "col", category: "General Admin", name: "Licence / Permit", avgServiceSeconds: 20 * 60, activeCounters: 1, requirements: ["Identity & Residence Proof", "Business / Establishment Details", "Prescribed Application Form", "NOC & Fee Receipt"] },
    { id: "rto-1", officeId: "rto", category: "Licensing", name: "Learner Licence", avgServiceSeconds: 7 * 60, activeCounters: 1, requirements: ["Age Proof (10th Marks/Birth Cert/Passport)", "Address Proof (Aadhaar/Voter ID)", "Form 2 Application", "Form 1 Medical Self-Declaration", "3 Passport Photos"] },
    { id: "rto-2", officeId: "rto", category: "Licensing", name: "Driving Test", avgServiceSeconds: 15 * 60, activeCounters: 1, requirements: ["Valid Learner's Licence (>30 days old)", "Form 4 Application", "Test Vehicle with RC, Insurance & PUC", "Test Slot Booking Confirmation"] },
    { id: "rto-3", officeId: "rto", category: "Registration", name: "Vehicle Registration", avgServiceSeconds: 18 * 60, activeCounters: 1, requirements: ["Form 20 Application", "Form 21 Sale Certificate from Dealer", "Form 22 Roadworthiness Certificate", "Valid Motor Insurance & PUC", "Address Proof & PAN/Form 60"] },
    { id: "pas-1", officeId: "pas", category: "Applications", name: "Fresh Passport", avgServiceSeconds: 15 * 60, activeCounters: 2, requirements: ["Date of Birth Proof (Birth Cert / 10th SLC)", "Address Proof (Aadhaar / Passbook / Utility Bill)", "Non-ECR Proof (10th/Higher Degree)", "ARN Appointment Receipt"] },
    { id: "pas-2", officeId: "pas", category: "Applications", name: "Passport Renewal", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: ["Old Original Passport", "Self-attested copies of first & last 2 pages", "Address Proof (if address changed)", "ARN Appointment Receipt"] },
    { id: "pas-3", officeId: "pas", category: "Clearances", name: "Police Clearance", avgServiceSeconds: 12 * 60, activeCounters: 1, requirements: ["Original Passport with self-attested copies", "Proof of current residential address", "Employment contract / Visa requirement proof", "ARN Appointment Receipt"] },
    { id: "rmc-1", officeId: "rmc", category: "Civil Records", name: "Birth / Death Certificate", avgServiceSeconds: 6 * 60, activeCounters: 1, requirements: ["Hospital Discharge Slip / Form 1 (Birth)", "Form 4 Medical Cause of Death & Crematorium Receipt (Death)", "Parents / Informant Aadhaar Cards", "Proof of Residence"] },
    { id: "rmc-2", officeId: "rmc", category: "Taxation", name: "Property Tax", avgServiceSeconds: 9 * 60, activeCounters: 1, requirements: ["Tenement Number / Previous Tax Bill", "Registered Sale Deed / Index-II (if transfer)", "BU Permission / Electricity Bill", "Owner's Aadhaar Card"] },
    { id: "rmc-3", officeId: "rmc", category: "Licensing", name: "Trade Licence", avgServiceSeconds: 14 * 60, activeCounters: 1, requirements: ["Premises Property Tax Paid Receipt", "Rent Agreement + NOC or Ownership Deed", "GST Certificate / Udyam MSME Registration", "Signboard Photos & Fire NOC (if food/industry)"] },
    { id: "del-psk-1", officeId: "del-psk", name: "Tatkaal / Normal Passport", avgServiceSeconds: 12 * 60, activeCounters: 3, requirements: [] },
    { id: "del-psk-2", officeId: "del-psk", name: "Passport Renewal & PCC", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: [] },
    { id: "del-col-1", officeId: "del-col", name: "Revenue & Domicile Certificate", avgServiceSeconds: 14 * 60, activeCounters: 2, requirements: [] },
    { id: "del-rto-1", officeId: "del-rto", name: "Driving Licence & Registration", avgServiceSeconds: 11 * 60, activeCounters: 3, requirements: [] },
    { id: "mum-psk-1", officeId: "mum-psk", name: "Fresh / Re-issue Passport", avgServiceSeconds: 13 * 60, activeCounters: 3, requirements: [] },
    { id: "mum-col-1", officeId: "mum-col", name: "Caste / Income / Domicile", avgServiceSeconds: 15 * 60, activeCounters: 2, requirements: [] },
    { id: "mum-rto-1", officeId: "mum-rto", name: "Learner & Permanent Licence", avgServiceSeconds: 9 * 60, activeCounters: 2, requirements: [] },
    { id: "blr-psk-1", officeId: "blr-psk", name: "Fresh Passport & Renewal", avgServiceSeconds: 12 * 60, activeCounters: 3, requirements: [] },
    { id: "blr-col-1", officeId: "blr-col", name: "RTC / Bhoomi Land Records", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: [] },
    { id: "blr-rto-1", officeId: "blr-rto", name: "Vehicle RC & Driving Licence", avgServiceSeconds: 11 * 60, activeCounters: 2, requirements: [] },
    { id: "chn-psk-1", officeId: "chn-psk", name: "Fresh / Tatkaal Passport", avgServiceSeconds: 14 * 60, activeCounters: 3, requirements: [] },
    { id: "chn-col-1", officeId: "chn-col", name: "Community / Nativity Certificate", avgServiceSeconds: 12 * 60, activeCounters: 2, requirements: [] },
    { id: "hyd-psk-1", officeId: "hyd-psk", name: "Fresh / Re-issue Passport", avgServiceSeconds: 11 * 60, activeCounters: 3, requirements: [] },
    { id: "hyd-col-1", officeId: "hyd-col", name: "MeeSeva Revenue Services", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: [] },
    { id: "kol-psk-1", officeId: "kol-psk", name: "Passport Verification & Issue", avgServiceSeconds: 13 * 60, activeCounters: 2, requirements: [] },
    { id: "kol-col-1", officeId: "kol-col", name: "Residential & Domicile Certificate", avgServiceSeconds: 15 * 60, activeCounters: 2, requirements: [] },
    { id: "ahm-col-1", officeId: "ahm-col", name: "Jan Seva Kendra Certificates", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: [] },
    { id: "ahm-rto-1", officeId: "ahm-rto", name: "RTO Driving Licencing & Test", avgServiceSeconds: 12 * 60, activeCounters: 2, requirements: [] },
    { id: "pun-psk-1", officeId: "pun-psk", name: "Fresh & Tatkaal Passport", avgServiceSeconds: 12 * 60, activeCounters: 2, requirements: [] },
    { id: "jai-psk-1", officeId: "jai-psk", name: "Fresh / Tatkaal Passport", avgServiceSeconds: 11 * 60, activeCounters: 2, requirements: [] },
    { id: "lko-psk-1", officeId: "lko-psk", name: "Fresh Passport & PCC", avgServiceSeconds: 14 * 60, activeCounters: 2, requirements: [] },
    { id: "chd-col-1", officeId: "chd-col", name: "Citizen Facilitation Services", avgServiceSeconds: 10 * 60, activeCounters: 2, requirements: [] },
    { id: "bho-col-1", officeId: "bho-col", name: "Lok Seva Kendra Services", avgServiceSeconds: 12 * 60, activeCounters: 2, requirements: [] },
    { id: "pat-col-1", officeId: "pat-col", name: "RTPS Income & Caste Certificate", avgServiceSeconds: 15 * 60, activeCounters: 2, requirements: [] },
    { id: "guw-col-1", officeId: "guw-col", name: "PFC Public Facilitation Services", avgServiceSeconds: 13 * 60, activeCounters: 2, requirements: [] }
  ];

  /* Seed citizen specs — staggered createdAt produces realistic ETAs */
  var SEED_SPECS = [
    { serviceId: "col-1", name: "Arjun Kumar", phone: "+91-9876543001", wa: true, sms: false, consent: true },
    { serviceId: "col-1", name: "Priya Sharma", phone: "+91-9876543002", wa: true, sms: true, consent: true },
    { serviceId: "col-2", name: "Ravi Patel", phone: "+91-9876543003", wa: false, sms: true, consent: true },
    { serviceId: "col-3", name: "Meena Nair", phone: "+91-9876543005", wa: true, sms: false, consent: true },
    { serviceId: "rto-1", name: "Sunita Devi", phone: "+91-9876543006", wa: true, sms: false, consent: true },
    { serviceId: "rto-2", name: "Mohammed Rizvi", phone: "+91-9876543007", wa: false, sms: false, consent: false },
    { serviceId: "del-psk-1", name: "Vikram Malhotra", phone: "+91-9811223344", wa: true, sms: true, consent: true },
    { serviceId: "del-psk-1", name: "Ananya Roy", phone: "+91-9811223345", wa: true, sms: false, consent: true },
    { serviceId: "mum-psk-1", name: "Aditya Desai", phone: "+91-9820112233", wa: true, sms: true, consent: true },
    { serviceId: "mum-rto-1", name: "Pooja Bhosle", phone: "+91-9820112234", wa: false, sms: true, consent: true },
    { serviceId: "blr-psk-1", name: "Karthik Swamy", phone: "+91-9845112233", wa: true, sms: true, consent: true },
    { serviceId: "blr-col-1", name: "Deepa Hegde", phone: "+91-9845112234", wa: true, sms: false, consent: true },
    { serviceId: "kol-psk-1", name: "Sourav Ganguly", phone: "+91-9830112233", wa: true, sms: true, consent: true },
    { serviceId: "chn-psk-1", name: "Suresh Natarajan", phone: "+91-9840112233", wa: true, sms: false, consent: true },
    { serviceId: "hyd-psk-1", name: "Fatima Begum", phone: "+91-9848112233", wa: true, sms: true, consent: true },
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

  function loadState() {
    try {
      var saved = localStorage.getItem('ql_engine_state');
      if (saved) {
        var parsed = JSON.parse(saved);
        // Revive dates
        if (parsed.tokens) {
          parsed.tokens.forEach(function(t) {
            if (t.createdAt) t.createdAt = new Date(t.createdAt);
            if (t.checkedInAt) t.checkedInAt = new Date(t.checkedInAt);
            if (t.calledAt) t.calledAt = new Date(t.calledAt);
            if (t.servedAt) t.servedAt = new Date(t.servedAt);
            if (t.reminder60SentAt) t.reminder60SentAt = new Date(t.reminder60SentAt);
            if (t.reminder30SentAt) t.reminder30SentAt = new Date(t.reminder30SentAt);
          });
        }
        if (parsed.auditLog) {
          parsed.auditLog.forEach(function(a) { if (a.createdAt) a.createdAt = new Date(a.createdAt); });
        }
        if (parsed.notificationLog) {
          parsed.notificationLog.forEach(function(n) { if (n.createdAt) n.createdAt = new Date(n.createdAt); });
        }
        STATE = parsed;
        // Merge in any static metadata that might have been updated in code (like requirements)
        STATE.services.forEach(function(s) {
          var seed = SEED_SERVICES.find(function(x) { return x.id === s.id; });
          if (seed && seed.requirements) s.requirements = seed.requirements;
        });
      }
    } catch(e) { console.error('Failed to load state', e); }
  }

  function saveState() {
    try {
      localStorage.setItem('ql_engine_state', JSON.stringify(STATE));
    } catch(e) { console.error('Failed to save state', e); }
  }
  
  loadState();

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
    STATE.notificationLog = [
      {
        id: uid(),
        tokenId: "seed-1234",
        tokenNumber: "TW-0001",
        channel: "WhatsApp",
        thresholdSeconds: 60,
        status: "SENT",
        providerMessageId: "SM" + Math.random().toString(36).slice(2, 12).toUpperCase(),
        error: null,
        createdAt: new Date(now().getTime() - 1000 * 60 * 15)
      },
      {
        id: uid(),
        tokenId: "seed-1235",
        tokenNumber: "TW-0002",
        channel: "SMS",
        thresholdSeconds: 60,
        status: "FAILED",
        providerMessageId: null,
        error: "Twilio 400: Phone unreachable",
        createdAt: new Date(now().getTime() - 1000 * 60 * 8)
      },
      {
        id: uid(),
        tokenId: "seed-1236",
        tokenNumber: "TW-0003",
        channel: "WhatsApp",
        thresholdSeconds: 30,
        status: "SKIPPED",
        providerMessageId: null,
        error: "No consent given",
        createdAt: new Date(now().getTime() - 1000 * 60 * 2)
      }
    ];
    STATE.auditLog        = [];
    STATE._seq            = 0;

    var base = now().getTime();
    SEED_SPECS.forEach(function(spec, i) {
      STATE._seq++;
      var tok = {
        id:               uid(),
        officeId:         spec.serviceId.split("-")[0],
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
        noShowAt:         null,
        recallCount:      0,
      };
      STATE.tokens.push(tok);
      audit("TOKEN_ISSUED", tok.id, "system:seed");
    });

    // Call the first ISSUED token per service so demo shows work in progress
    ["col-1", "col-2", "col-3", "rto-1", "pas-1", "rmc-1"].forEach(function(svcId) {
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

  /** Enriched queue for a service (ISSUED + CALLED + recallable NO_SHOW) */
  Engine.getQueue = function (serviceId) {
    var active = activeQueue(serviceId).map(enrich);
    var recallable = STATE.tokens.filter(function(t) {
      return t.serviceId === serviceId && 
             t.status === "NO_SHOW" && 
             (t.recallCount || 0) < 1 && 
             t.noShowAt && (now().getTime() - t.noShowAt.getTime() <= 60000);
    }).map(enrich);
    return active.concat(recallable);
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
    var digits = opts.phone.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) digits = digits.substring(2);
    if (digits.length !== 10)                    throw new Error("Please enter a valid 10-digit phone number.");
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
      noShowAt:         null,
      recallCount:      0,
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
    var svc = STATE.services.find(function(s) { return s.id === serviceId; });
    var counters = 1;
    if (svc) {
      var c = (svc.counters != null) ? svc.counters : svc.activeCounters;
      c = Number(c);
      if (Number.isFinite(c) && c > 0) counters = Math.floor(c);
    }

    var q = activeQueue(serviceId);
    var calledCount = q.filter(function(t) { return t.status === "CALLED"; }).length;

    if (calledCount >= counters) {
      throw new Error("All counters are busy. Please mark a called token as Served/No-Show/Unable to process before calling next.");
    }

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
    t.noShowAt = now();
    audit("TOKEN_NO_SHOW", tokenId, "admin");
    return enrich(t);
  };

  /** Reject a token (admin-initiated) with reason */
  Engine.reject = function (tokenId, reason) {
    var t = STATE.tokens.find(function(t) { return t.id === tokenId; });
    if (!t) throw new Error("Token not found.");
    t.status = "REJECTED";
    t.rejectReason = reason || "Other";
    t.outcomeAt = now();
    audit("TOKEN_REJECTED", tokenId, "admin", { notes: "Reason: " + t.rejectReason });
    return enrich(t);
  };

  /** Recall a NO_SHOW token within the demo window */
  Engine.recall = function (tokenIdOrNumber) {
    var str = String(tokenIdOrNumber).trim();
    var t = STATE.tokens.find(function(t) { return t.id === str || t.tokenNumber === str; });
    if (!t) throw new Error("Token not found.");
    if (t.status !== "NO_SHOW") throw new Error("Token is not in NO_SHOW status.");
    if (t.recallCount >= 1) throw new Error("Token has already been recalled once.");
    if (!t.noShowAt || (now().getTime() - t.noShowAt.getTime() > 60000)) {
      throw new Error("Recall window (60s demo) has expired.");
    }

    var svc = STATE.services.find(function(s) { return s.id === t.serviceId; });
    var counters = 1;
    if (svc) {
      var c = (svc.counters != null) ? svc.counters : svc.activeCounters;
      c = Number(c);
      if (Number.isFinite(c) && c > 0) counters = Math.floor(c);
    }
    var q = activeQueue(t.serviceId);
    var calledCount = q.filter(function(tk) { return tk.status === "CALLED"; }).length;
    if (calledCount >= counters) {
      throw new Error("All counters are busy. Please mark a called token as Served/No-Show/Unable to process before recalling.");
    }

    t.status = "CALLED";
    t.calledAt = now();
    t.recallCount = (t.recallCount || 0) + 1;
    audit("TOKEN_RECALLED", t.id, "admin");
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
  /* ── Cross-tab Sync ──────────────────────────────────────────── */
  var STORAGE_KEY = 'ql_state_v3';
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); } catch(e) {}
  }

  function loadState() {
    try {
      var ls = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ql_state_v2') || localStorage.getItem('ql_engine_state');
      if (!ls) return false;
      var parsed = JSON.parse(ls);
      if (parsed && parsed.tokens) {
        // Ensure all pan-India offices and services are present if old cache exists
        if (!parsed.offices || parsed.offices.length < SEED_OFFICES.length) {
          parsed.offices = SEED_OFFICES.map(function(o) { return Object.assign({}, o, { createdAt: now() }); });
          parsed.services = SEED_SERVICES.map(function(s) { return Object.assign({}, s, { createdAt: now() }); });
        }
        parsed.tokens.forEach(function(t) {
          if (t.createdAt) t.createdAt = new Date(t.createdAt);
          if (t.calledAt) t.calledAt = new Date(t.calledAt);
          if (t.servedAt) t.servedAt = new Date(t.servedAt);
          if (t.noShowAt) t.noShowAt = new Date(t.noShowAt);
          if (t.reminder60SentAt) t.reminder60SentAt = new Date(t.reminder60SentAt);
          if (t.reminder30SentAt) t.reminder30SentAt = new Date(t.reminder30SentAt);
          if (t.checkedInAt) t.checkedInAt = new Date(t.checkedInAt);
        });
        if (parsed.auditLog) parsed.auditLog.forEach(function(l) { if (l.createdAt) l.createdAt = new Date(l.createdAt); });
        if (parsed.notificationLog) parsed.notificationLog.forEach(function(l) { if (l.createdAt) l.createdAt = new Date(l.createdAt); });
        STATE = parsed;
        // Merge in any static metadata that might have been updated in code (like requirements)
        if (STATE && STATE.services) {
          STATE.services.forEach(function(s) {
            var seed = SEED_SERVICES.find(function(x) { return x.id === s.id; });
            if (seed && seed.requirements) s.requirements = seed.requirements;
          });
        }
        return true;
      }
    } catch(e) {}
    return false;
  }

  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY || e.key === 'ql_state_v2' || e.key === 'ql_engine_state') {
      if (loadState() && typeof window.draw === 'function') window.draw();
    }
  });

  ['takeToken', 'callNext', 'serve', 'noShow', 'cancel', 'checkIn', 'reject', 'adjustCounters', 'runReminderCheck'].forEach(function(m) {
    var orig = Engine[m];
    Engine[m] = function() {
      var res = orig.apply(this, arguments);
      saveState();
      return res;
    };
  });

  var origSeed = Engine.seed;
  Engine.seed = function() {
    origSeed.apply(this, arguments);
    saveState();
  };

  /* ── Bootstrap ───────────────────────────────────────────────── */
  if (!loadState()) {
    Engine.seed();
  }

  window.Engine = Engine;

})();
