export const playGuides = {
  same: ["みほんを よくみよう", "おなじ えを さがそう", "みつけたら おしてね"],
  count: ["おねがいの かずを みよう", "くだものを かごに はこぼう", "かぞえて「できた！」"],
  shape: ["かたちを つかもう", "おなじ おうちに はこぼう", "ぴったり あわせよう"],
  size: ["ならべる じゅんを みよう", "えを おきばに はこぼう", "ならべたら「できた！」"],
  pattern: ["えの じゅんばんを みよう", "くりかえしを みつけよう", "つぎの えを おしてね"],
  memory: ["えの ばしょを おぼえよう", "カードを ふたつ めくろう", "おなじ ペアを あつめよう"],
  trace: ["1の ほしから はじめよう", "すうじの じゅんに なぞろう", "さいごの ほしまで つなごう"],
  puzzle: ["みほんの えを みよう", "かけらを わくに はこぼう", "えが できたら「できた！」"],
  rhythm: ["おてほんを きいてみよう", "ひかる じゅんを おぼえよう", "おなじ じゅんに たたこう"],
};
export const playGroups = {
  all: { label: "ぜんぶ", ids: null },
  free: { label: "じゆうに あそぶ", ids: ["bubbles", "fireworks", "paint"] },
  move: { label: "はこぶ・つくる", ids: ["count", "shape", "size", "puzzle"] },
  think: { label: "みる・かんがえる", ids: ["same", "pattern", "memory"] },
  sense: { label: "なぞる・かなでる", ids: ["trace", "rhythm"] },
};
