import { describe, expect, it } from "vitest";
import { advanceRun, transitionRun } from "./runEngine";
import type { Routine, RunState } from "./types";
const routine: Routine = { id: "routine-1", name: "Intervals", cycles: 2, steps: [{ id: "step-1", name: "Work", durationMs: 30_000 }, { id: "step-2", name: "Rest", durationMs: 10_000 }] };
describe("run engine", () => {
  it("advances immediately to the next timed step at zero", () => {
    const running = transitionRun(routine, { status: "ready" }, { type: "start", nowMs: 1_000 });
    expect(advanceRun(routine, running, 31_000).view).toMatchObject({ status: "running", cycleIndex: 0, activeStepIndex: 1, remainingMs: 10_000, stepRemainingMs: [0, 10_000] });
  });
  it("completes after the final timed step of the final cycle", () => {
    const running = transitionRun(routine, { status: "ready" }, { type: "start", nowMs: 1_000 });
    expect(advanceRun(routine, running, 81_000)).toMatchObject({ run: { status: "completed" }, view: { status: "completed", cycleIndex: 1, activeStepIndex: 1, remainingMs: 0, stepRemainingMs: [0, 0] } });
  });
  it("preserves progress while paused and resumes from that point", () => {
    const running = transitionRun(routine, { status: "ready" }, { type: "start", nowMs: 1_000 });
    const paused = transitionRun(routine, running, { type: "pause", nowMs: 16_000 });
    expect(advanceRun(routine, paused, 50_000).view.remainingMs).toBe(15_000);
    const resumed = transitionRun(routine, paused, { type: "start", nowMs: 50_000 });
    expect(advanceRun(routine, resumed, 55_000).view.remainingMs).toBe(10_000);
  });
  it("resets all progress without starting", () => {
    const reset = transitionRun(routine, { status: "paused", elapsedMs: 55_000 }, { type: "reset" });
    expect(advanceRun(routine, reset, 99_000)).toMatchObject({ run: { status: "ready" }, view: { status: "ready", cycleIndex: 0, activeStepIndex: 0, remainingMs: 30_000 } });
  });
});
