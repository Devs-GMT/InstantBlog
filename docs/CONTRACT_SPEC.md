# InstantBlog.sol — Smart Contract Spec

Solidity `^0.8.20` · no tokens, payments, owner or admin · immutable once deployed.

---

## 1. Purpose

The contract stores a public, timestamped **proof** that a wallet stamped an article with a given SHA-256 fingerprint. Anyone can look a proof up by id, by hash or by author.

> A proof shows **who stamped this exact text and when**. It does not show that they wrote every word without AI.

---

## 2. Storage

```solidity
struct Proof {
    address author;     // msg.sender
    bytes32 textHash;   // SHA-256 of canonicalText(article)  (ARCHITECTURE §5)
    string  title;      // ≤ 160 bytes UTF-8
    uint32  words;      // > 0
    uint8   tone;       // 0..5  (§3)
    uint8   sources;    // 0..5
    uint64  at;         // block.timestamp
}
Proof[] private _proofs;                       // id = index + 1
mapping(bytes32 => uint256[]) private _byHash;
mapping(address => uint256[]) private _byAuthor;
```

## 3. Enums

| `tone` | Label |
|---|---|
| 0 | Friendly |
| 1 | Professional |
| 2 | Witty |
| 3 | Inspiring |
| 4 | Academic |
| 5 | Casual |

## 4. Interface

| Function | Type | Notes |
|---|---|---|
| `stamp(bytes32 textHash, string title, uint32 words, uint8 tone, uint8 sources) → uint256 id` | write | Reverts on: zero hash, empty title, title > 160 bytes, words == 0, tone > 5, sources > 5. Emits `Stamped`. |
| `getProof(uint256 id) → Proof` | view | Reverts with `UnknownProof` if `id == 0 \|\| id > total()` |
| `proofsForHash(bytes32) → uint256[]` | view | Ids in stamp order (earliest first) |
| `proofsOf(address) → uint256[]` | view | Ids in stamp order |
| `total() → uint256` | view | Number of proofs = highest id |
| `event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title)` | event | |

Custom errors: `EmptyHash()`, `EmptyTitle()`, `TitleTooLong()`, `ZeroWords()`, `BadTone()`, `TooManySources()`, `UnknownProof()`.

---

