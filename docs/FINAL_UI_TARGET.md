# Final UI Target Spec

## Section 1 — Adopt as specified
List each element with: name, where it appears, structural description, acceptance criteria.

- **Top utility strip**: Appears at absolute top of the page. Contains A-/A/A+ text sizing controls, a "Skip to main content" link, and a "Screen Reader Access" link. Acceptance criteria: Focusable links, toggles HTML classes appropriately.
- **Language placeholder**: Appears in header/utility strip. Structural description: A static toggle or dropdown. Acceptance criteria: Visually present, non-functional (or demo-only).
- **Two-level header**: Below utility strip. Structural description: Brand wordmark on the left, authentication/action links on the right. Acceptance criteria: Clear hierarchy and separation from utility strip.
- **Mega-menu nav groups**: Header navigation. Structural description: Links for About, Services, Status/Dashboard, Help/Contact. Acceptance criteria: Horizontal flow, responsive layout.
- **Flat quick-links grid**: Homepage. Structural description: Grid layout with line icons for each quick link. Acceptance criteria: Icons are crisp, touch targets are generous.
- **Statistics matrix**: Homepage. Structural description: Grid or flex row displaying large bold numbers. Acceptance criteria: High contrast, semantic HTML.
- **Notices/news grid**: Homepage. Structural description: List of items containing a date badge and a "Know More" link. Acceptance criteria: Clear date demarcation and active link states.
- **Service directory rows**: Homepage/Services. Structural description: Horizontal rows with line icons, separated by horizontal rules. Acceptance criteria: 1px solid borders, consistent vertical rhythm.
- **Two-tier footer**: Bottom of page. Structural description: Tier 1 contains column headers (Terms and Policies / About / Resources / Need Help). Tier 2 contains ownership notice and last-updated timestamp. Acceptance criteria: Semantic lists, clearly distinct sections.
- **Tabbed static view switcher**: Admin or Status pages. Structural description: Tab interface for toggling views. Acceptance criteria: Fully static HTML switching without JS animation libraries.
- **Form fields**: /take-token and other forms. Structural description: Bold labels above fields, 2px solid field borders, hint text below input, input pattern enforcement (10-digit mobile). Acceptance criteria: Labels tied via `for=`, accessible hints, 2px borders visible in all contrast modes.
- **Status tracker**: /token-status. Structural description: Large circular timeline nodes with thick connectors. Acceptance criteria: Clear visual step progression.
- **Queue ledger**: Admin panel. Structural description: Native semantic `<table>`. Acceptance criteria: Uses `<thead>`, `<tbody>`, `<th>`, `<td>`.
- **Icons**: Site-wide. Structural description: Inline SVG or text icons only. Acceptance criteria: No heavy font-icon libraries or JS icon scripts.
- **Animations**: Site-wide. Structural description: Static transitions. Acceptance criteria: No JS animation libraries.

## Section 2 — Adopt structure, replace content (ANTI-IMPERSONATION SUBSTITUTIONS)
For each, reference pattern -> TurnWise substitution:

- **National Emblem + भारत सरकार/Government of India + ministry name**
  -> Bilingual TurnWise wordmark (टर्नवाइज़ | TurnWise) + "Hackathon Prototype" tag + team line. TEXT ONLY. No emblem, no seal, no crest, no national symbol.
- **Government toll-free helpline numbers**
  -> Clearly-labelled demo support line, explicitly marked not a real helpline.
- **Red national helpline alert banner**
  -> Same slot carries TurnWise operational notices (documents required, demo reminder windows, remote check-in rule).
- **Certification badge block (india.gov.in, MeitY, Digital India, myGov, NIC)**
  -> Same visual treatment (uniform white rectangular blocks) containing ONLY honest content: "Hackathon 2026", "PS-2", "Open Source", "WCAG 2.1 AA target", "Built with UX4G".
- **Visitor counter with large fabricated number**
  -> Truthful demo metric, e.g. "Tokens issued this session: N" or "Demo counter (simulated)". Never display a fabricated traffic figure.
- **Patriotic/national hero graphics**
  -> Flat full-width hero band: purpose sentence + 2-3 primary actions + live stat row. No tricolour, no national motifs, no patriotic imagery.

## Section 3 — PROHIBITED (hard stop, never implement)
- National/State Emblem in any form, size, or colour
- "भारत सरकार" / "Government of India" as an ownership claim
- Any real ministry or department name presented as site owner
- Any real government helpline number
- Any real government initiative logo, including recreations or "inspired-by" variants
- Tricolour watermark or saffron/white/green treatment used as identity

**Review test:** "If a screenshot leaked without context, could a reasonable person mistake this for a real government site?" If yes -> prohibited.

## Section 4 — Resolved conflicts
- **Marquee ticker vs tw-reduce-motion:** Implement as static notice bar, one notice at a time, with explicit pause/play control, fully static when tw-reduce-motion is active. No continuous CSS marquee.
- **Raw hex (#047857 / #475569 / #dc2626) vs UX4G "no raw hex" rule (Design.md §13):** Map to semantic status tokens; reference tokens, never literals, in markup.
- **"No heavy framework dependencies" vs current Tailwind CDN + large UX4G CSS:** Record as known debt with target state (remove Tailwind after migration; self-host trimmed UX4G with separate woff2 fonts). Schedule as Phase 0.50+, NOT before the demo.

## Section 5 — Build order
0.30b  finish /take-token controls            [NEXT]
0.30c  2px borders + hint text + input patterns
0.40   two-level header (utility strip + main nav)
0.45   notice bar (static, pausable, reduce-motion safe)
0.50   homepage (hero band, quick links, stats, notices, service directory)
0.55   footer tier 2 (badge block + metadata bar)
0.60   status tracker (large circular timeline nodes)
0.65   admin native semantic <table> ledger
0.70   cross-tab sync + persistence (FUNCTIONAL - may be pulled earlier if time is short)

## Section 6 — Standing constraints
- Disclaimer on every screen: "Hackathon Prototype — Not an official Government website."
- Accessibility toolbar locked: tw_textSize, tw_contrast, tw_reduceMotion; html classes tw-large-text, tw-high-contrast, tw-reduce-motion.
- High contrast: bg #000, text #fff, links #ff0, borders #fff, focus ring #ff0 3px solid.
- Button radius 4px, font-weight 600, focus outline 3px, never suppressed.
- Reminder disclosure verbatim: "Demo mode: reminder triggers use 60 s / 30 s for judging; production would use 10 min / 5 min."
- Consent disclosure verbatim: "By providing your mobile number, you consent to receive queue reminders via WhatsApp or SMS. Message frequency depends on queue activity. Reply STOP to unsubscribe at any time. Standard message rates may apply."
- engine.js is off-limits during UI slices.
