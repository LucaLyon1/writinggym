import { Passage } from "./types";

export const placeAndAtmospherePassages: Passage[] = [
  {
    id: "leguinn-earthsea",
    categoryId: "place-and-atmosphere",
    tags: ["opening", "compression", "sensory-detail"],
    title: "A Wizard of Earthsea",
    author: "Ursula K. Le Guin",
    work: "A Wizard of Earthsea (1968)",
    text: "The island of Gont, a single mountain that lifts its peak a mile above the storm-racked Northeast Sea, is a land famous for wizards. From the towns in its high valleys and the ports on its dark narrow bays many a Gontishman has gone forth to serve the Lords of the Archipelago in their cities as wizard or mage, or, serving no lord, to wander the world's end.",
    context:
      "Le Guin opens with geography as biography. The land explains the people before any character appears. Notice how the sentence breathes — it expands, then contracts at 'wander the world's end'.",
    twists: [
      {
        label: "Make it mundane",
        prompt:
          "Rewrite it about a real, ordinary place — your city, your neighborhood. Keep the epic, mythological tone completely intact.",
      },
      {
        label: "Compress it",
        prompt: "Say the same thing in exactly two sentences. No more.",
      },
      {
        label: "Start with a person",
        prompt:
          "Rewrite it so a specific character — not the island — is the subject of the first sentence.",
      },
    ],
  },
  {
    id: "woolf-waves",
    categoryId: "place-and-atmosphere",
    tags: ["sensory-detail", "defamiliarization"],
    title: "The Waves",
    author: "Virginia Woolf",
    work: "The Waves (1931)",
    text: "The sun had not yet risen. The sea was indistinguishable from the sky, except that the sea was slightly creased as if a cloth had wrinkles in it. Gradually as the sky whitened a dark line lay on the horizon dividing the sea from the sky and the grey cloth became barred with thick strokes moving, one after another, beneath the surface, following each other, pursuing each other, perpetually.",
    context:
      "Woolf watches light before there is light. The simile — 'as if a cloth had wrinkles' — makes the ocean domestic, small, touchable. Then the horizon cuts it back into vastness.",
    twists: [
      {
        label: "Make it interior",
        prompt:
          "Rewrite it as someone waking up in a room — no sea, no sky. But keep the same quality of attention to gradual, shifting light.",
      },
      {
        label: "Add a human",
        prompt:
          "Place one person watching this scene. Don't describe what they feel — only what they do.",
      },
      {
        label: "Harshen it",
        prompt:
          "Rewrite it with an edge of menace. The same slow dawn, but something is wrong.",
      },
    ],
  },
  {
    id: "chekhov-bishop",
    categoryId: "place-and-atmosphere",
    tags: ["sensory-detail", "juxtaposition"],
    title: "The Bishop",
    author: "Anton Chekhov",
    work: "The Bishop (1902)",
    text: "The palm branches had been distributed and it was past nine o'clock. The candles were burning dimly, the wicks wanted snuffing; everything was misty. In the twilight of the church the crowd heaved like the sea, and to Bishop Pyotr, who had been unwell for three days, it seemed as though all the faces — old and young, men's faces and women's — were alike, that everyone who came up for the palm had the same expression.",
    context:
      "Chekhov builds atmosphere through small sensory failures — dim candles, smoky air — before revealing the bishop's fever. The physical world and the interior world are one.",
    twists: [
      {
        label: "Change the illness",
        prompt:
          "Rewrite it but instead of illness, the bishop is overwhelmed by joy. Same scene, opposite interior state. What changes?",
      },
      {
        label: "Remove the crowd",
        prompt:
          "Rewrite it so the bishop is completely alone in the church. Same mood, no people.",
      },
      {
        label: "Make it faster",
        prompt:
          "Rewrite it in sharp, short sentences. Nothing longer than eight words. Same content, staccato rhythm.",
      },
    ],
  },
  {
    id: "garcia-marquez-macondo",
    categoryId: "place-and-atmosphere",
    tags: ["compression", "juxtaposition", "defamiliarization"],
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    work: "One Hundred Years of Solitude (1967)",
    text: "Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice. At that time Macondo was a village of twenty adobe houses, built on the bank of a river of clear water that ran along a bed of polished stones, which were white and enormous, like prehistoric eggs.",
    context:
      "García Márquez compresses three timeframes — execution, childhood, the founding of a village — into two sentences. The miraculous (ice, prehistoric eggs) sits beside the mundane without explanation. This is the grammar of magical realism.",
    twists: [
      {
        label: "Remove the future",
        prompt:
          "Rewrite it without any reference to what happens later. Only the present moment of discovery. What do you lose?",
      },
      {
        label: "Make the miracle smaller",
        prompt:
          "Replace 'ice' with something even more ordinary — a window, a mirror, a piece of glass. Can you preserve the sense of wonder?",
      },
      {
        label: "Change the scale",
        prompt:
          "Rewrite it about an enormous, ancient city instead of a small village. How does scale change the feeling of the passage?",
      },
    ],
  },
];