## 5. Reference implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InstantBlog — proof of authorship for AI-assisted articles
/// @notice Stores a SHA-256 fingerprint of an article with a timestamp. Never the text.
/// @dev A proof shows who stamped this exact text and when — not that they wrote every word without AI.
contract InstantBlog {
    struct Proof {
        address author;
        bytes32 textHash;
        string title;
        uint32 words;
        uint8 tone;
        uint8 sources;
        uint64 at;
    }

    uint256 public constant MAX_TITLE_BYTES = 160;
    uint8 public constant MAX_TONE = 5;
    uint8 public constant MAX_SOURCES = 5;

    Proof[] private _proofs;
    mapping(bytes32 => uint256[]) private _byHash;
    mapping(address => uint256[]) private _byAuthor;

    event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title);

    error EmptyHash();
    error EmptyTitle();
    error TitleTooLong();
    error ZeroWords();
    error BadTone();
    error TooManySources();
    error UnknownProof();

    function stamp(
        bytes32 textHash,
        string calldata title,
        uint32 words,
        uint8 tone,
        uint8 sources
    ) external returns (uint256 id) {
        if (textHash == bytes32(0)) revert EmptyHash();
        uint256 len = bytes(title).length;
        if (len == 0) revert EmptyTitle();
        if (len > MAX_TITLE_BYTES) revert TitleTooLong();
        if (words == 0) revert ZeroWords();
        if (tone > MAX_TONE) revert BadTone();
        if (sources > MAX_SOURCES) revert TooManySources();

        _proofs.push(Proof(msg.sender, textHash, title, words, tone, sources, uint64(block.timestamp)));
        id = _proofs.length; // 1-based

        _byHash[textHash].push(id);
        _byAuthor[msg.sender].push(id);

        emit Stamped(id, msg.sender, textHash, title);
    }

    function getProof(uint256 id) external view returns (Proof memory) {
        if (id == 0 || id > _proofs.length) revert UnknownProof();
        return _proofs[id - 1];
    }

    function proofsForHash(bytes32 textHash) external view returns (uint256[] memory) {
        return _byHash[textHash];
    }

    function proofsOf(address author) external view returns (uint256[] memory) {
        return _byAuthor[author];
    }

    function total() external view returns (uint256) {
        return _proofs.length;
    }
}
```

---

## 6. ABI fragment for ethers v6 (human-readable)

```js
export const ABI = [
  "function stamp(bytes32 textHash, string title, uint32 words, uint8 tone, uint8 sources) returns (uint256 id)",
  "function getProof(uint256 id) view returns (tuple(address author, bytes32 textHash, string title, uint32 words, uint8 tone, uint8 sources, uint64 at))",
  "function proofsForHash(bytes32 textHash) view returns (uint256[])",
  "function proofsOf(address author) view returns (uint256[])",
  "function total() view returns (uint256)",
  "event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title)",
  "error EmptyHash()", "error EmptyTitle()", "error TitleTooLong()", "error ZeroWords()",
  "error BadTone()", "error TooManySources()", "error UnknownProof()",
];
```

### Error → UI message

| Error | Message |
|---|---|
| `TitleTooLong` | "Title is too long to stamp (max 160 bytes). Shorten it and try again." |
| `EmptyTitle` / `EmptyHash` / `ZeroWords` | "Your article looks empty. Add some text first." |
| `BadTone` / `TooManySources` | "Something's off with the brief. Reload and try again." |
| `ACTION_REJECTED` (ethers code) | "Transaction cancelled." |
| `INSUFFICIENT_FUNDS` | "You need a little BOT for gas." |
| other | "Stamp failed. Try again." (log `err.shortMessage` to the console) |

### Client-side title cap

The title is UTF-8, so cut it by **bytes**, not characters: `while (new TextEncoder().encode(t).length > 160) t = t.slice(0, -1);`. Show the truncated title in the confirm dialog.

---

## 7. Remix deployment settings

| Setting | Value |
|---|---|
| Compiler | 0.8.24 (any ≥ 0.8.20) |
| **EVM version** | **`paris`** — safe default in case BOT Chain doesn't support Shanghai's `PUSH0` yet. Use `shanghai`/`cancun` only after confirming support. |
| Optimizer | On, 200 runs |
| Environment | Injected Provider — MetaMask |
| Verify | On scan.botchain.ai → *Verify & Publish*, single file, same compiler, EVM version and optimizer settings, MIT licence |

## 8. Manual test checklist (testnet 968)

1. `stamp(0x…01, "Hello", 100, 0, 0)` → id 1. `total() == 1`
2. Same hash again → id 2. `proofsForHash` → `[1, 2]`
3. `getProof(0)` and `getProof(3)` revert `UnknownProof`
4. Title of 161 bytes → `TitleTooLong`. Title of 160 bytes passes (also try one with multi-byte emoji)
5. `words = 0` → `ZeroWords`. `tone = 6` → `BadTone`. `sources = 6` → `TooManySources`. Zero hash → `EmptyHash`
6. `proofsOf(you)` → `[1, 2]`. The event shows on scan.bohr.life
7. Gas: record the cost of a typical stamp for the README. Measured on a local Hardhat chain (0.8.24, paris, optimizer 200): **~226k gas** for the first stamp with a 5-char title, **~289k gas** with a 160-byte title (first writes to fresh storage slots dominate).

> **ethers v6 gotcha:** `getProof()` returns a `Result`, and `result.at` is `Array.prototype.at`, not the `at` field. Read the tuple by index (`r[6]` for the timestamp) — see `web/lib/chain.ts`.

## 9. Gas and size notes

- The title is stored as a string, so cost grows with its length. That's why it's capped at 160 bytes.
- Uses no loops over unbounded arrays in writes. Views return arrays, which is fine for MVP volumes.
- No upgradeability. A v2 would be a new address, and `config.js` can list both.
