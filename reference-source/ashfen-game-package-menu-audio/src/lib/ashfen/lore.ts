export const BOOK_PAGES: Record<string, string[]> = {
  primer: [
    "Ashfen is a reed-country. The square is Reedhaven. The Keep watches. The Library remembers.",
    "Walk by pointing. The ground will take you if the tile is honest.",
    "Mirelings are not enemies of learning. They are hungry, and the mire made them so.",
    "Keep the Codex. What you read here will still be true when you put the book down.",
  ],
  bestiary: [
    "Mireling: a reed-swamp homunculus. Moss hide, yellow eyes, no language we keep.",
    "They wander the south square and the path to the grove. Strike only in Attack.",
    "They return. The mire does not stay empty. Watch the amber ring — that is when they come back.",
  ],
  catalogue: [
    "Shelf A — primers and field guides. Shelf B — names. Shelf C — the Keep's copies.",
    "Living books prefer to be read, not shelved. Wren will tell you which ones are awake.",
    "Nothing in this catalogue is borrowed from another realm. The ink is ours.",
  ],
  reed: [
    "Reedcut: take from a living tree, then wait. The grove answers on its own clock.",
    "Delve: grey rock south-east. Angle: the east pond dock. Binding: the staff Toller sells.",
    "Vitality is the only number that can send you back to the fountain. Guard it.",
  ],
  names: [
    "Wren. Halden. Toller. Pell. Caldew. The square still says these names out loud.",
    "Lost names are not gone. They are waiting for a reader who will keep them.",
  ],
  ledger: [
    "The vault is quiet. Tithe of bread, reed, and ore — not coin of another king.",
    "Halden was a clerk before he was Keepmaster. The columns still add.",
  ],
  binding: [
    "Binding is memory made to stay. A word, a page, a command that does not leak.",
    "Monk-Mode: nothing leaves the device. The Codex is a local truth.",
  ],
};

export const SHOP = [
  { id: "bread", name: "Bread", cost: 3, blurb: "Restores 4 Vitality." },
  { id: "rice", name: "Rice cakes", cost: 5, blurb: "Endurance. Slight Vitality." },
  { id: "cactus", name: "Cactus juice", cost: 8, blurb: "The path runs quicker." },
  { id: "honey", name: "Nepalien honey", cost: 9, blurb: "The strike lands true." },
  { id: "blade", name: "Reed blade", cost: 12, blurb: "Strike +1 on hit." },
  { id: "staff", name: "Ash staff", cost: 18, blurb: "Binding gathers faster." },
] as const;
