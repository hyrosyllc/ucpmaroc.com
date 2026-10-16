// Run with: node --test ./src/lib/theme-runtime/theme-runtime.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadBundle, resolveRelative } from "./loader.ts";
import { normalizeSchema, schemaDefaults } from "./schema.ts";
import { diffFileSets, diffLines } from "./diff.ts";

const external = (spec: string) => {
  if (spec === "react") return { createElement: () => "el" };
  throw new Error(`blocked ${spec}`);
};

test("resolves relative paths inside the bundle", () => {
  assert.equal(resolveRelative("Hero", "./SectionTitle"), "SectionTitle");
  assert.equal(resolveRelative("sections/Hero", "../shared/Title.tsx"), "shared/Title");
  assert.equal(resolveRelative("sections/Hero", "./Title"), "sections/Title");
});

test("loads components, relative imports and schemas", () => {
  const bundle = {
    "Title.js": `exports.default = function Title(){ return "title"; };`,
    "Hero.js": `
      var T = require("./Title").default;
      exports.schema = [{ id: "variant", type: "select" }];
      exports.default = function Hero(){ return T(); };`,
  };
  const out = loadBundle(bundle, external, {});
  assert.deepEqual(Object.keys(out.components).sort(), ["Hero", "Title"]);
  assert.equal(out.components.Hero(), "title");
  assert.deepEqual(out.schemas.Hero, [{ id: "variant", type: "select" }]);
  assert.deepEqual(out.errors, {});
});

test("a broken file is reported without blocking the others", () => {
  const out = loadBundle(
    { "Good.js": `exports.default = function Good(){};`, "Bad.js": `require("fs");` },
    external,
    {}
  );
  assert.ok(out.components.Good);
  assert.match(out.errors.Bad, /blocked fs/);
});

test("missing relative module is a clear error", () => {
  const out = loadBundle({ "A.js": `require("./Nope");` }, external, {});
  assert.match(out.errors.A, /Cannot find module "Nope"/);
});

test("circular imports do not hang", () => {
  const out = loadBundle(
    { "A.js": `require("./B"); exports.default = function A(){};`, "B.js": `require("./A"); exports.default = function B(){};` },
    external,
    {}
  );
  assert.deepEqual(Object.keys(out.components).sort(), ["A", "B"]);
});

test("normalises both schema formats", () => {
  const legacy = normalizeSchema({ title: { type: "string", label: "Title", default: "Hi" }, on: { type: "toggle", default: true } });
  assert.deepEqual(legacy.map((f) => [f.id, f.type, f.defaultValue]), [["title", "text", "Hi"], ["on", "toggle", true]]);
  const modern = normalizeSchema([{ id: "variant", type: "select", label: "V", defaultValue: "a", options: ["a", "b"] }]);
  assert.equal(modern[0].type, "select");
  assert.deepEqual(schemaDefaults([...legacy, ...modern]), { title: "Hi", on: true, variant: "a" });
  assert.deepEqual(normalizeSchema(undefined), []);
});

test("diffLines marks added and removed lines", () => {
  const d = diffLines("a\nb\nc", "a\nx\nc\nd");
  assert.deepEqual(d.filter((l) => l.type !== "same"), [
    { type: "remove", text: "b" },
    { type: "add", text: "x" },
    { type: "add", text: "d" },
  ]);
});

test("diffFileSets classifies files", () => {
  assert.deepEqual(diffFileSets({ A: "1", B: "2", C: "3" }, { A: "1", B: "9", D: "4" }), {
    A: "unchanged", B: "modified", C: "removed", D: "added",
  });
});
