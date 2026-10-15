import "server-only";

import type { ChatMessage, ChatSettings, Storyline } from "@/types/isekaizero";
import { castKeeperPrompt, dungeonMindPrompt } from "@/lib/sites/isekaizero-ai-0e4f18da/prompt-builder";
import type { OpenAiTool } from "@/lib/sites/isekaizero-ai-0e4f18da/ai-tools";
import { authHeaders, fetchWithRetry, providerErrorMessage, reasoningParams, type ProviderContext } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";
import { withChatCast } from "./cast";
import { runServerTool, type ToolEvents, type ToolState } from "./server-tools";

const MAX_ROUNDS = 4;
const MAX_TOKENS = 1200;
/** An answer that only declines (no tools used) means the model refused the scene; the story model takes over. */
const REFUSAL = /^(i('m| am) (sorry|not able|unable)|i can(no|')t|i won'?t|sorry,? (but )?i)/i;

interface Completion {
  choices?: { message?: { content?: string | null; tool_calls?: { id?: string; type?: string; function?: { name?: string; arguments?: string } }[] } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
}

export interface AgentResult {
  text: string;
  state: ToolState;
  usage: { promptTokens: number; completionTokens: number; cost?: number };
}

interface AgentOptions {
  ctx: ProviderContext;
  model: string;
  storyline: Storyline;
  settings: ChatSettings;
  state: ToolState;
  events: ToolEvents;
  signal?: AbortSignal;
}

/** One tool-using helper call: up to 4 non-streaming rounds, server tools run between them. Throws on refusal. */
async function runAgent(opts: AgentOptions, request: { messages: unknown[]; tools: OpenAiTool[] }): Promise<AgentResult> {
  let messages = request.messages;
  let state = opts.state;
  let usedTools = false;
  const usage = { promptTokens: 0, completionTokens: 0, cost: undefined as number | undefined };
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetchWithRetry(`${opts.ctx.baseUrl}/chat/completions`, {
      method: "POST",
      headers: authHeaders(opts.ctx),
      body: JSON.stringify({ model: opts.model, messages, tools: request.tools, temperature: 0.3, max_tokens: MAX_TOKENS, stream: false, ...reasoningParams(opts.ctx, false) }),
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
      if (!usedTools && REFUSAL.test(text)) throw new Error(`the model declined this scene ("${text.slice(0, 80)}")`);
      return { text, state, usage };
    }
    usedTools = true;
    const results = calls.map((call) => {
      const ran = runServerTool(call.function.name, call.function.arguments, opts.storyline, state, opts.events);
      state = ran.state;
      return { role: "tool", tool_call_id: call.id, content: ran.output };
    });
    messages = [...messages, { role: "assistant", content: message?.content ?? null, tool_calls: calls }, ...results];
  }
  // Out of rounds: what was applied stands.
  return { text: "", state, usage };
}

/**
 * Isekai Zero's Dungeon Mind: a separate tool-reliable model (default Claude Haiku) resolves the player's action
 * BEFORE the story model writes: dice, sheet changes, records. Returns the ruling handed to the story model. Throws
 * when the call fails or the model refuses, so the caller can let the story model use the tools instead.
 */
export async function runDungeonMind(opts: AgentOptions & { history: ChatMessage[] }): Promise<AgentResult & { ruling: string }> {
  // The DM sees the cast as it stands in this chat (characters the AI created, renamed or wrote out).
  const prompt = dungeonMindPrompt(withChatCast(opts.storyline, opts.state.cast), opts.history, opts.settings, opts.state.codex);
  const result = await runAgent(opts, prompt);
  return { ...result, ruling: result.text || "Resolve the action from the dice results and sheet changes already recorded this turn." };
}

/**
 * After the reply: the same model keeps the cast (create/edit/disable_character) and calls end_story if the reply is
 * the definitive ending, for story models that don't use those tools themselves, and records codex changes (the story
 * model only reads the codex when a keeper is on). `castDone`: the story model kept the cast; only the codex is left.
 * Throws on failure or refusal.
 */
export async function runCastKeeper(opts: AgentOptions & { reply: string; castDone?: boolean }): Promise<AgentResult> {
  const prompt = castKeeperPrompt(withChatCast(opts.storyline, opts.state.cast), opts.reply, opts.settings, opts.state.codex, opts.castDone);
  if (prompt.tools.length === 0) return { text: "", state: opts.state, usage: { promptTokens: 0, completionTokens: 0 } };
  return runAgent(opts, prompt);
}
