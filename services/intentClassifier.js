const intents = require("../data/intents.json");

const tokenizer = new Intl.Segmenter("en", { granularity: "word" });
const model = {
  labels: new Map(),
  vocabulary: new Set(),
  totalDocuments: 0
};

function tokenize(text) {
  return [...tokenizer.segment(String(text).toLowerCase())]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment)
    .filter((word) => word.length > 1);
}

function addDocument(label, text) {
  if (!model.labels.has(label)) {
    model.labels.set(label, {
      documents: 0,
      wordCounts: new Map(),
      totalWords: 0
    });
  }

  const labelData = model.labels.get(label);
  labelData.documents += 1;
  model.totalDocuments += 1;

  for (const token of tokenize(text)) {
    model.vocabulary.add(token);
    labelData.wordCounts.set(token, (labelData.wordCounts.get(token) || 0) + 1);
    labelData.totalWords += 1;
  }
}

function train() {
  for (const item of intents) {
    for (const example of item.examples) {
      addDocument(item.intent, example);
    }
  }
}

function classifyIntent(text) {
  const tokens = tokenize(text);
  const vocabularySize = Math.max(model.vocabulary.size, 1);
  const rawScores = [];

  for (const [label, labelData] of model.labels.entries()) {
    const prior = Math.log(labelData.documents / model.totalDocuments);
    const denominator = labelData.totalWords + vocabularySize;
    const logScore = tokens.reduce((score, token) => {
      const count = labelData.wordCounts.get(token) || 0;
      return score + Math.log((count + 1) / denominator);
    }, prior);

    rawScores.push({ intent: label, logScore });
  }

  const maxLogScore = Math.max(...rawScores.map((item) => item.logScore));
  const scores = rawScores
    .map((item) => ({
      intent: item.intent,
      value: Math.exp(item.logScore - maxLogScore)
    }))
    .sort((a, b) => b.value - a.value);

  const total = scores.reduce((sum, item) => sum + item.value, 0) || 1;
  const normalized = scores.map((item) => ({
    intent: item.intent,
    confidence: Number((item.value / total).toFixed(4))
  }));

  const top = normalized[0] || { intent: "unknown", confidence: 0 };
  return {
    intent: top.confidence < 0.2 ? "unknown" : top.intent,
    confidence: top.confidence,
    scores: normalized.slice(0, 5),
    tokens
  };
}

function getTrainingSummary() {
  return {
    intents: model.labels.size,
    examples: model.totalDocuments,
    vocabulary: model.vocabulary.size
  };
}

train();

module.exports = {
  classifyIntent,
  getTrainingSummary
};