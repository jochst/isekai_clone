/** Game tools a story can turn on (Isekai Zero toolSettings ids; labels from ai-tools.json). */
export const GAME_TOOLS = [
  { id: "dice-roll", label: "Dice Roll", description: "Real dice decide uncertain actions; the roll card shows the result." },
  { id: "stats-manager", label: "Character Stats", description: "Keeps character sheets (stats, inventory, skills) in sync with the story." },
  { id: "character-manager", label: "Character Manager", description: "New characters join the cast; renames, notes and departures are kept for this chat." },
  { id: "character-name-generator", label: "Character Name Generator", description: "Fresh names for new characters, avoiding the commonly reused ones." },
  { id: "story-ending", label: "Story Ending", description: "The AI can end the story with an ending card when it truly concludes." },
  { id: "scene-illustrator", label: "Scene Illustrator", description: "The AI commissions illustrations of key moments." },
] as const;
