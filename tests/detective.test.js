import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMystery } from "../site/shared/detective.js";
test("each mystery has exactly one house matching every clue", () => {
  for(const hard of [false,true]) for(let i=0;i<200;i++) {
    const {options,answer,clueCount}=makeMystery(hard);
    const target=options[answer];
    assert.ok(target);
    assert.equal(options.length,hard?8:4);
    assert.equal(clueCount,hard?3:2);
    assert.equal(options.filter(x=>x.color===target.color&&x.shape===target.shape&&(!hard||x.ribbon===target.ribbon)).length,1);
  }
});
