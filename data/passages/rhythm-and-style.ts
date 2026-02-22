import { Passage } from "./types";

export const rhythmAndStylePassages: Passage[] = [
  {
    id: "nabokov-lolita",
    categoryId: "rhythm-and-style",
    tags: ["first-person", "sensory-detail", "repetition"],
    title: "Lolita",
    author: "Vladimir Nabokov",
    work: "Lolita (1955)",
    text: "Lolita, light of my life, fire of my loins. Lo-lee-ta: the tip of the tongue taking a trip of three steps down the palate to tap, at three, on the teeth. Lo. Lee. Ta.",
    context:
      "Nabokov's opening is pure sound — the narrator performs the name like an incantation. The alliteration, the syllable-by-syllable breakdown, the anatomy of speaking: the prose enacts obsession. The style is the confession.",
    twists: [
      {
        label: "Write your own incantation",
        prompt:
          "Take any name and perform it the way Nabokov does — break it into syllables, trace where it lives in the mouth, make speaking it feel significant.",
      },
      {
        label: "Use plain words",
        prompt:
          "Rewrite the opening with the simplest possible vocabulary. No music, no performance. What remains of the character?",
      },
      {
        label: "Change the emotion",
        prompt:
          "Nabokov's sound is desire. Rewrite a name-as-incantation saturated with a completely different feeling — grief, contempt, fear.",
      },
    ],
  },
  {
    id: "mccarthy-road",
    categoryId: "rhythm-and-style",
    tags: ["sensory-detail", "minimalism", "compression"],
    title: "The Road",
    author: "Cormac McCarthy",
    work: "The Road (2006)",
    text: "When he woke in the woods in the dark and the cold of the night he'd reach out to touch the child sleeping beside him. Nights dark beyond darkness and the days more gray each one than what had gone before. Like the onset of some cold glaucoma dimming away the world.",
    context:
      "McCarthy removes punctuation to remove breath — the sentences run and don't stop. The world has no commas. The simile at the end, 'cold glaucoma', makes blindness physical, medical, irreversible. Style as worldview.",
    twists: [
      {
        label: "Add the punctuation back",
        prompt:
          "Rewrite it with full, conventional punctuation. Does the meaning change? Does anything survive?",
      },
      {
        label: "Find your simile",
        prompt:
          "The 'cold glaucoma' simile is unexpected and exact. Rewrite the passage with your own simile for a world going dark — something specific, medical, or technical.",
      },
      {
        label: "Introduce warmth",
        prompt:
          "Rewrite the same scene — night, cold, waking, checking on someone — so that the darkness feels safe rather than threatening.",
      },
    ],
  },
  {
    id: "hurston-eyes",
    categoryId: "rhythm-and-style",
    tags: ["defamiliarization", "juxtaposition"],
    title: "Their Eyes Were Watching God",
    author: "Zora Neale Hurston",
    work: "Their Eyes Were Watching God (1937)",
    text: "Ships at a distance have every man's wish on board. For some they come in with the tide. For others they sail forever on the horizon, never out of sight, never landing until the Watcher turns his eyes away in resignation, his dreams mocked to death by Time. Now, women forget all those things they don't want to remember, and remember everything they don't want to forget.",
    context:
      "Hurston opens with a philosophical image — horizon as yearning — and then pivots hard: 'Now, women'. The turn is sudden and it resets everything. The two-sentence philosophy of men, then women, is the whole novel compressed.",
    twists: [
      {
        label: "Remove the pivot",
        prompt:
          "Rewrite it without the 'Now, women' turn. Stay with the ships and the men. What's missing?",
      },
      {
        label: "Ground the metaphor",
        prompt:
          "Rewrite it without the ships metaphor — in the same philosophical register, but using something concrete and specific to your own life.",
      },
      {
        label: "Reverse the genders",
        prompt:
          "Rewrite it switching the genders. Does the reversal reveal something about the original?",
      },
    ],
  },
];
