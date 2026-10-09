# TurnWise Pattern Library

The following patterns, adapted from established civic design systems (GOV.UK, USWDS, UX4G), should be implemented to elevate the portal's usability and trust.

## 1. Error Summary + Focus Management
**Pattern**: When a user submits a form and errors are detected, display an "Error Summary" box at the top of the page outlining all issues.
- Provide anchor links within the summary that jump focus directly to the erroneous input field.
- **Reference**: GOV.UK Error Summary component.

## 2. Trust Footer / Identifier-like Block
**Pattern**: A robust footer layout that signifies an official service without impersonating the government.
- **Layout**: Three-column grid (Useful Links, Policies, Support) above a solid dark band containing copyright, ownership, and last-updated text.
- **Content**: Include mandatory hackathon disclaimers, links to `india.gov.in`, and explicit ownership notices.
- **Reference**: USWDS Identifier component, UX4G Footer.

## 3. Status Tracker Layout
**Pattern**: A clear, linear progress/status tracker for the user's token.
- **Layout**: Display the primary token number in large, bold typography. Surround it with a timeline or discrete status badges (ISSUED -> RESERVED -> CALLED -> DONE).
- Include the ETA prominently, but label it "Estimated Wait" to set realistic expectations.
- **Reference**: GOV.UK Task List / Timeline patterns.

## 4. Admin Operate View Layout
**Pattern**: A dense, tabular data view tailored for rapid operations.
- **Layout**: Remove all "fluff." Use standard HTML tables with high-contrast borders and alternating row backgrounds.
- Provide explicit, non-destructive default actions (e.g., `Call Next`) and require confirmation for destructive or edge-case actions (`Unable to process`).
- Display clear KPI summary tiles (e.g., "Counters busy: 2/3") in a structured header.
- **Reference**: UXDT dashboard guidelines.

## 5. Public Display Layout
**Pattern**: A read-only, high-visibility dashboard for physical waiting areas.
- **Layout**: Maximize contrast. Use extremely large typography for the current "Now Calling" token.
- **Controls**: Include a subtle, accessible control to "Pause Updates" for accessibility compliance (GIGW 5.2.25) and display a "Last Refreshed" timestamp.

## 6. GIGW 3.0 Patterns (Scope, Objective & Checklists)
**Source**: guidelines.india.gov.in
1. **Prominent Ownership (GIGW 5.1.2)**: Display the complete ownership info (ministry/department) clearly on the header/footer of all pages.
2. **Standardized Page Titles (GIGW 5.2.28)**: Page titles must clearly describe the topic and purpose (e.g., "Take Token - QueueLess - Ministry of X").
3. **Accessibility Baseline (GIGW 5.2.14)**: Non-text contrast ratio must be 3:1, and text contrast must be 4.5:1.
4. **Error Handling (GIGW 5.2.44)**: Automatically detect input errors and describe them in clear text.
5. **No Broken Links (GIGW 5.4.7)**: Ensure no 'under construction' or 'Page not found' links in production.
6. **Last Updated Timestamp (GIGW 5.1.5)**: The exact date of the last content review or update must be visible on the homepage.
7. **Consistent Navigation (GIGW 5.2.42)**: Navigation items must occur in the exact same relative order across the entire site.

## 7. SugamyaWeb Patterns
**Source**: SugamyaWeb Accessibility Guidelines
1. **Visible Focus**: A persistent, 3px solid focus outline on all interactive elements (never suppressed).
2. **Text Resizing Persistence**: Ensure text can be resized up to 200% without layout breakage.
3. **Owner Responsibility Notice**: Clearly delineate the responsibility of the content owner versus the platform developer.
4. **Skip to Main Content**: Provide a visually hidden but focusable link to skip navigation headers.
5. **Accessibility Toolbar**: Persist user choices for high-contrast and text-size adjustments via `localStorage` or session cookies.
6. **ARIA Labels**: Use robust ARIA labels for icon-only buttons or dynamic regions.

## 8. Passport Seva Patterns
**Source**: passportindia.gov.in
1. **Task Segregation**: Clear visual separation of task-based paths ("New User Registration" vs "Existing User Login").
2. **Status Tracking**: Dedicated, top-level "Track Application Status" module requiring minimal input (e.g., Application Number + DOB).
3. **Help & Information Panel**: A persistent sidebar or quick-links section for FAQs, Document Advisors, and Appointment Availability.
4. **Strict Form Validations**: Red asterisk `*` for mandatory fields, with inline validation errors appearing immediately upon blur.
5. **Session Timeout Warnings**: Clear visual alerts when a session is about to expire due to inactivity.

## 9. Parivahan Patterns
**Source**: parivahan.gov.in
1. **Service Silos**: Explicit separation of unrelated service verticals (e.g., Vehicle Related Services vs. Driving License Related Services).
2. **State Selection Dropdowns**: Require users to select their state/RTO immediately to filter out irrelevant operational guidelines.
3. **Informational Banner**: Scrolling marquees or static alert banners at the top of the page for critical service interruptions.
4. **Step-by-Step Wizards**: Complex forms broken down into numbered, multi-step wizards with progress indicators.
5. **Captchas on Public Search**: Use of CAPTCHA on unauthenticated tracking/status endpoints to prevent automated scraping.

## 10. CoWIN Patterns
**Source**: cowin.gov.in
1. **High-Contrast "What You Need"**: Large, icon-driven blocks detailing exactly what documents are required before starting a process.
2. **Anti-Confusion Warnings**: Explicit, bolded warnings to prevent user errors (e.g., "Do not refresh the page").
3. **One-Time Password (OTP) Flow**: Standardized, large-input OTP verification screens with clear resend countdown timers.
4. **Prominent Download CTA**: Clear, heavily weighted primary buttons for downloading artifacts (e.g., Certificates/Tokens).
5. **Status Badges**: Distinct visual badges for status (e.g., "Partially Vaccinated" vs "Fully Vaccinated") using color AND text.
