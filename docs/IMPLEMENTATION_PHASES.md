## 5. `docs/IMPLEMENTATION_PHASES.md`

```md
# Implementation Phases

Complete one phase only, verify it, report results and ask permission before continuing.

## Phase 0 — Inspect and plan

- Read all specifications.
- Inspect existing Tauri code.
- Inspect every image in `stitch-images/`.
- Map screenshots to screens and states.
- Report existing errors and missing assets.
- Propose file structure and Phase 1 changes.
- Do not implement features.

## Phase 1 — Foundation and theme

- Fix the existing scaffold if necessary.
- Establish routing/screen state.
- Create shared colors, typography, buttons, inputs and dialogs.
- Import logo and invoice assets.
- Preserve approved Stitch design.
- Add lint, typecheck and test scripts.

## Phase 2 — Splash and login

- Splash transition.
- Login UI and error state.
- Show/hide password.
- Rust credential verification.
- In-memory authentication.
- Logout flow.
- Ask for credentials before implementing.

## Phase 3 — Home and USB folder

- Minimal Home screen.
- Generate New Invoice button.
- Native folder selection.
- Remember selected folder in JSON.
- Display folder availability.
- Open selected folder.
- USB-unavailable state.

## Phase 4 — Invoice form

- Customer fields.
- Dynamic manual product rows.
- Add/remove rows.
- Calculation engine.
- Fixed/percentage discount.
- Advance and pending.
- Validation and clear confirmation.
- Relevant unit/component tests.

## Phase 5 — Invoice numbering

- `MI-YYYY-NNNN` numbering.
- Read local and USB sequence metadata.
- Scan PDF filenames.
- Recover from missing/corrupt metadata.
- Sanitize filenames.
- Prevent overwrite.
- Atomic metadata update.

## Phase 6 — Preview and PDF

- A5 preview matching the approved template.
- Same data model for form, preview and PDF.
- Generate real A5 PDF.
- Save safely to USB.
- Do not consume number after failed save.
- Preserve form after errors.

## Phase 7 — Final user flow

- Invoice Saved screen.
- Open PDF.
- Open Folder.
- Create another invoice.
- Return Home.
- USB retry/reselect.
- Polish dialogs, focus and keyboard flow.

## Phase 8 — QA and installer

- Run format, lint, typecheck and tests.
- Test offline behaviour.
- Test USB removal and path changes.
- Inspect PDF layout and calculations.
- Configure app name, icon and identifier.
- Generate Windows NSIS `.exe`.
- Report installer location and limitations.

## Required phase report

```text
Implemented:
Files changed:
Tests/commands run:
Results:
Known issues:

Then stop and ask:

“Phase N is complete. Shall I begin Phase N+1?”