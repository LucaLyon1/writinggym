export type { Category, Passage, Tag } from "./types";
export { categories, tags } from "./categories";

import { characterIntroPassages } from "./character-intro";
import { inMediasResPassages } from "./in-medias-res";
import { placeAndAtmospherePassages } from "./place-and-atmosphere";
import { dialoguePassages } from "./dialogue";
import { interiorityPassages } from "./interiority";
import { timeAndMemoryPassages } from "./time-and-memory";
import { rhythmAndStylePassages } from "./rhythm-and-style";
import { tensionAndDreadPassages } from "./tension-and-dread";
import { poetryPassages } from "./poetry";

import { Passage } from "./types";

export const passages: Passage[] = [
  ...characterIntroPassages,
  ...inMediasResPassages,
  ...placeAndAtmospherePassages,
  ...dialoguePassages,
  ...interiorityPassages,
  ...timeAndMemoryPassages,
  ...rhythmAndStylePassages,
  ...tensionAndDreadPassages,
  ...poetryPassages,
];
