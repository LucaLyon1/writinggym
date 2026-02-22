# The Writing Gym — Setup

## Files to copy into your Next.js project

```
app/
  layout.tsx          → replace or merge with your existing layout
  globals.css         → replace or merge with your existing globals
  page.tsx            → your home route

data/
  passages.ts         → 8 curated passages with twist prompts

hooks/
  useSpeech.ts        → Web Speech API hook (TTS)

components/
  WritingGym.tsx      → main stateful component (the loop)
  PassageCard.tsx     → displays the passage + context
  WritingEditor.tsx   → textarea with phase header + word count
  TwistSelector.tsx   → pill buttons for choosing constraint
  PlaybackPanel.tsx   → TTS controls
```

## Notes

- No extra dependencies needed — uses only React + Next.js + browser Web Speech API.
- TTS works in Chrome, Edge, Safari. Firefox support is partial.
- Passages start at index 0. "New passage" picks randomly from the rest.
- The `@/` alias assumes your tsconfig has `paths: { "@/*": ["./*"] }`.
  If not, replace `@/` with relative paths.

## Quick path alias check

In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## What's built

Three-phase writing loop:
1. **Plain rewrite** — strip the passage to its meaning, no style
2. **Twist** — apply a constraint (3 choices per passage)
3. **Hear it** — browser reads your text aloud, side-by-side comparison

8 passages from: Carver, Didion, Baldwin, Le Guin, Chekhov, Woolf, Nabokov, Morrison.
Each has 3 hand-authored twist prompts.
