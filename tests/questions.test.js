import { test } from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, makeDeck, shuffle } from "../site/shared/questions.js";
import { pictureIds, shapeIds } from "../site/shared/catalog.js";
// Reproducible variety exercises positions, counts and both difficulty levels.
let seed = 42;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
}
for (const difficulty of ["easy", "hard"]) {
  test(`${difficulty}: every question has exactly one valid answer`, () => {
    const counts = new Set();
    const answerPositions = new Set();
    for (let trial = 0; trial < 300; trial++) {
      for (const id of ["same", "count", "shape", "size", "pattern"]) {
        const question = makeQuestion(id, difficulty, random);
        assert.equal(
          question.options.filter((item) => item === question.answer).length,
          1,
        );
        assert.equal(new Set(question.options).size, question.options.length);
        answerPositions.add(question.options.indexOf(question.answer));
        if (id === "same") {
          assert.equal(question.options.length, difficulty === "easy" ? 3 : 5);
          question.options.forEach((item) =>
            assert.ok(pictureIds.includes(item)),
          );
        }
        if (id === "count") {
          assert.ok(
            question.answer >= (difficulty === "easy" ? 2 : 6) &&
              question.answer <= (difficulty === "easy" ? 6 : 10),
          );
          assert.equal(question.options.length, difficulty === "easy" ? 4 : 5);
          counts.add(question.answer);
        }
        if (id === "shape") {
          assert.equal(question.options.length, difficulty === "easy" ? 3 : 4);
          question.options.forEach((item) =>
            assert.ok(shapeIds.includes(item)),
          );
        }
        if (id === "size") {
          assert.equal(question.options.length, 3);
          if (difficulty === "easy") assert.equal(question.answer, "big");
          else assert.ok(["small", "medium"].includes(question.answer));
        }
        if (id === "pattern") {
          const sequence = question.sequence;
          const motifLength = difficulty === "easy" ? 3 : 4;
          assert.equal(sequence.length, difficulty === "easy" ? 5 : 7);
          assert.notEqual(sequence[0], sequence[1]);
          sequence.forEach((item, index) =>
            assert.equal(item, sequence[index % motifLength]),
          );
          assert.equal(
            question.answer,
            sequence[sequence.length % motifLength],
          );
          assert.equal(question.options.length, motifLength);
        }
      }
    }
    assert.equal(counts.size, 5);
    assert.ok(answerPositions.size >= 2);
  });
  test(`${difficulty}: memory deck contains exactly two of each picture`, () => {
    for (let trial = 0; trial < 100; trial++) {
      const deck = makeDeck(difficulty, random);
      assert.equal(deck.length, difficulty === "easy" ? 6 : 8);
      for (const id of new Set(deck)) {
        assert.ok(pictureIds.includes(id));
        assert.equal(deck.filter((value) => value === id).length, 2);
      }
    }
  });
}
test("shuffle retains the source and all entries", () => {
  const source = [1, 2, 3, 4];
  assert.deepEqual([...shuffle(source, random)].sort(), source);
  assert.deepEqual(source, [1, 2, 3, 4]);
});
