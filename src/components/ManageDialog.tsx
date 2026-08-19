import {
  isValidRoutineDraft,
  type AppAction,
  type AppDocument,
} from "../application/appState";
import type { Routine } from "../domain/types";
import { strings } from "../strings";
import { newId } from "../utils/id";
import { Dialog } from "./Dialog";

type ManageDialogProps = {
  state: AppDocument;
  draft: Routine[] | null;
  setDraft(value: Routine[] | null): void;
  onClose(): void;
  onCommit(action: AppAction): boolean;
};

export function ManageDialog({
  state,
  draft,
  setDraft,
  onClose,
  onCommit,
}: ManageDialogProps) {
  const editing = draft !== null;
  const routines = draft ?? state.routines;
  const valid =
    routines.length >= 1 &&
    routines.length <= 3 &&
    routines.every(isValidRoutineDraft);

  const addRoutine = () => {
    if (!draft || draft.length >= 3) return;
    const number = draft.length + 1;
    const id = newId("routine");
    setDraft([
      ...draft,
      {
        id,
        name: `Routine ${number}`,
        cycles: 1,
        steps: [{ id: `${id}-step-1`, name: "Step 1", durationMs: 60_000 }],
      },
    ]);
  };

  const leading = (
    <button
      className="text-button"
      disabled={editing && !valid}
      onClick={() => {
        if (!editing) setDraft(structuredClone(state.routines));
        else if (valid && onCommit({ type: "commit-routines", routines }))
          setDraft(null);
      }}
    >
      {editing ? strings.save : strings.edit}
    </button>
  );

  return (
    <Dialog title={strings.manageRoutines} onClose={onClose} leading={leading}>
      <div className="routine-list">
        {routines.map((routine, index) => (
          <div className="routine-row" key={routine.id}>
            {editing ? (
              <>
                <input
                  aria-label={`Routine ${index + 1} name`}
                  value={routine.name}
                  maxLength={50}
                  onChange={(event) =>
                    setDraft(
                      routines.map((item) =>
                        item.id === routine.id
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <button
                  className="icon-button danger-text"
                  disabled={routines.length === 1}
                  aria-label={`Delete ${routine.name}`}
                  onClick={() =>
                    setDraft(routines.filter(({ id }) => id !== routine.id))
                  }
                >
                  ×
                </button>
              </>
            ) : (
              <label>
                <input
                  type="radio"
                  name="active-routine"
                  checked={routine.id === state.activeRoutineId}
                  onChange={() =>
                    onCommit({ type: "select-routine", routineId: routine.id })
                  }
                />
                <span>{routine.name}</span>
              </label>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <button
          className="add-button"
          disabled={routines.length >= 3}
          onClick={addRoutine}
        >
          ＋ {strings.addRoutine}
        </button>
      )}
      {!editing && (
        <section className="preferences">
          <p className="eyebrow">{strings.preferences}</p>
          {(["sound", "vibration"] as const).map((preference) => (
            <label className="setting-row compact" key={preference}>
              <strong>
                {preference === "sound" ? strings.sound : strings.vibration}
              </strong>
              <input
                type="checkbox"
                role="switch"
                checked={state.preferences[preference]}
                onChange={(event) =>
                  onCommit({
                    type: "set-preference",
                    preference,
                    value: event.target.checked,
                  })
                }
              />
            </label>
          ))}
        </section>
      )}
    </Dialog>
  );
}
