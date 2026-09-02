import assert from "node:assert/strict";
import test from "node:test";
import { renderNowSection, replaceNowSection } from "./update-now.mjs";

test("renders the three most recently pushed projects", () => {
  const rendered = renderNowSection([
    { label: "Older", url: "https://example.test/older", pushedAt: "2026-01-01T00:00:00Z", release: null },
    { label: "Newest", url: "https://example.test/newest", pushedAt: "2026-04-04T00:00:00Z", release: "v2.0.0" },
    { label: "Middle", url: "https://example.test/middle", pushedAt: "2026-03-03T00:00:00Z", release: null },
    { label: "Third", url: "https://example.test/third", pushedAt: "2026-02-02T00:00:00Z", release: null },
  ]);

  assert.equal(
    rendered,
    "[**Newest**](https://example.test/newest) `v2.0.0` · [**Middle**](https://example.test/middle) `updated Mar 3` · [**Third**](https://example.test/third) `updated Feb 2`",
  );
});

test("replaces only the generated README region", () => {
  const input = "before\n<!-- profile-now:start -->\nold\n<!-- profile-now:end -->\nafter\n";
  assert.equal(
    replaceNowSection(input, "new"),
    "before\n<!-- profile-now:start -->\nnew\n<!-- profile-now:end -->\nafter\n",
  );
});

test("fails when markers are absent", () => {
  assert.throws(
    () => replaceNowSection("no markers", "new"),
    /missing a valid profile-now marker pair/,
  );
});
