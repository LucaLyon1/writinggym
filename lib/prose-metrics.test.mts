import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeProse, findPassive, splitSentences } from './prose-metrics.ts'
import { isWritten, rulesOf, stepsFor, drawDrill, getSubject, getTechnique, nextPuzzle, PATH, starsFor, suggestedTechnique, TECHNIQUES } from './drills.ts'
import {
  assembleOrder,
  checkMove,
  chunksOf,
  chooseOrder,
  firstBrokenRule,
  cutResult,
  judgeChoose,
  judgeCut,
  judgeOrder,
  judgeSpot,
  parseMoveJudgement,
  parseSpot,
  revealAnswer,
  seededOrder,
  segmentSentence,
  tileText,
} from './drill-moves.ts'

test('splits sentences and ignores common abbreviations', () => {
  assert.deepEqual(splitSentences('Mr. Smith left. He ran! Did he? “Yes.” Then silence'), [
    'Mr. Smith left.',
    'He ran!',
    'Did he?',
    '“Yes.”',
    'Then silence',
  ])
})

test('detects likely passive voice but not adjective states', () => {
  assert.equal(findPassive('The letter was written by her.').length, 1)
  assert.equal(findPassive('The door was quickly opened.').length, 1)
  assert.equal(findPassive('He was tired and she was scared.').length, 0)
  assert.equal(findPassive('She wrote the letter.').length, 0)
})

test('measures sentence rhythm', () => {
  const m = analyzeProse('He stopped. The corridor ran on ahead of him, lit by bulbs that hummed and flickered and gave nothing back.')
  assert.equal(m.sentences.length, 2)
  assert.equal(m.shortest, 2)
  assert.ok(m.lengthSpread > 5)
})

test('every technique defines moves or lessons', () => {
  assert.equal(new Set(TECHNIQUES.map((t) => t.id)).size, TECHNIQUES.length)
  for (const t of TECHNIQUES) assert.ok(t.moves.length > 0 || (t.lessons?.length ?? 0) > 0, t.id)
  assert.equal(PATH.length, TECHNIQUES.length)
})

