import { Passage } from "./types";

export const characterIntroPassages: Passage[] = [
  {
    id: "tolstoy-anna",
    categoryId: "character-intro",
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    work: "Anna Karenina (1878)",
    text: "She was not pretty, but she had a way of holding herself that made people look at her. Her dress was of the simplest kind, and yet, coming into a crowded room, she seemed to bring her own light with her.",
    context:
      "Tolstoy introduces Anna not through inventory — not eyes, hair, figure — but through effect. We learn what she does to a room before we know what she looks like. Presence before appearance.",
    twists: [
      {
        label: "Flip the method",
        prompt:
          "Describe a character using only physical details — height, hair, clothes, hands. No effect on others, no aura. Can you still make them magnetic?",
      },
      {
        label: "Make them ordinary",
        prompt:
          "Rewrite it for someone who does not bring their own light — someone who disappears into a room. Same structure, opposite subject.",
      },
      {
        label: "Change the register",
        prompt:
          "Rewrite it as an overheard conversation between two people watching this person enter. Same impression, entirely different form.",
      },
    ],
  },
  {
    id: "dickens-pip",
    categoryId: "character-intro",
    title: "Great Expectations",
    author: "Charles Dickens",
    work: "Great Expectations (1861)",
    text: "My father's family name being Pirrip, and my christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip. So, I called myself Pip, and came to be called Pip.",
    context:
      "Dickens gives us autobiography as comedy. The name 'Pip' arrives as a kind of failure — a child's inability to say what he is. And yet the whole novel is about becoming someone. The self-naming is the whole book in miniature.",
    twists: [
      {
        label: "Make it dignified",
        prompt:
          "Rewrite a character's self-introduction with total gravity and self-possession. No self-deprecation, no humor. Pure authority.",
      },
      {
        label: "Write it in third person",
        prompt:
          "Take the same content — someone acquiring a nickname — but write it from outside, as an observer. How does the distance change the feeling?",
      },
      {
        label: "Fast-forward the stakes",
        prompt:
          "In the same short space, introduce a character and hint — without stating — that their name, or identity, will matter enormously later.",
      },
    ],
  },
  {
    id: "austen-darcy",
    categoryId: "character-intro",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    work: "Pride and Prejudice (1813)",
    text: "Mr. Bingley had not been of age two years, when he was tempted by an accidental recommendation to look at Netherfield Park, and fell in love with it at once. Between him and his friend there was a very material difference. Mr. Darcy soon drew the attention of the room by his fine, tall person, handsome features, noble mien; and the report which was in general circulation within five minutes after his entrance, of his having ten thousand a year.",
    context:
      "Austen introduces Darcy through the social machinery of gossip. By the time we meet him, the room has already formed an opinion. Austen trusts that mechanism — reputation as characterization.",
    twists: [
      {
        label: "Enter without reputation",
        prompt:
          "Introduce a character to a room where nobody knows anything about them. No rumors, no prior report. How do you establish them?",
      },
      {
        label: "Make the gossip wrong",
        prompt:
          "Rewrite it so the 'report in circulation' is clearly, subtly mistaken — and the reader can sense it, even if the room cannot.",
      },
      {
        label: "Strip the money",
        prompt:
          "Rewrite this introduction without any mention of wealth or social standing. What's left?",
      },
    ],
  },
  {
    id: "mccarthy-judge",
    categoryId: "character-intro",
    title: "Blood Meridian",
    author: "Cormac McCarthy",
    work: "Blood Meridian (1985)",
    text: "Whatever his antecedents he was something wholly other than their sum, nor was there system by which to divide him back into his origins for he would not go. Whoever makes a shelter of reeds and hides has joined his fortune to others and so must abide their counsel and share their lot and not in this world shall he be diminished.",
    context:
      "McCarthy's Judge Holden arrives as an impossibility — a man who cannot be explained by his past. The introduction refuses biography entirely. He is introduced as a principle, not a person.",
    twists: [
      {
        label: "Give them a past",
        prompt:
          "Take someone unknowable and give them an extremely specific, mundane origin — a town, a school, a job. Does specificity make them more or less frightening?",
      },
      {
        label: "Make it intimate",
        prompt:
          "Rewrite the introduction of an overwhelming, almost mythic character — but from the perspective of someone who knew them as a child.",
      },
      {
        label: "Compress it to one sentence",
        prompt:
          "Introduce a character who contains a contradiction — violent and gentle, brilliant and stupid — in a single sentence. No explaining.",
      },
    ],
  },
];
