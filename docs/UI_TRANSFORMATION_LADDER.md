# TurnWise UI Transformation Ladder

This document outlines the step-by-step plan to migrate TurnWise to the UX4G Design System.

## Phase 0.10: Root Layout & Typography Foundation
- **Screens**: `index.html` (Global layout)
- **Changes**:
  - Integrate `ux4g-web-components` CSS.
  - Set global font to `Noto Sans`.
  - Solidify the "Hackathon Prototype" disclaimer and accessibility toolbar placement.
  - Add "Last Updated" and "Ownership" to the footer.
- **Acceptance Criteria**: 
  - The application loads with Noto Sans. 
  - The disclaimer and accessibility tools are visible and functional.
- **No-regression checks**: 
  - The router (`#/...`) still works.

## Phase 0.20: Token & Component Migration
- **Screens**: `/take-token`, `/admin/login`, `/admin/queue`
- **Changes**:
  - Replace custom/Tailwind buttons with UX4G buttons (`ux4g-btn ux4g-btn-primary`, etc.) enforcing 4px radius and 600 weight.
  - Replace form inputs with UX4G inputs (`ux4g-input`), ensuring explicit labels.
  - Apply UX4G semantic spacing tokens for margins and padding.
  - Enforce the 3px solid focus outline globally.
- **Acceptance Criteria**: 
  - Forms look native to the UX4G system.
  - Keyboard navigation shows the 3px focus ring.
- **No-regression checks**: 
  - Form submission (taking a token, admin login) still works.
  - Admin queue actions (Serve, No-Show, Recall) still trigger engine updates.

## Phase 0.30: Layout Structure & Trust Indicators
- **Screens**: Header, Footer, Navigation
- **Changes**:
  - Rebuild the header using UX4G navigation patterns (without official GOI logos).
  - Rebuild the footer into a multi-column layout containing "Contact Us", "Help", and a link to `india.gov.in`.
  - Refine the responsive grid using UX4G breakpoints to ensure no horizontal scrolling.
- **Acceptance Criteria**: 
  - Header and footer feel structured and authoritative. 
  - Navigation works seamlessly on mobile and desktop.
- **No-regression checks**: 
  - Mobile menu toggle functions correctly.

## Phase 0.40: Accessibility & Content Polish
- **Screens**: All screens (`/token-status`, `/b/live`)
- **Changes**:
  - Audit and fix all contrast ratios (4.5:1 minimum).
  - Ensure status badges (ISSUED, CALLED) do not rely solely on color.
  - Add ARIA live regions for ETA updates if applicable.
- **Acceptance Criteria**: 
  - No contrast or basic accessibility violations. 
  - Statuses are clear to color-blind users.
- **No-regression checks**: 
  - Live board and token status still update dynamically.
