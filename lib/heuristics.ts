/**
 * Hybrid Statistical Stylometric Engine (GPTZero + ZeroGPT Fused Signals)
 * 
 * Mathematical Formulation:
 * 1. Sentence Burstiness Coefficient (ZeroGPT-style):
 *    L = {l_1, ..., l_k} (sentence lengths in words)
 *    mu_L = mean(L), sigma_L = std(L)
 *    B_sent = (sigma_L - mu_L) / (sigma_L + mu_L)   in [-1, 1]
 *    (Low variance near -1 indicates AI uniformity; positive values indicate human rhythm).
 * 
 * 2. Clause-level Burstiness:
 *    C = {c_1, ..., c_m} (sub-clause lengths)
 *    B_clause = (sigma_C - mu_C) / (sigma_C + mu_C)
 * 
 * 3. Composite Burstiness:
 *    B_comp = 0.55 * B_sent + 0.45 * B_clause
 * 
 * 4. Lexical Entropy & Type-Token Ratio (TTR):
 *    TTR = unique_tokens / total_tokens
 * 
 * 5. Passive Voice & Repetitive N-grams:
 *    Scans for passive constructions and formulaic AI transition markers.
 */

export interface HeuristicAnalysis {
  perplexityScore: number;
  burstinessScore: number;
  vocabularyScore: number;
  aiProbability: number;
  sentenceCount: number;
  wordCount: number;
  averageSentenceLength: number;
  b_sent: number;
  b_clause: number;
  b_comp: number;
  aiPhraseCount: number;
  passiveVoiceCount: number;
  trigramRepetition: number;
}

const AI_PHRASES = [
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bin conclusion\b/gi,
  /\bto summarize\b/gi,
  /\bin summary\b/gi,
  /\bit is important to note\b/gi,
  /\bit is worth noting\b/gi,
  /\bdelve(?:s|d|ing)? into\b/gi,
  /\btestament to\b/gi,
  /\btapestry\b/gi,
  /\bbustling\b/gi,
  /\bparamount\b/gi,
  /\bseamlessly\b/gi,
  /\bharnessing the power\b/gi,
  /\bin today's rapidly\b/gi,
  /\bplays a crucial role\b/gi,
  /\bplays a pivotal role\b/gi,
  /\bnot only.*but also\b/gi,
  /\bnavigating the complexities\b/gi,
  /\bstands as a\b/gi,
];

const PASSIVE_REGEX = /\b(is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en|built|done|made|seen|written|found|given|taken|known)\b/gi;

