"use client";

import { useState, useCallback, useRef } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const speak = useCallback(async (text: string, categoryId?: string) => {
    stop();

    setLoading(true);
    setSpeaking(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, categoryId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `TTS request failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setLoading(false);
        setSpeaking(true);
      };
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setSpeaking(false);
        setLoading(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Speech error:", err);
      }
      setLoading(false);
      setSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setSpeaking(false);
    setLoading(false);
  }, []);

  return { speak, stop, speaking, loading };
}
