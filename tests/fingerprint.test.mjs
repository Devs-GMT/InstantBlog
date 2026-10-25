// Locks fingerprint v1 (web/lib/fingerprint.ts; marked resolves from web/node_modules) (docs/TEST_PLAN.md §4). If this fails, fix the code — not the vectors.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMParser } from "linkedom";

globalThis.DOMParser = DOMParser;
const { canonicalText, fingerprint, wordCount } = await import("../web/lib/fingerprint.ts");

const V1 = `# Hello world

Intro with **bold** and a [link](https://x.y) [1].

## Point one

- alpha
- beta

## Sources

1. [1] Example — https://example.com
`;
const V2 = `Hello world
Intro with bold and a link [1].
Point one
• alpha
• beta
Sources
1. [1] Example — https://example.com`;
const V3 = "It\u2019s   fine.\n\n*Written with AI assistance*";
const V4 = "It's fine!";
const H1 = "0x8e9be5f800ca70a1664c29e22930dbb0a72a634714ca3d04ec7ed568bdb91424";

test("V1 markdown canonical + hash + words", async () => {
  assert.equal(canonicalText(V1), "Hello world Intro with bold and a link [1]. Point one alpha beta Sources [1] Example — https://example.com");
  assert.equal(await fingerprint(V1), H1);
  assert.equal(wordCount(V1), 12);
});
test("V2 plain-text copy matches V1", async () => assert.equal(await fingerprint(V2), H1));
test("V3 smart quote, spaces, AI line", async () => {
  assert.equal(canonicalText(V3), "It's fine.");
  assert.equal(await fingerprint(V3), "0x249133e0671a807b46cee298b962b70939bae17be829b6483164d94285b779f6");
});
test("V4 one char changes the hash", async () =>
  assert.equal(await fingerprint(V4), "0xee0a8b602db0a599b826ea606d7604e72a8aa6091741212428516e75e90e7a37"));
test("titles comment and CRLF ignored", async () =>
  assert.equal(await fingerprint(V1.replace("# Hello world\n", "# Hello world\n<!-- titles: a | b | c -->\n").replace(/\n/g, "\r\n")), H1));
