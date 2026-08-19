import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createDefaultDocument,
  reduceDocument,
  type AppAction,
  type AppDocument,
} from "./application/appState";
import { CyclesDialog } from "./components/CyclesDialog";
import { Dialog } from "./components/Dialog";
import { ManageDialog } from "./components/ManageDialog";
import { RoutineEditor } from "./components/RoutineEditor";
import { advanceRun } from "./domain/runEngine";
import type { Routine } from "./domain/types";
import {
  createStateRepository,
  STORAGE_KEY,
  type LoadResult,
} from "./infrastructure/persistence";
import { strings } from "./strings";

type Popup = "cycles" | "manage" | null;
type WakeLock = { release(): Promise<void>; released?: boolean };

const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.ceil(ms / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
};

function playCue(completion: boolean) {
  if (!window.AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = completion ? 880 : 660;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
  oscillator.addEventListener("ended", () => void context.close());
}

export function App() {
  const repository = useMemo(() => createStateRepository(localStorage), []);
  const [loadResult, setLoadResult] = useState<LoadResult | null>(null);
  const [state, setState] = useState<AppDocument | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  const [popup, setPopup] = useState<Popup>(null);
  const [routineDraft, setRoutineDraft] = useState<Routine | null>(null);
  const [manageDraft, setManageDraft] = useState<Routine[] | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const stateRef = useRef<AppDocument | null>(null);
  const lastCue = useRef<string | null>(null);

  useEffect(() => {
    const result = repository.load();
    setLoadResult(result);
    if (result.kind === "ready") {
      stateRef.current = result.document;
      setState(result.document);
      if (result.document.revision === 0) repository.save(result.document);
    }
  }, [repository]);

  useEffect(() => {
    if (state?.run.status !== "running" || !visible) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(id);
  }, [state?.run.status, visible]);

  useEffect(() => {
    const listener = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }, []);

  const commit = useCallback(
    (action: AppAction) => {
      const current = stateRef.current;
      if (!current || storageError) return false;
      const next = reduceDocument(current, action);
      if (next === current) return false;
      const saved = repository.save(next);
      if (!saved.ok) {
        setStorageError(saved.error);
        return false;
      }
      stateRef.current = next;
      setState(next);
      return true;
    },
    [repository, storageError],
  );

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const result = repository.load();
      if (result.kind !== "ready") return;
      const current = stateRef.current;
      if (current && result.document.revision < current.revision) return;
      if (
        result.document.run.status !== "ready" &&
        (routineDraft || manageDraft)
      ) {
        setRoutineDraft(null);
        setManageDraft(null);
        setPopup(null);
        setConflict(true);
        setTimeout(() => setConflict(false), 2_800);
      }
      stateRef.current = result.document;
      setState(result.document);
    };
    addEventListener("storage", listener);
    return () => removeEventListener("storage", listener);
  }, [manageDraft, repository, routineDraft]);

  const routine = state?.routines.find(
    ({ id }) => id === state.activeRoutineId,
  );
  const advanced =
    state && routine ? advanceRun(routine, state.run, nowMs) : null;
  const view = advanced?.view;

  useEffect(() => {
    if (state?.run.status === "running" && advanced?.run.status === "completed")
      commit({ type: "run-command", command: { type: "pause", nowMs } });
  }, [advanced?.run.status, commit, nowMs, state?.run.status]);

  useEffect(() => {
    if (!state || !view) return;
    const key = `${view.status}:${view.cycleIndex}:${view.activeStepIndex}`;
    const previous = lastCue.current;
    lastCue.current = key;
    if (
      state.run.status !== "running" ||
      !previous ||
      previous === key ||
      !visible
    )
      return;
    const completion = view.status === "completed";
    if (state.preferences.sound) playCue(completion);
    if (state.preferences.vibration && navigator.vibrate)
      navigator.vibrate(completion ? [80, 60, 80] : 80);
  }, [state, view, visible]);

  useEffect(() => {
    let lock: WakeLock | null = null;
    const wakeLock = (
      navigator as Navigator & {
        wakeLock?: { request(type: "screen"): Promise<WakeLock> };
      }
    ).wakeLock;
    if (state?.run.status === "running" && visible && wakeLock)
      void wakeLock
        .request("screen")
        .then((value) => {
          lock = value;
        })
        .catch(() => undefined);
    return () => {
      if (lock && !lock.released) void lock.release();
    };
  }, [state?.run.status, visible]);

  if (!loadResult)
    return (
      <main
        className="loading"
        aria-busy="true"
        aria-label="Loading The Counter"
      >
        <span className="spinner" />
      </main>
    );

  if (loadResult.kind === "recovery" && !state) {
    const download = () => {
      const content = JSON.stringify(
        {
          error: loadResult.error,
          raw: loadResult.raw,
          supportedSchemaVersion: 1,
        },
        null,
        2,
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(
        new Blob([content], { type: "application/json" }),
      );
      link.download = "the-counter-diagnostic.json";
      link.click();
      URL.revokeObjectURL(link.href);
    };
    const reset = () => {
      const defaults = createDefaultDocument();
      const saved = repository.save(defaults);
      if (!saved.ok) return setStorageError(saved.error);
      stateRef.current = defaults;
      setState(defaults);
      setLoadResult({ kind: "ready", document: defaults });
    };
    return (
      <main className="recovery-shell">
        <section className="recovery-card">
          <p className="eyebrow">Recovery</p>
          <h1>Saved data could not be opened</h1>
          <p>Your original data is preserved until you reset the app.</p>
          <div className="stack-actions">
            <button className="button secondary" onClick={download}>
              {strings.downloadDiagnostic}
            </button>
            <button className="button danger" onClick={reset}>
              {strings.resetApp}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!state || !routine || !view) return null;

  const locked = state.run.status !== "ready";

  const startPause = () =>
    commit({
      type: "run-command",
      command:
        state.run.status === "running"
          ? { type: "pause", nowMs: Date.now() }
          : { type: "start", nowMs: Date.now() },
    });
  const retry = () => {
    const current = stateRef.current;
    if (!current) return;
    const saved = repository.save(current);
    saved.ok ? setStorageError(null) : setStorageError(saved.error);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          className="text-button align-left"
          onClick={() =>
            commit({ type: "run-command", command: { type: "reset" } })
          }
        >
          {strings.reset}
        </button>
        <p className="brand">COUNTER</p>
        <button
          className="text-button"
          disabled={locked}
          onClick={() => setPopup("manage")}
        >
          {strings.manageRoutines}
        </button>
      </header>

      {conflict && (
        <div className="toast" role="status">
          Another window started this run.
        </div>
      )}
      {storageError && (
        <div className="error-banner" role="alert">
          <span>Changes cannot be saved. {storageError}</span>
          <button onClick={retry}>{strings.retry}</button>
        </div>
      )}

      {routineDraft ? (
        <RoutineEditor
          draft={routineDraft}
          onChange={setRoutineDraft}
          onCancel={() => setRoutineDraft(null)}
          onSave={() => {
            if (commit({ type: "commit-routine", routine: routineDraft }))
              setRoutineDraft(null);
          }}
        />
      ) : (
        <main className="routine-view">
          <section className="routine-heading">
            <div>
              <p className="eyebrow">
                {view.status === "completed"
                  ? strings.completed
                  : strings.appName}
              </p>
              <h1>{routine.name}</h1>
            </div>
            {routine.cycles > 1 && (
              <p className="cycle-progress">
                Cycle {view.cycleIndex + 1} of {routine.cycles}
              </p>
            )}
          </section>
          <section className="steps" aria-label="Timed steps">
            {routine.steps.map((step, index) => (
              <article
                className={`step-card ${
                  index === view.activeStepIndex ? "active" : ""
                } ${index < view.activeStepIndex ? "past" : ""}`}
                key={step.id}
              >
                <div>
                  <p className="step-index">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2>{step.name}</h2>
                </div>
                <time>{formatTime(view.stepRemainingMs[index])}</time>
              </article>
            ))}
          </section>
        </main>
      )}

      {!routineDraft && (
        <nav className="bottom-nav" aria-label="Timer controls">
          <button disabled={locked} onClick={() => setPopup("cycles")}>
            <span className="nav-icon">↻</span>
          </button>
          <button className="primary-control" onClick={startPause}>
            <span className="play-symbol">
              {state.run.status === "running" ? "Ⅱ" : "▶"}
            </span>
          </button>
          <button
            disabled={locked}
            onClick={() => setRoutineDraft(structuredClone(routine))}
          >
            <span className="nav-icon">✎</span>
          </button>
        </nav>
      )}

      {popup === "cycles" && (
        <CyclesDialog
          routine={routine}
          onClose={() => setPopup(null)}
          onChange={(cycles) => commit({ type: "set-cycles", cycles })}
        />
      )}
      {popup === "manage" && (
        <ManageDialog
          state={state}
          draft={manageDraft}
          setDraft={setManageDraft}
          onClose={() => {
            setManageDraft(null);
            setPopup(null);
          }}
          onCommit={commit}
        />
      )}
    </div>
  );
}
