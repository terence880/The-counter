import { transitionRun } from "../domain/runEngine";
import type { Routine, RunCommand, RunState } from "../domain/types";
export type Preferences = { sound: boolean; vibration: boolean };
export type AppDocument = { schemaVersion: 1; revision: number; routines: Routine[]; activeRoutineId: string; preferences: Preferences; run: RunState };
export type AppAction =
  | { type: "set-preference"; preference: keyof Preferences; value: boolean }
  | { type: "commit-routines"; routines: Routine[] }
  | { type: "commit-routine"; routine: Routine }
  | { type: "set-cycles"; cycles: number }
  | { type: "select-routine"; routineId: string }
  | { type: "run-command"; command: RunCommand };
export function createDefaultDocument(): AppDocument { return { schemaVersion: 1, revision: 0, activeRoutineId: "routine-1", preferences: { sound: true, vibration: true }, run: { status: "ready" }, routines: [{ id: "routine-1", name: "Routine 1", cycles: 1, steps: [{ id: "routine-1-step-1", name: "Step 1", durationMs: 60_000 }] }] }; }
export function isValidRoutineDraft(routine: Routine): boolean { const name = routine.name.trim(); return name.length >= 1 && name.length <= 50 && routine.steps.length >= 1 && routine.steps.length <= 20 && routine.cycles >= 1 && routine.cycles <= 20 && routine.steps.every((step) => { const stepName = step.name.trim(); return stepName.length >= 1 && stepName.length <= 50 && step.durationMs >= 1_000 && step.durationMs <= 3_599_000; }); }
export function isValidDocument(document: AppDocument): boolean { return document.routines.length >= 1 && document.routines.length <= 3 && document.routines.some(({ id }) => id === document.activeRoutineId) && document.routines.every(isValidRoutineDraft); }
const normalizeRoutine = (routine: Routine): Routine => ({ ...routine, name: routine.name.trim(), steps: routine.steps.map((step) => ({ ...step, name: step.name.trim() })) });
export function reduceDocument(document: AppDocument, action: AppAction): AppDocument {
  if (action.type === "run-command") { const routine = document.routines.find(({ id }) => id === document.activeRoutineId); return routine ? { ...document, revision: document.revision + 1, run: transitionRun(routine, document.run, action.command) } : document; }
  if (document.run.status !== "ready") return document;
  if (action.type === "set-preference") return { ...document, revision: document.revision + 1, preferences: { ...document.preferences, [action.preference]: action.value } };
  if (action.type === "commit-routines") {
    if (action.routines.length < 1 || action.routines.length > 3 || !action.routines.every(isValidRoutineDraft)) return document;
    const routines = action.routines.map(normalizeRoutine);
    const activeStillExists = routines.some(({ id }) => id === document.activeRoutineId);
    const formerIndex = document.routines.findIndex(({ id }) => id === document.activeRoutineId);
    const replacement = routines[Math.min(formerIndex, routines.length - 1)];
    return { ...document, revision: document.revision + 1, routines, activeRoutineId: activeStillExists ? document.activeRoutineId : replacement.id };
  }
  if (action.type === "commit-routine") { if (action.routine.id !== document.activeRoutineId || !isValidRoutineDraft(action.routine)) return document; const normalized = normalizeRoutine(action.routine); return { ...document, revision: document.revision + 1, routines: document.routines.map((routine) => routine.id === normalized.id ? normalized : routine) }; }
  if (action.type === "set-cycles") { if (action.cycles < 1 || action.cycles > 20) return document; return { ...document, revision: document.revision + 1, routines: document.routines.map((routine) => routine.id === document.activeRoutineId ? { ...routine, cycles: action.cycles } : routine) }; }
  if (action.type === "select-routine") { if (!document.routines.some(({ id }) => id === action.routineId)) return document; return { ...document, revision: document.revision + 1, activeRoutineId: action.routineId, run: { status: "ready" } }; }
  return document;
}
