import type { CodexEvent, DiceRoll, StatChange, Storyline } from "@/types/isekaizero";
import { CODEX_TOOL_NAMES, runCodexTool, type CodexState } from "./codex";
import { DM_TOOL_NAMES, readSheets, rollDice, updateSheets, type Sheets } from "./dm";

/** Tools the turn engine runs itself, feeding results back to the model (the rest go to the client). */
export const SERVER_TOOL_NAMES = new Set<string>([...CODEX_TOOL_NAMES, ...DM_TOOL_NAMES]);

/** Per-chat tool state, loaded before a turn and saved after it. */
export interface ToolState {
  codex: CodexState;
  sheets: Sheets;
}

/** What the tools did during one reply, saved on the message for the player. */
export interface ToolEvents {
  codex: CodexEvent[];
  rolls: DiceRoll[];
  statChanges: StatChange[];
}

export const noEvents = (): ToolEvents => ({ codex: [], rolls: [], statChanges: [] });

/** Runs one server tool call; returns the text for the model and the new state, adding to `events`. */
export function runServerTool(name: string, args: string, storyline: Storyline, state: ToolState, events: ToolEvents, random?: () => number): { output: string; state: ToolState } {
  if ((CODEX_TOOL_NAMES as readonly string[]).includes(name)) {
    const ran = runCodexTool(name, args, storyline.codex ?? [], state.codex);
    events.codex.push(...ran.events);
    return { output: ran.output, state: { ...state, codex: ran.state } };
  }
  if (name === "roll_dice") {
    const ran = rollDice(args, random);
    events.rolls.push(...ran.rolls);
    return { output: ran.output, state };
  }
  if (name === "read_character_stats") return { output: readSheets(args, state.sheets, storyline), state };
  if (name === "update_character_stats") {
    const ran = updateSheets(args, state.sheets, storyline);
    events.statChanges.push(...ran.changes);
    return { output: ran.output, state: { ...state, sheets: ran.sheets } };
  }
  return { output: `Error: ${name} is not a server tool.`, state };
}
