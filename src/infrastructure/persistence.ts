import {
  createDefaultDocument,
  isValidDocument,
  type AppDocument,
} from "../application/appState";

export const STORAGE_KEY = "the-counter:state";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type LoadResult =
  | { kind: "ready"; document: AppDocument }
  | { kind: "recovery"; raw: string; error: string };

export type SaveResult = { ok: true } | { ok: false; error: string };

export type StateRepository = {
  load(): LoadResult;
  save(document: AppDocument): SaveResult;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown storage error";

export function createStateRepository(
  storage: StorageLike,
  key = STORAGE_KEY,
): StateRepository {
  return {
    load() {
      const raw = storage.getItem(key);
      if (raw === null)
        return { kind: "ready", document: createDefaultDocument() };
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed.schemaVersion === 0) {
          const migrated: AppDocument = {
            schemaVersion: 1,
            revision:
              typeof parsed.revision === "number" ? parsed.revision + 1 : 1,
            routines: parsed.routines as AppDocument["routines"],
            activeRoutineId: parsed.activeRoutineId as string,
            run: parsed.run as AppDocument["run"],
            preferences: {
              sound:
                typeof parsed.soundEnabled === "boolean"
                  ? parsed.soundEnabled
                  : true,
              vibration: true,
            },
          };
          if (!isValidDocument(migrated))
            return {
              kind: "recovery",
              raw,
              error: "Legacy saved data is invalid.",
            };
          storage.setItem(key, JSON.stringify(migrated));
          return { kind: "ready", document: migrated };
        }
        if (parsed.schemaVersion !== 1)
          return {
            kind: "recovery",
            raw,
            error: "This saved-data version is not supported.",
          };
        const current = parsed as unknown as AppDocument;
        if (!isValidDocument(current))
          return { kind: "recovery", raw, error: "Saved data is invalid." };
        return { kind: "ready", document: current };
      } catch (error) {
        return { kind: "recovery", raw, error: errorMessage(error) };
      }
    },
    save(document) {
      try {
        storage.setItem(key, JSON.stringify(document));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: errorMessage(error) };
      }
    },
  };
}
