import { Passage } from "./types";

export const tensionAndDreadPassages: Passage[] = [
  {
    id: "james-turn-screw",
    categoryId: "tension-and-dread",
    tags: ["withholding", "irony"],
    title: "The Turn of the Screw",
    author: "Henry James",
    work: "The Turn of the Screw (1898)",
    text: "The story had held us, round the fire, sufficiently breathless, but except the obvious remark that it was gruesome, as on Christmas Eve in an old house a strange tale should essentially be, I remember no comment uttered till somebody happened to note it as the only case he had met in which such a visitation had fallen on a child.",
    context:
      "James builds dread through delay — the sentence keeps adding clauses, keeps postponing the thing. 'A visitation fallen on a child' arrives almost casually, buried in subordinates. The horror is in the grammar.",
    twists: [
      {
        label: "Shorten it",
        prompt:
          "Rewrite it in two direct sentences. The horror stated plainly. What does compression do to dread?",
      },
      {
        label: "Name the thing",
        prompt:
          "James never says 'ghost'. Rewrite it naming the horror explicitly. Does naming diminish it?",
      },
      {
        label: "Change the setting",
        prompt:
          "Move the scene — same story being told — to a completely modern, mundane setting. An office lunch. A car ride. What survives?",
      },
    ],
  },
  {
    id: "oconnor-peacock",
    categoryId: "tension-and-dread",
    tags: ["symbolism", "juxtaposition"],
    title: "The Displaced Person",
    author: "Flannery O'Connor",
    work: "A Good Man Is Hard to Find (1953)",
    text: "The peacock stood in the middle of the road and unfolded his tail. The car came slowly to a stop, and the priest got out. The two women stayed in the car. The peacock spread himself out, filling the whole eye.",
    context:
      "O'Connor uses the peacock as prophecy. Something is being announced that nobody understands. The priest sees it; the women don't get out of the car. The tension is in what the image means against what the characters think it means.",
    twists: [
      {
        label: "Make the animal ordinary",
        prompt:
          "Replace the peacock with a more common animal — a crow, a dog, a cat in the road. Can you preserve the sense of omen?",
      },
      {
        label: "Give the women a reaction",
        prompt:
          "Rewrite it so one of the women gets out of the car. What does she do? What does that change?",
      },
      {
        label: "Remove the priest",
        prompt:
          "Rewrite it without any human beings — only the peacock and the stopped car. Does the dread remain?",
      },
    ],
  },
  {
    id: "shirley-jackson-lottery",
    categoryId: "tension-and-dread",
    tags: ["irony", "juxtaposition", "withholding"],
    title: "The Lottery",
    author: "Shirley Jackson",
    work: "The New Yorker (1948)",
    text: "The morning of June 27th was clear and sunny, with the fresh warmth of a full-summer day; the flowers were blossoming profusely and the grass was richly green. The people of the village began to gather in the square, between the post office and the bank, around ten o'clock.",
    context:
      "Jackson's horror is built entirely from cheerfulness. The weather, the flowers, the familiar village square — everything is deliberately ordinary. The reader knows something is wrong before anything happens. Dread from the absence of dread.",
    twists: [
      {
        label: "Make it ominous",
        prompt:
          "Rewrite it with the same scene, but with details that feel threatening. No explicit horror — just wrongness in the specific details.",
      },
      {
        label: "Change the gathering",
        prompt:
          "Rewrite it for a completely different kind of gathering — a school pickup, a farmers' market, a funeral. Keep the same surface cheerfulness.",
      },
      {
        label: "Remove the setting",
        prompt:
          "Rewrite only the people gathering. No weather, no flowers. Only human bodies collecting in a space. What does stripping the setting do?",
      },
    ],
  },
];
