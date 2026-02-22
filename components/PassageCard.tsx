"use client";

import { Passage } from "@/data/passages";

type Props = {
  passage: Passage;
};

export function PassageCard({ passage }: Props) {
  return (
    <div className="passage-card">
      <div className="passage-meta">
        <span className="passage-author">{passage.author}</span>
        <span className="passage-separator">·</span>
        <span className="passage-work">{passage.work}</span>
      </div>
      <h2 className="passage-title">{passage.title}</h2>
      <blockquote className="passage-text">{passage.text}</blockquote>
      <p className="passage-context">{passage.context}</p>
    </div>
  );
}
