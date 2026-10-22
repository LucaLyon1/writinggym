/**
 * Scales derived from Antoine Albalat, "L'Art d'écrire enseigné en vingt leçons"
 * (1899): originality and the hatred of banality, concision, repetition,
 * harmony, images, observation, description, narration and dialogue.
 *
 * `albalat` holds his words verbatim (checked against the 1899 text on archive.org)
 * with an English translation. `example` is a real quote with its source where
 * one fits; exercise sentences are original.
 * Lesson scales mix quick recognition steps (choose, spot, order) with a final
 * production step judged by the coach, because writing beats labelling.
 *
 * Albalat's two lessons on concision and repetition are split into atomic
 * scales (Cut the padding, One-word swaps, Echoes) and a Concision scale that
 * comes later and mixes every fault, the way they turn up in real drafts.
 */
import type { DrillTechnique } from './drills'

export const ALBALAT_TECHNIQUES: DrillTechnique[] = [
  // ── Expression ────────────────────────────────────────────
  {
    id: 'exact-epithet',
    name: 'The exact adjective',
    family: 'expression',
    level: 1,
    instruction: 'Swap the vague adjective for the one that fits only this thing.',
    criteria: 'The adjective is precise and belongs to this noun; it adds information instead of decoration.',
    example: 'The difference between the almost right word and the right word is really a large matter—’tis the difference between the lightning-bug and the lightning.',
    exampleSource: 'Mark Twain, letter to George Bainton (1888)',
    albalat: {
      fr: 'La marque du véritable écrivain, c’est le mot propre et la création de l’expression.',
      en: 'The mark of the true writer is the exact word and the creation of the expression.',
      lesson: 'Leçon 5, L’originalité du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'choose',
          goal: 'Which adjective does the most work?',
          prompt: 'The ___ road wound up the hill.',
          options: [
            { text: 'nice', why: '“Nice” is an opinion. It shows nothing about the road.' },
            { text: 'long', why: 'True of most roads, so it tells us almost nothing.' },
            { text: 'rutted', correct: true, why: 'One word gives the surface, the age and the jolt of driving it.' },
            { text: 'beautiful', why: 'A verdict, not a picture. Let the reader decide it is beautiful.' },
          ],
          hint: 'Ask which word gives the reader something to see that the noun alone does not.',
        },
        {
          kind: 'spot',
          goal: 'Tap the adjective that says nothing.',
          sentence: 'She wore a [lovely] dress the color of wet slate.',
          why: '“Lovely” is a verdict. “The color of wet slate” already does all the work.',
        },
        { kind: 'rewrite', goal: 'Replace the vague adjective with an exact one.', source: 'He had a strange voice.' },
      ],
      [
        {
          kind: 'choose',
          goal: 'Which adjective belongs to this noun only?',
          prompt: 'The baker wiped his ___ hands on his apron.',
          options: [
            { text: 'big', why: 'Anyone can have big hands. Nothing here says “baker”.' },
            { text: 'floury', correct: true, why: 'It could only be a baker’s hands, and we see the white dust.' },
            { text: 'hardworking', why: 'It tells us a quality instead of showing it.' },
            { text: 'old', why: 'Generic. Old how? Show us.' },
          ],
        },
        {
          kind: 'cut',
          goal: 'Cut the two words that add nothing.',
          sentence: 'The [very] old house had a [nice] porch that sagged like a tired horse.',
          why: '“Very” props up a weak word and “nice” is empty. The sagging porch already shows the age.',
          hint: 'Look for words that judge (“nice”) or inflate (“very”) instead of describing.',
        },
        { kind: 'rewrite', goal: 'Make the adjective exact: which kind of bad?', source: 'The weather was bad.' },
      ],
      [
        {
          kind: 'choose',
          goal: 'Which sentence uses the most precise adjective?',
          options: [
            { text: 'The soup was hot.', why: 'Correct, but flat. How hot?' },
            { text: 'The soup was scalding.', correct: true, why: '“Scalding” measures the heat and implies the burn.' },
            { text: 'The soup was really hot.', why: '“Really” inflates without informing.' },
            { text: 'The soup was incredibly hot.', why: 'An intensifier is a sign the adjective is too weak.' },
          ],
        },
        {
          kind: 'spot',
          goal: 'Tap the adjectives that judge instead of show.',
          sentence: 'It was a [beautiful] morning, bright and [wonderful], and the air smelled of cut grass.',
          why: 'Two verdicts, no picture. “Bright” and the cut grass carry the morning on their own.',
        },
        {
          kind: 'rewrite',
          goal: 'Replace both adjectives with exact ones.',
          source: 'The old man walked into the big room.',
        },
      ],
    ],
  },
  {
    id: 'cliche',
    name: 'Kill the cliché',
    family: 'expression',
    level: 1,
    instruction: 'Find the stock phrase and say it your own way.',
    criteria: 'No ready-made phrase; the expression is fresh, fits this situation, and is not strained.',
    example: 'Never use a metaphor, simile or other figure of speech which you are used to seeing in print.',
    exampleSource: 'George Orwell, “Politics and the English Language” (1946)',
    albalat: {
      fr: 'Si vous devez écrire comme tout le monde, il est inutile de prendre la plume.',
      en: 'If you must write like everyone else, there is no point in picking up the pen.',
      lesson: 'Leçon 5, L’originalité du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'spot',
          goal: 'Tap the clichés. Leave the fresh image alone.',
          sentence: 'The old house stood [as silent as the grave], its shutters banging like loose teeth, while [time stood still] in the hallway.',
          why: '“As silent as the grave” and “time stood still” are stock phrases. “Banging like loose teeth” is figurative too, but it is fresh: keep it.',
          hint: 'A cliché is a phrase you have read a hundred times. Being figurative is not the problem; being familiar is.',
        },
        {
          kind: 'choose',
          goal: 'Which is fresh without being forced?',
          options: [
            { text: 'His heart pounded like a drum in his chest.', why: 'A cliché: the reader skims straight past it.' },
            { text: 'He could feel his pulse in his back teeth.', correct: true, why: 'New, physical and exact. It does not strain.' },
            { text: 'His heart was a wild stallion of raw terror.', why: 'Fresh, but forced: the image shouts and collapses under its own weight.' },
            { text: 'His heart was beating very hard and fast.', why: 'No cliché, but no picture either.' },
          ],
          hint: 'You are looking for the one that is neither worn out, nor forced, nor flat.',
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite without the stock phrase.',
          source: 'It was a dark and stormy night.',
          rules: [{ kind: 'noCliches' }],
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the clichés.',
          sentence: 'Then, [all of a sudden], the radio died, the fridge gave a last shudder, and [you could hear a pin drop].',
          why: 'Two stock phrases. “The fridge gave a last shudder” is a fresh, precise detail: it shows the silence arriving.',
          hint: 'Read each phrase and ask: have I seen these exact words many times before?',
        },
        {
          kind: 'choose',
          goal: 'Replace “as white as a sheet”.',
          prompt: 'When the doctor came in, Paul went ___.',
          options: [
            { text: 'as pale as a ghost', why: 'Another cliché in place of the first.' },
            { text: 'the color of candle wax', correct: true, why: 'Precise, unexpected, and it belongs in a hospital room.' },
            { text: 'white as freshly fallen snow', why: 'A cliché, and far from the room.' },
            { text: 'the color of a winter moon', why: 'Pretty, but forced: a moon has nothing to do with this room.' },
          ],
          hint: 'A good comparison is fresh and stays close to the scene.',
        },
        {
          kind: 'rewrite',
          goal: 'Keep the moment, lose the clichés.',
          source: 'Time stood still as their eyes met across the crowded room.',
          rules: [{ kind: 'noCliches' }],
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the clichés. Keep the fresh image.',
          sentence: 'He was [a diamond in the rough], with hands like split firewood and [a heart of gold].',
          why: 'Two clichés. “Hands like split firewood” is new, concrete and fits a rough man: that is the image to keep.',
          hint: 'Figurative language is fine when it is new. Tap only what is worn out.',
        },
        {
          kind: 'choose',
          goal: 'Which shows the silence without a cliché?',
          options: [
            { text: 'The silence in the whole room was deafening.', why: 'A cliché that has lost its paradox.' },
            { text: 'Someone set down a cup and everyone heard.', correct: true, why: 'A small sound everyone hears: the silence shown, not named.' },
            { text: 'It was very, very quiet.', why: 'No cliché, but no picture either.' },
            { text: 'The silence screamed at all of them.', why: 'Forced: silence cannot scream, and it shows.' },
          ],
          hint: 'Instead of naming the silence, show what can be heard in it.',
        },
        {
          kind: 'choose',
          goal: 'Which of these is not a cliché?',
          options: [
            { text: 'between a rock and a hard place', why: 'A stock phrase.' },
            { text: 'at the crack of dawn', why: 'A stock phrase.' },
            { text: 'before the coffee had cooled', correct: true, why: 'A precise moment, and nobody has worn it out.' },
            { text: 'in the blink of an eye', why: 'A stock phrase.' },
          ],
          hint: 'Three of these you have read many times. One you have probably never read.',
        },
        {
          kind: 'rewrite',
          goal: 'Say it in your own words.',
          source: 'She was over the moon when she got the job.',
          rules: [{ kind: 'noCliches' }],
        },
      ],
    ],
  },
  {
    id: 'own-expression',
    name: 'Coin your own expression',
    family: 'expression',
    level: 3,
    instruction: 'Coin an expression nobody has used, that fits so well it seems inevitable.',
    criteria: 'The expression is new, exact and natural; it fits the subject and does not strain for effect.',
    example: 'In his blue gardens men and girls came and went like moths among the whisperings and the champagne and the stars.',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    albalat: {
      fr: 'L’originalité est un effort incessant. Elle consiste à dire mieux, à dire énergiquement, à chercher le mot propre, à trouver l’image neuve.',
      en: 'Originality is an unceasing effort. It consists in saying things better, saying them forcefully, looking for the exact word, finding the new image.',
      lesson: 'Leçon 5, L’originalité du style',
    },
    moves: [
      { goal: 'Describe the subject with an expression of your own. No stock phrase.', rules: [{ kind: 'noCliches' }] },
      { goal: 'Another fresh expression, closer to the subject, not stranger.', rules: [{ kind: 'noCliches' }] },
    ],
  },

  // ── Concision ─────────────────────────────────────────────
  {
    id: 'concision',
    name: 'Concision',
    family: 'concision',
    level: 2,
    instruction: 'Put it all together: padding, wordy phrases and echoes come mixed in real drafts. Find them all, and keep every fact.',
    criteria: 'Every cut word was dead weight, every wordy phrase became its plain word, and no echo remains; the meaning is intact and the sentence reads stronger.',
    example: 'If it is possible to cut a word out, always cut it out.',
    exampleSource: 'George Orwell, “Politics and the English Language” (1946)',
    albalat: {
      fr: 'La seconde qualité essentielle d’un bon style, c’est la concision, c’est-à-dire l’art de renfermer une pensée dans le moins de mots possible.',
      en: 'The second essential quality of a good style is concision: the art of holding a thought in the fewest possible words.',
      lesson: 'Leçon 6, La concision du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'spot',
          goal: 'Tap every bit of padding. There are three kinds here.',
          sentence: '[In order] to [basically] improve the process, the team [made a decision] to meet weekly.',
          why: '“In order” adds nothing to “to”, “basically” hedges, and “made a decision” hides the verb “decided”. “To improve the process, the team decided to meet weekly.”',
          hint: 'Look for an empty phrase, a hedge, and a weak verb carrying a noun.',
        },
        {
          kind: 'choose',
          goal: 'Which keeps every fact in the fewest words?',
          prompt: 'At this point in time, there are a number of issues that need to be addressed by us.',
          options: [
            { text: 'We now have several issues to address.', correct: true, why: 'Time, number, issues and who must act all survive, in seven words.' },
            { text: 'There are now issues needing addressing.', why: '“There are” still delays the doer, “several” is gone, and “needing addressing” jingles.' },
            { text: 'Issues exist.', why: 'Short, but “now”, “several” and who must act are lost: you cut meaning.' },
            { text: 'At present, a number of issues need to be addressed.', why: 'Two wordy phrases swapped for two more, and still passive.' },
          ],
          hint: 'List the facts first: when, how many, what, who. The best version keeps all four.',
        },
        {
          kind: 'rewrite',
          goal: 'Every fault at once. 12 words or fewer.',
          source: 'Due to the fact that the meeting was very long, many people who attended it left before the end of it.',
          rules: [{ kind: 'maxWords', n: 12 }, { kind: 'noFiller' }],
        },
      ],
      [
        {
          kind: 'cut',
          goal: 'Cut everything the reader would not miss.',
          sentence: '[It should be noted that] the results, [which were] collected over two years, [clearly] show a trend.',
          why: '“The results, collected over two years, show a trend.” A throat-clearing opening, a “which were” the sentence can drop, and a “clearly” that asserts what the results should prove.',
          hint: 'Three kinds: an opening that comments on the sentence, words a participle can do without, and an adverb that only insists.',
        },
        {
          kind: 'choose',
          goal: 'Which fixes all three problems?',
          prompt: 'The manager made a statement saying that the manager would personally review each and every case.',
          options: [
            { text: 'The manager said she would review every case.', correct: true, why: '“Made a statement saying” became “said”, the second “manager” became “she”, and “personally” and “each and” are gone.' },
            { text: 'The manager stated she would personally review each case.', why: '“Personally” is still padding.' },
            { text: 'The manager said the manager would review every case.', why: 'The echo is still there.' },
            { text: 'The manager will review cases.', why: 'Short, but “said” and “every” are lost: you cut meaning.' },
          ],
          hint: 'Look for a wordy phrase, an echo and a redundancy. Then check that every fact survives.',
        },
        {
          kind: 'rewrite',
          goal: 'Every fault at once. 10 words or fewer.',
          source: 'There is a need for us to give consideration to the fact that the budget is very small.',
          rules: [{ kind: 'maxWords', n: 10 }, { kind: 'noFiller' }],
        },
      ],
      [
        {
          kind: 'cut',
          goal: 'Cut the padding, keep the picture.',
          sentence: 'She [slowly] crept [quietly] up the stairs, [and she] paused at the top [of the stairs], and listened.',
          why: '“She crept up the stairs, paused at the top, and listened.” Creeping is already slow and quiet, the subject needs no repeating, and we know which stairs.',
          hint: 'Ask of each word: does the verb already say it, or has the reader just read it?',
        },
        {
          kind: 'spot',
          goal: 'Tap the echo and the padding.',
          sentence: 'The rain fell [down] all night, and in the morning the [rain] had [actually] flooded the cellar.',
          why: 'Rain can only fall down, the second “rain” can be “it”, and “actually” adds nothing.',
          hint: 'One word repeats what the verb says, one repeats what the sentence said, one says nothing.',
        },
        {
          kind: 'rewrite',
          goal: 'Keep every image, lose every spare word. 14 words or fewer.',
          source: 'The old man, who was very old, sat down on the bench and he looked out at the grey sea that was in front of him.',
          rules: [{ kind: 'maxWords', n: 14 }, { kind: 'noFiller' }],
        },
      ],
    ],
  },

  {
    id: 'cut-padding',
    name: 'Cut the padding',
    family: 'concision',
    level: 1,
    instruction: 'Strike out the words that add nothing, and watch the sentence get stronger.',
    criteria: 'Every cut word was dead weight: fillers, hedges, words that repeat each other, empty openings. Every fact survives.',
    example: 'Vigorous writing is concise. A sentence should contain no unnecessary words, a paragraph no unnecessary sentences…',
    exampleSource: 'William Strunk Jr., The Elements of Style (1918)',
    albalat: {
      fr: 'L’éloquence n’est pas dans la quantité des choses dites, mais dans leur intensité.',
      en: 'Eloquence lies not in the quantity of things said, but in their intensity.',
      lesson: 'Leçon 6, La concision du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'cut',
          goal: 'Cut the fillers.',
          sentence: 'She was [really] [very] tired, so she [just] went to bed.',
          why: '“She was tired, so she went to bed” says everything. If “tired” feels too weak, change the word (“exhausted”) instead of propping it up.',
          hint: 'Fillers are words you can delete without changing a single fact: very, really, just, actually, basically.',
        },
        {
          kind: 'cut',
          goal: 'Cut the hedges. “That” is up to you.',
          sentence: 'She said {that} she [actually] [really] liked the gift.',
          why: '“She said she liked the gift.” The hedges made her sound less sure, not more. “That” after “said” is optional: keep it or cut it.',
          hint: '“Actually” and “really” rarely add information. Keep a word only if the sentence would mean something different without it.',
        },
        {
          kind: 'choose',
          goal: 'Which keeps the meaning without the padding?',
          prompt: 'It is basically just a really simple idea.',
          options: [
            { text: 'It is a simple idea.', correct: true, why: 'Three fillers gone, and the idea is still simple.' },
            { text: 'It is basically a simple idea.', why: '“Basically” still hedges.' },
            { text: 'It is just simple.', why: 'You cut “idea”, which was information. Cut padding, not meaning.' },
            { text: 'It is a truly, genuinely simple idea.', why: 'You swapped the fillers for new ones.' },
          ],
          hint: 'Padding is whatever you can remove without losing information. Check that the answer still says what the original said.',
        },
        {
          kind: 'rewrite',
          goal: 'Cut the padding. 8 words or fewer.',
          source: 'Honestly, I really just wanted to basically say thank you for everything.',
          rules: [{ kind: 'maxWords', n: 8 }, { kind: 'noFiller' }],
        },
      ],
      [
        {
          kind: 'cut',
          goal: 'Cut the words the next word already contains.',
          sentence: 'The [end] result was a [free] gift for every guest.',
          why: 'A result is the end; a gift is free. “The result was a gift for every guest.”',
          hint: 'In a redundant pair, one word is already inside the other: “end result”, “free gift”, “past history”.',
        },
        {
          kind: 'cut',
          goal: 'Cut every redundancy.',
          sentence: 'He returned [back] home and [personally] thanked each [and every] guest.',
          why: '“Returned” already means going back, thanking someone is done in person, and “each” already covers “every”.',
          hint: 'Ask of each word: does the verb or the noun next to it already say this?',
        },
        {
          kind: 'choose',
          goal: 'Which pair is not redundant?',
          options: [
            { text: 'future plans', why: 'Plans are always about the future.' },
            { text: 'close proximity', why: 'Proximity already means closeness.' },
            { text: 'unexpected surprise', why: 'A surprise is unexpected by definition.' },
            { text: 'sudden storm', correct: true, why: 'Storms can build slowly, so “sudden” adds information.' },
          ],
          hint: 'A pair is redundant when the first word is already part of the meaning of the second.',
        },
        {
          kind: 'rewrite',
          goal: 'Remove every redundant word. 9 words or fewer.',
          source: 'The two twins met together at dawn in the early morning to discuss the basic fundamentals.',
          rules: [{ kind: 'maxWords', n: 9 }],
        },
      ],
      [
        {
          kind: 'cut',
          goal: 'Cut the empty opening.',
          sentence: '[There were] many students [who] complained about the exam.',
          why: '“Many students complained about the exam.” “There were… who” delays the people who act.',
          hint: '“There is”, “There were” and “It is” openings push the real subject back. Find who acts and start there.',
        },
        {
          kind: 'cut',
          goal: 'Cut the throat-clearing.',
          sentence: '[It is clear that] the plan failed.',
          why: 'Announcing that something is clear does not make it clearer. “The plan failed.”',
          hint: 'Phrases that comment on the sentence (“it is clear that”, “it should be noted that”) can usually go.',
        },
        {
          kind: 'choose',
          goal: 'Which opening gets to the point?',
          prompt: 'There is a man in the village who repairs clocks.',
          options: [
            { text: 'A man in the village repairs clocks.', correct: true, why: 'The man acts from the first word.' },
            { text: 'In the village, there is a man repairing clocks.', why: 'It still opens on “there is”.' },
            { text: 'There exists a man who, in the village, repairs clocks.', why: 'Longer and stiffer than the original.' },
            { text: 'A man repairs clocks.', why: 'Shorter, but the village is lost: cut padding, not information.' },
          ],
          hint: 'Start with who does what. “There is a man who…” becomes “A man…”.',
        },
        {
          kind: 'rewrite',
          goal: 'Start with who acts. 6 words or fewer.',
          source: 'It was the dog that was the one who found the body.',
          rules: [{ kind: 'maxWords', n: 6 }],
        },
      ],
    ],
  },
  {
    id: 'wordy-phrases',
    name: 'One-word swaps',
    family: 'concision',
    level: 1,
    instruction: 'Replace each wordy phrase with the single word it was hiding.',
    criteria: 'Each wordy phrase becomes the plain word it stood for; meaning and tone stay the same.',
    example: 'Not “at this point in time” but “now”; not “make a decision” but “decide”.',
    albalat: {
      fr: '[…] tant qu’on pourra mettre un seul mot au lieu de deux, deux mots au lieu de trois, trois au lieu de quatre, etc. Enfin ce style sera mauvais tant qu’on pourra le faire meilleur.',
      en: '[…] as long as you can put one word instead of two, two instead of three, three instead of four, and so on. In short, a style is bad as long as it can be made better.',
      lesson: 'Leçon 5, L’originalité du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'choose',
          goal: 'One word for “due to the fact that”.',
          prompt: '___ the trains were late, we missed the wedding.',
          options: [
            { text: 'Because', correct: true, why: 'Same meaning, four words lighter.' },
            { text: 'Owing to the fact that', why: 'Still five words for one idea.' },
            { text: 'Due to', why: '“Due to” needs a noun after it (“due to the delay”), not a full clause.' },
            { text: 'In view of the fact that', why: 'Even longer than the original.' },
          ],
          hint: 'Long linking phrases usually hide a one-word conjunction: because, since, although, if.',
        },
        {
          kind: 'choose',
          goal: 'One word for “at this point in time”.',
          prompt: 'We are not hiring ___.',
          options: [
            { text: 'now', correct: true, why: 'The five words meant exactly this.' },
            { text: 'at this moment in time', why: 'The same padding with different words.' },
            { text: 'yet', why: '“Not hiring yet” means not now but soon: a different meaning.' },
            { text: 'currently right now', why: '“Currently” and “right now” say the same thing twice.' },
          ],
          hint: 'Look for the shortest word that carries the same meaning.',
        },
        {
          kind: 'choose',
          goal: 'One verb for “make a decision”.',
          prompt: 'The committee will ___ on Friday.',
          options: [
            { text: 'decide', correct: true, why: 'The action was hiding inside the noun “decision”.' },
            { text: 'make a decision', why: 'A weak verb carrying a noun: the original problem.' },
            { text: 'reach a decision', why: 'Still a weak verb plus a noun.' },
            { text: 'debate', why: 'Debating is talking it over, not deciding.' },
          ],
          hint: 'When a weak verb carries a noun (make a decision, give an answer, have a discussion), the real verb is inside the noun.',
        },
        {
          kind: 'rewrite',
          goal: 'Replace both wordy phrases. 9 words or fewer.',
          source: 'In order to save money, we made the decision to cook at home.',
          rules: [{ kind: 'maxWords', n: 9 }],
        },
      ],
      [
        {
          kind: 'choose',
          goal: 'One word for “in the event that”.',
          prompt: '___ it rains, the match is off.',
          options: [
            { text: 'If', correct: true, why: 'Four words become one, and nothing is lost.' },
            { text: 'In the case that', why: 'Still four words for “if”.' },
            { text: 'Should it be the case that', why: 'Longer and more formal.' },
            { text: 'As', why: '“As it rains” means while or because it rains. It is not a condition.' },
          ],
          hint: 'Conditions almost always come down to “if”.',
        },
        {
          kind: 'choose',
          goal: 'One word for “has the ability to”.',
          prompt: 'This car ___ reach 120 miles an hour.',
          options: [
            { text: 'can', correct: true, why: '“Can” is exactly “has the ability to”.' },
            { text: 'has the capacity to', why: 'The same padding with a different noun.' },
            { text: 'is able to', why: 'Shorter, but “can” is shorter still.' },
            { text: 'may', why: '“May” is permission or possibility, not ability.' },
          ],
          hint: 'Ability, permission and possibility usually fit in one small word: can, may, might.',
        },
        {
          kind: 'choose',
          goal: 'One verb for “give consideration to”.',
          prompt: 'We will ___ your application.',
          options: [
            { text: 'consider', correct: true, why: 'The verb was inside the noun “consideration”.' },
            { text: 'give consideration to', why: 'The original problem: a weak verb carrying a noun.' },
            { text: 'take into consideration', why: 'Still three words for one verb.' },
            { text: 'ignore', why: 'The opposite of considering.' },
          ],
          hint: 'Turn the noun back into its verb: consideration → consider.',
        },
        {
          kind: 'rewrite',
          goal: 'Replace every wordy phrase. 8 words or fewer.',
          source: 'In the event that you have the ability to come, please give us a call.',
          rules: [{ kind: 'maxWords', n: 8 }],
        },
      ],
      [
        {
          kind: 'choose',
          goal: 'One word for “a large number of”.',
          prompt: '___ readers wrote in.',
          options: [
            { text: 'Many', correct: true, why: 'One word, same meaning.' },
            { text: 'A large number of', why: 'The padding we are removing.' },
            { text: 'Few', why: 'The opposite: few readers, not many.' },
            { text: 'A considerable quantity of', why: 'Longer, and “quantity” is for things you cannot count.' },
          ],
          hint: 'Quantities often shrink to one word: many, few, most, some.',
        },
        {
          kind: 'choose',
          goal: 'One word for “with regard to”.',
          prompt: 'I am writing ___ your letter.',
          options: [
            { text: 'about', correct: true, why: 'Plain and exact.' },
            { text: 'with regard to', why: 'The padding we are removing.' },
            { text: 'for', why: '“Writing for your letter” is not English.' },
            { text: 'regarding the subject of', why: '“Regarding” alone would do; “the subject of” is padding.' },
          ],
          hint: 'Office phrases like “with regard to” and “in relation to” almost always mean “about”.',
        },
        {
          kind: 'choose',
          goal: 'One verb for “conduct an investigation into”.',
          prompt: 'The police will ___ the fire.',
          options: [
            { text: 'investigate', correct: true, why: 'The verb was inside the noun “investigation”.' },
            { text: 'conduct an investigation into', why: 'The original problem: four words for one verb.' },
            { text: 'carry out an investigation of', why: 'The same padding, rearranged.' },
            { text: 'ignore', why: 'The opposite of investigating.' },
          ],
          hint: 'Nouns ending in “-tion” often hide a verb: investigation → investigate.',
        },
        {
          kind: 'rewrite',
          goal: 'Replace every wordy phrase. 7 words or fewer.',
          source: 'A large number of residents made a complaint with regard to the noise.',
          rules: [{ kind: 'maxWords', n: 7 }],
        },
      ],
    ],
  },
  {
    id: 'echoes',
    name: 'Echoes',
    family: 'concision',
    level: 1,
    instruction: 'Find the word that comes back too soon, and fix it without a clumsy synonym.',
    criteria: 'No careless echo of a word; the fix uses a pronoun, a cut or a rebuilt sentence, never a thesaurus swap. Deliberate repetition stays.',
    example: 'Not “He took his coat. He put his coat on.” but “He took his coat and put it on.”',
    albalat: {
      fr: 'Plutôt que de changer le sens d’une phrase, plutôt que d’y introduire un mot faible, ou d’atténuer un passage, il faut maintenir les répétitions, lorsqu’elles sont exactes, nettes, lumineuses, et qu’elles ne peuvent être remplacées que par des expressions plus faibles.',
      en: 'Rather than change the meaning of a sentence, bring in a weak word or soften a passage, keep a repetition when it is exact, clear and luminous, and could only be replaced by something weaker.',
      lesson: 'Leçon 6, La concision du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'cut',
          goal: 'Cut the repeated subject.',
          sentence: 'He opened the window, [he] lit a cigarette, and [he] watched the street.',
          why: '“He opened the window, lit a cigarette, and watched the street.” One subject can carry three verbs.',
          hint: 'When the same person does several things in a row, name them once.',
        },
        {
          kind: 'cut',
          goal: 'Cut the echo.',
          sentence: 'My sister called and [my sister] said she was coming.',
          why: '“My sister called and said she was coming.” The second “my sister” tells us nothing new.',
          hint: 'If the subject has not changed, you do not need to name it again.',
        },
        {
          kind: 'choose',
          goal: 'Which fix sounds natural?',
          prompt: 'The house had a garden. The garden had a wall. The wall was old.',
          options: [
            { text: 'The house had a garden enclosed by an old wall.', correct: true, why: 'One sentence, and each thing is named once.' },
            { text: 'The house had a garden. The yard had a wall. The barrier was old.', why: 'The synonyms make it sound like three different places.' },
            { text: 'The house had a garden, the garden had a wall, the wall was old.', why: 'The same echoes, joined by commas.' },
            { text: 'The house had a wall.', why: 'Short, but the garden and its age are gone.' },
          ],
          hint: 'Rebuild the sentence so each thing is named once. A synonym only hides the echo.',
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite so each noun appears once.',
          source: 'The report was late because the report needed more data, and the data was hard to find.',
          rules: [{ kind: 'noRepeats' }],
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the words that come back too soon.',
          sentence: 'We walked along the river until the [river] turned, then [walked] back along the road.',
          why: '“River” and “walked” return within a few words. “We followed the river to the bend, then came back by the road.”',
          hint: 'Read slowly and listen for a word you heard a moment ago.',
        },
        {
          kind: 'choose',
          goal: 'Which avoids the echo?',
          prompt: 'She smiled a small smile.',
          options: [
            { text: 'She gave a small smile.', correct: true, why: 'One form of the word, and nothing lost.' },
            { text: 'She smiled a little smile.', why: 'Still “smiled… smile”.' },
            { text: 'She grinned a small smile.', why: 'Grinning and smiling at once: the echo has only moved.' },
            { text: 'She smiled small.', why: 'The echo is gone, but the sentence is no longer natural English.' },
          ],
          hint: 'Watch for a verb and a noun from the same root: smiled a smile, decided on a decision.',
        },
        {
          kind: 'cut',
          goal: 'Cut the part that says it again.',
          sentence: 'The town is quiet. [It is a quiet place.] Nothing happens there.',
          why: '“The town is quiet. Nothing happens there.” The middle sentence repeats the first one.',
          hint: 'Sometimes a whole sentence is the repetition.',
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite without the echoes.',
          source: 'He decided to make a decision about the problem before the problem got worse.',
          rules: [{ kind: 'noRepeats' }],
        },
      ],
      [
        {
          kind: 'choose',
          goal: 'Which repetition is deliberate, and earns its place?',
          options: [
            { text: '“We shall fight on the beaches, we shall fight on the landing grounds…”', correct: true, why: 'Churchill, 1940. The repetition is the point: each “we shall fight” adds resolve.' },
            { text: 'The plan was a good plan with a good chance.', why: 'Careless: “plan” and “good” echo for no reason.' },
            { text: 'I went to the shop and the shop was shut.', why: 'An accidental echo. “It was shut” would do.' },
            { text: 'The meeting about the new meeting schedule ran long, so they scheduled another meeting.', why: 'Careless: “meeting” three times, and “schedule” echoes too.' },
          ],
          hint: 'Deliberate repetition builds rhythm or insistence. Careless repetition only echoes, and a pronoun would fix it.',
        },
        {
          kind: 'spot',
          goal: 'Tap only the careless repetition. Keep the deliberate one.',
          sentence: 'Again and again she knocked; again and again nobody came. She walked home, and her [home] felt as cold as the street.',
          why: '“Again and again” repeats on purpose and builds the rhythm. The second “home” is an accident: “She walked home, and it felt as cold as the street.”',
          hint: 'Keep the repetition that builds the rhythm; find the one that slipped in by accident.',
        },
        {
          kind: 'cut',
          goal: 'Cut the echoes.',
          sentence: 'The doctor examined the patient and [the doctor] wrote a prescription [for the patient].',
          why: '“The doctor examined the patient and wrote a prescription.” Who wrote it, and for whom, is already clear.',
          hint: 'Cut a mention when the reader already knows who it refers to.',
        },
        {
          kind: 'rewrite',
          goal: 'Keep the deliberate repetition, remove the careless ones.',
          source: 'Day after day he waited, day after day the letter did not come, and the letter he waited for was a letter from his son.',
        },
      ],
    ],
  },

  // ── Harmony ───────────────────────────────────────────────
  {
    id: 'word-order',
    name: 'Word order',
    family: 'harmony',
    level: 2,
    instruction: 'Arrange the parts so the sentence rises and ends on its strongest words.',
    criteria: 'The order reads naturally aloud, builds, and places the most important words last.',
    example: 'It is a truth universally acknowledged, that a single man in possession of a good fortune must be in want of a wife.',
    exampleSource: 'Jane Austen, Pride and Prejudice (1813)',
    albalat: {
      fr: 'La construction des phrases est le secret de l’art d’écrire.',
      en: 'The construction of sentences is the secret of the art of writing.',
      lesson: 'Leçon 8, L’harmonie des phrases',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'order',
          goal: 'Rebuild the sentence so it ends on the blow.',
          chunks: ['When the doors finally opened,', 'after three hours in the rain,', 'there was', 'nobody left.'],
          accept: [[1, 0, 2, 3]],
          why: 'The waiting comes first and the blow comes last: “nobody left”.',
        },
        {
          kind: 'choose',
          goal: 'Which order ends strongest?',
          options: [
            { text: 'He had lost everything: his house, his savings, his wife.', correct: true, why: 'Rising order: the heaviest loss lands last.' },
            { text: 'He had lost everything: his wife, his savings, his house.', why: 'The biggest loss comes first and the sentence deflates.' },
            { text: 'His wife, his savings, his house, everything, he had lost.', why: 'The inversion sounds forced and ends on a weak verb.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Reorder so the sentence ends on its most important words.',
          source: 'Nobody answered, although she knocked three times and called his name.',
        },
      ],
      [
        {
          kind: 'order',
          goal: 'Rebuild the sentence so the piano arrives last.',
          chunks: ['In the corner,', 'under a sheet', 'that nobody had lifted in years,', 'stood the piano.'],
          accept: [[1, 2, 0, 3]],
          why: 'Place and time build suspense, then the piano arrives as the reveal.',
        },
        {
          kind: 'choose',
          goal: 'Which puts the weight on her leaving?',
          options: [
            { text: 'Without a word, she left.', correct: true, why: 'It ends on “left”, so the leaving lands.' },
            { text: 'She left without a word.', why: 'Good, but the weight falls on the silence, not the leaving.' },
            { text: 'She, without a word, left.', why: 'The interruption makes the verb limp in.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Reorder so the disappointment lands last.',
          source: 'The results were a disappointment to everyone, which was surprising given how hard they had worked.',
        },
      ],
      [
        {
          kind: 'order',
          goal: 'Rebuild the sentence so it ends as the last light goes out.',
          chunks: ['Slowly,', 'one by one,', 'the lights of the village', 'went out.'],
          accept: [[1, 0, 2, 3]],
          why: 'The adverbs set the pace, and the verb closes the sentence as the last light goes out.',
        },
        {
          kind: 'choose',
          goal: 'Which one does not trail off at the end?',
          options: [
            { text: 'The castle, which the fire had destroyed in a single night, was never rebuilt.', correct: true, why: 'It ends on the consequence.' },
            { text: 'The fire destroyed the castle in a single night, and it was never rebuilt by anyone.', why: 'It trails off on “by anyone”.' },
            { text: 'Never rebuilt was the castle, which the fire had destroyed in a single night.', why: 'The inversion is forced and the end is a subordinate clause.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Find the most harmonious order, ending on the strongest detail.',
          source: 'He died at nineteen, my grandfather, in France, in the war.',
        },
      ],
    ],
  },
  {
    id: 'sound',
    name: 'The ear',
    family: 'harmony',
    level: 2,
    instruction: 'Read with your ear: remove accidental rhymes, jingles and clashing sounds.',
    criteria: 'No accidental jingles, rhymes or tongue-twisters; the sound supports the meaning.',
    example: 'Not “the nation’s information situation” but “what the country knows”.',
    albalat: {
      fr: '[…] l’harmonie, c’est-à-dire le sens musical des mots et des phrases et l’art de les combiner agréablement pour l’oreille.',
      en: '[…] harmony, that is, the musical sense of words and sentences, and the art of combining them pleasingly for the ear.',
      lesson: 'Leçon 7, L’harmonie du style',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'spot',
          goal: 'Tap the words that make an accidental rhyme.',
          sentence: 'He [stood] in the [wood] as long as he [could].',
          why: 'Three rhymes in prose sound like a nursery song.',
        },
        {
          kind: 'choose',
          goal: 'Which reads most smoothly aloud?',
          options: [
            { text: 'She sells the shells she finds on the shore.', why: 'A tongue-twister, whether you meant it or not.' },
            { text: 'She sells what she finds on the beach.', correct: true, why: 'Clear, and nothing trips the tongue.' },
            { text: 'She sells seashells, sifted from the sand’s surface.', why: 'The hiss of “s” drowns the meaning.' },
            { text: 'She sells shells.', why: 'Short, but still a tongue-twister.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Remove the “-tion” jingle.',
          source: 'The committee’s decision on the implementation of the regulation caused frustration.',
          rules: [{ kind: 'noJingle' }],
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the three words that jingle.',
          sentence: '[Slowly] and [silently] and [steadily] he climbed the stairs.',
          why: 'Three “-ly” adverbs in a row: a jingle, and a crutch. One exact verb would do.',
        },
        {
          kind: 'choose',
          goal: 'Which sentence avoids the “-ing” jingle?',
          options: [
            { text: 'Coming home, seeing the lights burning, I felt something shifting.', why: 'Four “-ing” words: it sings when it should speak.' },
            { text: 'When I came home and saw the lights on, something in me shifted.', correct: true, why: 'Same content, and the ear rests.' },
            { text: 'Coming home and seeing lights burning, I was feeling something shifting.', why: 'Even more “-ing”.' },
            { text: 'Coming home, I felt something shift.', why: 'No jingle, but the lights are gone: you cut meaning.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Keep the energy, lose the jingle.',
          source: 'Running, jumping, shouting, laughing, the children were playing in the morning.',
          rules: [{ kind: 'noJingle' }],
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the accidental rhyme.',
          sentence: 'The argument ended in a [dense], [tense] silence.',
          why: '“Dense, tense” rhymes, and the rhyme makes it sound like a joke.',
        },
        {
          kind: 'choose',
          goal: 'Sound can also work for you. Which one makes the sound serve the meaning?',
          options: [
            { text: 'The surf slid and seethed along the sand.', correct: true, why: 'The hissing s-sounds are the sound of the water: sound and sense together.' },
            { text: 'The surf seemed to sit somewhat south.', why: 'The s-sounds hiss about nothing: a jingle, not an effect.' },
            { text: 'The big bold bus bounced by the bank.', why: 'Alliteration for its own sake: it reads like a tongue-twister.' },
            { text: 'The surf was loud along the sand at night.', why: 'No harm, but no effect: the sound does no work.' },
          ],
          hint: 'A repeated sound is a fault when it is an accident and a tool when it imitates what the sentence describes.',
        },
        {
          kind: 'choose',
          goal: 'Which ending sounds strongest?',
          options: [
            { text: 'He walked into the sea.', correct: true, why: 'A clean fall: a stressed word closes the sentence.' },
            { text: 'He walked into the sea, apparently.', why: 'It trails off on a weak, unstressed tail.' },
            { text: 'Into the sea he walked, it seemed.', why: 'Forced inversion and a limp ending.' },
            { text: 'He walked in.', why: 'A strong ending, but the sea, the point of the sentence, is gone.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite it so it no longer sounds like a tongue-twister.',
          source: 'The sad lad had had a bad day.',
        },
      ],
    ],
  },

  // ── Imagery ───────────────────────────────────────────────
  {
    id: 'coherent-image',
    name: 'One image, held',
    family: 'imagery',
    level: 2,
    instruction: 'Keep one image and follow it through. Never mix two.',
    criteria: 'The image fits the subject, stays consistent, and feels natural rather than forced.',
    example: 'So we beat on, boats against the current, borne back ceaselessly into the past.',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    albalat: {
      fr: 'Évitez les images […] quand elles sont forcées, prises de trop loin, et dont le rapport n’est point assez naturel, ni la comparaison assez sensible.',
      en: 'Avoid images […] when they are forced, taken from too far away, and when the connection is not natural enough nor the comparison clear enough.',
      lesson: 'Leçon 17, Les images',
    },
    moves: [],
    lessons: [
      [
        {
          kind: 'spot',
          goal: 'Tap the part that breaks the image.',
          sentence: 'A flood of complaints [set the whole office on fire].',
          why: 'Floods do not start fires. Water and fire fight each other in the same sentence.',
        },
        {
          kind: 'choose',
          goal: 'Which image stays consistent?',
          options: [
            { text: 'Her anger was a slow fire, and by evening it had burned through her patience.', correct: true, why: 'One image, carried to its end.' },
            { text: 'Her anger was a slow fire that finally burst the dam.', why: 'Fire does not burst dams. Two images collide.' },
            { text: 'Her anger was a fire, a flood, a hurricane.', why: 'Three images, none of them held.' },
            { text: 'Her anger was a slow fire that smoldered all day and finally flooded the whole house with its tears.', why: 'Fire does not flood, and fire has no tears: three images collide.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Keep one image and carry it through.',
          source: 'He was a rock for his family, a lighthouse that kept the ship of their home afloat.',
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the image that does not belong.',
          sentence: 'The old library was a sleeping animal: its shelves breathed dust, its floorboards {purred} [like a sports car], and its lamps dozed.',
          why: '“Purred” still belongs to the animal; “like a sports car” drags in an engine. Stay in one world.',
        },
        {
          kind: 'choose',
          goal: 'Which image stays close to the subject: a baker at dawn?',
          options: [
            { text: 'Her hands moved like a pianist’s on a keyboard.', why: 'Borrowed from far away. It pulls us out of the kitchen.' },
            { text: 'She folded the dough the way her mother had folded bedsheets.', correct: true, why: 'Domestic, close to the kitchen, and it carries a memory.' },
            { text: 'She worked the dough like a sculptor, a surgeon and a warrior.', why: 'Three images, none held.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Pick one image and sustain it.',
          source: 'Grief was a heavy stone in her chest that slowly melted into a river of tears.',
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'Tap the part that switches image.',
          sentence: 'The city woke, stretched its arms of steel, and [set sail] into the morning.',
          why: 'A waking body does not set sail. The personification breaks.',
        },
        {
          kind: 'choose',
          goal: 'Which image does not feel forced?',
          options: [
            { text: 'The moon was a sad, lonely, melancholy eye weeping silver tears of cosmic grief.', why: 'Forced: it strains and piles on adjectives.' },
            { text: 'The moon hung over the parking lot like a lamp someone forgot to switch off.', correct: true, why: 'Unexpected but plausible, and it fits the setting.' },
            { text: 'The moon was a glowing orb in the night sky.', why: 'A cliché, not an image.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Keep the drawer, and finish the image without leaving it.',
          source: 'Her memory was an old drawer that stuck, then poured its contents into the sea of the past.',
        },
      ],
    ],
  },
  {
    id: 'sustained-image',
    name: 'The sustained image',
    family: 'imagery',
    level: 3,
    instruction: 'Choose one image close to the subject and carry it across three sentences.',
    criteria: 'One image, drawn from the subject’s own world, developed without switching or straining.',
    example: 'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
    exampleSource: 'Psalm 23:1–2, King James Version (1611)',
    albalat: {
      fr: 'L’image est une manière forte d’écrire, une façon de rendre un objet plus sensible.',
      en: 'The image is a forceful way of writing, a way of making a thing more tangible.',
      lesson: 'Leçon 17, Les images',
    },
    moves: [
      { goal: 'Give the subject one image, taken from a world close to it.', rules: [{ kind: 'noCliches' }] },
      { goal: 'Extend the same image with a new detail. Do not switch.' },
      { goal: 'Close the image. It must still be the same one.' },
    ],
  },

  // ── Narration ─────────────────────────────────────────────
  {
    id: 'observation',
    name: 'Observation',
    family: 'narration',
    level: 1,
    instruction: 'Look longer. Write the detail only someone who really looked would see.',
    criteria: 'Concrete, specific details that are not the obvious ones; nothing generic.',
    example: '…he seemed to fill those glistening boots until he strained the top lacing…',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    albalat: {
      fr: 'Rien ne vaut l’éloquence, l’intensité d’une chose vue, notée sur place.',
      en: 'Nothing equals the eloquence, the intensity, of a thing seen and noted on the spot.',
      lesson: 'Leçon 15, L’observation directe',
    },
    subjects: ['character', 'action', 'setting', 'object'],
    moves: [
      { goal: 'One detail nobody else would notice.', rules: [{ kind: 'noCliches' }] },
      { goal: 'One detail from another sense: sound, smell or touch.', rules: [{ kind: 'noCliches' }] },
      { goal: 'One detail that shows time passing, or having passed.', rules: [{ kind: 'noCliches' }] },
    ],
  },
  {
    id: 'telling-trait',
    name: 'The telling trait',
    family: 'narration',
    level: 2,
    instruction: 'Describe with one characteristic trait instead of an inventory.',
    criteria: 'A single, well-chosen trait that implies the rest; no list of features.',
    example: '“Her voice is full of money,” he said suddenly.',
    exampleSource: 'F. Scott Fitzgerald, The Great Gatsby (1925)',
    albalat: {
      fr: 'Certains auteurs ont beau accumuler les détails, embellir leurs phrases, on ne voit rien, on lit des mots, cela ne frappe pas. D’autres, avec quelques traits, sont des évocateurs admirables.',
      en: 'Some authors pile up details and polish their sentences in vain: you see nothing, you read words, nothing strikes you. Others, with a few strokes, bring things to life admirably.',
      lesson: 'Leçon 14, De la description',
    },
    subjects: ['character', 'setting', 'object'],
    moves: [
      { goal: 'Portray the subject with one trait that implies everything else.' },
      { goal: 'A second trait that complicates the first.' },
    ],
  },
  {
    id: 'scene-summary',
    name: 'Scene or summary',
    family: 'narration',
    level: 3,
    instruction: 'Choose your speed: compress a long time, then slow one moment down.',
    criteria: 'The summary compresses time cleanly; the scene expands one moment with concrete, present detail.',
    example: 'Summary: “For ten years he wrote to her every Sunday.” Scene: “He licked the envelope, winced at the glue, and pressed it shut with his thumb.”',
    albalat: {
      fr: 'Une narration longue peut paraître courte, et un récit court peut sembler long.',
      en: 'A long narration can seem short, and a short account can seem long.',
      lesson: 'Leçon 13, De la narration',
    },
    subjects: ['character', 'action', 'feeling', 'object'],
    moves: [
      { goal: 'Summary: cover months or years in one sentence.' },
      { goal: 'Scene: one moment, in close-up, as it happens.' },
      { goal: 'Back out: one sentence of summary to move the story on.' },
    ],
  },
  {
    id: 'dialogue',
    name: 'Dialogue',
    family: 'narration',
    level: 3,
    instruction: 'Make people talk the way people talk: indirect, characteristic, never explaining.',
    criteria: 'The line sounds spoken, reveals character or tension, and avoids exposition and named emotions.',
    example: '“You have no compassion on my poor nerves.” “You mistake me, my dear. I have a high respect for your nerves. They are my old friends.”',
    exampleSource: 'Jane Austen, Pride and Prejudice (1813)',
    albalat: {
      fr: 'Il faut que chaque personnage dise peu de choses à la fois, par la raison que, dans une conversation, chacun veut parler et n’écoute pas longtemps son interlocuteur.',
      en: 'Each character must say little at a time, because in a conversation everyone wants to talk and nobody listens to the other for long.',
      lesson: 'Leçon 19, Du dialogue',
    },
    subjects: ['character', 'action', 'feeling', 'setting'],
    moves: [
      { goal: 'A line of dialogue that reveals who is speaking. Name no emotion.', sentences: 3, rules: [{ kind: 'noEmotionWords' }] },
      { goal: 'A reply that dodges the question.', sentences: 3 },
      { goal: 'A last line whose real meaning is under the words.', sentences: 3 },
    ],
  },
  {
    id: 'point-of-view',
    name: 'Point of view',
    family: 'narration',
    level: 2,
    instruction: 'Pick a point of view and hold it. Never show what your narrator cannot know.',
    criteria: 'The point of view is consistent; the details are only those the viewpoint character can perceive or know.',
    example: 'Not “She walked in, unaware her face was flushed” but “She walked in, her cheeks burning.”',
    moves: [],
    lessons: [
      [
        {
          kind: 'spot',
          goal: 'We are inside Anna’s head. Tap what she cannot know.',
          units: 'sentence',
          sentence: 'Anna opened the letter slowly. Her hands shook. The paper smelled of her mother’s perfume. [Across town, her brother was smiling.] She read the first line twice.',
          why: 'Anna cannot see across town. The camera jumps out of her head.',
        },
        {
          kind: 'choose',
          goal: 'Which sentence stays inside Tom’s head?',
          options: [
            { text: 'Tom felt the cold creep through his boots.', correct: true, why: 'A sensation only Tom can have.' },
            { text: 'Tom did not know it, but the ice was thinning beneath him.', why: 'The narrator steps outside Tom to tell us what he cannot know.' },
            { text: 'Tom looked handsome in the winter light.', why: 'Tom cannot see himself.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite it with “he” instead of “I”, staying just as close to his thoughts.',
          source: 'I walked into the kitchen and saw my father at the table, pretending he had not been waiting.',
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'A first-person narrator. Tap the slip.',
          units: 'sentence',
          sentence: 'I stood at the window, watching the rain. The glass was cold against my forehead. [My eyes were a startling shade of green.] Somewhere below, a car door slammed.',
          why: 'Nobody sees their own eyes while watching the rain. That is the author talking, not the narrator.',
        },
        {
          kind: 'choose',
          goal: 'You want the reader to feel the panic as it happens. Which narration?',
          options: [
            { text: 'I run. The door won’t give. I hit it again.', correct: true, why: 'Present tense, first person, short beats: no distance.' },
            { text: 'He would later recall that he had run toward the door.', why: 'The distance kills the urgency.' },
            { text: 'Everyone panicked, as people often do in fires.', why: 'A general summary. Nobody is in the room.' },
            { text: 'He ran.', why: 'A summary in two words: no moment, no panic.' },
          ],
        },
        {
          kind: 'rewrite',
          goal: 'Rewrite it in the general’s own voice (“I”). He knows his fear: let it show in what he notices, without naming it.',
          source: 'The general, who secretly feared the sea, ordered the fleet to sail at dawn.',
        },
      ],
      [
        {
          kind: 'spot',
          goal: 'We are with Marie. Tap what she cannot know.',
          units: 'sentence',
          sentence: 'Marie hid behind the curtain, holding her breath. Footsteps crossed the hall below. [Downstairs, the policeman decided she must be upstairs.] The stairs began to creak.',
          why: 'Marie cannot hear a decision. Only footsteps on the stairs could tell her.',
        },
        {
          kind: 'choose',
          goal: 'We are inside the detective’s head. Which sentence slips out of it?',
          options: [
            { text: 'She noticed the clock had stopped at ten past four.', why: 'Inside her head: something she sees.' },
            { text: 'Behind her, the butler slipped the key into his coat.', correct: true, why: 'It happens behind her back. She cannot see it, so the narrator has left her head.' },
            { text: 'She wondered why the butler kept glancing at the door.', why: 'Inside her head: her own question.' },
            { text: 'The room smelled faintly of pipe smoke and wet wool.', why: 'Inside her head: something she smells.' },
          ],
          hint: 'For each sentence, ask: could she see, hear, feel or think this, right now?',
        },
        {
          kind: 'rewrite',
          goal: 'Tell it from inside the baker, without saying that he does not know.',
          source: 'Everyone in the village knew that the baker’s wife had left, except the baker.',
          sentences: 2,
        },
      ],
    ],
  },
]
