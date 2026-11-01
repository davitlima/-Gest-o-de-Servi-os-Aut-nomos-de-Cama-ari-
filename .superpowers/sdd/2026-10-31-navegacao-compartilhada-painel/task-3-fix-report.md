# Task 3 — Drawer focus correction

## Final-review findings addressed

- **Important / P2:** Mobile Tab wraps from Mensagens to Close; Shift+Tab wraps from Close to Mensagens. Interior links retain native keyboard order. A Tab event whose focus escaped the drawer returns it to the corresponding boundary.
- Opening isolates the background with `inert`, preserving each affected element's previous value. Close, Escape, breakpoint changes, and disconnect restore those values. Desktop navigation does not trap focus or enter the mobile modal state. Explicit close-button, overlay, and Escape actions return focus to the trigger.
- **Minor / P3 overlay visibility:** The closed overlay now has `inert` and `aria-hidden="true"`; opening restores its accessibility visibility.

## Verification evidence

- RED: `node tests/panel-nav.test.js` failed on the new `Tab at the final link must wrap` assertion before the controller change (expected `true`, actual `false`).
- GREEN: `npm test` passed all PHP structural, masks, chat, and shared-navigation suites after the change.
- Focused navigation cases cover both wrapping boundaries, both interior Tab directions, recovery from outside focus, focus return on Escape/Close/overlay, repeated opening without losing prior inert values, breakpoint transitions in both directions, desktop access, closed overlay accessibility, and disconnect cleanup.
- `node --check src/js/panel-nav.js`: PASS.
- `node --check tests/panel-nav.test.js`: PASS.
- `git diff --check`: PASS for this uncommitted correction patch. Git emitted only the checkout's LF-to-CRLF conversion notices.

These focused tests use a fake DOM and establish controller behavior; real-browser keyboard acceptance and the full visual matrix remain part of the parent Task 3 verification. This patch does not resolve or claim a pass for the review's separate baseline-scoped whitespace finding (`git diff --check 16d7770`).

