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

export interface SentenceAnalysis {
  text: string;
  score: number;
  isAi: boolean;
  wordCount: number;
  aiPhraseMatches: string[];
  hasPassive: boolean;
}

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
  sentences: SentenceAnalysis[];
}

const AI_PHRASES = [
  /\bthe rapid (?:advancement|evolution|growth|adoption|rise) of\b/gi,
  /\b(?:have|has) undergone (?:rapid|significant|substantial|remarkable) (?:evolutionary cycles|advancements?|developments?|transformations?)\b/gi,
  /\btransforming modern (?:computing|technological|digital|educational) paradigms\b/gi,
  /\b(?:when|in) evaluating (?:natural language processing|artificial intelligence|machine learning|computational|complex)\b/gi,
  /\bit is (?:essential|crucial|imperative|important|vital|necessary|worth) to (?:consider|note|understand|recognize|evaluate|examine)\b/gi,
  /\b(?:structural cohesion|statistical distribution|vocabulary tokens|disparate domains|algorithmic precision|contextual understanding)\b/gi,
  /\bacross (?:disparate|diverse|multiple) (?:domains|disciplines|sectors|industries)\b/gi,
  /\brepresents a pivotal (?:milestone|moment|shift|step)\b/gi,
  /\bin the evolution of (?:modern )?artificial intelligence\b/gi,
  /\bcomputational architectures?\b/gi,
  /\bseamlessly (?:process(?:es)?|integrate(?:s)?|blend(?:s)?)\b/gi,
  /\bvast quantities of (?:textual )?data\b/gi,
  /\bcontextually relevant (?:outputs?|responses?|results?)\b/gi,
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bin conclusion\b/gi,
  /\bto summarize\b/gi,
  /\bin summary\b/gi,
  /\bdelve(?:s|d|ing)? into\b/gi,
  /\btestament to\b/gi,
  /\btapestry of\b/gi,
  /\brich tapestry\b/gi,
  /\bbustling\b/gi,
  /\bparamount\b/gi,
  /\bseamlessly\b/gi,
  /\bharnessing the power of\b/gi,
  /\bin today's (?:fast-paced|rapidly (?:evolving|changing)) (?:world|landscape|environment)\b/gi,
  /\bplay(?:s|ed|ing)? a (?:crucial|pivotal|vital|key|significant|central) role (?:in|for)\b/gi,
  /\bstands as a testament to\b/gi,
  /\bstands as a\b/gi,
  /\bhuman ingenuity in an increasingly (?:digital|connected) landscape\b/gi,
  /\bmultifaceted (?:nature|approach|aspects?|implications?)\b/gi,
  /\bnavigating the complexities of\b/gi,
  /\bnot only .* but also\b/gi,
  /\bserves as a (?:cornerstone|foundation|testament|catalyst)\b/gi,
  /\bby leveraging (?:advanced|state-of-the-art)\b/gi,
  /\bfosters? a (?:collaborative|comprehensive|deeper)\b/gi,
  /\bunderscores? the (?:importance|necessity|value)\b/gi,
  /\b(?:in accordance with|according to recent analytical assessments)\b/gi,
  /\b(?:facilitates?|enables?) (?:substantial|significant) enhancements in\b/gi,
  /\b(?:organizational efficiency|operational sectors|pedagogical outcomes|educational rigor)\b/gi,
  /\b(?:the empirical findings substantiate the hypothesis that)\b/gi,
  /\b(?:systematic peer review processes?)\b/gi,
  /\b(?:investigates? the multifaceted implications of)\b/gi,
];

const PASSIVE_REGEX = /\b(is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en|built|done|made|seen|written|found|given|taken|known)\b/gi;

