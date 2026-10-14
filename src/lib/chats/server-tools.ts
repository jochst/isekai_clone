import type { CastEvent, CodexEvent, DiceRoll, StatChange, StoryEnding, Storyline } from "@/types/isekaizero";
import { CAST_TOOL_NAMES, generateName, readEnding, runCastTool, withChatCast, type ChatCast } from "./cast";
import { CODEX_TOOL_NAMES, runCodexTool, type CodexState } from "./codex";
import { DM_TOOL_NAMES, readSheets, rollDice, updateSheets, type Sheets } from "./dm";

/** Tools the turn engine runs itself, feeding results back to the model (the rest go to the client). */
export const SERVER_TOOL_NAMES = new Set<string>([...CODEX_TOOL_NAMES, ...DM_TOOL_NAMES, ...CAST_TOOL_NAMES, "end_story", "generate_character_name"]);

/** Server tools the client also needs to see: a created character's portrait is drawn in the browser. */
export const ALSO_CLIENT_TOOLS = new Set(["create_character"]);

/** Per-chat tool state, loaded before a turn and saved after it. */
export interface ToolState {
  codex: CodexState;
  sheets: Sheets;
  cast: ChatCast;
}

/** What the tools did during one reply, saved on the message for the player. */
export interface ToolEvents {
  codex: CodexEvent[];
  rolls: DiceRoll[];
  statChanges: StatChange[];
  cast: CastEvent[];
  ending?: StoryEnding;
}

export const noEvents = (): ToolEvents => ({ codex: [], rolls: [], statChanges: [], cast: [] });

/**
 * Runs one server tool call; returns the text for the model and the new state, adding to `events`. `storyline` is
 * the story as written; the chat's cast changes are applied here so tools see who is in play now.
 */
export function runServerTool(name: string, args: string, storyline: Storyline, state: ToolState, events: ToolEvents, random?: () => number): { output: string; state: ToolState } {
  const inPlay = withChatCast(storyline, state.cast);
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
  if (name === "read_character_stats") return { output: readSheets(args, state.sheets, inPlay), state };
  if (name === "update_character_stats") {
    const ran = updateSheets(args, state.sheets, inPlay);
    events.statChanges.push(...ran.changes);
    return { output: ran.output, state: { ...state, sheets: ran.sheets } };
  }
  if ((CAST_TOOL_NAMES as readonly string[]).includes(name)) {
    const ran = runCastTool(name, args, storyline, state.cast);
    events.cast.push(...ran.events);
    return { output: ran.output, state: { ...state, cast: ran.cast } };
  }
  if (name === "end_story") {
    const ending = readEnding(args);
    if (!ending) return { output: "Error: give the ending a title.", state };
    events.ending = ending;
    return { output: `The story has ended: "${ending.title}". Write nothing more after the final scene.`, state };
  }
  if (name === "generate_character_name") {
    const used = [...inPlay.characters.map((c) => c.name), ...state.cast.map((m) => m.name)];
    return { output: generateName(args, used, random), state };
  }
  return { output: `Error: ${name} is not a server tool.`, state };
}
