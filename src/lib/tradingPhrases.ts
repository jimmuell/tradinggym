export const EMOTIONAL_READINESS_PHRASES: string[] = [
  "Trust your system. The edge plays out over many trades, not this one.",
  "Patience is a position. Wait for your setup.",
  "You don't need to trade today. You need to trade well.",
  "The market will be here tomorrow. Protect your capital.",
  "Discipline is choosing what you want most over what you want now.",
  "One good trade doesn't make a career. One bad habit can end one.",
  "Plan the trade. Trade the plan. Review the result.",
  "The best traders are the best waiters.",
  "Risk management isn't optional — it's the whole game.",
  "A skipped trade is better than a forced trade. Every time.",
  "You are not your last trade. Reset and execute.",
  "Small losses are tuition. Blown accounts are dropout notices.",
  "The setup doesn't care about your opinion. Follow the rules.",
  "Consistency beats intensity. Show up, follow the plan, repeat.",
  "Your edge is not the strategy — it's your ability to follow it.",
  "Breathe. The opening range isn't going anywhere without you.",
  "The goal today isn't profit — it's flawless execution.",
  "Every checklist item you complete tilts the odds in your favor.",
  "Trade like a machine. Review like a scientist. Improve like an athlete.",
  "You've done the work. Trust the preparation.",
];

export function getRandomEmotionalReadinessPhrase(): string {
  return EMOTIONAL_READINESS_PHRASES[
    Math.floor(Math.random() * EMOTIONAL_READINESS_PHRASES.length)
  ];
}
