import { Passage } from "./types";

export const interiorityPassages: Passage[] = [
  {
    id: "woolf-dalloway-open",
    categoryId: "interiority",
    tags: ["stream-of-consciousness", "sensory-detail"],
    difficulty: "challenging",
    title: "Mrs Dalloway",
    author: "Virginia Woolf",
    work: "Mrs Dalloway (1925)",
    text: "What a lark! What a plunge! For so it had always seemed to her when, with a little squeak of the hinges, which she could hear now, she had burst open the French windows and plunged at Bourton into the open air. How fresh, how calm, stiller than this of course, the air was in the early morning.",
    context:
      "Woolf's stream of consciousness makes no distinction between the present and memory — they interpenetrate. Clarissa is opening a door now and opening a door thirty years ago at the same time. 'She could hear now' — the past tense is present tense.",
    twists: [
      {
        label: "Fix the timeline",
        prompt:
          "Rewrite it with a clear, linear structure: first the present, then the memory, clearly separated. Notice how that changes the feeling.",
      },
      {
        label: "Make it anxious",
        prompt:
          "Rewrite it so the same morning scene — the same action of opening a door — fills someone with dread rather than joy.",
      },
      {
        label: "Stay in the body",
        prompt:
          "Rewrite it using only physical sensation — no emotion words, no 'felt', no 'seemed'. Only what the body registers.",
      },
    ],
  },
  {
    id: "nabokov-speak",
    categoryId: "interiority",
    tags: ["first-person", "defamiliarization"],
    difficulty: "challenging",
    title: "Speak, Memory",
    author: "Vladimir Nabokov",
    work: "Speak, Memory (1951)",
    text: "The cradle rocks above an abyss, and common sense tells us that our existence is but a brief crack of light between two eternities of darkness. Although the two are identical twins, man, as a rule, views the prenatal abyss with more calm than the one he is heading for.",
    context:
      "Nabokov opens his memoir by looking at death — but backwards and forwards at once. 'A brief crack of light' is one of the great images in English prose. Notice the dry humor in 'as a rule'.",
    twists: [
      {
        label: "Rewrite without metaphor",
        prompt:
          "Say the same thing — about birth, death, and the strange asymmetry of how we feel about them — using no metaphors at all. Only literal language.",
      },
      {
        label: "Make it personal",
        prompt:
          "Rewrite it in first person about a specific memory of your own — a moment where you felt time sharply.",
      },
      {
        label: "Change the tone",
        prompt:
          "Nabokov is wry and cool. Rewrite it with genuine grief — as if the person writing has just lost someone.",
      },
    ],
  },
  {
    id: "woolf-dalloway-loneliness",
    categoryId: "interiority",
    tags: ["stream-of-consciousness", "repetition", "sensory-detail"],
    difficulty: "intermediate",
    title: "Mrs Dalloway",
    author: "Virginia Woolf",
    work: "Mrs Dalloway (1925)",
    text: "She had a perpetual sense, as she watched the taxi cabs, of being out, out, far out to sea and alone; she always had the feeling that it was very, very dangerous to live even one day.",
    context:
      "Woolf buries the word 'alone' deep inside the sentence, after a rhythmic push — 'out, out, far out' — that mimics the feeling of drifting away from the shore. The taxi cabs anchor us in London, but the mind is already at sea. And then the second clause lands: danger is not outside, it is in the fact of being alive at all.",
    twists: [
      {
        label: "Ground the feeling",
        prompt:
          "Rewrite it so the loneliness is expressed entirely through concrete, physical detail — no abstractions, no 'sense', no 'feeling'. Only what the body and the world do.",
      },
      {
        label: "Reverse the drift",
        prompt:
          "Rewrite it so the movement goes inward instead of outward — the character feels the world pressing in, not drifting away.",
      },
      {
        label: "Make it plural",
        prompt:
          "Rewrite it from the perspective of two people standing side by side, both feeling this. How does shared loneliness change the sentence?",
      },
    ],
  },
  {
    id: "james-ambassador",
    categoryId: "interiority",
    tags: ["stream-of-consciousness", "restraint"],
    difficulty: "challenging",
    title: "The Ambassadors",
    author: "Henry James",
    work: "The Ambassadors (1903)",
    text: "It was a relief to him to find, on glancing at his watch, that he had still a little time to himself. He had no engagement till half-past seven, and there was nothing to prevent his making, in the interval, a further use of his freedom. He would have liked in a manner to think, yet he had also rather wished to go straight — to go somewhere, anywhere; he was not quite sure where.",
    context:
      "James gives us a man standing on the edge of a choice, unable to name it. The vagueness is precise — 'somewhere, anywhere' — the mind circling something it won't land on. Interiority as delay.",
    twists: [
      {
        label: "Make the choice clear",
        prompt:
          "Rewrite it so the character knows exactly what they want and why they're hesitating. Clarity instead of fog. What changes?",
      },
      {
        label: "Shorten it radically",
        prompt:
          "Say the same thing in two sentences. The man. The hesitation. Nothing else.",
      },
      {
        label: "Put it in action",
        prompt:
          "Rewrite it so we understand everything purely through what the character physically does. No access to his thoughts.",
      },
    ],
  },
];