test('lesson content is well formed', () => {
  for (const t of TECHNIQUES.filter((x) => x.lessons)) {
    assert.equal(t.lessons!.length, 3, `${t.id} has 3 lessons`)
    for (const lesson of t.lessons!) {
      assert.ok(lesson.some(isWritten), `${t.id}: every lesson ends in production`)
      for (const step of lesson) {
        if (step.kind === 'choose') {
          assert.equal(step.options.filter((o) => o.correct).length, 1, `${t.id}: ${step.goal}`)
        } else if (step.kind === 'spot' || step.kind === 'cut') {
          const chunks = parseSpot(step.sentence)
          assert.ok(chunks.some((c) => c.target) && chunks.some((c) => !c.target), `${t.id}: ${step.sentence}`)
          assert.equal(chunks.map((c) => c.text).join(' '), step.sentence.replace(/[[\]{}]/g, ''))
          if (step.kind === 'cut') {
            // The solved sentence must read cleanly: capital first, no stray spaces before punctuation.
            const solved = cutResult(chunks, chunks.map((c, i) => (c.target ? i : -1)).filter((i) => i >= 0))
            assert.match(solved, /^[A-Z“"]/, `${t.id}: ${solved}`)
            assert.doesNotMatch(solved, /\s[,.;:!?]|\s{2}/, `${t.id}: ${solved}`)
          }
        } else if (step.kind === 'order') {
          for (const alt of step.accept ?? []) assert.deepEqual([...alt].sort(), step.chunks.map((_, i) => i))
        } else if (step.kind === 'rewrite' && step.rules?.length) {
          // The source must break its own rule, or the exercise is empty.
          assert.ok(firstBrokenRule(checkMove(step.rules, step.source, [], 3)), `${t.id}: ${step.source}`)
        }
      }
    }
  }
})

test('Albalat rules catch repetition, clichés, filler and jingles', () => {
  const broken = (kind: string, text: string) =>
    firstBrokenRule(checkMove([{ kind } as never], text))?.status === 'fail'
  assert.ok(broken('noRepeats', 'The station was empty, so he waited in the station.'))
  assert.ok(!broken('noRepeats', 'The station was empty, so he waited on the platform.'))
  assert.ok(broken('noCliches', 'Her blood ran cold.'))
  assert.ok(!broken('noCliches', 'She could feel her pulse in her teeth.'))
  assert.ok(broken('noFiller', 'She was very tired.'))
  assert.ok(broken('noJingle', 'The information about the situation needed attention.'))
  assert.ok(!broken('noJingle', 'What the country knows needed care.'))
})

test('instant steps are judged in the browser', () => {
  const epithet = getTechnique('exact-epithet')!.lessons![0]
  const choose = epithet[0]
  assert.equal(choose.kind, 'choose')
  if (choose.kind === 'choose') {
    const right = choose.options.findIndex((o) => o.correct)
    assert.equal(judgeChoose(choose, right, true).quality, 'great')
    assert.equal(judgeChoose(choose, right, false).quality, 'good')
    assert.equal(judgeChoose(choose, (right + 1) % choose.options.length, true).quality, 'mistake')
  }

  const spot = getTechnique('echoes')!.lessons![1][0]
  if (spot.kind === 'spot') {
    const chunks = parseSpot(spot.sentence)
    const targets = chunks.map((c, i) => (c.target ? i : -1)).filter((i) => i >= 0)
    assert.equal(judgeSpot(spot, targets, true).quality, 'great')
    assert.equal(judgeSpot(spot, targets.slice(0, 1), true).quality, 'inaccuracy')
    assert.equal(judgeSpot(spot, [0], true).quality, 'mistake')
  }

  const order = getTechnique('word-order')!.lessons![0][0]
  if (order.kind === 'order') {
    assert.equal(judgeOrder(order, [0, 1, 2, 3], true).quality, 'great')
    assert.equal(judgeOrder(order, [1, 0, 2, 3], true).quality, 'good')
    assert.equal(judgeOrder(order, [3, 2, 1, 0], true).quality, 'mistake')
    assert.equal(assembleOrder(order, [0, 1, 2, 3]), 'When the doors finally opened, after three hours in the rain, there was nobody left.')
    assert.equal(tileText(order, 0), 'when the doors finally opened,')
    assert.equal(tileText(order, 3), 'nobody left')
    const shuffled = seededOrder(4, 'x')
    assert.deepEqual([...shuffled].sort(), [0, 1, 2, 3])
    assert.notDeepEqual(shuffled, [0, 1, 2, 3])
  }
})

test('lesson scales play their lessons in order and earn a star each', () => {
  const t = getTechnique('concision')!
  const first = drawDrill({ techniqueId: t.id })
  assert.equal(first.subjectId, 'lesson-1')
  assert.equal(stepsFor(t, first), t.lessons![0])
  const next = nextPuzzle(first, { [t.id]: ['lesson-1'] })
  assert.equal(next.subjectId, 'lesson-2')
  assert.equal(starsFor({ [t.id]: ['lesson-1', 'lesson-2', 'character'] }, t.id), 2)
})

test('checks move rules instantly', () => {
  const staccato = rulesOf(getTechnique('staccato')!.moves[0])
  assert.equal(firstBrokenRule(checkMove(staccato, 'The door gave.')), undefined)
  assert.equal(firstBrokenRule(checkMove(staccato, 'The door gave way under the weight of the three of us.'))?.status, 'fail')
  assert.equal(firstBrokenRule(checkMove(staccato, 'It fell. It broke.'))?.label, 'One sentence')

  const anaphora = rulesOf(getTechnique('anaphora')!.moves[1])
  assert.equal(firstBrokenRule(checkMove(anaphora, 'She ran to the door.', ['She remembered the kitchen.'])), undefined)
  assert.equal(firstBrokenRule(checkMove(anaphora, 'He ran to the door.', ['She remembered the kitchen.']))?.status, 'fail')

  const semicolon = [{ kind: 'contains', mark: 'semicolon' } as const]
  assert.equal(firstBrokenRule(checkMove(semicolon, 'It rained, we stayed.'))?.status, 'pending')
  assert.equal(firstBrokenRule(checkMove([{ kind: 'noPassive' }], 'The glass was broken.'))?.status, 'fail')
})

test('parses a judgement and keeps only highlights found in the sentence', () => {
  const sentence = 'He was patient, careful, and entirely without mercy.'
  const parsed = parseMoveJudgement(
    JSON.stringify({
      quality: 'great',
      headline: 'The third beat lands.',
      comment: 'c',
      highlights: [
        { text: 'entirely without mercy', tone: 'good', note: 'heaviest last' },
        { text: 'not in the text', tone: 'bad', note: 'x' },
      ],
      better: '',
    }),
    sentence
  )
  assert.equal(parsed?.quality, 'great')
  assert.equal(parsed?.highlights.length, 1)
  assert.equal(parseMoveJudgement('{"quality":"superb"}', sentence), null)

  const segments = segmentSentence(sentence, parsed!.highlights)
  assert.equal(segments.map((s) => s.text).join(''), sentence)
  assert.equal(segments.find((s) => s.highlight)?.text, 'entirely without mercy')
})

test('path stays on a scale until it has three stars, then moves on', () => {
  // The first subject scale on the path; everything before it is solved.
  const index = PATH.findIndex((t) => !t.lessons)
  const first = PATH[index].id
  const before = Object.fromEntries(PATH.slice(0, index).map((t) => [t.id, ['lesson-1', 'lesson-2', 'lesson-3']]))
  const drill = drawDrill({ techniqueId: first }, () => 0)
  assert.ok(getSubject(drill.subjectId)?.seeds.includes(drill.seed))

  const partly = { [first]: ['character'] }
  assert.equal(starsFor(partly, first), 1)
  const next = nextPuzzle(drill, partly, () => 0)
  assert.equal(next.techniqueId, first)
  assert.notEqual(next.subjectId, 'character')

  const done = { ...before, [first]: ['character', 'setting', 'object'] }
  assert.equal(suggestedTechnique(done).id, PATH[index + 1].id)
  assert.equal(nextPuzzle(drill, done, () => 0).techniqueId, PATH[index + 1].id)
})

test('reads the verdict from a partial stream', async () => {
  const { readPartialJudgement } = await import('./drill-moves.ts')
  assert.deepEqual(readPartialJudgement('{"quality":"gre'), { quality: undefined, headline: undefined })
  assert.deepEqual(readPartialJudgement('{"quality":"great","headline":"The \\"third\\" lands.","comm'), {
    quality: 'great',
    headline: 'The "third" lands.',
  })
})

test('cut steps rebuild the sentence and explain wrong cuts', () => {
  const step = getTechnique('cut-padding')!.lessons![0][0]
  assert.equal(step.kind, 'cut')
  if (step.kind !== 'cut') return
  const chunks = parseSpot(step.sentence)
  const index = (word: string) => chunks.findIndex((c) => c.core === word)
  const fillers = ['really', 'very', 'just'].map(index)

  assert.equal(cutResult(chunks, fillers), 'She was tired, so she went to bed.')
  assert.equal(judgeCut(step, fillers, true).quality, 'great')
  assert.equal(judgeCut(step, fillers, false).quality, 'good')

  const partial = judgeCut(step, [index('very')], true)
  assert.equal(partial.quality, 'inaccuracy')
  assert.match(partial.comment, /She was really tired, so she just went to bed\./)
  assert.ok(partial.explain)

  const wrong = judgeCut(step, [...fillers, index('tired')], true)
  assert.equal(wrong.quality, 'mistake')
  assert.equal(wrong.headline, 'You cut “tired”, which carries meaning.')
  assert.match(wrong.comment, /carries|information|holds together/)

  // Optional words can be cut or kept.
  const optional = getTechnique('cut-padding')!.lessons![0][1]
  if (optional.kind === 'cut') {
    const c = parseSpot(optional.sentence)
    const must = c.map((x, i) => (x.target ? i : -1)).filter((i) => i >= 0)
    const that = c.findIndex((x) => x.optional)
    assert.equal(judgeCut(optional, must, true).quality, 'great')
    assert.equal(judgeCut(optional, [...must, that], true).quality, 'great')
    assert.equal(cutResult(c, [...must, that]), 'She said she liked the gift.')
  }

  // An empty opening is cut and the new first word gets its capital.
  const opener = getTechnique('cut-padding')!.lessons![2][0]
  if (opener.kind === 'cut') {
    const c = parseSpot(opener.sentence)
    assert.equal(cutResult(c, c.map((x, i) => (x.target ? i : -1)).filter((i) => i >= 0)), 'Many students complained about the exam.')
  }
})

test('every wrong answer comes with an explanation', () => {
  const echoes = getTechnique('echoes')!.lessons![1][0]
  if (echoes.kind === 'spot') {
    const along = chunksOf(echoes).findIndex((c) => c.core === 'along')
    const wrong = judgeSpot(echoes, [along], true)
    assert.equal(wrong.quality, 'mistake')
    assert.match(wrong.headline, /“along” is not the problem/)
    // Tapping only a small word finds nothing, and says so.
    assert.equal(judgeSpot(echoes, [0], true).headline, 'Nothing found yet.')
    assert.ok(wrong.explain)
  }
  const choose = getTechnique('wordy-phrases')!.lessons![0][0]
  if (choose.kind === 'choose') {
    const wrongIndex = choose.options.findIndex((o) => !o.correct)
    const result = judgeChoose(choose, wrongIndex, true)
    assert.equal(result.comment, choose.options[wrongIndex].why)
    assert.ok(result.explain)
    assert.match(revealAnswer(choose).headline, /Because/)
  }
  const order = getTechnique('word-order')!.lessons![0][0]
  if (order.kind === 'order') {
    assert.match(judgeOrder(order, [3, 0, 1, 2], true).headline, /ends on “there was”/)
    assert.match(judgeOrder(order, [2, 0, 1, 3], true).headline, /ending is right/)
  }
  // Instant rules teach the principle behind them.
  for (const check of checkMove([{ kind: 'noPassive' }, { kind: 'noRepeats' }, { kind: 'maxWords', n: 3 }], 'The glass was broken by the glass blower.')) {
    if (check.status !== 'ok') assert.ok(check.lesson && check.lesson.length > 30, check.label)
  }
})

test('multiple-choice answers are spread evenly and move on a replay', () => {
  const steps = TECHNIQUES.flatMap((t) => (t.lessons ?? []).flat()).filter((s) => s.kind === 'choose')
  for (const n of [3, 4]) {
    const group = steps.filter((s) => s.kind === 'choose' && s.options.length === n)
    const counts = Array(n).fill(0)
    for (const s of group) {
      if (s.kind !== 'choose') continue
      const order = chooseOrder(s, 0)
      assert.deepEqual([...order].sort(), s.options.map((_, i) => i), 'a permutation')
      counts[order.indexOf(s.options.findIndex((o) => o.correct))]++
    }
    // Balanced by construction: no letter gets more than one extra right answer.
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${n} options: ${counts}`)
  }
  for (const s of steps) {
    if (s.kind !== 'choose') continue
    const right = s.options.findIndex((o) => o.correct)
    assert.notEqual(chooseOrder(s, 0).indexOf(right), chooseOrder(s, 1).indexOf(right), s.goal)
  }
})

test('phrases are split into word tiles so no answer stands out by its length', () => {
  const cliche = getTechnique('cliche')!.lessons![0][0]
  assert.equal(cliche.kind, 'spot')
  if (cliche.kind !== 'spot') return
  const tiles = chunksOf(cliche)
  // Every tile is a single word.
  for (const t of tiles) assert.doesNotMatch(t.text, /\s/, t.text)
  const idx = (w: string) => tiles.findIndex((t) => t.core === w && t.target)
  const grave = ['silent', 'grave'].map(idx) // "as", "the" are small words: optional
  const time = ['time', 'stood', 'still'].map(idx)
  assert.equal(judgeSpot(cliche, [...grave, ...time], true).quality, 'great')
  // Half a phrase is not enough.
  assert.equal(judgeSpot(cliche, [...grave, idx('time')], true).quality, 'inaccuracy')
  // Tapping the fresh image is a mistake, and the message names the words.
  const wrong = judgeSpot(cliche, [...grave, ...time, tiles.findIndex((t) => t.core === 'teeth')], true)
  assert.equal(wrong.quality, 'mistake')
  assert.match(wrong.headline, /teeth/)
  assert.match(revealAnswer(cliche).headline, /as silent as the grave/)
})

test('point-of-view spots use whole sentences as tiles', () => {
  const pov = getTechnique('point-of-view')!.lessons![0][0]
  if (pov.kind !== 'spot') return assert.fail('expected a spot step')
  const tiles = chunksOf(pov)
  assert.equal(tiles.length, 5)
  assert.ok(tiles.every((t) => /[.!?]$/.test(t.text)))
  const slip = tiles.findIndex((t) => t.target)
  assert.equal(tiles[slip].text, 'Across town, her brother was smiling.')
  assert.equal(judgeSpot(pov, [slip], true).quality, 'great')
  assert.equal(judgeSpot(pov, [0], true).quality, 'mistake')
})

test('voice and punctuation scales are lessons', () => {
  for (const id of ['active-only', 'strong-verbs', 'chastity', 'semicolon', 'colon', 'dash']) {
    const t = getTechnique(id)!
    assert.equal(t.lessons?.length, 3, id)
    assert.equal(t.moves.length, 0, id)
  }
})

test('the right answer is neither predictably the longest nor the shortest option', () => {
  const steps = TECHNIQUES.flatMap((t) => (t.lessons ?? []).flat()).filter((s) => s.kind === 'choose')
  let longest = 0
  let shortest = 0
  for (const s of steps) {
    if (s.kind !== 'choose') continue
    const lengths = s.options.map((o) => o.text.length)
    const right = s.options.findIndex((o) => o.correct)
    const others = lengths.filter((_, i) => i !== right)
    if (lengths[right] > Math.max(...others)) longest++
    if (lengths[right] < Math.min(...others)) shortest++
  }
  assert.ok(longest / steps.length <= 0.1, `right answer is the longest in ${longest} of ${steps.length}`)
  assert.ok(shortest / steps.length <= 0.1, `right answer is the shortest in ${shortest} of ${steps.length}`)
})
