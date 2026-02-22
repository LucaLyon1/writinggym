import { ElevenLabsClient } from "elevenlabs";
import { NextRequest, NextResponse } from "next/server";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text too long" }, { status: 400 });
  }

  try {
    const audioStream = await client.textToSpeech.convert(
      "JBFqnCBsd6RMkjVDRZzb", // George – warm, natural narrator
      {
        text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      }
    );

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
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
