# Drills: writing scales ("faire ses gammes")

Research notes and rough plan for the `/drills` page.

## 1. Research

### Is the idea new?

The *literal* framing (technique drilled like a scale, independent of content, judged only on execution) is rare. The ingredients are old:

| Source | What it did | What it lacks vs. scales |
|---|---|---|
| Progymnasmata (Greek/Roman schools) | Graded sequence of composition exercises (fable, description, praise…) | Content-driven; no isolated technique, no fast feedback |
| Erasmus, *De Copia* (1512) | Rewrote one sentence ~150 ways to train variety of expression | Same content, many forms: close to scales, but no measurement |
| Benjamin Franklin, *Autobiography* | Summarised *Spectator* essays into hints, rebuilt them, compared with the original; turned prose into verse and back; shuffled notes to learn ordering | Self-assessed; slow feedback loop |
| Raymond Queneau, *Exercices de style* (1947) | One trivial anecdote told 99 ways | A demonstration, not a training system |
| Francis Christensen, *Generative Rhetoric of the Sentence* (1963) | Drills on the cumulative sentence using model sentences | One family of structures only |
| Ursula K. Le Guin, *Steering the Craft* | Exercises: no punctuation, "Short and Long", "Chastity" (no adjectives/adverbs) | Ten exercises, no repetition loop |
| Virginia Tufte, *Artful Sentences*; Stanley Fish, *How to Write a Sentence* | Catalogues of sentence forms to imitate | Reference books, no practice loop |

**Conclusion:** the novelty is not the exercises. It is the *system*: technique × subject as orthogonal axes, short repetitions, immediate objective feedback, and a judge that ignores content. That is exactly what separates a pianist's scales from "playing songs".

### What the evidence says

- **Deliberate practice applies to writing.** Kellogg & Whiteford (2009) argue advanced writing skill stalls from lack of focused, repeated, feedback-rich practice, and that working-memory load is the bottleneck. Automating low-level skills frees working memory for higher-level decisions. This is the scientific version of "faire ses gammes".
- **Production beats labels.** Graham & Perin's meta-analysis (2007, grades 4–12) found sentence-combining instruction improves writing quality (effect size 0.50), while traditional grammar instruction has a *negative* effect (−0.32). Implication: drills must make people *build* sentences. Naming the figure ("ternary") is secondary.
- **Model-based sentence drills work.** Studies of Christensen's method report gains in writing quality and in syntactic complexity.

### First principles: what makes a scale a scale

1. **Isolates one technique.** A C-major scale trains finger passage, not interpretation.
2. **Content-neutral.** Nobody asks whether a scale is "interesting".
3. **Short and repeatable.** Dozens of repetitions per session.
4. **Objectively checkable.** Evenness, tempo, pitch: a teacher or metronome says right or wrong now.
5. **Played in every key.** The same pattern in all keys makes it independent of context.
6. **Progressive.** Tempo and difficulty increase; the goal is automaticity, then transfer to repertoire.

Mapped to prose:

