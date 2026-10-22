import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_STARS, PATH, SUBJECTS, TECHNIQUES, drawDrill, drillStats, getTechnique, keysFor, rulesOf } from './drills.ts'
import { checkMove, firstBrokenRule, judgeSpot } from './drill-moves.ts'

test('drillStats starts empty', () => {
  const stats = drillStats({})
  assert.equal(stats.stars, 0)
  assert.equal(stats.mastered, 0)
  assert.equal(stats.puzzlesSolved, 0)
  assert.equal(stats.scales, TECHNIQUES.length)
  assert.equal(stats.maxStars, TECHNIQUES.length * MAX_STARS)
})

test('drillStats counts stars, mastery and puzzles past the last star', () => {
  const scale = TECHNIQUES.find((t) => !t.lessons)!
  const subjects = SUBJECTS.slice(0, MAX_STARS + 1).map((s) => s.id)
  const stats = drillStats({ [scale.id]: [...subjects, 'not-a-subject'] })
  assert.equal(stats.stars, MAX_STARS)
  assert.equal(stats.mastered, 1)
  assert.equal(stats.puzzlesSolved, MAX_STARS + 1)
  assert.equal(stats.byLevel[scale.level].mastered, 1)
  assert.equal(stats.byFamily[scale.family].stars, MAX_STARS)
})

test('the path visits every scale once, level by level', () => {
  assert.deepEqual(PATH.map((t) => t.id).sort(), TECHNIQUES.map((t) => t.id).sort())
  for (let i = 1; i < PATH.length; i++) assert.ok(PATH[i - 1].level <= PATH[i].level, `${PATH[i - 1].id} → ${PATH[i].id}`)
  for (const level of [1, 2, 3] as const) assert.ok(TECHNIQUES.filter((t) => t.level === level).length >= 6, `level ${level}`)
})

test('scales with their own subjects only draw from them, and still have three keys', () => {
  for (const t of TECHNIQUES.filter((x) => x.subjects)) {
    assert.ok(t.subjects!.every((id) => SUBJECTS.some((s) => s.id === id)), t.id)
    assert.ok(keysFor(t).length >= MAX_STARS, t.id)
    for (let i = 0; i < 20; i++) assert.ok(t.subjects!.includes(drawDrill({ techniqueId: t.id }).subjectId), t.id)
  }
  // A fixed subject the scale does not use is replaced by one it does.
  assert.notEqual(drawDrill({ techniqueId: 'dialogue', subjectId: 'statement' }).subjectId, 'statement')
})

test('named emotions break the show-the-feeling rule', () => {
  const broken = (text: string) => firstBrokenRule(checkMove([{ kind: 'noEmotionWords' }], text))?.status === 'fail'
  assert.ok(broken('He was very sad when his dog died.'))
  assert.ok(broken('She felt a wave of relief.'))
  assert.ok(!broken('He kept filling the dog’s bowl for a week.'))
})

test('a scale’s model passes the rule its moves enforce', () => {
  const poly = getTechnique('polysyndeton')!
  for (const move of poly.moves) {
    assert.equal(firstBrokenRule(checkMove(rulesOf(move), poly.example, [], 9)), undefined)
  }
})

test('the spot hint does not rule out small words when a small word is the answer', () => {
  const step = getTechnique('strong-verbs')!.lessons![1][0]
  assert.equal(step.kind, 'spot')
  if (step.kind === 'spot') assert.doesNotMatch(judgeSpot(step, [], true).comment, /never the answer/)
})

test('the daily puzzle is the same all day, valid, and changes scale every day', async () => {
  const { dailyDrill, dayKey, isSameDrill, previousDay } = await import('./drills-daily.ts')
  assert.ok(isSameDrill(dailyDrill('2026-10-04'), dailyDrill('2026-10-04')))
  let day = '2026-12-31'
  let prev = dailyDrill(day)
  const seen = new Set<string>()
  for (let i = 0; i < 120; i++) {
    const t = getTechnique(prev.techniqueId)!
    assert.ok(keysFor(t).includes(prev.subjectId), `${day}: ${prev.techniqueId} ${prev.subjectId}`)
    if (!t.lessons) assert.ok(SUBJECTS.find((s) => s.id === prev.subjectId)!.seeds.includes(prev.seed), day)
    seen.add(`${prev.techniqueId}/${prev.subjectId}`)
    day = previousDay(day)
    const next = dailyDrill(day)
    assert.notEqual(next.techniqueId, prev.techniqueId, `${day} repeats the next day's scale`)
    prev = next
  }
  // No repeat within four months: the days walk through a shuffled pool.
  assert.equal(seen.size, 120)
  assert.equal(previousDay('2026-03-01'), '2026-02-28')
  assert.equal(previousDay('2026-01-01'), '2025-12-31')
  assert.equal(dayKey(new Date(2026, 9, 4, 23, 59)), '2026-10-04')
})

test('the daily streak counts consecutive days and survives until the day after', async () => {
  const { NO_DAILY, dailyStreak, recordDaily } = await import('./drills-daily.ts')
  let r = recordDaily(NO_DAILY, '2026-10-01')
  r = recordDaily(r, '2026-10-01')
  assert.equal(r.streak, 1)
  r = recordDaily(r, '2026-10-02')
  assert.deepEqual(r, { day: '2026-10-02', streak: 2, best: 2 })
  assert.equal(dailyStreak(r, '2026-10-03'), 2)
  assert.equal(dailyStreak(r, '2026-10-04'), 0)
  assert.deepEqual(recordDaily(r, '2026-10-05'), { day: '2026-10-05', streak: 1, best: 2 })
})
