/**
 * Estimate cost breakdown for a user's voice calls.
 * Mirrors backend OPENAI_PRICING constants.
 */
export function estimate_cost_breakdown(voiceCalls) {
  const whisper = voiceCalls * 0.006 * 0.5;
  const gptInput = (voiceCalls * 800 / 1_000_000) * 0.15;
  const gptOutput = (voiceCalls * 150 / 1_000_000) * 0.6;
  return {
    whisper,
    gpt: gptInput + gptOutput,
    total: whisper + gptInput + gptOutput,
  };
}
