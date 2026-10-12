import AI_TOOLS from "./ai-tools.json";

/**
 * Isekai Zero's real AI tool definitions, verbatim from the public `GET api-global.isekaizero.ai/api/ai-tools`
 * (captured 2026-10-12). Each tool has a system-prompt instruction and one or more OpenAI-style functions.
 */
export type AiToolId = (typeof AI_TOOLS)[number]["id"];

export interface OpenAiTool {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export function toolFunction(name: string): OpenAiTool {
  for (const tool of AI_TOOLS) {
    const fn = tool.functions.find((f) => f.name === name);
    if (fn) return { type: "function", function: { name: fn.name, description: fn.description, parameters: fn.parameters } };
  }
  throw new Error(`Unknown AI tool function: ${name}`);
}

export function toolInstruction(id: AiToolId): string {
  return AI_TOOLS.find((t) => t.id === id)?.instruction ?? "";
}
