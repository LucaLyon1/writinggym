import { Passage } from "./types";

export const inMediasResPassages: Passage[] = [
  {
    id: "carver-cathedral",
    categoryId: "in-medias-res",
    title: "Cathedral",
    author: "Raymond Carver",
    work: "Cathedral (1983)",
    text: "This blind man, an old friend of my wife's, he was on his way to spend the night. His wife had died. So he was visiting the dead wife's relatives in Connecticut. He called my wife from his in-laws'. Arrangements were made. He would come by train, a five-hour trip, and my wife would meet him at the station.",
    context:
      "Carver's opening lines establish everything through omission. Notice what's not said — why the narrator feels uneasy, why distance creeps into every sentence. We are dropped into a situation already fully formed.",
    twists: [
      {
        label: "Drain the emotion",
        prompt:
          "Rewrite it as a police report or incident log. No feeling, only fact. What remains?",
      },
      {
        label: "Make it urgent",
        prompt:
          "Rewrite it as if the narrator is telling someone on the phone right now, rushed, slightly panicked.",
      },
      {
        label: "Flip the perspective",
        prompt:
          "Rewrite it from the blind man's point of view, arriving into an unknown house.",
      },
    ],
  },
  {
    id: "morrison-beloved",
    categoryId: "in-medias-res",
    title: "Beloved",
    author: "Toni Morrison",
    work: "Beloved (1987)",
    text: "124 was spiteful. Full of a baby's venom. The women of 124 had lived a ruinous life. Suddenly one evening they were gone and nobody saw them leave. But Sethe had lived there all her life and would not leave it for the world.",
    context:
      "Morrison gives a house a number, a number a feeling, a feeling an age. The grammar is declarative and strange — 'a baby's venom' — and it refuses to explain itself. We are inside something with a long history we are not yet given.",
    twists: [
      {
        label: "Explain it",
        prompt:
          "Rewrite it and explain everything — the house, why it's spiteful, who Sethe is. Notice what explaining costs.",
      },
      {
        label: "Change the house",
        prompt:
          "Rewrite it about a place you know — a room, a building. Give it a feeling the way Morrison gives 124 one.",
      },
      {
        label: "Extend the last line",
        prompt:
          "Keep everything the same, but expand the last sentence into a full paragraph. Why would Sethe not leave for the world?",
      },
    ],
  },
  {
    id: "kafka-trial",
    categoryId: "in-medias-res",
    title: "The Trial",
    author: "Franz Kafka",
    work: "The Trial (1925)",
    text: "Someone must have slandered Josef K., for one morning, without having done anything wrong, he was arrested. His landlady's cook, who always brought him his breakfast at eight o'clock, failed to appear on this occasion. That had never happened before.",
    context:
      "Kafka's first line gives us crime, innocence, and punishment simultaneously — and then immediately deflates to the banal: the cook didn't come. The juxtaposition is the whole novel. Catastrophe arrives as an administrative inconvenience.",
    twists: [
      {
        label: "Make it bureaucratic",
        prompt:
          "Rewrite an unexpected, life-altering event as if it were a minor HR procedure. Same stakes, language completely deflated.",
      },
      {
        label: "Remove the injustice",
        prompt:
          "Rewrite it so Josef K. did do something — we don't know what — and the arrest feels deserved. What changes?",
      },
      {
        label: "Slow the arrival",
        prompt:
          "Expand the morning. The cook not coming. The waiting. Before the arrest is announced, give us the texture of the ordinary day breaking down.",
      },
    ],
  },
  {
    id: "oconnor-good-country",
    categoryId: "in-medias-res",
    title: "A Good Man Is Hard to Find",
    author: "Flannery O'Connor",
    work: "A Good Man Is Hard to Find (1953)",
    text: "The grandmother didn't want to go to Florida. She wanted to visit some of her connections in east Tennessee and she was seizing at every chance to change Bailey's mind. Bailey was the son she lived with, her only boy. He was sitting on the edge of his chair at the table, bent over the orange sports section of the Journal.",
    context:
      "O'Connor drops us into a family argument already underway. Nobody introduces themselves. The grandmother's desire and Bailey's silence are the whole dynamic — and the whole story — already in motion.",
    twists: [
      {
        label: "Give Bailey a voice",
        prompt:
          "Rewrite it so Bailey speaks — not much, just one line. How does that shift the power in the scene?",
      },
      {
        label: "Remove the object",
        prompt:
          "The sports section is doing a lot of work. Rewrite it without any props or objects. What do you lose?",
      },
      {
        label: "Raise the temperature",
        prompt:
          "Rewrite it so the grandmother's desire feels desperate rather than nagging. Same situation, higher emotional stakes.",
      },
    ],
  },
];
