# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React / Next.js + Tailwind CSS (using Tailwind CDN and UX4G CSS currently). Backend: Node (Express or Next API routes) with SQLite + Prisma.

## Users

- **Citizen:** Needs to select an office and service, request a virtual token, see live ETA/status, and receive WhatsApp/SMS reminders.
- **Admin/Counter:** Needs to view the live queue, call the next token, mark as served or no-show, view the notification log, and run reminder checks deterministically for demo purposes.

## Product Purpose

A virtual token and live ETA system (QueueLess/TurnWise) to reduce physical waiting and missed turns at government offices. Built specifically as a hackathon prototype (PS-2) to demonstrate deterministic queue math and reminder notifications.

## Positioning

An explainable queue math system—no AI prediction claims. Offers transparent, deterministic ETA calculations and deterministic demoable reminder thresholds (60s / 30s) rather than opaque black-box estimates.

## Operating Context

Hackathon demonstration environment. Will be shown to judges, necessitating immediate, deterministic triggers for features (like reminders) that usually take minutes. Explicitly marked as a prototype not integrated with real government systems (no Aadhaar/KYC, Twilio sandbox used for demo).

## Capabilities and Constraints

- **Capabilities:** Virtual tokens generation, live ETA tracker, Twilio WhatsApp/SMS reminders, admin queue management table.
- **Constraints:**
  - Must not impersonate a real government website (strictly enforced).
  - No real government system integrations or identity verification.
  - Strict UI structure: Static tab switches, no JS animation libraries, no heavy font-icon libraries.
  - Required disclaimers on every screen ("Hackathon Prototype — Not an official Government website.") and specific reminder/consent disclosures.
  - No national emblems, Ministry names, or patriotic imagery.

## Brand Commitments

- **Name:** TurnWise (QueueLess)
- **Identity:** Bilingual wordmark (टर्नवाइज़ | TurnWise) + "Hackathon Prototype" tag + team line.
- **Aesthetics:** White rectangular badge blocks for certifications ("Hackathon 2026", "PS-2", "Open Source", "WCAG 2.1 AA target", "Built with UX4G").
- **Colors:** Semantic status tokens used in markup, no raw hex values permitted.

## Evidence on Hand

- Truthful demo metrics (e.g., "Tokens issued this session: N"). No fabricated traffic figures.
- Operational notices instead of real national helplines.

## Product Principles

1. **Honesty over immersion:** The demo nature is explicit, explaining thresholds and simulated metrics transparently.
2. **Explainable operations:** ETAs and logic must be simple math, not opaque predictions.
3. **Accessibility as a foundation:** Enforces WCAG 2.1 AA targets, semantic markup, and functional accessibility tools (text size, contrast, reduce motion).
4. **Strict anti-impersonation:** Zero tolerance for mimicking real government authority.

## Accessibility & Inclusion

- Target: WCAG 2.1 AA.
- Requires an accessibility toolbar with functional HTML classes for text sizing (`tw-large-text`), high contrast (`tw-high-contrast`), and reduced motion (`tw-reduce-motion`).
- High contrast mode strictly defined: bg #000, text #fff, links #ff0, borders #fff, focus ring #ff0 3px solid.
