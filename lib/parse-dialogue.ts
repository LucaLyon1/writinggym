/**
 * Parses dialogue text into speaker turns for the ElevenLabs dialogue API.
 * Handles stage format (SPEAKER: text), narrative format ('text,' she said), and fallback.
 */

const VOICE_MALE = "JBFqnCBsd6RMkjVDRZzb"; // George
const VOICE_MALE_2 = "pNInz6obpgDQGcFmaJgB"; // Adam – for two-male dialogues
const VOICE_FEMALE = "21m00Tcm4TlvDq8ikWAM"; // Rachel

export interface DialogueTurn {
  text: string;
  voiceId: string;
}

/** Map speaker names/pronouns to voice */
function speakerToVoice(speaker: string): string {
  const s = speaker.toLowerCase();
  // Female speakers
  if (
    /^(she|woman|her|female|emma|anne|martha|masha|miss|narrator)$/.test(s) ||
    s.startsWith("miss ") ||
    s.includes("woman")
  ) {
    return VOICE_FEMALE;
  }
  // Second male for two-male dialogues (Chigurh/Owner, Ivan/Alyosha)
  if (/^(owner|alyosha)$/.test(s)) {
    return VOICE_MALE_2;
  }
  return VOICE_MALE;
}

/**
 * Parse dialogue into turns with voice assignments.
 * Returns null if the text doesn't look like multi-speaker dialogue.
 */
export function parseDialogue(text: string): DialogueTurn[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const turns: DialogueTurn[] = [];

  // Stage format: "SPEAKER: text"
  const stageRegex = /^([A-Z][A-Za-z]+):\s*(.+)$/;

  // Narrative: "'text,' she said" or "'text,' the man said" or "He said: 'text'"
  const narrativeSaidRegex =
    /^'([^']*(?:''[^']*)*)'\s*[,.]?\s*(?:the\s+)?(man|woman|he|she|boy|girl)\s+(?:said|replied|answered|cried|whispered|murmured)/i;
  const narrativeSaidFirstRegex =
    /^(?:the\s+)?(man|woman|he|she)\s+(?:said|replied|answered|cried)\s*[,:]?\s*'([^']*(?:''[^']*)*)'/i;

  // Quoted line only: "'text'" - no attribution, alternate
  const quotedOnlyRegex = /^'([^']*(?:''[^']*)*)'\s*\.?$/;

  let lastVoice = VOICE_MALE;
  let hasDialogueStructure = false;

  for (const line of lines) {
    // Stage format
    const stageMatch = line.match(stageRegex);
    if (stageMatch) {
      const [, speaker, dialogue] = stageMatch;
      const voiceId = speakerToVoice(speaker);
      turns.push({ text: dialogue.trim(), voiceId });
      lastVoice = voiceId;
      hasDialogueStructure = true;
      continue;
    }

    // "'text,' she said" or "'text,' she said. 'more text'" format
    const narrativeMatch = line.match(narrativeSaidRegex);
    if (narrativeMatch) {
      const [, dialogue, speaker] = narrativeMatch;
      const voiceId = speakerToVoice(speaker);
      let fullDialogue = dialogue.replace(/''/g, "'").trim();
      const trailingQuote = line.match(/said\.\s*'([^']*(?:''[^']*)*)'/);
      if (trailingQuote) {
        fullDialogue += " " + trailingQuote[1].replace(/''/g, "'").trim();
      }
      turns.push({ text: fullDialogue, voiceId });
      lastVoice = voiceId;
      hasDialogueStructure = true;
      continue;
    }

    // "He said: 'text'" format
    const saidFirstMatch = line.match(narrativeSaidFirstRegex);
    if (saidFirstMatch) {
      const [, speaker, dialogue] = saidFirstMatch;
      const voiceId = speakerToVoice(speaker);
      turns.push({ text: dialogue.replace(/''/g, "'").trim(), voiceId });
      lastVoice = voiceId;
      hasDialogueStructure = true;
      continue;
    }

    // "'text'" only - alternate with previous speaker
    const quotedMatch = line.match(quotedOnlyRegex);
    if (quotedMatch) {
      const dialogue = quotedMatch[1].replace(/''/g, "'").trim();
      if (dialogue) {
        const voiceId =
          lastVoice === VOICE_MALE ? VOICE_FEMALE : VOICE_MALE;
        turns.push({ text: dialogue, voiceId });
        lastVoice = voiceId;
        hasDialogueStructure = true;
      }
      continue;
    }

    // Mixed line: "'dialogue,' the man/woman did X" - extract quoted part
    const mixedMatch = line.match(/^'([^']*(?:''[^']*)*)'\s*[,.]?\s*(.+)$/);
    if (mixedMatch) {
      const [, dialogue, rest] = mixedMatch;
      const speakerMatch = rest.match(
        /(?:the\s+)?(man|woman|he|she)\s+\w+/i
      );
      const voiceId = speakerMatch
        ? speakerToVoice(speakerMatch[1])
        : lastVoice === VOICE_MALE
          ? VOICE_FEMALE
          : VOICE_MALE;
      if (dialogue.trim()) {
        turns.push({ text: dialogue.replace(/''/g, "'").trim(), voiceId });
        lastVoice = voiceId;
        hasDialogueStructure = true;
      }
      continue;
    }

    // Plain line - treat as narration or single speaker, use alternating
    if (line.length > 0) {
      const voiceId =
        lastVoice === VOICE_MALE ? VOICE_FEMALE : VOICE_MALE;
      turns.push({ text: line, voiceId });
      lastVoice = voiceId;
    }
  }

  return hasDialogueStructure && turns.length >= 2 ? turns : null;
}