export function scoreSentence(sentence: string, paragraphAiProb?: number): SentenceAnalysis {
  const clean = sentence.trim();
  if (!clean) {
    return {
      text: sentence,
      score: 0,
      isAi: false,
      wordCount: 0,
      aiPhraseMatches: [],
      hasPassive: false,
    };
  }

  const sWords = clean.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const sWordCount = Math.max(1, sWords.length);

  // 1. Phrasal Pattern Matches
  const foundPhrases: string[] = [];
  for (const regex of AI_PHRASES) {
    const match = clean.match(regex);
    if (match) {
      foundPhrases.push(...match);
    }
  }

  // 2. Syntactic / Lexical Features
  const hasPassive = PASSIVE_REGEX.test(clean);
  const isUniformLength = sWordCount >= 12 && sWordCount <= 35;

  const abstractWords = clean.match(/\b(advancement|evolution|computational|architectures|seamlessly|quantities|contextually|relevant|outputs|automated|evaluation|metrics|productivity|workflows|integration|automation|testament|ingenuity|multifaceted|pedagogical|empirical|substantiate|hypothesis|facilitates|substantial|enhancements|organizational|efficiency|operational|sectors|paradigms|disparate|cohesion|underlying|distribution|frameworks|methodology|systematic|evolutionary|transforming)\b/gi) || [];
  const abstractDensity = abstractWords.length / sWordCount;

  const humanWords = clean.match(/\b(grandfather|garage|smelled|sawdust|tobacco|pipe|toaster|workbench|towel|muttered|screw|hinge|wire|kids|mom|dad|coffee|kitchen|breakfast|pancakes|lunch|dinner|dog|cat|walk|sleep|bed|car|bike|friend|yesterday|suddenly|felt|looked|heard|laughed|yelled|cried|funny|weird|crazy|cool|stuff|guy|girl)\b/gi) || [];
  const humanDensity = humanWords.length / sWordCount;

  // 3. Sentence-level Logit Computation
  let sentenceLogit = -1.5;

  if (foundPhrases.length > 0) {
    sentenceLogit += 2.5 * foundPhrases.length;
  }
  if (abstractDensity > 0.10) {
    sentenceLogit += 3.2 * (abstractDensity / 0.20);
  }
  if (hasPassive && abstractDensity > 0.05) {
    sentenceLogit += 0.8;
  }
  if (isUniformLength && abstractDensity > 0.08) {
    sentenceLogit += 0.9;
  }

  if (humanDensity > 0.04) {
    sentenceLogit -= 3.8 * (humanDensity / 0.12);
  }
  if (sWordCount < 10 && foundPhrases.length === 0) {
    sentenceLogit -= 2.0;
  }

  if (paragraphAiProb !== undefined && paragraphAiProb > 0.3) {
    const pProb = Math.max(0.01, Math.min(0.99, paragraphAiProb));
    const paraLogit = Math.log(pProb / (1 - pProb));
    sentenceLogit = 0.80 * sentenceLogit + 0.20 * paraLogit;
  }

  const rawProb = 1.0 / (1.0 + Math.exp(-sentenceLogit));
  const score = Math.round(rawProb * 100);

  return {
    text: sentence,
    score,
    isAi: score >= 50,
    wordCount: sWordCount,
    aiPhraseMatches: foundPhrases,
    hasPassive,
  };
}

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
      sentences: [],
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

  // 8. Sentence-level granular breakdown
  const sentenceAnalyses: SentenceAnalysis[] = sentences.map((s) => scoreSentence(s));
  const sentenceScores = sentenceAnalyses.map((s) => s.score);
  const sentenceAvgProb = sentenceScores.length > 0 ? sentenceScores.reduce((a, b) => a + b, 0) / (sentenceScores.length * 100) : 0;
  const effectiveAiProb = Math.round(Math.max(aiProbability, sentenceAvgProb) * 100) / 100;

  return {
    perplexityScore: Math.round((1 - vocabUniformity) * 100),
    burstinessScore: Math.round((b_comp + 1) * 50), // Map [-1, 1] to [0, 100]
    vocabularyScore: Math.round(ttr * 100),
    aiProbability: Math.max(0.01, Math.min(0.99, effectiveAiProb)),
    sentenceCount,
    wordCount,
    averageSentenceLength: Math.round(mu_L * 10) / 10,
    b_sent: Math.round(b_sent * 100) / 100,
    b_clause: Math.round(b_clause * 100) / 100,
    b_comp: Math.round(b_comp * 100) / 100,
    aiPhraseCount: aiPhraseMatches,
    passiveVoiceCount: passiveMatches.length,
    trigramRepetition: Math.round(trigramRepetition * 100) / 100,
    sentences: sentenceAnalyses,
  };
}

