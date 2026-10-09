# TurnWise - Government Feel Rules

To transition from a "SaaS dashboard vibe" to a "trusted service portal feel," TurnWise will adhere to the following UI rules. These rules ensure task-first information architecture, trust scaffolding, accessibility behaviors, and strict token discipline.

## 1. Trust Scaffolding
1. **Disclaimer Bar**: A high-visibility disclaimer must appear on every screen stating: "Hackathon Prototype — Not an official Government website." (Source: Hackathon constraints).
2. **Authoritative Footer**: Implement an identifier-like block in the footer outlining "Useful Links", "Website Policies", and "Support" alongside an explicit ownership statement (Source: GIGW 5.1.2, UX4G).
3. **Information Integrity**: Show the "Last Updated" date clearly on the homepage and footer to convey active maintenance (Source: GIGW 5.1.5).
4. **No Impersonation**: Absolutely no official seals, emblems (e.g., State Emblem of India), or misleading domain naming conventions are allowed (Source: Hackathon constraints).

## 2. Task-First Information Architecture
5. **Clear Entry Points**: Use unambiguous, action-oriented labels for primary tasks (e.g., "Take a Token", "Check Your Status") instead of abstract SaaS naming (Source: GOV.UK Design System).
6. **Eliminate Decor**: Remove non-functional glowing elements (`card--glow`), arbitrary animations, and decorative emojis. Focus purely on usability and content hierarchy (Source: USWDS, GOV.UK).
7. **Breadcrumb Trails**: If navigation depth exceeds one level, provide clear breadcrumbs for orientation (Source: UXDT, GIGW 5.2.31).
8. **Consistent Header/Navigation**: Maintain a simple, linear top navigation bar or a standard utility strip without overly complex megamenus for a simple utility app (Source: UX4G, GIGW).

## 3. Accessibility Behaviors
9. **Focus Indicators**: The focus outline must be 3px solid, highly visible, and never suppressed by CSS (Source: GIGW 5.2.33, UX4G).
10. **High Contrast**: Ensure a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text/icons against their backgrounds (Source: GIGW 5.2.14).
11. **Text Alternatives**: All status indicators must use text (e.g., "Status: CALLED") or icons in addition to color. Do not rely solely on color (Source: GIGW 5.2.12).
12. **Error Summaries**: Forms must feature an explicit error summary at the top if submission fails, along with inline field errors (Source: GOV.UK Design System, GIGW 5.2.44).
13. **Accessibility Toolbar**: Retain the existing Accessibility Toolbar (text resizing, contrast toggle) at the top of the viewport (Source: UX4G, TurnWise specific).

## 4. Token Discipline
14. **Typography**: Strictly use `Noto Sans` for all text to support Latin and regional scripts, following standard scale sizes without arbitrary overrides (Source: UX4G, UXDT).
15. **Standardized Components**: Use explicit, pre-defined class compositions (e.g., `btn btn-primary`) with strict visual properties (e.g., 4px border radius, 600 font weight) instead of arbitrary inline styles (Source: UX4G).
16. **Semantic Spacing**: Rely on rigid spacing scales (e.g., consistent 16px, 24px padding/margins) instead of loose, "airy" SaaS layouts (Source: UX4G, USWDS).
