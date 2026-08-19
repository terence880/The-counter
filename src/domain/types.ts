export type TimedStep = { id: string; name: string; durationMs: number };
export type Routine = { id: string; name: string; cycles: number; steps: TimedStep[] };
export type RunState =
  | { status: "ready" }
  | { status: "running"; anchorTimeMs: number; elapsedBeforeAnchorMs: number }
  | { status: "paused"; elapsedMs: number }
  | { status: "completed" };
export type RunCommand = { type: "start"; nowMs: number } | { type: "pause"; nowMs: number } | { type: "reset" };
export type RunView = { status: RunState["status"]; cycleIndex: number; activeStepIndex: number; remainingMs: number; stepRemainingMs: number[] };
