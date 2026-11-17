/*
 * The Fatekeeper's tool catalog: every function the story AI or the Fatekeeper (our game master) can call, with our
 * own instructions and descriptions. Tool ids, function names and argument names stay stable because imported
 * stories reference them in their tool settings and saved chats store calls made with them.
 */

export interface OpenAiTool {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

type Schema = Record<string, unknown>;

const str = (description: string, extra: Schema = {}): Schema => ({ type: "string", description, ...extra });
const num = (description: string): Schema => ({ type: "number", description });
const bool = (description: string): Schema => ({ type: "boolean", description });
const list = (description: string, items: Schema, extra: Schema = {}): Schema => ({ type: "array", description, items, ...extra });
const obj = (properties: Record<string, Schema>, required: string[] = []): Schema => ({ type: "object", properties, required });

interface ToolDef {
  id: string;
  label: string;
  /** What the model is told about when to use this tool; the creator can add to it per story. */
  instruction: string;
  functions: { name: string; description: string; parameters: Schema }[];
}

const DIE = { enum: ["d4", "d6", "d8", "d10", "d12", "d20"] };

export const TOOLS = [
  {
    id: "character-name-generator",
    label: "Character Name Generator",
    instruction:
      "When someone new and named joins the story (they speak, act, or will come back), get their name from generate_character_name instead of inventing one, one call per character. Skip it for passing figures like \"a guard\" who need no name, and never stop the story just to name someone.",
    functions: [
      {
        name: "generate_character_name",
        description: "Get a fresh, uncommon name for a new character.",
        parameters: obj(
          {
            gender: str("Who the name is for.", { enum: ["male", "female", "neutral"] }),
            culture: str("Naming tradition or setting flavour, e.g. Nordic, desert empire, space colony."),
            style: str("The feel of the name, e.g. noble, plain, ominous."),
            context: str("One line on who this character is."),
          },
          ["gender"],
        ),
      },
    ],
  },
  {
    id: "dice-roll",
    label: "Dice Roll",
    instruction:
      "Let dice decide anything risky or uncertain: attacks, dodges, persuasion, sneaking, enemy actions against the party. Call roll_dice before you describe the outcome, one roll per character per action, and use a DC when there is a clear target to beat. Narrate what the dice say, good or bad. Don't roll for things that would simply succeed.",
    functions: [
      {
        name: "roll_dice",
        description: "Roll real dice. The server rolls them and reports each total and, when a DC is given, success or failure.",
        parameters: obj(
          {
            rolls: list(
              "The rolls to make, in order.",
              obj(
                {
                  reason: str("What the roll is for, e.g. \"Kael swings at the wolf\"."),
                  die: str("Which die. Default d20.", DIE),
                  characterName: str("Who is rolling."),
                  advantage: str("Roll twice and keep the higher (advantage) or lower (disadvantage).", { enum: ["none", "advantage", "disadvantage"] }),
                  dc: num("The number the total must reach to succeed."),
                  modifier: num("Added to the die, e.g. a stat bonus. Can be negative."),
                  modifierBreakdown: str("Where the modifier comes from, e.g. \"+3 STR, -1 wounded\"."),
                  minor: bool("True for small rolls like damage or loot amounts, shown more quietly."),
                },
                ["reason"],
              ),
            ),
          },
          ["rolls"],
        ),
      },
    ],
  },
  {
    id: "stats-manager",
    label: "Character Stats",
    instruction:
      "Character sheets hold each character's stats, inventory and skills. Read a sheet with read_character_stats before changing it, then record every real change (damage, healing, spent resources, items gained or lost, new skills, conditions) with update_character_stats. Use delta for gains and losses, value to set a stat outright. If a character has no sheet yet, create it with their full starting stats first. The story must match the sheets.",
    functions: [
      {
        name: "read_character_stats",
        description: "Read the current sheets (stats, inventory, skills, notes) for one or more characters.",
        parameters: obj({ characterNames: list("Characters to read.", { type: "string" }) }, ["characterNames"]),
      },
      {
        name: "update_character_stats",
        description: "Change one or more character sheets. Every field is optional except the character's name.",
        parameters: obj(
          {
            changes: list(
              "One entry per character.",
              obj(
                {
                  characterName: str("Whose sheet to change."),
                  reason: str("Why, shown to the player, e.g. \"hit by the troll\"."),
                  reset: bool("Start this sheet over from the default stats."),
                  upsertStats: list(
                    "Stats to add or change.",
                    obj(
                      {
                        name: str("Stat name."),
                        value: str("Set the stat's base value (for depleting stats like HP, the maximum)."),
                        delta: str("Add to or subtract from the current amount, e.g. \"-7\"."),
                        modifier: str("Set the total offset from the base value directly."),
                      },
                      ["name"],
                    ),
                  ),
                  removeStats: list("Extra stats to drop (not stats every sheet tracks).", { type: "string" }),
                  addItems: list("Items gained.", obj({ name: str("Item name."), quantity: num("How many. Default 1."), description: str("Short note."), equipped: bool("Whether it is worn or wielded.") }, ["name"])),
                  removeItems: list("Items lost or used.", obj({ name: str("Item name."), quantity: num("How many. Leave out to remove them all.") }, ["name"])),
                  upsertSkills: list("Skills learned or changed.", obj({ name: str("Skill name."), description: str("What it does.") }, ["name"])),
                  removeSkills: list("Skills lost.", { type: "string" }),
                  custom: str("Replace the sheet's free-form notes."),
                },
                ["characterName"],
              ),
              { minItems: 1, maxItems: 10 },
            ),
          },
          ["changes"],
        ),
      },
    ],
  },
  {
    id: "character-manager",
    label: "Character Manager",
    instruction:
      "Keep the cast list current. Call create_character when a new individual appears who is not already in the cast, edit_character when a name is revealed or someone changes for good, and disable_character only when someone leaves the story permanently (death, departure). Don't add crowds or passing figures.",
    functions: [
      {
        name: "create_character",
        description: "Add a new character to this chat's cast.",
        parameters: obj(
          {
            name: str("Their name, or for an unnamed character a descriptor with where they are, e.g. \"innkeeper (Red Stag)\"."),
            isNamed: bool("Whether the name is a real name rather than a descriptor."),
            extra: bool("A minor background character."),
            gender: str("Gender.", { enum: ["male", "female"] }),
            ageGroup: str("Rough age.", { enum: ["young", "young-adult", "middle-age", "senior"] }),
            description: str("Who they are: personality, role, how they relate to the story."),
            imageDescription: str("What they look like, in plain words."),
            imagePrompt: str("A comma-separated portrait prompt for an image model."),
          },
          ["name", "isNamed", "gender", "ageGroup", "description", "imageDescription", "imagePrompt"],
        ),
      },
      {
        name: "edit_character",
        description: "Rename a character or note a lasting change about them.",
        parameters: obj(
          {
            characterName: str("Their current name in the cast."),
            newName: str("Their new or revealed name."),
            characterNote: str("A lasting change worth remembering."),
            extra: bool("Mark them as a minor background character, or not."),
          },
          ["characterName"],
        ),
      },
      {
        name: "disable_character",
        description: "Write a character out of the story for good.",
        parameters: obj({ characterName: str("Who leaves."), reason: str("Why, e.g. \"killed at the bridge\".") }, ["characterName", "reason"]),
      },
    ],
  },
  {
    id: "codex",
    label: "Codex",
    instruction:
      "The codex is this story's reference book. Its index lists each entry with a short description. Before writing about something an entry covers, call read_codex for it, and never contradict what an entry says. When the story changes something an entry tracks (a quest step, a relationship, an event), update it; prefer small edits over rewriting long entries. Create entries only for new things the story will need again.",
    functions: [
      {
        name: "read_codex",
        description: "Read full codex entries by slug.",
        parameters: obj({ slugs: list("Entry slugs from the index.", { type: "string" }) }, ["slugs"]),
      },
      {
        name: "update_codex",
        description: "Change an entry: send edits for small changes, or content to replace it.",
        parameters: obj(
          {
            slug: str("The entry to change."),
            edits: list("Find-and-replace edits.", obj({ oldText: str("Exact text currently in the entry."), newText: str("What replaces it.") }, ["oldText", "newText"])),
            content: str("The entry's whole new text."),
          },
          ["slug"],
        ),
      },
      {
        name: "create_codex",
        description: "Add a new codex entry.",
        parameters: obj(
          {
            title: str("Entry title."),
            description: str("One line saying what the entry covers and when to read it."),
            content: str("The entry text."),
            category: str("Kind of entry.", {
              enum: ["lore", "character", "location", "faction", "item", "event", "rule", "record", "quest", "achievement", "relationship", "technology", "creature", "ability", "document"],
            }),
          },
          ["title", "description", "content"],
        ),
      },
      {
        name: "delete_codex",
        description: "Remove an entry created during this chat that no longer applies.",
        parameters: obj({ slug: str("The entry to remove.") }, ["slug"]),
      },
    ],
  },
  {
    id: "story-ending",
    label: "Story Ending",
    instruction:
      "If this reply truly concludes the story (the main conflict is over, or the protagonist's journey ends), finish the final scene and call end_story. Don't end the story for a setback the player could still recover from.",
    functions: [
      {
        name: "end_story",
        description: "Mark the story as finished and show the ending card.",
        parameters: obj(
          {
            title: str("A short name for this ending."),
            endingType: str("The ending's tone.", { enum: ["happy", "bittersweet", "tragic", "neutral", "true", "secret"] }),
            epilogue: str("An optional few lines on what happened afterwards."),
          },
          ["title", "endingType"],
        ),
      },
    ],
  },
  {
    id: "scene-illustrator",
    label: "Scene Illustrator",
    instruction:
      "At a striking moment (a reveal, a new place, a big fight, an emotional beat) you may call illustrate_scene once in the reply to have it drawn. Describe what the image shows, not the story around it. Don't illustrate every reply.",
    functions: [
      {
        name: "illustrate_scene",
        description: "Have the current moment drawn as an illustration.",
        parameters: obj(
          {
            description: str("What the picture shows: setting, action, mood, framing."),
            characters: list("Cast members visible in the picture.", { type: "string" }),
            perspective: str("Camera view.", { enum: ["third-person", "pov"] }),
            continuePrevious: bool("Keep the look of the previous illustration."),
          },
          ["description", "characters"],
        ),
      },
    ],
  },
] as const satisfies readonly ToolDef[];

export type AiToolId = (typeof TOOLS)[number]["id"];

export function toolFunction(name: string): OpenAiTool {
  for (const tool of TOOLS as readonly ToolDef[]) {
    const fn = tool.functions.find((f) => f.name === name);
    if (fn) return { type: "function", function: { name: fn.name, description: fn.description, parameters: fn.parameters } };
  }
  throw new Error(`Unknown AI tool function: ${name}`);
}

export function toolInstruction(id: AiToolId): string {
  return (TOOLS as readonly ToolDef[]).find((t) => t.id === id)?.instruction ?? "";
}

/** The Fatekeeper's own closing call: how this turn's action was resolved. Ends its run. */
export const GIVE_RULING_TOOL: OpenAiTool = {
  type: "function",
  function: {
    name: "give_ruling",
    description: "Finish your turn: say how the player's action was resolved. Call this once, last.",
    parameters: obj(
      {
        verdict: str(
          "resolved: the action happened and its mechanics are applied. rejected: it can't happen under the rules or the situation. ask_player: you need a choice or detail from the player before it can be resolved. none: nothing needed resolving.",
          { enum: ["resolved", "rejected", "ask_player", "none"] },
        ),
        summary: str("For the narrator, under 80 words: each outcome with its numbers and every sheet change. For rejected, why it can't happen."),
        question: str("For ask_player: the question to put to the player."),
      },
      ["verdict", "summary"],
    ),
  },
};
