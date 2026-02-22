"use client";

import { useState, useMemo } from "react";
import { Passage, categories } from "@/data/passages";
import { PassageBrowser } from "@/components/PassageBrowser";
import { PassageCard } from "@/components/PassageCard";
import { WritingEditor } from "@/components/WritingEditor";
import { TwistSelector } from "@/components/TwistSelector";
import { PlaybackPanel } from "@/components/PlaybackPanel";

function countWords(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function WritingGym() {
  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [plainText, setPlainText] = useState("");
  const [twistText, setTwistText] = useState("");
  const [twistIndex, setTwistIndex] = useState(0);
  const [phase, setPhase] = useState<"plain" | "twist" | "listen">("plain");

  function handleSelect(passage: Passage) {
    setSelectedPassage(passage);
    setPlainText("");
    setTwistText("");
    setTwistIndex(0);
    setPhase("plain");
  }

  function handleBack() {
    setSelectedPassage(null);
  }

  function handleTwistSelect(i: number) {
    setTwistIndex(i);
    setTwistText("");
  }

  const plainWords = useMemo(() => countWords(plainText), [plainText]);
  const twistWords = useMemo(() => countWords(twistText), [twistText]);

  const canAdvanceToTwist = plainText.trim().length > 20;
  const canAdvanceToListen = twistText.trim().length > 20;

  // ── Browser screen ────────────────────────────────────────────
  if (!selectedPassage) {
    return <PassageBrowser onSelect={handleSelect} />;
  }

  // ── Gym loop screen ───────────────────────────────────────────
  const currentTwist = selectedPassage.twists[twistIndex];
  const category = categories.find((c) => c.id === selectedPassage.categoryId);

  return (
    <div className="gym-root">
      <header className="gym-header">
        <div className="gym-header-left">
          <button className="back-btn" onClick={handleBack}>
            ← All passages
          </button>
          {category && (
            <span className="gym-category-badge">{category.label}</span>
          )}
        </div>
        <div className="gym-logo">
          <span className="gym-logo-mark">✦</span>
          <span className="gym-logo-text">The Writing Gym</span>
        </div>
      </header>

      <main className="gym-main">
        {/* Left: passage */}
        <aside className="gym-aside">
          <PassageCard passage={selectedPassage} />

          <div className="phase-progress">
            <button
              className={`phase-step ${phase === "plain" ? "current" : phase === "twist" || phase === "listen" ? "done" : ""}`}
              onClick={() => setPhase("plain")}
            >
              01 Plain
            </button>
            <div className="phase-line" />
            <button
              className={`phase-step ${phase === "twist" ? "current" : phase === "listen" ? "done" : ""} ${!canAdvanceToTwist ? "locked" : ""}`}
              onClick={() => canAdvanceToTwist && setPhase("twist")}
            >
              02 Twist
            </button>
            <div className="phase-line" />
            <button
              className={`phase-step ${phase === "listen" ? "current" : ""} ${!canAdvanceToListen ? "locked" : ""}`}
              onClick={() =>
                canAdvanceToTwist && canAdvanceToListen && setPhase("listen")
              }
            >
              03 Hear It
            </button>
          </div>
        </aside>

        {/* Right: writing area */}
        <section className="gym-workspace">
          {phase === "plain" && (
            <div className="workspace-content">
              <WritingEditor
                phase="plain"
                value={plainText}
                onChange={setPlainText}
                wordCount={plainWords}
              />
              <div className="workspace-actions">
                <button
                  className="btn-primary"
                  disabled={!canAdvanceToTwist}
                  onClick={() => setPhase("twist")}
                >
                  Next: Add a twist →
                </button>
              </div>
            </div>
          )}

          {phase === "twist" && (
            <div className="workspace-content">
              <TwistSelector
                passage={selectedPassage}
                selectedIndex={twistIndex}
                onSelect={handleTwistSelect}
              />
              <WritingEditor
                phase="twist"
                twistPrompt={currentTwist.prompt}
                twistLabel={currentTwist.label}
                value={twistText}
                onChange={setTwistText}
                wordCount={twistWords}
              />
              <div className="workspace-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPhase("plain")}
                >
                  ← Back
                </button>
                <button
                  className="btn-primary"
                  disabled={!canAdvanceToListen}
                  onClick={() => setPhase("listen")}
                >
                  Next: Hear it →
                </button>
              </div>
            </div>
          )}

          {phase === "listen" && (
            <div className="workspace-content">
              <div className="comparison-block">
                <div className="comparison-item">
                  <div className="comparison-label">Your plain version</div>
                  <div className="comparison-text">{plainText}</div>
                </div>
                <div className="comparison-item">
                  <div className="comparison-label">
                    Your twist — {currentTwist.label}
                  </div>
                  <div className="comparison-text">{twistText}</div>
                </div>
              </div>

              <PlaybackPanel plainText={plainText} twistText={twistText} />

              <div className="workspace-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setPhase("twist")}
                >
                  ← Back
                </button>
                <button className="btn-secondary" onClick={handleBack}>
                  Choose another passage
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}