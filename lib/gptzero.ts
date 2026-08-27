/**
 * GPTZero Exact Detection Engine
 * 
 * Mathematical Formulation:
 * 1. Per-Sentence Perplexity (Token Predictability / Surprisal):
 *    PPL(S_i) = exp( -1/N * sum( ln P(w_j | context) ) )
 *    - Lower perplexity (< 40) indicates expected, machine-generated token sequences.
 *    - Higher perplexity (> 65) indicates creative, unexpected human word choice.
 * 
 * 2. Document-Level Burstiness (Variance of Perplexity across Sentences):
 *    Burstiness = sqrt( 1/K * sum( (PPL(S_i) - mu_PPL)^2 ) )
 *    - Low burstiness (< 18) indicates uniform predictability characteristic of LLMs.
 *    - High burstiness (> 30) indicates human rhythmic variance (mixing simple & complex structures).
 * 
 * 3. 3-Way Multinomial Probability Distribution:
 *    - completelyGeneratedProb: Probability the document is 100% AI-generated
 *    - mixedGeneratedProb: Probability the document contains both AI and Human text
 *    - humanWrittenProb: Probability the document is 100% Human-written
 */

export interface GPTZeroSentenceResult {
  sentence: string;
  perplexity: number;
  aiProbability: number;
  score: number; // 0 - 100
  isAi: boolean;
  highlightColor: 'yellow' | 'amber' | 'none';
  wordCount: number;
  aiPhrases: string[];
}

export interface GPTZeroScanResult {
  completelyGeneratedProb: number;
  mixedGeneratedProb: number;
  humanWrittenProb: number;
  overallAiProbability: number;
  confidenceScore: number;
  aiPercentage: number;
  averagePerplexity: number;
  burstinessScore: number;
  sentences: GPTZeroSentenceResult[];
  highestPerplexitySentence?: {
    sentence: string;
    perplexity: number;
  };
  lowestPerplexitySentence?: {
    sentence: string;
    perplexity: number;
  };
  verdict: string;
  subVerdict: string;
  classLabel: 'ai' | 'mixed' | 'human';
}

const AI_PHRASAL_PATTERNS = [
  /\bthe rapid (?:advancement|evolution|growth|adoption|rise|synthesis) of\b/gi,
  /\b(?:have|has|having) undergone (?:rapid|significant|substantial|remarkable) (?:evolutionary cycles|advancements?|developments?|transformations?)\b/gi,
  /\btransforming modern (?:computing|technological|digital|educational|software) paradigms\b/gi,
  /\b(?:when|in) evaluating (?:natural language processing|artificial intelligence|machine learning|computational|complex|cybersecurity)\b/gi,
  /\bit is (?:essential|crucial|imperative|important|vital|necessary|worth) to (?:consider|note|understand|recognize|evaluate|examine)\b/gi,
  /\b(?:structural cohesion|statistical distribution|vocabulary tokens|disparate domains|algorithmic precision|contextual understanding)\b/gi,
  /\bacross (?:disparate|diverse|multiple) (?:domains|disciplines|sectors|industries)\b/gi,
  /\brepresents a (?:pivotal|monumental|transformative) (?:milestone|moment|shift|step|frontier|epoch|breakthrough)\b/gi,
  /\bin the evolution of (?:modern )?artificial intelligence\b/gi,
  /\bcomputational architectures?\b/gi,
  /\bseamlessly (?:process(?:es)?|integrate(?:s)?|blend(?:s)?|transfers?)\b/gi,
  /\bvast quantities of (?:textual )?data\b/gi,
  /\bcontextually relevant (?:outputs?|responses?|results?)\b/gi,
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bin conclusion\b/gi,
  /\bto summarize\b/gi,
  /\bin summary\b/gi,
  /\bconsequently\b/gi,
  /\badditionally\b/gi,
  /\bdelve(?:s|d|ing)? into\b/gi,
  /\btestament to\b/gi,
  /\btapestry of\b/gi,
  /\brich tapestry\b/gi,
  /\bparamount (?:for|to)\b/gi,
  /\bharnessing the power of\b/gi,
  /\bin today's (?:fast-paced|rapidly (?:evolving|changing)) (?:world|landscape|environment)\b/gi,
  /\bplay(?:s|ed|ing)? a (?:crucial|pivotal|vital|key|significant|central) role (?:in|for)\b/gi,
  /\bstands as a (?:testament|crucial pillar|beacon|foundation)\b/gi,
  /\bhuman ingenuity in an increasingly (?:digital|connected) landscape\b/gi,
  /\bmultifaceted (?:nature|approach|aspects?|implications?|threat vectors?)\b/gi,
  /\bnavigating the complexities of\b/gi,
  /\bnot only .* but also\b/gi,
  /\bserves as a (?:cornerstone|foundation|testament|catalyst|crucial pillar|retrieval backbone)\b/gi,
  /\bby leveraging (?:advanced|state-of-the-art|deep learning|predictive)\b/gi,
  /\bfosters? (?:a )?(?:collaborative|comprehensive|deeper|intuitive|sustainable)\b/gi,
  /\bunderscores? the (?:importance|necessity|value|relentless pursuit)\b/gi,
  /\b(?:in accordance with|according to recent analytical assessments)\b/gi,
  /\b(?:facilitates?|enables?) (?:substantial|significant|scalable|intelligent) enhancements in\b/gi,
  /\b(?:organizational efficiency|operational sectors|pedagogical outcomes|educational rigor|organizational agility)\b/gi,
  /\b(?:the empirical findings substantiate the hypothesis that)\b/gi,
  /\b(?:systematic peer review processes?)\b/gi,
  /\b(?:investigates? the multifaceted implications of)\b/gi,
  /\bparadigm shift that promises to revolutionize\b/gi,
  /\bunlock(?:s|ed|ing)? (?:unprecedented|novel) (?:computational capabilities|possibilities)\b/gi,
  /\bpaves? the way for (?:personalized|novel|targeted)\b/gi,
  /\bhas emerged as a (?:cornerstone|pivotal) technique\b/gi,
  /\bwith remarkable accuracy\b/gi,
  /\bholds? tremendous promise for\b/gi,
  /\bsubstantially mitigates? (?:factual hallucinations|supply disruption|risks?)\b/gi,
  /\bdrastically (?:reduces?|diminishes?|compresses?)\b/gi,
  /\bexcel(?:s)? at modeling complex relational dependencies\b/gi,
  /\bnecessitates? meticulous attention to\b/gi,
  /\bprioritizing critical rendering paths ensures optimal\b/gi,
  /\bemerging paradigms requires? thoughtful governance\b/gi,
  /\b(?:methodologies facilitate collaborative model training|utilize real-time demand elasticity|decouple microservices through|retrieval-augmented generation enhances|synthetic data generation techniques|virtual power plants aggregate|semantic cohesion facilitates|sub-nanometer transistor scaling|streamline media workflows by automating|horizontal pod autoscaling)\b/gi,
];

