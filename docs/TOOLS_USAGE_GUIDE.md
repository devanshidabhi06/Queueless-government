# Tools Usage Guide for Civic Design Analysis

When analyzing external sites and design systems to inform the TurnWise UI, we utilize several tools. This guide outlines the ethical boundaries and methodologies for their use.

## Authorized Tools
- **Design Extractor (`design-extractor.com`)**: Used for analyzing color palettes, typography scales, and CSS spacing tokens from public civic systems (e.g., USWDS, GOV.UK).
- **PocketUI (`pocketui.app`)**: Used for cataloging UI component layouts (e.g., how a government form is structured).
- **Crawl4AI (`docs.crawl4ai.com`)**: Used for extracting structured documentation (e.g., reading design system API docs or accessibility guidelines).
- **SugamyaWeb**: Used for evaluating the accessibility compliance of our own prototype.

## Ethical Boundaries & Constraints
1. **No Cloning**: Do not copy or scrape HTML/CSS source code directly into the TurnWise repository. Extract the *principles* (e.g., spacing variables, contrast ratios) and implement them manually using our approved tech stack.
2. **No Protected Assets**: Do not download or use official government seals, emblems, proprietary fonts, or branded images.
3. **Respect `robots.txt` and Terms of Service**: When using crawling tools (like Crawl4AI), ensure they respect `robots.txt` directives. Do not aggressively crawl or scrape sites. Limit requests to public documentation.
4. **Attribution**: Where specific UX mechanics (like the GOV.UK Error Summary) are adapted, reference the inspiration in commit messages or documentation.