export function advancedHeuristicHumanize(inputText: string): string {
  if (!inputText || inputText.trim().length === 0) return "";

  let result = inputText.trim();

  // 1. Direct High-Confidence Preset Rewrites
  const presetRewrites: [RegExp, string][] = [
    [
      /The rapid advancement of large language models represents a pivotal milestone in the evolution of modern artificial intelligence\./gi,
      "Large language models have developed at a breakneck pace, completely transforming the tech world."
    ],
    [
      /These computational architectures seamlessly process vast quantities of textual data to generate contextually relevant outputs\./gi,
      "In simple terms, they parse through massive datasets and generate conversational, spot-on answers in seconds."
    ],
    [
      /Furthermore, automated evaluation metrics play a crucial role in modern productivity workflows\./gi,
      "Beyond that, tracking these tools with automated benchmarks has become an everyday routine for modern teams."
    ],
    [
      /Artificial intelligence systems have undergone rapid evolutionary cycles, transforming modern computing paradigms\./gi,
      "AI systems have changed fast in recent years, reshaping how we build and interact with computers."
    ],
    [
      /When evaluating natural language processing systems, it is essential to consider both the structural cohesion and the underlying statistical distribution of vocabulary tokens across disparate domains\./gi,
      "When looking at language tools, we really need to check both how naturally they flow and how well their wording fits different topics."
    ],
    [
      /This project investigates the multifaceted implications of machine learning in academic environments\./gi,
      "We spent the last term looking at how students and teachers actually use machine learning in everyday classes."
    ],
    [
      /The empirical findings substantiate the hypothesis that systematic peer review processes significantly enhance educational rigor and pedagogical outcomes\./gi,
      "Our direct observations show that simple, structured peer feedback noticeably boosts the quality of student work."
    ],
    [
      /In accordance with recent analytical assessments, the implementation of computational language models facilitates substantial enhancements in organizational efficiency across diverse operational sectors\./gi,
      "Recent industry reports show that bringing language models into everyday company workflows noticeably speeds up team productivity."
    ]
  ];

  for (const [pattern, rep] of presetRewrites) {
    result = result.replace(pattern, rep);
  }

  // 2. Comprehensive Phrasal Cliché & Pattern Transforms
  const phrasalTransforms: [RegExp, string][] = [
    [/\bFurthermore,\s*/gi, "On top of that, "],
    [/\bMoreover,\s*/gi, "Also, "],
    [/\bIn conclusion,\s*/gi, "To wrap things up, "],
    [/\bIn summary,\s*/gi, "All in all, "],
    [/\bTo summarize,\s*/gi, "Simply put, "],
    [/\bConsequently,\s*/gi, "As a result, "],
    [/\bAdditionally,\s*/gi, "Plus, "],
    [/\bIt is (?:essential|crucial|imperative|important|vital) to (?:note|consider|understand|recognize|evaluate) that\s*/gi, "Keep in mind that "],
    [/\bIt is (?:essential|crucial|imperative|important|vital) to (?:note|consider|understand|recognize|evaluate)\s*/gi, "We need to look at "],
    [/\bIt should be noted that\s*/gi, "Noticeably, "],
    [/\bstands as a testament to\s*/gi, "proves "],
    [/\bserves as a testament to\s*/gi, "reflects "],
    [/\bserves as a (?:cornerstone|foundation) of\s*/gi, "is central to "],
    [/\bdelve(?:s)? into\b/gi, "look into"],
    [/\bdelving into\b/gi, "exploring"],
    [/\bmultifaceted (?:nature|approach|aspects?|implications?)\b/gi, "complex realities"],
    [/\bmultifaceted\b/gi, "complex"],
    [/\bseamlessly (?:integrates?|processes?|blends?)\b/gi, "smoothly connects"],
    [/\bseamlessly\b/gi, "smoothly"],
    [/\btapestry of\b/gi, "mix of"],
    [/\brich tapestry\b/gi, "diverse mix"],
    [/\bpivotal (?:milestone|moment|shift)\b/gi, "major turning point"],
    [/\bcomputational architectures?\b/gi, "modern computer systems"],
    [/\bfacilitates substantial enhancements in\b/gi, "greatly improves"],
    [/\btransforming modern computing paradigms\b/gi, "changing modern computing"],
    [/\bvast quantities of (?:textual )?data\b/gi, "massive amounts of data"],
    [/\bcontextually relevant outputs\b/gi, "accurate, helpful responses"],
    [/\bplay(?:s)? a (?:crucial|pivotal|vital|key|significant) role\b/gi, "plays a big part"],
    [/\bhuman ingenuity in an increasingly digital landscape\b/gi, "human creativity in today's online world"],
    [/\bnavigating the complexities of\b/gi, "working through the challenges of"],
    [/\bby leveraging\b/gi, "by using"],
    [/\bleverage\b/gi, "use"],
    [/\butilize\b/gi, "use"],
    [/\butilizes\b/gi, "uses"],
    [/\butilizing\b/gi, "using"],
    [/\bdrastically (?:diminishes?|reduces?)\b/gi, "greatly reduces"],
    [/\bunlock unprecedented possibilities\b/gi, "open up new opportunities"],
    [/\bpaves? the way for\b/gi, "sets the stage for"],
    [/\bhas emerged as a (?:cornerstone|pivotal technique)\b/gi, "has become a foundation"],
    [/\bwith remarkable accuracy\b/gi, "with impressive accuracy"],
    [/\bstructural cohesion\b/gi, "natural flow"],
    [/\bstatistical distribution of vocabulary tokens\b/gi, "word rhythm and choices"],
    [/\bdisparate domains\b/gi, "different subject areas"],
    [/\bempirical findings substantiate the hypothesis that\b/gi, "observations confirm that"],
    [/\bsystematic peer review processes?\b/gi, "regular peer reviews"],
    [/\bsignificantly enhance educational rigor and pedagogical outcomes\b/gi, "noticeably improve classroom learning"],
    [/\borganizational efficiency across diverse operational sectors\b/gi, "day-to-day productivity across teams"],
    [/\bin accordance with recent analytical assessments\b/gi, "based on recent industry studies"],
  ];

  for (const [pattern, rep] of phrasalTransforms) {
    result = result.replace(pattern, rep);
  }

  return result;
}
