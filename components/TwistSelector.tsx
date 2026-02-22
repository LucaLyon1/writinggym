"use client";

import { Passage } from "@/data/passages";

type Props = {
  passage: Passage;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function TwistSelector({ passage, selectedIndex, onSelect }: Props) {
  return (
    <div className="twist-selector">
      <p className="twist-selector-label">Choose your constraint</p>
      <div className="twist-options">
        {passage.twists.map((twist, i) => (
          <button
            key={i}
            className={`twist-option ${selectedIndex === i ? "active" : ""}`}
            onClick={() => onSelect(i)}
          >
            <span className="twist-option-label">{twist.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
