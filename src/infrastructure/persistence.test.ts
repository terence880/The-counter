import { describe, expect, it } from "vitest";
import { createDefaultDocument } from "../application/appState";
import { createStateRepository } from "./persistence";
class MemoryStorage { private value: string | null = null; getItem() { return this.value; } setItem(_key: string, value: string) { this.value = value; } }
describe("state repository", () => {
  it("round-trips a complete versioned application document", () => { const repository = createStateRepository(new MemoryStorage()); const document = { ...createDefaultDocument(), revision: 4 }; expect(repository.save(document)).toEqual({ ok: true }); expect(repository.load()).toEqual({ kind: "ready", document }); });
  it("migrates a recognized legacy document before returning it", () => { const storage = new MemoryStorage(); const current = createDefaultDocument(); storage.setItem("ignored", JSON.stringify({ schemaVersion: 0, revision: 3, routines: current.routines, activeRoutineId: current.activeRoutineId, run: current.run, soundEnabled: false })); expect(createStateRepository(storage).load()).toMatchObject({ kind: "ready", document: { schemaVersion: 1, revision: 4, preferences: { sound: false, vibration: true } } }); });
});