export function analyzeHeuristics(text: string): HeuristicAnalysis {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      perplexityScore: 0,
      burstinessScore: 0,
      vocabularyScore: 0,
      aiProbability: 0,
      sentenceCount: 0,
      wordCount: 0,
      averageSentenceLength: 0,
      b_sent: 0,
      b_clause: 0,
      b_comp: 0,
      aiPhraseCount: 0,
      passiveVoiceCount: 0,
      trigramRepetition: 0,
    };
  }

  // 1. Sentence splitting
  const rawSentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).map((s) => s.trim()).filter(Boolean);
  const sentences = rawSentences.length > 0 ? rawSentences : [cleanText];
  const sentenceCount = sentences.length;

  // Words and tokens
  const words = cleanText.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const wordCount = Math.max(1, words.length);

  // 2. Sentence Lengths L = {l_1, ..., l_k}
  const sentenceLengths = sentences.map((s) => {
    const sWords = s.match(/\b[a-z0-9'-]+\b/g) || [];
    return sWords.length;
  }).filter((len) => len > 0);

  const k = Math.max(1, sentenceLengths.length);
  const mu_L = sentenceLengths.reduce((a, b) => a + b, 0) / k;
  const variance_L = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - mu_L, 2), 0) / k;
  const sigma_L = Math.sqrt(variance_L);

  // ZeroGPT-style sentence burstiness coefficient: B_sent = (sigma - mu) / (sigma + mu)
  const denom_L = sigma_L + mu_L;
  const b_sent = denom_L > 0 ? (sigma_L - mu_L) / denom_L : -1.0;

  // 3. Clause-level burstiness
  const clauseLengths: number[] = [];
  for (const s of sentences) {
    const clauses = s.split(/[,;:\—\–\-]/).map((c) => c.trim()).filter(Boolean);
    for (const c of clauses) {
      const cWords = c.match(/\b[a-z0-9'-]+\b/g) || [];
      if (cWords.length > 0) clauseLengths.push(cWords.length);
    }
  }

  const m = Math.max(1, clauseLengths.length);
  const mu_C = clauseLengths.reduce((a, b) => a + b, 0) / m;
  const variance_C = clauseLengths.reduce((acc, len) => acc + Math.pow(len - mu_C, 2), 0) / m;
  const sigma_C = Math.sqrt(variance_C);
  const denom_C = sigma_C + mu_C;
  const b_clause = denom_C > 0 ? (sigma_C - mu_C) / denom_C : -1.0;

  // Composite burstiness
  const b_comp = 0.55 * b_sent + 0.45 * b_clause;

  // Burstiness AI likelihood: B_comp near -1 -> high AI; B_comp > -0.2 -> human
  const burstinessAiProb = 1.0 / (1.0 + Math.exp((b_comp + 0.35) * 5.5));

  // 4. Vocabulary Diversity (Type-Token Ratio - TTR)
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / wordCount;
  const expectedTtr = Math.min(1, 1.2 / Math.log10(wordCount + 10));
  const vocabUniformity = Math.max(0, Math.min(1, 1 - (ttr / (expectedTtr || 1))));

  // 5. Passive Voice & AI Phrase Matches
  const passiveMatches = cleanText.match(PASSIVE_REGEX) || [];
  const passiveRatio = (passiveMatches.length / sentenceCount);

  let aiPhraseMatches = 0;
  for (const regex of AI_PHRASES) {
    const matches = cleanText.match(regex);
    if (matches) aiPhraseMatches += matches.length;
  }
  const aiPhraseDensity = (aiPhraseMatches / wordCount) * 100;

  // 6. Trigram repetition
  let trigramRepetition = 0;
  if (words.length >= 3) {
    const trigrams = [];
    for (let i = 0; i <= words.length - 3; i++) {
      trigrams.push(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
    }
    const uniqueTrigrams = new Set(trigrams);
    trigramRepetition = (trigrams.length - uniqueTrigrams.size) / trigrams.length;
  }

  // 7. Fused Probability (ZeroGPT + Stylometric signals)
  const rawLogit =
    2.5 * burstinessAiProb +
    1.8 * vocabUniformity +
    2.2 * Math.min(1.0, aiPhraseDensity / 2.5) +
    1.2 * Math.min(1.0, passiveRatio / 0.8) +
    1.5 * trigramRepetition -
    2.8;

  const aiProbability = Math.round((1.0 / (1.0 + Math.exp(-rawLogit))) * 100) / 100;

  return {
    perplexityScore: Math.round((1 - vocabUniformity) * 100),
    burstinessScore: Math.round((b_comp + 1) * 50), // Map [-1, 1] to [0, 100]
    vocabularyScore: Math.round(ttr * 100),
    aiProbability: Math.max(0.01, Math.min(0.99, aiProbability)),
    sentenceCount,
    wordCount,
    averageSentenceLength: Math.round(mu_L * 10) / 10,
    b_sent: Math.round(b_sent * 100) / 100,
    b_clause: Math.round(b_clause * 100) / 100,
    b_comp: Math.round(b_comp * 100) / 100,
    aiPhraseCount: aiPhraseMatches,
    passiveVoiceCount: passiveMatches.length,
    trigramRepetition: Math.round(trigramRepetition * 100) / 100,
  };
}
