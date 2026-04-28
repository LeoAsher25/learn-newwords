export function normalizeAnswer(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

export function isAnswerCorrect(input: string, answer: string): boolean {
  const normalizedInput = normalizeAnswer(input);
  const normalizedAnswer = normalizeAnswer(answer);

  return normalizedInput === normalizedAnswer;
}
