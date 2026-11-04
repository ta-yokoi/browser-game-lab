import { pictureIds, shapeIds } from "./catalog.js?v=6";
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function makeQuestion(id, difficulty = "easy", random = Math.random) {
  const hard = difficulty === "hard";
  const pictures = shuffle(pictureIds, random);
  if (id === "same") {
    const options = pictures.slice(0, hard ? 5 : 3);
    return { answer: options[0], options: shuffle(options, random) };
  }
  if (id === "count") {
    const min = hard ? 6 : 2;
    const max = hard ? 10 : 6;
    const answer = min + Math.floor(random() * (max - min + 1));
    const candidates = Array.from(
      { length: max - min + 1 },
      (_, index) => min + index,
    );
    const distractors = shuffle(
      candidates.filter((value) => value !== answer),
      random,
    ).slice(0, hard ? 4 : 3);
    return {
      answer,
      picture: pictures[0],
      options: shuffle([answer, ...distractors], random),
    };
  }
  if (id === "shape") {
    const options = shuffle(shapeIds, random).slice(0, hard ? 4 : 3);
    return { answer: options[0], options: shuffle(options, random) };
  }
  if (id === "size") {
    return {
      answer: hard ? shuffle(["small", "medium"], random)[0] : "big",
      picture: pictures[0],
      options: shuffle(["big", "medium", "small"], random),
    };
  }
  if (id === "pattern") {
    const motif = pictures.slice(0, hard ? 4 : 3);
    const length = hard ? 7 : 5;
    const sequence = Array.from({ length }, (_, i) => motif[i % motif.length]);
    return {
      answer: motif[sequence.length % motif.length],
      sequence,
      options: shuffle(motif, random),
    };
  }
  throw new Error(`Unknown question type: ${id}`);
}
export function makeDeck(difficulty = "easy", random = Math.random) {
  const selected = shuffle(pictureIds, random).slice(
    0,
    difficulty === "hard" ? 4 : 3,
  );
  return shuffle([...selected, ...selected], random);
}
