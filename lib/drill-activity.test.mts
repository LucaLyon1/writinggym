import assert from 'node:assert/strict'
import { test } from 'node:test'
import { drillActivityDays, mergedStreak, parseDrillDays, recordDrillDay, streakStats } from './drill-activity.ts'
import { NO_DAILY } from './drills-daily.ts'

/** A local-time timestamp on a given local day, so tests hold in any time zone. */
const at = (day: string, hour = 12) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d, hour).toISOString()
}

test('parseDrillDays keeps valid days and drops junk', () => {
  assert.deepEqual(parseDrillDays(undefined), {})
  assert.deepEqual(parseDrillDays([1, 2]), {})
  assert.deepEqual(parseDrillDays({ '2026-10-01': 2, '2026-10-02': 0, nope: 3, '2026-10-03': 'x', '2026-10-04': '1' }), {
    '2026-10-01': 2,
    '2026-10-04': 1,
  })
})

test('recordDrillDay counts drills per day without mutating', () => {
  const before = { '2026-10-01': 1 }
  const after = recordDrillDay(recordDrillDay(before, '2026-10-01'), '2026-10-02')
  assert.deepEqual(after, { '2026-10-01': 2, '2026-10-02': 1 })
  assert.deepEqual(before, { '2026-10-01': 1 })
})

test('drillActivityDays backfills the daily puzzle run for older saves', () => {
  assert.deepEqual(drillActivityDays({ daily: NO_DAILY }), {})
  assert.deepEqual(drillActivityDays({ daily: { day: '2026-10-02', streak: 3, best: 3 } }), {
    '2026-10-02': 1,
    '2026-10-01': 1,
    '2026-09-30': 1,
  })
  // Recorded counts win over the backfill.
  assert.deepEqual(drillActivityDays({ days: { '2026-10-02': 4 }, daily: { day: '2026-10-02', streak: 1, best: 1 } }), {
    '2026-10-02': 4,
  })
})

test('streakStats finds the current and longest runs', () => {
  assert.deepEqual(streakStats([], '2026-10-30'), { current: 0, longest: 0 })
  const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-28', '2026-10-29', '2026-10-30']
  assert.deepEqual(streakStats(days, '2026-10-30'), { current: 3, longest: 4 })
  // Still alive the day after, broken the day after that.
  assert.equal(streakStats(days, '2026-10-31').current, 3)
  assert.equal(streakStats(days, '2026-11-01').current, 0)
})

test('streakStats runs across month and year ends', () => {
  assert.deepEqual(streakStats(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01'), { current: 3, longest: 3 })
  assert.deepEqual(streakStats(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01'), { current: 3, longest: 3 })
})

test('mergedStreak leaves the server streak alone without drills', () => {
  const server = { current: 5, longest: 9 }
  assert.equal(mergedStreak(server, [{ completed_at: at('2026-10-30') }], {}, '2026-10-30'), server)
})

test('mergedStreak joins writing and drill days', () => {
  const completions = [{ completed_at: at('2026-10-27') }, { completed_at: at('2026-10-29') }, { completed_at: null }]
  const drills = { '2026-10-28': 1, '2026-10-30': 2 }
  assert.deepEqual(mergedStreak({ current: 1, longest: 1 }, completions, drills, '2026-10-30'), { current: 4, longest: 4 })
})

test('mergedStreak never lowers the server streak', () => {
  const merged = mergedStreak({ current: 6, longest: 10 }, [], { '2026-10-30': 1 }, '2026-10-30')
  assert.deepEqual(merged, { current: 6, longest: 10 })
})

test('mergedStreak keeps longest at least the current streak', () => {
  const drills = { '2026-10-28': 1, '2026-10-29': 1, '2026-10-30': 1 }
  assert.deepEqual(mergedStreak({ current: 0, longest: 2 }, [], drills, '2026-10-30'), { current: 3, longest: 3 })
})
