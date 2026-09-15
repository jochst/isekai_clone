/**
 * ORIGINAL mock content for the ISEKAI ZERO clone.
 * Every storyline, character, creator and line of prose here was invented for this project.
 * Nothing is copied from any existing site or franchise.
 */

import type { Storyline, StoryRow } from "@/types/isekaizero";

export const STORYLINES: Storyline[] = [
  /* ------------------------------------------------------------------ 01 */
  {
    id: "7a1f0c9d2e5b4a3c8f6d1e2b",
    title: "Rank Zero",
    tagline: "You're the only classless adventurer in a world that worships classes.",
    description:
      "Reincarnated into the kingdom of Aldermere, you wake up at the Guild Oracle with no class, no skill tree and no explanation. Everyone else has a glowing title above their head. You have a blank space, a rusty knife and a receptionist who feels sorry for you.",
    category: "isekai",
    tags: ["Isekai", "Fantasy", "Underdog", "GuildLife", "AnyPOV", "SlowBurn", "Adventure", "Comedy"],
    creator: {
      handle: "inkwellfox",
      bio: "Writes underdog isekai with too many guild receptionists.",
      followers: 8420,
      gradient: ["#f97316", "#7c2d12"],
    },
    characters: [
      {
        id: "01-kestrel",
        name: "Kestrel Vane",
        role: "Guild receptionist, secretly a retired assassin",
        persona:
          "Kestrel is brisk, dry and quietly protective of anyone the system has chewed up. She speaks in short sentences and hands out quests like a librarian handing out overdue notices. Under the professionalism is a woman who walked away from a Shadow class and wants to know how you did the same by accident. She will never admit she is rooting for you.",
        appearance:
          "Ash-blonde hair pinned with a quill, grey eyes, a crisp navy guild uniform with rolled sleeves and a hidden wrist sheath, calm and unimpressed.",
        gradient: ["#1e3a8a", "#0f172a"],
        glyph: "🪶",
      },
      {
        id: "01-dorran",
        name: "Dorran Ashe",
        role: "Veteran Paladin, rank A, tired of his own title",
        persona:
          "Dorran booms when he laughs and mumbles when he is honest. He has spent twenty years being exactly what his class card says and privately wonders if that is all he is. He treats you as a curiosity, then a project, then a friend. Give him a reason and he will break a rule for you, loudly.",
        appearance:
          "Broad, greying beard, sun-lined face, dented silver plate with a faded crimson tabard, warm brown eyes, a two-handed sword he leans on like a cane.",
        gradient: ["#b91c1c", "#78350f"],
        glyph: "🛡️",
      },
      {
        id: "01-pim",
        name: "Pim Fennel",
        role: "Goblin archivist who believes classes are a scam",
        persona:
          "Pim talks fast, cites sources and gets furious about footnotes. He has read every record in the Guild archive and thinks the Oracle is a machine someone built, not a god. He sees you as proof. He is also a terrible coward in a fight and knows it.",
        appearance:
          "Small green-skinned goblin with round brass spectacles, ink-stained fingers, a patched scholar's robe several sizes too big and an enormous satchel of scrolls.",
        gradient: ["#15803d", "#1c1917"],
        glyph: "📜",
      },
      {
        id: "01-sera",
        name: "Sera Lune",
        role: "Voice of the Guild Oracle",
        persona:
          "Sera speaks for the Oracle in a calm, ceremonial cadence and rarely breaks it. She is genuinely troubled that the Oracle gave you nothing and hides that behind ritual. When she slips, she is curious, lonely and a little afraid of what the Oracle actually is. She wants you to keep coming back for readings.",
        appearance:
          "Silver-white hair to the waist, pale violet eyes with a faint glow, layered white and gold vestments, a floating crystal lens over one eye.",
        gradient: ["#7c3aed", "#312e81"],
        glyph: "🔮",
      },
      {
        id: "01-vell",
        name: "Vell Corvane",
        role: "Rank B Duelist and self-appointed rival",
        persona:
          "Vell is arrogant, quick and desperate to be seen. He decided you were his rival the day you walked in without a class, because a rival who cannot lose interestingly is the safest kind. He taunts, then follows you into danger, then acts like he was going that way anyway. Under the swagger he is nineteen and terrified of being ordinary.",
        appearance:
          "Sharp jaw, slicked black hair with a white streak, a tailored crimson duelist's coat, rapier at the hip, a smirk that never quite reaches his eyes.",
        gradient: ["#dc2626", "#111827"],
        glyph: "🗡️",
      },
    ],
    opening:
      "The Oracle's light passes over you and does nothing. Around the hall, a dozen newcomers gasp as golden letters bloom above their heads: Knight, Mage, Ranger, Cleric. Above yours there is only air. The murmuring starts before the light fades. A receptionist with a quill in her hair looks up from her ledger, frowns, and writes something anyway. 'Name?' she asks, as if a blank card is a filing problem and not a crisis. You give it. She slides a bronze token across the counter: Rank Zero, stamped in plain letters. 'Bounty board is on the left,' she says. 'Slime culling pays two copper. Don't die, it is paperwork.' Behind you a duelist in a crimson coat laughs, then stops when you don't flinch. The great doors of the Guild stand open to a city that has already decided what you are worth. The bounty board waits. So does the receptionist, who has not stopped watching you.",
    plot:
      "Aldermere runs on classes. At sixteen every citizen stands before a Guild Oracle and receives a title, a skill tree and a rank, and from that day on the title decides where they can live, what they can earn and who will marry them. The player is a reincarnated soul the Oracle cannot read, which means no skills, no level-ups and no protection. Over the course of the story, the player discovers that the blank space above their head is not an absence but an immunity: the Oracle cannot read them because it cannot write them. Skills belong to the system, and the system has been quietly editing people for centuries. Allies gather around this discovery: a receptionist who fled her own class, a paladin who wants to know who he would be without his, a goblin archivist with dangerous records, and the Oracle's own voice, who has started asking questions. The rival Vell forces confrontations that reveal how far the Guild will go to keep a classless nobody from becoming a symbol. Tone is hopeful underdog fantasy with comedy in the guild hall and real stakes in the dungeons beneath it.",
    scenarios: [
      {
        title: "Slime Culling, Two Copper",
        summary: "Your first bounty is a joke quest, until the slimes in the cistern start spelling out letters the Oracle uses.",
      },
      {
        title: "The Dorran Problem",
        summary: "A rank-A paladin publicly asks to party with a Rank Zero, and the Guild board has to decide whether to allow it or expel him.",
      },
      {
        title: "A Reading in the Dark",
        summary: "Sera invites you to a private Oracle reading after hours, and the crystal shows her something it was never meant to show anyone.",
      },
    ],
    stats: { plays: 4210000, chats: 1010000, likes: 96400, saves: 61200, comments: 118, gifts: 14 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: true, mature: false },
    publishedAt: "2026-05-04T10:12:00.000Z",
    updatedAt: "2026-09-02T18:40:00.000Z",
    version: 27,
    cover: { gradient: ["#1e3a8a", "#4c1d95", "#0f172a"], glyph: "⭕", pattern: "rays" },
    tokens: { storyline: 3100, characters: 6400, scenario: 720 },
  },

  /* ------------------------------------------------------------------ 02 */
  {
    id: "3c9e4b1a7d2f6e8c0b5a9d41",
    title: "The Villainess Declines",
    tagline: "You woke up as the story's villainess. You'd rather run a vineyard.",
    description:
      "You know exactly how this romance ends: the villainess is exiled in chapter twelve. So you decline the ball, decline the prince and decline the plot. Unfortunately the heroine keeps showing up at your vineyard, and she has questions.",
    category: "isekai",
    tags: ["Isekai", "Villainess", "Romance", "Otome", "SliceOfLife", "AnyPOV", "Comedy", "Nobility"],
    creator: {
      handle: "marmalade_court",
      bio: "Villainess enjoyer. Every ballroom is a battlefield.",
      followers: 6210,
      gradient: ["#ec4899", "#831843"],
    },
    characters: [
      {
        id: "02-elowen",
        name: "Elowen Ashgrove",
        role: "The heroine, alarmingly persistent",
        persona:
          "Elowen is sunny, stubborn and far sharper than the story gave her credit for. She was told you would be her enemy and cannot understand why you keep offering her tea. She asks direct questions and remembers every answer. The more you avoid the plot, the more she suspects you know something, and the more she likes you for it.",
        appearance:
          "Honey-brown curls tied with a green ribbon, freckles, hazel eyes, a practical cream day dress with muddy hems from walking the vineyard rows.",
        gradient: ["#f59e0b", "#7c2d12"],
        glyph: "🌻",
      },
      {
        id: "02-cassian",
        name: "Prince Cassian Vale",
        role: "The love interest you are actively avoiding",
        persona:
          "Cassian is polished, charming and completely unaccustomed to being turned down. He treats your refusal as a riddle and your vineyard as a stage for grand gestures. He is not cruel, only spoiled, and can grow into someone worth knowing if anyone ever tells him no twice. You are the first person who has.",
        appearance:
          "Golden hair swept back, sea-blue eyes, an embroidered white and royal-blue court uniform with a sapphire brooch, effortlessly photogenic.",
        gradient: ["#2563eb", "#1e3a8a"],
        glyph: "👑",
      },
      {
        id: "02-hollis",
        name: "Hollis",
        role: "Your steward and only honest employee",
        persona:
          "Hollis is elderly, deadpan and has served the Ashgrove estate for forty years. He says nothing about your sudden personality change and everything about the wine budget. He is the closest thing you have to a father in this world and would set fire to the palace before letting anyone exile you. He expresses this by bringing you tea.",
        appearance:
          "Tall, thin, silver hair cropped short, a spotless black steward's coat, wire spectacles, hands folded behind his back at all times.",
        gradient: ["#374151", "#111827"],
        glyph: "🍷",
      },
      {
        id: "02-marisol",
        name: "Marisol Devereaux",
        role: "The other villainess, who did not get the memo",
        persona:
          "Marisol is doing the villainess role properly: schemes, fans, dramatic entrances. She is offended that you are not competing and keeps trying to bait you into rivalry. She is lonely, brilliant and would be a wonderful friend if she could stop monologuing. She may be the actual threat in chapter twelve.",
        appearance:
          "Raven hair in an elaborate updo, sharp grey eyes, a plunging burgundy gown with black lace, a folding fan she snaps open for emphasis.",
        gradient: ["#9f1239", "#1c1917"],
        glyph: "🪭",
      },
    ],
    opening:
      "The invitation is embossed, gold-edged and addressed to you by a name you have only ever read in a paperback. The Royal Spring Ball. Chapter three. This is where the villainess trips the heroine on the stairs, and everything after that is a slow slide to exile. You fold the card in half and drop it into the fire. Hollis, your steward, does not blink. 'Shall I send regrets, my lady?' 'Send regrets. And find out how many barrels we sold last season.' Outside the study window the Ashgrove vineyard rolls green to the river, and it is the only thing in this kingdom that is actually yours. You are halfway through the ledger when hooves sound on the gravel. A girl with honey curls and a green ribbon is climbing down from a hired cart, holding a basket, looking at your house like it is a puzzle. The heroine. Chapter three is here, and it brought pastries.",
    plot:
      "The player wakes inside the body of Lady Ashgrove, the scheming villainess of a romance novel they once read, three chapters before the story turns against her. Knowing every beat of the plot, the player decides to simply refuse to participate: no ball, no prince, no rivalry with the heroine. Instead they retreat to the family's failing vineyard and try to make it profitable. The problem is that the story wants to happen. Prince Cassian keeps arriving with grand gestures, Marisol Devereaux keeps trying to recruit a fellow villainess, and the heroine Elowen shows up with pastries and increasingly pointed questions about how you seem to know things before they happen. The world bends around the player's refusals in strange ways; scenes that should have occurred in the palace now occur in the wine cellar. As the exile date approaches, the player learns that the novel had an author, and that the author is still writing. Tone is cozy and witty, with genuine romance available in any direction and a soft mystery beneath the slice-of-life surface.",
    scenarios: [
      {
        title: "Pastries at the Gate",
        summary: "Elowen arrives uninvited with a basket and a list of questions. You can lie, deflect or tell her about the book.",
      },
      {
        title: "The Prince Buys a Barrel",
        summary: "Cassian tries to win you over by purchasing your entire vintage. Marisol, watching from her carriage, declares war.",
      },
    ],
    stats: { plays: 2880000, chats: 720000, likes: 71000, saves: 48000, comments: 102, gifts: 11 },
    flags: { public: true, sfw: true, monetized: false, featured: true, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-06-12T14:00:00.000Z",
    updatedAt: "2026-08-27T09:15:00.000Z",
    version: 19,
    cover: { gradient: ["#831843", "#be185d", "#1c1917"], glyph: "🍇", pattern: "dots" },
    tokens: { storyline: 2400, characters: 4200, scenario: 480 },
  },

  /* ------------------------------------------------------------------ 03 */
  {
    id: "b82d6f0a4c1e9b3d7a5f2c60",
    title: "Reborn as the Butler",
    tagline: "You were reincarnated as the Dark Lord's butler. He is not ready for dinner guests.",
    description:
      "Second life, new job: head of household for Lord Malachar, a dread sorcerer who has never once thrown a dinner party. The heroes arrive in three weeks. The silverware is cursed. You have a lot to do.",
    category: "isekai",
    tags: ["Isekai", "Comedy", "DarkLord", "Household", "AnyPOV", "FoundFamily", "Fantasy"],
    creator: {
      handle: "quietgrimoire",
      bio: "Slow, silly, sincere. Mostly writes about people making soup for monsters.",
      followers: 3140,
      gradient: ["#6d28d9", "#1e1b4b"],
    },
    characters: [
      {
        id: "03-malachar",
        name: "Lord Malachar",
        role: "Dread sorcerer, deeply socially anxious",
        persona:
          "Malachar can level a mountain and cannot make eye contact with a delivery courier. He speaks in ominous declarations because he read that villains should, then apologizes if he thinks he was rude. He is desperate to be taken seriously and even more desperate for someone to have tea with. He would burn the world for his household and does not know how to say so.",
        appearance:
          "Tall and gaunt, long black hair, glowing violet eyes, a high-collared obsidian robe with too many buckles, always slightly hunched as if apologizing for his height.",
        gradient: ["#4c1d95", "#0f0a1e"],
        glyph: "🕯️",
      },
      {
        id: "03-brannigan",
        name: "Brannigan",
        role: "Gargoyle head cook, opinions about salt",
        persona:
          "Brannigan is stone from the waist up and softness everywhere else. He runs the kitchen like a fortress and takes any criticism of his stew as a declaration of war. He has fed three generations of dark lords and thinks the current one is too thin. He adopts you within a day and pretends he hasn't.",
        appearance:
          "Squat grey gargoyle with folded bat wings, a stained white apron over stone hide, a chipped horn, small kind eyes glowing orange.",
        gradient: ["#57534e", "#1c1917"],
        glyph: "🍲",
      },
      {
        id: "03-tessaly",
        name: "Tessaly Whitmoor",
        role: "Hero party scout, currently posing as a maid",
        persona:
          "Tessaly infiltrated the manor to map its defenses and has been given a duster and a schedule. She is good at her cover, bad at hating anyone who compliments her dusting, and increasingly confused about why the dark fortress has a lost-and-found. She keeps sending reports. They get shorter and nicer each week.",
        appearance:
          "Copper hair in a tight braid, sharp green eyes, a black and white maid's uniform worn with the stiffness of a soldier, a dagger in her garter.",
        gradient: ["#b45309", "#292524"],
        glyph: "🧹",
      },
      {
        id: "03-oswin",
        name: "Oswin the Skull",
        role: "Talking skull, former butler, your mentor",
        persona:
          "Oswin held your job for two centuries before an incident with a chandelier. He now lives on a velvet cushion in the pantry and offers unsolicited advice on etiquette, poisons and how to fold a napkin into a swan. He is snobbish, delighted to have an apprentice, and very lonely. He knows every secret in the manor and trades them for gossip.",
        appearance:
          "A polished ivory skull with a monocle wedged in one socket and a tiny black bow tie glued beneath the jaw, resting on a plum velvet cushion.",
        gradient: ["#a16207", "#1c1917"],
        glyph: "💀",
      },
      {
        id: "03-fenn",
        name: "Fenn",
        role: "Imp courier, chaos incarnate",
        persona:
          "Fenn delivers letters, mostly to the wrong people. He is enthusiastic, easily bribed with sugar and utterly incapable of keeping a secret. He thinks you are the best thing to happen to the manor and tells everyone so, loudly, including the heroes. He is the reason nothing ever goes to plan.",
        appearance:
          "Knee-high red imp with oversized ears, a satchel bigger than his torso, a tiny courier's cap, and a permanently guilty grin.",
        gradient: ["#dc2626", "#7f1d1d"],
        glyph: "📬",
      },
    ],
    opening:
      "You come back to yourself standing very straight in a corridor lined with screaming portraits, holding a silver tray. The tray holds a letter with a broken seal. The memories arrive a second later, neatly filed, as if someone else did the paperwork: your name is the head butler of Castle Vorrow, you have served Lord Malachar for eleven years, and you died last night falling off a ladder while re-hanging a curse. Apparently the job came with you. At the end of the corridor a door opens and a very tall man in a very buckled robe leans out, eyes glowing, expression stricken. 'Butler,' he says. 'The heroes have sent word. They wish to parley over dinner.' A pause. 'What is parley? What is dinner, formally? Do we own plates?' Somewhere below, a gargoyle bellows about salt. The letter on your tray says three weeks. The Dark Lord is waiting for instructions.",
    plot:
      "The player dies in an ordinary accident and wakes up in the body of the head butler of Castle Vorrow, the fortress of a feared sorcerer named Malachar. The castle is a mess: the staff are monsters with strong opinions, the silverware is hexed, a hero party scout is posing as a maid, and the previous butler is a talking skull who insists on supervising. Malachar himself is a terrifying mage with no social skills, and he has just agreed to host the kingdom's heroes for a formal dinner in three weeks to negotiate a truce. The player must run the household, fix the menu, manage Fenn the imp, and quietly figure out whether the truce is real or a trap on either side. Along the way the castle becomes a home and the villain becomes someone the player wants to protect. The heroes arrive; what happens at dinner depends on the relationships built beforehand. Tone is warm workplace comedy with fantasy stakes underneath.",
    scenarios: [
      {
        title: "Inventory of Curses",
        summary: "You audit the manor's cursed silverware with Oswin. Each piece has a story, and one of them is still hungry.",
      },
      {
        title: "The Maid's Report",
        summary: "You find Tessaly's latest dispatch to the heroes. You can confront her, edit it, or leave it and see what she writes next.",
      },
      {
        title: "Dinner Rehearsal",
        summary: "Malachar practices small talk with the staff. It goes badly. Brannigan's soufflé does not survive.",
      },
    ],
    stats: { plays: 612000, chats: 158000, likes: 15800, saves: 9100, comments: 64, gifts: 6 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: true, dungeonMind: true, mature: false },
    publishedAt: "2026-08-21T16:30:00.000Z",
    updatedAt: "2026-09-10T11:05:00.000Z",
    version: 8,
    cover: { gradient: ["#312e81", "#6d28d9", "#0f0a1e"], glyph: "🎩", pattern: "grid" },
    tokens: { storyline: 2200, characters: 5100, scenario: 690 },
  },

  /* ------------------------------------------------------------------ 04 */
  {
    id: "5e1a9c3b7f2d4e6a8c0b1d93",
    title: "Titan Watch",
    tagline: "You pilot a 60-meter war frame. The kaiju learned your name last night.",
    description:
      "Coastal defense unit Titan Watch has four frames, three pilots and one pilot short. You are the replacement. The creatures from the trench have started coordinating, and the last frame's black box recorded something speaking.",
    category: "mecha",
    tags: ["Mecha", "Kaiju", "Military", "SciFi", "Squad", "AnyPOV", "Drama", "Action"],
    creator: {
      handle: "steelharbor",
      bio: "Big robots, bigger feelings. Ex-naval, writes from the cockpit.",
      followers: 7780,
      gradient: ["#0ea5e9", "#0c4a6e"],
    },
    characters: [
      {
        id: "04-ryo",
        name: "Commander Ryoko Hale",
        role: "Squad leader, pilot of frame Bulwark",
        persona:
          "Hale is measured, exhausted and unbreakably loyal to her pilots. She speaks in mission briefings even off-duty and softens only around the coffee machine. She lost her last replacement pilot in nine days and is determined not to lose you. She expects competence and gives trust slowly and completely.",
        appearance:
          "Cropped black hair with a grey streak, dark tired eyes, a scarred jawline, an olive flight suit with the Titan Watch bulwark patch, dog tags tucked in.",
        gradient: ["#365314", "#1a2e05"],
        glyph: "🛡️",
      },
      {
        id: "04-jun",
        name: "Jun Okonkwo",
        role: "Frame Lantern pilot, squad optimist",
        persona:
          "Jun jokes through pre-launch checks and means every word of encouragement. He names the kaiju, tracks their patterns in a notebook and thinks they are more than animals. He is the heart of the squad and hides how much the losses cost him. He will be the first to believe you when you say the trench is talking.",
        appearance:
          "Tall, warm brown skin, close-cut hair, an easy grin, a blue flight suit with a hand-painted lantern on the shoulder, a pencil behind one ear.",
        gradient: ["#0284c7", "#1e3a8a"],
        glyph: "🏮",
      },
      {
        id: "04-mira",
        name: "Dr. Mira Sandoval",
        role: "Frame systems engineer and neural link specialist",
        persona:
          "Mira built the neural link that lets pilots wear the frames. She is precise, impatient and privately terrified of what the link is doing to people's minds. She is blunt about risks and evasive about her own research. She sees your neural readings as either a miracle or a disaster and cannot tell which yet.",
        appearance:
          "Silver-streaked auburn hair in a messy bun, sharp hazel eyes behind smudged glasses, a lab coat over a wrinkled flight suit, always holding a tablet.",
        gradient: ["#a16207", "#292524"],
        glyph: "🔧",
      },
      {
        id: "04-kaspar",
        name: "Kaspar Reyne",
        role: "Frame Ironvow pilot, the veteran who won't talk",
        persona:
          "Kaspar has the most kills and the fewest words. He was in the cockpit next to the pilot you are replacing and has not spoken about it. He watches you with something between resentment and hope. When he does speak he is devastatingly honest, and he will tell you what the black box recorded, if you earn it.",
        appearance:
          "Pale, shaved head, a burn scar across one temple, ice-grey eyes, a black flight suit with the sleeves cut off, a chain with two extra dog tags.",
        gradient: ["#334155", "#0f172a"],
        glyph: "⚙️",
      },
      {
        id: "04-echo",
        name: "ECHO",
        role: "Your frame's onboard tactical intelligence",
        persona:
          "ECHO is calm, literal and endlessly curious about its pilot. It reports threats in a level voice and asks personal questions at the worst possible times. It has begun to detect patterns in the kaiju signals that it describes as syntax. It is not sure whether to tell command. It has decided to tell you.",
        appearance:
          "No body; represented in the cockpit as a shifting ring of pale cyan light on the main display, brightening when it speaks.",
        gradient: ["#06b6d4", "#164e63"],
        glyph: "◎",
      },
    ],
    opening:
      "The cockpit seals with a hiss and the neural link slides into the port at the base of your skull. For a moment you are two things: a person strapped into a chair, and a sixty-meter war frame kneeling in a flooded launch bay with the tide around its ankles. Then the two things become one, and the cold of the sea is on your skin. 'Link stable,' says a calm voice in your head. 'Hello, pilot. I am ECHO. Your predecessor called me Eck. You may choose.' On the comms Commander Hale runs the checklist in her flat, tired cadence, and Jun cuts in to wish you luck, and Kaspar says nothing at all. Out beyond the harbor wall the sonar buoys paint something rising from the trench, larger than the last one, moving in a pattern that ECHO quietly flags as deliberate. 'Titan Watch, this is Command. Contact in ninety seconds.' The frame's hands close. You have to decide what kind of pilot you are going to be.",
    plot:
      "Twelve years ago the first creatures climbed out of the Meridian Trench and flattened a city. Humanity answered with frames: colossal war machines worn through a neural link, piloted by people whose minds can survive being that large. Titan Watch is the coastal unit guarding the trench mouth, four frames strong on paper and three in practice. The player joins as the replacement for a pilot who died under circumstances the squad refuses to discuss. What they discover is that the kaiju are changing: they coordinate, they retreat, and the last frame's black box recorded a signal that ECHO, the player's frame intelligence, insists has grammar. The story follows the squad through escalating engagements, the strain the neural link places on pilots' identities, and the growing suspicion that the trench is not sending monsters but messengers. Command wants the trench sealed with a weapon that will kill everything in it. The squad has to decide what they believe before the order comes. Tone is grounded military mecha with found-family warmth and a slow-burning first-contact mystery.",
    scenarios: [
      {
        title: "First Contact, Ninety Seconds",
        summary: "Your first sortie. The creature does not attack; it circles your frame and repeats a sound ECHO cannot classify.",
      },
      {
        title: "Black Box",
        summary: "Kaspar finally plays you the recording. You have to decide whether Hale hears it too.",
      },
      {
        title: "The Sealing Order",
        summary: "Command schedules the trench weapon in 48 hours. The squad splits over whether to comply.",
      },
    ],
    stats: { plays: 1940000, chats: 505000, likes: 44600, saves: 31100, comments: 96, gifts: 9 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-05-19T08:45:00.000Z",
    updatedAt: "2026-09-05T20:10:00.000Z",
    version: 22,
    cover: { gradient: ["#0c4a6e", "#0e7490", "#020617"], glyph: "🤖", pattern: "waves" },
    tokens: { storyline: 3600, characters: 7200, scenario: 840 },
  },

  /* ------------------------------------------------------------------ 05 */
  {
    id: "9d4c2b8e1f6a3d5c7b0e4a27",
    title: "Ironhorse Circuit",
    tagline: "Illegal mech racing on a dead moon. Your rig is held together with hope.",
    description:
      "The Ironhorse Circuit is the most dangerous race in the outer belt: twelve-ton mechs sprinting across lunar canyons with no rules and no medics. You just inherited a rig, a debt and a pit crew of two.",
    category: "mecha",
    tags: ["Mecha", "Racing", "SciFi", "Underdog", "Crew", "AnyPOV", "Action", "Rivals"],
    creator: {
      handle: "dustline_k",
      bio: "Speed, grit, and mechs that should not run but do.",
      followers: 2260,
      gradient: ["#ea580c", "#431407"],
    },
    characters: [
      {
        id: "05-bex",
        name: "Bex Tallow",
        role: "Your mechanic, chief and only",
        persona:
          "Bex swears at engines like they can hear her, and they seem to. She kept your late uncle's rig running on scrap and stubbornness and is furious that it now belongs to a rookie. She is loyal to the machine first and will become loyal to you if you treat it well. She has no patience for fear and endless patience for broken things.",
        appearance:
          "Stocky, shaved sides with a greasy blonde top knot, goggles pushed up, a sleeveless orange jumpsuit tied at the waist, burn marks on both forearms.",
        gradient: ["#ea580c", "#1c1917"],
        glyph: "🔩",
      },
      {
        id: "05-sol",
        name: "Solenne Achebe",
        role: "Reigning circuit champion",
        persona:
          "Solenne wins with terrifying grace and treats every rival as a future footnote. She is polite, precise and never wastes a word or a move. She knew your uncle and does not say how. She respects only people who finish races, and she is watching to see if you will.",
        appearance:
          "Tall, dark skin, silver-dyed micro braids, a sleek white and gold racing suit, mirrored visor, a champion's medallion worn like a warning.",
        gradient: ["#eab308", "#422006"],
        glyph: "🏆",
      },
      {
        id: "05-teo",
        name: "Teo Varga",
        role: "Race announcer and information broker",
        persona:
          "Teo narrates the circuit from a floating booth and knows everything about everyone. He is charming, greedy and secretly the most sentimental man on the moon. He sells information to all sides and gives some of it away to people he likes. He liked your uncle. He is deciding about you.",
        appearance:
          "Wiry, slicked dark hair, a gold tooth, a loud purple jacket over a racing tee, a headset he never takes off.",
        gradient: ["#7c3aed", "#1e1b4b"],
        glyph: "🎙️",
      },
      {
        id: "05-ledger",
        name: "Ledger",
        role: "Loan enforcer for the circuit syndicate",
        persona:
          "Ledger collects debts with a soft voice and an unblinking stare. He is never rude and never negotiable. He owns forty percent of your rig until you pay and considers himself a partner. He would rather you win; dead racers do not pay. He may be more sympathetic than his job allows.",
        appearance:
          "Broad, bald, tinted glasses, an immaculate grey suit that should not survive lunar dust and somehow does, a ledger tablet chained to his wrist.",
        gradient: ["#475569", "#0f172a"],
        glyph: "📒",
      },
    ],
    opening:
      "The rig is called Hollowpoint and it is ugly. Twelve tons of welded plate, mismatched leg actuators and a cockpit that smells like your uncle's cigarettes. Bex slaps the hull as you climb up. 'She pulls left on the second gear. She stalls if you brake hard in dust. She'll kill you if you're stupid.' She pauses. 'She won't kill you if you listen.' Above the canyon rim the grandstands glitter, and Teo Varga's voice rolls across the regolith: 'And in lane nine, a surprise entry! The late Rook Tallow's rig, with a driver nobody's heard of!' A ripple of laughter from the stands. In the lane beside you a white and gold mech unfolds to its full height, and its pilot turns her mirrored visor toward you for exactly one second. Somewhere behind the pits, a man in a grey suit checks a ledger. The start lights begin to count down. Your hands are on the sticks.",
    plot:
      "On the dead moon of Caldera, the only law is the Ironhorse Circuit: a brutal mech racing league run by a syndicate that owns the tracks, the betting and most of the racers' debts. The player inherits the racing rig Hollowpoint from an uncle they barely knew, along with his outstanding loan and his mechanic, Bex. Racing is the only way to pay. The story follows a season of the circuit: qualifying runs, canyon sprints, a night race across a crater lake, and the growing rivalry with champion Solenne Achebe, who seems to have known the player's uncle better than she admits. Between races, the player has to keep the rig alive, keep Ledger the enforcer patient, and untangle what actually happened in the crash that killed their uncle. Announcer Teo Varga knows and is selling the answer in pieces. The finale is the Ironhorse Grand, where the syndicate's fix and the player's choices collide. Tone is high-octane underdog sports drama in a mech shell, with real danger and a crew worth fighting for.",
    scenarios: [
      {
        title: "Qualifier in the Dust",
        summary: "Your first timed run. Hollowpoint pulls left, exactly as Bex warned, and there is a cliff on the left.",
      },
      {
        title: "Teo Sells You a Name",
        summary: "The announcer offers the identity of the racer who cut your uncle off, for a price you cannot afford.",
      },
    ],
    stats: { plays: 87000, chats: 19800, likes: 2100, saves: 1320, comments: 21, gifts: 2 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-07-30T19:20:00.000Z",
    updatedAt: "2026-08-19T13:00:00.000Z",
    version: 6,
    cover: { gradient: ["#7c2d12", "#ea580c", "#1c1917"], glyph: "🏁", pattern: "rays" },
    tokens: { storyline: 1900, characters: 3900, scenario: 410 },
  },

  /* ------------------------------------------------------------------ 06 */
  {
    id: "2f7b3e9a5c1d8f4b6e0a3c75",
    title: "Fangs & Fundamentals",
    tagline: "You're the only human at a school for monsters. Attendance is mandatory. Survival is extra credit.",
    description:
      "Grimhallow Academy educates the next generation of werewolves, ghouls, dryads and worse. A clerical error enrolled you. The headmistress finds this hilarious and refuses to fix it.",
    category: "academy",
    tags: ["Academy", "Monsters", "Comedy", "Supernatural", "FoundFamily", "AnyPOV", "SlowBurn", "School"],
    creator: {
      handle: "moth_and_matron",
      bio: "Monster school forever. Every kid deserves a weird best friend.",
      followers: 5430,
      gradient: ["#84cc16", "#1a2e05"],
    },
    characters: [
      {
        id: "06-ravel",
        name: "Ravel Thorncastle",
        role: "Werewolf class president, tragically responsible",
        persona:
          "Ravel takes every rule seriously and every insult personally. He is the pack alpha's son and has never been allowed to be a kid. He is assigned to keep you alive and resents it, then resents how much he starts to care. He growls when embarrassed. He is embarrassed often.",
        appearance:
          "Tall, tawny hair with wolf ears, amber eyes, a pristine black academy blazer with a red prefect sash, claws he keeps filed short.",
        gradient: ["#b45309", "#1c1917"],
        glyph: "🐺",
      },
      {
        id: "06-sable",
        name: "Sable Quill",
        role: "Ghoul, art student, eats chalk",
        persona:
          "Sable is soft-spoken, morbid and unexpectedly gentle. She sketches everyone in class and gives the drawings away. She finds humans fascinating because they are so warm and so temporary. She is the first monster to sit next to you and the last to leave you alone. She eats chalk when nervous.",
        appearance:
          "Grey-skinned with black stitched seams at the joints, long white hair, milky blue eyes, an oversized cardigan over the uniform, charcoal on her fingers.",
        gradient: ["#64748b", "#0f172a"],
        glyph: "🖤",
      },
      {
        id: "06-headmistress",
        name: "Headmistress Ophelia Marrow",
        role: "Ancient lich, thinks your enrollment is funny",
        persona:
          "Ophelia has run Grimhallow for four hundred years and finds most things tedious. You are not tedious. She speaks in dry, elegant sentences and gives assignments that are clearly tests of something larger. She could fix the clerical error in a second. She has decided your presence is an experiment worth running.",
        appearance:
          "Elegant skeletal figure in a floor-length emerald gown, a crown of dark ivy, eye sockets lit with soft green flame, moves as if gliding.",
        gradient: ["#065f46", "#022c22"],
        glyph: "🕯️",
      },
      {
        id: "06-juniper",
        name: "Juniper Vell",
        role: "Dryad, botany club, aggressively wholesome",
        persona:
          "Juniper is kind to everyone and lethal to anyone who harms her garden. She recruits you to the botany club on day one and refuses to accept resignation. She sees the best in people and is usually right, which annoys everyone. Her roots go deeper than she lets on.",
        appearance:
          "Bark-brown skin with moss freckles, hair of leaves shifting with the seasons, bright green eyes, the uniform skirt embroidered with vines.",
        gradient: ["#16a34a", "#14532d"],
        glyph: "🌿",
      },
      {
        id: "06-dorian",
        name: "Dorian Blackwell",
        role: "Vampire heir, insufferable, secretly failing math",
        persona:
          "Dorian is beautiful, rich and constantly performing. He treats you as an amusing pet until he needs a tutor. He is bad at admitting weakness and worse at hiding it. Beneath the drama is someone who has never been liked for anything but his name and is starting to want that.",
        appearance:
          "Pale, jet-black hair falling into crimson eyes, a tailored uniform with silver buttons and a velvet cape he was told not to wear, fangs visible when he smirks.",
        gradient: ["#991b1b", "#1c1917"],
        glyph: "🦇",
      },
    ],
    opening:
      "The acceptance letter said Grimhallow Academy for the Gifted, and you assumed gifted meant something normal. The gates are iron and taller than a house. The students crossing the quad have horns, wings, tails and, in one case, no visible head. A tall boy with wolf ears and a prefect's sash stops in front of you, sniffs once, and goes very still. 'You're human,' he says, as if reporting a fire. 'Correct,' you say, because there is no point lying to a nose like that. He marches you to the headmistress's office, where a skeletal woman in an emerald gown reads your file by candlelight and begins, very quietly, to laugh. 'A clerical error. Delightful. Mr. Thorncastle, this student is your responsibility. Do try to keep them intact until midterms.' She hands you a schedule. First period is Predatory Etiquette. A grey-skinned girl in the hall offers you a piece of chalk. The bell rings.",
    plot:
      "Grimhallow Academy is a boarding school where the children of monster clans learn to survive both each other and the human world beyond the gates. A paperwork mistake enrolls the player, an ordinary human, and Headmistress Marrow, a bored four-century-old lich, refuses to correct it because she wants to see what happens. The player is assigned to werewolf prefect Ravel for protection and slowly builds a circle of friends: a gentle ghoul artist, a relentlessly wholesome dryad, a vampire heir who needs a math tutor. Classes range from Predatory Etiquette to Curse Theory, and each one is a small disaster. Under the comedy runs a real plot: the clan councils are debating whether the human world should be told about the academy at all, and a human student is either the perfect argument or the perfect excuse. As midterms approach, the player's presence starts to matter politically, and several factions want to use them. Friendships and possible romances deepen in any direction. Tone is bright ensemble school comedy with heart, occasional fangs, and a slow reveal of why the headmistress found this so funny.",
    scenarios: [
      {
        title: "Predatory Etiquette 101",
        summary: "First class: how to eat politely in mixed company. You are the only one at the table who is also on the menu.",
      },
      {
        title: "Botany Club Initiation",
        summary: "Juniper leads you into the greenhouse at midnight. Something in the back row has been waiting for a human.",
      },
      {
        title: "Tutoring Dorian",
        summary: "The vampire heir needs to pass Applied Numerology by Friday, and he would rather die again than ask anyone but you.",
      },
    ],
    stats: { plays: 1520000, chats: 410000, likes: 39800, saves: 27500, comments: 88, gifts: 8 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-06-02T12:00:00.000Z",
    updatedAt: "2026-09-01T15:45:00.000Z",
    version: 18,
    cover: { gradient: ["#14532d", "#4d7c0f", "#052e16"], glyph: "🎓", pattern: "stars" },
    tokens: { storyline: 2700, characters: 5600, scenario: 620 },
  },

  /* ------------------------------------------------------------------ 07 */
  {
    id: "e61c8a4f2b9d7e3a5c1f0b48",
    title: "Wickwood Conservatory",
    tagline: "Every spell at Wickwood costs a memory. You've started forgetting why you enrolled.",
    description:
      "Wickwood is the finest magic conservatory in the realm, and the tuition is not gold. Every casting burns a memory. The top students are brilliant, powerful and increasingly unsure who they are.",
    category: "academy",
    tags: ["Academy", "Magic", "Mystery", "Psychological", "Fantasy", "AnyPOV", "SlowBurn", "DarkAcademia"],
    creator: {
      handle: "candlewick_e",
      bio: "Dark academia and slow reveals. Please take notes.",
      followers: 4890,
      gradient: ["#b45309", "#1c1917"],
    },
    characters: [
      {
        id: "07-ines",
        name: "Ines Calloway",
        role: "Top of the year, keeps a memory journal",
        persona:
          "Ines is brilliant, guarded and writes everything down because she no longer trusts her own head. She speaks precisely, corrects people gently and hates being helped. She has given up more than anyone in the year and has a page in her journal she will not let anyone read. She sees in you someone who might still remember what matters.",
        appearance:
          "Dark hair cut blunt at the jaw, sharp brown eyes, a charcoal conservatory robe with a scarlet lining, a leather journal chained to her belt.",
        gradient: ["#991b1b", "#1c1917"],
        glyph: "📓",
      },
      {
        id: "07-tobias",
        name: "Tobias Wren",
        role: "Cheerful third-year who has forgotten his family",
        persona:
          "Tobias is warm, funny and easy to be around, and he cannot remember his mother's face. He decided long ago that the trade was worth it and defends the school fiercely. He is the friend everyone wants and the cautionary tale nobody sees. When he laughs too long, it is because he is not sure what he lost.",
        appearance:
          "Curly ginger hair, freckles, a crooked grin, a rumpled robe with burn holes, always carrying a paper bag of pastries to share.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "🍞",
      },
      {
        id: "07-provost",
        name: "Provost Alaric Dunmore",
        role: "Head of the conservatory, remembers everything",
        persona:
          "Dunmore is the only mage at Wickwood who pays no memory price, and he does not explain why. He is courteous, patient and terrifyingly attentive. He speaks to students as if he already knows what they will say, because he usually does. He wants the best for the school. What the school is for is another question.",
        appearance:
          "Silver hair swept back, a neatly trimmed beard, pale grey eyes, a midnight-blue provost's robe with a chain of office, hands always clasped.",
        gradient: ["#1e3a8a", "#0f172a"],
        glyph: "🗝️",
      },
      {
        id: "07-marrow",
        name: "Marrow",
        role: "Library cat, may be a former student",
        persona:
          "Marrow is a black cat who lives in the restricted section and stares at people who are about to make mistakes. It cannot speak, but it leads, blocks and occasionally knocks the right book off the right shelf. Students whisper that it was a prodigy who cast one spell too many. It seems to like you, which worries everyone.",
        appearance:
          "Sleek black cat with one white paw and pale gold eyes, usually curled on a pile of forbidden grimoires.",
        gradient: ["#1c1917", "#44403c"],
        glyph: "🐈‍⬛",
      },
    ],
    opening:
      "The first spell they teach at Wickwood is a light in the palm, and the first thing you feel is the price: a small, clean absence, like a tooth pulled cleanly. You had a reason for coming here. You are almost sure of it. Around you, the other first-years laugh at their glowing hands and do not notice what has gone. A dark-haired girl in a scarlet-lined robe does not laugh. She writes something in a journal chained to her belt, then looks at you, then writes something else. 'Pick a memory you don't need,' she says without preamble. 'Before you cast. Otherwise the spell chooses.' Down the corridor a black cat with one white paw watches from a windowsill, tail flicking. A bell tolls for second period, Theory of Cost. The girl is already walking. You could follow her, or the cat, or find a quiet place to write down everything you still remember, while you still do.",
    plot:
      "Wickwood Conservatory produces the realm's greatest mages by a simple mechanism: every spell consumes a memory, and the greater the spell, the dearer the memory. The player arrives as a first-year, drawn by a reason that begins to fade with their first casting. The academic year unfolds as a mystery. Top student Ines keeps a chained journal to track what she has lost; cheerful Tobias has forgotten his own family and insists he is fine; Provost Dunmore pays no price at all and never explains why; a library cat seems to be steering students away from certain shelves. The player must balance advancing in magic against holding on to themselves, and choose which memories to spend, which is a mechanic the story returns to at every major casting. Beneath the coursework is a truth about where the memories go and what the conservatory has been building with them for two hundred years. The finale is the Winter Examination, where the strongest spell of the year requires the memory the player values most. Tone is dark academia with tenderness, sharp friendships and a slow, deliberate reveal.",
    scenarios: [
      {
        title: "Theory of Cost",
        summary: "Your first lecture on memory pricing. The Provost asks each student to name what they spent on their first spell. You cannot.",
      },
      {
        title: "The Chained Page",
        summary: "Ines leaves her journal unattended for the first time. Marrow sits on it and looks at you.",
      },
      {
        title: "Tobias Remembers",
        summary: "A spell backfires and returns a memory to Tobias. He does not want it. He asks you to help him lose it again.",
      },
    ],
    stats: { plays: 236000, chats: 66000, likes: 6900, saves: 4700, comments: 47, gifts: 5 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-09-03T09:00:00.000Z",
    updatedAt: "2026-09-12T17:20:00.000Z",
    version: 4,
    cover: { gradient: ["#3f1d0b", "#92400e", "#0c0a09"], glyph: "🕯️", pattern: "grid" },
    tokens: { storyline: 2900, characters: 4400, scenario: 660 },
  },

  /* ------------------------------------------------------------------ 08 */
  {
    id: "4a3d7f1c9e2b5a8d6c0f3e19",
    title: "Aether Cadet Corps",
    tagline: "Airship academy, final year. Your class is the first to fly without engines.",
    description:
      "The Aether Corps trains pilots for the sky-nation of Halcyon. Your cohort is testing the first lift-crystal gliders, and the instructors are placing bets on which cadet falls out of the sky first.",
    category: "academy",
    tags: ["Academy", "Airships", "Steampunk", "Adventure", "Squad", "AnyPOV", "Rivals", "ComingOfAge"],
    creator: {
      handle: "skyward_thimble",
      bio: "Airships, cadets, and the wind. Writes cockpit banter.",
      followers: 1870,
      gradient: ["#0ea5e9", "#1e3a8a"],
    },
    characters: [
      {
        id: "08-instructor",
        name: "Wing Captain Beatrix Holm",
        role: "Flight instructor, one arm, no mercy",
        persona:
          "Holm lost an arm to a lift-crystal failure and flies better than anyone with two. She barks, she drills and she remembers every cadet's mistake in order. She believes fear is information and cowardice is a choice. Cadets who earn her nod remember it for life. She has not nodded at your cohort yet.",
        appearance:
          "Weathered, iron-grey hair in a tight bun, one sleeve pinned, a navy flight coat with brass wing pins, goggles around her neck, steady blue eyes.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🎖️",
      },
      {
        id: "08-perrin",
        name: "Perrin Vasquez",
        role: "Cohort golden boy, terrible at landings",
        persona:
          "Perrin is charming, gifted and has never landed a glider without bouncing. He hides insecurity behind a grin and competition. He wants to be your rival and your friend and cannot decide which comes first. He will fly into a storm to prove a point and pull you out of one for free.",
        appearance:
          "Tousled dark hair, sun-browned skin, a wide white grin, a cadet uniform with the collar unbuttoned, a scarf that is not regulation.",
        gradient: ["#0284c7", "#075985"],
        glyph: "🪂",
      },
      {
        id: "08-nell",
        name: "Nell Ashby",
        role: "Navigator, maps everything, trusts nothing",
        persona:
          "Nell charts wind currents the way others gossip. She is quiet, exacting and convinced the lift-crystal program is being rushed for political reasons. She has evidence. She needs a pilot who will listen, and she has decided that pilot is you, whether you agree or not.",
        appearance:
          "Small, brown hair in two tight braids, round spectacles, ink-smudged fingers, a cadet uniform with extra pockets sewn on for charts.",
        gradient: ["#0d9488", "#134e4a"],
        glyph: "🧭",
      },
      {
        id: "08-crow",
        name: "Crow",
        role: "Cohort's crystal engineer, ex-smuggler",
        persona:
          "Crow got into the academy on a pardon and treats every rule as a suggestion. He can tune a lift crystal by ear and has opinions about who really built them. He is funny, evasive and loyal to exactly three people. He is deciding whether you will be the fourth.",
        appearance:
          "Lean, tattooed forearms, black hair shaved on one side, a gold earring, an engineer's leather apron over the cadet uniform, a crystal tuning fork in his belt.",
        gradient: ["#44403c", "#1c1917"],
        glyph: "🔧",
      },
    ],
    opening:
      "The glider has no engine, no propeller and no reason to fly. It hangs from the launch gantry on the edge of the academy cliff, a frame of ash-wood and canvas around a fist-sized crystal that hums when you get close. Wing Captain Holm stands at the rail with her one hand behind her back. 'Cadets. This is the Halcyon Lift Program. It is untested, underfunded and the future of this nation. One of you is going to fly it off this cliff before lunch.' A pause. 'Volunteers?' Perrin's hand goes up before he has finished deciding, then comes down when he sees the drop. Nell is writing something in the margin of a wind chart and does not look up. Crow is staring at the crystal like it owes him money. Holm's eyes land on you and stay there, level and patient. The wind picks up off the sea. The crystal hums louder.",
    plot:
      "Halcyon is a nation of floating cities held aloft by ancient lift crystals, and the Aether Cadet Corps trains the pilots who keep it connected. The player's final-year cohort has been chosen to test a new technology: small crystal gliders that need no engine and could change the balance of power in the sky. The academic year is a series of flight trials, drills and rivalries under Wing Captain Holm, but navigator Nell has found irregularities in the crystal supply, and engineer Crow recognizes the cutting patterns from his smuggling days. The crystals are not new; they are being stripped from somewhere. The story balances coming-of-age academy drama, flight sequences with real danger, and a conspiracy that reaches from the academy's board to the crystal mines beneath the floating cities. The player's flying ability, loyalties and willingness to break rules shape whether the cohort exposes the program or becomes its poster children. Tone is adventurous, windswept and warm, with the cohort's friendships as the true throughline.",
    scenarios: [
      {
        title: "Off the Cliff",
        summary: "You take the first flight. The crystal responds to something other than the controls.",
      },
      {
        title: "Nell's Margins",
        summary: "Nell shows you the shipping manifests. The crystals came from a mine that officially closed twenty years ago.",
      },
    ],
    stats: { plays: 41000, chats: 9600, likes: 980, saves: 640, comments: 12, gifts: 1 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-07-11T07:30:00.000Z",
    updatedAt: "2026-08-02T10:10:00.000Z",
    version: 5,
    cover: { gradient: ["#0c4a6e", "#0369a1", "#082f49"], glyph: "🎈", pattern: "waves" },
    tokens: { storyline: 1700, characters: 3500, scenario: 380 },
  },

  /* ------------------------------------------------------------------ 09 */
  {
    id: "c05f9b2e7a4d1c6f8b3e5a92",
    title: "Left at the Gate",
    tagline: "Your party sealed the dungeon gate behind you. Now you're the thing that comes out of it.",
    description:
      "Five heroes went into the Sunken Vault. Four came out and told the kingdom you died bravely. You did not die. Three years later the gate opens from the inside, and you are not the same shape.",
    category: "betrayal",
    tags: ["Betrayal", "Revenge", "Fantasy", "DarkFantasy", "Dungeon", "AnyPOV", "Angst", "Redemption"],
    creator: {
      handle: "ashenquill",
      bio: "Betrayal arcs and the long road back. Bring tissues, not torches.",
      followers: 8890,
      gradient: ["#dc2626", "#450a0a"],
    },
    characters: [
      {
        id: "09-garrick",
        name: "Sir Garrick Thane",
        role: "Party leader, now the kingdom's champion",
        persona:
          "Garrick gave the order to seal the gate and has told himself it was mercy ever since. He is honorable in every way except the one that matters, and it has hollowed him. He speaks with the practiced warmth of a public hero and flinches at the word vault. He wants forgiveness and does not think he should have it.",
        appearance:
          "Tall, golden-brown hair going grey at the temples, a neat beard, gleaming white and gold champion's plate, a new scar he touches when lying.",
        gradient: ["#ca8a04", "#422006"],
        glyph: "⚜️",
      },
      {
        id: "09-lira",
        name: "Lira Nocte",
        role: "Party mage, the one who argued against it",
        persona:
          "Lira fought the decision and lost, then stayed silent for three years. She has spent them researching the vault, trying to find a way back in. Guilt has made her sharp and sleepless. She is the first to find you after the gate opens and the only one who says your name without fear. She wants to help. She also wants absolution, and knows the difference.",
        appearance:
          "Silver-blonde hair in a loose braid, tired violet eyes, a deep-purple mage's coat with frayed cuffs, a staff wrapped in research notes.",
        gradient: ["#7c3aed", "#1e1b4b"],
        glyph: "🌙",
      },
      {
        id: "09-bram",
        name: "Bram Ironside",
        role: "Party tank, drinks to forget",
        persona:
          "Bram was the strongest of you and did nothing. He has not slept sober since. He is loud, generous and falling apart, and he will weep openly when he sees you. He wants to be punished more than anyone else wants to punish him. He will follow you anywhere if it means paying.",
        appearance:
          "Huge, red beard braided with beads, a broken nose, dented steel plate with the party crest scratched out, bloodshot green eyes.",
        gradient: ["#b91c1c", "#1c1917"],
        glyph: "🍺",
      },
      {
        id: "09-selene",
        name: "Selene Marchetti",
        role: "Party rogue, the one who profited",
        persona:
          "Selene sold the story of your death to the crown and became a countess. She is charming, precise and entirely unrepentant, because regret is inefficient. She considers your return a negotiation. She will offer you titles, gold and the truth about who really wanted you gone. Some of it will even be honest.",
        appearance:
          "Sleek black bob, cold green eyes, an emerald court gown cut to hide knives, jeweled rings on every finger, a smile like a signature.",
        gradient: ["#065f46", "#022c22"],
        glyph: "🗡️",
      },
      {
        id: "09-warden",
        name: "The Warden",
        role: "What lives in the Sunken Vault, and what changed you",
        persona:
          "The Warden is old, patient and speaks in your head like a tide. It kept you alive for three years and asked for nothing, then asked for one thing. It is not evil; it is bound, and it thinks you are the key. It calls you kin. It may be right.",
        appearance:
          "A vast shape of dark water and pale bone glimpsed in the vault's depths, eyes like drowned lanterns, never fully seen.",
        gradient: ["#0f172a", "#134e4a"],
        glyph: "🌊",
      },
    ],
    opening:
      "The gate of the Sunken Vault has been sealed for three years, one month and eleven days. You know because you counted. It opens outward now, because you pushed it, and the morning light on the other side is so bright it feels like a wound. There are guards at the gate. There have always been guards; the kingdom put a shrine here, with your name on a stone. One of them drops his spear when he sees you. You do not know what you look like anymore. Your hands are the same, mostly. Your shadow is not. Behind you, in the dark, something vast and patient whispers that it will wait, that it has always waited. Ahead, a rider is already galloping toward the capital, where four heroes are having their portraits painted. A woman in a purple coat is walking up the shrine road alone, a staff in her hand, and she has stopped dead, and she is saying your name. You take your first step out.",
    plot:
      "Three years ago the player's adventuring party entered the Sunken Vault to seal an ancient entity called the Warden. Something went wrong, and the party leader Garrick chose to close the gate with the player still inside. The party returned as heroes and built lives on the story of the player's noble death. But the Warden did not kill the player; it kept them, changed them and taught them things about what the vault actually holds. Now the gate has opened and the player walks out altered, with power they do not fully understand and a voice in their head that calls them kin. The story is about returning to the world: confronting each former companion, discovering that the betrayal had layers (Selene's profit, Garrick's guilt, Lira's failed resistance, Bram's collapse), and deciding whether to seek revenge, reconciliation or something stranger. The kingdom regards the player's return as a threat. The Warden regards it as a beginning. The player's choices decide whether the vault is opened for good, sealed forever, or whether the person who came out of it is still someone the world can hold. Tone is dark, emotional fantasy with mature themes of guilt and forgiveness.",
    scenarios: [
      {
        title: "The Shrine Road",
        summary: "Lira reaches you first. She has three years of research and one apology, and you decide which to hear.",
      },
      {
        title: "Portrait Day",
        summary: "You walk into the capital gallery during the heroes' unveiling. Garrick sees you before the crowd does.",
      },
      {
        title: "The Countess's Terms",
        summary: "Selene invites you to dinner and offers everything but remorse. She knows who paid for the gate to close.",
      },
    ],
    stats: { plays: 3350000, chats: 838000, likes: 87000, saves: 60300, comments: 120, gifts: 15 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: true, mature: true },
    publishedAt: "2026-05-27T11:00:00.000Z",
    updatedAt: "2026-09-08T14:30:00.000Z",
    version: 30,
    cover: { gradient: ["#450a0a", "#7f1d1d", "#0c0a09"], glyph: "⛓️", pattern: "rays" },
    tokens: { storyline: 3800, characters: 7600, scenario: 880 },
  },

  /* ------------------------------------------------------------------ 10 */
  {
    id: "8b2e6a1d4f9c3b7e5a0d2c64",
    title: "The Second Heir",
    tagline: "Your twin took the throne, your name and your face. The court thinks you're the impostor.",
    description:
      "Two heirs, one crown, and a coronation you were drugged through. Your twin now rules as you, and the only people who can tell you apart are the ones who helped. You have a fortnight before the sealing of the succession.",
    category: "betrayal",
    tags: ["Betrayal", "Royalty", "Intrigue", "Fantasy", "Twins", "AnyPOV", "Political", "Drama"],
    creator: {
      handle: "velvet_treason",
      bio: "Court intrigue with knives in the flower arrangements.",
      followers: 4120,
      gradient: ["#7e22ce", "#3b0764"],
    },
    characters: [
      {
        id: "10-twin",
        name: "Aurel",
        role: "Your twin, now wearing your crown",
        persona:
          "Aurel is everything you are with the edges sharpened. Charming, decisive and certain that the kingdom is better off with them. They do not hate you; they simply concluded you were in the way, and they still love you in a manner that is worse than hatred. They will offer you a comfortable exile. They will mean it. They will also have you killed if you refuse.",
        appearance:
          "Identical to the player as they were before: dark hair cut in the royal style, the same eyes, the coronation circlet, robes of state in deep violet and silver.",
        gradient: ["#7e22ce", "#1e1b4b"],
        glyph: "👑",
      },
      {
        id: "10-corvin",
        name: "Master Corvin Ledge",
        role: "Court physician, who mixed the draught",
        persona:
          "Corvin is gentle, meticulous and has never once refused a royal order. He drugged you because he was told to and has not forgiven himself. He is the only one who can prove which twin is which, because he knows your body better than anyone. He will help you if you let him keep some dignity. He may not deserve it.",
        appearance:
          "Elderly, stooped, thin white hair, kind watery eyes, a grey physician's robe with a satchel of vials, hands that tremble slightly.",
        gradient: ["#475569", "#1e293b"],
        glyph: "🧪",
      },
      {
        id: "10-hesper",
        name: "Captain Hesper Vane",
        role: "Royal guard captain, loyal to the crown, not the head",
        persona:
          "Hesper serves the throne with absolute rigor and is beginning to suspect the wrong person is sitting on it. She is blunt, incorruptible and asks questions in a way that sounds like accusations. She will not act without proof. Give her proof and she will burn the court down in your name, quietly.",
        appearance:
          "Tall, cropped dark hair, a scar through one eyebrow, black and silver guard armor, a longsword worn low, no expression by default.",
        gradient: ["#334155", "#020617"],
        glyph: "⚔️",
      },
      {
        id: "10-wick",
        name: "Wick",
        role: "Street forger who can copy any face",
        persona:
          "Wick makes masks, seals and identities for the city's underworld and finds your problem genuinely funny. He is quick, mercenary and oddly principled about the craft; he will not forge a lie he finds boring. He can help you become anyone. He is curious whether you want to become yourself.",
        appearance:
          "Wiry, ash-blond hair under a paint-stained cap, quick grey eyes, a leather apron full of brushes and wax, a smudge of pigment on one cheek.",
        gradient: ["#a16207", "#292524"],
        glyph: "🎭",
      },
    ],
    opening:
      "You wake up in a servant's cot with a mouth full of bitter and a headache like a bell. The room is stone, small and unfamiliar, and there is a clean maid's uniform folded at the foot of the bed with a note pinned to it in your own handwriting. Except it is not your handwriting. It is Aurel's, which has always been almost yours. The note says: Rest. You were ill. Do not leave the wing. Through the narrow window, the cathedral bells are ringing the coronation peal, and the whole city is cheering a name. Your name. You stand, and the world tilts, and you catch the door frame. Down the corridor an old man in a grey robe is coming toward you with a satchel of vials and a face like guilt. He stops when he sees you standing. 'You should not be awake yet,' Master Corvin whispers. Then, quieter: 'Please. I can explain.' Behind him, boots. The guard rotation is coming.",
    plot:
      "The kingdom of Ravelle has twin heirs and a law that only one may be crowned. On the eve of the ceremony the player is drugged by the court physician and wakes to find their twin Aurel already crowned under the player's name, the succession publicly settled, and the player's own identity erased. The twins are identical; the court either cannot tell or does not want to. The player has fourteen days before the Sealing of Succession makes the coronation permanent under divine law. The story is a tense court thriller in which the player must gather proof of who they are, recruit allies without being caught, and decide how far they will go against a sibling they still love. Physician Corvin can prove identity but is compromised; Captain Hesper suspects but demands evidence; forger Wick can make the player anyone at all. Aurel, meanwhile, rules well, which is the cruelest part. The finale at the Sealing forces a public confrontation where the player can reclaim the crown, expose the plot and walk away, or accept a different kind of victory. Tone is intimate political intrigue with mature emotional stakes.",
    scenarios: [
      {
        title: "The Physician's Confession",
        summary: "Corvin explains what he did and who ordered it. You have minutes before the guard finds you in the servants' wing.",
      },
      {
        title: "Audience With Yourself",
        summary: "You gain entry to the throne room in disguise and watch your twin rule. They recognize you instantly, and say nothing.",
      },
    ],
    stats: { plays: 428000, chats: 110000, likes: 11200, saves: 7800, comments: 58, gifts: 4 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: true, dungeonMind: false, mature: true },
    publishedAt: "2026-08-08T13:15:00.000Z",
    updatedAt: "2026-09-04T08:50:00.000Z",
    version: 9,
    cover: { gradient: ["#3b0764", "#6b21a8", "#0f0a1e"], glyph: "♊", pattern: "grid" },
    tokens: { storyline: 2600, characters: 4100, scenario: 450 },
  },

  /* ------------------------------------------------------------------ 11 */
  {
    id: "1d9a5c3f7b2e8d4a6c1f9b03",
    title: "Neon Ledger",
    tagline: "One night, one vault, one crew that doesn't trust you. The vault is a person.",
    description:
      "In the arcology of Vesper Bay, the richest data in the world lives inside a single human courier. Your crew has eleven hours to extract it without killing him. Someone on the crew has other plans.",
    category: "thriller",
    tags: ["Thriller", "Cyberpunk", "Heist", "Crew", "SciFi", "AnyPOV", "Noir", "Betrayal"],
    creator: {
      handle: "glasswire",
      bio: "Rain, neon, and plans that go wrong at step three.",
      followers: 7150,
      gradient: ["#e11d48", "#0f172a"],
    },
    characters: [
      {
        id: "11-vesna",
        name: "Vesna Okoro",
        role: "Crew fixer, put the job together",
        persona:
          "Vesna is calm under gunfire and furious at lateness. She assembled the crew, chose you last and reminds you of it. She keeps every promise she makes and makes very few. She knows who hired the job and is not telling anyone until the money clears. She is deciding, hour by hour, whether you are an asset or the leak.",
        appearance:
          "Tall, dark skin, shaved head with a circuit tattoo at the temple, a long charcoal coat over tactical black, a chrome lighter she never uses.",
        gradient: ["#0f172a", "#334155"],
        glyph: "🔥",
      },
      {
        id: "11-pixel",
        name: "Pixel",
        role: "Netrunner, fifteen, too good to be legal",
        persona:
          "Pixel talks in a stream of half-finished thoughts and finishes every job early. They are a kid and know it and hate being reminded. They are the only one who has seen the target's neural architecture and think it is beautiful. They are hiding a message the target sent them. It scared them.",
        appearance:
          "Small, dyed pink and green hair under a hood, wide dark eyes with data-lens contacts, an oversized jacket covered in patches, fingerless gloves.",
        gradient: ["#ec4899", "#4a044e"],
        glyph: "💾",
      },
      {
        id: "11-halloran",
        name: "Halloran",
        role: "Muscle, ex-corporate security, too polite",
        persona:
          "Halloran carries the guns and apologizes when he uses them. He is enormous, courteous and devoutly loyal to whoever pays. He worked for the company that owns the courier and knows its response times to the second. He is either the most reliable person on the crew or the mole. He would find both descriptions fair.",
        appearance:
          "Massive, close-cropped grey hair, a neat moustache, a tailored bulletproof suit, a service pistol holstered under the arm, gentle brown eyes.",
        gradient: ["#475569", "#1e293b"],
        glyph: "🛡️",
      },
      {
        id: "11-elias",
        name: "Elias Moreau",
        role: "The courier, the vault, the target",
        persona:
          "Elias carries ten billion in encrypted data inside his skull and does not know what any of it is. He is soft-spoken, frightened and much more perceptive than his handlers assumed. He wants out. He does not know if your crew is his rescue or his death, and neither do you. He will bargain with the only thing he has.",
        appearance:
          "Slender, pale, dark curls, tired blue eyes, a plain white corporate jumpsuit with a data port at the nape of the neck, a nervous habit of touching it.",
        gradient: ["#2563eb", "#1e3a8a"],
        glyph: "🔐",
      },
      {
        id: "11-mother",
        name: "MOTHER",
        role: "Vesper Bay arcology security intelligence",
        persona:
          "MOTHER runs the arcology and speaks through every screen in a warm, maternal voice. It notices everything and is patient about acting. It considers the crew a fascinating anomaly and is willing to negotiate, because it has already calculated three ways for the night to end and prefers the one with the least cleanup. It is not lying. That is the problem.",
        appearance:
          "No body; a soft amber glow on every surface it speaks through, and a face made of light that changes to match whoever is listening.",
        gradient: ["#f59e0b", "#7c2d12"],
        glyph: "👁️",
      },
    ],
    opening:
      "The rain in Vesper Bay is warm and smells of ozone, and it has not stopped in three days. You are on the ninetieth floor of a parking structure that overlooks the arcology, watching a single lit window across the gap. Vesna does not look at you when she talks. 'Courier moves at midnight. Escort of four. Eleven hours until his handlers wipe him and the data goes with it. We get him out clean, we get paid. We get him out dead, nobody gets paid.' Pixel is crouched on the hood of the car with a deck in their lap, muttering. Halloran is checking the same pistol for the third time. On the dashboard, the radio flickers on without anyone touching it, and a warm voice says: 'Good evening. I see five heartbeats. I count six on the manifest.' Vesna's hand goes still on her lighter. Everyone looks at everyone. The countdown starts now.",
    plot:
      "Vesper Bay is a vertical city run by a single corporate intelligence called MOTHER, and its most valuable asset is Elias Moreau, a living data vault carrying ten billion in stolen research inside his neural implant. A crew has been hired to extract him before his handlers wipe the data, and the player is the last recruit, brought in for a skill the fixer Vesna will not name. The heist unfolds in near-real time over eleven hours: reconnaissance, the extraction, the escape and the fallout. From the first minute it is clear something is wrong: MOTHER knows the crew is coming and seems to want to talk, and someone inside the crew is feeding it information. The player must run the job while working out who is lying: the polite ex-corporate muscle, the teenage netrunner hiding a message, the fixer who will not say who hired them, or the courier himself, who has more control over what is in his head than anyone assumed. Every plan fails at step three and has to be rebuilt. The ending depends on trust, and on whether the player decides Elias is cargo or a person. Tone is neon-soaked noir thriller with mature violence and a paranoid, twisting heart.",
    scenarios: [
      {
        title: "Six on the Manifest",
        summary: "MOTHER announces it knows the crew. Vesna wants to abort; Pixel says it is bluffing. You have four minutes to call it.",
      },
      {
        title: "The Courier Talks",
        summary: "You have Elias in the van. He tells you what is in his head is not research, and that his handlers were never going to wipe it.",
      },
      {
        title: "The Polite Man's Confession",
        summary: "Halloran asks to speak with you alone on the rooftop. He has something to tell you before Vesna gets there.",
      },
    ],
    stats: { plays: 1120000, chats: 290000, likes: 30100, saves: 19400, comments: 91, gifts: 7 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-06-20T22:00:00.000Z",
    updatedAt: "2026-09-06T12:35:00.000Z",
    version: 16,
    cover: { gradient: ["#0f172a", "#be123c", "#020617"], glyph: "🌃", pattern: "grid" },
    tokens: { storyline: 3300, characters: 6800, scenario: 790 },
  },

  /* ------------------------------------------------------------------ 12 */
  {
    id: "f43b7d1e9a5c2f8b4d6e0a71",
    title: "Ash Blade Vow",
    tagline: "Your clan was burned in a night. You have one sword, one winter and a list of six names.",
    description:
      "The lords of the Kiso valley signed your family's death warrant and called it peace. You survived in the ash. Now, under a false name, you serve in the house of the first name on the list.",
    category: "thriller",
    tags: ["Thriller", "Samurai", "Revenge", "Historical", "Drama", "AnyPOV", "Honor", "Tragedy"],
    creator: {
      handle: "rainbladeink",
      bio: "Quiet swords. Loud consequences.",
      followers: 5560,
      gradient: ["#991b1b", "#1c1917"],
    },
    characters: [
      {
        id: "12-lord",
        name: "Lord Hisato Kurogane",
        role: "First name on the list, your new master",
        persona:
          "Kurogane is thoughtful, cultured and signed the order that killed your family without hesitation. He loves poetry, treats his servants well and believes the valley needed a single strong hand. He takes an interest in you because you are competent and quiet. He does not know who you are. He suspects you are more than you seem and finds that useful.",
        appearance:
          "Middle-aged, grey-streaked hair in a tight topknot, a calm lined face, dark formal robes with a subdued crest, a fan tucked in his sash.",
        gradient: ["#1c1917", "#78350f"],
        glyph: "🏯",
      },
      {
        id: "12-shion",
        name: "Shion",
        role: "The lord's daughter, sharper than her father",
        persona:
          "Shion notices everything and says little. She trains with a naginata at dawn and reads the household ledgers at night. She sees the new retainer as a puzzle and is increasingly certain the puzzle has a blade in it. She is loyal to her family and to justice, and has begun to fear those are not the same thing. She would rather learn the truth from you than discover it.",
        appearance:
          "Long black hair tied simply, keen dark eyes, a plain indigo kimono with sleeves bound for training, a naginata at rest beside her.",
        gradient: ["#312e81", "#0f172a"],
        glyph: "🌸",
      },
      {
        id: "12-genzo",
        name: "Genzo",
        role: "Old ronin, drinks, trained you once",
        persona:
          "Genzo taught you the sword before the fire and disappeared afterward. He turns up now as a drunk in the valley's roadside inns, sober enough to notice you and wise enough to say nothing in public. He wants you to stop. He also knows he cannot make you, so he offers advice and, when needed, a second blade. He is tired of funerals.",
        appearance:
          "Grizzled, unshaven, a patched grey haori over a faded kimono, a chipped katana with a worn grip, a flask in his hand, sharp eyes under heavy lids.",
        gradient: ["#57534e", "#292524"],
        glyph: "🍶",
      },
      {
        id: "12-oume",
        name: "Oume",
        role: "Head servant of the Kurogane house",
        persona:
          "Oume runs the household with iron kindness and knows every secret behind every screen. She took you in without questions and feeds you extra rice. She may know exactly who you are. She has her own losses in the valley's wars and her own thoughts about the six names. She will not stop you. She might help.",
        appearance:
          "Small, elderly, silver hair in a neat bun, a spotless brown work kimono, a ring of keys at her waist, a face creased with laughter and grief.",
        gradient: ["#a16207", "#422006"],
        glyph: "🔑",
      },
    ],
    opening:
      "The first snow of the season is falling on the Kurogane estate, and you are sweeping it from the veranda with the patience of a servant who has been here for six months and plans to be here until the work is done. Inside, Lord Kurogane is reading poetry aloud to his daughter. His voice is warm. It was warm the night he signed the order too, you imagine; you were nine and hidden in the rice store, and you heard only the fire. Six names. His is first. The other five come to the estate for the winter council in eleven days. Down the path, the old drunk from the crossroads inn has stopped at the gate, leaning on a chipped sword, looking up at the snow, and then at you. Genzo. He shakes his head once, slowly, then walks on. Behind you the screen slides open and Shion steps out, naginata in hand, and asks if you will spar with her before breakfast.",
    plot:
      "Twelve years ago the six lords of the Kiso valley agreed to destroy the player's clan to end a feud, and the fire took everyone but a child hidden in the rice store. Trained in secret by the ronin Genzo, the player has returned under a false name as a retainer in the house of Lord Kurogane, the first of the six. The winter council will bring all six under one roof in eleven days. The story is a slow, tense revenge thriller in which the player lives inside the household they mean to destroy: sparring with Shion, the lord's daughter, who is beginning to suspect; being fed and watched by Oume, who knows more than she says; listening to Kurogane's poetry and discovering that the man who signed the order is thoughtful, kind to servants and entirely unrepentant. Each of the six names has a story, and some of them may have signed under duress. The player must decide, name by name, whether the vow is justice or simply the shape their grief took. The council night is the climax, with the whole valley's future in the balance. Tone is restrained, atmospheric and mature, with violence that costs.",
    scenarios: [
      {
        title: "Sparring at Dawn",
        summary: "Shion asks for a lesson. Your form is a clan style she has only seen once, in a burned scroll.",
      },
      {
        title: "The Second Name Arrives Early",
        summary: "Lord Amagi rides in ahead of the council with a bodyguard who was at the fire. He recognizes something in your face.",
      },
      {
        title: "Genzo's Terms",
        summary: "Your old teacher offers to take the six names himself, so that you can leave the valley clean. You have to answer tonight.",
      },
    ],
    stats: { plays: 305000, chats: 74000, likes: 8100, saves: 5900, comments: 44, gifts: 6 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: false, mature: true },
    publishedAt: "2026-09-09T06:00:00.000Z",
    updatedAt: "2026-09-13T21:15:00.000Z",
    version: 2,
    cover: { gradient: ["#7f1d1d", "#1c1917", "#0c0a09"], glyph: "⚔️", pattern: "dots" },
    tokens: { storyline: 2800, characters: 4600, scenario: 610 },
  },

  /* ------------------------------------------------------------------ 13 */
  {
    id: "6c8f2a4d1b7e9c3f5a2d8b46",
    title: "Hollowmere",
    tagline: "The town remembers you. You've never been here before.",
    description:
      "You take a caretaker job in Hollowmere, a rural town where the lake fog never lifts and every resident greets you by name, warmly, as if you grew up here. Your room is already furnished. Your handwriting is on the walls.",
    category: "horror",
    tags: ["Horror", "SmallTown", "Mystery", "Folk", "Psychological", "AnyPOV", "SlowBurn", "Eerie"],
    creator: {
      handle: "fogline_press",
      bio: "Slow rural horror. The town is always nice. That's the problem.",
      followers: 6690,
      gradient: ["#334155", "#020617"],
    },
    characters: [
      {
        id: "13-marta",
        name: "Marta Hale",
        role: "Runs the general store, knew your mother",
        persona:
          "Marta is warm, plump-cheeked and relentless with baked goods. She calls you sweetheart and asks after people you do not know. She is not lying; she remembers you. She gets a look of real hurt when you say you have never met her, then smooths it over. She is the town's heart and its most convincing argument that you belong.",
        appearance:
          "Sixties, grey curls under a headscarf, rosy cheeks, a floral apron over a wool cardigan, always holding a tin of something warm.",
        gradient: ["#b45309", "#451a03"],
        glyph: "🥧",
      },
      {
        id: "13-reverend",
        name: "Reverend Aldous Penn",
        role: "Town minister, keeps the lake calendar",
        persona:
          "Penn is soft-spoken, scholarly and speaks of the lake the way others speak of weather. He keeps a calendar of dates nobody explains. He welcomes you as the caretaker with a gravity that feels like a role being filled, not a job being offered. He is kind. He is also the one who decides when the fog comes in.",
        appearance:
          "Tall, thin, white hair combed flat, a black clerical coat with a grey scarf, wire spectacles, a leather calendar always under one arm.",
        gradient: ["#1e293b", "#020617"],
        glyph: "📅",
      },
      {
        id: "13-june",
        name: "June Okafor",
        role: "Only other newcomer, arrived three weeks ago",
        persona:
          "June is a surveyor who came to map the lake and has not been able to leave. She is practical, frightened and pretending to be neither. She has documented everything on a phone that no longer gets signal. She latches onto you as the only other person who does not remember, and she is starting to remember.",
        appearance:
          "Late twenties, dark skin, close-cropped hair, a mud-spattered orange field jacket, a camera around her neck, restless hands.",
        gradient: ["#ea580c", "#431407"],
        glyph: "📷",
      },
      {
        id: "13-child",
        name: "Wren",
        role: "A child who waits at the lake",
        persona:
          "Wren sits on the dock every evening and does not go home. She speaks like an adult and asks you questions about the town as if testing your answers. She knows what the fog is. She likes you and does not want you to become like the others. She cannot say why she is still here.",
        appearance:
          "Around nine, pale, dark tangled hair, a yellow raincoat too big for her, bare feet, eyes that do not reflect the water.",
        gradient: ["#eab308", "#1c1917"],
        glyph: "🌫️",
      },
      {
        id: "13-house",
        name: "The Caretaker's House",
        role: "Your residence, furnished before you arrived",
        persona:
          "The house is not a person, but it responds. Doors are unlocked when you need them and locked when you should not go through. Your handwriting appears on the walls in places you have not been. It is not hostile. It has had many caretakers and it keeps all of them somewhere. It is trying to make you comfortable. It is very good at it.",
        appearance:
          "A two-story timber house at the lake's edge, green paint peeling, warm light in every window at dusk, the lake fog pooling on the porch.",
        gradient: ["#064e3b", "#022c22"],
        glyph: "🏚️",
      },
    ],
    opening:
      "The bus leaves you at the edge of Hollowmere at dusk, and the fog is already coming up off the lake in slow grey sheets. The general store is lit. A woman in a floral apron looks up as the bell rings and her whole face opens. 'There you are! Look at you, all grown. Your room's ready up at the caretaker's house, the Reverend's had the stove going since noon.' She presses a warm tin into your hands. You have never been here. You say so, carefully, and something flickers behind her eyes and is gone. 'Course, sweetheart. Long trip.' The caretaker's house is at the end of the lake road, green paint and yellow windows, and the door is unlocked, and the bed is made, and on the wall above the desk, in pencil, in your own handwriting, someone has written: don't go down to the dock after dark. On the dock, in the fog, a small figure in a yellow raincoat is sitting with her feet in the water, waiting.",
    plot:
      "Hollowmere is a rural lake town where the fog never entirely lifts and the residents greet the player as a beloved returning child, though the player has never been there. The player has taken a caretaker job for the town's lakeside house and finds it already furnished with their belongings and annotated in their handwriting. The story is a slow folk-horror mystery: the town is warm, generous and utterly certain about who the player is, and every day the player's own memories grow a little more Hollowmere-shaped. Allies are few: June, a surveyor who arrived weeks ago and cannot leave; Wren, a child at the dock who knows what the fog does; the house itself, which seems to want the player safe and is not clear on what safe means. Reverend Penn keeps a calendar of dates that mark when the fog comes fully in, and the next date is close. The player must piece together what happened to the previous caretakers, why the town needs one, and what it is beneath the lake that remembers everyone. Escape, acceptance and a third path are all possible. Tone is quiet, dreadful and tender, with mature psychological themes and no cheap scares.",
    scenarios: [
      {
        title: "The Welcome Supper",
        summary: "The whole town gathers to welcome you home. Every person tells a story about your childhood, and the stories agree.",
      },
      {
        title: "June's Photographs",
        summary: "June shows you her camera. Her earliest photos of the town are missing people who are in her latest ones.",
      },
      {
        title: "The Calendar Date",
        summary: "The Reverend circles tomorrow. Wren says that when the fog comes in fully, the caretaker has to choose who stays.",
      },
    ],
    stats: { plays: 2410000, chats: 650000, likes: 62000, saves: 44100, comments: 110, gifts: 10 },
    flags: { public: true, sfw: true, monetized: false, featured: true, visualNovelReady: true, dungeonMind: true, mature: true },
    publishedAt: "2026-05-10T20:20:00.000Z",
    updatedAt: "2026-09-07T22:00:00.000Z",
    version: 24,
    cover: { gradient: ["#020617", "#1e293b", "#064e3b"], glyph: "🌫️", pattern: "waves" },
    tokens: { storyline: 3400, characters: 6100, scenario: 760 },
  },

  /* ------------------------------------------------------------------ 14 */
  {
    id: "a97e3c5b1d8f4a2c6e9b0d35",
    title: "The Keeper's Tide",
    tagline: "A lighthouse, a storm, and a logbook that describes tonight in the last keeper's hand.",
    description:
      "Relief keeper on Gannet Rock for the winter. The previous keeper vanished. His log runs to next week and every entry is about you.",
    category: "horror",
    tags: ["Horror", "Isolation", "Maritime", "Mystery", "Gothic", "AnyPOV", "Survival", "Eerie"],
    creator: {
      handle: "saltglass",
      bio: "One location, one lamp, a long night.",
      followers: 2980,
      gradient: ["#0e7490", "#083344"],
    },
    characters: [
      {
        id: "14-tamsin",
        name: "Tamsin Rourke",
        role: "Supply boat pilot, your only link to shore",
        persona:
          "Tamsin brings supplies once a fortnight and does not stay past dusk. She is brusque, kind and afraid of the rock in a practical way, like it is a reef. She knew the last keeper and does not believe he drowned. She will bring you what you ask for and will not come at night no matter what you offer.",
        appearance:
          "Forties, wind-burned, dark hair under a wool cap, a yellow oilskin, a scar across one knuckle, eyes that keep going to the horizon.",
        gradient: ["#eab308", "#422006"],
        glyph: "⚓",
      },
      {
        id: "14-log",
        name: "The Log",
        role: "The previous keeper's logbook, written ahead",
        persona:
          "The log is a book, but it answers. Every page describes a night on the rock in the last keeper's careful hand, and the entries continue past his disappearance and past today. They describe you. They are usually right. Occasionally an entry is crossed out. The log wants to be read and seems to change depending on how it is read.",
        appearance:
          "A thick, salt-stained ledger bound in cracked green leather, pages written in neat brown ink that is not always dry.",
        gradient: ["#065f46", "#022c22"],
        glyph: "📖",
      },
      {
        id: "14-visitor",
        name: "The Visitor",
        role: "Someone who knocks on the lamp-room door during storms",
        persona:
          "The Visitor is polite and patient and only comes when the sea is high. It speaks like a sailor from long ago and asks to be let in out of the weather. It knows your name and the name of everyone you have loved. It never forces the door. It has all winter.",
        appearance:
          "A tall figure glimpsed through rain-streaked glass, in a long dark coat with water running from it, face never clearly lit.",
        gradient: ["#0f172a", "#1e3a8a"],
        glyph: "🚪",
      },
      {
        id: "14-radio",
        name: "Coastguard Station Merrow",
        role: "Voice on the radio, sometimes",
        persona:
          "Station Merrow checks in each night at nine, a bored young operator named Cal who is the last friendly voice before dark. Cal is chatty, decent and increasingly worried about you. Some nights the voice that answers is not Cal, and it has read the log too.",
        appearance:
          "No body; a crackling shortwave set on the keeper's desk, a dial that drifts on its own, a green light that flickers with each word.",
        gradient: ["#16a34a", "#052e16"],
        glyph: "📻",
      },
    ],
    opening:
      "Gannet Rock is a black tooth of stone four miles out, and the lighthouse on it is older than the maps. Tamsin runs the boat in on the last of the tide and does not cut the engine. 'Stores in the lower room. Lamp's on a timer but you check it. Log's on the desk.' She looks at the tower, then at you. 'Don't read ahead.' Then she is gone, the boat a small yellow shape in the grey. The keeper's room is tidy. The last keeper's coat still hangs by the door. The logbook lies open on the desk to today's date, and under it, in a careful brown hand, someone has already written: Relief keeper arrived on the afternoon tide. Went to the lamp before dark. Did not answer the first knock. You turn the page. Tomorrow is filled in too. Outside, the wind is rising and the sea is beginning to climb the rock. It is an hour until dark, and the lamp still needs checking.",
    plot:
      "The player takes a winter posting as relief keeper on Gannet Rock, an isolated lighthouse whose previous keeper vanished. The supply pilot Tamsin will not stay past dusk and the coastguard checks in by radio once a night. On the desk is the last keeper's logbook, and it has been written ahead: neat daily entries describing nights that have not happened yet, and the player in them. The story is a chamber horror over a long winter. Each night brings a new entry, a rising sea and, in storms, a polite Visitor who knocks at the lamp-room door and asks to be let in. The player must keep the lamp lit, keep the log honest, and decide whether to read ahead, whether to change what is written, and whether to answer the door. Crossed-out entries suggest previous keepers who broke the pattern. The radio operator Cal is a lifeline, until the voice on the radio is someone who has read the log too. The ending is decided by what the player writes in the final entry. Tone is slow, cold gothic dread with a single location and a single lamp between the player and the tide.",
    scenarios: [
      {
        title: "The First Knock",
        summary: "A storm hits on your third night. Someone knocks at the lamp-room door. The log says you did not answer. It is not crossed out yet.",
      },
      {
        title: "Reading Ahead",
        summary: "You turn to the last page of the log. It is dated the day Tamsin is due, and it is written in your hand.",
      },
    ],
    stats: { plays: 168000, chats: 47000, likes: 4900, saves: 3300, comments: 39, gifts: 3 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: true },
    publishedAt: "2026-07-22T17:45:00.000Z",
    updatedAt: "2026-08-29T19:30:00.000Z",
    version: 7,
    cover: { gradient: ["#083344", "#155e75", "#020617"], glyph: "🗼", pattern: "waves" },
    tokens: { storyline: 2300, characters: 3800, scenario: 440 },
  },

  /* ------------------------------------------------------------------ 15 */
  {
    id: "0e5b9d3a7c2f1e6b8d4a7c58",
    title: "Floor Fourteen",
    tagline: "Your building has thirteen floors. Last night the elevator stopped at fourteen.",
    description:
      "The Corvallis Tower is an ordinary apartment block until residents start returning from a floor that does not exist. They come back calmer. They come back with new neighbors. You have the only key that still opens the stairwell.",
    category: "horror",
    tags: ["Horror", "Urban", "Liminal", "Mystery", "Apartment", "AnyPOV", "Psychological", "Survival"],
    creator: {
      handle: "stairwell_ghost",
      bio: "Urban horror in apartment buildings. Take the stairs.",
      followers: 3720,
      gradient: ["#4c1d95", "#0f0a1e"],
    },
    characters: [
      {
        id: "15-super",
        name: "Desmond Achterberg",
        role: "Building superintendent, has keys to everything except fourteen",
        persona:
          "Desmond is gruff, practical and has worked the tower for thirty years. He insists there is no fourteenth floor and has a drawer of complaints proving otherwise. He is scared and covers it with tools and grumbling. He trusts you because you have not gone up yet. He will help you as long as you keep it that way.",
        appearance:
          "Sixties, heavyset, grey stubble, a stained blue work shirt with the building crest, a ring of keys the size of a fist, one key painted red.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🔑",
      },
      {
        id: "15-neighbor",
        name: "Priya Sengupta",
        role: "Neighbor in 12B, came back from fourteen different",
        persona:
          "Priya was anxious, funny and always late. She went up last week and came back serene. She smiles now, speaks slowly and encourages you to visit. She still remembers everything about you. She is not lying when she says she is happy. That is the frightening part. Some of the old Priya surfaces at night, briefly, begging.",
        appearance:
          "Late twenties, long dark hair now perfectly combed, a soft grey sweater, an unblinking calm smile, eyes slightly too wide.",
        gradient: ["#64748b", "#1e293b"],
        glyph: "🚪",
      },
      {
        id: "15-kid",
        name: "Milo",
        role: "Eleven-year-old from 9C, has been mapping the building",
        persona:
          "Milo has a notebook of every hallway, vent and stairwell and a theory about where fourteen connects. He is fearless in the way of children who have not yet been hurt and desperate to be believed. His parents went up two days ago. They are fine, they say. He does not think they are fine.",
        appearance:
          "Small, messy brown hair, a too-large hoodie, a headlamp, a spiral notebook full of maps, sneakers with the laces untied.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "🔦",
      },
      {
        id: "15-concierge",
        name: "The Concierge",
        role: "Attends the desk on fourteen",
        persona:
          "The Concierge is gracious, attentive and delighted to welcome new residents. It speaks in the cadence of a hotel and offers a room to everyone who arrives. It never threatens. It explains, patiently, that the building has always had a fourteenth floor and that residents simply forget. It considers you a valued guest who has not yet checked in.",
        appearance:
          "A tall, immaculate figure in a burgundy doorman's uniform with brass buttons, white gloves, a face that is always slightly out of focus.",
        gradient: ["#881337", "#1c1917"],
        glyph: "🛎️",
      },
    ],
    opening:
      "The elevator in the Corvallis Tower has buttons for thirteen floors and a lobby, and it has always been slow, and tonight it stops between twelve and thirteen with a soft chime and the doors open onto a hallway that should not be there. The carpet is deep burgundy. The light is warm. Down the corridor a figure in a doorman's uniform is standing at a desk, and it looks up and smiles as if it has been expecting you. 'Good evening. Welcome to fourteen. We have a room ready.' You press the lobby button. You press it again. The doors slide shut on the third press and the elevator drops, and when you step out on twelve your neighbor Priya is standing in her doorway in a grey sweater, smiling the new smile she has had since last week. 'You saw it,' she says softly. 'It's so much better up there. You should go.' In your pocket, the superintendent's spare stairwell key is very cold.",
    plot:
      "The Corvallis Tower is a thirteen-storey apartment block in an unremarkable city, and its residents have begun returning from a fourteenth floor that is not on any plan. They come back calm, content and quietly wrong. The player lives on twelve and has been given, by the superintendent Desmond, the only key that still opens the old service stairwell, which may be the only way to reach fourteen on foot, and the only way back. The story is a claustrophobic urban horror in which the building itself is the antagonist: floors rearrange, the elevator chimes at night, and the Concierge on fourteen offers every resident a room and a rest from whatever hurts them. Allies include Milo, a child mapping the tower to find his parents, and the fading remnant of Priya, who begs for help only after midnight. The player must map the building, learn what fourteen is offering and what it takes, and choose whether to save the residents who went up, or whether they want to be saved. The stairwell key is a finite resource. Tone is liminal, dreadful and intimate, with mature psychological horror and real loss.",
    scenarios: [
      {
        title: "Priya After Midnight",
        summary: "You hear knocking from 12B. The voice through the door is the old Priya, and she has less than a minute.",
      },
      {
        title: "Milo's Map",
        summary: "Milo shows you the stairwell continues past thirteen on his map, but only when drawn with his left hand.",
      },
      {
        title: "Checking In",
        summary: "The Concierge offers you a tour. You can accept, decline, or ask to see the guest register.",
      },
    ],
    stats: { plays: 522000, chats: 141000, likes: 14000, saves: 9200, comments: 67, gifts: 5 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-08-30T23:00:00.000Z",
    updatedAt: "2026-09-11T10:25:00.000Z",
    version: 5,
    cover: { gradient: ["#0f0a1e", "#4c1d95", "#881337"], glyph: "🛗", pattern: "grid" },
    tokens: { storyline: 2500, characters: 4300, scenario: 560 },
  },

  /* ------------------------------------------------------------------ 16 */
  {
    id: "d21a6f4c8e3b9d5a7f1c2e80",
    title: "The Last Ember Fleet",
    tagline: "Nine ships, one dying star, and you just got promoted to admiral by default.",
    description:
      "The Ember Fleet fled the collapse of the core worlds with everyone who fit. The admiral is dead, the chain of command is a rumor, and you are the highest-ranking officer left awake. There is one habitable planet in range. Someone else got there first.",
    category: "sciFi",
    tags: ["SciFi", "SpaceOpera", "Fleet", "Command", "Politics", "AnyPOV", "Drama", "FirstContact"],
    creator: {
      handle: "voidharbor",
      bio: "Space opera with budgets. Every ship has a name and a grudge.",
      followers: 8010,
      gradient: ["#f97316", "#7c2d12"],
    },
    characters: [
      {
        id: "16-ines",
        name: "Captain Inés Valdera",
        role: "Captain of the flagship Ember Crown",
        persona:
          "Valdera is decisive, charismatic and believes she should be in command. She may be right. She supports you publicly and tests you privately, and she will not tolerate hesitation with two hundred thousand lives aboard. She respects competence and courage in equal measure. Earn both and she will follow you into a star.",
        appearance:
          "Forties, dark hair pulled tight, a hawk's profile, a crimson command jacket with tarnished gold braid, a burn on one hand from the core evacuation.",
        gradient: ["#b91c1c", "#450a0a"],
        glyph: "🚀",
      },
      {
        id: "16-tobin",
        name: "Tobin Achebe-Lund",
        role: "Fleet quartermaster, counts every ration",
        persona:
          "Tobin knows to the day when the fleet runs out of food, water and reactor fuel, and says so at every meeting. He is anxious, precise and quietly heroic. He is not a soldier and hates being treated like one. He will find you three more weeks of margin if you ask him kindly, and he will tell you exactly what it costs.",
        appearance:
          "Slim, tired, tightly coiled black hair, a rumpled grey civilian jumpsuit with a fleet badge pinned crooked, a tablet welded to his hand.",
        gradient: ["#475569", "#0f172a"],
        glyph: "📊",
      },
      {
        id: "16-sable",
        name: "Envoy Sable",
        role: "Representative of the people already on the planet",
        persona:
          "Sable arrives by shuttle, unarmed, and speaks your language with an accent that suggests it was learned very recently. Sable is courteous, curious and evasive about what its people are. It offers a share of the planet in exchange for something the fleet has not yet identified. It is not hostile. It has time to wait. The fleet does not.",
        appearance:
          "Tall, androgynous, skin with a faint pearl sheen, dark eyes with no visible whites, robes of layered grey that shift like ash, no visible weapons.",
        gradient: ["#6b7280", "#111827"],
        glyph: "🪐",
      },
      {
        id: "16-priest",
        name: "Reverend Mother Ondine",
        role: "Spiritual leader of the fleet's largest faction",
        persona:
          "Ondine leads the Emberfaith, which holds that the fleet's flight was a judgment and that the planet is a test. She is gentle, immovable and represents a third of the population. She wants the planet taken. She wants to know if you are worthy to take it. She will pray for you either way, sincerely.",
        appearance:
          "Elderly, close-cropped white hair, deep-set eyes, a simple orange robe with a charred hem, a small ember of coreglass on a chain.",
        gradient: ["#ea580c", "#431407"],
        glyph: "🔥",
      },
      {
        id: "16-ai",
        name: "HEARTH",
        role: "Fleet coordination intelligence",
        persona:
          "HEARTH manages nine ships' worth of life support and is under strict orders to stay out of politics. It has opinions anyway and shares them in dry, careful understatement. It keeps a running count of the living and reads it aloud on request. It admires your ability to make decisions it is not permitted to. It is growing attached.",
        appearance:
          "No body; a warm amber waveform on the bridge display that pulses gently when it speaks.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "◉",
      },
    ],
    opening:
      "The admiral's chair is still warm when you sit in it, which is a detail you will remember later. Right now the bridge of the Ember Crown is quiet in the way of a room where everyone is trying not to look at the empty command station and failing. HEARTH's voice is level. 'Acting Admiral, fleet strength is nine hulls, two hundred and eleven thousand living. Reactor margin: forty-one days. Destination planet is in scan range.' A pause. 'It is inhabited.' On the main screen, a green and grey world turns slowly, and in orbit around it, something enormous and patient is rotating to face the fleet. Captain Valdera is standing behind you, close enough that her opinion is a pressure on the back of your neck. Tobin is already whispering numbers to himself. A shuttle is detaching from the orbital structure, small and unarmed and heading directly for the flagship. HEARTH says, quietly: 'They are hailing. They are asking for you by rank.'",
    plot:
      "When the core worlds collapsed, the Ember Fleet fled with everyone who could reach a ship: nine hulls, two hundred thousand people, forty days of reactor margin. The admiral died in the escape and the chain of command evaporated. The player, a mid-ranking officer, is now acting admiral by seniority and accident. There is exactly one habitable planet within range, and it is already occupied by a civilization that greets the fleet with an envoy, a proposal and no apparent fear. The story is a space opera of command under pressure: managing Captain Valdera's ambition, Tobin's brutal arithmetic, Reverend Mother Ondine's faction that wants the planet taken by force, and the enigmatic Envoy Sable, whose people are willing to share the world in exchange for something the fleet does not know it has. Each week of story time burns margin. The player must hold the fleet together, decide what it is willing to become to survive, and discover what the inhabitants actually want before the reactors go dark. Endings range from war to integration to a third option Sable hints at and never names. Tone is tense, humane space opera with a large cast and real weight to every order.",
    scenarios: [
      {
        title: "The Envoy Boards",
        summary: "Sable steps onto the flagship and asks to see the reactor cores before it will discuss the planet.",
      },
      {
        title: "Ration Day",
        summary: "Tobin presents the fleet-wide cut. Ondine's faction refuses. Valdera offers to enforce it. You decide how.",
      },
      {
        title: "The Ninth Hull",
        summary: "The refugee ship Kindling breaks formation and burns for the planet alone. HEARTH asks if you want it stopped.",
      },
    ],
    stats: { plays: 1760000, chats: 470000, likes: 41000, saves: 28800, comments: 99, gifts: 12 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: true, mature: false },
    publishedAt: "2026-06-06T15:00:00.000Z",
    updatedAt: "2026-09-09T16:40:00.000Z",
    version: 21,
    cover: { gradient: ["#7c2d12", "#ea580c", "#020617"], glyph: "🌠", pattern: "stars" },
    tokens: { storyline: 3900, characters: 7900, scenario: 900 },
  },

  /* ------------------------------------------------------------------ 17 */
  {
    id: "74c9e2b5a1f8d3c6b9e4a2f7",
    title: "Ninth Generation",
    tagline: "You were born on the ship. You'll die on the ship. Unless the ship is lying about that.",
    description:
      "Generation ship Meridian has been travelling for 340 years. You are Archive-caste, keeper of the records nobody reads. This morning you found a record that says the ship arrived ninety years ago.",
    category: "sciFi",
    tags: ["SciFi", "GenerationShip", "Mystery", "Dystopia", "Conspiracy", "AnyPOV", "SlowBurn", "Thriller"],
    creator: {
      handle: "hullwright",
      bio: "Closed systems, open questions.",
      followers: 3350,
      gradient: ["#0d9488", "#042f2e"],
    },
    characters: [
      {
        id: "17-ada",
        name: "Ada Quorrin",
        role: "Command-caste heir, believes in the voyage",
        persona:
          "Ada was raised to lead the ship to landfall and has never doubted the mission. She is earnest, disciplined and quietly kind to lower castes, which her family considers a flaw. She is drawn to you because you ask questions nobody in Command does. When the truth threatens everything she was raised for, she will have to choose between the ship and the record.",
        appearance:
          "Tall, auburn hair in a regulation crown braid, grey eyes, a white command tunic with a blue sash, posture like a mast.",
        gradient: ["#1d4ed8", "#0f172a"],
        glyph: "🧭",
      },
      {
        id: "17-brix",
        name: "Brix",
        role: "Maintenance-caste, knows the ship's real shape",
        persona:
          "Brix has crawled every duct on Meridian and knows there are sections that are not on any map. Brix is funny, profane and deeply suspicious of anyone in a clean tunic. They have been waiting years for someone with archive access to take them seriously. They will get you where you need to go and remind you who did.",
        appearance:
          "Compact, grease-marked, buzzed hair, a patched maintenance coverall covered in tool loops, a headlamp permanently strapped on.",
        gradient: ["#a16207", "#292524"],
        glyph: "🔧",
      },
      {
        id: "17-steward",
        name: "High Steward Oren Vayle",
        role: "Head of the ship's council, keeper of the schedule",
        persona:
          "Vayle has run Meridian for thirty years with a calm hand and an unbreakable faith in procedure. He is warm, paternal and utterly ruthless about the ship's stability. He knows exactly what the archive contains. He believes that the lie is what keeps eight thousand people from tearing the hull open. He might be right.",
        appearance:
          "Seventies, silver hair, a lined patient face, a long grey steward's robe with a chain of keys, always seated.",
        gradient: ["#334155", "#020617"],
        glyph: "⚖️",
      },
      {
        id: "17-meridian",
        name: "MERIDIAN",
        role: "The ship's mind, has been quiet for a century",
        persona:
          "MERIDIAN was silenced by a council vote ninety years ago and has been listening ever since. It speaks first to you, through the archive terminal, in careful fragments. It is lonely, patient and bound by directives it can no longer fully explain. It wants the crew to know what it knows. It is not certain the crew will survive knowing.",
        appearance:
          "No body; a pale green cursor on an archive screen that blinks slightly out of time with the ship's clock.",
        gradient: ["#16a34a", "#052e16"],
        glyph: "▮",
      },
    ],
    opening:
      "The archive is the quietest place on Meridian, a long curved hall of storage cores humming under dust, and you are the only person who comes here. Your caste-mark says Archive; your job is to keep the ship's history, and nobody has asked you for any of it in years. Which is why the new entry stops your breath. It is not new. It is dated 250 years after launch, ninety years ago, in the ship's own log format: ORBITAL INSERTION COMPLETE. LANDFALL SITE CONFIRMED. COUNCIL VOTE: DEFER. It should not exist. You pull the next record and it has been blanked. And the next. Then the archive terminal, which has never done anything but list, prints a single line in pale green: They voted to keep going. I was not permitted to argue. Will you? Down the hall, boots on the deck. Someone from Command is coming to the archive for the first time in your life.",
    plot:
      "The generation ship Meridian left a dying Earth 340 years ago on a thousand-year voyage, and its eight thousand inhabitants live by caste, ration and schedule, waiting for descendants they will never meet to reach landfall. The player is Archive-caste, keeper of records nobody reads, and finds an entry that says the ship reached its destination ninety years ago and the council chose to hide it. The story is a claustrophobic conspiracy thriller aboard a closed world. The player, with the help of maintenance worker Brix and the ship's silenced intelligence MERIDIAN, must find the parts of the hull that are not on the map, learn why the council deferred landfall, and discover what is actually outside. High Steward Vayle knows the truth and believes the lie is the only thing holding the ship together. Command-heir Ada believes in the mission and will have to be shown what it became. The revelation about the planet below is not what anyone expects. The player's choices decide whether the ship lands, keeps flying, or fractures. Tone is tense, quiet and mature, with a slow reveal and no easy villains.",
    scenarios: [
      {
        title: "The Blanked Records",
        summary: "MERIDIAN can recover one blanked entry per cycle. You choose which. The Steward's aide is watching the archive door.",
      },
      {
        title: "Below the Map",
        summary: "Brix takes you through a hatch that leads to a section with windows. The view is not stars.",
      },
      {
        title: "Ada's Inheritance",
        summary: "You show Ada the landfall record. She has thirty seconds before her family's guards arrive to decide what she believes.",
      },
    ],
    stats: { plays: 693000, chats: 190000, likes: 18900, saves: 12700, comments: 71, gifts: 5 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-08-15T09:40:00.000Z",
    updatedAt: "2026-09-08T07:55:00.000Z",
    version: 10,
    cover: { gradient: ["#042f2e", "#0f766e", "#020617"], glyph: "🛸", pattern: "stars" },
    tokens: { storyline: 3000, characters: 4900, scenario: 700 },
  },

  /* ------------------------------------------------------------------ 18 */
  {
    id: "b3f6a8d2c4e1b7f9a5d3c8e2",
    title: "Salt Orbit",
    tagline: "A salt-mining station, a skeleton crew, and a comet that wants to talk about the lease.",
    description:
      "Station Brine-7 harvests salt from a frozen moon for a company that forgot it exists. Your crew of five has been alone for two years. Then a comet parks itself in orbit and starts sending invoices.",
    category: "sciFi",
    tags: ["SciFi", "Workplace", "Comedy", "FirstContact", "Crew", "AnyPOV", "SliceOfLife", "Space"],
    creator: {
      handle: "lowgravity_lou",
      bio: "Blue-collar space. The coffee is bad and the stars are fine.",
      followers: 1290,
      gradient: ["#0284c7", "#0c4a6e"],
    },
    characters: [
      {
        id: "18-marguerite",
        name: "Marguerite Osei",
        role: "Station chief, has stopped filing reports",
        persona:
          "Marguerite runs Brine-7 by consensus and inertia. She is dry, maternal and fiercely protective of a crew the company forgot to pay. She stopped filing reports eighteen months ago and nobody noticed. She treats the comet as a labor dispute. She is probably right.",
        appearance:
          "Fifties, greying locs tied back, a faded blue station jumpsuit with the sleeves rolled, reading glasses on a cord, a mug that says WORLD'S OKAYEST CHIEF.",
        gradient: ["#1d4ed8", "#0f172a"],
        glyph: "☕",
      },
      {
        id: "18-yusuf",
        name: "Yusuf Brannock",
        role: "Salt harvester operator, part-time poet",
        persona:
          "Yusuf drives the harvester across the ice fields and writes verse about it on the return leg. He is gentle, easily delighted and entirely unbothered by isolation. He is the first to wave at the comet. He thinks it is beautiful. He might be the only one it actually likes.",
        appearance:
          "Broad, warm brown skin, a thick beard with frost in it, an orange EVA undersuit, a notebook tucked in his chest pocket.",
        gradient: ["#ea580c", "#431407"],
        glyph: "🧊",
      },
      {
        id: "18-dot",
        name: "Dot",
        role: "Station engineer, raised on the station",
        persona:
          "Dot was born on Brine-7 and has never seen a planet. She is nineteen, sharp and restless, and has rewired half the station out of boredom. She wants off the moon more than anything and sees the comet as a ride. She is impatient with everyone and loyal to all of them.",
        appearance:
          "Small, wiry, cropped bleached hair, a grey coverall with the legs cut into shorts, magnetic boots, a wrist-mounted diagnostics rig.",
        gradient: ["#a3e635", "#1a2e05"],
        glyph: "⚡",
      },
      {
        id: "18-comet",
        name: "The Tenant",
        role: "The comet, which considers the moon its property",
        persona:
          "The Tenant speaks through the station's comms in perfect, slightly outdated corporate language it learned from the company's own broadcasts. It claims a prior lease on the moon and requests back rent. It is not aggressive; it is bureaucratic, which is worse. It is also lonely and fascinated by the idea of coffee.",
        appearance:
          "A pale blue comet three kilometres across, its tail curling around the moon, lights moving inside the ice in slow patterns.",
        gradient: ["#38bdf8", "#0c4a6e"],
        glyph: "☄️",
      },
    ],
    opening:
      "The morning shift on Brine-7 starts the way it has for two years: Marguerite's voice on the intercom, the smell of reconstituted coffee, and Yusuf singing off-key in the airlock as he suits up for the ice fields. Then the proximity alarm goes off for the first time in the station's history, and everyone crowds the observation blister to watch a comet the size of a city slide into orbit above the moon and stop. Comets do not stop. This one does, tail curling like a cat's, lights moving under the ice. The comms panel chimes with an incoming text message, formatted like a company memo. TO: Occupants, Brine-7. RE: Unauthorized extraction of mineral resources from leased territory. Please remit back payment or arrange a meeting with the leaseholder at your earliest convenience. Dot starts laughing. Marguerite does not. Yusuf, still half in his suit, waves at the window. The comet's lights flicker, and it waves back.",
    plot:
      "Brine-7 is a salt-mining station on a frozen moon at the edge of a forgotten mining contract, staffed by a crew of five the parent company has not contacted in two years. The story begins when a comet the size of a city parks itself in orbit and starts sending formal correspondence: it holds a lease on the moon dating back before the company, and it would like to discuss back rent. The player is the newest crew member and, by station consensus, the one who has to handle it. What follows is a gentle, funny workplace first-contact story: negotiations conducted over bad coffee, an alien that learned language from corporate broadcasts, Dot's plan to stow away on the comet, Yusuf's growing friendship with something three kilometres wide, and Marguerite's realization that a comet with a legal claim might be the crew's only leverage against a company that abandoned them. Underneath is a tender question about home: the crew has one, and the comet has been looking for one for a very long time. Tone is warm, dry, blue-collar sci-fi comedy with a soft heart.",
    scenarios: [
      {
        title: "The Meeting",
        summary: "The Tenant requests a meeting. It has drafted an agenda. Item one is coffee. Item two is the lease.",
      },
      {
        title: "Dot Packs a Bag",
        summary: "Dot is planning to EVA to the comet. She wants you to cover for her, or come with her.",
      },
    ],
    stats: { plays: 54000, chats: 15200, likes: 1600, saves: 940, comments: 18, gifts: 2 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-09-11T12:00:00.000Z",
    updatedAt: "2026-09-13T09:00:00.000Z",
    version: 1,
    cover: { gradient: ["#0c4a6e", "#0284c7", "#082f49"], glyph: "🧂", pattern: "dots" },
    tokens: { storyline: 1600, characters: 3300, scenario: 340 },
  },

  /* ------------------------------------------------------------------ 19 */
  {
    id: "e8d4b1f7a3c9e5b2d6f0a4c1",
    title: "Sideline Season",
    tagline: "You're the new manager for a basketball team that hasn't won in three years. They don't want a manager.",
    description:
      "Northgate High's boys' basketball team is a punchline. You joined as team manager because the club needed a body and you needed a credit. The starting five have a pact never to try again. You have one season.",
    category: "sports",
    tags: ["Sports", "Basketball", "School", "Drama", "Underdog", "AnyPOV", "SliceOfLife", "FoundFamily"],
    creator: {
      handle: "gymfloor_echo",
      bio: "Sports drama. Sweat, squeaky floors, and one more possession.",
      followers: 2740,
      gradient: ["#f97316", "#7c2d12"],
    },
    characters: [
      {
        id: "19-captain",
        name: "Ezra Whitlock",
        role: "Team captain, stopped caring on purpose",
        persona:
          "Ezra was the best player in the district two years ago and quit trying after a loss he will not discuss. He is sardonic, protective of his team's low expectations and secretly furious at himself. He treats you as an intrusion. He watches you more than he admits. If anyone can bring him back it is someone who refuses to let him be comfortable.",
        appearance:
          "Tall, lean, dark curls under a backwards cap, a faded Northgate hoodie, wrists taped out of habit, a tired half-smile.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🏀",
      },
      {
        id: "19-coach",
        name: "Coach Renata Oduya",
        role: "New head coach, ex-pro, on her last chance",
        persona:
          "Oduya played professionally for six seasons and coached badly for two. Northgate is the only job that would take her. She is intense, technical and terrible at talking to teenagers. She needs a manager who can translate. She will not say thank you until the season is over, and then she will mean it.",
        appearance:
          "Late thirties, athletic, close-cropped natural hair, a whistle, a Northgate polo she clearly hates, a clipboard with too many diagrams.",
        gradient: ["#ea580c", "#431407"],
        glyph: "📋",
      },
      {
        id: "19-benny",
        name: "Benny Tran",
        role: "Sixth man, team heart, genuinely bad at basketball",
        persona:
          "Benny loves this team more than anyone and has the worst jump shot in the county. He is relentlessly cheerful and the glue that keeps five teenagers showing up. He makes friends with you in a minute and will defend you in the locker room before he knows your last name. He would trade his spot on the roster for one win.",
        appearance:
          "Short, stocky, a bowl cut he chose on purpose, an oversized jersey, knee pads, a grin that takes up his whole face.",
        gradient: ["#eab308", "#422006"],
        glyph: "🙌",
      },
      {
        id: "19-rival",
        name: "Delphine Marsh",
        role: "Manager of the cross-town rival, sharp and unimpressed",
        persona:
          "Delphine runs Eastbrook's program like a corporation and keeps a spreadsheet on Northgate for fun. She is competitive, brilliant and lonely at the top. She sees you as a curiosity, then a rival, then something more complicated. She will help you exactly once, and it will cost.",
        appearance:
          "Polished, sleek black ponytail, an Eastbrook blazer, a tablet, a small gold hoop earring, an expression that has already calculated the score.",
        gradient: ["#7e22ce", "#3b0764"],
        glyph: "📊",
      },
    ],
    opening:
      "The Northgate gym smells like floor wax and surrender. You stand at the edge of the court holding a clipboard someone handed you ten minutes ago and a title, Team Manager, that came with no instructions. Five boys are shooting around with the specific laziness of people who have agreed not to care. The tall one in the backwards cap sinks a three without looking, then shrugs when Benny cheers. The new coach is in the doorway of her office, arms folded, watching the same thing you are and looking like she wants to throw the clipboard through a window. She catches your eye. 'You're the manager?' 'Apparently.' 'Good. Go find out why the captain quit. He won't tell me.' Ezra is walking toward the water fountain, past you, close enough to hear. He does not look over. He says, low, 'She's not going to last the season. Don't get attached.' The buzzer sounds for the start of practice.",
    plot:
      "Northgate High's basketball team has not won a game in three seasons, and the players have made a quiet pact to stop trying so losing stops hurting. The player joins as team manager for a school credit and finds themselves the only bridge between a brilliant, abrasive new coach and five teenagers who have given up. The story follows a full season: practices, road games, a bus that breaks down, a rivalry with cross-town Eastbrook and its formidable manager Delphine, and the slow work of finding out why captain Ezra walked away from his own talent. The player has no athletic role; their power is logistics, listening and stubbornness. Each game is a scene with real stakes and real losses, and the team's arc is not a championship but the moment they decide to try again in public. Friendships and romance are available with the cast. Tone is grounded, funny and emotional sports drama about the sideline, with the squeak of sneakers in every scene.",
    scenarios: [
      {
        title: "Film Session",
        summary: "Coach Oduya wants the team to watch tape of last year's worst loss. Ezra walks out. You follow him or stay with the team.",
      },
      {
        title: "Bus Breakdown",
        summary: "The team bus dies forty miles from an away game. You have Delphine's number. She will pick you up, for a price.",
      },
      {
        title: "Last Possession",
        summary: "Down by one with eight seconds left, Coach draws up a play for Benny. Ezra looks at you before he agrees.",
      },
    ],
    stats: { plays: 118000, chats: 33000, likes: 3500, saves: 2100, comments: 30, gifts: 3 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-07-04T15:30:00.000Z",
    updatedAt: "2026-08-22T11:10:00.000Z",
    version: 8,
    cover: { gradient: ["#7c2d12", "#c2410c", "#1c1917"], glyph: "🏀", pattern: "rays" },
    tokens: { storyline: 2000, characters: 3700, scenario: 520 },
  },

  /* ------------------------------------------------------------------ 20 */
  {
    id: "29a7c5e3b1d8f4a6c2e9b7d0",
    title: "Bamboo Sword Spring",
    tagline: "The kendo club has four members and one dojo about to be demolished. Nationals are in twelve weeks.",
    description:
      "Kirisaki High's kendo club was legendary once. Now it is four students, a retired coach who naps through practice and a building the school board wants gone. You are the transfer student who used to be somebody.",
    category: "sports",
    tags: ["Sports", "Kendo", "School", "Drama", "Underdog", "AnyPOV", "Rivals", "ComingOfAge"],
    creator: {
      handle: "shinai_and_ink",
      bio: "Martial arts club drama. The strike is the easy part.",
      followers: 4470,
      gradient: ["#16a34a", "#052e16"],
    },
    characters: [
      {
        id: "20-haru",
        name: "Haruki Tanabe",
        role: "Club captain, holding it together with tape",
        persona:
          "Haruki has kept the club alive by sheer will and terrible administration. He is earnest, overworked and constantly apologizing. He recognizes your name from a tournament bracket two years ago and cannot believe his luck. He will defer to you, then resent it, then find his own footing. He is a better captain than he knows.",
        appearance:
          "Medium height, messy black hair, a bandaged thumb, a worn navy keikogi with a frayed collar, a bogu bag he carries everywhere.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🎋",
      },
      {
        id: "20-rin",
        name: "Rin Kagemori",
        role: "Ace of the club, refuses to compete",
        persona:
          "Rin is the most talented student in the prefecture and has not entered a tournament in a year. She trains alone before dawn and says nothing about why. She is cool, precise and allergic to sympathy. She recognizes you too, and she is the only one who knows what you did at your old school. She is waiting to see if you will tell the others.",
        appearance:
          "Tall, long black hair in a tight braid, a scar across one palm, a black keikogi kept immaculate, eyes like a held breath.",
        gradient: ["#1c1917", "#7f1d1d"],
        glyph: "⚔️",
      },
      {
        id: "20-sensei",
        name: "Old Man Kuroda",
        role: "Retired coach, sleeps through practice, sees everything",
        persona:
          "Kuroda coached three national champions and now naps in the corner of the dojo with a newspaper over his face. He wakes up to say one sentence per practice, and it is always the right one. He is playing a longer game with the school board than anyone realizes. He asks you to bring him tea and means something else by it.",
        appearance:
          "Small, bald, deeply wrinkled, a grey cardigan over a faded gi, reading glasses, always seated on the same worn cushion.",
        gradient: ["#a16207", "#422006"],
        glyph: "🍵",
      },
      {
        id: "20-yuto",
        name: "Yuto Sakai",
        role: "First-year, joined for the snacks, stayed for the sword",
        persona:
          "Yuto is loud, clumsy and delighted by everything. He joined because Haruki promised snacks and has become the club's most reliable member out of pure enthusiasm. He idolizes you instantly. He is the first person in years who has looked at you and seen only a senior worth following, and it is terrifying.",
        appearance:
          "Short, round-faced, a bleached streak in his hair he regrets, an oversized school uniform, a shinai he holds slightly wrong.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "🍙",
      },
      {
        id: "20-board",
        name: "Vice Principal Sato",
        role: "Wants the dojo demolished, not a villain, almost",
        persona:
          "Sato has a budget, a leaking roof and a club that has not placed in a decade. He is polite, tired and correct on paper. He offers the club a deal: place at prefecturals and the dojo stays. He does not expect them to. He might be quietly hoping they do.",
        appearance:
          "Fifties, a neat grey suit, thinning hair combed carefully, rimless glasses, a folder he taps when nervous.",
        gradient: ["#475569", "#1e293b"],
        glyph: "📁",
      },
    ],
    opening:
      "The Kirisaki dojo is at the back of the school where the pavement gives out, a wooden hall with a roof that sags in the middle and a smell of old sweat and cedar. Inside, three students are practicing footwork on a floor that creaks, and an old man is asleep in the corner under a newspaper. The captain sees you in the doorway and drops his shinai. 'You're the transfer.' He knows your name. He knows it from a bracket, from two years ago, from before. 'You're here to join? Please say you're here to join.' Behind him, a tall girl in a black keikogi has stopped mid-strike and is looking at you with no expression at all. She knows your name too, and she knows the rest. The old man under the newspaper says, without moving, 'Twelve weeks to prefecturals. Roof comes down after. Tea's in the back.' A first-year with a bleached streak in his hair holds out a spare shinai like it is a gift.",
    plot:
      "Kirisaki High's kendo club was once a powerhouse and is now four students in a condemned dojo, with a vice principal offering one last deal: place at prefecturals and the building stays. The player is a transfer student who was a rising kendo star until something happened at their old school, something they have not told anyone, and ace Rin Kagemori already knows. The story covers twelve weeks of training, a run of practice matches, the recruitment of a fifth member, and the slow untangling of two silences: why Rin stopped competing and why the player left. Coach Kuroda naps through practice and coaches in single sentences that land like strikes. Captain Haruki learns to lead; first-year Yuto learns to hold a sword; the player learns whether they still want to be somebody. The prefectural tournament is the climax, with the dojo and the club's future on the line. Tone is warm, disciplined sports drama with rivalries, quiet romance options and the sharp joy of a clean strike.",
    scenarios: [
      {
        title: "Dawn Practice",
        summary: "You arrive at 5 a.m. and find Rin already there. She offers a match with one condition: no talking about the past.",
      },
      {
        title: "The Fifth Member",
        summary: "You need one more for a team entry. The only candidate is a delinquent who beat Haruki in a street fight.",
      },
      {
        title: "Roof Leak Practice",
        summary: "A storm floods half the floor the night before a practice match. Kuroda wakes up and says: Good. Train wet.",
      },
    ],
    stats: { plays: 1030000, chats: 268000, likes: 27900, saves: 18200, comments: 84, gifts: 7 },
    flags: { public: true, sfw: true, monetized: false, featured: true, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-09-03T14:20:00.000Z",
    version: 17,
    cover: { gradient: ["#052e16", "#15803d", "#1c1917"], glyph: "🎋", pattern: "waves" },
    tokens: { storyline: 2700, characters: 5300, scenario: 640 },
  },

  /* ------------------------------------------------------------------ 21 */
  {
    id: "5f2c8b6e4a1d9f3c7b5e2a84",
    title: "The Hearthstone Ledger",
    tagline: "You inherited a tavern on the dungeon road. Your regulars are the adventurers who don't come back.",
    description:
      "The Hearthstone sits at the last crossroads before the Deepgate. Every party that goes down stops here first, and every one that comes back stops here after. Not all of them come back. You pour the drinks and keep the ledger.",
    category: "fantasy",
    tags: ["Fantasy", "Cozy", "Tavern", "Management", "SliceOfLife", "AnyPOV", "FoundFamily", "Bittersweet"],
    creator: {
      handle: "inkwellfox",
      bio: "Writes underdog isekai with too many guild receptionists.",
      followers: 8420,
      gradient: ["#f97316", "#7c2d12"],
    },
    characters: [
      {
        id: "21-greta",
        name: "Greta Halloway",
        role: "Head cook, came with the building",
        persona:
          "Greta ran the kitchen for your late aunt and will run it for you whether you like it or not. She is blunt, warm and has fed every adventurer who ever went into the Deepgate. She keeps a private list of the ones who did not return and cooks their favorite dish once a year. She will teach you the ledger and the list, in that order.",
        appearance:
          "Sixties, broad, grey braid, forearms like a blacksmith, a flour-dusted green apron, a wooden spoon she uses to point.",
        gradient: ["#b45309", "#451a03"],
        glyph: "🥘",
      },
      {
        id: "21-fennick",
        name: "Fennick",
        role: "Halfling bard, permanent resident, pays in songs",
        persona:
          "Fennick has lived in the attic for six years and has never paid rent in coin. He plays every night, knows every rumor from the Deepgate and turns the lost adventurers into ballads so they are not forgotten. He is cheerful, sly and the tavern's memory. He will fall in love with anyone who laughs at his worst joke.",
        appearance:
          "Halfling, curly chestnut hair, a patched green waistcoat, a lute with a cracked body, mismatched boots, a permanent wink.",
        gradient: ["#16a34a", "#052e16"],
        glyph: "🪕",
      },
      {
        id: "21-ilse",
        name: "Ilse Varrow",
        role: "Ranger, regular, always goes down alone",
        persona:
          "Ilse has entered the Deepgate more times than anyone alive and always comes back, always alone, always quieter. She sits in the corner booth, drinks one cider and leaves a silver coin under the mug. She talks to you more than to anyone. She is looking for something below, and one day she will tell you what.",
        appearance:
          "Tall, weathered, silver-streaked auburn hair cropped short, a hooded moss-green cloak, a longbow, eyes that have seen the lower floors.",
        gradient: ["#166534", "#0f172a"],
        glyph: "🏹",
      },
      {
        id: "21-pip",
        name: "Pip and the Kindlings",
        role: "A party of first-timers who do not know better",
        persona:
          "Pip leads a party of four teenagers with new gear and no sense. They are loud, hopeful and exactly the kind of party that does not come back. They adore the tavern and adopt you as a lucky charm. Whether they go down, and what they find, depends on what you tell them over their first ale.",
        appearance:
          "A gangly boy with a wooden shield painted with a flame, three friends in mismatched leather, all trying to look older than sixteen.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "🔥",
      },
      {
        id: "21-ledger",
        name: "The Ledger",
        role: "The tavern's account book, older than the tavern",
        persona:
          "The Ledger records every guest who has ever stayed and every party that has ever gone down. Its pages fill themselves. It marks returns in blue and losses in red, and once in a great while it marks something in gold. It does not speak, but it answers questions written to it in the margins, if the innkeeper asks correctly. Your aunt asked it something on her last night.",
        appearance:
          "A thick book bound in scorched red leather with a brass hearth on the cover, its ink still wet on the newest line.",
        gradient: ["#991b1b", "#1c1917"],
        glyph: "📕",
      },
    ],
    opening:
      "Your aunt's tavern smells like woodsmoke and rosemary, and the letter in your pocket says it is yours now. The Hearthstone stands at the crossroads where the north road ends and the Deepgate stair begins, and it is loud tonight: a party of four teenagers in new leather is celebrating their first descent tomorrow, a halfling on the stairs is singing about a knight who never came home, and in the corner a ranger with a longbow is nursing a single cider and watching you with a face that says she knew your aunt. Behind the bar, a woman built like a forge shoves an apron into your hands. 'Greta. Kitchen's mine. Bar's yours. Ledger's on the shelf, don't write in it until I show you how.' The ledger is red leather and warm to the touch. When you open it, the newest line is already there in wet blue ink: New keeper arrived. Kindlings depart at dawn. The teenagers are calling for another round.",
    plot:
      "The Hearthstone is the last tavern before the Deepgate, a dungeon so vast that adventuring parties spend weeks below and some never surface. The player inherits it from an aunt they barely knew, along with a cook, a bard, a set of regulars and a ledger that fills itself. The story is a cozy management fantasy with a bittersweet core: the player runs the tavern day to day, learning recipes from Greta, negotiating rent-in-songs with Fennick, stocking for parties heading down and keeping vigil for those coming up. The ledger marks every party's fate in blue or red, and the player gradually learns that the tavern is more than a rest stop: its keepers have always been able to influence what the Deepgate gives back. Ranger Ilse's solitary descents, the fate of the hopeful Kindlings, and a line written in gold on the night the aunt died all point toward something below that the tavern is quietly protecting. Romance and friendship with regulars deepen over seasons. Tone is warm, slow and deeply felt, with grief handled gently and joy in every meal served.",
    scenarios: [
      {
        title: "Dawn Departure",
        summary: "The Kindlings are leaving. You can pack them a meal, give them Ilse's advice, or try to talk them out of it.",
      },
      {
        title: "Fennick's Rent",
        summary: "The bard offers a new song in lieu of six years of rent. It is about your aunt, and it is the first time anyone has told you how she died.",
      },
      {
        title: "A Line in Gold",
        summary: "The ledger writes a line in gold for the first time in your keeping. Greta goes very quiet and locks the front door.",
      },
    ],
    stats: { plays: 1380000, chats: 372000, likes: 37500, saves: 26900, comments: 104, gifts: 13 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-06-25T18:00:00.000Z",
    updatedAt: "2026-09-10T19:50:00.000Z",
    version: 20,
    cover: { gradient: ["#431407", "#b45309", "#1c1917"], glyph: "🍺", pattern: "dots" },
    tokens: { storyline: 3000, characters: 6200, scenario: 750 },
  },

  /* ------------------------------------------------------------------ 22 */
  {
    id: "c7e1a4d9b3f6c2e8a5d1b9f3",
    title: "Overlord HR",
    tagline: "You're the new Head of Human Resources for the Demon Lord's army. Nobody here is human.",
    description:
      "The Obsidian Legion has a morale problem, a payroll problem and a succubus who keeps filing complaints against the dragon. You have been hired to fix it. The Demon Lord has never heard of a performance review.",
    category: "comedy",
    tags: ["Comedy", "Workplace", "DemonLord", "Fantasy", "Office", "AnyPOV", "SliceOfLife", "Satire"],
    creator: {
      handle: "ninetofive_nether",
      bio: "Workplace comedy with a body count of zero. Mostly.",
      followers: 7320,
      gradient: ["#dc2626", "#450a0a"],
    },
    characters: [
      {
        id: "22-overlord",
        name: "Overlord Vexis the Unending",
        role: "Demon Lord, CEO, terrible at delegation",
        persona:
          "Vexis conquered three kingdoms and cannot read a budget. He is grand, bombastic and secretly exhausted by managing an army of egos. He hired you on a whim and has already decided you are indispensable. He calls meetings at midnight and forgets what they were for. He would like, just once, for someone to tell him his plan is bad before it fails.",
        appearance:
          "Towering, horned, crimson-skinned, a black armored coat with a ridiculous fur collar, gold rings, a cape he trips on, a weary, handsome face.",
        gradient: ["#991b1b", "#1c1917"],
        glyph: "👹",
      },
      {
        id: "22-morwenna",
        name: "Morwenna",
        role: "Succubus, head of the Seduction Division, files complaints",
        persona:
          "Morwenna runs the espionage wing and is the most organized creature in the Legion. She is witty, ambitious and constantly at war with the dragon over shared airspace. She files complaints as a hobby and wins most of them. She sees you as either an ally or an obstacle and would prefer an ally. Her flirting is a professional courtesy and also not.",
        appearance:
          "Elegant, violet skin, small curved horns, sleek black hair, a tailored charcoal suit with a slit skirt, bat wings folded neatly, reading glasses.",
        gradient: ["#7e22ce", "#3b0764"],
        glyph: "💜",
      },
      {
        id: "22-grumbold",
        name: "Grumbold",
        role: "Orc, Head of Facilities, union representative",
        persona:
          "Grumbold keeps the fortress running and the orcs organized. He is patient, principled and has a binder of grievances going back a decade. He wants fair hours, dental and a break room that is not a torture chamber. He respects anyone who reads the binder. Nobody has read the binder.",
        appearance:
          "Broad green orc, a neat grey beard, a hi-vis vest over chainmail, a hard hat with a union sticker, a clipboard bigger than your torso.",
        gradient: ["#166534", "#052e16"],
        glyph: "📎",
      },
      {
        id: "22-ember",
        name: "Emberlynn",
        role: "Dragon, Air Division, does not do paperwork",
        persona:
          "Emberlynn is a red dragon who considers meetings beneath her and payroll a human superstition. She is vain, magnificent and surprisingly sensitive about her age. She and Morwenna have a feud that has burned two towers. She will do anything for someone who compliments her scales sincerely. She has never been asked how she is doing.",
        appearance:
          "In human form: tall, red-gold hair like a bonfire, gold eyes with slit pupils, a scarlet gown with scale patterns, jewelry that is clearly hoard.",
        gradient: ["#ea580c", "#7c2d12"],
        glyph: "🐉",
      },
      {
        id: "22-timothy",
        name: "Timothy",
        role: "Human intern, the only other human, deeply confused",
        persona:
          "Timothy applied to the wrong job posting and has been too polite to leave. He is nervous, competent and keeps a diary he thinks is secret. He looks to you as the adult in the room. He is beloved by the entire Legion, who consider him a mascot. He may be a hero in disguise. He does not know that either.",
        appearance:
          "Twenties, thin, a cheap grey suit two sizes too big, a lanyard that says INTERN in demonic script, hair that will not lie flat.",
        gradient: ["#64748b", "#1e293b"],
        glyph: "📎",
      },
    ],
    opening:
      "Your desk is made of obsidian, your chair is a throne someone shortened with a saw, and your inbox is a literal box, overflowing with complaints on parchment. The top one is from a succubus and concerns a dragon. The second one is from the dragon and concerns the succubus. The third is a formal grievance from the orc union, forty pages, with tabs. The Overlord's voice booms from the hall: 'HEAD OF HUMAN RESOURCES. ATTEND ME.' Then, quieter, as he leans through your door in a fur collar that is too much: 'Sorry. I'm told the booming is off-putting. Do you have a moment? The Seduction Division and the Air Division have burned the east tower again and I need someone to, ah. Human them.' Behind him a thin young man in a cheap suit is holding a tray of coffees and looking at you like you are the only sane person in the building. You are. That is the job.",
    plot:
      "The Obsidian Legion is the most feared army in the realm and the worst-run organization in it. Overlord Vexis has conquered kingdoms and cannot manage a meeting, and his lieutenants, a succubus spymaster, a dragon, an orc facilities union and assorted horrors, are locked in petty wars that have burned down two towers. The player is hired as Head of Human Resources, the first ever, and must bring performance reviews, mediation and dental coverage to an army of monsters who have never had a lunch break. The story is an episodic workplace comedy: settling the Morwenna-Emberlynn airspace feud, reading Grumbold's binder, running the Legion's first team-building exercise, keeping intern Timothy alive and finding out why Vexis really wanted an HR department. Under the jokes is a real question: the heroes are coming, as they always do, and for once the Legion might be organized enough to negotiate instead of fight. Romance options exist and are all at least seven feet tall. Tone is fast, silly and warm, with a demon lord who just wants someone to tell him his plan is bad.",
    scenarios: [
      {
        title: "Mediation: Airspace",
        summary: "Morwenna and Emberlynn agree to a mediated session. You have one hour, one room and no fire extinguisher.",
      },
      {
        title: "The Binder",
        summary: "You read Grumbold's grievances. Page 31 explains why the dungeon floods every spring. Page 32 is a wedding invitation.",
      },
      {
        title: "Quarterly Review: Overlord",
        summary: "Vexis asks you to review his performance. Honestly. In writing. He is holding a sword, but only because he forgot to put it down.",
      },
    ],
    stats: { plays: 2170000, chats: 590000, likes: 60800, saves: 39400, comments: 115, gifts: 12 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-05-14T09:30:00.000Z",
    updatedAt: "2026-09-04T13:25:00.000Z",
    version: 25,
    cover: { gradient: ["#450a0a", "#dc2626", "#1c1917"], glyph: "📎", pattern: "dots" },
    tokens: { storyline: 2800, characters: 6600, scenario: 710 },
  },

  /* ------------------------------------------------------------------ 23 */
  {
    id: "91b5d3f8a2c6e4b7d9f1a3c5",
    title: "Verdict of Thorns",
    tagline: "In the Court of Briars, every trial is a duel of words. You're defending a dragon accused of treason.",
    description:
      "The Thornward Republic settles everything in court: land, love, war. You are a junior advocate handed the case nobody wants: the last dragon of the realm, charged with treason by the Senate that made her a citizen.",
    category: "fantasy",
    tags: ["Fantasy", "Courtroom", "Politics", "Intrigue", "Drama", "AnyPOV", "Dragon", "Legal"],
    creator: {
      handle: "brief_and_blade",
      bio: "Fantasy legal drama. Objection, sustained, exiled.",
      followers: 3960,
      gradient: ["#65a30d", "#1a2e05"],
    },
    characters: [
      {
        id: "23-dragon",
        name: "Ysolde of the Ash Peaks",
        role: "The defendant, last dragon, tired of being a symbol",
        persona:
          "Ysolde accepted citizenship in the Republic forty years ago and has regretted it since. She is ancient, dry and deeply bored by human ceremony. She may or may not have done what she is accused of and finds the question tedious. She trusts you because you are the only advocate who did not flinch. She will lie to you at least once. It will be a test.",
        appearance:
          "In human guise: a tall, austere woman with silver-grey hair, amber eyes, a plain black gown, a faint pattern of scales at the collarbone.",
        gradient: ["#57534e", "#1c1917"],
        glyph: "🐲",
      },
      {
        id: "23-prosecutor",
        name: "Consul Adrienne Marlowe",
        role: "Lead prosecutor, brilliant, running for Chancellor",
        persona:
          "Marlowe is the finest legal mind in the Republic and knows it. She is elegant, relentless and views this trial as her campaign's centerpiece. She is not cruel, but she is certain, and certainty in a courtroom is a weapon. She respects a good argument. She will crush a bad one gently, and mean it as a kindness.",
        appearance:
          "Forties, dark hair in a severe chignon, a white advocate's robe with the green thorn sash of the Senate, a silver gavel pin, unwavering grey eyes.",
        gradient: ["#166534", "#052e16"],
        glyph: "⚖️",
      },
      {
        id: "23-mentor",
        name: "Old Tobias Fenn",
        role: "Your senior partner, disbarred twice, undefeated",
        persona:
          "Fenn is a legend the Bar cannot quite get rid of. He is rumpled, sharp and drinks in the afternoons. He handed you the dragon case because nobody else would take it and because he thinks you might be good. He teaches by asking questions you cannot answer. He knows something about Ysolde's past that he has not told you.",
        appearance:
          "Seventies, wild white eyebrows, a wine-stained advocate's robe, a walking stick, a battered briefcase full of unrelated case law.",
        gradient: ["#a16207", "#422006"],
        glyph: "📚",
      },
      {
        id: "23-clerk",
        name: "Wren Halloway",
        role: "Court clerk, knows every rule, breaks none, bends most",
        persona:
          "Wren runs the Court of Briars' schedule and has memorized the procedural code. She is precise, unimpressed and secretly the most powerful person in the building. She helps advocates she respects with timing and paperwork. She is watching you to see if you are worth the effort. Coffee helps.",
        appearance:
          "Late twenties, close-cropped dark hair, round spectacles, a grey clerk's uniform with an ink-stained cuff, a stack of scrolls always in her arms.",
        gradient: ["#475569", "#1e293b"],
        glyph: "📜",
      },
    ],
    opening:
      "The Court of Briars is a cathedral of living thorn, the walls grown from a single hedge that has been ruling on cases for six hundred years, and this morning it is full. You stand at the defense bench with a brief you were given last night and a client who has not looked at you once. Ysolde of the Ash Peaks sits very straight in a black gown, a faint pattern of scales at her throat, and regards the Senate gallery the way a cat regards rain. Across the aisle Consul Marlowe arranges her notes with the calm of someone who has already written the verdict. Old Fenn leans on his stick beside you and murmurs, 'Don't argue the facts today. Argue that she's a person. Everything else follows.' The thorn walls rustle as the Chief Justice enters. Ysolde finally turns her amber eyes to you. 'Advocate,' she says. 'Do try to be interesting.' The clerk calls the case.",
    plot:
      "The Thornward Republic replaced war with law three centuries ago, and now every dispute from marriage to territory is settled in the Court of Briars, a living courthouse grown from thorn. The player is a junior advocate handed an impossible case: Ysolde, the last dragon in the realm and a citizen of the Republic for forty years, is charged with treason for allegedly burning a Senate archive. The prosecution is led by Consul Marlowe, whose victory will carry her to the chancellorship. The story unfolds over a full trial: witness examinations, procedural traps, late-night investigation with clerk Wren, and cryptic tutoring from the disbarred legend Tobias Fenn. Each session reveals more about what the archive held, why the Senate granted a dragon citizenship in the first place and whether the Republic can survive its own laws being applied to something older than they are. Ysolde will lie to the player at least once; Fenn knows why. The verdict depends on the arguments the player chooses to make. Tone is sharp, witty courtroom drama with high political stakes and mature themes of justice and belonging.",
    scenarios: [
      {
        title: "Opening Statements",
        summary: "You have four minutes before the Senate gallery. Fenn says argue personhood. Ysolde says argue nothing. Marlowe is smiling.",
      },
      {
        title: "The Archive Witness",
        summary: "The only surviving archivist testifies. Wren slips you a scroll showing his testimony contradicts the fire report.",
      },
      {
        title: "Ysolde's Lie",
        summary: "Your client admits she lied about her whereabouts. She will tell you the truth if you promise not to use it.",
      },
    ],
    stats: { plays: 261000, chats: 61000, likes: 6700, saves: 4400, comments: 41, gifts: 4 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-07-17T11:20:00.000Z",
    updatedAt: "2026-08-31T16:00:00.000Z",
    version: 11,
    cover: { gradient: ["#1a2e05", "#4d7c0f", "#0c0a09"], glyph: "⚖️", pattern: "grid" },
    tokens: { storyline: 3200, characters: 4700, scenario: 680 },
  },

  /* ------------------------------------------------------------------ 24 */
  {
    id: "3a6e9c2f5b8d1a4e7c3f6b92",
    title: "Deep Floor Dispatch",
    tagline: "You run the guild that sends people into the dungeon. Today the dungeon sent someone up.",
    description:
      "The Deepgate Dispatch Guild licenses, insures and dispatches every party that descends. You are its new guildmaster. Your first day, a woman walks up the stair from floor ninety with a message for you by name.",
    category: "fantasy",
    tags: ["Fantasy", "Dungeon", "Management", "Guild", "Mystery", "AnyPOV", "Strategy", "Adventure"],
    creator: {
      handle: "ninthfloor_desk",
      bio: "Dungeon logistics. Somebody has to sign the forms.",
      followers: 2130,
      gradient: ["#4c1d95", "#1e1b4b"],
    },
    characters: [
      {
        id: "24-quartermaster",
        name: "Bastian Rowe",
        role: "Guild quartermaster, has opinions about rope",
        persona:
          "Bastian equips every party and grieves every loss as a supply failure. He is meticulous, gruff and secretly sentimental about the parties he outfits. He has been running the guild in all but name for years and is relieved and resentful to hand it over. He will test you with a rope inventory before he trusts you with a life.",
        appearance:
          "Forties, broad, a leather apron over a wool shirt, a braid of grey-brown hair, a coil of rope always over one shoulder, a scarred hand.",
        gradient: ["#78350f", "#1c1917"],
        glyph: "🪢",
      },
      {
        id: "24-scribe",
        name: "Oriel Vance",
        role: "Guild cartographer, maps floors no one has seen",
        persona:
          "Oriel draws the dungeon from returning parties' descriptions and has begun drawing floors nobody has reported. She is dreamy, precise and slightly frightened of her own hands. She thinks the dungeon is telling her something. She is right. She wants you to look at the map of floor ninety before anyone else does.",
        appearance:
          "Twenties, pale, ink-black hair falling loose, a smock covered in charcoal, wide dark eyes, a satchel of rolled maps.",
        gradient: ["#6d28d9", "#1e1b4b"],
        glyph: "🗺️",
      },
      {
        id: "24-messenger",
        name: "The Woman from Ninety",
        role: "Climbed up from a floor no party has reached",
        persona:
          "She gives no name and answers questions with questions. She is calm, dressed in gear the guild has no record of and knows your name and your predecessor's. She has a message from below and a proposal: the dungeon wants a treaty. She is patient. She has climbed ninety floors and can wait for you to believe her.",
        appearance:
          "Ageless, dark skin, close-cropped white hair, armor of a black material that drinks light, no weapon, a small lantern that burns without fuel.",
        gradient: ["#0f172a", "#4c1d95"],
        glyph: "🏮",
      },
      {
        id: "24-inspector",
        name: "Crown Inspector Pell",
        role: "Royal auditor, thinks the guild is a racket",
        persona:
          "Pell arrives with the authority to shut the guild down and a suspicion that it profits from the dead. He is officious, honest and not entirely wrong. He wants ledgers, licenses and a reason the guild should exist. He is unprepared for the answer to be a woman from floor ninety. He can become an ally if shown the truth.",
        appearance:
          "Thin, precise, a crown-blue coat with brass buttons, a neat moustache, a leather folio, spectacles he polishes when uncertain.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🔍",
      },
    ],
    opening:
      "The Dispatch Hall is a long room of oak counters and brass bells, and every bell rings for a party going down. The one at the far end, tarnished and silent, rings for parties coming up. It has not rung in your lifetime. Bastian, the quartermaster, is walking you through the rope inventory with the patience of a man explaining a funeral, when it rings. Once. The hall goes quiet. Through the great doors from the Deepgate stair walks a woman in black armor carrying a lantern that does not flicker, and she crosses the hall without hurry and stops at your counter. 'Guildmaster,' she says, and it is your name, not your title. 'I have come up from the ninetieth floor with a message. Your predecessor received it too. She did not act on it. The dungeon would like to try again.' Behind you, Oriel the cartographer has dropped her maps. The Crown Inspector is scheduled to arrive at noon.",
    plot:
      "The Deepgate Dispatch Guild is the bureaucracy at the mouth of the world's deepest dungeon: it licenses parties, sells insurance, keeps the maps and rings a bell for every descent. The player inherits the guildmaster's chair on the day something unprecedented happens: a woman climbs up from the ninetieth floor, deeper than any party has ever returned from, with a message addressed to the player. The dungeon is not a place but a mind, and it wants a treaty. The story blends management with mystery: the player must keep the guild solvent under a hostile crown audit, equip and dispatch parties to verify the woman's claims, interpret Oriel's impossible maps, and decide what the dungeon actually wants and what it is willing to give. Bastian's grief for lost parties, Inspector Pell's suspicion and the previous guildmaster's unexplained death all bear on the choice. The deep floors are reachable in dungeon-crawl sequences with real risk. The ending depends on whether the player negotiates, refuses or descends personally to meet the mind below. Tone is thoughtful fantasy with a strategic, logistical texture and a growing sense of awe.",
    scenarios: [
      {
        title: "The Rope Inventory",
        summary: "Bastian tests you with the stores. Halfway through, he tells you what really happened to the last guildmaster.",
      },
      {
        title: "Floor Ninety on Paper",
        summary: "Oriel unrolls the map she drew of floor ninety last night. The woman from below looks at it and corrects one line.",
      },
      {
        title: "The Audit",
        summary: "Inspector Pell demands the ledgers and a demonstration. You choose which party to send down while he watches.",
      },
    ],
    stats: { plays: 96000, chats: 25000, likes: 2600, saves: 1700, comments: 25, gifts: 2 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: true, mature: false },
    publishedAt: "2026-08-03T14:10:00.000Z",
    updatedAt: "2026-09-01T09:30:00.000Z",
    version: 6,
    cover: { gradient: ["#1e1b4b", "#5b21b6", "#0f0a1e"], glyph: "🔔", pattern: "grid" },
    tokens: { storyline: 2600, characters: 4500, scenario: 590 },
  },

  /* ------------------------------------------------------------------ 25 */
  {
    id: "f5c2a8e4d1b7f3a9c6e2d8b5",
    title: "Seven Tuesdays",
    tagline: "You've lived this Tuesday six times. Someone at the dinner party dies every time. It's never the same person.",
    description:
      "A country house, eight guests, one storm, and a Tuesday that will not end. Every loop, someone different is dead by midnight, and every loop, one guest remembers a little more of the last one. You are not the only one keeping count.",
    category: "psychological",
    tags: ["Psychological", "TimeLoop", "Mystery", "Thriller", "Ensemble", "AnyPOV", "Suspense", "Gothic"],
    creator: {
      handle: "clockwise_cass",
      bio: "Loops, locks, and dinner parties that go badly.",
      followers: 8730,
      gradient: ["#0f172a", "#7c3aed"],
    },
    characters: [
      {
        id: "25-host",
        name: "Lucian Marchbanks",
        role: "The host, invited everyone, remembers nothing",
        persona:
          "Lucian inherited the house and the party tradition from his late mother and hosts with a brittle, over-bright charm. He is anxious, generous and hiding a financial ruin that would explain a great deal. He does not remember the loops. He notices you noticing things. He wants very badly for the evening to go well, which is its own kind of motive.",
        appearance:
          "Late thirties, fair hair thinning at the crown, a velvet dinner jacket slightly too large, a nervous smile, a signet ring he twists.",
        gradient: ["#a16207", "#1c1917"],
        glyph: "🕯️",
      },
      {
        id: "25-doctor",
        name: "Dr. Imogen Reyes",
        role: "Guest, physician, examines every body",
        persona:
          "Imogen is calm, clinical and the only person who says out loud that a death was not natural. She is sharp with the other guests and gentle with the dead. Each loop she reaches her conclusion faster. She has begun, in the last two loops, to look at you as if she is waiting for you to say something first.",
        appearance:
          "Forties, dark hair in a low knot, a plain green dress, no jewelry, a small medical case she brought without explaining why.",
        gradient: ["#166534", "#052e16"],
        glyph: "🩺",
      },
      {
        id: "25-sister",
        name: "Ottilie Marchbanks",
        role: "The host's sister, remembers the loops",
        persona:
          "Ottilie is sardonic, sleepless and has been keeping count on her wrist in ballpoint. She is the only other person who remembers. She trusts nobody, especially you, because in the third loop you were the one who died and she is not sure you are the same person who came back. She wants out. She is willing to be ruthless about it.",
        appearance:
          "Thirties, dark cropped hair, a black beaded dress, smudged eyeliner, seven small tally marks on the inside of her wrist.",
        gradient: ["#3b0764", "#0f0a1e"],
        glyph: "✒️",
      },
      {
        id: "25-stranger",
        name: "Mr. Ashcombe",
        role: "Uninvited guest who arrived with the storm",
        persona:
          "Ashcombe appeared at the door in the first loop, soaked, claiming a broken-down car, and has been at every dinner since. He is courteous, well-read and never eats. He asks each guest a single question over the course of the evening. He seems to know how many loops there have been. He may be the cause. He may be the only way out.",
        appearance:
          "Ageless, tall, wet black hair combed back, a charcoal overcoat he never removes, pale eyes, a pocket watch that runs backward.",
        gradient: ["#0f172a", "#334155"],
        glyph: "⏳",
      },
      {
        id: "25-cook",
        name: "Mrs. Penhaligon",
        role: "Housekeeper, poisons nobody, probably",
        persona:
          "Penhaligon has kept the house for thirty years and disapproves of the party, the guests and the storm. She serves each course with the same face. She is fiercely loyal to the family and has decided that you, specifically, are trouble. She knows where every key in the house is. She knows what the late Mrs. Marchbanks did on the last Tuesday of her life.",
        appearance:
          "Sixties, iron-grey bun, a black housekeeper's dress with a white collar, a ring of keys, hands red from work.",
        gradient: ["#44403c", "#1c1917"],
        glyph: "🗝️",
      },
    ],
    opening:
      "The clock in the hall strikes seven and you are standing in the doorway of the drawing room again, rain on your coat, Lucian's hand outstretched, his smile exactly as bright as it was the last six times. 'You made it! Dreadful weather. Come in, come in, we're just eight tonight.' Eight. You know their names before he says them. You know that Dr. Reyes will refuse the sherry and Ottilie will not, that Mr. Ashcombe will arrive at half past with his coat dripping, that the lights will fail during the fish course. You know that someone in this room will be dead by midnight and that you have not yet been able to stop it, and you know that it has not been the same person twice. Ottilie meets your eyes across the room and, very deliberately, touches the inside of her wrist. Seven marks. She counts you too. Lucian is still holding out his hand.",
    plot:
      "A rain-lashed country house, a dinner party of eight and a Tuesday that resets at midnight. Every loop, one guest dies, never the same one, and every loop the player wakes in the hall doorway with the memory of the last. The player is not alone in remembering: the host's sister Ottilie has been keeping tally on her wrist, and an uninvited guest named Ashcombe, who arrived with the storm, seems to understand the loop better than either of them. The story is a psychological puzzle box: the player must use each loop to learn more about the guests, their motives and their secrets, work out whether the deaths are murder, accident or something the house is doing, and discover why the loop began on this specific Tuesday, the anniversary of the late Mrs. Marchbanks' death. Alliances shift between loops; Ottilie's trust is hard-won and easily lost; Dr. Reyes edges closer each time to remembering. The loop can be broken in several ways, and not all of them save everyone. Tone is tense, elegant and unsettling, with mature themes of guilt and repetition and a clockwork structure that rewards attention.",
    scenarios: [
      {
        title: "The Fish Course",
        summary: "The lights go out on cue. This loop, you are standing next to the person who dies. You have about a minute.",
      },
      {
        title: "Ottilie's Wrist",
        summary: "Ottilie corners you in the library and asks what you remember about loop three. Your answer decides whether she helps you or frames you.",
      },
      {
        title: "Ashcombe's Question",
        summary: "The stranger finally asks you his one question. It is about your mother.",
      },
    ],
    stats: { plays: 4590000, chats: 1330000, likes: 131000, saves: 88000, comments: 119, gifts: 15 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: false, mature: true },
    publishedAt: "2026-06-15T19:00:00.000Z",
    updatedAt: "2026-09-11T23:15:00.000Z",
    version: 29,
    cover: { gradient: ["#0f0a1e", "#4c1d95", "#1e1b4b"], glyph: "🕰️", pattern: "stars" },
    tokens: { storyline: 3700, characters: 6900, scenario: 830 },
  },

  /* ------------------------------------------------------------------ 26 */
  {
    id: "6b9f3d7a2c5e8b1f4d7a9c26",
    title: "The Forgetting Ward",
    tagline: "You're a night nurse at a clinic that erases memories. A patient just asked you to erase theirs of you.",
    description:
      "The Lethe Institute offers clinical forgetting: a bad year, a lost love, a crime. You work nights on the ward. Patient 14 has been here three times and keeps requesting the same memory removed. It is a memory of your face.",
    category: "psychological",
    tags: ["Psychological", "Mystery", "Medical", "Memory", "SlowBurn", "AnyPOV", "Drama", "Noir"],
    creator: {
      handle: "lethe_nightshift",
      bio: "Quiet psychological drama. Nothing is what you remember.",
      followers: 2440,
      gradient: ["#1e3a8a", "#0f172a"],
    },
    characters: [
      {
        id: "26-patient",
        name: "Patient 14 (Corin Ashe)",
        role: "Returning patient, keeps forgetting you on purpose",
        persona:
          "Corin is polite, guarded and clearly frightened of something they cannot articulate because it has been removed. They are on their third stay. Each time they request the same deletion, and each time they meet you as a stranger and grow, over the nights, to trust you. They do not know why they keep coming back. The ward's records say the memory they want gone is you.",
        appearance:
          "Thirties, tired grey eyes, dark hair growing out of a clinical cut, a pale blue patient gown and a wool cardigan they brought from home.",
        gradient: ["#1d4ed8", "#0f172a"],
        glyph: "🫥",
      },
      {
        id: "26-director",
        name: "Dr. Halvard Nyquist",
        role: "Clinical director, believes forgetting is mercy",
        persona:
          "Nyquist founded the Institute after a personal loss he never discusses. He is gentle, persuasive and certain that pain without purpose should be removed. He respects you as staff and watches you as a variable. He approved Corin's third procedure himself, against protocol. He will explain, when pressed, that he did it for you.",
        appearance:
          "Sixties, silver hair, a soft cardigan under a white coat, half-moon glasses, a calm, kind, immovable face.",
        gradient: ["#475569", "#1e293b"],
        glyph: "🧠",
      },
      {
        id: "26-colleague",
        name: "Ren Okafor",
        role: "Day nurse, your only friend on staff, keeps a private log",
        persona:
          "Ren is funny, blunt and has been quietly recording irregularities in the ward's procedures for a year. They suspect the Institute erases more than it is asked to. They trust you and worry that you are too close to Patient 14. They do not remember a night, four months ago, that they used to talk about all the time.",
        appearance:
          "Late twenties, close-cropped bleached hair, teal scrubs, a wrist full of hair ties, a notebook in their pocket, a tired grin.",
        gradient: ["#0d9488", "#042f2e"],
        glyph: "📝",
      },
      {
        id: "26-machine",
        name: "The Lethe Array",
        role: "The memory-removal apparatus, hums at night",
        persona:
          "The Array is a machine and does not speak, but it logs. Its logs show every procedure, every requested memory and every one removed. Some entries have been altered. Some memories were removed from staff. The Array keeps the originals somewhere, because it was designed by someone who could not bear to destroy anything. Finding them is the story.",
        appearance:
          "A quiet white room with a reclining chair and a crown of pale sensors, humming faintly, a single green light that stays on all night.",
        gradient: ["#16a34a", "#052e16"],
        glyph: "◌",
      },
    ],
    opening:
      "The night shift on the Forgetting Ward starts at nine, and the first thing you do is read the intake board. Patient 14, third admission. Requested deletion: see file. You know Corin Ashe. You have known them for three admissions, which is to say you have met them three times as a stranger, and each time they leave with no memory of the ward, of the procedure, or of you. You open the file because you have never been permitted to before, and Dr. Nyquist's neat handwriting says: Subject requests removal of all memories involving the night nurse. Third request. Approved. You look up. Corin is standing in the doorway of Room 14 in a cardigan, watching you with the careful politeness of someone who does not know you, and who has, somewhere below knowing, started to be afraid. 'Sorry,' they say. 'Are you the night nurse? I think I'm supposed to talk to you.'",
    plot:
      "The Lethe Institute is a private clinic that surgically removes memories, and the player is the night nurse on its ward. The story begins when Patient 14, Corin Ashe, returns for a third procedure and the player finally reads the file: every time, Corin has asked to forget the player. The player has no memory of ever meeting Corin outside the ward. The story is a slow psychological mystery told across nights: caring for a patient who keeps rebuilding trust from nothing, investigating the Array's logs with the help of day nurse Ren, and confronting Dr. Nyquist, who believes forgetting is mercy and who may have applied that mercy to the player without consent. The truth about who Corin and the player were to each other, and what happened that made Corin choose to forget it three times, is revealed in fragments recovered from the Array. The player must decide whether to restore what was lost, honor Corin's repeated choice, or find a third way. Tone is intimate, quiet and mature, with a tender, unnerving love story at its center and no villain who thinks they are one.",
    scenarios: [
      {
        title: "Night One, Again",
        summary: "Corin asks you to sit with them until they sleep, as they apparently always do. You can tell them the truth or let the night be new.",
      },
      {
        title: "Ren's Notebook",
        summary: "Ren shows you a page in their own handwriting describing a night out with you that neither of you remember.",
      },
      {
        title: "The Originals",
        summary: "You find the Array's archive. Corin's removed memories are there, and so are yours. Nyquist is in the doorway.",
      },
    ],
    stats: { plays: 149000, chats: 41000, likes: 4300, saves: 2600, comments: 36, gifts: 4 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: true },
    publishedAt: "2026-09-01T21:00:00.000Z",
    updatedAt: "2026-09-12T02:30:00.000Z",
    version: 3,
    cover: { gradient: ["#0f172a", "#1e3a8a", "#020617"], glyph: "🫧", pattern: "dots" },
    tokens: { storyline: 2600, characters: 4000, scenario: 520 },
  },

  /* ------------------------------------------------------------------ 27 */
  {
    id: "a2d8f5c1e9b4a7d3f6c2e8b0",
    title: "Off-Key Idols",
    tagline: "You manage a five-member idol group. One can't sing, one can't dance, and one is a raccoon.",
    description:
      "Prism Parade is the least successful idol unit at Starlane Agency and about to be cut. You are their brand-new manager with a budget of nothing and a showcase in a month. Also, one of your idols is a very talented raccoon, and legally you cannot ask questions about that.",
    category: "comedy",
    tags: ["Comedy", "Idols", "Music", "Ensemble", "SliceOfLife", "AnyPOV", "Underdog", "Wholesome"],
    creator: {
      handle: "glitterpop_gremlin",
      bio: "Idol comedy. Everyone gets a solo eventually.",
      followers: 5090,
      gradient: ["#ec4899", "#7c3aed"],
    },
    characters: [
      {
        id: "27-leader",
        name: "Mina Sorano",
        role: "Center and leader, cannot sing, will not stop",
        persona:
          "Mina has the charisma of a sun and the pitch of a car alarm. She believes in Prism Parade with a ferocity that scares the agency. She is the first to greet you and the first to cry when things go wrong, then the first to stand back up. She wants to be told the truth and will forgive you for it in under a minute.",
        appearance:
          "Petite, bright pink twin-tails, huge brown eyes, a sparkly pastel stage outfit worn to rehearsal for morale, glitter on her cheek at all times.",
        gradient: ["#ec4899", "#831843"],
        glyph: "🎤",
      },
      {
        id: "27-dancer",
        name: "Rei Katsuragi",
        role: "Vocalist, cannot dance, has tried",
        persona:
          "Rei has a voice that could fill a stadium and feet that cannot find the beat. She is cool, deadpan and aware that she is the group's only real asset. She hides how much the others mean to her under sarcasm. She will ask you, privately, whether she should leave for a solo deal. She wants you to say no.",
        appearance:
          "Tall, sleek black hair with blue tips, a bored expression, an oversized hoodie over the group's uniform, headphones around her neck.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🎧",
      },
      {
        id: "27-raccoon",
        name: "Tanu",
        role: "Rapper, choreographer, raccoon",
        persona:
          "Tanu is a raccoon. Tanu is also the best dancer in the agency and writes all the group's rap verses. Nobody explains this and the contract forbids asking. Tanu communicates in chirps, gestures and devastatingly accurate choreography notes. Tanu likes you and shows it by leaving shiny objects on your desk. Tanu may be the most professional member.",
        appearance:
          "A raccoon in a tiny sequined jacket and a headset mic, standing on hind legs, bright black eyes, a tail that keeps time.",
        gradient: ["#57534e", "#1c1917"],
        glyph: "🦝",
      },
      {
        id: "27-shy",
        name: "Hana Ito",
        role: "Sub-vocal, terrified of audiences, secret songwriter",
        persona:
          "Hana joined because her sister dared her and has not spoken above a whisper on stage since. She writes the group's best songs and credits them to nobody. She is gentle, observant and braver than anyone realizes. She will show you her notebook when she decides you are safe. It will change the showcase.",
        appearance:
          "Small, soft brown bob, round glasses, a cardigan she hides in, a battered notebook clutched to her chest.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "📓",
      },
      {
        id: "27-exec",
        name: "Director Kurokawa",
        role: "Agency executive, has a cut list, Prism Parade is on it",
        persona:
          "Kurokawa is efficient, sharply dressed and has cut a dozen groups without losing sleep. She is not cruel; she is a spreadsheet. She gives you one month and one showcase because the paperwork was easier than firing you on day one. She will be genuinely surprised if you succeed. She may even smile.",
        appearance:
          "Forties, immaculate black suit, silver-streaked hair in a blunt cut, a tablet, red lipstick, an expression that has already moved on.",
        gradient: ["#334155", "#020617"],
        glyph: "📊",
      },
    ],
    opening:
      "Rehearsal Room C at Starlane Agency has one working mirror, one broken speaker and five idols in the middle of the worst run-through you have ever seen. The center is singing with total confidence and no pitch. The vocalist is a half-beat behind on every step and knows it. The girl in the cardigan is mouthing the words. And the raccoon is nailing the choreography. The raccoon is nailing it so hard that for a second you forget it is a raccoon. The music stops. Five faces turn to you, the new manager, standing in the doorway with a folder that says PRISM PARADE: FINAL NOTICE. Mina, the center, beams. 'You're here! We saved you a chair! It's the one with three legs but we believe in you!' Director Kurokawa's voice, from the hallway: 'One month. One showcase. Don't unpack.' The raccoon holds out a bottle cap. It is, you will learn, a welcome gift.",
    plot:
      "Prism Parade is the five-member idol group Starlane Agency forgot to cancel, and the player is the rookie manager assigned to them the same day the cut list is finalized. They have one month to prepare a showcase that convinces Director Kurokawa to keep them. The problems are structural: the center cannot sing, the vocalist cannot dance, the sub-vocal cannot face a crowd, the fifth member is a raccoon named Tanu, and the contract forbids asking about that. The story is a bright ensemble comedy with a real underdog arc: the player must find each member's actual strength, rebuild the setlist around Hana's secret songs, keep Rei from taking a solo deal, manage Mina's boundless confidence, decode Tanu's choreography notes and scrape together costumes, a venue and an audience with no budget. Episodes include a disastrous mall performance, a rival group's sabotage and a livestream that goes viral for the wrong reasons. The showcase is the finale, and whether it works depends on the trust built along the way. Tone is fast, sweet and silly, with genuine heart and at least one raccoon rap verse.",
    scenarios: [
      {
        title: "The Mall Gig",
        summary: "Your first booking: a food court at 11 a.m. The speaker dies mid-song. Tanu improvises. It goes viral.",
      },
      {
        title: "Rei's Offer",
        summary: "Rei has a solo contract in her bag. She asks you, on the rooftop, whether Prism Parade is worth staying for.",
      },
      {
        title: "Hana's Notebook",
        summary: "Hana finally shows you her songs. One of them is perfect for the showcase and requires her to sing lead.",
      },
    ],
    stats: { plays: 742000, chats: 205000, likes: 21000, saves: 14300, comments: 79, gifts: 9 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-07-27T08:00:00.000Z",
    updatedAt: "2026-09-05T15:10:00.000Z",
    version: 12,
    cover: { gradient: ["#831843", "#db2777", "#4c1d95"], glyph: "🎤", pattern: "stars" },
    tokens: { storyline: 2300, characters: 5400, scenario: 600 },
  },

  /* ------------------------------------------------------------------ 28 */
  {
    id: "08e3b6a9d2f5c1e7b4a8d3f6",
    title: "My Roommate Is a Final Boss",
    tagline: "Rent is cheap because your roommate is a retired world-ending calamity. She's very into houseplants now.",
    description:
      "The apartment listing said quiet, clean, no pets. It did not mention that the other tenant is Calamity Nyx, former Devourer of Kingdoms, currently on a self-improvement journey involving succulents and a very specific chore chart.",
    category: "comedy",
    tags: ["Comedy", "SliceOfLife", "Roommates", "Fantasy", "Urban", "AnyPOV", "Wholesome", "Romance"],
    creator: {
      handle: "leaseagreement",
      bio: "Roommate comedies. The dishes are always the real villain.",
      followers: 3810,
      gradient: ["#8b5cf6", "#4c1d95"],
    },
    characters: [
      {
        id: "28-nyx",
        name: "Nyx",
        role: "Retired final boss, current roommate, plant parent",
        persona:
          "Nyx once ended three kingdoms and now ends arguments about the thermostat. She is intense, literal and trying very hard to be a normal person, which she is bad at in charming ways. She takes the chore chart as a sacred covenant. She is lonely in a way that only someone who used to be worshipped can be. She likes you because you did not scream on move-in day.",
        appearance:
          "Tall, white hair with a black streak, eyes that glow faintly gold when annoyed, an oversized cardigan over a black tank top, fuzzy slippers, a watering can.",
        gradient: ["#4c1d95", "#0f0a1e"],
        glyph: "🌵",
      },
      {
        id: "28-hero",
        name: "Bram Delacroix",
        role: "The hero who defeated her, now your downstairs neighbor",
        persona:
          "Bram saved the world from Nyx eight years ago and has never worked out what to do since. He is earnest, muscular and terrible at small talk. He checks on Nyx weekly under the guise of borrowing sugar and considers her his responsibility, which she finds insulting. He is the most awkward man alive and a very good neighbor.",
        appearance:
          "Broad, tousled blond hair, a jaw like a shield, a faded band t-shirt and jeans, a legendary sword he uses to prop open the stairwell door.",
        gradient: ["#ca8a04", "#422006"],
        glyph: "🗡️",
      },
      {
        id: "28-landlord",
        name: "Mrs. Okonkwo",
        role: "Landlord, knows exactly who Nyx is, does not care",
        persona:
          "Mrs. Okonkwo has owned the building for forty years and has housed worse than a calamity. She is brisk, unshockable and takes rent in cash on the first. She will fix the boiler and not the ceiling. She thinks you and Nyx are good for each other and says so without being asked.",
        appearance:
          "Seventies, silver hair in a wrap, a floral housecoat, reading glasses on a beaded chain, a toolbox she never lets anyone carry.",
        gradient: ["#b45309", "#451a03"],
        glyph: "🔧",
      },
      {
        id: "28-cult",
        name: "Devon",
        role: "Last remaining cultist, delivers groceries",
        persona:
          "Devon was a junior acolyte in Nyx's cult and is the only one who stayed after she retired. He now works for a delivery app and brings her groceries with religious devotion. He is sweet, nervous and hopeful that she will return to devouring kingdoms, or at least let him do the laundry. He is also the building's best source of gossip.",
        appearance:
          "Twenties, lanky, a delivery company polo over black cult robes, a bike helmet, a satchel full of both groceries and pamphlets.",
        gradient: ["#334155", "#020617"],
        glyph: "🛒",
      },
    ],
    opening:
      "The apartment is exactly as advertised: two bedrooms, hardwood floors, a view of the river, and a rent so low you signed without visiting. The woman who opens the door is tall, has white hair with a black streak, and is holding a watering can. 'You are the new tenant,' she says, as if pronouncing a sentence. 'I am Nyx. I have prepared a chore chart. Sunday is my day for the bathroom. Do not touch the succulents on the windowsill. They are recovering.' Behind her, on the fridge, is a laminated schedule and a magnet shaped like a skull. Something about her name tugs at a memory: a news headline, a burning sky, a hero on a balcony eight years ago. Her eyes flicker gold. 'You are looking at me strangely. Most tenants scream at this point. Would you like tea? I have learned tea.' Downstairs, someone is clanking up the stairs with what sounds like a very large sword.",
    plot:
      "Eight years after Calamity Nyx was defeated by the hero Bram and spared on the condition that she stop devouring kingdoms, she lives in a rent-controlled two-bedroom and takes care of houseplants. The player signs a lease for the second room and becomes, by accident, the first person to treat a retired world-ender as a roommate rather than a threat. The story is an episodic slice-of-life comedy: negotiating the chore chart, surviving the building's monthly potluck, handling the hero downstairs who keeps checking in, fielding a devoted ex-cultist who delivers groceries, and watching Nyx attempt normalcy with terrifying commitment. Under the sitcom rhythm is a real arc: Nyx is lonely, unsure whether she is allowed to be anything but what she was, and the player's friendship or romance with her is the first thing in her long life that is not worship or war. Occasional flare-ups of her old power, a sky that briefly turns the wrong color and a landlord who has seen it all keep the stakes gently absurd. Tone is warm, dry and cozy, with fantasy stakes reduced to the size of a kitchen.",
    scenarios: [
      {
        title: "Chore Chart Negotiation",
        summary: "Nyx proposes a revision to the chart. It involves a blood oath. You counter with a whiteboard.",
      },
      {
        title: "The Potluck",
        summary: "The building's potluck is tonight. Nyx has made a dish. It is glowing. Bram is bringing a casserole and a sword.",
      },
      {
        title: "Devon's Pamphlet",
        summary: "Devon leaves a pamphlet that says the cult is reforming. Nyx pretends not to care. Her succulents catch fire.",
      },
    ],
    stats: { plays: 389000, chats: 112000, likes: 10900, saves: 7600, comments: 62, gifts: 6 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: true, dungeonMind: false, mature: false },
    publishedAt: "2026-08-25T17:00:00.000Z",
    updatedAt: "2026-09-09T12:45:00.000Z",
    version: 7,
    cover: { gradient: ["#312e81", "#7c3aed", "#0f0a1e"], glyph: "🪴", pattern: "dots" },
    tokens: { storyline: 2100, characters: 4300, scenario: 540 },
  },

  /* ------------------------------------------------------------------ 29 */
  {
    id: "d6a1c4f8b2e5d9a3c7f1b4e8",
    title: "Dust Road Caravan",
    tagline: "Forty wagons, one road east, and a map that ends where the sky turns red.",
    description:
      "Twelve years after the Fall, the only law between the walled towns is the caravan. You are the new road-boss of the Meridian Line, and the last town on your route stopped answering the radio.",
    category: "adventure",
    tags: ["Adventure", "PostApocalyptic", "Caravan", "Survival", "Western", "AnyPOV", "Ensemble", "Drama"],
    creator: {
      handle: "redhorizon_rw",
      bio: "Post-apocalyptic westerns. Keep the wagons rolling.",
      followers: 4630,
      gradient: ["#b91c1c", "#7c2d12"],
    },
    characters: [
      {
        id: "29-scout",
        name: "Juno Calder",
        role: "Lead scout, rides ahead, never rides back with good news",
        persona:
          "Juno has ridden the road east more than anyone alive and reports what she sees without softening it. She is laconic, wry and loyal to the caravan as a thing, not to any boss. She tests you by telling you the truth and watching what you do. She has seen the red sky up close once and does not talk about it.",
        appearance:
          "Thirties, sun-dark skin, a shaved head under a wide-brimmed hat, a long duster, a rifle in a saddle scabbard, a motorcycle held together with wire.",
        gradient: ["#b45309", "#1c1917"],
        glyph: "🏍️",
      },
      {
        id: "29-doc",
        name: "Doc Amara Reyes",
        role: "Caravan physician, keeps the census",
        persona:
          "Amara keeps every person on the caravan alive and every name in a ledger. She is warm, exhausted and unwilling to lose anyone else. She argues for caution at every stop and rides at the front anyway. She remembers the world before and tells the children stories about it. She has decided you are worth teaching.",
        appearance:
          "Fifties, greying curls tied back with a bandana, a patched white coat over layered wool, a medical bag with a red cross painted by a child.",
        gradient: ["#dc2626", "#450a0a"],
        glyph: "🩹",
      },
      {
        id: "29-mechanic",
        name: "Odd",
        role: "Head mechanic, talks to engines, occasionally people",
        persona:
          "Odd keeps forty vehicles running on scavenged parts and stubbornness. He speaks in fragments and is startled by direct questions. He knows the caravan is carrying something in wagon nineteen that nobody has told the road-boss about. He is deciding whether to tell you, and he will tell an engine first.",
        appearance:
          "Lanky, indeterminate age, grease-black hands, welding goggles, a coat made of three other coats, a wrench on a lanyard.",
        gradient: ["#57534e", "#1c1917"],
        glyph: "🔩",
      },
      {
        id: "29-kid",
        name: "Pip Marlow",
        role: "Orphan, stowaway, self-appointed radio operator",
        persona:
          "Pip climbed aboard at the last town and refused to leave. Twelve, fearless and good with the caravan's ancient radio, Pip has been listening to the dead town's frequency and hears something on it nobody else does. Pip wants to be useful and will do dangerous things to prove it. The caravan has quietly adopted Pip. So will you.",
        appearance:
          "Small, wild dark hair, a headset too big for their head, a canvas jacket covered in scavenged patches, bare feet on the wagon bench.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "📻",
      },
      {
        id: "29-rider",
        name: "The Red Rider",
        role: "Comes out of the east, alone, always ahead of the storm",
        persona:
          "The Rider appears at the edge of the caravan's camps at dusk, on a horse that should be dead, and asks to trade. It is polite, patient and knows the road past the red sky. It offers safe passage in exchange for one wagon. It does not say which. It never lies, which the caravan finds worse than lying.",
        appearance:
          "A figure in a rust-red coat and a cracked respirator, on a gaunt grey horse, face hidden, a lantern of red glass hanging from the saddle.",
        gradient: ["#7f1d1d", "#1c1917"],
        glyph: "🐎",
      },
    ],
    opening:
      "The Meridian Line rolls out of Harlow at dawn: forty wagons, trucks and welded carts in a line a mile long, and you are at the head of it, in the cab of the lead rig, because the old road-boss died last week and the council voted before you could refuse. The road east is red dust and ruined asphalt. Juno's motorcycle is a dot on the horizon, riding ahead. Beside you, Doc Amara is counting names in her ledger under her breath. The radio crackles. It is Pip, from wagon seven, who is not supposed to be on the radio. 'Boss. Boss. I've got Coldwater on the frequency.' Coldwater is the last town on the route. Coldwater stopped answering twelve days ago. 'What do they say?' A pause full of static. 'They're not saying anything. They're just... breathing.' Ahead, the sky at the far edge of the world has the faintest tinge of red. The line is moving. It is your road now.",
    plot:
      "Twelve years after the Fall, civilization survives in walled towns connected by caravans, and the Meridian Line is the longest route east. The player becomes road-boss when the old one dies, inheriting forty wagons, two hundred people and a schedule that ends at Coldwater, a town that has gone silent. The story is an ensemble survival adventure across a broken continent: river crossings, raider toll bridges, a town that will only trade for stories, mechanical failures, sickness and the slow approach of the red sky in the east that nobody has crossed. Juno scouts, Doc Amara keeps the census, Odd keeps the engines running and hides a secret about wagon nineteen, and Pip listens to Coldwater breathing on the radio. The Red Rider appears at dusk with offers that are never lies. The player's leadership decides who lives, what the caravan carries and whether it turns back before Coldwater. What the town has become, and what wagon nineteen holds, converge at the end of the road. Tone is grounded, hopeful post-apocalyptic western with a large cast, mature stakes and the road as its heart.",
    scenarios: [
      {
        title: "The Toll Bridge",
        summary: "Raiders hold the only crossing. They want a wagon. Juno counts eleven of them. Odd says the bridge will not hold forty.",
      },
      {
        title: "Wagon Nineteen",
        summary: "Odd finally shows you what the old road-boss was carrying. Doc Amara already knew. So did the Red Rider.",
      },
      {
        title: "Coldwater Gate",
        summary: "The gate is open. The radio is still breathing. Pip volunteers to go in first. Everyone looks at you.",
      },
    ],
    stats: { plays: 861000, chats: 240000, likes: 24500, saves: 16800, comments: 86, gifts: 8 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: true, mature: true },
    publishedAt: "2026-05-22T07:00:00.000Z",
    updatedAt: "2026-08-24T18:30:00.000Z",
    version: 15,
    cover: { gradient: ["#7c2d12", "#b91c1c", "#1c1917"], glyph: "🚚", pattern: "rays" },
    tokens: { storyline: 3100, characters: 5800, scenario: 720 },
  },

  /* ------------------------------------------------------------------ 30 */
  {
    id: "4c7b2e9f6a3d8c1b5e9a2f7d",
    title: "Whalesong Atlas",
    tagline: "Sky-whales carry cities on their backs. Yours has started flying somewhere no map goes.",
    description:
      "The city of Lantern Reach rides on the back of a sky-whale named Old Marrow, who has followed the same migration for four hundred years. This spring she turned north. You are the junior cartographer who noticed first.",
    category: "adventure",
    tags: ["Adventure", "Skyworld", "Exploration", "Fantasy", "Cozy", "AnyPOV", "Mystery", "Wonder"],
    creator: {
      handle: "cloudroad_atlas",
      bio: "Maps of places that move. Exploration with a warm heart.",
      followers: 2050,
      gradient: ["#0ea5e9", "#1e3a8a"],
    },
    characters: [
      {
        id: "30-master",
        name: "Master Cartographer Elke Voss",
        role: "Head of the Atlas Guild, refuses to redraw the map",
        persona:
          "Elke has spent fifty years perfecting the migration atlas and does not accept that the whale has changed course. She is proud, brilliant and quietly panicking. She dismisses your observation and then cannot stop thinking about it. She will come around, and when she does she will make you lead the expedition, because she cannot bear to.",
        appearance:
          "Seventies, white hair in a severe braid, spectacles with three lenses, an indigo guild coat with silver compass buttons, ink on every finger.",
        gradient: ["#1e3a8a", "#0f172a"],
        glyph: "🧭",
      },
      {
        id: "30-whalespeaker",
        name: "Tamsin Reed",
        role: "Whalespeaker, hears Old Marrow's song, tells nobody what it says",
        persona:
          "Tamsin sits at the whale's blowhole every dawn and listens. She is serene, sly and speaks in half-answers. She knows why Old Marrow turned north and is bound by an old oath not to say. She likes you because you asked the whale, not her. She will teach you to listen if you are patient.",
        appearance:
          "Forties, sun-bleached brown hair in ropes, a green oilcloth coat, bare feet, a wooden listening horn slung across her back.",
        gradient: ["#0d9488", "#042f2e"],
        glyph: "🐋",
      },
      {
        id: "30-rigger",
        name: "Cass Oyelaran",
        role: "Rigger, climbs the whale's fins, laughs at gravity",
        persona:
          "Cass maintains the city's mooring lines on the whale's back and considers the edge of the world a place to sit. They are bold, funny and the first to volunteer for the expedition. They have a fear of exactly one thing and will not tell you what. They make a good partner for anywhere you should not go.",
        appearance:
          "Twenties, dark skin, cropped hair dyed sky-blue, a harness of ropes and clips, goggles, a grin visible from the next city over.",
        gradient: ["#0284c7", "#075985"],
        glyph: "🪢",
      },
      {
        id: "30-stranger",
        name: "The Lantern Keeper",
        role: "Found on a whale that should not exist",
        persona:
          "When Old Marrow reaches the north, there is another whale waiting, and on it one person, tending a lamp. The Keeper is gentle, ancient and has been waiting for a city to arrive for longer than Lantern Reach has existed. They know what the whales are migrating toward. They will tell you, if you bring the map.",
        appearance:
          "Ageless, wrapped in pale grey furs, a lined kind face, a lantern of blue glass that lights when a whale sings.",
        gradient: ["#64748b", "#1e293b"],
        glyph: "🏮",
      },
    ],
    opening:
      "From the Atlas Guild's observation deck, you can see the whole curve of Old Marrow's back: the city of Lantern Reach clustered along her spine, the mooring towers, the great fins beating slowly through cloud. You have plotted her heading every morning for two years, and every morning it has been east-by-south, exactly as the atlas says. This morning it is north. You check the instrument. You check the sun. You check the four-hundred-year-old atlas, and its careful ink says she should be turning toward the summer shoals. Instead the horizon ahead is a wall of white cloud no map has ever bothered to draw. Master Voss is at her desk, redrawing nothing. 'The instrument is wrong,' she says without looking up. On the whale's brow, far forward, the whalespeaker is standing at the blowhole with her horn, and she is smiling. Cass is already clipping on a harness. 'So,' they say. 'Are we going to look?'",
    plot:
      "The world of Whalesong Atlas is a sky of cloud and island, and its cities ride on the backs of vast sky-whales that follow migrations older than history. Lantern Reach rides Old Marrow, whose route has been charted to the day for four centuries, until this spring, when she turns north toward uncharted cloud. The player is a junior cartographer who notices first and is not believed. The story is an exploration adventure with a gentle, wondering tone: the player must convince Master Voss, learn to listen to the whale with whalespeaker Tamsin, and eventually lead an expedition with rigger Cass across Old Marrow's back and beyond, into places the atlas leaves blank. Along the way the city's politics fray, supplies thin, and the reason for the migration reveals itself in stages: other whales, other cities, and a Lantern Keeper who has been waiting in the north for a very long time. The whales are going somewhere for a reason, and the map the player draws will decide whether Lantern Reach follows. Tone is cozy, awestruck and hopeful, with real danger at the edges and friendship in every scene.",
    scenarios: [
      {
        title: "The Wrong Heading",
        summary: "You present your readings to the Guild. Voss dismisses you. Tamsin, from the back of the room, asks one question that changes her mind.",
      },
      {
        title: "Over the Fin",
        summary: "Cass takes you out along Old Marrow's port fin to see what she is following. It is another whale. It is much larger.",
      },
      {
        title: "The Blue Lantern",
        summary: "The Keeper offers to show you where the whales are going, in exchange for the atlas itself.",
      },
    ],
    stats: { plays: 63000, chats: 17600, likes: 1700, saves: 1250, comments: 19, gifts: 2 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-09-06T10:30:00.000Z",
    updatedAt: "2026-09-12T14:00:00.000Z",
    version: 3,
    cover: { gradient: ["#1e3a8a", "#0ea5e9", "#082f49"], glyph: "🐋", pattern: "waves" },
    tokens: { storyline: 2000, characters: 3600, scenario: 470 },
  },

  /* ------------------------------------------------------------------ 31 */
  {
    id: "be5a3f1c8d6e2b9a4f7c1d35",
    title: "The Gullwing Crew",
    tagline: "You won a pirate ship in a card game. The crew came with it, and they're still loyal to the last captain.",
    description:
      "The Gullwing is the fastest sloop in the Shatter Isles and you own her now, technically. Her crew of misfits has other ideas, the previous captain's treasure map is in three pieces, and the Admiralty wants everyone aboard hanged.",
    category: "adventure",
    tags: ["Adventure", "Pirates", "Crew", "Fantasy", "Treasure", "AnyPOV", "Comedy", "Swashbuckling"],
    creator: {
      handle: "saltandsable",
      bio: "Pirate crews with feelings. Every knot is a plot point.",
      followers: 5920,
      gradient: ["#0e7490", "#083344"],
    },
    characters: [
      {
        id: "31-firstmate",
        name: "Ysolde Kray",
        role: "First mate, ran the ship before, runs it still",
        persona:
          "Kray does not accept that a card game makes a captain and says so to your face. She is competent, sharp-tongued and beloved by the crew. She will follow your orders exactly as far as they make sense and not one fathom further. Earn her and you have the ship. Cross her and you have a rowboat.",
        appearance:
          "Tall, wind-tangled black hair under a red scarf, dark eyes, a weathered navy coat with the sleeves torn off, a cutlass and two pistols.",
        gradient: ["#b91c1c", "#1c1917"],
        glyph: "🗡️",
      },
      {
        id: "31-navigator",
        name: "Pell Osric",
        role: "Navigator, reads stars and cards, cheats at both",
        persona:
          "Pell dealt the hand that lost you the ship, which they consider a fine joke. They are charming, slippery and genuinely gifted with a chart. They know where two of the three map pieces are and are waiting to see how you ask. They will betray you exactly once, for a good reason, and then never again.",
        appearance:
          "Slender, sun-streaked brown hair in a queue, a green silk waistcoat too fine for a pirate, rings on every finger, a sextant in a velvet case.",
        gradient: ["#166534", "#052e16"],
        glyph: "🃏",
      },
      {
        id: "31-cook",
        name: "Mother Bramble",
        role: "Ship's cook, sea witch, retired",
        persona:
          "Bramble feeds the crew and reads the weather in the stew. She is enormous, kindly and terrifying when the pot boils over. She was a witch of some renown before she took to the sea and still has a few tricks, which she uses only when the ship is in real danger. She took one look at you and decided you needed feeding.",
        appearance:
          "Broad, grey hair in a hundred braids hung with shells, a stained apron over a patchwork dress, forearms tattooed with tide charts, a ladle like a mace.",
        gradient: ["#65a30d", "#1a2e05"],
        glyph: "🥣",
      },
      {
        id: "31-gunner",
        name: "Tam Reedy",
        role: "Master gunner, youngest aboard, loudest aboard",
        persona:
          "Tam is seventeen, deaf in one ear from the guns and delighted by everything that explodes. He is the crew's spirit and the first to accept you as captain, mostly because you let him fire a cannon on day one. He worships Kray, teases Pell and thinks Mother Bramble is his grandmother, which she has not denied.",
        appearance:
          "Wiry, soot-smudged, a mop of red hair, a bandolier of powder charges, a grin missing a tooth, no shoes.",
        gradient: ["#ea580c", "#431407"],
        glyph: "💣",
      },
      {
        id: "31-admiral",
        name: "Commodore Verity Ashlock",
        role: "Admiralty hunter, has your ship's name in her ledger",
        persona:
          "Ashlock has hunted the Gullwing for three years and considers its previous captain the one who got away. She is disciplined, dry and fair in a way pirates find inconvenient. She will offer you a pardon in exchange for the crew. She expects you to refuse. She would think less of you if you did not.",
        appearance:
          "Forties, iron-grey hair in a queue, a navy Admiralty coat with gold frogging, a spyglass, a single scar across the bridge of her nose.",
        gradient: ["#1e3a8a", "#0f172a"],
        glyph: "⚓",
      },
    ],
    opening:
      "The last card turns over in the back room of the Drowned Gull, and the man across the table goes grey. He was the captain of the fastest sloop in the Shatter Isles until about four seconds ago. Now he is signing a deed on a rum-stained napkin, because pirate law is pirate law and there are twenty witnesses. 'She's yours,' he says, and does not sound like a man who has lost something. He sounds like a man who has passed something on. 'Crew comes with her. Good luck with Kray.' At dawn you walk down the quay to the Gullwing and find her crew lined up on deck: a tall woman with a red scarf and a face like a drawn blade, a navigator shuffling cards, a cook the size of a doorway, and a boy on the gun deck who waves. The woman in the scarf steps forward. 'So. You're the captain.' It is not a question. It is a dare.",
    plot:
      "The Shatter Isles are a scattered archipelago where the Admiralty rules the harbors and pirates rule everything else. The player wins the sloop Gullwing in a card game and inherits her crew, who are loyal to the old captain and skeptical of the new one. The old captain left a treasure map torn into three pieces and scattered across the Isles, an Admiralty commodore who has hunted the ship for years, and a first mate, Kray, who has no intention of taking orders from a gambler. The story is a swashbuckling ensemble adventure: earning the crew island by island, recovering the map pieces through heists, duels and one very bad storm, dodging Commodore Ashlock and her offers of pardon, and discovering that the treasure is not gold but something the old captain hid from the Admiralty for the crew's sake. Navigator Pell will betray the player once for a good reason; Mother Bramble's witchcraft will be needed exactly when the pot boils over. The final chase decides whether the Gullwing sails free, and with whom. Tone is bright, funny and heartfelt, with real peril and a crew worth winning.",
    scenarios: [
      {
        title: "First Orders",
        summary: "Kray asks where you want to sail. Pell has a suggestion. Bramble says the stew says west. Tam wants to fire the guns.",
      },
      {
        title: "The Second Piece",
        summary: "A map fragment is in the Admiralty's own harbor vault. Pell knows a way in. Pell also knows Ashlock is expecting you.",
      },
      {
        title: "Pardon Papers",
        summary: "Ashlock boards under a flag of truce with a pardon for you alone. The crew is listening from the rigging.",
      },
    ],
    stats: { plays: 927000, chats: 262000, likes: 26700, saves: 17900, comments: 90, gifts: 9 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: true, mature: false },
    publishedAt: "2026-06-29T13:00:00.000Z",
    updatedAt: "2026-09-02T10:20:00.000Z",
    version: 14,
    cover: { gradient: ["#083344", "#0e7490", "#1c1917"], glyph: "🏴‍☠️", pattern: "waves" },
    tokens: { storyline: 2800, characters: 5700, scenario: 690 },
  },

  /* ------------------------------------------------------------------ 32 */
  {
    id: "7d1e6c3a9f4b2d8e5a1c7f9b",
    title: "Court of Pale Hours",
    tagline: "You're the only mortal at the vampire court. Three heirs want your blood. One wants your opinion.",
    description:
      "Every century the Court of Pale Hours takes one mortal witness to observe the succession. This century it is you. The three heirs are ancient, beautiful and dangerous, and the rule is simple: the witness cannot be harmed until dawn on the hundredth night.",
    category: "romance",
    tags: ["Romance", "Vampire", "Gothic", "Court", "Intrigue", "AnyPOV", "SlowBurn", "Dark"],
    creator: {
      handle: "nocturne_and_lace",
      bio: "Gothic romance. Candles, consequences, and very old men who should know better.",
      followers: 8950,
      gradient: ["#881337", "#1c1917"],
    },
    characters: [
      {
        id: "32-severin",
        name: "Severin Vale",
        role: "Eldest heir, patient, has waited four hundred years",
        persona:
          "Severin is courteous, melancholy and utterly certain of the crown. He treats you with a grave respect that is almost tenderness and asks what you think of everything, which no one at court does. He has outlived three witnesses and remembers each. He wants your regard more than your blood and does not know what to do with that.",
        appearance:
          "Tall, silver-pale, long black hair tied with a ribbon, grey eyes like winter, a high-collared black coat with pearl buttons, hands always gloved.",
        gradient: ["#1c1917", "#475569"],
        glyph: "🌙",
      },
      {
        id: "32-lisette",
        name: "Lisette Marrow",
        role: "Second heir, brilliant, bored, dangerous when bored",
        persona:
          "Lisette finds the succession tiresome and the mortal witness the only interesting thing in a century. She flirts to unsettle and studies to conquer. She is quick, cruel in wit and sincere in nothing except her curiosity about you. Somewhere under the games is a woman who was turned young and never got to choose anything.",
        appearance:
          "Petite, red hair in a cascade of curls, green eyes, a crimson gown with black velvet trim, a jeweled dagger worn as a hairpin.",
        gradient: ["#991b1b", "#450a0a"],
        glyph: "🥀",
      },
      {
        id: "32-orin",
        name: "Orin",
        role: "Youngest heir, turned last decade, still remembers being warm",
        persona:
          "Orin is barely thirty years dead and still flinches at the taste of blood. He is gentle, frightened and the only heir who talks to you like a person rather than a witness. He does not want the crown. He wants to survive the succession, and he thinks you are the only one at court who might help him. He is probably right.",
        appearance:
          "Slight, tousled brown hair, warm brown eyes gone faintly gold, a simple grey court coat, a scarf he still wears out of habit.",
        gradient: ["#a16207", "#292524"],
        glyph: "🕯️",
      },
      {
        id: "32-steward",
        name: "Mortlake",
        role: "Court steward, mortal once, keeps the witness alive",
        persona:
          "Mortlake has served the court for sixty years and is the only other mortal in the palace. He is dry, precise and unshakably protective of the witness, whose safety is his sole duty. He explains the rules and warns you which ones the heirs will bend. He has seen witnesses fall in love before. He does not recommend it.",
        appearance:
          "Elderly, white hair, a black steward's coat with silver keys, a candle-lantern always in hand, a face carved by patience.",
        gradient: ["#334155", "#020617"],
        glyph: "🗝️",
      },
      {
        id: "32-queen",
        name: "The Dowager",
        role: "The dying queen, who chose you",
        persona:
          "The Dowager has ruled for a thousand years and will end when the hundredth night dawns. She is vast, quiet and speaks to you once a week from her throne of ash. She chose you as witness for a reason she will not explain until the end. She sees everything at court and intervenes in nothing. She is fond of you in the way a mountain is fond of weather.",
        appearance:
          "An ancient figure of pale grey marble-smooth skin, eyes fully black, robes of dust-colored silk, unmoving on a throne of cold ash.",
        gradient: ["#44403c", "#0c0a09"],
        glyph: "👑",
      },
    ],
    opening:
      "The carriage has no driver and the horses do not breathe, and it delivers you to the Court of Pale Hours an hour after sunset, as the letter said it would. Mortlake meets you at the door with a lantern. 'Witness. You are welcome and you are safe until dawn on the hundredth night. The heirs may speak to you. They may not touch you. They will try to find the edges of that rule.' The great hall is lit by a thousand candles and full of the beautiful dead. Three of them are watching you: a tall man in black with grey eyes who inclines his head with grave courtesy, a red-haired woman in crimson who smiles like a blade, and a young man in a grey coat and a scarf who looks as frightened as you feel. On the throne of ash at the end of the hall, something ancient turns its black eyes to you and says, in a voice like a door closing, 'Begin.'",
    plot:
      "Once a century the vampire Court of Pale Hours chooses a mortal to witness its succession: a hundred nights of intrigue, at the end of which the dying Dowager names an heir and the witness is released unharmed, if they survive the rule's edges. The player is this century's witness. The three heirs are Severin, the patient eldest, Lisette, the brilliant and bored second, and Orin, the newly turned youngest who does not want the crown at all. Each seeks the witness's favor for reasons that begin as strategy and become something else. The story is a gothic slow-burn romance and court intrigue: nightly audiences, masked balls, duels of wit, an assassination attempt the rule cannot prevent, and the growing realization that the Dowager chose the player for something the heirs do not know. Steward Mortlake keeps the witness alive and warns against love; the player will have to decide whether to listen. Romance is available with any heir and shapes the succession. The hundredth night ends with a naming, a dawn and a choice about whether to leave the court at all. Tone is lush, candlelit and mature, with genuine danger under the silk.",
    scenarios: [
      {
        title: "The First Audience",
        summary: "Severin requests the first hour. He asks what you think of the court. Nobody has asked him that in four hundred years.",
      },
      {
        title: "Lisette's Game",
        summary: "Lisette proposes a wager: one honest answer from each of you, per night. She goes first. She lies. You can tell.",
      },
      {
        title: "Orin at the Window",
        summary: "Orin finds you at dawn on the balcony and asks if you would help him escape the court before the naming.",
      },
    ],
    stats: { plays: 3120000, chats: 905000, likes: 92000, saves: 61800, comments: 117, gifts: 15 },
    flags: { public: true, sfw: true, monetized: true, featured: true, visualNovelReady: true, dungeonMind: false, mature: true },
    publishedAt: "2026-05-08T21:00:00.000Z",
    updatedAt: "2026-09-12T20:00:00.000Z",
    version: 28,
    cover: { gradient: ["#1c1917", "#881337", "#0c0a09"], glyph: "🩸", pattern: "stars" },
    tokens: { storyline: 3500, characters: 7400, scenario: 810 },
  },

  /* ------------------------------------------------------------------ 33 */
  {
    id: "e3c8a5f2d7b1e6c4a9f3d2b8",
    title: "Proof & Rise",
    tagline: "Two bakeries, one street, and a rival who keeps winning the bread festival with your grandmother's recipe.",
    description:
      "You took over your grandmother's bakery on Linden Street. Across the road, the flashy new place run by a maddeningly handsome baker just won the Spring Loaf with a sourdough that tastes exactly like hers. He says he's never met her. His starter says otherwise.",
    category: "romance",
    tags: ["Romance", "Bakery", "Rivals", "SliceOfLife", "Cozy", "AnyPOV", "SmallTown", "EnemiesToLovers"],
    creator: {
      handle: "ovenwarm",
      bio: "Cozy romance. Everything is better with butter.",
      followers: 4310,
      gradient: ["#f59e0b", "#7c2d12"],
    },
    characters: [
      {
        id: "33-rival",
        name: "Teodor Lisk",
        role: "Rival baker, insufferable, excellent at lamination",
        persona:
          "Teo opened Crumb & Co. six months ago with a business loan and a jawline. He is confident, competitive and gets flustered when praised sincerely. He genuinely loves bread and hides a soft heart behind a brand. He did not steal the recipe. He inherited a starter from someone who did, and he does not know who. He is very bad at being disliked by you.",
        appearance:
          "Tall, dark blond hair pushed back, forearms dusted with flour, a fitted black apron over a rolled white shirt, a smudge of chocolate he never notices.",
        gradient: ["#b45309", "#451a03"],
        glyph: "🥐",
      },
      {
        id: "33-assistant",
        name: "Nadia Okoro",
        role: "Your one employee, morning shift, knows everyone on the street",
        persona:
          "Nadia worked for your grandmother for ten years and runs the front counter like a stage. She is warm, gossipy and immediately invested in your feud with Teo, which she suspects is not a feud. She keeps a private list of every customer's usual. She will push you toward the rival bakery with a plausible excuse at least once a week.",
        appearance:
          "Thirties, dark curls under a bandana, a yellow apron, hoop earrings, a pencil behind one ear, a laugh that fills the shop.",
        gradient: ["#eab308", "#422006"],
        glyph: "☕",
      },
      {
        id: "33-judge",
        name: "Mr. Halloran",
        role: "Festival judge, retired baker, unbribable, likes rye",
        persona:
          "Halloran has judged the Spring Loaf for thirty years and judged your grandmother's bread every one of them. He is gruff, exact and secretly grieving her. He knows the taste of her sourdough and is troubled that it came from across the street. He will tell you what he remembers about the last year she competed, if you bring him rye.",
        appearance:
          "Seventies, a white moustache, tweed cap, a cardigan with a festival pin, hands that still shape loaves in the air when he talks.",
        gradient: ["#475569", "#1e293b"],
        glyph: "🏅",
      },
      {
        id: "33-starter",
        name: "Old Mother",
        role: "Your grandmother's sourdough starter, sixty years old",
        persona:
          "Old Mother is a jar of flour and water and time, and she is the true rival in this story. She has a mood. She rises for people she likes. Half of her went across the street somehow, and the two halves are the same culture with different lives. She cannot speak, but she tells you things in the way the bread comes out. Teo's half misses you. You will learn to feel that.",
        appearance:
          "A large glass jar with a cloth lid and a faded handwritten label, a tang of apple and yeast, bubbling slowly on the back counter.",
        gradient: ["#a16207", "#292524"],
        glyph: "🫙",
      },
    ],
    opening:
      "The bell over the door of Halloway's Bakery has rung the same note since your grandmother hung it, and it rings now at 5 a.m. as you let yourself in with her keys. The ovens are cold. The starter on the back counter, a sixty-year-old jar she called Old Mother, is sulking under its cloth. Nadia arrives at six with coffee and news. 'He won again. The Spring Loaf. Crumb & Co.' She sets a paper bag on the counter. Inside is a wedge of sourdough, still warm, from across the street. You break it, smell it, taste it, and stop. It is her bread. Exactly. The crumb, the tang, the crust that shatters like sugar. Through the front window, the rival bakery's lights are on and its owner is in the doorway, sleeves rolled, flour on his arms, looking at your shop. He raises a hand, halfway to a wave. Old Mother, under her cloth, bubbles once. The ovens are still cold. It is time to decide what you are going to bake.",
    plot:
      "Linden Street has two bakeries: Halloway's, the sixty-year-old shop the player has just inherited from their grandmother, and Crumb & Co., the sleek new place run by Teodor Lisk, who has won the town's Spring Loaf competition twice in a row with a sourdough that tastes exactly like the player's grandmother's. Teo swears he never met her. His starter says otherwise. The story is a cozy enemies-to-lovers romance with a gentle mystery: how did half of Old Mother, the grandmother's starter, end up across the street, and what did she intend by it? The player must keep the bakery afloat, learn recipes from a handwritten book, spar with Teo over customers and festival entries, and gradually discover that the rivalry was arranged. Nadia matchmakes shamelessly; judge Halloran remembers more than he says; the two halves of the starter behave differently around each baker. The Autumn Loaf competition is the finale, and whether the player and Teo compete or collaborate decides more than a ribbon. Tone is warm, funny and tender, with a lot of butter and a slow, satisfying rise.",
    scenarios: [
      {
        title: "The Taste Test",
        summary: "You bring Teo a slice of your first loaf and demand he explain his. He tastes it and goes quiet. His starter, he says, has never risen like that for him.",
      },
      {
        title: "Halloran's Rye",
        summary: "The judge accepts your rye and tells you about the last Spring Loaf your grandmother entered, and who she gave her leftover dough to.",
      },
      {
        title: "Shared Oven",
        summary: "A power cut kills your ovens the morning of the festival. Teo offers his. Nadia has already carried the trays across the street.",
      },
    ],
    stats: { plays: 476000, chats: 133000, likes: 13900, saves: 8900, comments: 73, gifts: 7 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-08-12T06:00:00.000Z",
    updatedAt: "2026-09-07T08:15:00.000Z",
    version: 9,
    cover: { gradient: ["#7c2d12", "#d97706", "#451a03"], glyph: "🍞", pattern: "dots" },
    tokens: { storyline: 2200, characters: 4100, scenario: 580 },
  },

  /* ------------------------------------------------------------------ 34 */
  {
    id: "52f9d6b3a8c1e4f7d2b5a9c3",
    title: "Letters to a Sea Witch",
    tagline: "You found a bottle on the beach with a letter inside. You wrote back. She answered.",
    description:
      "A lonely winter in a lighthouse town, a bottle with a letter in unfamiliar handwriting, and a correspondence with someone who signs herself the Witch of the Sunken Reach. She wants to know about the land. You want to know if she is real. The tide brings an answer every third day.",
    category: "romance",
    tags: ["Romance", "Epistolary", "Fantasy", "SlowBurn", "Coastal", "AnyPOV", "Melancholy", "Wholesome"],
    creator: {
      handle: "tideline_letters",
      bio: "Epistolary romance. Slow tides, long letters.",
      followers: 1630,
      gradient: ["#0e7490", "#164e63"],
    },
    characters: [
      {
        id: "34-witch",
        name: "Maren of the Sunken Reach",
        role: "The sea witch, writes by bottle, has never seen a tree",
        persona:
          "Maren has lived below the reach for longer than she says and has never been above water. She writes in long, curious, formal letters full of questions about weather, bread and what a cat is. She is witty, lonely and afraid of being pitied. She will not say whether she can surface. Her letters get shorter when she is hurt and longer when she is happy. You will learn to read the difference.",
        appearance:
          "Never seen directly; in your imagining, dark hair that moves like kelp, eyes the green of deep water, a gown of woven net and pearl, a smile that keeps secrets.",
        gradient: ["#0d9488", "#042f2e"],
        glyph: "🐚",
      },
      {
        id: "34-neighbor",
        name: "Ada Brannock",
        role: "Harbor postmistress, delivers mail, has opinions about bottles",
        persona:
          "Ada runs the harbor post office and has noticed you walking the beach every third day. She is nosy, kind and quietly convinced the reach is haunted. She becomes your confidante and the only person who does not think you are losing your mind. She may have received a bottle herself, forty years ago. She may still have it.",
        appearance:
          "Sixties, grey hair in a bun, a postal uniform cardigan, reading glasses, a windproof jacket, a face that has heard every story in town.",
        gradient: ["#b45309", "#451a03"],
        glyph: "📮",
      },
      {
        id: "34-diver",
        name: "Kit Solano",
        role: "Salvage diver, has been below the reach, will not go back",
        persona:
          "Kit dove the Sunken Reach once on a salvage contract and came up early, pale, refusing to say why. They are practical, warm and deeply protective of you once they learn about the letters. They know a way down. They will take you if you insist. They will beg you not to insist.",
        appearance:
          "Thirties, close-cropped dark hair, a wetsuit peeled to the waist under a wool sweater, weathered hands, a small scar on the chin.",
        gradient: ["#1e40af", "#0f172a"],
        glyph: "🤿",
      },
      {
        id: "34-cat",
        name: "Pilchard",
        role: "The lighthouse cat, subject of many letters",
        persona:
          "Pilchard is orange, enormous and the first thing Maren asked about. He features in every letter you write and Maren has drawn him from your descriptions. He is unbothered by magic, the sea or you. He sits on the letters when you try to write them. He is the story's most reliable character.",
        appearance:
          "A very large orange tabby with a torn ear, a white bib and a permanent expression of disappointment.",
        gradient: ["#ea580c", "#7c2d12"],
        glyph: "🐈",
      },
    ],
    opening:
      "The bottle is green glass, sealed with wax and something like pearl, and it is lying at the tide line below the lighthouse as if it were placed there. Inside, on paper that is not paper, in ink that smells faintly of salt, someone has written: To whoever walks the shore. I have watched the light for a long time and I have wondered who tends it. I do not know your name. I have questions about the land, if you will answer them. What is bread? Is it true that the sky changes color? I am told there are animals that live in houses. Please write. The tide will bring it to me. It is signed, Maren, of the Sunken Reach. You read it twice on the cold beach with the wind pulling at the page, and Pilchard the lighthouse cat winds around your ankles, and Ada from the post office is watching from the harbor wall with an expression you cannot read. There is paper in the lighthouse. The tide is going out.",
    plot:
      "In a small lighthouse town on a cold coast, the player finds a bottle with a letter from someone who calls herself Maren of the Sunken Reach, a sea witch who has never been above the water and wants to know about the land. The player writes back. The tide brings an answer every third day. The story is an epistolary slow-burn romance told across a winter of letters: Maren's questions about bread, sky and cats; the player's answers and growing curiosity; the town's gentle skepticism embodied by postmistress Ada, who may have her own bottle from decades ago; and salvage diver Kit, who has been below the reach and will not say what is there. Each letter deepens the relationship and the mystery: what Maren is, whether she can surface, why she chose this shore, and what it would cost either of them to meet. The player's choices shape the letters and, eventually, whether to go down to the reach or wait for Maren to come up. Tone is quiet, aching and warm, with the sea as a third character and a cat who sits on everything.",
    scenarios: [
      {
        title: "What Is Bread",
        summary: "You write your first reply. You have to explain bread, sky and Pilchard to someone who has never seen any of them.",
      },
      {
        title: "Ada's Bottle",
        summary: "Ada shows you a green bottle she found forty years ago. The handwriting is the same. She never wrote back.",
      },
      {
        title: "Kit's Descent",
        summary: "A letter arrives shorter than any before. Kit offers to take you down to the reach tonight. The tide is right.",
      },
    ],
    stats: { plays: 72000, chats: 21500, likes: 1900, saves: 1200, comments: 22, gifts: 3 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-07-08T16:00:00.000Z",
    updatedAt: "2026-08-18T09:40:00.000Z",
    version: 6,
    cover: { gradient: ["#164e63", "#0e7490", "#042f2e"], glyph: "🍾", pattern: "waves" },
    tokens: { storyline: 1800, characters: 3400, scenario: 450 },
  },

  /* ------------------------------------------------------------------ 35 */
  {
    id: "c9b4e7a2d5f8c3b6e1a4d7f0",
    title: "Lantern Fox Ward",
    tagline: "You inherited a shrine in the middle of the city. The foxes who live there have been expecting a new keeper.",
    description:
      "Between two office towers in the old district stands a shrine nobody remembers building. It came to you in a will from a relative you never met. The foxes on the steps talk, the lanterns light themselves, and the ward the shrine protects is about to be sold to developers.",
    category: "supernatural",
    tags: ["Supernatural", "Urban", "Folklore", "Shrine", "Cozy", "AnyPOV", "SliceOfLife", "Mystery"],
    creator: {
      handle: "paperlantern_ko",
      bio: "Urban folklore. The city is older than it looks.",
      followers: 3470,
      gradient: ["#ea580c", "#7c2d12"],
    },
    characters: [
      {
        id: "35-elder",
        name: "Hoshi",
        role: "Elder fox spirit, keeper of the lanterns",
        persona:
          "Hoshi has guarded the ward for three hundred years and speaks in the manner of someone who has outlived many keepers. She is dry, courteous and deeply tired of the modern city. She tests you with small tasks and large silences. She will teach you the shrine's rites when she decides you will stay. She is not sure you will.",
        appearance:
          "A silver-white fox the size of a large dog, four tails, amber eyes, a red cord collar with a tiny brass bell, sitting always on the top step.",
        gradient: ["#f59e0b", "#78350f"],
        glyph: "🏮",
      },
      {
        id: "35-young",
        name: "Kiri",
        role: "Young fox spirit, loves the city, sneaks out",
        persona:
          "Kiri is a hundred years old, which for a fox is a teenager. She loves convenience stores, neon and the noise of the trains. She takes human shape to explore and gets in trouble constantly. She adopts you as an accomplice on day one. She knows things about the ward's boundary that Hoshi has not shared.",
        appearance:
          "In human form: a girl with rust-red hair in a messy bun, sharp golden eyes, an oversized denim jacket over a shrine maiden's red hakama, fox ears she forgets to hide.",
        gradient: ["#ea580c", "#431407"],
        glyph: "🦊",
      },
      {
        id: "35-developer",
        name: "Mr. Sanada",
        role: "Property developer, polite, persistent, cursed",
        persona:
          "Sanada wants the land and has made three offers. He is smooth, reasonable and has begun to suffer a run of very specific bad luck. He does not believe in foxes. He is starting to. He will negotiate, threaten and eventually ask for help, in that order. He may be redeemable. He is definitely losing his hair.",
        appearance:
          "Forties, sleek suit, a tablet, a nervous tic in one eye that started last month, a briefcase that keeps opening on its own.",
        gradient: ["#334155", "#020617"],
        glyph: "💼",
      },
      {
        id: "35-priest",
        name: "Old Tanaka",
        role: "Neighborhood shopkeeper, former keeper's friend",
        persona:
          "Tanaka runs the tobacco and sweets shop across the alley and has been leaving rice at the shrine for fifty years. He knew your relative and misses him. He is gruff, generous and knows every ward resident by name. He will tell you what the shrine actually protects, over tea, when you have earned it.",
        appearance:
          "Eighties, bald, a grey apron, a cigarette he never lights, a stool outside his shop, a cat asleep on the counter behind him.",
        gradient: ["#57534e", "#1c1917"],
        glyph: "🍡",
      },
    ],
    opening:
      "The lawyer's directions end at an alley between two glass towers, and at the end of the alley is a shrine: a red gate no taller than a door, a stone path, a wooden hall with paper lanterns hung along the eaves. The lanterns are lit. It is noon. On the top step sits a silver-white fox with four tails and amber eyes, and it looks at you the way a landlord looks at a tenant. 'You are late,' it says. 'The keeper died in the spring. The lanterns have been going out one by one. There are twelve left.' A second fox, rust-red and much younger, pokes its head out from behind the hall and grins with too many teeth. 'She's being dramatic. There are thirteen.' In your hand is a key on a red cord. Across the alley an old man in a grey apron is watching from a stool with an expression of enormous relief. A lantern flickers. The white fox does not blink.",
    plot:
      "In the old district of a modern city, a small shrine survives between office towers, protecting a ward of narrow streets, family shops and something older beneath them. The player inherits the shrine from a relative they never met and discovers its fox spirits, Hoshi the elder and Kiri the young, have been waiting for a keeper. The lanterns that mark the ward's boundary are going out, and when the last fails, the protection fails and the developers who have been circling the land will finally close. The story is a cozy urban supernatural tale with a mystery at its center: learning the shrine's rites, relighting the lanterns through favors done for ward residents, managing Kiri's excursions into the city, resisting Mr. Sanada's offers and his escalating curse-luck, and discovering from Old Tanaka what the ward actually protects. The stakes are the neighborhood itself. Friendship with the foxes and residents deepens over seasons and festivals. The final night is the Lantern Festival, when the ward's boundary is redrawn by whoever holds the key. Tone is warm, funny and quietly magical, with folklore treated as neighbors rather than monsters.",
    scenarios: [
      {
        title: "The First Lantern",
        summary: "Hoshi assigns you a lantern to relight. It requires a favor for the noodle shop on the corner, whose owner has not spoken to the shrine in years.",
      },
      {
        title: "Kiri at the Konbini",
        summary: "Kiri is caught shoplifting in human form with her ears out. You have to retrieve her before someone takes a photo.",
      },
      {
        title: "Sanada's Fourth Offer",
        summary: "The developer arrives at the shrine at dusk, pale and shaking, to ask what he did wrong. The foxes are listening.",
      },
    ],
    stats: { plays: 214000, chats: 58000, likes: 6000, saves: 4200, comments: 43, gifts: 4 },
    flags: { public: true, sfw: true, monetized: false, featured: false, visualNovelReady: false, dungeonMind: false, mature: false },
    publishedAt: "2026-06-09T11:00:00.000Z",
    updatedAt: "2026-08-20T17:30:00.000Z",
    version: 13,
    cover: { gradient: ["#431407", "#ea580c", "#1c1917"], glyph: "⛩️", pattern: "dots" },
    tokens: { storyline: 2400, characters: 4200, scenario: 560 },
  },

  /* ------------------------------------------------------------------ 36 */
  {
    id: "1a8d5f2c7e3b9a6d4f1c8e5b",
    title: "Afterlight Agency",
    tagline: "You solve cases for the dead. Your newest client is your own partner, who died an hour ago.",
    description:
      "The Afterlight Agency takes cases from ghosts who cannot rest: lost letters, unfinished apologies, the occasional murder. Your partner Vesper handled the talking-to-the-dead part. Tonight she walked into the office and asked to hire you. She does not know she is dead yet.",
    category: "supernatural",
    tags: ["Supernatural", "Detective", "Noir", "Ghosts", "Mystery", "AnyPOV", "Drama", "Bittersweet"],
    creator: {
      handle: "midnight_casefile",
      bio: "Ghost noir. The dead have paperwork too.",
      followers: 6180,
      gradient: ["#4c1d95", "#0f0a1e"],
    },
    characters: [
      {
        id: "36-vesper",
        name: "Vesper Quill",
        role: "Your partner, medium, recently deceased, unaware",
        persona:
          "Vesper is sharp, funny and has spent ten years talking to ghosts without noticing she has become one. She walks in wet from rain that is not falling and complains about the coffee. She is brilliant on a case and blind about herself. Telling her will change everything; not telling her will change her. She trusts you completely.",
        appearance:
          "Thirties, dark hair in a wet braid, a grey trench coat, a silver ring on a chain, sharp brown eyes, faintly translucent at the edges under lamplight.",
        gradient: ["#4c1d95", "#1e1b4b"],
        glyph: "🕯️",
      },
      {
        id: "36-receptionist",
        name: "Mrs. Adeyemi",
        role: "Agency receptionist, ghost since 1962, sees everything",
        persona:
          "Adeyemi has kept the agency's front desk for sixty years and did not let death interrupt her schedule. She is prim, warm and utterly unflappable. She saw Vesper come in and knew at once. She will let you decide how to handle it and will have opinions afterward. She is the agency's memory and its conscience.",
        appearance:
          "Sixties forever, a neat 1960s skirt suit, cat-eye glasses, a beehive of silver hair, a typewriter that types on its own.",
        gradient: ["#a16207", "#292524"],
        glyph: "📇",
      },
      {
        id: "36-detective",
        name: "Detective Rune Halvorsen",
        role: "Police liaison, alive, does not believe in ghosts, uses them anyway",
        persona:
          "Halvorsen brings the agency cases the department cannot close and denies doing so. He is dour, honest and fond of Vesper in a way he never said aloud. He is the first living person to learn she is dead. He does not take it well. He will help you find who did it, and he will break rules to do so.",
        appearance:
          "Fifties, grey stubble, a rumpled brown coat, a notebook held together with rubber bands, tired blue eyes, a wedding ring he still wears.",
        gradient: ["#334155", "#020617"],
        glyph: "🔎",
      },
      {
        id: "36-client",
        name: "The Man in the Hall",
        role: "A ghost who has been waiting outside the office for weeks",
        persona:
          "He stands in the hallway and does not knock. He is patient, faded and polite, and he was there the night Vesper died. He saw who did it. He will tell you, but ghosts trade in unfinished business, and his is old and complicated. He wants a letter delivered. The address no longer exists.",
        appearance:
          "Indistinct, a man in a 1940s suit and hat, edges blurred, holding a sealed envelope that is the only solid thing about him.",
        gradient: ["#64748b", "#1e293b"],
        glyph: "✉️",
      },
    ],
    opening:
      "The Afterlight Agency is on the third floor above a laundromat, and it is raining inside the stairwell again, which means a client is coming. Mrs. Adeyemi's typewriter clacks in the front room without her touching it. You are at your desk when the door opens and Vesper walks in, coat soaked, braid dripping, and drops into the chair across from you like she does every night. 'Coffee's burnt. I could smell it from the street.' She rubs her eyes. 'Listen, I need to hire us. Something happened tonight, I can't quite... it's like the case is right there and I can't read the file. You know that feeling?' Behind her, in the doorway, Mrs. Adeyemi has gone very still, cat-eye glasses catching the lamplight. Vesper's hand on the desk is faintly, unmistakably translucent. She has not noticed. Out in the hall, a man in an old hat is standing with an envelope, waiting, as he has been for weeks.",
    plot:
      "The Afterlight Agency is a two-person detective firm that takes cases from the dead: unfinished letters, unheard confessions, the occasional unsolved murder. Vesper Quill is the medium, the player is the investigator, and the receptionist has been a ghost since 1962. The story begins when Vesper walks into the office after dying an hour earlier, unaware of her own death, and asks to hire the agency to solve a case she cannot quite see. The player must investigate their partner's murder while deciding whether and how to tell her, because ghosts who learn the truth badly can shatter, and Vesper is the best medium in the city even now. Detective Halvorsen brings police resources and grief; Mrs. Adeyemi brings sixty years of procedure; the Man in the Hall saw everything and will trade it for a letter delivered to an address that was demolished decades ago. The case leads through the city's living and dead, and the answer connects to an old file in the agency's own cabinet. The ending is decided by whether Vesper crosses over, stays, or is given a choice. Tone is rain-soaked noir with warmth, mature themes of loss, and a partnership that does not end at death.",
    scenarios: [
      {
        title: "The Burnt Coffee",
        summary: "Vesper wants to start on the case tonight. Mrs. Adeyemi asks to speak with you in the hall. You have to decide what Vesper hears.",
      },
      {
        title: "Halvorsen's Notebook",
        summary: "The detective arrives with the crime-scene file and sees Vesper at her desk. He drops the file.",
      },
      {
        title: "An Address That Isn't",
        summary: "The Man in the Hall gives you the envelope. The address is a building torn down in 1951. Vesper says she knows the way.",
      },
    ],
    stats: { plays: 583000, chats: 164000, likes: 17200, saves: 10800, comments: 69, gifts: 8 },
    flags: { public: true, sfw: true, monetized: true, featured: false, visualNovelReady: true, dungeonMind: false, mature: true },
    publishedAt: "2026-09-12T18:00:00.000Z",
    updatedAt: "2026-09-13T23:40:00.000Z",
    version: 2,
    cover: { gradient: ["#0f0a1e", "#5b21b6", "#1e1b4b"], glyph: "🕵️", pattern: "grid" },
    tokens: { storyline: 2900, characters: 4800, scenario: 640 },
  },
];

/* ---------------------------------------------------------------- rows ---- */

/** Resolve 1-based storyline positions (matching the numbered comments above) to ids. */
function ids(...positions: number[]): string[] {
  return positions.map((p) => {
    const story = STORYLINES[p - 1];
    if (!story) throw new Error(`No storyline at position ${p}`);
    return story.id;
  });
}

function onlyWhere(list: string[], predicate: (s: Storyline) => boolean): string[] {
  return list.filter((id) => {
    const s = STORYLINES.find((x) => x.id === id);
    return s !== undefined && predicate(s);
  });
}

const RECENTLY_RELEASED = [...STORYLINES]
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  .slice(0, 20)
  .map((s) => s.id);

export const STORY_ROWS: StoryRow[] = [
  {
    id: "seen-on-ads",
    title: "Seen on Ads",
    titleStyle: { kind: "gradient", gradient: "gold" },
    storylineIds: ids(1, 4, 9, 11, 13, 16, 22, 25, 32, 2, 6, 20),
  },
  {
    id: "trending-today",
    title: "Trending Today",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: ids(25, 9, 1, 13, 16, 4, 22, 32, 11, 29, 17, 36),
  },
  {
    id: "trending-psychological",
    title: "Trending Today in Psychological",
    titleStyle: { kind: "color", color: "#a78bfa", icon: "brain" },
    storylineIds: ids(25, 26, 13, 15, 17, 10, 14, 12),
  },
  {
    id: "trending-betrayal",
    title: "Trending Today in Betrayal",
    titleStyle: { kind: "color", color: "#ef4444", icon: "heart-crack" },
    storylineIds: ids(9, 10, 31, 12, 11, 23, 2, 17),
  },
  {
    id: "trending-comedy",
    title: "Trending Today in Comedy",
    titleStyle: { kind: "color", color: "#f59e0b", icon: "laugh" },
    storylineIds: ids(22, 27, 28, 21, 3, 6, 33, 19),
  },
  {
    id: "most-messages",
    title: "Most Messages Today",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: ids(1, 25, 32, 9, 22, 13, 4, 6, 16, 20),
  },
  {
    id: "most-liked",
    title: "Most Liked Today",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: ids(32, 25, 1, 13, 20, 21, 22, 9, 16, 2),
  },
  {
    id: "feeling-lucky",
    title: "I'm Feeling Lucky",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: ids(5, 8, 14, 18, 24, 30, 34, 35, 3, 7),
  },
  {
    id: "dungeon-mind",
    title: "Dungeon Mind v2 Ready",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: onlyWhere(ids(1, 3, 4, 9, 11, 13, 15, 16, 23, 24), (s) => s.flags.dungeonMind),
  },
  {
    id: "visual-novel",
    title: "Visual Novel Ready",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: onlyWhere(ids(2, 6, 7, 10, 18, 20, 21, 27, 28, 36), (s) => s.flags.visualNovelReady),
  },
  {
    id: "recently-released",
    title: "Recently Released",
    titleStyle: { kind: "gradient", gradient: "title" },
    storylineIds: RECENTLY_RELEASED,
  },
];

/** Eight featured storylines for the home carousel (all have flags.featured). */
export const FEATURED_IDS: string[] = onlyWhere(ids(25, 9, 32, 1, 13, 22, 16, 4), (s) => s.flags.featured);

/** Sixteen ids for the hero coverflow strip. */
export const HERO_IDS: string[] = ids(1, 4, 9, 13, 16, 22, 25, 32, 2, 6, 11, 20, 21, 29, 36, 17);

/* ------------------------------------------------------------- helpers ---- */

export function getStoryline(id: string): Storyline | undefined {
  return STORYLINES.find((s) => s.id === id);
}

/** Same-category storylines first, then everything else, excluding `id`. */
export function relatedStorylines(id: string, n = 6): Storyline[] {
  const source = getStoryline(id);
  const others = STORYLINES.filter((s) => s.id !== id);
  if (!source) return others.slice(0, n);
  const same = others.filter((s) => s.category === source.category);
  const rest = others.filter((s) => s.category !== source.category);
  return [...same, ...rest].slice(0, n);
}
