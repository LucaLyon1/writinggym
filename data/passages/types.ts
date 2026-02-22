export type Category = {
  id: string;
  label: string;
  description: string;
};

export type Passage = {
  id: string;
  categoryId: string;
  title: string;
  author: string;
  work: string;
  text: string;
  context: string;
  twists: { label: string; prompt: string }[];
};
