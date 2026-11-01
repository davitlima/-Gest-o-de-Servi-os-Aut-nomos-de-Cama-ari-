# Task 2 report: migrate panel pages

## Result

Meu Perfil, Financeiro, and Mensagens now use one `<nexlar-panel-nav>` with the appropriate `active` attribute and load the shared CSS/script exactly once. Removed their legacy sidebar markup, navigation styles, and drawer handlers. Main profile, finance, and messaging features remain intact. Removed Meu Perfil's obsolete `financeNav` lookup/hiding, which would otherwise reference a removed node and hide Financeiro for clients. Backend permissions are unchanged. `inicio.html` was not modified.

The migration was committed as `74b0382` (`refactor: unificar navbar do painel`).

## Initial TDD and verification

- RED: `php tests/run.php` failed with `Meuperfil deve usar uma única navegação compartilhada` before migration.
- GREEN: the structural tests passed after migration. They enforce the active route, one shared asset load, no legacy sidebar/drawer styles or handlers, and balanced page CSS.
- `npm test` passed: PHP, registration masks, chat behavior, and shared navigation.
- Node syntax checks passed for all three page scripts and `panel-nav.js`.
- `git diff --check` passed after removing a trailing blank line.

## Review round 1

Added `cypress/e2e/panel-layout.cy.js` to verify the Important review findings in a real headless Electron browser. Its five cases passed **before corrective CSS changes**:

- At 320x568 and 390x844, a list of 30 conversations scrolls to its final item, which is visible and clickable.
- Opening that conversation leaves the input and contract button visible; the contract button's bounding rectangle ends within the viewport.
- The shared drawer opens/closes and exposes Financeiro in both mobile sizes.
- Meu Perfil's save button is reachable without horizontal overflow at both mobile sizes.
- At 800px, Meu Perfil's desktop navigation, profile card, and save button remain usable without horizontal overflow.

The clipping theory in the review assumes `content-box`, but the stylesheet already applies `box-sizing: border-box` to every element. The mobile shared component also removes the 210px flex reservation at 760px. The profile's body/nav breakpoint is already 760px; its separate 900px rule stacks only the main-content form/header. Removing desktop navigation at 800px would change the approved shared breakpoint. No speculative CSS fix was applied after the browser checks disproved the reported failures.

Fixed the Minor finding by grouping the shared stylesheet before scripts and loading the component before each page script in Financeiro and Mensagens. Added structural load-order assertions: RED failed with `Painelfinanceiro deve agrupar os estilos antes dos scripts`; GREEN passed after reordering.

## Final checks

- `npm test`: passed.
- `node --check` for `Meuperfil.js`, `Painelfinanceiro.js`, `painelmensagens.js`, `panel-nav.js`, and `panel-layout.cy.js`: passed.
- `git diff --check`: passed.
- Focused browser command: `npx cypress run --headless --browser electron --spec cypress/e2e/panel-layout.cy.js --config baseUrl=http://127.0.0.1:4173,video=false,screenshotOnRunFailure=false` — 5 passing after asset reordering.

The browser fixture replaces only the external API client/CDN script with deterministic client/conversation data. Page rendering, navigation, scrolling, conversation selection, and layout use the production HTML/CSS/JavaScript. Full desktop visual inspection and public deployment verification remain Task 3.

