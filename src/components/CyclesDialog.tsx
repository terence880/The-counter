import type { Routine } from "../domain/types";
import { strings } from "../strings";
import { Dialog } from "./Dialog";

type CyclesDialogProps = {
  routine: Routine;
  onClose(): void;
  onChange(cycles: number): void;
};

export function CyclesDialog({
  routine,
  onClose,
  onChange,
}: CyclesDialogProps) {
  const enabled = routine.cycles > 1;

  return (
    <Dialog title={strings.cycles} onClose={onClose}>
      <div className="setting-row">
        <div>
          <strong>Repeat routine</strong>
          <p>Run every timed step more than once.</p>
        </div>
        <input
          aria-label="Enable cycles"
          type="checkbox"
          role="switch"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked ? 2 : 1)}
        />
      </div>
      <label className="field cycle-field">
        <span>Total cycles</span>
        <select
          disabled={!enabled}
          value={enabled ? routine.cycles : 2}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {Array.from({ length: 19 }, (_, index) => index + 2).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
    </Dialog>
  );
}
