/**
 * Lessons for the core scales that have clear right and wrong answers (voice,
 * punctuation, parallel parts, modifiers, linking sentences, showing a
 * feeling) and for the two figures whose shape is worth recognising before
 * producing it (gradation, the periodic sentence). Each lesson mixes instant
 * steps (choose, spot, cut, rebuild) with a closing move judged by the coach.
 * The other figures and rhythms (ternary, cadence, anaphora…) stay as free
 * writing on a subject.
 *
 * Wrong options are plausible mistakes a writer would make, not nonsense, so
 * that picking the right one takes judgement.
 * Multiple-choice options are kept close in length so the right one never
 * stands out by its size. All sentences are original.
 */
import type { DrillMove } from './drills'

const PASSIVE_HINT =
  'A passive verb is a form of “to be” plus a past participle (was broken, is made, were seen). The subject receives the action instead of doing it. Ask: who did it?'

export const CORE_LESSONS: Record<string, DrillMove[][]> = {
  'active-only': [
    [
      {
        kind: 'spot',
        goal: 'Tap the passive verb.',
        sentence: 'The window [was broken] during the storm, and nobody noticed until morning.',
        why: '“Was broken” hides what broke it. Active: “The storm broke the window, and nobody noticed until morning.”',
        hint: PASSIVE_HINT,
      },
      {
        kind: 'choose',
        goal: 'Which sentence is in the active voice?',
        options: [
          { text: 'The cake was eaten by the children.', why: 'Passive: the children hide at the end, after “by”.' },
          { text: 'The children ate the whole cake.', correct: true, why: 'The doers come first, and they act.' },
          { text: 'The whole cake had been eaten.', why: 'Passive, and the doers have vanished entirely.' },
          { text: 'The cake was being eaten up.', why: 'Passive in progress: still nobody acting.' },
        ],
        hint: PASSIVE_HINT,
      },
      {
        kind: 'choose',
        goal: 'Make it active. Who did it?',
        prompt: 'The letter was signed by the mayor.',
        options: [
          { text: 'The mayor signed the letter.', correct: true, why: 'The doer becomes the subject and acts.' },
          { text: 'The letter got signed by the mayor.', why: '“Got signed” is still passive.' },
          { text: 'The letter was signed.', why: 'Still passive, and now the mayor has vanished.' },
          { text: 'By the mayor, the letter was signed.', why: 'Reordered, but still passive.' },
        ],
        hint: 'Find the doer (often after “by”), make it the subject, and give it the verb.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite in the active voice.',
        source: 'The decision was made by the committee after the report had been read.',
        rules: [{ kind: 'noPassive' }],
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap the passive verbs.',
        sentence: 'Mistakes [were made], and the money [was lost] before anyone asked questions.',
        why: 'Both passives hide who is responsible. Active: “We made mistakes and lost the money before anyone asked questions.”',
        hint: 'Some passives have no “by”: the doer has disappeared. Look for “to be” plus a past participle.',
      },
      {
        kind: 'choose',
        goal: 'The passive hides the doer. Which version names them?',
        prompt: 'The road was closed at noon.',
        options: [
          { text: 'The police closed the road at noon.', correct: true, why: 'Now we know who acted.' },
          { text: 'The road had been closed at noon.', why: 'Still passive, still no doer.' },
          { text: 'The road was closed off by order at noon.', why: 'Still passive: “by order” names no one.' },
          { text: 'At noon, the road was closed off.', why: 'Reordered, and still passive.' },
        ],
        hint: 'A real fix names someone who acts. Changing the verb or the order keeps the passive.',
      },
      {
        kind: 'choose',
        goal: 'The passive is sometimes right. Which one?',
        options: [
          { text: 'My bike was stolen last night.', correct: true, why: 'You do not know the thief, and the bike is what matters. Here the passive is the right tool.' },
          { text: 'The ball was kicked by Tom.', why: 'Tom is known: “Tom kicked the ball” is shorter and livelier.' },
          { text: 'The soup was made by my mother.', why: '“My mother made the soup” is shorter and warmer.' },
          { text: 'A speech was given by the mayor.', why: 'The mayor is known: “The mayor gave a speech.”' },
        ],
        hint: 'Use the passive when the doer is unknown or does not matter. If you know who acted, let them act.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite in the active voice. Name who did it.',
        source: 'The vase was knocked over and the water was spilled across the floor.',
        rules: [{ kind: 'noPassive' }],
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap the passive verbs. One verb here is active.',
        sentence: 'The bridge [was built] in 1890 by a company that [was forgotten] within a decade, but it still carries trucks today.',
        why: 'Two passives. The last verb, “carries”, is active, and it is the liveliest part of the sentence.',
        hint: PASSIVE_HINT,
      },
      {
        kind: 'choose',
        goal: 'Which is the best active rewrite?',
        prompt: 'A loud noise was heard by everyone in the house.',
        options: [
          { text: 'Everyone in the house heard a loud noise.', correct: true, why: 'Same words, and the people now act.' },
          { text: 'A loud noise was heard throughout the house.', why: 'Still passive, and the people are gone.' },
          { text: 'There was a loud noise heard by everyone.', why: '“There was” plus a passive: weaker still.' },
          { text: 'A loud noise was what everyone had heard.', why: 'Twisted around to avoid the active verb.' },
        ],
        hint: 'Move the doer (after “by”) to the front and give it an active verb.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite in the active voice.',
        source: 'The house was searched by the police, and nothing was found.',
        rules: [{ kind: 'noPassive' }],
      },
    ],
  ],

  'strong-verbs': [
    [
      {
        kind: 'choose',
        goal: 'One verb for “walked slowly”.',
        prompt: 'The old man ___ to the door.',
        options: [
          { text: 'shuffled', correct: true, why: 'Slow, and we see the feet dragging.' },
          { text: 'walked slowly', why: 'The adverb props up a plain verb.' },
          { text: 'moved slowly', why: 'Even vaguer than “walked”.' },
          { text: 'ran', why: 'Running is fast: the opposite of walking slowly.' },
        ],
        hint: 'A verb plus an -ly adverb can often become one exact verb: ran quickly → sprinted, said quietly → whispered.',
      },
      {
        kind: 'choose',
        goal: 'One verb for “said angrily”.',
        prompt: '“Get out,” she ___.',
        options: [
          { text: 'snapped', correct: true, why: 'The anger is inside the verb.' },
          { text: 'said angrily', why: 'The adverb tells us the anger instead of letting us hear it.' },
          { text: 'stated', why: 'Formal and flat: no anger at all.' },
          { text: 'said loudly', why: 'Loud is not angry, and the adverb is still doing the work.' },
        ],
        hint: 'Look for a verb that already contains the manner: shouted, muttered, snapped, sighed.',
      },
      {
        kind: 'cut',
        goal: 'Cut the adverbs the verbs already contain.',
        sentence: 'He [quickly] sprinted to the car and [loudly] slammed the door.',
        why: '“He sprinted to the car and slammed the door.” Sprinting is quick; slamming is loud.',
        hint: 'When the verb is strong, the adverb repeats it.',
      },
      {
        kind: 'rewrite',
        goal: 'Replace each verb + adverb with one strong verb.',
        source: 'She walked quickly to the window and looked carefully at the street.',
        rules: [{ kind: 'noAdverbs' }],
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap the verbs that only say something exists.',
        sentence: 'The kitchen [was] cold, and there [were] dishes in the sink that [were] dirty.',
        why: 'Three forms of “to be”. With action verbs: “Cold seeped up from the tiles, and dirty dishes filled the sink.”',
        hint: 'Forms of “to be” (is, was, were, are) state; action verbs show something happening.',
      },
      {
        kind: 'choose',
        goal: 'Which replaces “was” with an action?',
        prompt: 'The room was quiet.',
        options: [
          { text: 'Silence filled the room.', correct: true, why: 'The silence now does something.' },
          { text: 'The room was very quiet.', why: 'Still “was”, plus a filler.' },
          { text: 'The room was silent.', why: 'A better adjective, but still “was”.' },
          { text: 'The room seemed quiet.', why: '“Seemed” is still a state, not an action.' },
        ],
        hint: 'Make the quality itself the subject and give it a verb: “The room was quiet” → “Silence filled the room.”',
      },
      {
        kind: 'choose',
        goal: 'Which sentence has the strongest verb?',
        options: [
          { text: 'The bus was late again this morning.', why: '“Was” only states the lateness.' },
          { text: 'The bus came late again this morning.', why: '“Came” is an action, but a vague one.' },
          { text: 'The bus crawled in late this morning.', correct: true, why: '“Crawled” shows the lateness happening.' },
          { text: 'The bus was really late this morning.', why: '“Was” plus a filler.' },
        ],
        hint: 'The strongest verb lets you see the action. Compare what each verb shows, not how long the sentence is.',
      },
      {
        kind: 'rewrite',
        goal: 'No “to be”, no -ly adverbs.',
        source: 'The street was empty and the wind was blowing really hard.',
        rules: [{ kind: 'noToBe' }, { kind: 'noAdverbs' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'One verb for “looked angrily”.',
        prompt: 'She ___ at him across the table.',
        options: [
          { text: 'glared', correct: true, why: 'Looking and anger in one word.' },
          { text: 'looked angrily', why: 'The adverb carries what the verb should.' },
          { text: 'stared hard', why: 'Hard staring is not necessarily angry.' },
          { text: 'peered', why: '“Peered” means looking closely, not angrily.' },
        ],
        hint: 'Choose the verb whose meaning already includes the manner.',
      },
      {
        kind: 'choose',
        goal: 'One verb for “cried loudly”.',
        prompt: 'The baby ___ all night.',
        options: [
          { text: 'wailed', correct: true, why: 'Loud crying, in one verb.' },
          { text: 'cried loudly', why: 'The adverb does the work.' },
          { text: 'sniffled', why: '“Sniffled” is quiet crying: the opposite.' },
          { text: 'hummed', why: 'Humming is quiet and calm.' },
        ],
        hint: 'Check that the new verb keeps the same meaning: loud crying, not quiet crying.',
      },
      {
        kind: 'spot',
        goal: 'Tap the weak spots: the “to be” and the adverbs.',
        sentence: 'He [was] tired, so he walked [slowly] up the stairs and sat [heavily] on the bed.',
        why: 'One “was” and two adverbs do work that verbs could do: “He trudged up the stairs and dropped onto the bed.”',
        hint: 'Look for forms of “to be” and words ending in -ly.',
      },
      {
        kind: 'rewrite',
        goal: 'Make every verb carry the meaning.',
        source: 'He was nervous and spoke quietly while his hands were moving constantly.',
        rules: [{ kind: 'noToBe' }, { kind: 'noAdverbs' }],
      },
    ],
  ],

  chastity: [
    [
      {
        kind: 'cut',
        goal: 'Cut every adjective and adverb.',
        sentence: 'The [old] dog [slowly] crossed the [empty] road.',
        why: '“The dog crossed the road.” Plain, and that is the point: now the nouns and verbs must do more work.',
        hint: 'Adjectives describe nouns (old, empty); adverbs describe verbs (slowly).',
      },
      {
        kind: 'choose',
        goal: 'Which keeps the picture with nouns and verbs only?',
        prompt: 'The old dog slowly crossed the empty road.',
        options: [
          { text: 'The mutt hobbled across the road.', correct: true, why: '“Hobbled” carries the age and the slowness, with no adjective or adverb.' },
          { text: 'The dog crossed the road.', why: 'No modifiers, but the picture is gone.' },
          { text: 'The very old dog crossed over.', why: 'Still an adjective, plus a filler.' },
          { text: 'The ancient hound slowly crossed.', why: '“Ancient” and “slowly” are still there.' },
        ],
        hint: 'Do not just delete: move the meaning of the adjectives and adverbs into a stronger noun or verb.',
      },
      {
        kind: 'spot',
        goal: 'Tap every adjective and adverb.',
        sentence: 'A [tall], [thin] man [quietly] entered the [dark] room.',
        why: 'Four modifiers. Nouns and verbs could carry them: “A man slipped into the shadows.”',
        hint: 'Adjectives describe nouns (tall, dark); adverbs describe verbs (quietly).',
      },
      {
        kind: 'rewrite',
        goal: 'No adjectives, no adverbs.',
        source: 'The angry man quickly walked out of the small, noisy room.',
        rules: [{ kind: 'noAdverbs' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'One verb for “walked quickly and angrily”.',
        prompt: 'He ___ out of the meeting.',
        options: [
          { text: 'stormed', correct: true, why: 'Speed and anger, in one verb.' },
          { text: 'walked angrily', why: 'An adverb is still carrying the anger.' },
          { text: 'strolled', why: '“Strolled” is slow and relaxed: the opposite.' },
          { text: 'left', why: 'A plain verb: the speed and the anger are gone.' },
        ],
        hint: 'A good verb holds both the action and its manner.',
      },
      {
        kind: 'choose',
        goal: 'One noun for “a big, violent storm”.',
        prompt: 'A ___ flattened the town.',
        options: [
          { text: 'hurricane', correct: true, why: 'The noun already contains “big” and “violent”.' },
          { text: 'big storm', why: 'An adjective doing what a noun could.' },
          { text: 'shower', why: 'A shower is light rain: the opposite.' },
          { text: 'violent wind', why: 'Still an adjective, and “wind” is vaguer.' },
        ],
        hint: 'A precise noun can replace a noun plus adjectives: big violent storm → hurricane.',
      },
      {
        kind: 'cut',
        goal: 'Cut every adjective and adverb.',
        sentence: 'She [carefully] folded the [white] letter and [gently] put it in the [small] drawer.',
        why: '“She folded the letter and put it in the drawer.” Now choose verbs that bring the care back: “She smoothed the letter and slid it into the drawer.”',
        hint: 'Adjectives describe nouns; adverbs describe verbs. Leave the nouns and verbs.',
      },
      {
        kind: 'rewrite',
        goal: 'Nouns and verbs only.',
        source: 'The little girl happily ran through the tall, wet grass.',
        rules: [{ kind: 'noAdverbs' }],
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap every adjective and adverb.',
        sentence: 'The [hungry] crowd [angrily] pushed against the [heavy] gate.',
        why: '“The mob rattled the gate.” “Mob” holds the anger and hunger; “rattled” holds the pushing.',
        hint: 'Adjectives describe nouns (hungry, heavy); adverbs describe verbs (angrily).',
      },
      {
        kind: 'choose',
        goal: 'One noun for “a large, angry crowd”.',
        prompt: 'A ___ gathered outside the palace.',
        options: [
          { text: 'mob', correct: true, why: 'Size and anger, in one noun.' },
          { text: 'few', why: 'A few people: neither large nor angry.' },
          { text: 'audience', why: 'An audience is calm and watching.' },
          { text: 'group', why: 'Neither large nor angry.' },
        ],
        hint: 'Check that the new noun keeps every quality you are removing.',
      },
      {
        kind: 'choose',
        goal: 'One verb for “ate quickly and greedily”.',
        prompt: 'The boy ___ his dinner.',
        options: [
          { text: 'wolfed', correct: true, why: 'Speed and hunger, inside the verb.' },
          { text: 'nibbled', why: '“Nibbled” is small, slow bites: the opposite.' },
          { text: 'ate fast', why: 'A plain verb and an adverb.' },
          { text: 'ate', why: 'The plain verb: no speed, no hunger.' },
        ],
        hint: 'A good verb holds both the action and its manner.',
      },
      {
        kind: 'rewrite',
        goal: 'Nouns and verbs only.',
        source: 'A big black dog loudly barked at the frightened little boy.',
        rules: [{ kind: 'noAdverbs' }],
      },
    ],
  ],

  semicolon: [
    [
      {
        kind: 'choose',
        goal: 'Which uses the semicolon correctly?',
        options: [
          { text: 'The shop was closed; we went home.', correct: true, why: 'Two complete statements, closely linked.' },
          { text: 'The shop was closed; because it was late.', why: '“Because it was late” cannot stand alone as a sentence.' },
          { text: 'We bought; bread, milk and eggs.', why: 'A semicolon cannot introduce a list. That is the colon’s job.' },
          { text: 'The shop on the corner; was closed.', why: 'It splits the subject from its verb.' },
        ],
        hint: 'A semicolon needs a complete sentence on each side. Test each half on its own.',
      },
      {
        kind: 'choose',
        goal: 'This is a comma splice. Which fix works?',
        prompt: 'The rain stopped, the streets began to steam.',
        options: [
          { text: 'The rain stopped; the streets began to steam.', correct: true, why: 'Two complete statements, now properly joined.' },
          { text: 'The rain stopped the streets began to steam.', why: 'Without the comma, the two statements run into each other.' },
          { text: 'The rain; stopped, the streets began to steam.', why: 'The semicolon is in the wrong place, and the splice remains.' },
          { text: 'The rain stopped, the streets; began to steam.', why: 'Still a splice, and now the subject is cut from its verb.' },
        ],
        hint: 'A comma alone cannot join two complete sentences. A semicolon can.',
      },
      {
        kind: 'choose',
        goal: 'Which pair belongs together with a semicolon?',
        options: [
          { text: 'I hate the winter; it gets dark at four.', correct: true, why: 'The second statement explains the first: they belong together.' },
          { text: 'I hate the winter; my uncle plays violin.', why: 'Two unrelated statements. Use a full stop.' },
          { text: 'I hate the winter; and the cold as well.', why: 'The second half is not a complete statement.' },
        ],
        hint: 'A semicolon says “these two belong together”. Use it only when the second statement is closely linked to the first.',
      },
      {
        kind: 'rewrite',
        goal: 'Join these into one sentence with a semicolon.',
        source: 'The house had been sold. The garden did not seem to know it yet.',
        rules: [{ kind: 'contains', mark: 'semicolon' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which mark joins these two statements?',
        prompt: 'He wanted to stay___ she wanted to leave.',
        options: [
          { text: ';', correct: true, why: 'Two complete statements in contrast: the semicolon holds them side by side.' },
          { text: ',', why: 'A comma alone cannot join two complete sentences: that is a comma splice.' },
          { text: ':', why: 'A colon announces an explanation or a list. This is a contrast.' },
        ],
        hint: 'Is each half a complete sentence? Are they linked? Then a semicolon fits.',
      },
      {
        kind: 'choose',
        goal: 'Which uses “however” correctly?',
        options: [
          { text: 'It rained; however, we went out.', correct: true, why: 'Semicolon before “however”, comma after.' },
          { text: 'It rained, however we went out.', why: 'A comma splice: “however” cannot join two sentences.' },
          { text: 'It rained however; we went out.', why: 'The semicolon is on the wrong side of “however”.' },
          { text: 'It rained; however we went, out.', why: 'The comma is in the wrong place.' },
        ],
        hint: 'Words like “however” and “therefore” are not conjunctions. Put a semicolon before them and a comma after.',
      },
      {
        kind: 'choose',
        goal: 'Semicolons can separate list items that contain commas. Which is right?',
        options: [
          { text: 'We visited Paris, France; Rome, Italy; and Madrid, Spain.', correct: true, why: 'The semicolons separate the places; the commas stay inside each one.' },
          { text: 'We visited Paris; France, Rome; Italy, and Madrid; Spain.', why: 'The semicolons split each city from its country.' },
          { text: 'We visited Paris, France, Rome, Italy, and Madrid, Spain.', why: 'Correct commas, but the reader cannot tell where each place ends.' },
        ],
        hint: 'When list items already contain commas, semicolons mark where each item ends.',
      },
      {
        kind: 'rewrite',
        goal: 'Fix the comma splice with a semicolon.',
        source: 'The train was late, nobody on the platform was surprised.',
        rules: [{ kind: 'contains', mark: 'semicolon' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which sentence misuses the semicolon?',
        options: [
          { text: 'Dear Sir; thank you for your letter.', correct: true, why: 'Wrong: “Dear Sir” is not a complete statement. A comma or a colon belongs here.' },
          { text: 'The light faded; the birds went quiet.', why: 'Correct: two complete, linked statements.' },
          { text: 'I was late; the meeting had started.', why: 'Correct: the second statement follows from the first.' },
          { text: 'It was not a house; it was a ruin.', why: 'Correct: a contrast between two complete statements.' },
        ],
        hint: 'Check both sides: is each one a complete sentence?',
      },
      {
        kind: 'choose',
        goal: 'Three of these fix the comma splice. Which one does not?',
        prompt: 'She was tired, she kept working.',
        options: [
          { text: 'She was tired; she kept working.', why: 'A good fix: two complete statements, side by side, and the contrast is felt.' },
          { text: 'She was tired, but she kept working.', why: 'A good fix: “but” spells out the contrast.' },
          { text: 'She was tired. She kept working.', why: 'A good fix: two sentences, and the full stop gives the second one weight.' },
          { text: 'She was tired: she kept working.', correct: true, why: 'Wrong: a colon promises that the second half explains the first. Being tired does not explain working.' },
        ],
        hint: 'A semicolon, a full stop and a comma plus “but” all join two sentences. A colon does something else: it announces an explanation.',
      },
      {
        kind: 'rewrite',
        goal: 'Join with a semicolon, and let the second half sharpen the first.',
        source: 'The meeting was over. Nobody stood up.',
        rules: [{ kind: 'contains', mark: 'semicolon' }],
      },
    ],
  ],

  colon: [
    [
      {
        kind: 'choose',
        goal: 'Which uses the colon correctly?',
        options: [
          { text: 'She left me only one thing: a key to a locked room.', correct: true, why: 'The first half creates expectation; the colon delivers it.' },
          { text: 'She left me a key to a locked room: one thing only.', why: 'The reveal comes first, so the colon announces what we already know.' },
          { text: 'She left me only one thing, a key: to a locked room.', why: 'The colon breaks the reveal in two.' },
          { text: 'She left: me only one thing, a key to a locked room.', why: 'A colon cannot split a verb from what follows it.' },
        ],
        hint: 'Before the colon, a complete statement that raises a question. After it, the answer.',
      },
      {
        kind: 'choose',
        goal: 'Which mark sets up the reveal?',
        prompt: 'There was one problem___ nobody had the key.',
        options: [
          { text: ':', correct: true, why: '“One problem” raises a question; the colon answers it.' },
          { text: ',', why: 'A comma here joins two complete sentences: a comma splice.' },
          { text: 'because', why: 'It changes the meaning: the problem was not caused by the missing key, it was the missing key.' },
        ],
        hint: 'A colon says “here it is”: what follows explains or reveals what came before.',
      },
      {
        kind: 'choose',
        goal: 'Which mark delivers the rule?',
        prompt: 'He had one rule___ never lend money to family.',
        options: [
          { text: ':', correct: true, why: '“One rule” raises a question, and the colon makes the reader wait one beat for the answer.' },
          { text: ';', why: 'A semicolon needs a full sentence on both sides, and it links equals. Here the second half answers the first.' },
          { text: ',', why: 'The comma lets the rule slip by as an afterthought, and the setup gets no payoff.' },
        ],
        hint: 'Think of the colon as a drumroll: the first half promises something, the second delivers it.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite with a colon that sets up a reveal.',
        source: 'Everyone was waiting for the same thing, which was the verdict.',
        rules: [{ kind: 'contains', mark: 'colon' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which colon introduces a list correctly?',
        options: [
          { text: 'Bring three things: water, a map and a coat.', correct: true, why: 'A complete statement, then the list it announces.' },
          { text: 'Bring: water, a map, a coat and some food.', why: 'A colon right after a verb cuts it from its objects.' },
          { text: 'Bring three things; water, a map and a coat.', why: 'A semicolon cannot introduce a list.' },
          { text: 'Bring three things, water: a map and a coat.', why: 'The colon lands in the middle of the list.' },
        ],
        hint: 'The part before the colon must be a complete statement that announces the list.',
      },
      {
        kind: 'choose',
        goal: 'Which colon explains?',
        options: [
          { text: 'He could not sleep: the dog barked all night.', correct: true, why: 'What follows the colon explains why he could not sleep.' },
          { text: 'He could not: sleep because the dog barked.', why: 'The colon cuts “could not” from “sleep”.' },
          { text: 'The dog barked: all night, long and loud.', why: 'What follows does not explain anything; it just continues.' },
          { text: 'He could not sleep, the dog: barked all night.', why: 'A comma splice, and a colon in the middle of a clause.' },
        ],
        hint: 'After a colon, the reader should learn why, what or who.',
      },
      {
        kind: 'order',
        goal: 'Rebuild the sentence so the colon delivers the reveal.',
        chunks: ['After forty years at sea,', 'he was afraid of', 'only one thing:', 'the water.'],
        why: 'The setup builds the expectation; the colon makes the reader wait one beat; “the water” lands last.',
        hint: 'The colon comes right before the reveal, and the reveal comes last.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite with a colon that explains.',
        source: 'She refused the job because the pay was an insult.',
        rules: [{ kind: 'contains', mark: 'colon' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which colon is misused?',
        options: [
          { text: 'The recipe needs: flour, eggs and milk.', correct: true, why: 'Wrong: “The recipe needs” is not complete, so the colon cuts the verb from its objects.' },
          { text: 'The recipe needs three things: flour, eggs and milk.', why: 'Correct: a complete statement, then the list.' },
          { text: 'The answer was obvious: nobody had locked the door.', why: 'Correct: the colon delivers the explanation.' },
          { text: 'Two words: never again.', why: 'Correct: the colon delivers the two words.' },
        ],
        hint: 'Read the part before the colon on its own. If it is not a complete statement, the colon is wrong.',
      },
      {
        kind: 'choose',
        goal: 'Where does the colon make the strongest reveal?',
        options: [
          { text: 'He had planned everything except one thing: the weather.', correct: true, why: 'The setup asks a question; the last two words answer it.' },
          { text: 'He had planned everything: except one thing, the weather.', why: 'The colon comes too early and splits the setup.' },
          { text: 'He had: planned everything except one thing, the weather.', why: 'The colon cuts the verb from its object.' },
          { text: 'The weather: he had planned everything except that.', why: 'The reveal comes first, so there is nothing left to reveal.' },
        ],
        hint: 'Put the colon right before the answer, and keep the answer short.',
      },
      {
        kind: 'rewrite',
        goal: 'Turn this into a colon reveal.',
        source: 'The last guest to arrive was the one nobody had invited.',
        rules: [{ kind: 'contains', mark: 'colon' }],
      },
    ],
  ],

  dash: [
    [
      {
        kind: 'choose',
        goal: 'Which punctuation gives the surprise its pause?',
        options: [
          { text: 'I opened the door—and there he was.', correct: true, why: 'The dash stops the reader for a beat just before the surprise.' },
          { text: 'I opened the door, and there he was.', why: 'Correct, but calm: a comma does not stop the reader before the surprise.' },
          { text: 'I opened the door; and there he was.', why: 'A semicolon joins two full sentences without “and”. With “and”, it is wrong.' },
          { text: 'I opened the door: there he was.', why: 'A colon announces an explanation. A surprise needs a sudden break, not an announcement.' },
        ],
        hint: 'A dash is a sudden pause. Put it right before the turn or the surprise.',
      },
      {
        kind: 'choose',
        goal: 'Which dashes frame the aside correctly?',
        options: [
          { text: 'My brother—who never cooks—made dinner.', correct: true, why: 'The aside opens and closes with a dash.' },
          { text: 'My brother—who never cooks, made dinner.', why: 'An aside opened with a dash must close with one.' },
          { text: 'My brother who never cooks—made dinner.', why: 'The aside is closed but never opened.' },
          { text: 'My brother, who never cooks—made dinner.', why: 'An aside opened with a comma must close with a comma, not a dash.' },
        ],
        hint: 'Dashes around an aside work like brackets: one before, one after.',
      },
      {
        kind: 'choose',
        goal: 'Which version makes the aside loudest?',
        options: [
          { text: 'The house—her mother’s house—was gone.', correct: true, why: 'Dashes shout the aside.' },
          { text: 'The house, her mother’s house, was gone.', why: 'Commas keep it calm.' },
          { text: 'The house (her mother’s house) was gone.', why: 'Brackets whisper it.' },
          { text: 'Her mother’s house was gone.', why: 'No aside at all, so there is nothing to make loud.' },
        ],
        hint: 'Commas, brackets and dashes can all frame an aside. Dashes give it the most force.',
      },
      {
        kind: 'rewrite',
        goal: 'Use dashes to interrupt with an aside.',
        source: 'He promised he would come back, which he always promised, but nobody believed him.',
        rules: [{ kind: 'contains', mark: 'dash' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which dash sums up a list?',
        options: [
          { text: 'Bread, wine, a candle—he had all he needed.', correct: true, why: 'The dash gathers the list into one statement.' },
          { text: 'Bread—wine, a candle, he had all he needed.', why: 'The dash cuts the list after its first item.' },
          { text: 'Bread, wine—a candle he had all he needed.', why: 'The dash lands in the middle of the list.' },
          { text: 'Bread, wine, a candle, he had—all he needed.', why: 'The pause comes too late to sum anything up.' },
        ],
        hint: 'A dash after a list says: “and all of this means…”.',
      },
      {
        kind: 'choose',
        goal: 'Which sentence uses too many dashes?',
        options: [
          { text: 'I went—fast—to the shop—the one on the corner—for milk.', correct: true, why: 'Too many: when every phrase is an interruption, nothing stands out.' },
          { text: 'I went to the shop—the one on the corner—for milk.', why: 'Fine: one aside, framed by two dashes.' },
          { text: 'I went to the shop for milk—and came back empty-handed.', why: 'Fine: one dash, one turn.' },
        ],
        hint: 'A dash is loud. One or two per sentence keeps its force.',
      },
      {
        kind: 'choose',
        goal: 'Which dash shows a thought breaking off?',
        options: [
          { text: '“I only wanted to—” She stopped.', correct: true, why: 'The dash cuts the sentence where the speaker stops.' },
          { text: '“I only wanted—to stop,” she said.', why: 'The sentence finishes, so nothing broke off.' },
          { text: '“I—only wanted to stop,” she said.', why: 'A hesitation, but the thought still finishes.' },
          { text: '“I only wanted to.” She stopped.', why: 'A full stop: the thought is finished, not broken off.' },
        ],
        hint: 'A dash at the end of a line of dialogue shows speech cut off before it finishes.',
      },
      {
        kind: 'rewrite',
        goal: 'Use a dash to sum up a list.',
        source: 'The keys, the phone and the wallet were all gone from the table.',
        rules: [{ kind: 'contains', mark: 'dash' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which dash is misused?',
        options: [
          { text: 'The cat sat—on the mat.', correct: true, why: 'Wrong: nothing turns or surprises, so the pause is empty.' },
          { text: 'It was perfect—almost.', why: 'Correct: the dash sets up the twist.' },
          { text: 'Nobody came—not even her sister.', why: 'Correct: the dash sharpens the blow.' },
          { text: 'He smiled—he never smiled.', why: 'Correct: the dash marks the surprise.' },
        ],
        hint: 'A dash must earn its pause: a turn, a surprise, an aside or a summary.',
      },
      {
        kind: 'choose',
        goal: 'Which dash creates the strongest turn?',
        options: [
          { text: 'He had everything—except the one thing he wanted.', correct: true, why: 'The pause comes right before the reversal.' },
          { text: 'He had—everything except the one thing he wanted.', why: 'The pause comes before “everything”, so the reversal has no build-up.' },
          { text: 'He had everything except—the one thing he wanted.', why: 'The pause comes after the turn has already started.' },
        ],
        hint: 'Put the dash at the hinge of the sentence, where it changes direction.',
      },
      {
        kind: 'rewrite',
        goal: 'Interrupt yourself with a dash.',
        source: 'I was going to tell her the truth, but then I saw her face.',
        rules: [{ kind: 'contains', mark: 'dash' }],
      },
    ],
  ],

  parallelism: [
    [
      {
        kind: 'spot',
        goal: 'Tap the item that breaks the pattern.',
        sentence: 'She likes hiking, swimming and [to ride] {horses}.',
        why: 'Two “-ing” words, then an infinitive. “Hiking, swimming and riding” gives the reader one pattern.',
        hint: 'Read only the items of the list. Each should take the same form: all “-ing”, all “to”, all nouns.',
      },
      {
        kind: 'choose',
        goal: 'Which series is parallel?',
        options: [
          { text: 'The job needs patience, a steady hand and to stay calm.', why: 'Two nouns, then a verb phrase: the last item breaks the pattern.' },
          { text: 'The job needs patience, a steady hand and a calm head.', correct: true, why: 'Three nouns in a row: the reader hears one pattern.' },
          { text: 'The job needs patience, steadiness and you must stay calm.', why: 'A full clause slips into a list of nouns.' },
          { text: 'The job needs being patient, a steady hand and calm.', why: 'An “-ing” phrase, a noun and an adjective: three forms.' },
        ],
        hint: 'Every item should fit after the same words: “The job needs patience”, “The job needs a steady hand”…',
      },
      {
        kind: 'rewrite',
        goal: 'Make the three parts parallel.',
        source: 'He came home tired, hungry, and wanting nothing but sleep.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which pair is balanced?',
        options: [
          { text: 'She was not only clever, but she also worked hard.', why: '“Not only” holds an adjective; “but” opens a whole new clause. The halves no longer match.' },
          { text: 'She was not only clever but also hard-working.', correct: true, why: 'An adjective after “not only”, an adjective after “but also”: the halves match.' },
          { text: 'Not only was she clever but also hard-working.', why: '“Not only” now governs a whole clause, “but also” a single adjective.' },
          { text: 'She not only was clever but also hard-working.', why: '“Not only” sits before a verb, “but also” before an adjective.' },
        ],
        hint: 'Whatever follows “not only” must match what follows “but also”: adjective with adjective, verb with verb.',
      },
      {
        kind: 'spot',
        goal: 'Tap the part that breaks the pattern.',
        sentence: 'We came to argue, to vote and [for the free lunch].',
        why: '“To argue, to vote” sets a pattern that “for the free lunch” breaks. “To argue, to vote and to eat the free lunch” keeps it, and the joke lands harder.',
        hint: 'Listen to how each item begins. Two start with “to”.',
      },
      {
        kind: 'choose',
        goal: 'Which comparison weighs like against like?',
        options: [
          { text: 'Walking to work is cheaper than to drive.', why: '“Walking” against “to drive”: two forms.' },
          { text: 'Walking to work is cheaper than driving there.', correct: true, why: '“Walking” against “driving”: like compared with like.' },
          { text: 'To walk to work is cheaper than driving there.', why: 'An infinitive against an “-ing” word: the scales do not balance.' },
          { text: 'Walking to work is cheaper than if you drive.', why: 'A clause against an “-ing” word.' },
        ],
        hint: 'Both sides of “than” should take the same form.',
      },
      {
        kind: 'rewrite',
        goal: 'Make the list parallel.',
        source: 'The course teaches you how to plan, writing clearly, and the art of revision.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which version lands hardest?',
        options: [
          { text: 'He lied to his wife, deceived his partner, and himself.', why: 'The pattern shifts, and the last item loses its verb.' },
          { text: 'He lied to his wife, to his partner, and to himself.', correct: true, why: 'Three matching parts: the pattern sets up the last one, and it lands.' },
          { text: 'He lied to his wife, to his partner, and was lying to himself.', why: 'The last item switches form just when it should land.' },
          { text: 'His wife, his partner, himself: all were lied to.', why: 'Passive and inverted: the pattern dissolves.' },
        ],
        hint: 'A parallel series builds an expectation. The last item pays it off only if it keeps the same form.',
      },
      {
        kind: 'spot',
        goal: 'Tap the part that breaks the pattern.',
        sentence: 'Read the question, plan your answer, and [your writing comes last].',
        why: 'Two commands, then a statement. “Read the question, plan your answer, then write.”',
        hint: 'Two items tell the reader what to do. Does the third?',
      },
      {
        kind: 'rewrite',
        goal: 'Rebuild it as three parallel clauses.',
        source: 'The town had lost its mill, the school was closed, and there were no young people anymore.',
      },
    ],
  ],

  comma: [
    [
      {
        kind: 'choose',
        goal: 'Which comma saves the reader from misreading?',
        prompt: 'While the dog ate the cat watched.',
        options: [
          { text: 'While the dog ate, the cat watched.', correct: true, why: 'Without the comma, the reader first thinks the dog ate the cat.' },
          { text: 'While the dog, ate the cat watched.', why: 'A comma between subject and verb splits the clause.' },
          { text: 'While the dog ate the cat, watched.', why: 'Now the dog really does eat the cat.' },
          { text: 'While, the dog ate the cat watched.', why: 'A pause after “while” helps nobody, and the misreading stays.' },
        ],
        hint: 'Read it aloud. Where does the opening part end and the main sentence begin? The comma goes there.',
      },
      {
        kind: 'choose',
        goal: 'Which list is punctuated correctly?',
        options: [
          { text: 'We packed bread, cheese, apples and a knife.', correct: true, why: 'Commas between the items, and “and” before the last one.' },
          { text: 'We packed, bread, cheese, apples and a knife.', why: 'No comma between a verb and its object.' },
          { text: 'We packed bread cheese apples and a knife.', why: 'Without commas the items run together.' },
          { text: 'We packed bread, cheese, apples, and, a knife.', why: 'No comma after “and”: it joins, it does not pause.' },
        ],
        hint: 'In a list, a comma separates each item from the next. Before the last item, “and” can do that job, with or without a comma.',
      },
      {
        kind: 'rewrite',
        goal: 'Add the commas this sentence needs.',
        source: 'After the storm passed we walked to the beach collected driftwood and built a fire.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which one says she has only one brother?',
        options: [
          { text: 'Her brother, who lives in Lyon, is a vet.', correct: true, why: 'The commas make “who lives in Lyon” an aside: extra information about her only brother.' },
          { text: 'Her brother who lives in Lyon is a vet.', why: 'Without commas, “who lives in Lyon” picks out one brother among several.' },
          { text: 'Her brother, who lives in Lyon is a vet.', why: 'The aside opens but never closes.' },
          { text: 'Her brother, who lives, in Lyon, is a vet.', why: 'A comma inside the aside breaks it apart.' },
        ],
        hint: 'Commas around a “who” clause mean: this is extra, you could remove it. No commas mean: this tells you which one.',
      },
      {
        kind: 'choose',
        goal: 'The commas change the meaning. Which says every student failed?',
        options: [
          { text: 'The students who skipped class failed.', why: 'Without commas, only the students who skipped failed.' },
          { text: 'The students, who skipped class, failed.', correct: true, why: 'The commas make it an aside about all the students: they all skipped, and they all failed.' },
          { text: 'The students, who, skipped class, failed.', why: 'A comma after “who” cuts the clause from its verb.' },
          { text: 'The students, who skipped class failed.', why: 'The aside opens but never closes.' },
        ],
        hint: 'An aside between commas is about everyone the noun names. Without commas, the clause narrows the group.',
      },
      {
        kind: 'rewrite',
        goal: 'She had one grandmother. Add the commas that make “who had never seen snow” an aside.',
        source: 'My grandmother who had never seen snow stood at the window all night.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which one is a comma splice?',
        options: [
          { text: 'The film was long, I fell asleep.', correct: true, why: 'Two full sentences joined by a comma alone: a splice.' },
          { text: 'The film was long, and I fell asleep.', why: 'Correct: a comma plus “and” joins two sentences.' },
          { text: 'The film was long; I fell asleep.', why: 'Correct: a semicolon can join two sentences.' },
          { text: 'Because the film was long, I fell asleep.', why: 'Correct: the first part cannot stand alone, so a comma is enough.' },
        ],
        hint: 'Cover the part after the comma. Could each side stand alone as a sentence? If yes, a comma alone is not enough.',
      },
      {
        kind: 'choose',
        goal: 'Fix the splice without changing what happened.',
        prompt: 'I knocked twice, nobody answered.',
        options: [
          { text: 'I knocked twice, but nobody answered.', correct: true, why: '“But” carries the disappointment that the comma alone could not.' },
          { text: 'I knocked twice, so then nobody answered.', why: '“So” claims the knocking caused the silence. It did not.' },
          { text: 'I knocked twice, nobody, answered.', why: 'More commas, and still a splice.' },
          { text: 'I knocked, twice nobody answered.', why: 'The comma moves, and the meaning changes.' },
        ],
        hint: 'A comma alone cannot join two sentences. Add the word that says how they relate: and, but, so, yet.',
      },
      {
        kind: 'rewrite',
        goal: 'Fix the comma splice. Keep it one sentence.',
        source: 'The road was icy, we drove at walking pace.',
      },
    ],
  ],

  'show-feeling': [
    [
      {
        kind: 'spot',
        goal: 'Tap the words that name the feeling instead of showing it.',
        sentence: 'Tom was [nervous]. He kept checking his watch and felt very [anxious] about the interview.',
        why: '“Nervous” and “anxious” tell us what the watch-checking already shows. Cut them and the reader feels it.',
        hint: 'Look for words that name an emotion: nervous, sad, angry, afraid. They tell; the actions show.',
      },
      {
        kind: 'choose',
        goal: 'Which shows anger without naming it?',
        options: [
          { text: 'She was furious with him.', why: 'Named, not shown.' },
          { text: 'She set his plate down too hard.', correct: true, why: 'The force of one small gesture carries the anger.' },
          { text: 'Rage boiled in her veins like lava.', why: 'Named again (“rage”), and inflated.' },
          { text: 'She felt a great deal of anger.', why: 'Named, and wordy.' },
        ],
        hint: 'Look for the one where you work out the feeling yourself, from what the person does.',
      },
      {
        kind: 'rewrite',
        goal: 'Show it. Do not name the feeling.',
        source: 'He was very sad when his dog died.',
        rules: [{ kind: 'noEmotionWords' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'He is waiting for test results. Which shows fear without melodrama?',
        options: [
          { text: 'Terror gripped his trembling heart.', why: 'Names the fear and dresses it up.' },
          { text: 'He read the same line four times.', correct: true, why: 'A small, true behavior: the fear is eating his attention.' },
          { text: 'He was scared, really scared.', why: 'Named twice.' },
          { text: 'His heart pounded like a drum.', why: 'A cliché that shows nothing new.' },
        ],
        hint: 'The strongest signs are often small and odd: what the person does with their hands, their eyes, their attention.',
      },
      {
        kind: 'spot',
        goal: 'Tap the sentence that tells what the others already show.',
        units: 'sentence',
        sentence: 'She folded the letter into smaller and smaller squares. [She felt guilty.] When her husband came in, she slid it under the fruit bowl.',
        why: 'The folding and the hiding already show guilt. Naming it takes the discovery away from the reader.',
      },
      {
        kind: 'rewrite',
        goal: 'Show the jealousy through what she does or notices.',
        source: 'At her friend’s wedding, she felt jealous.',
        rules: [{ kind: 'noEmotionWords' }],
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'She got the job. Which shows the joy?',
        options: [
          { text: 'She was overjoyed and happy.', why: 'Named twice.' },
          { text: 'She read the email aloud to the empty kitchen.', correct: true, why: 'Nobody to tell, and she tells anyway: the joy spills over.' },
          { text: 'Happiness exploded inside her like a box of fireworks.', why: 'Named, and the image is worn.' },
          { text: 'She felt really, really happy about it.', why: 'Named, and propped up with fillers.' },
        ],
        hint: 'Show what the feeling makes her do, especially something she would not do otherwise.',
      },
      {
        kind: 'spot',
        goal: 'Tap every word that names an emotion.',
        sentence: 'Hearing the key in the door, the boy felt [afraid] and [ashamed], and he pushed the broken vase under the sofa.',
        why: 'The pushing shows both. “Hearing the key in the door, the boy pushed the broken vase under the sofa.”',
      },
      {
        kind: 'rewrite',
        goal: 'Show the relief. No emotion words.',
        source: 'When the doctor said it was nothing, she felt enormous relief.',
        rules: [{ kind: 'noEmotionWords' }],
      },
    ],
  ],

  modifiers: [
    [
      {
        kind: 'choose',
        goal: 'Which opening phrase describes the right person?',
        options: [
          { text: 'Running for the bus, my bag split open.', why: 'The bag was not running. An opening phrase attaches to the first noun after it.' },
          { text: 'Running for the bus, I felt my bag split open.', correct: true, why: '“I” follows the phrase, and I was the one running.' },
          { text: 'Running for the bus, the bag I carried split.', why: 'Still the bag running.' },
          { text: 'Running for the bus, splitting open was my bag.', why: 'Twisted, and nobody is running.' },
        ],
        hint: 'An opening “-ing” phrase describes whoever comes right after the comma. Ask: who is doing it?',
      },
      {
        kind: 'spot',
        goal: 'Tap the subject that cannot be doing the opening action.',
        sentence: 'After eating dinner, [the dishes] were left in the sink.',
        why: 'The dishes did not eat dinner. “After eating dinner, we left the dishes in the sink.”',
        hint: 'Who ate? Now look at who comes right after the comma.',
      },
      {
        kind: 'rewrite',
        goal: 'Fix the dangling modifier: make the person who finished do the switching off.',
        source: 'Having finished the report, the computer was switched off.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which one means the soup was all she ate?',
        options: [
          { text: 'She ate only the soup.', correct: true, why: '“Only” sits next to what it limits: the soup.' },
          { text: 'Only she ate the soup.', why: 'Now nobody else ate it.' },
          { text: 'She ate the only soup.', why: 'Now there was just one soup.' },
          { text: 'She only ate the soup.', why: 'Loose: it can also mean she ate it and did nothing else with it.' },
        ],
        hint: 'Put “only” right before the word it limits.',
      },
      {
        kind: 'choose',
        goal: 'Which sentence puts the description where it belongs?',
        options: [
          { text: 'We sold the chair to a dealer with a broken leg.', why: 'Now the dealer has the broken leg.' },
          { text: 'We sold the chair with a broken leg to a dealer.', correct: true, why: '“With a broken leg” sits next to the chair.' },
          { text: 'With a broken leg, we sold the chair to a dealer.', why: 'Now we have the broken leg.' },
          { text: 'We sold, with a broken leg, the chair to a dealer.', why: 'Still ours, and the order is stiff.' },
        ],
        hint: 'A describing phrase attaches to the nearest noun. Put it next to the one it describes.',
      },
      {
        kind: 'rewrite',
        goal: 'Move the phrase so it describes the cake.',
        source: 'She gave the cake to the neighbours covered in chocolate.',
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap the phrase in the wrong place.',
        sentence: 'The shop sells jackets for men [made of leather].',
        why: 'The men are not made of leather. “The shop sells leather jackets for men.”',
        hint: 'Read the phrase with the noun right before it. Does that make sense?',
      },
      {
        kind: 'choose',
        goal: 'Which fix makes clear who was six?',
        prompt: 'At the age of six, my father taught me to swim.',
        options: [
          { text: 'When I was six, my father taught me how to swim.', correct: true, why: 'A clause with its own subject: no doubt who was six.' },
          { text: 'At six years old, my father taught me to swim.', why: 'Still says the father was six.' },
          { text: 'My father, at the age of six, taught me to swim.', why: 'Now the father is definitely six.' },
          { text: 'At the age of six, swimming was taught to me.', why: 'Passive, and now swimming is six.' },
        ],
        hint: 'When the right person cannot follow the opening phrase, give the phrase its own subject: “When I was…”.',
      },
      {
        kind: 'rewrite',
        goal: 'Fix it so the opening phrase describes the right person.',
        source: 'Covered in mud, his mother made him undress at the door.',
      },
    ],
  ],

  'old-new': [
    [
      {
        kind: 'choose',
        goal: 'The farm had one problem: a fox. Which sentence follows best?',
        options: [
          { text: 'The fox took a hen every night that spring.', correct: true, why: 'It opens on the fox, which we just met, and ends on the new loss.' },
          { text: 'Every night that spring, a hen was taken by the fox.', why: 'The fox, the known thing, is pushed to the end, and the verb turns passive.' },
          { text: 'Hens were taken every night by it that spring.', why: 'The link, “it”, is buried in the middle; the reader has to hunt for it.' },
          { text: 'A hen went missing every night that spring.', why: 'The fox, the link, has vanished.' },
        ],
        hint: 'Open the next sentence with what the last one ended on. The reader is still holding it.',
      },
      {
        kind: 'spot',
        goal: 'Tap the sentence that breaks the chain.',
        units: 'sentence',
        sentence: 'Our town has a river. The river floods every spring. [Mud lines on the church wall are left by each flood.] The highest line dates from 1910.',
        why: 'It opens on the mud lines, which are new, and ends on the flood, which we know. “Each flood leaves a mud line on the church wall” puts the known first and hands the next sentence its “line”.',
        hint: 'Check each opening: does it pick up something from the sentence before?',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite the second sentence so it opens on the piano.',
        source: 'She inherited a piano. Forty years had passed since anyone played it.',
        sentences: 2,
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which pair reads as one chain?',
        options: [
          { text: 'The storm cut the power. Without power, the pumps stopped.', correct: true, why: 'The second sentence starts where the first one ended.' },
          { text: 'The storm cut the power. The pumps stopped without it.', why: 'The link, “it”, comes last, after the new news.' },
          { text: 'The storm cut the power. Pumps stopping was the result.', why: 'It opens on something new and ends on a vague “result”.' },
          { text: 'The storm cut the power. Stopping, the pumps had no power.', why: 'Twisted: the link hides in the middle.' },
        ],
        hint: 'Look for the second sentence whose first words point back to the first sentence.',
      },
      {
        kind: 'choose',
        goal: 'The village had a single phone. The phone hung in the bar. Which sentence continues the chain?',
        options: [
          { text: 'The bar became the place where news arrived.', correct: true, why: 'It opens on “the bar” and ends on something new: the news.' },
          { text: 'News arrived only at the bar, in the end.', why: 'The link is buried, and the sentence ends on filler.' },
          { text: 'Calls were answered by whoever was at the bar.', why: 'It opens on something new, and the bar comes last.' },
          { text: 'Arriving news always came first to the bar.', why: 'Backwards: the news comes first and the bar, the link, comes last.' },
        ],
        hint: 'The last sentence ended on “the bar”. Start there.',
      },
      {
        kind: 'rewrite',
        goal: 'Rebuild each sentence so it opens on what the reader already knows.',
        source: 'My grandfather kept bees. Honey was sold by him at the market. A stall next to the fishmonger was where he sold it.',
        sentences: 3,
      },
    ],
    [
      {
        kind: 'spot',
        goal: 'Tap the sentence that opens on something new.',
        units: 'sentence',
        sentence: 'The lab bought a new microscope in May. The microscope could see single proteins. [A cure for the disease was found within a year using its images.] The cure now bears the lab’s name.',
        why: 'It opens on “a cure”, the newest thing, and leaves the link, the images, for the end. “Its images led to a cure within a year” keeps the chain and hands the next sentence its “cure”.',
      },
      {
        kind: 'choose',
        goal: 'Which keeps one topic, so the reader can follow it?',
        options: [
          { text: 'Bees pollinate crops. They also make honey. Now they are dying in great numbers.', correct: true, why: 'Every sentence opens on the bees: one topic, three new facts.' },
          { text: 'Bees pollinate crops. Honey is also made by them. Great numbers of them are dying.', why: 'The subject keeps changing, so the reader keeps re-aiming.' },
          { text: 'Bees pollinate crops. Honey is a bee product. Dying bees are a problem.', why: 'Three openings, three topics: the passage reads as a list.' },
          { text: 'Crops are pollinated by bees. They make honey too. Great numbers of them are dying.', why: 'It opens on crops, so “they” first seems to mean the crops.' },
        ],
        hint: 'Read only the first words of each sentence. In a clear passage, they name the same thing.',
      },
      {
        kind: 'rewrite',
        goal: 'Rewrite so each sentence opens on what the last one ended on.',
        source: 'The old mill closed in 1980. Three hundred jobs went with it. Most of the young people left the town because there was no work.',
        sentences: 3,
      },
    ],
  ],

  gradation: [
    [
      {
        kind: 'order',
        goal: 'Rebuild the series from weakest to strongest.',
        chunks: ['The wind rose,', 'the shutters banged,', 'the roof lifted,', 'and the house was gone.'],
        why: 'Each event is bigger than the last, and the loss of the house lands last.',
        hint: 'Rank the events by size, smallest first.',
      },
      {
        kind: 'choose',
        goal: 'Which series rises?',
        options: [
          { text: 'It was a mistake, a disaster, an inconvenience.', why: 'It peaks in the middle and falls back.' },
          { text: 'It was an inconvenience, a mistake, a disaster.', correct: true, why: 'Each word is heavier than the one before.' },
          { text: 'It was a disaster, a mistake, an inconvenience.', why: 'It falls from the first word: an anticlimax.' },
          { text: 'It was a disaster, an inconvenience, a mistake.', why: 'No order at all.' },
        ],
        hint: 'Rank the words by weight first. Then put the lightest first and the heaviest last.',
      },
      {
        kind: 'write',
        goal: 'A gradation: a rumour spreading through a village. Three steps or more, each stronger, the strongest last.',
      },
    ],
    [
      {
        kind: 'order',
        goal: 'Order the actions so the anger grows.',
        chunks: ['She frowned,', 'then snapped,', 'then shouted,', 'then threw the plate.'],
        why: 'A face, a word, a scream, an act: each step goes further than the last.',
        hint: 'Which of these could not be taken back? That one goes last.',
      },
      {
        kind: 'spot',
        goal: 'Tap the word that breaks the climb.',
        sentence: 'He was tired, then exhausted, then [sleepy], then too far gone to stand.',
        why: '“Sleepy” is weaker than “exhausted”: the climb stumbles. Without it, the series rises step by step.',
        hint: 'Each step should be stronger than the one before it. Find the step down.',
      },
      {
        kind: 'write',
        goal: 'A gradation: a child waiting for a parent who is late. Let the worry climb, worst fear last.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which version saves its strongest term for last?',
        options: [
          { text: 'They took his car, then his house, then his children.', correct: true, why: 'Things, then home, then family: each loss cuts deeper.' },
          { text: 'They took his children, then his house, then his car.', why: 'It peaks first and ends on the smallest loss.' },
          { text: 'They took his house, then his children, then his car.', why: 'The peak is in the middle; the car is an anticlimax.' },
          { text: 'They took his car, his children, his house as well.', why: 'The strongest term is buried in the middle.' },
        ],
        hint: 'Find the heaviest term. Is it last?',
      },
      {
        kind: 'order',
        goal: 'Rebuild it so the obsession grows.',
        chunks: ['At first the noise annoyed him,', 'then it kept him awake,', 'and by winter', 'he could hear nothing else.'],
        why: 'Annoyance, sleeplessness, obsession: each step goes deeper.',
      },
      {
        kind: 'write',
        goal: 'A gradation of three steps or more: a small lie that grows.',
      },
    ],
  ],

  periodic: [
    [
      {
        kind: 'choose',
        goal: 'Which sentence makes the reader wait for the point?',
        options: [
          { text: 'She found the letter behind the door, under the coats, by the window.', why: 'Loose: the point comes first and the rest trails after it.' },
          { text: 'Behind the door, under the coats, by the window, she found the letter.', correct: true, why: 'Three places hold us back; the letter arrives last.' },
          { text: 'She found it behind the door, under the coats: the letter, by the window.', why: 'The colon splits the find, and the wait breaks.' },
          { text: 'Behind the door she found the letter, under the coats, by the window.', why: 'The point arrives in the middle, and the end trails off.' },
        ],
        hint: 'A periodic sentence holds back its main clause, who did what, until the end.',
      },
      {
        kind: 'order',
        goal: 'Rebuild it so the decision comes last.',
        chunks: ['After three winters,', 'two failed harvests', 'and a letter from the bank,', 'they sold the farm.'],
        why: 'Everything that led to it comes first; the decision lands last.',
      },
      {
        kind: 'write',
        goal: 'A periodic sentence: a door you have never dared to open. Hold the main clause until the end.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'You want suspense. Which version?',
        options: [
          { text: 'The doctor came in at last, after an hour of silence, holding a sheet of paper.', why: 'The main point comes first, so the suspense is spent before the details arrive.' },
          { text: 'After an hour of silence, holding a sheet of paper, the doctor came in at last.', correct: true, why: 'The silence and the paper build the wait; the doctor’s arrival ends it.' },
          { text: 'After an hour of silence, the doctor came in at last, holding a sheet of paper.', why: 'Half periodic: the paper trails after the arrival and the tension leaks out.' },
        ],
        hint: 'Find where the main clause (“the doctor came in”) sits. Suspense needs it last.',
      },
      {
        kind: 'order',
        goal: 'Make the reader wait for the decision.',
        chunks: ['If the bridge holds,', 'and if the rain stops,', 'and if nobody sees us,', 'we cross tonight.'],
        accept: [[0, 2, 1, 3]],
        why: 'Three conditions build the tension; the decision comes last.',
      },
      {
        kind: 'write',
        goal: 'A periodic sentence: the last day in the house you grew up in. Make the wait longer than the payoff.',
      },
    ],
    [
      {
        kind: 'choose',
        goal: 'Which periodic sentence stays clear to the end?',
        options: [
          { text: 'Tired, half-blind in the rain and out of fuel, she reached the border at last.', correct: true, why: 'The wait is long enough to build and simple enough to hold.' },
          { text: 'Tired, and with, in the rain, half-blind, and fuel gone, she reached the border.', why: 'The wait tangles: the reader loses the thread before the payoff.' },
          { text: 'She reached the border, tired, half-blind in the rain, and out of fuel.', why: 'Loose: the point comes first.' },
          { text: 'Tired, she reached, half-blind in the rain and out of fuel, the border.', why: 'The verb is cut from its object: the wait sits in the wrong place.' },
        ],
        hint: 'A long wait only works if each part is easy to hold. Keep the build-up parallel and clean.',
      },
      {
        kind: 'order',
        goal: 'Rebuild it so the reveal comes last.',
        chunks: ['When the music stopped', 'and the lights came on', 'and everyone turned to look,', 'she was gone.'],
        why: 'Each clause turns the room toward her; the absence lands last.',
      },
      {
        kind: 'write',
        goal: 'A periodic sentence of 25 words or more: an exam result arriving. Keep it clear to the last word.',
        rules: [{ kind: 'minWords', n: 25 }],
      },
    ],
  ],
}
