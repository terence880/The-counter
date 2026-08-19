import type { Routine, RunCommand, RunState, RunView } from "./types";

function elapsedFor(run: RunState, nowMs: number): number {
  if (run.status === "running")
    return run.elapsedBeforeAnchorMs + Math.max(0, nowMs - run.anchorTimeMs);
  return run.status === "paused" ? run.elapsedMs : 0;
}

export function transitionRun(
  routine: Routine,
  run: RunState,
  command: RunCommand,
): RunState {
  if (command.type === "start")
    return {
      status: "running",
      anchorTimeMs: command.nowMs,
      elapsedBeforeAnchorMs: run.status === "paused" ? run.elapsedMs : 0,
    };
  if (command.type === "pause" && run.status === "running") {
    const elapsedMs = elapsedFor(run, command.nowMs);
    const totalDurationMs =
      routine.steps.reduce((sum, step) => sum + step.durationMs, 0) *
      routine.cycles;
    return elapsedMs >= totalDurationMs
      ? { status: "completed" }
      : { status: "paused", elapsedMs };
  }
  if (command.type === "reset") return { status: "ready" };
  return run;
}

export function advanceRun(
  routine: Routine,
  run: RunState,
  nowMs: number,
): { run: RunState; view: RunView } {
  const elapsedMs = elapsedFor(run, nowMs);
  const cycleDurationMs = routine.steps.reduce(
    (sum, step) => sum + step.durationMs,
    0,
  );
  if (
    run.status === "completed" ||
    elapsedMs >= cycleDurationMs * routine.cycles
  ) {
    return {
      run: { status: "completed" },
      view: {
        status: "completed",
        cycleIndex: routine.cycles - 1,
        activeStepIndex: routine.steps.length - 1,
        remainingMs: 0,
        stepRemainingMs: routine.steps.map(() => 0),
      },
    };
  }
  const cycleIndex = Math.floor(elapsedMs / cycleDurationMs);
  const elapsedInCycleMs = elapsedMs % cycleDurationMs;
  let activeStepIndex = 0;
  let consumedMs = 0;
  for (let index = 0; index < routine.steps.length; index += 1) {
    const endMs = consumedMs + routine.steps[index].durationMs;
    if (elapsedInCycleMs < endMs) {
      activeStepIndex = index;
      break;
    }
    consumedMs = endMs;
  }
  const remainingMs =
    routine.steps[activeStepIndex].durationMs - (elapsedInCycleMs - consumedMs);
  return {
    run,
    view: {
      status: run.status,
      cycleIndex,
      activeStepIndex,
      remainingMs,
      stepRemainingMs: routine.steps.map((step, index) =>
        index < activeStepIndex
          ? 0
          : index === activeStepIndex
            ? remainingMs
            : step.durationMs,
      ),
    },
  };
}
