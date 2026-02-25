import { ElevenLabsClient } from "elevenlabs";
import { NextRequest, NextResponse } from "next/server";
import { parseDialogue } from "@/lib/parse-dialogue";
import { createClient } from "@/lib/supabase/server";
import { getUserPlanDetails } from "@/lib/plan";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const NARRATOR_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // George – warm, natural narrator

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Sign in to use text-to-speech." },
      { status: 401 }
    );
  }

  const { text, categoryId, voiceId } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  // ── Custom voice requires Premium plan ────────────────────────
  if (voiceId && voiceId !== NARRATOR_VOICE) {
    const plan = await getUserPlanDetails(user.id);
    if (!plan.has_custom_voice) {
      return NextResponse.json(
        {
          error: "Custom voice is a Premium feature. Upgrade to unlock it.",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }
  }

  const isDialogue = categoryId === "dialogue";

  try {
    let audioBuffer: Buffer;

    if (isDialogue) {
      const turns = parseDialogue(text);
      if (turns && turns.length >= 2) {
        // Use ElevenLabs Text-to-Dialogue API (REST - SDK doesn't expose it)
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "ELEVENLABS_API_KEY not configured" },
            { status: 500 }
          );
        }

        const res = await fetch("https://api.elevenlabs.io/v1/text-to-dialogue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            inputs: turns.map((t) => ({
              text: t.text,
              voice_id: t.voiceId,
            })),
            output_format: "mp3_44100_128",
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          console.error("ElevenLabs dialogue API error:", res.status, errBody);
          throw new Error(
            `Dialogue generation failed: ${res.status} ${errBody.slice(0, 200)}`
          );
        }

        const arrayBuffer = await res.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      } else {
        audioBuffer = await convertWithTTS(text, voiceId);
      }
    } else {
      audioBuffer = await convertWithTTS(text, voiceId);
    }

    return new NextResponse(audioBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: unknown) {
    console.error("ElevenLabs TTS error:", err);
    const message =
      err instanceof Error ? err.message : "Text-to-speech failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function convertWithTTS(text: string, voice?: string): Promise<Buffer> {
  const audioStream = await client.textToSpeech.convert(voice || NARRATOR_VOICE, {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
