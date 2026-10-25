// The sample article shown on the landing page. It is stamped on BOT Chain testnet as a real proof,
// so its Markdown must stay byte-for-byte identical (the fingerprint depends on it).
// The one fact ([1]) comes from the Wikipedia "Hackathon" article the Worker read in testing.

export const SAMPLE_MD = `# Why small dApps win hackathons

A hackathon goes by many names: hack day, hackfest, codefest [1]. Whatever you call it, you get one weekend to show something that works.

## Scope is a feature

Pick the one flow you can demo in under a minute and build only that. Everything else can wait for version two.

## Demo beats docs

Show the result first, then explain how it works. A short live demo answers most questions before anyone asks them.

## Sources

1. [1] Hackathon — https://en.wikipedia.org/wiki/Hackathon
`;

/** Real proof: stamp tx 0xd6480c8bdebb515f93b32d9b60f1b994e834717c60f9b288c171bbd74455b5ed on BOT Chain testnet (968). */
export const SAMPLE_PROOF = {
  network: "testnet" as const,
  id: 2,
  hash: "0x9a28482d821a4e422a6866df4c0829d5d9bc8d6ad3c5097116ee9e52ca6f8c19",
  words: 77,
  tone: "Friendly",
  sources: 1,
  date: "Oct 25, 2026",
  author: "0xea87E45eBd0D6BcA2BFabAc3739D47aD12640023",
};
