import { pictureIds, shapeIds } from "./catalog.js";
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
    const options = pictures.slice(0, hard ? 4 : 2);
    return { answer: options[0], options: shuffle(options, random) };
  }
  if (id === "count") {
    const max = hard ? 5 : 3;
    const answer = 1 + Math.floor(random() * max);
    return {
      answer,
      picture: pictures[0],
      options: shuffle(
        Array.from({ length: max }, (_, i) => i + 1),
        random,
      ),
    };
  }
  if (id === "shape") {
    const options = shuffle(shapeIds, random).slice(0, hard ? 3 : 2);
    return { answer: options[0], options: shuffle(options, random) };
  }
  if (id === "size") {
    return {
      answer: hard ? "small" : "big",
      picture: pictures[0],
      options: shuffle(["big", "small"], random),
    };
  }
  if (id === "pattern") {
    const pair = pictures.slice(0, 2);
    const sequence = Array.from(
      { length: hard ? 5 : 4 },
      (_, i) => pair[i % 2],
    );
    return {
      answer: pair[sequence.length % 2],
      sequence,
      options: shuffle(pair, random),
    };
  }
  throw new Error(`Unknown question type: ${id}`);
}
export function makeDeck(difficulty = "easy", random = Math.random) {
  const selected = shuffle(pictureIds, random).slice(
    0,
    difficulty === "hard" ? 3 : 2,
  );
  return shuffle([...selected, ...selected], random);
}
