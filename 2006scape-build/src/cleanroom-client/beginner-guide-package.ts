/**
 * Project Copper Lantern — beginner guide package and pocketbook content.
 *
 * Guidance is client-presented, while completion and rewards remain
 * server-authoritative. The text avoids assuming prior MMO experience.
 */

export type GuideStepId =
  | "look-around"
  | "move"
  | "open-overview"
  | "shape-character"
  | "read-pocketbook"
  | "try-safe-interaction"
  | "learn-portal"
  | "leave-garden";

export type GuideAction =
  | "camera-pan"
  | "click-ground"
  | "open-overview"
  | "open-cosmetics"
  | "open-pocketbook"
  | "interact"
  | "inspect-portal"
  | "confirm-departure";

export type BeginnerGuideStep = {
  id: GuideStepId;
  order: number;
  title: string;
  plainLanguage: string;
  whyItMatters: string;
  action: GuideAction;
  hint: string;
  completionSignal: string;
  safeAreaOnly: boolean;
};

export type PocketbookPage = {
  id: string;
  tab: "start-here" | "movement" | "world" | "character" | "safety" | "glossary";
  title: string;
  body: string;
  bullets: string[];
  relatedGuideStep?: GuideStepId;
};

export type StarterGuidePackage = {
  packageId: string;
  title: string;
  welcomeMessage: string;
  estimatedMinutes: number;
  steps: BeginnerGuideStep[];
  pocketbook: PocketbookPage[];
  firstLoginChecklist: string[];
  accessibilityNotes: string[];
};

