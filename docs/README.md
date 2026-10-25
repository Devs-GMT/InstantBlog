# InstantBlog — Documentation Index

| Doc | Use it for |
|---|---|
| [PRD.md](PRD.md) | **What** we're building: requirements (with IDs), flows, states, decisions |
| [BUILD_PLAN.md](BUILD_PLAN.md) | **When**: the 5-hour time-boxed plan, checkpoints, cut lines, risks |
| [ARCHITECTURE.md](ARCHITECTURE.md) | **How**: system diagram, repo layout, libraries, data model, fingerprint algorithm, config |
| [CONTRACT_SPEC.md](CONTRACT_SPEC.md) | Solidity contract, ABI, error messages, compiler settings, test checklist |
| [WORKER_API.md](WORKER_API.md) | Worker endpoints, SSE protocol, SSRF guard, rate limits, LLM config |
| [AI_PROMPTS.md](AI_PROMPTS.md) | System prompts and templates for drafting and each edit action |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Tokens, type, components, writer layout, home sections, footer |
| [CONTENT_COPY.md](CONTENT_COPY.md) | Every UI string: home, writer, stamp, verify, errors, FAQ |
| [TEST_PLAN.md](TEST_PLAN.md) | Acceptance, test cases, fingerprint test vectors, smoke test |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Runbook: Foundry → Worker → Vercel → go-live |
| [SUBMISSION.md](SUBMISSION.md) | Checklist, demo script, X post, description |

Working with Claude Code? The root [CLAUDE.md](../CLAUDE.md) holds the non-negotiable rules and commands.

Read order for a builder: PRD §3 → BUILD_PLAN → ARCHITECTURE → whichever spec the current phase needs.
