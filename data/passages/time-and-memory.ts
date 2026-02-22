import { Passage } from "./types";

export const timeAndMemoryPassages: Passage[] = [
  {
    id: "baldwin-notes",
    categoryId: "time-and-memory",
    title: "Notes of a Native Son",
    author: "James Baldwin",
    work: "Notes of a Native Son (1955)",
    text: "On the 29th of July, in 1943, my father died. On the same day, a few hours later, his last child was born. Over a month before this, while all our energies were concentrated in waiting for these events, there had been, in Detroit, one of the bloodiest race riots of the century.",
    context:
      "Baldwin places private grief inside public catastrophe without explaining the connection. The dates carry everything. Notice there is no interpretation — only sequence.",
    twists: [
      {
        label: "Remove the dates",
        prompt:
          "Rewrite it without any dates or numbers. How do you preserve the weight of simultaneity?",
      },
      {
        label: "Add warmth",
        prompt:
          "Rewrite it in a voice that loved the father deeply. Same facts, completely different emotional temperature.",
      },
      {
        label: "Slow it down",
        prompt:
          "Expand just the first sentence into a full paragraph. What was that day like? What was the light doing?",
      },
    ],
  },
  {
    id: "proust-madeleine",
    categoryId: "time-and-memory",
    title: "In Search of Lost Time",
    author: "Marcel Proust",
    work: "Swann's Way (1913)",
    text: "And suddenly the memory revealed itself. The taste was that of the little piece of madeleine which on Sunday mornings at Combray, when I went to say good morning to her in her bedroom, my aunt Léonie used to give me, dipping it first in her own cup of tea or tisane.",
    context:
      "Proust's famous involuntary memory: the past doesn't return through effort but through the body. A taste unlocks what thinking couldn't reach. 'The memory revealed itself' — passive voice, deliberate. It happens to him, not from him.",
    twists: [
      {
        label: "Change the sense",
        prompt:
          "Rewrite it using a different sense — not taste but smell, touch, or sound. What unlocks a memory for your narrator?",
      },
      {
        label: "Make it a bad memory",
        prompt:
          "Rewrite it so the involuntary memory is unwanted — something the narrator has been trying to forget. Same structure, opposite experience.",
      },
      {
        label: "Compress the time",
        prompt:
          "The original lingers. Rewrite it quickly — the memory hits and is gone in three sentences. Acceleration instead of expansion.",
      },
    ],
  },
  {
    id: "didion-bethlehem",
    categoryId: "time-and-memory",
    title: "Slouching Towards Bethlehem",
    author: "Joan Didion",
    work: "Slouching Towards Bethlehem (1968)",
    text: "We tell ourselves stories in order to live. The princess is caged in the consulate. The man with the candy will lead the children into the sea. The naked woman on the ledge outside the window on the sixteenth floor is a victim of accidie, or the naked woman is an exhibitionist, and it would be 'interesting' to know which.",
    context:
      "Didion opens with a thesis and then fractures it immediately into images. The rhythm is declarative then unstable — watch how the sentences get longer and stranger.",
    twists: [
      {
        label: "Ground it",
        prompt:
          "Rewrite it set in one specific, ordinary place — a laundromat, a parking lot. Keep the philosophical weight, but anchor it completely.",
      },
      {
        label: "Strip the abstractions",
        prompt:
          "Remove every abstract noun. No 'stories', no 'accidie', no 'victims'. Rewrite using only concrete physical things.",
      },
      {
        label: "Make it quieter",
        prompt:
          "Rewrite it as a single, slow paragraph. One breath. One thought building into the next.",
      },
    ],
  },
];
