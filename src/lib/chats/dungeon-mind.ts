import "server-only";

import type { ChatMessage, ChatSettings, Storyline } from "@/types/isekaizero";
import { dungeonMindPrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import { authHeaders, fetchWithRetry, providerErrorMessage, reasoningParams, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import { runServerTool, type ToolEvents, type ToolState } from "./server-tools";

const MAX_DM_ROUNDS = 4;
const DM_MAX_TOKENS = 1200;
/** A ruling that only declines (no tools used) means the DM model refused the scene; the story model takes over. */
const REFUSAL = /^(i('m| am) (sorry|not able|unable)|i can(no|')t|i won'?t|sorry,? (but )?i)/i;

interface Completion {
  choices?: { message?: { content?: string | null; tool_calls?: { id?: string; type?: string; function?: { name?: string; arguments?: string } }[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
}

export interface DungeonMindResult {
  ruling: string;
  state: ToolState;
  usage: { promptTokens: number; completionTokens: number; cost?: number };
}

/**
 * Isekai Zero's Dungeon Mind: a separate tool-reliable model (default Claude Haiku) resolves the player's action
 * BEFORE the story model writes: dice, sheet changes, records. Its tool results land in `events` and the returned
 * state; the ruling is handed to the story model. Throws when the call fails or the model refuses, so the caller
 * can fall back to letting the story model use the tools.
 */
export async function runDungeonMind(opts: {
  ctx: ProviderContext;
  model: string;
  storyline: Storyline;
  history: ChatMessage[];
  settings: ChatSettings;
  state: ToolState;
  events: ToolEvents;
  signal?: AbortSignal;
}): Promise<DungeonMindResult> {
  const prompt = dungeonMindPrompt(opts.storyline, opts.history, opts.settings, opts.state.codex);
  let messages: unknown[] = prompt.messages;
  let state = opts.state;
  let usedTools = false;
  const usage = { promptTokens: 0, completionTokens: 0, cost: undefined as number | undefined };
  for (let round = 0; round < MAX_DM_ROUNDS; round++) {
    const res = await fetchWithRetry(`${opts.ctx.baseUrl}/chat/completions`, {
      method: "POST",
      headers: authHeaders(opts.ctx),
      body: JSON.stringify({ model: opts.model, messages, tools: prompt.tools, temperature: 0.3, max_tokens: DM_MAX_TOKENS, stream: false, ...reasoningParams(opts.ctx, false) }),
      signal: opts.signal,
    });
    if (!res.ok) throw new Error(await providerErrorMessage(res));
    const json = (await res.json()) as Completion;
    usage.promptTokens += json.usage?.prompt_tokens ?? 0;
    usage.completionTokens += json.usage?.completion_tokens ?? 0;
    if (typeof json.usage?.cost === "number") usage.cost = (usage.cost ?? 0) + json.usage.cost;
    const message = json.choices?.[0]?.message;
    const calls = (message?.tool_calls ?? [])
      .filter((c) => c.function?.name)
      .map((c, i) => ({ id: c.id || `dm_${round}_${i}`, type: "function" as const, function: { name: c.function!.name!, arguments: c.function!.arguments ?? "{}" } }));
    const text = (message?.content ?? "").trim();
    if (calls.length === 0) {
      if (!usedTools && REFUSAL.test(text)) throw new Error(`the Dungeon Mind model declined this scene ("${text.slice(0, 80)}")`);
      return { ruling: text || "No ruling.", state, usage };
    }
    usedTools = true;
    const results = calls.map((call) => {
      const ran = runServerTool(call.function.name, call.function.arguments, opts.storyline, state, opts.events);
      state = ran.state;
      return { role: "tool", tool_call_id: call.id, content: ran.output };
    });
    messages = [...messages, { role: "assistant", content: message?.content ?? null, tool_calls: calls }, ...results];
  }
  // Out of rounds: what was applied stands; the narrator still needs a summary.
  return { ruling: "Resolve the action from the dice results and sheet changes already recorded this turn.", state, usage };
}
