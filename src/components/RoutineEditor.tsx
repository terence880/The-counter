import { useState, type PointerEvent as ReactPointerEvent } from "react";

import { isValidRoutineDraft } from "../application/appState";
import type { Routine, TimedStep } from "../domain/types";
import { strings } from "../strings";
import { newId } from "../utils/id";

type RoutineEditorProps = {
  draft: Routine;
  onChange(routine: Routine): void;
  onCancel(): void;
  onSave(): void;
};

export function RoutineEditor({
  draft,
  onChange,
  onCancel,
  onSave,
}: RoutineEditorProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const updateStep = (id: string, update: Partial<TimedStep>) =>
    onChange({
      ...draft,
      steps: draft.steps.map((step) =>
        step.id === id ? { ...step, ...update } : step,
      ),
    });

  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.steps.length) return;
    const steps = [...draft.steps];
    const [step] = steps.splice(from, 1);
    steps.splice(to, 0, step);
    onChange({ ...draft, steps });
  };

  const finishPointerDrag = (event: ReactPointerEvent) => {
    if (dragging === null) return;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-step-index]");
    if (target) reorder(dragging, Number(target.dataset.stepIndex));
    setDragging(null);
  };

  const addStep = () => {
    const number = draft.steps.length + 1;
    onChange({
      ...draft,
      steps: [
        ...draft.steps,
        { id: newId("step"), name: `Step ${number}`, durationMs: 60_000 },
      ],
    });
  };

  return (
    <main className="editor-view">
      <label className="field routine-name-field">
        <span>{strings.routineName}</span>
        <input
          value={draft.name}
          maxLength={50}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </label>
      <section className="edit-steps" aria-label="Edit timed steps">
        {draft.steps.map((step, index) => {
          const total = Math.floor(step.durationMs / 1_000);
          const minutes = Math.floor(total / 60);
          const seconds = total % 60;
          return (
            <article
              className={`edit-card ${dragging === index ? "dragging" : ""}`}
              data-step-index={index}
              key={step.id}
              draggable
              onDragStart={() => setDragging(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragging !== null) reorder(dragging, index);
                setDragging(null);
              }}
            >
              <div className="edit-card-top">
                <button
                  className="drag-handle"
                  aria-label={`Drag Step ${index + 1}`}
                  onPointerDown={() => setDragging(index)}
                  onPointerUp={finishPointerDrag}
                >
                  ⠿
                </button>
                <label className="field grow">
                  <span>Step {index + 1} name</span>
                  <input
                    value={step.name}
                    maxLength={50}
                    onChange={(event) =>
                      updateStep(step.id, { name: event.target.value })
                    }
                  />
                </label>
                <button
                  className="icon-button danger-text"
                  aria-label={`Delete Step ${index + 1}`}
                  onClick={() =>
                    onChange({
                      ...draft,
                      steps: draft.steps.filter(({ id }) => id !== step.id),
                    })
                  }
                >
                  ×
                </button>
              </div>
              <div className="duration-row">
                <label>
                  <span>Minutes</span>
                  <select
                    value={minutes}
                    onChange={(event) =>
                      updateStep(step.id, {
                        durationMs:
                          (Number(event.target.value) * 60 + seconds) * 1_000,
                      })
                    }
                  >
                    {Array.from({ length: 60 }, (_, value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <span className="colon">:</span>
                <label>
                  <span>Seconds</span>
                  <select
                    value={seconds}
                    onChange={(event) =>
                      updateStep(step.id, {
                        durationMs:
                          (minutes * 60 + Number(event.target.value)) * 1_000,
                      })
                    }
                  >
                    {Array.from({ length: 60 }, (_, value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="move-actions">
                <button
                  disabled={index === 0}
                  onClick={() => reorder(index, index - 1)}
                >
                  Move Up
                </button>
                <button
                  disabled={index === draft.steps.length - 1}
                  onClick={() => reorder(index, index + 1)}
                >
                  Move Down
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <button
        className="add-button"
        disabled={draft.steps.length >= 20}
        onClick={addStep}
      >
        ＋ {strings.addStep}
      </button>
      <div className="editor-actions">
        <button className="button secondary" onClick={onCancel}>
          {strings.cancel}
        </button>
        <button
          className="button primary"
          disabled={!isValidRoutineDraft(draft)}
          onClick={onSave}
        >
          {strings.saveRoutine}
        </button>
      </div>
    </main>
  );
}
