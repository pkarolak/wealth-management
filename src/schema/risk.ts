export type RiskQuestion = {
  id: string
  prompt: string
  context?: string
  options: { label: string; description: string; score: number }[]
}

export const riskQuestions: RiskQuestion[] = [
  {
    id: 'drop',
    prompt: 'Your portfolio drops 20% in a month. What do you do?',
    context: 'This happened in early 2020 and again in 2022.',
    options: [
      { label: 'Sell most of it', description: 'Protect what’s left, even if I miss the recovery.', score: 1 },
      { label: 'Sell some', description: 'Move part of it to cash until things calm down.', score: 2 },
      { label: 'Hold steady', description: 'Stay the course. Markets have recovered before.', score: 3 },
      { label: 'Buy more', description: 'Prices are on sale. I’d add if I could.', score: 4 },
    ],
  },
  {
    id: 'tradeoff',
    prompt: 'Which would you rather have over 10 years?',
    options: [
      { label: 'Steady and modest', description: 'Around 4% a year, rarely down more than 5%.', score: 1 },
      { label: 'Balanced', description: 'Around 6% a year, sometimes down 15%.', score: 2 },
      { label: 'Growth', description: 'Around 8% a year, sometimes down 25%.', score: 3 },
      { label: 'Maximum growth', description: 'Around 10% a year, sometimes down 40%.', score: 4 },
    ],
  },
  {
    id: 'horizon',
    prompt: 'When will you start needing most of this money?',
    options: [
      { label: 'Within 3 years', description: 'For a purchase or living costs soon.', score: 1 },
      { label: '3 – 7 years', description: 'A medium-term goal.', score: 2 },
      { label: '7 – 15 years', description: 'Kids’ college, a later purchase.', score: 3 },
      { label: '15+ years', description: 'Mainly retirement or legacy.', score: 4 },
    ],
  },
  {
    id: 'sleep',
    prompt: 'How often would you check your account in a rough market?',
    options: [
      { label: 'Every day — it would worry me', description: '', score: 1 },
      { label: 'Every week or so', description: '', score: 2 },
      { label: 'Monthly, as usual', description: '', score: 3 },
      { label: 'I probably wouldn’t notice', description: '', score: 4 },
    ],
  },
]

export const riskProfiles = [
  { min: 0, label: 'Conservative', objective: 'Preservation with some income', description: 'Protecting what you have matters more than growth.' },
  { min: 1.75, label: 'Moderately conservative', objective: 'Income with modest growth', description: 'You want some growth but feel losses sharply.' },
  { min: 2.4, label: 'Balanced', objective: 'Balanced growth and income', description: 'You accept ups and downs for steady long-term growth.' },
  { min: 3.0, label: 'Growth', objective: 'Long-term growth', description: 'You’re comfortable riding out drops for higher returns.' },
  { min: 3.6, label: 'Aggressive growth', objective: 'Maximum long-term growth', description: 'You see downturns as opportunities.' },
]

export const scoreRisk = (answers: Record<string, number>) => {
  const scores = riskQuestions.map((q) => (answers[q.id] === undefined ? undefined : q.options[answers[q.id]]?.score)).filter((s): s is number => s !== undefined)
  if (!scores.length) return undefined
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  const profile = [...riskProfiles].reverse().find((p) => avg >= p.min) ?? riskProfiles[0]
  return { avg, answered: scores.length, complete: scores.length === riskQuestions.length, ...profile }
}