| Music | Prose drill |
|---|---|
| Scale type (major, chromatic, arpeggio) | Technique (ternary, cumulative, staccato…) |
| Key (C, F#, B♭…) | Subject (character, action, feeling, setting, object, plain statement) |
| Rhythm / tempo | Sentence length and length variation |
| Phrasing, cadence | Cadence majeure (rising) / mineure (falling), where the sentence ends |
| Articulation (legato, staccato) | Punctuation as breath: comma, semicolon, colon, dash, full stop |
| Tone production | Voice: active vs passive, verb strength |
| Clean technique, no wasted motion | Economy: no filler, stacked modifiers, redundancy |
| Metronome / tuner | Deterministic live metrics |
| Teacher | AI judge restricted to fundamentals |

### The fundamentals we score

Prose is a linear sequence heard with an inner voice. Everything that is *not* content reduces to five dimensions:

1. **Rhythm.** Sentence length, variation, cadence, clausule (the ending).
2. **Structure.** The shape of the sentence and figures of construction: binary, ternary, accumulation, gradation, cumulative (loose), periodic, parallelism, anaphora, antithesis.
3. **Voice.** Active vs passive, verb precision, reliance on "to be", adverbs, nominalisations.
4. **Articulation.** Punctuation chosen for pause length and logic; no splices or run-ons.
5. **Economy.** Every word earns its place.

Sound (alliteration, assonance, stress patterns) is a sixth candidate. It is left out for now because it is hard to judge reliably and less fundamental for prose.

### What can be measured without AI

| Measurable deterministically | Needs the judge |
|---|---|
| Sentence count and lengths, variation | Is it really ternary, gradation, antithesis? |
| Passive voice (heuristic) | Is the third element the strongest? |
| -ly adverbs, "to be" count | Cumulative vs periodic shape |
| Punctuation counts | Is a semicolon correctly used? |
| Repeated sentence openers | Adjectives (needs part-of-speech tagging) |

The page uses both: the tuner updates live (the metronome), the judge scores on submit (the teacher).

### Risks

- **Goodhart's law.** Writers may learn to satisfy metrics. Mitigation: the judge scores execution and quality of the technique, not the counts.
- **Mechanical prose.** Scales are not music. The plan includes transfer drills that combine techniques.
- **Heuristics are English-only** and imperfect (passive detection especially). They are labelled "possible".
- **Judge consistency.** LLM scores drift. Needs a calibration set (see plan).

## 2. Decisions (2026-09-26)

- **English only** for now.
- **No grades.** Writers chase "the right move", like chess.com puzzles, not a score.
- **Instant visual feedback on the sentence** is the core of the experience.
- **Free** for every user (exempt from the free-user gate).
- **Suggested path**, but writers can pick any scale freely.

## 3. What is built

The page is a puzzle game. A puzzle is one scale in one subject, made of 1–5 moves. **One move is one sentence**, each with its own goal ("A group of three. Make the third the heaviest.").

**Feedback loop, fastest first:**
1. **While typing** (0 ms): rule chips turn green or red, e.g. "One sentence", "≤ 8 words · 6", "Starts with 'She'", "No passive". Logic: `lib/drill-moves.ts`.
2. **On play, rule broken** (0 ms): the move is marked **? Mistake** instantly, the offending words are underlined, and a "bonk" plays. No AI call.
3. **On play, rules met** (~1.5 s): the sentence lands on the board with a "tock" and a pending badge. The coach's verdict streams in and the badge pops as soon as the quality arrives, with its sound: **!! Brilliant, ! Great, ✓ Good, ?! Inaccuracy, ? Mistake, ?? Blunder**. Colors follow chess.com's annotation palette.
4. **~2 s later**: the headline, comment, and green/red highlights on the exact words that worked or broke the technique.

**Flow:** a weak move offers *Retry* (text comes back to edit), *Show a stronger move*, or *Keep it*. A puzzle solved with every move ✓ or better is **clean**: it earns a star for that subject and grows the 🔥 streak. Keeping a flawed move completes the puzzle without a star and resets the streak. A scale is "automatic" at 3 stars (3 subjects), the "every key" rule; *Next puzzle* keeps you on the scale until then, then follows the path.

**Pieces:**
- `lib/drills.ts`: the core scales (43 in all with `lib/drills-albalat.ts`), their moves and instant rules, 6 subjects, the hand-ordered path and star logic.
- `lib/drill-moves.ts`: rule checks, move qualities, judgement parsing, highlight segmentation, partial-stream reading.
- `app/api/drills/route.ts`: judges one move with Claude Sonnet 4.6, structured JSON output, streamed.
- `components/drills/sounds.ts`: synthesized Web Audio sounds, mute toggle.
- `components/drills/progress.ts`: stars and streak in the browser.

## 3b. Scales from Albalat, *L'Art d'écrire* (added 2026-09-28)

Albalat's twenty lessons cover style, harmony and concision, invention, narration, description, observation, images and dialogue, with originality (the "hatred of banality") running through all of them. Exercise sentences are original English.

**Quotes (updated 2026-09-28).** Every scale's model is a real quote where one demonstrates the technique, shown with its author and work. Each was checked word for word against a primary text: Project Gutenberg editions (Dickens, Austen, Melville, Fitzgerald, Poe, London, Shakespeare, the King James Bible, Strunk), the National Archives transcript of the Declaration, the Bliss copy of the Gettysburg Address, the International Churchill Society, the Orwell Foundation, the Wikisource scan of *A Farewell to Arms*, and Twain's sourced letter to George Bainton (1888). Some scales keep our own contrast example because no real quote shows the point as clearly: Echoes, One-word swaps, The ear, Scene or summary, Point of view, Modifiers in place, Old then new.

Albalat's own words appear verbatim in French, with an English translation and the lesson number, checked against the 1899 text on archive.org. Point of view has none: Albalat does not treat it, so it is our own extension of his lesson on narration.

**New formats.** Recognition is checked instantly in the browser; production is judged by the coach. Each lesson ends with a production step, because writing beats labelling.

| Format | What the writer does | Judged by |
|---|---|---|
| Choose | Picks the best of 3–4 versions; a wrong pick greys out with its reason | Browser |
| Spot | Taps the faulty words: repetition, cliché, dead adjective, mixed image, point-of-view slip | Browser |
| Rebuild | Orders tiles so the sentence ends on its strongest words | Browser |
| Cut | Strikes out superfluous words and watches the sentence rebuild live; some words are optional cuts | Browser |
| Rewrite | Transforms a given sentence, with instant rules (word limit, no repeats, no cliché, no filler, no jingle) | Rules, then coach |
| Write | Free sentence on a subject | Rules, then coach |

**Mapping.**

| Albalat theme | Scale | Format |
|---|---|---|
| Originality: the exact word | The exact adjective | Lessons |
| Originality: hatred of banality | Kill the cliché | Lessons |
| Crafting your own expressions | Coin your own expression | Write |
| Concision | Concision | Lessons |
| Repetitions | Echoes | Lessons |
| Harmony: order | Word order | Lessons |
| Harmony: sound | The ear | Lessons |
| Images, coherent and close to the subject | One image, held · The sustained image | Lessons · Write |
| Observation | Observation | Write |
| Description | The telling trait | Write |
| Choice of narration | Scene or summary · Point of view | Write · Lessons |
| Dialogue | Dialogue | Write |

**Concision and repetition (added 2026-10-01).** Three more scales, each with three lessons: *Cut the padding* (fillers, redundant pairs, empty openings), *One-word swaps* (wordy phrases and weak verb + noun pairs such as “make a decision”), and *Echoes* (repeated subjects, same-root echoes, deliberate versus careless repetition).

**Voice and punctuation as lessons (added 2026-10-01).** Active voice, Strong verbs, Nouns and verbs only, The semicolon, The colon reveal and The dash now play as three lessons each (choose, spot, cut, rebuild, then a rewrite judged by the coach), because each has clear right and wrong answers. Rhythm and figure scales (ternary, cadence, anaphora…) stay as free writing on a subject: their point is production.

**No giveaways.** Spot and cut steps show one tile per word, so a target phrase never stands out as the longest tile; a phrase counts as found once its meaningful words are tapped (small words like “the” are optional). Point-of-view spots use whole sentences as tiles. Multiple-choice options are kept close in length: a test fails if the right answer is the longest or the shortest option in more than 10% of questions. Cliché spots now hide fresh images among the stock phrases as decoys.

**Explaining wrong answers.** Every wrong move teaches something:
- Choose: why the picked option fails, plus what to look for.
- Spot and Cut: which tapped words were needed and why, how many targets remain, and the player's own resulting sentence.
- Rebuild: where the sentence ends and where the weight should fall.
- Broken instant rule: the principle behind the rule and how to repair it.
- Coach: a two-to-three sentence lesson on the fix for every inaccuracy, mistake or blunder.
- "Show answer" gives the answer with its reasoning.

Lesson scales have three fixed lessons; each lesson solved cleanly earns one star, like a subject for writing scales. A correct answer on the first try is "! Great", after a retry "✓ Good". "Show answer" completes the step without a star.

## 3c. Audit (2026-10-02)

A review of the whole catalog as a writing teacher: which skills, at which level, taught through which format.

**Errors fixed.**
- Two models contradicted their own scale. Lincoln's “of the people, by the people, for the people” (Rising cadence) has three parts of equal length; it is now the opening of the Second Inaugural, whose parts grow. Hemingway's sentence (Polysyndeton) had two “and”s against a rule of three; it is now Genesis 22:3. A test checks the polysyndeton model against its own rule.
- “Cold rose from the tiles”: cold does not rise. Now “seeped up”.
- An imagery rewrite asked writers to keep “time is a thief”, a cliché. A fix in No repetition dropped “said” from the sentence (the scale is now merged into Echoes). A spot target included the animal word (“purred”) that belongs to the image being kept.
- The spot feedback said “small words are never the answer” on steps where “was” is the answer.
- Falling cadence opened with “a plain sentence to set the scene”, a move that trains nothing.

**Taxonomy.**
- Overlap removed: No repetition duplicated Echoes; Concision repeated exercises from Cut the padding. No repetition is merged into Echoes, and Concision is now a Level 2 review that mixes padding, wordy phrases and echoes in the same sentence, the way they turn up in real drafts.
- Gaps filled, all with clear right answers or a clear target: **Parallel parts**, **The comma** (openings, lists, restrictive versus non-restrictive asides, splices), **Show the feeling**, **Modifiers in place** (dangling and misplaced), **Old, then new** (linking sentences: what the reader knows first, what is new last; Joseph Williams' rule), and **Chiasmus** at Mastery.
- A new instant rule, “No named emotion”, serves Show the feeling and the first Dialogue move.

**Levels.** Before: 14 / 20 / 4, with Mastery nearly empty. Now 15 / 19 / 9. Strong verbs → Foundations; Staccato → Control; One long breath, Scene or summary, Dialogue, Coin your own expression → Mastery (subtext and a fresh coinage are the hardest things here); Point of view → Control (its steps are recognition).

**Path.** The order is now written by hand instead of sorted by family, which put four concision scales in a row. Lessons with clear answers alternate with free writing, and prerequisites come first: parallel parts before ternary rhythm, active voice before strong verbs, the atomic concision scales before the review.

**Formats.**
- Gradation and the Periodic sentence are now lessons: rebuilding tiles in order is the best way to feel a rising series or a held-back main clause, and each lesson ends with a write step on its own subject, so the three stars still mean three keys.
- Multiple-choice questions that only tested definitions (“What should come after a colon?”, “Which narrator suits a mystery?”) now ask the writer to apply the rule.
- Punctuation questions whose wrong options were nonsense (“I—opened the door”) now offer plausible alternatives (a comma, a semicolon, a colon), so choosing takes judgement.
- The Ear only taught what to avoid; it now has one step on sound that serves the meaning.
- Free-writing first moves give a frame where the figure is new (“A base of five words or so, then two or more details…”).
- Subject limits: Dialogue, Scene or summary, The telling trait and Observation draw only from subjects they fit (no dialogue about “how to make a cup of tea”).

**Still open.**
- Nouns and verbs only cannot check adjectives instantly until there is part-of-speech tagging.
- The Dickens colon model (“Marley was dead: to begin with.”) is famous but a weak model of a reveal; no better verified quote was found.
- Free-writing scales would still gain from a one-step warm-up (recognise the figure, then write it), which needs subject puzzles to accept quiz steps.

## 4. Rough plan and requirements

### Next: make it stick
- **Persist progress** in Supabase (`drill_moves`, `drill_puzzles`), replacing browser storage. Needed for cross-device streaks.
- ~~**Daily puzzle** and daily streak~~ Built (2026-10-04): `lib/drills-daily.ts`. Every scale in every key goes into one pool, shuffled once with a fixed seed; each calendar day takes the next entry, so the puzzle is the same for everyone, nothing repeats until the pool is exhausted, and no scale comes two days running. Finishing it (clean or not) counts for the day and grows a 📅 day streak, kept in the browser with the rest of the progress.
- **Rate limit** `/api/drills` per user per day, since drills are free.
- **Puzzle Rush mode**: as many clean moves as possible in 3 minutes on one scale. Trains automaticity directly.

### Then: more drill formats
- **Imitation** (Franklin/Christensen): given a model sentence, write a new one with the same structure on another subject.
- **Sentence combining**: given 4–6 kernel sentences, combine them into one move with a target structure. Strongest evidence base.
- **Transformation** (Erasmus/Queneau): same content rewritten in a different technique.
- **Combined scales**: two techniques in one move (ternary + falling cadence).

### More Albalat
- **Imitation through reading** (his lesson on reading and assimilation): read a short passage, then write a sentence on another subject with the same structure.
- **The work of style** (his later book on manuscript corrections): show a famous author's draft sentence and ask which revision they chose.
- **More lessons per scale**, so the three stars can come from a rotating pool.

### Quality of judging
- **Calibration set**: 30–50 hand-labelled moves per quality. Run after every prompt change and track agreement. Today "brilliant" is still given a little too easily.
- **Latency**: the verdict arrives in about 1.5 s on Sonnet 4.6. A smaller model could make it sub-second; test it against the calibration set first.
- **Better tagging**: part-of-speech tagging for adjectives, so "Nouns and verbs only" can be checked instantly too.

### Open questions
1. ~~Should the daily puzzle be the same for everyone?~~ Yes: it is picked from the date, so writers can compare moves once there is a community view.
2. Is "Keep it" useful, or should a puzzle only end when every move is clean?

## Sources
- Kellogg & Whiteford (2009), *Training Advanced Writing Skills: The Case for Deliberate Practice*: https://eric.ed.gov/?id=EJ865119
- Graham & Perin (2007), *A Meta-Analysis of Writing Instruction for Adolescent Students*: https://eric.ed.gov/?id=EJ772018
- *Writing Next* summary: https://www.adlit.org/topics/writing/summary-writing-next
- Christensen's generative rhetoric, study of effects: https://eric.ed.gov/?id=ED491490
- Franklin's method, *Autobiography*: https://www.ushistory.org/franklin/autobiography/page06.htm
- Le Guin, *Steering the Craft*: https://www.ursulakleguin.com/steering-the-craft
- Binary, ternary, accumulative rhythm: https://www.etudes-litteraires.com/fiches-methode/rythmes-phrase
- Cadence majeure / mineure: http://www.ac-grenoble.fr/disciplines/lettres/podcast/logotype/glossaire/Cadence.htm
