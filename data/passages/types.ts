export type Category = {
  id: string;
  label: string;
  description: string;
};

export type Tag = {
  id: string;
  label: string;
};

export type Passage = {
  id: string;
  categoryId: string;
  tags: string[];
  title: string;
  author: string;
  work: string;
  text: string;
  context: string;
  twists: { label: string; prompt: string }[];
};
