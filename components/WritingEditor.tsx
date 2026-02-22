"use client";

type Props = {
  phase: "plain" | "twist";
  twistPrompt?: string;
  twistLabel?: string;
  value: string;
  onChange: (val: string) => void;
  wordCount: number;
};

export function WritingEditor({
  phase,
  twistPrompt,
  twistLabel,
  value,
  onChange,
  wordCount,
}: Props) {
  const isPlain = phase === "plain";

  return (
    <div className="editor-wrap">
      <div className="editor-header">
        <div className="editor-phase-label">
          {isPlain ? (
            <>
              <span className="phase-num">01</span>
              <span className="phase-name">Plain Rewrite</span>
            </>
          ) : (
            <>
              <span className="phase-num">02</span>
              <span className="phase-name">
                Twist
                {twistLabel && (
                  <em className="twist-label-inline"> — {twistLabel}</em>
                )}
              </span>
            </>
          )}
        </div>
        <span className="word-count">{wordCount}w</span>
      </div>

      <div className="editor-prompt">
        {isPlain ? (
          <p>
            Say the same thing in plain, clear prose. No flourishes. Strip it
            to what it means.
          </p>
        ) : (
          twistPrompt && <p>{twistPrompt}</p>
        )}
      </div>

      <textarea
        className="editor-textarea"
        placeholder={
          isPlain
            ? "Write your plain version here…"
            : "Write your twist version here…"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        spellCheck={false}
      />
    </div>
  );
}
