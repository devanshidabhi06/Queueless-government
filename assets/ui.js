/**
 * ui.js — QueueLess shared UI utilities
 * Last updated: Sep 30, 2026
 *
 * Provides: badge(), spinner(), alert banner helpers,
 * mobile nav toggle, active nav link highlighting,
 * Accessibility toolbar (Task 2) — localStorage keys:
 *   tw_textSize | tw_contrast | tw_reduceMotion
 * HTML classes applied: tw-large-text | tw-high-contrast | tw-reduce-motion
 */

"use strict";

// ── Badge factory ─────────────────────────────────────────────────
/**
 * Returns an HTML string for a status badge.
 * @param {string} status  e.g. "ISSUED", "SENT", "FAILED"
 */
function qlBadge(status = "") {
  const key = status.toLowerCase().replace(/_/g, "_");
  const icons = {
    issued:    "&#128203;",
    called:    "&#128226;",
    done:      "&#9989;",
    no_show:   "&#10060;",
    cancelled: "&#128683;",
    sent:      "&#9989;",
    failed:    "&#10060;",
    skipped:   "&#9898;",
    whatsapp:  "&#128241;",
    sms:       "&#128172;",
  };
  const icon = icons[key] || "";
  return `<span class="badge badge-${key}" title="${status}">${icon} ${status}</span>`;
}

// ── Spinner ───────────────────────────────────────────────────────
/**
 * Returns an HTML string for a loading spinner.
 * @param {string} [size="20px"]
 */
function qlSpinner(size = "20px") {
  return `<span class="spinner" style="width:${size};height:${size}" aria-label="Loading"></span>`;
}

// ── Alert banner ──────────────────────────────────────────────────
/**
 * Returns an HTML string for an alert banner.
 * @param {"error"|"success"|"info"|"warning"} type
 * @param {string} message
 */
function qlAlert(type, message) {
  const icons = { error: "&#10060;", success: "&#9989;", info: "&#8505;&#65039;", warning: "&#9888;&#65039;" };
  return `<div class="alert alert-${type}" role="alert">
    <span aria-hidden="true">${icons[type] || ""}</span>
    <span>${message}</span>
  </div>`;
}

// ── Stat tile ─────────────────────────────────────────────────────
/**
 * Returns an HTML string for a stat tile.
 * @param {string} label
 * @param {string|number} value
 * @param {string} [unit]
 * @param {string} [extra]  extra CSS classes on the outer div
 */
function qlStat(label, value, unit = "", extra = "") {
  return `<div class="stat-tile ${extra}">
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
    ${unit ? `<span class="stat-unit">${unit}</span>` : ""}
  </div>`;
}

// ── Mobile nav toggle ─────────────────────────────────────────────
(function initMobileNav() {
  document.addEventListener("DOMContentLoaded", () => {
    const btn    = document.getElementById("mobile-menu-btn");
    const drawer = document.getElementById("mobile-nav");
    if (!btn || !drawer) return;

    btn.addEventListener("click", () => {
      const open = !drawer.classList.contains("hidden");
      drawer.classList.toggle("hidden", open);
      btn.setAttribute("aria-expanded", String(!open));
    });

    // Close drawer on link click
    drawer.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => {
        drawer.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
      })
    );
  });
})();

// ── Active nav link ───────────────────────────────────────────────
/**
 * Highlights the nav link whose data-route matches the current hash route.
 * @param {string} route  e.g. "/take-token"
 */
function qlHighlightNav(route) {
  document.querySelectorAll("[data-route]").forEach(el => {
    const match = el.dataset.route === route ||
                  (route.startsWith(el.dataset.route) && el.dataset.route !== "/");
    el.classList.toggle("active", match);
  });
}

// ── Format seconds → human-readable ──────────────────────────────
/**
 * Formats a seconds value into a human-readable string.
 * @param {number} s
 * @returns {string}
 */
function qlFormatEta(s) {
  if (s == null) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

// ── Accessibility Toolbar (Task 2) ───────────────────────────────
/**
 * Preference registry maps:
 *   localStorage key  → html class         → button id
 *   tw_textSize       → tw-large-text       → a11y-text-size
 *   tw_contrast       → tw-high-contrast    → a11y-contrast
 *   tw_reduceMotion   → tw-reduce-motion    → a11y-motion
 */
const A11Y_PREFS = [
  { key: "tw_textSize",    cls: "tw-large-text",    btnId: "a11y-text-size" },
  { key: "tw_contrast",   cls: "tw-high-contrast",  btnId: "a11y-contrast"  },
  { key: "tw_reduceMotion", cls: "tw-reduce-motion", btnId: "a11y-motion"    },
];

/**
 * Reads a single preference from localStorage and applies/removes the
 * corresponding class on <html>. Returns the current boolean value.
 * @param {{ key: string, cls: string }} pref
 * @returns {boolean}
 */
function qlA11yApply(pref) {
  const active = localStorage.getItem(pref.key) === "1";
  document.documentElement.classList.toggle(pref.cls, active);
  return active;
}

/**
 * Syncs all button aria-pressed attributes to match current state.
 */
function qlA11ySyncButtons() {
  A11Y_PREFS.forEach(pref => {
    const btn = document.getElementById(pref.btnId);
    if (!btn) return;
    const active = document.documentElement.classList.contains(pref.cls);
    btn.setAttribute("aria-pressed", String(active));
  });
}

/**
 * Toggles a preference: flips localStorage value, re-applies class,
 * re-syncs all button states.
 * @param {{ key: string, cls: string }} pref
 */
function qlA11yToggle(pref) {
  const current = localStorage.getItem(pref.key) === "1";
  localStorage.setItem(pref.key, current ? "0" : "1");
  qlA11yApply(pref);
  qlA11ySyncButtons();
}

;(function initA11yToolbar() {
  // 1) Apply stored preferences immediately (before DOMContentLoaded
  //    to prevent flash — classes land on <html> as early as possible).
  A11Y_PREFS.forEach(qlA11yApply);

  // 2) Wire buttons once DOM is ready.
  document.addEventListener("DOMContentLoaded", () => {
    A11Y_PREFS.forEach(pref => {
      const btn = document.getElementById(pref.btnId);
      if (!btn) return;
      btn.addEventListener("click", () => qlA11yToggle(pref));
    });
    // Sync initial pressed states.
    qlA11ySyncButtons();
  });
})();

// ── Expose globals ────────────────────────────────────────────────
window.QL = {
  badge:        qlBadge,
  spinner:      qlSpinner,
  alert:        qlAlert,
  stat:         qlStat,
  highlightNav: qlHighlightNav,
  formatEta:    qlFormatEta,
  // Accessibility
  a11yApply:   qlA11yApply,
  a11yToggle:  qlA11yToggle,
  a11ySyncBtns: qlA11ySyncButtons,
};
