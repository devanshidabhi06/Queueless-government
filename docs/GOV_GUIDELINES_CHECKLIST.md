# GIGW 3.0 Compliance Checklist

This checklist adapts the GIGW 3.0 requirements for the TurnWise hackathon prototype, noting specific adaptations to respect the non-impersonation rule.

## 1. Trust & Governance
- [ ] **GIGW 5.1.1 (Emblem/Logo)**: *Adaptation:* Do not use the State Emblem. Use a distinct "TurnWise" logo alongside the "Hackathon Prototype" disclaimer.
- [ ] **GIGW 5.1.2 (Ownership Info)**: *Adaptation:* Explicitly state ownership ("TurnWise Team") in the footer of all pages.
- [ ] **GIGW 5.1.5 (Last Updated Date)**: *Adaptation:* Display "Last updated: [Date]" prominently in the footer or disclaimer bar.
- [ ] **GIGW 5.1.12 (National Portal Link)**: *Adaptation:* Include a link to `india.gov.in` in the footer's "Useful Links" section, ensuring it opens in a new tab.

## 2. Accessibility
- [ ] **GIGW 5.2.1 (Non-text Alternatives)**: *Adaptation:* Ensure all images and icons (if any) have appropriate `alt` attributes or `aria-labels`.
- [ ] **GIGW 5.2.12 (Color Not Sole Indicator)**: *Adaptation:* Ensure token statuses (ISSUED, CALLED, NO_SHOW) use explicit text/badges, not just background colors.
- [ ] **GIGW 5.2.14 (Contrast Ratio)**: *Adaptation:* Audit UI to ensure all text meets the 4.5:1 WCAG AA contrast ratio.
- [ ] **GIGW 5.2.15 (Text Resizing)**: *Adaptation:* Ensure layout does not break when browser text size is increased to 200%.
- [ ] **GIGW 5.2.33 (Focus Visible)**: *Adaptation:* Enforce the strict 3px solid focus ring on all interactive elements.
- [ ] **GIGW 5.2.44 (Input Errors)**: *Adaptation:* Display explicit error messages above or next to form fields (e.g., missing phone number).
- [ ] **GIGW 5.2.45 (Labels)**: *Adaptation:* Ensure all `<input>` and `<select>` elements have associated `<label>` elements.

## 3. Content
- [ ] **GIGW 5.1.10 (Contact Us)**: *Adaptation:* Provide a basic "Contact" page or modal with dummy hackathon team details.
- [ ] **GIGW 5.1.14 (Help Section)**: *Adaptation:* Provide a simple FAQ or Help page explaining how the ETA and virtual token system works.
- [ ] **GIGW 5.1.25 (Spelling/Grammar)**: *Adaptation:* Ensure all copy is professional and error-free.

## 4. Operations
- [ ] **GIGW 5.1.13 (Browser Testing)**: *Adaptation:* Ensure the UI functions correctly across Chrome, Firefox, and Safari.
- [ ] **GIGW 5.4.10 (Bilingual)**: *Adaptation:* Acknowledge in documentation; out of scope for the MVP demo unless a simple toggle is added for UI elements.
