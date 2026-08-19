# Interval Timer

An offline-first timer for running reusable routines made of ordered timed steps.

## Language

**Routine**:
A named, ordered collection of timed steps that run one after another and may repeat.
_Avoid_: Counter set, type of counter, preset

**Timed Step**:
A named duration within a routine.
_Avoid_: Counter, timer

**Active Routine**:
The routine currently selected for viewing or running.
_Avoid_: Enabled counter, selected counter set

**Cycle**:
One complete passage through every timed step in a routine. A routine's cycle count is the total number of passages, including the first.
_Avoid_: Loop, repeat

**Run**:
One execution of a routine through its configured number of cycles.
_Avoid_: Session, active timer

**Ready**:
The state of a routine with no run progress, displaying the first timed step at its full duration.

**Running**:
The state of a run whose timed steps advance according to real elapsed time.

**Paused**:
The state of an unfinished run whose remaining time is preserved but does not advance.

**Completed**:
The state reached after the final timed step of the final cycle reaches zero.
_Avoid_: Finished, stopped
