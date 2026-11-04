import { test } from "node:test";
import assert from "node:assert/strict";
import { readAlbum, earnSticker } from "../site/shared/stickers.js";

test("stickers survive storage roundtrip and track game, difficulty and completion independently", () => {
  const empty = readAlbum({ getItem: () => null });
  let album = earnSticker(empty, "shape", "hard");
  album = earnSticker(album, "shape", "easy");
  album = earnSticker(album, "shape", "hard", true);
  album = earnSticker(album, "count", "easy");
  const loaded = readAlbum({ getItem: () => JSON.stringify(album) });
  assert.deepEqual(loaded.games.shape, { easy: 1, hard: 1, completed: 1 });
  assert.deepEqual(loaded.games.count, { easy: 1, hard: 0, completed: 0 });
  assert.deepEqual(empty.games, {});
});

test("unavailable, malformed and invalid stored data are safe", () => {
  assert.deepEqual(readAlbum(undefined).games, {});
  assert.deepEqual(readAlbum({ getItem: () => "invalid" }).games, {});
  const album = readAlbum({ getItem: () => JSON.stringify({ version: 1, games: { shape: { easy: -1, hard: "5", completed: 2 }, unknown: { easy: 99 } } }) });
  assert.deepEqual(album.games, { shape: { easy: 0, hard: 0, completed: 2 } });
  assert.deepEqual(earnSticker(album, "unknown", "easy"), album);
});
