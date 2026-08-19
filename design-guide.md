# The Counter — V1 Product Specification

## Product

The Counter is a portrait-oriented, offline-first progressive web app for running reusable interval routines. It is designed for iPhone and Android first and remains responsive on desktop.

The interface is English-only and dark-themed in V1. Styling, colors, motion, and detailed accessibility treatment may evolve without changing the behavior specified here.

## Domain model

- A **Routine** is an ordered collection of timed steps.
- A **Timed Step** has a name and duration.
- A **Cycle** is one complete passage through every step in a routine.
- One **Active Routine** is selected at a time.
- A **Run** executes the active routine for its configured number of cycles.
- Run states are **Ready**, **Running**, **Paused**, and **Completed**.

Canonical terms and avoided synonyms live in [CONTEXT.md](./CONTEXT.md).

## Limits and validation

- The app contains 1–3 routines.
- A saved routine contains 1–20 timed steps.
- An editing draft may temporarily contain no steps, but cannot be saved.
- Step durations range from `00:01` to `59:59`.
- Names are trimmed, required, and limited to 50 characters.
- Duplicate routine and step names are allowed.
- Cycles disabled means one cycle.
- Cycles enabled permits 2–20 total cycles, including the first passage.
- Infinite cycling is not supported.
- Save is dimmed and disabled whenever the draft violates a limit.

## First launch and defaults

First launch creates:

- `Routine 1`
- `Step 1 — 01:00`
- one cycle
- Sound enabled
- Vibration enabled

A new routine is named `Routine N` and starts with `Step 1 — 01:00`. A new timed step is appended as `Step N — 01:00`. Generated names remain editable and need not be unique.

## Homepage

### Layout

- Reset is at the top-left.
- Manage Routines is at the top-right.
- The active routine name appears near the top.
- When more than one cycle is configured, cycle progress appears as `Cycle 2 of 5`; it is hidden for a single cycle.
- Timed steps are stacked vertically at full available width.
- Each step displays its name and remaining or configured time as `MM:SS`.
- Bottom controls contain Cycles, Start/Pause, and Edit Routine.

### Step presentation during a run

- The active step is highlighted.
- Completed steps in the current cycle display `00:00`.
- The active step counts down.
- Future steps display their configured durations.
- At the next cycle, all step displays reset before the first begins.
- Completed displays the final step at `00:00` in a distinct completion state.

### Control availability

- Ready allows configuration, routine management, Start, and Reset.
- Running allows Pause and Reset; all configuration controls are dimmed and non-interactive.
- Paused allows Resume and Reset; it remains part of the run and configuration stays locked.
- Completed allows Start and Reset; configuration and routine selection stay locked.
- Disabled controls do not display an explanatory message.
- Reset never requires confirmation.

### Run behavior

- Start from Ready begins the first step of the first cycle.
- Pause preserves the current step, cycle, and remaining time.
- Resume continues from the preserved point.
- Reset clears progress, restores the first step at full duration, and enters Ready without starting.
- A step advances immediately to the next step at zero.
- The final step advances to the next cycle when cycles remain.
- After the final step of the final cycle, the run enters Completed.
- Start from Completed begins a new run from the first step and first cycle.

## Edit Routine

- Edit Routine is available only in Ready.
- Save and Cancel replace the homepage bottom controls.
- The screen uses the same stacked-step layout as the homepage.
- Users can rename, add, delete, and reorder steps and change durations.
- Duration uses scrollable minute and second controls.
- Each step has a delete action and drag handle.
- Accessible Move Up and Move Down actions are also available; unavailable directions are disabled.
- Add is disabled at 20 steps.
- Delete may produce an empty draft, which disables Save.
- Save commits the complete draft and returns to the homepage.
- Cancel discards the complete draft and returns to the homepage.
- Editing drafts are never persisted and are discarded by refresh, app termination, or an external run started in another instance.

## Cycles popup

- Cycles is available only in Ready.
- The popup has a Close control, enabled switch, and total cycle-count control.
- Changes persist immediately.
- Close only dismisses the popup; there is no draft or rollback.
- Disabling cycles fixes the count at one.
- Enabling cycles uses a value from 2–20.

## Manage Routines popup

### Viewing mode

- Close is at the top-right and Edit at the top-left.
- Each routine has a radio control; exactly one is active.
- Selecting a routine persists immediately and the popup remains open.
- The bottom Preferences section contains Sound and Vibration switches.
- Preference changes persist immediately and independently of routine edits.