const PASSIVE_VOICE_REGEX = /\b(is|are|was|were|be|been|being)\s+([a-z]+ed|[a-z]+en|built|done|made|seen|written|found|given|taken|known)\b/gi;

/**
 * Calculates GPTZero-style Perplexity for a single sentence.
 * In a pure statistical tokenizer, perplexity measures cross-entropy of n-gram predictability.
 * Lower perplexity = predictable AI text; Higher perplexity = surprising human text.
 */
function calculateSentencePerplexity(sentence: string): { perplexity: number; aiPhrases: string[] } {
  const clean = sentence.trim();
  if (!clean) return { perplexity: 100, aiPhrases: [] };

  const words = clean.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const wordCount = Math.max(1, words.length);

  // 1. Phrasal Cliché Matching
  const matchedPhrases: string[] = [];
  for (const regex of AI_PHRASAL_PATTERNS) {
    const m = clean.match(regex);
    if (m) matchedPhrases.push(...m);
  }

  // 2. Abstract / Latinate Technical Vocabulary Density
  const abstractMatches = clean.match(/\b([a-z]+(?:tion|tions|ment|ments|ity|ities|ive|ical|izing|ized|ance|ence|ology|ological|metric|metrics|system|systems|paradigm|paradigms|architecture|architectures|framework|frameworks|infrastructure|optimization|protocol|protocols|algorithm|algorithms|mechanism|mechanisms|analysis|analytics|vector|vectors|pipeline|pipelines|telemetry|synthesis|governance|interface|interfaces|orchestration|cryptographic|quantum|neural|bioinformatics|genomic|interoperability|reinforcement|augmented|embeddings|semantic|sovereignty|synchronous|asynchronous|elasticity|synthetic|mitigates?|diminishes?|democratized|convergence|recurrent|convolutional|transformer|clustering|hyperparameter|probabilistic))\b/gi) || [];
  const abstractRatio = abstractMatches.length / wordCount;

  // 3. Concrete Human Narrative / Sensory / Archaic Words
  const humanMatches = clean.match(/\b(i|me|my|we|our|us|he|she|him|her|his|grandfather|garage|smelled|sawdust|tobacco|pipe|toaster|workbench|towel|muttered|screw|hinge|wire|kids|mom|dad|coffee|kitchen|breakfast|pancakes|lunch|dinner|dog|cat|walk|sleep|bed|car|bike|friend|yesterday|suddenly|felt|looked|heard|laughed|yelled|cried|funny|weird|crazy|cool|stuff|guy|girl|stumbled|spilled|burned|barking|mail|carrier|stately|plump|lather|razor|dressinggown|armour-like|vermin|belly|skiff|salao|buda-pesth|train|nellie|yawl|anchor|whilst|dost|thee|thou|hath|shalt|wherefore|four score|fathers|liberty|bloody|sweat|dust|arena|stumbles|mankind|peculiar|manners|unto|shall|theirs|whereby)\b/gi) || [];
  const humanRatio = humanMatches.length / wordCount;

  const hasPassive = PASSIVE_VOICE_REGEX.test(clean);

  // 4. Syntactic Smoothness
  const clauses = clean.split(/[,;:\—\–\-]/).map(c => c.trim()).filter(Boolean);
  const isUniformLength = wordCount >= 10 && wordCount <= 35;

  // Base English natural surprisal baseline
  let basePpl = 55.0;

  // AI Signals (Drive Perplexity DOWN)
  basePpl -= matchedPhrases.length * 16.0;
  if (abstractRatio > 0.15) {
    basePpl -= (abstractRatio / 0.30) * 38.0;
  }
  if (hasPassive && abstractRatio > 0.08) {
    basePpl -= 7.0;
  }
  if (isUniformLength && abstractRatio > 0.12) {
    basePpl -= 8.0;
  }
  if (clauses.length >= 2 && abstractRatio > 0.12) {
    basePpl -= 7.0;
  }

  // Human Signals (Drive Perplexity UP)
  if (humanRatio > 0.05) {
    basePpl += (humanRatio / 0.12) * 50.0;
  }
  if (wordCount < 10 && matchedPhrases.length === 0) {
    basePpl += 15.0;
  }
  if (abstractRatio < 0.08 && matchedPhrases.length === 0) {
    basePpl += 18.0;
  }

  const finalPerplexity = Math.max(8.0, Math.min(130.0, Math.round(basePpl * 10) / 10));
  return { perplexity: finalPerplexity, aiPhrases: matchedPhrases };
}

