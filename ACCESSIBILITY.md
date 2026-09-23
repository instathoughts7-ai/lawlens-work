# Accessibility (a11y) Architecture & Audit Report

## Overview

LawLens Work is designed with accessibility at its core, combining automated testing via `vitest-axe` with clean HTML semantics and keyboard navigation patterns. This document outlines the scope of automated test verification, its exact test boundaries, and the critical accessibility requirements that **cannot** be verified by automated tools and require manual verification.

---

## What `vitest-axe` Covers

Automated accessibility audits are integrated directly into continuous integration via `src/test/accessibility.test.tsx` using `axe-core` via `vitest-axe`.

The automated test suite renders and audits the following components:

1. **`DomainList` (`src/components/DomainList.tsx`)**:
   - Audited at Screen Level 1 with sample domains.
   - Verifies valid ARIA roles, accessible card buttons, `aria-disabled="true"` on inactive domain cards, hidden decorative SVG icons (`aria-hidden="true"`), and valid landmark structures.
2. **`SectionList` (`src/components/SectionList.tsx`)**:
   - Audited at Screen Level 2.
   - Verifies heading hierarchy (`h2`), accessible back navigation button label, and `<section aria-label="...">` landmark labeling.
3. **`TopicList` (`src/components/TopicList.tsx`)**:
   - Audited at Screen Level 3.
   - Verifies interactive list elements, heading structure, touch targets, and non-text visual indicators (chevrons/badges).
4. **`AnalysisView` (`src/components/AnalysisView.tsx`)**:
   - Audited at Screen Level 4.
   - Verifies form controls (`<textarea>` inputs with accessible labels / IDs), live character counter labels, action buttons with explicit labels, and disclaimer regions.
5. **`ExportView` (`src/components/ExportView.tsx`)**:
   - Audited when analysis findings exist.
   - Verifies checkbox input and `<label htmlFor="...">` pairing for the "Redact contact details" toggle, tab switcher button roles, textarea `aria-label`, and accessible copy action triggers.

**Automated Test Result**: All 5 test suites pass with **0 axe-core violations** detected in the automated JSDOM environment.

---

## What `vitest-axe` Does NOT Cover (Manual Verification Checklist)

Automated testing tools like `vitest-axe` catch only approximately 30–40% of accessibility issues. Automated audits in headless/JSDOM environments do not simulate CSS layout engines, visual rendering pipes, or assistive technology screen reader APIs.

The following areas are **not** proven by automated tests and **must be validated through manual inspection**:

### 1. Computed Color Contrast Ratios in Real Browsers

- **Why Automated Tests Miss It**: In JSDOM and headless environments, CSS stylesheet cascading, Tailwind CSS v4 `@theme` layers, pseudo-element backgrounds, opacity blending, and GPU canvas rendering are not fully computed by layout engines.
- **Manual Check Required**: Inspect rendered text against backgrounds using Chrome DevTools Lighthouse or the Colour Contrast Analyser (CCA) to ensure a minimum 4.5:1 ratio for normal body text and 3:1 for large text across:
  - Severity badges (e.g. `bg-red-100 text-red-800`, `bg-amber-100 text-amber-800`)
  - Informational warning cards (e.g. `bg-amber-50 text-amber-950`)
  - Subdued metadata and character counters (`text-slate-500` on `bg-white`)
  - Inactive domain cards (`(soon)` badge)

### 2. Real Screen Reader Behavior & Reading Order

- **Why Automated Tests Miss It**: `axe-core` only checks the existence of ARIA attributes and valid HTML hierarchy in the virtual DOM; it cannot verify the actual speech synthesis output, pronunciation, or navigational flow of assistive technology.
- **Manual Check Required**: Test the live application with physical screen readers:
  - **NVDA / JAWS** on Windows (Firefox / Chrome)
  - **VoiceOver** on macOS / iOS (Safari)
  - **TalkBack** on Android
  - Confirm logical reading order when moving across breadcrumbs, sample insertion, textareas, finding blockquotes, and export tabs.
  - Verify that dynamic changes (such as analysis results appearing, character counts incrementing, or "Copied!" feedback) are announced clearly without disorienting the user.

### 3. Page Zoom & Text Resize to 200%

- **Why Automated Tests Miss It**: JSDOM has no viewport, layout reflow engine, or text scaling rendering.
- **Manual Check Required**:
  - In a standard browser, zoom the display to **200%** (`Cmd +` or browser settings).
  - Verify that no UI elements overlap, clip, or break outside their containers.
  - Confirm that text does not get truncated inside pills, badges, or buttons.
  - Ensure that two-dimensional horizontal scrolling is avoided for primary reading content.

### 4. Actual Keyboard-Only Walkthrough

- **Why Automated Tests Miss It**: Axe verifies that focusable elements exist in the DOM, but cannot confirm that a human relying solely on a keyboard can seamlessly navigate through every workflow without friction.
- **Manual Check Required**: Unplug/disable the mouse and complete the entire end-to-end user journey using only `Tab`, `Shift + Tab`, `Enter`, `Space`, and arrow keys:
  1. Navigate into an active domain (e.g. Employee).
  2. Select a section and topic.
  3. Activate the "Load Sample Document" button using `Space` or `Enter`.
  4. Tab to the textarea, verify the visible focus indicator (`focus:ring-2 focus:ring-indigo-500`).
  5. Tab to "Analyze Document" and press `Enter`.
  6. Navigate down through each finding, expand/collapse question accordions, toggle the redaction checkbox with `Space`, and copy the draft to clipboard with `Enter`.
  7. Use breadcrumbs to return to Domain selection without getting trapped in any focus lock.
