# Testing Seams

The project tests behavior only through these proposed public seams. Implementation details inside the modules are not test surfaces.

## 1. Run engine seam

The pure TypeScript run engine exposes a small interface that accepts a routine, current run state, and a command or observation time. Callers receive the next persisted run state or a display snapshot.

Tests at this seam cover:

- Ready, Running, Paused, Reset, and Completed transitions
- step and cycle boundaries
- immediate automatic advancement
- background and relaunch catch-up
- forward and backward wall-clock changes
- display snapshots for completed, active, and future steps

Time is supplied as input. Tests do not mock internal functions or inspect private calculations.

## 2. Application-state seam

The reducer-driven application module accepts the current application state and a user or synchronization event. It returns the next state plus explicit effects that adapters must perform.

Tests at this seam cover:

- routine and step validation
- editing Save and Cancel behavior
- configuration locking during progress
- active-routine replacement after deletion
- external-instance conflict behavior
- storage failure and retry decisions

Tests observe returned state and effects, not React components or internal reducer helpers.

## 3. Persistence seam

The persistence interface loads and saves a complete versioned application document. The production adapter uses `localStorage`; tests may supply an in-memory storage adapter at the same seam.

Tests at this seam cover:

- first-launch defaults
- valid round trips
- recognized schema migration
- corrupt and unsupported-future-schema recovery
- revision-based latest-write synchronization
- rejected writes without silent state loss

Tests use the persistence interface and do not reach into adapter internals.

## 4. User-interface seam

Browser tests use the rendered application as a user would, through accessible names, roles, and visible outcomes.

The focused V1 browser path covers:

- first launch
- editing and saving a routine
- starting, pausing, and resetting a run
- recovering a persisted run after reload
- starting from a precached offline app shell

React implementation details, CSS class names, and private application state are not browser-test interfaces.