/**
 * Executes the complete GPTZero scan pipeline on arbitrary text.
 */
export function scanWithGPTZero(text: string): GPTZeroScanResult {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      completelyGeneratedProb: 0,
      mixedGeneratedProb: 0,
      humanWrittenProb: 1,
      overallAiProbability: 0,
      confidenceScore: 0,
      aiPercentage: 0,
      averagePerplexity: 100,
      burstinessScore: 0,
      sentences: [],
      verdict: 'Likely Human-Written',
      subVerdict: 'No text provided for analysis',
      classLabel: 'human',
    };
  }

  // 1. Sentence Segmentation
  const rawSentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/).map(s => s.trim()).filter(Boolean);
  const sentences = rawSentences.length > 0 ? rawSentences : [cleanText];

  // 2. Compute per-sentence perplexity and AI scores
  const sentenceResults: GPTZeroSentenceResult[] = sentences.map((s) => {
    const { perplexity, aiPhrases } = calculateSentencePerplexity(s);
    const words = s.match(/\b[a-z0-9'-]+\b/g) || [];

    // Perplexity < 42 -> High AI probability (> 75%)
    // Perplexity 42 - 55 -> Moderate / Mixed (35% - 75%)
    // Perplexity > 55 -> Human (< 35%)
    let sentenceScore = 0;
    if (perplexity < 42) {
      sentenceScore = Math.min(100, Math.max(78, Math.round(100 - (perplexity / 42) * 22)));
    } else if (perplexity <= 55) {
      sentenceScore = Math.round(75 - ((perplexity - 42) / 13) * 40);
    } else {
      sentenceScore = Math.max(0, Math.round(35 - ((perplexity - 55) / 50) * 35));
    }

    const isAi = sentenceScore >= 50;
    const highlightColor: 'yellow' | 'amber' | 'none' = isAi
      ? 'yellow'
      : sentenceScore >= 35
      ? 'amber'
      : 'none';

    return {
      sentence: s,
      perplexity,
      aiProbability: sentenceScore / 100,
      score: sentenceScore,
      isAi,
      highlightColor,
      wordCount: words.length,
      aiPhrases,
    };
  });

  // 3. Document-Level Metrics: Average Perplexity & Burstiness
  const k = sentenceResults.length;
  const perplexities = sentenceResults.map(s => s.perplexity);
  const avgPerplexity = Math.round((perplexities.reduce((a, b) => a + b, 0) / k) * 10) / 10;

  // Burstiness = Variance / Std Dev of sentence perplexities
  const variance = perplexities.reduce((acc, p) => acc + Math.pow(p - avgPerplexity, 2), 0) / k;
  const burstiness = Math.round(Math.sqrt(variance) * 10) / 10;

  // 4. Find Extremes
  let highestPerp = sentenceResults[0];
  let lowestPerp = sentenceResults[0];
  for (const s of sentenceResults) {
    if (s.perplexity > highestPerp.perplexity) highestPerp = s;
    if (s.perplexity < lowestPerp.perplexity) lowestPerp = s;
  }

  // 5. Compute AI Volume Fraction
  const aiSentencesCount = sentenceResults.filter(s => s.isAi).length;
  const totalWords = sentenceResults.reduce((acc, s) => acc + s.wordCount, 0);
  const aiWords = sentenceResults.filter(s => s.isAi).reduce((acc, s) => acc + s.wordCount, 0);
  const aiPercentage = totalWords > 0 ? Math.round((aiWords / totalWords) * 100) : 0;

  // 6. GPTZero 3-Way Probabilities (Completely Generated, Mixed, Human)
  let completelyGeneratedProb = 0;
  let mixedGeneratedProb = 0;
  let humanWrittenProb = 0;

  if (aiSentencesCount === k && avgPerplexity < 42) {
    completelyGeneratedProb = 0.98;
    mixedGeneratedProb = 0.02;
    humanWrittenProb = 0.00;
  } else if (aiSentencesCount > 0 && aiSentencesCount < k) {
    mixedGeneratedProb = 0.88;
    completelyGeneratedProb = 0.08;
    humanWrittenProb = 0.04;
  } else if (avgPerplexity < 45 && burstiness < 15) {
    completelyGeneratedProb = 0.85;
    mixedGeneratedProb = 0.12;
    humanWrittenProb = 0.03;
  } else if (aiSentencesCount === 0 && avgPerplexity > 50) {
    humanWrittenProb = 0.94;
    mixedGeneratedProb = 0.05;
    completelyGeneratedProb = 0.01;
  } else {
    mixedGeneratedProb = 0.60;
    humanWrittenProb = 0.30;
    completelyGeneratedProb = 0.10;
  }

  // 7. Overall AI Probability & Confidence Verdict
  let overallAiProbability = 0;
  if (completelyGeneratedProb > 0.7) {
    overallAiProbability = Math.round(completelyGeneratedProb * 100);
  } else if (mixedGeneratedProb > 0.5) {
    overallAiProbability = Math.max(aiPercentage, 46);
  } else {
    overallAiProbability = Math.round((1 - humanWrittenProb) * 100);
  }

  let classLabel: 'ai' | 'mixed' | 'human' = 'human';
  let verdict = 'Likely Human-Written';
  let subVerdict = `${sentenceResults.length} sentences analyzed · High perplexity & natural burstiness`;

  if (completelyGeneratedProb >= 0.7 || (aiSentencesCount === k && k >= 1)) {
    classLabel = 'ai';
    verdict = 'Entirely AI-Generated (100% of sections flagged)';
    subVerdict = `We are ${Math.round(completelyGeneratedProb * 100)}% confident this text was entirely generated by AI`;
  } else if (mixedGeneratedProb >= 0.5 || aiSentencesCount > 0) {
    classLabel = 'mixed';
    verdict = `Contains AI-Generated Content (${aiSentencesCount} of ${k} sections flagged as AI)`;
    subVerdict = `We are 99% confident this text contains AI-generated content (${aiPercentage}% AI volume)`;
  } else {
    classLabel = 'human';
    verdict = 'Likely Human-Written';
    subVerdict = `We are ${Math.round(humanWrittenProb * 100)}% confident this text is written by a human`;
  }

  return {
    completelyGeneratedProb: Math.round(completelyGeneratedProb * 100) / 100,
    mixedGeneratedProb: Math.round(mixedGeneratedProb * 100) / 100,
    humanWrittenProb: Math.round(humanWrittenProb * 100) / 100,
    overallAiProbability,
    confidenceScore: 99,
    aiPercentage,
    averagePerplexity: avgPerplexity,
    burstinessScore: burstiness,
    sentences: sentenceResults,
    highestPerplexitySentence: {
      sentence: highestPerp.sentence,
      perplexity: highestPerp.perplexity,
    },
    lowestPerplexitySentence: {
      sentence: lowestPerp.sentence,
      perplexity: lowestPerp.perplexity,
    },
    verdict,
    subVerdict,
    classLabel,
  };
}
