import { Category, Tag } from "./types";

export const categories: Category[] = [
  {
    id: "character-intro",
    label: "Character Introduction",
    description: "How writers bring a person into existence on the page",
  },
  {
    id: "in-medias-res",
    label: "In Medias Res",
    description:
      "Openings that drop you into the middle of something already moving",
  },
  {
    id: "place-and-atmosphere",
    label: "Place & Atmosphere",
    description: "When setting becomes as alive as any character",
  },
  {
    id: "dialogue",
    label: "Dialogue",
    description: "What people say, and what they mean by it",
  },
  {
    id: "interiority",
    label: "Interiority",
    description:
      "The texture of thought, memory, and feeling from the inside",
  },
  {
    id: "time-and-memory",
    label: "Time & Memory",
    description: "How writers handle the past pressing into the present",
  },
  {
    id: "rhythm-and-style",
    label: "Rhythm & Style",
    description: "Passages where the how is as important as the what",
  },
  {
    id: "tension-and-dread",
    label: "Tension & Dread",
    description:
      "The mechanics of unease — what is withheld, what is implied",
  },
];

export const tags: Tag[] = [
  { id: "opening", label: "Opening" },
  { id: "subtext", label: "Subtext" },
  { id: "withholding", label: "Withholding" },
  { id: "compression", label: "Compression" },
  { id: "repetition", label: "Repetition" },
  { id: "defamiliarization", label: "Defamiliarization" },
  { id: "power-dynamics", label: "Power Dynamics" },
  { id: "sensory-detail", label: "Sensory Detail" },
  { id: "juxtaposition", label: "Juxtaposition" },
  { id: "restraint", label: "Restraint" },
  { id: "stream-of-consciousness", label: "Stream of Consciousness" },
  { id: "irony", label: "Irony" },
  { id: "symbolism", label: "Symbolism" },
  { id: "first-person", label: "First Person" },
  { id: "minimalism", label: "Minimalism" },
];
