"use client";

import { useSpeech } from "@/hooks/useSpeech";

type Props = {
  plainText: string;
  twistText: string;
};

export function PlaybackPanel({ plainText, twistText }: Props) {
  const { speak, stop, speaking, loading } = useSpeech();
  const busy = speaking || loading;

  return (
    <div className="playback-panel">
      <div className="playback-header">
        <span className="phase-num">03</span>
        <span className="phase-name">Hear It</span>
      </div>
      <p className="playback-desc">
        Listen to what you wrote. Your ear catches things your eye misses.
      </p>

      <div className="playback-buttons">
        <button
          className="play-btn"
          disabled={!plainText.trim() || busy}
          onClick={() => speak(plainText)}
        >
          <PlayIcon />
          Plain version
        </button>

        <button
          className="play-btn"
          disabled={!twistText.trim() || busy}
          onClick={() => speak(twistText)}
        >
          <PlayIcon />
          Twist version
        </button>

        {busy && (
          <button className="stop-btn" onClick={stop}>
            <StopIcon />
            Stop
          </button>
        )}
      </div>

      {loading && (
        <div className="speaking-indicator loading">
          <span className="loading-text">Generating audio…</span>
        </div>
      )}

      {speaking && (
        <div className="speaking-indicator">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <polygon points="2,1 13,7 2,13" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect x="1" y="1" width="10" height="10" />
    </svg>
  );
}