export const BEGINNER_GUIDE_PACKAGE: StarterGuidePackage = {
  packageId: "sable-fen-first-steps-v1",
  title: "Your First Steps in Sable Fen",
  welcomeMessage: "You are safe here. Take a moment, look around, and learn one small thing at a time.",
  estimatedMinutes: 8,
  steps: [
    {
      id: "look-around",
      order: 1,
      title: "Look around",
      plainLanguage: "Drag or use the camera controls to see the garden. Nothing can hurt you here.",
      whyItMatters: "The camera helps you spot paths, doors, landmarks, and other players.",
      action: "camera-pan",
      hint: "Try a small camera movement. You can always return to the starting view.",
      completionSignal: "Camera moved a short distance and returned to a readable angle.",
      safeAreaOnly: true,
    },
    {
      id: "move",
      order: 2,
      title: "Walk to the gold marker",
      plainLanguage: "Click an open patch of ground. Your character will walk there; you do not need perfect aim.",
      whyItMatters: "Most travel is simply choosing a safe destination and letting the world guide your route.",
      action: "click-ground",
      hint: "Start with the short path between the Welcome Plinth and the mirror.",
      completionSignal: "Player reaches a server-approved destination tile.",
      safeAreaOnly: true,
    },
    {
      id: "open-overview",
      order: 3,
      title: "Open your overview",
      plainLanguage: "Open the overview to see where you are, what level you are on, and nearby landmarks.",
      whyItMatters: "The overview keeps larger areas understandable when buildings, towers, and tunnels are added.",
      action: "open-overview",
      hint: "Look for the map or compass button in the upper corner.",
      completionSignal: "Realm overview opened once.",
      safeAreaOnly: true,
    },
    {
      id: "shape-character",
      order: 4,
      title: "Make the character yours",
      plainLanguage: "Use the mirror to try a face, hair, colors, body presentation, and clothing look.",
      whyItMatters: "Cosmetic choices change how your character looks, not how powerful they are.",
      action: "open-cosmetics",
      hint: "There is no wrong choice. You can revisit the mirror later.",
      completionSignal: "A cosmetic preview is opened and confirmed.",
      safeAreaOnly: true,
    },
    {
      id: "read-pocketbook",
      order: 5,
      title: "Read the pocketbook",
      plainLanguage: "Open the pocketbook for short explanations of movement, portals, safety, and common words.",
      whyItMatters: "You should not need to memorize game terminology to play.",
      action: "open-pocketbook",
      hint: "Start with the pages marked Start Here and Safety.",
      completionSignal: "At least one Start Here page opened.",
      safeAreaOnly: true,
    },
    {
      id: "try-safe-interaction",
      order: 6,
      title: "Try one safe interaction",
      plainLanguage: "Use the map table or garden guide. Read the prompt, then choose the highlighted action.",
      whyItMatters: "The same inspect-and-confirm pattern is used for doors, ladders, stairs, and other world objects.",
      action: "interact",
      hint: "If a prompt appears, it tells you what will happen before you confirm.",
      completionSignal: "A safe-area interaction returns an acknowledged result.",
      safeAreaOnly: true,
    },
    {
      id: "learn-portal",
      order: 7,
      title: "Learn what a portal is",
      plainLanguage: "Inspect the departure gate. It explains where you can go and reminds you that leaving the garden changes the safety rules.",
      whyItMatters: "Stairs, ladders, trapdoors, tunnels, and gates are all deliberate transitions between world layers.",
      action: "inspect-portal",
      hint: "Inspection is safe and does not leave the area.",
      completionSignal: "Departure gate information opened.",
      safeAreaOnly: true,
    },
    {
      id: "leave-garden",
      order: 8,
      title: "Choose when to leave",
      plainLanguage: "When you feel ready, confirm the departure prompt. You can return to the garden through the welcome route.",
      whyItMatters: "The game should explain a meaningful change before it happens.",
      action: "confirm-departure",
      hint: "You can stay here as long as you like; leaving is optional.",
      completionSignal: "Server confirms departure from the protected area.",
      safeAreaOnly: true,
    },
  ],
  pocketbook: [
    {
      id: "start-welcome",
      tab: "start-here",
      title: "Start here",
      body: "You are in a protected beginner area. Follow the gold markers, read the prompts, and take your time.",
      bullets: ["There is no combat here.", "Nothing is lost here.", "You may revisit the cosmetic mirror."],
      relatedGuideStep: "look-around",
    },
    {
      id: "start-first-loop",
      tab: "start-here",
      title: "Your first loop",
      body: "Look around, walk to a marker, open the overview, try a cosmetic, and read one pocketbook page.",
      bullets: ["Movement is click-to-walk in the starter area.", "Highlighted prompts explain the next action.", "You can stop after any step."],
      relatedGuideStep: "move",
    },
    {
      id: "movement-basics",
      tab: "movement",
      title: "Moving safely",
      body: "Click an open destination. The server checks the route, and your character follows the approved path.",
      bullets: ["Blocked paths are refused or rerouted.", "A red or unavailable marker means do not proceed yet.", "Walking and running are presentation changes; the world remains authoritative."],
      relatedGuideStep: "move",
    },
    {
      id: "world-overview",
      tab: "world",
      title: "Reading the world",
      body: "The overview shows your realm, region, level, nearby landmarks, and important exits.",
      bullets: ["Upstairs and downstairs are different world layers.", "Towers, tunnels, and dungeons use named transitions.", "The active player marker is always the most important marker."],
      relatedGuideStep: "open-overview",
    },
    {
      id: "character-cosmetics",
      tab: "character",
      title: "Your appearance",
      body: "The mirror lets you change face, eyes, hair, colors, body presentation, and cosmetic clothing layers.",
      bullets: ["Cosmetics do not change combat or movement values.", "Try colors in the preview before confirming.", "You can change your look again at a supported mirror."],
      relatedGuideStep: "shape-character",
    },
    {
      id: "portal-basics",
      tab: "world",
      title: "Doors, stairs, and portals",
      body: "A portal is a deliberate connection between places or levels. Inspect it first, then confirm if you want to travel.",
      bullets: ["Stairs go up or down.", "Ladders and ropes connect vertical spaces.", "Trapdoors, tunnels, and dungeon entrances may be locked or unavailable."],
      relatedGuideStep: "learn-portal",
    },
    {
      id: "safety-rules",
      tab: "safety",
      title: "Before leaving the garden",
      body: "The beginner garden is safer than the wider realm. The departure prompt explains what changes before you leave.",
      bullets: ["Outside areas may contain hazards.", "Read interaction prompts before confirming.", "If you are unsure, return to the Welcome Garden or open this page again."],
      relatedGuideStep: "leave-garden",
    },
    {
      id: "glossary-tile",
      tab: "glossary",
      title: "Tile",
      body: "A tile is a small piece of the world used to describe movement and location.",
      bullets: ["Tiles keep movement predictable.", "A level has its own tile grid.", "A portal can connect tiles on different levels."],
    },
    {
      id: "glossary-level",
      tab: "glossary",
      title: "Level",
      body: "A level is one layer of a place, such as a lodge ground floor, upstairs room, cellar, or cave depth.",
      bullets: ["Your overview shows your current level.", "Level changes happen through explicit transitions.", "The server remembers your authoritative level."],
    },
  ],
  firstLoginChecklist: [
    "Show protected-area notice.",
    "Spawn inside the Welcome Garden radius.",
    "Present one readable path to the Welcome Plinth.",
    "Offer cosmetics before departure.",
    "Make the pocketbook available from the HUD at all times.",
    "Explain that leaving is optional and changes the safety rules.",
  ],
  accessibilityNotes: [
    "Use plain language and avoid unexplained genre terms.",
    "Every visual prompt must have readable text.",
    "Do not require fast timing during onboarding.",
    "Keep guide text short enough for small screens.",
    "Allow the player to revisit completed pages.",
    "Never block the player from opening safety information.",
  ],
};

export function getGuideStep(stepId: GuideStepId): BeginnerGuideStep | undefined {
  return BEGINNER_GUIDE_PACKAGE.steps.find((step) => step.id === stepId);
}

export function getPocketbookTab(tab: PocketbookPage["tab"]): PocketbookPage[] {
  return BEGINNER_GUIDE_PACKAGE.pocketbook.filter((page) => page.tab === tab);
}

export function getNextGuideStep(completed: GuideStepId[]): BeginnerGuideStep | undefined {
  return BEGINNER_GUIDE_PACKAGE.steps.find((step) => !completed.includes(step.id));
}