### Editing mode

- Edit changes to Save.
- Routine selection controls become delete actions.
- Users can rename, add, and delete routines.
- Add is disabled when three routines exist.
- Delete is disabled when only one routine exists.
- Changes remain a draft until Save.
- Save commits the complete draft.
- Close discards the complete draft.
- If Save deletes the active routine, the next routine becomes active, or the previous routine when the deleted routine was last.

### During progress

Manage Routines cannot open while Running, Paused, or Completed. Preferences therefore cannot change until the run returns to Ready.

## Timing and lifecycle

- Running follows real elapsed time rather than relying on interval callback counts.
- The run persists across refresh, app termination, suspension, and relaunch.
- Reopening a Running run derives the current step, cycle, and remaining time from persisted timestamps.
- Reopening a Paused run restores its saved remaining time.
- Reopening after completion restores Completed.
- Device wall-clock time is authoritative across suspension and restart.
- Forward clock changes advance or complete the run.
- Backward clock changes are clamped so remaining time does not exceed its saved step duration.
- The app requests a screen wake lock while Running and visible.
- It releases the lock when hidden or in Ready, Paused, or Completed.
- Timing remains correct when wake lock is unsupported or denied.

## Sound and vibration

- A short built-in sound and one short vibration pulse mark visible step transitions.
- A distinct sound and two short vibration pulses mark completion.
- Device volume controls sound level; there is no app volume or sound picker.
- Sound and Vibration preferences independently control their cues.
- Unsupported capabilities fail silently.
- Background cues are best-effort and never affect timing correctness.
- Missed transition cues are not replayed.
- If completion occurred while suspended, one completion cue plays when the app becomes active.

## Persistence and synchronization

- V1 stores one versioned application document in `localStorage`.
- Persist timestamps and state transitions, not per-second display ticks.
- The persistence interface remains replaceable for future storage or sync options.
- V1 has no account, cloud sync, backup, export/import, or routine history.
- Open instances synchronize persisted changes; the latest user action wins.
- Independent concurrent runs are not allowed.
- An external run discards any local editing draft, closes editing, synchronizes the run, and shows a brief conflict notice.
- A rejected storage write keeps the last valid state and shows a blocking error with Retry.
- New runs and configuration commits are blocked until persistence succeeds.
- An already-running in-memory timer may continue, with a warning that newer state cannot be recovered after closure.

## Data recovery and migration

- Recognized older schemas migrate automatically before rendering.
- Corrupt data or an unsupported future schema is never silently overwritten or partially interpreted.
- A recovery screen offers Download Diagnostic Data and Reset App.
- Diagnostic data contains the original stored value and schema/error metadata but no browser or device fingerprint.
- Reset App immediately replaces unreadable data with first-launch defaults and requires no confirmation.
- Initial loading shows only the dark background and a centered accessible loading indicator; defaults must not flash before hydration finishes.

## PWA and privacy

- The complete app shell and runtime assets are cached for offline use after the first load.
- Updates activate on the next safe launch and never force-refresh a Running or Paused run.
- The app uses standalone display mode and portrait orientation.
- The manifest name is `The Counter` and short name is `Counter`.
- Manifest theme and background metadata are dark.
- Icons use a simple counter/timer mark.
- V1 has no custom installation tutorial or prompt.
- The build produces provider-neutral static files that require HTTPS.
- V1 makes no analytics, telemetry, advertising, remote-font, or externally hosted runtime-asset requests.

## Browser support

- Current iOS Safari and installed iOS PWA
- Current Android Chromium and installed Android PWA
- Current desktop Chrome, Safari, Firefox, and Edge
- Core timing and editing work everywhere.
- Installation, wake lock, and vibration degrade gracefully when unsupported.

## Implementation constraints

- React, TypeScript, and Vite
- Plain CSS with custom properties and no general component library
- Pure TypeScript timer domain module with no React or browser dependency
- Reducer-driven application layer
- Replaceable persistence interface with a `localStorage` adapter
- Narrow dependencies, favoring platform capabilities and focused accessibility libraries only when necessary
- Centralized visible strings for future localization
- Automated unit coverage for timer behavior, validation, persistence, and migration
- Browser coverage for first launch, editing, running, reload recovery, and offline startup
