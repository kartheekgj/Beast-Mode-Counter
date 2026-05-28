export const MOTIVATIONAL_QUOTES = [
  "Pain is temporary, pride is forever.",
  "One more rep changes everything.",
  "Discipline beats motivation every day.",
  "Be stronger than your strongest excuse.",
  "Your mind is your primary muscle. Train it.",
  "What hurts today makes you stronger tomorrow.",
  "Suffer the pain of discipline or the pain of regret.",
  "You don't have to go fast, you just have to go.",
  "Be beast in the gym, remain humble in life.",
  "Great things never came from comfort zones.",
  "Success isn't always about greatness. It's about consistency.",
  "Obsessed is just a word the lazy use to describe the dedicated.",
  "The only bad workout is the one that didn't happen.",
  "Sweat is just fat crying.",
  "Make yourself proud today.",
  "The body achieves what the mind believes."
];

export function getRandomQuote(excludeText?: string): string {
  const pool = excludeText ? MOTIVATIONAL_QUOTES.filter(q => q !== excludeText) : MOTIVATIONAL_QUOTES;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
