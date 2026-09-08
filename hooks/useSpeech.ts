"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setSpeaking(false);
    setLoading(false);
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

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
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setLoading(false);
        setSpeaking(true);
      };
      audio.onended = () => {
        stop();
      };
      audio.onerror = () => {
        stop();
      };

      await audio.play();
    } catch (err) {
      // A replaced request must not reset the new request's playback state.
      if (controller.signal.aborted) return;
      if ((err as Error).name !== "AbortError") {
        console.error("Speech error:", err);
      }
      stop();
    }
  }, [stop]);

  return { speak, stop, speaking, loading };
}
